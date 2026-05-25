"""
Router de administración de usuarios.
Usa la SUPABASE_SERVICE_ROLE_KEY para operaciones privilegiadas
sobre auth.users mediante la Auth Admin API de Supabase.
"""
import os
import traceback
# pyrefly: ignore [missing-import]
import httpx
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/users", tags=["Usuarios"])

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")

# ─────────────────────────────────────────────────────────────────────────────
# IMPORTANTE: los headers se construyen en cada función (lazy) para que
# recarguen la clave correctamente si el .env cambia sin reiniciar.
# ─────────────────────────────────────────────────────────────────────────────
def _get_service_key() -> str:
    """Lee la service_role key en tiempo de petición (no en importación)."""
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY", "")
    if not key or key == "PEGA_AQUI_TU_SERVICE_ROLE_KEY":
        raise HTTPException(
            status_code=500,
            detail="SUPABASE_SERVICE_ROLE_KEY no está configurada en el backend."
        )
    return key

def _admin_headers(key: str) -> dict:
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }

def _postgrest_headers(key: str) -> dict:
    return {
        **_admin_headers(key),
        "Prefer": "return=representation",
    }


# ── Schemas ───────────────────────────────────────────────────────────────────

class CreateUserRequest(BaseModel):
    email: str
    password: str
    role: str = "user"

class UpdatePasswordRequest(BaseModel):
    password: str

class UpdateRoleRequest(BaseModel):
    role: str


# ── Helpers ───────────────────────────────────────────────────────────────────

def _extract_supabase_error(resp: httpx.Response) -> str:
    """Extrae el mensaje de error legible de una respuesta de Supabase."""
    try:
        body = resp.json()
        return (
            body.get("msg")
            or body.get("message")
            or body.get("error_description")
            or body.get("error")
            or f"HTTP {resp.status_code}"
        )
    except Exception:
        return f"HTTP {resp.status_code}: {resp.text[:200]}"


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("")
async def list_users():
    """
    Lista todos los perfiles desde la tabla `profiles`.
    Requiere SUPABASE_SERVICE_ROLE_KEY con acceso a la tabla.
    """
    try:
        key = _get_service_key()
        url = f"{SUPABASE_URL}/rest/v1/profiles"
        params = {"select": "*", "order": "email.asc"}

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, headers=_postgrest_headers(key), params=params)

        if resp.status_code >= 400:
            msg = _extract_supabase_error(resp)
            print(f"[usuarios] list_users Supabase error {resp.status_code}: {msg}")
            raise HTTPException(status_code=resp.status_code, detail=msg)

        return resp.json()

    except HTTPException:
        raise
    except Exception as e:
        print("[usuarios] list_users error inesperado:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def create_user(body: CreateUserRequest):
    """
    Crea un usuario en auth.users usando la Auth Admin API,
    luego actualiza el rol en `profiles` si corresponde.
    """
    try:
        key = _get_service_key()
        auth_url = f"{SUPABASE_URL}/auth/v1/admin/users"
        payload = {
            "email": body.email,
            "password": body.password,
            "email_confirm": True,
        }

        async with httpx.AsyncClient(timeout=20) as client:
            # 1. Crear usuario en auth.users
            resp = await client.post(auth_url, headers=_admin_headers(key), json=payload)

            if resp.status_code >= 400:
                msg = _extract_supabase_error(resp)
                print(f"[usuarios] create_user Supabase error {resp.status_code}: {msg}")
                raise HTTPException(status_code=400, detail=msg)

            user_data = resp.json()
            user_id = user_data.get("id")

            # 2. Actualizar rol si no es 'user' (el trigger lo crea como 'user')
            if body.role != "user" and user_id:
                profile_url = f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}"
                patch_resp = await client.patch(
                    profile_url,
                    headers=_postgrest_headers(key),
                    json={"role": body.role},
                )
                if patch_resp.status_code >= 400:
                    print(f"[usuarios] create_user - rol no actualizado: {patch_resp.text}")
                    # No fallar: el usuario ya fue creado

        return {"ok": True, "user_id": user_id, "email": body.email}

    except HTTPException:
        raise
    except Exception as e:
        print("[usuarios] create_user error inesperado:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{uid}/password")
async def update_password(uid: str, body: UpdatePasswordRequest):
    """Cambia la contraseña de un usuario usando la Auth Admin API."""
    try:
        if len(body.password) < 6:
            raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres.")

        key = _get_service_key()
        auth_url = f"{SUPABASE_URL}/auth/v1/admin/users/{uid}"

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.put(
                auth_url,
                headers=_admin_headers(key),
                json={"password": body.password},
            )

        if resp.status_code >= 400:
            msg = _extract_supabase_error(resp)
            raise HTTPException(status_code=400, detail=msg)

        return {"ok": True, "detail": "Contraseña actualizada"}

    except HTTPException:
        raise
    except Exception as e:
        print("[usuarios] update_password error inesperado:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{uid}/role")
async def update_role(uid: str, body: UpdateRoleRequest):
    """Actualiza el rol de un usuario en la tabla `profiles`."""
    try:
        key = _get_service_key()
        profile_url = f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{uid}"

        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.patch(
                profile_url,
                headers=_postgrest_headers(key),
                json={"role": body.role},
            )

        if resp.status_code >= 400:
            msg = _extract_supabase_error(resp)
            raise HTTPException(status_code=400, detail=msg)

        return {"ok": True, "detail": "Rol actualizado"}

    except HTTPException:
        raise
    except Exception as e:
        print("[usuarios] update_role error inesperado:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{uid}")
async def delete_user(uid: str):
    """
    Elimina un usuario de auth.users usando la Auth Admin API.
    Si hay ON DELETE CASCADE, la fila de `profiles` se elimina sola.
    """
    try:
        key = _get_service_key()
        auth_url = f"{SUPABASE_URL}/auth/v1/admin/users/{uid}"

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.delete(auth_url, headers=_admin_headers(key))

        if resp.status_code >= 400:
            msg = _extract_supabase_error(resp)
            raise HTTPException(status_code=400, detail=msg)

        return {"ok": True, "detail": "Usuario eliminado"}

    except HTTPException:
        raise
    except Exception as e:
        print("[usuarios] delete_user error inesperado:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
