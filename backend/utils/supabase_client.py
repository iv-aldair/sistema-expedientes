"""
Cliente ligero de Supabase usando httpx + PostgREST.
Evita la dependencia pesada del SDK completo (pyiceberg, C++ build tools).
"""
import os
import httpx
import traceback
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠️ ADVERTENCIA: Faltan las variables SUPABASE_URL o SUPABASE_SERVICE_KEY en .env.")
    print("Las operaciones de base de datos fallarán. Asegúrate de configurar el archivo .env.")
    SUPABASE_URL = SUPABASE_URL or ""
    SUPABASE_KEY = SUPABASE_KEY or ""

_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}


def get_plantilla_by_nombre(nombre_plantilla: str) -> dict | None:
    """
    Busca una fila en la tabla 'plantillas' por su columna 'nombre_plantilla'.
    Retorna un dict con las columnas o None si no se encuentra.
    """
    url = f"{SUPABASE_URL}/rest/v1/plantillas"
    params = {
        "nombre_plantilla": f"eq.{nombre_plantilla}",
        "select": "nombre_plantilla,config_autollenado,config_particion,owner_id,is_global",
        "limit": "1",
    }

    try:
        with httpx.Client(timeout=10) as client:
            resp = client.get(url, headers=_HEADERS, params=params)
            resp.raise_for_status()
            data = resp.json()
            if data and len(data) > 0:
                return data[0]
            return None
    except Exception as e:
        print(f"[supabase_client] Error al consultar Supabase:")
        traceback.print_exc()
        return None


def get_all_plantillas_nombres() -> list[str]:
    """
    Retorna la lista de todos los nombre_plantilla disponibles en Supabase.
    """
    url = f"{SUPABASE_URL}/rest/v1/plantillas"
    params = {
        "select": "nombre_plantilla",
        "order": "nombre_plantilla.asc",
    }

    try:
        with httpx.Client(timeout=10) as client:
            resp = client.get(url, headers=_HEADERS, params=params)
            resp.raise_for_status()
            data = resp.json()
            return [row["nombre_plantilla"] for row in data]
    except Exception as e:
        print(f"[supabase_client] Error al listar plantillas:")
        traceback.print_exc()
        return []

def get_all_plantillas(user_id: str = None, is_admin: bool = False) -> list[dict]:
    """
    Retorna las filas de la tabla plantillas, filtradas por RBAC.
    
    - Si is_admin=True: retorna TODAS las plantillas.
    - Si is_admin=False y hay user_id: retorna solo las globales + las del usuario.
    - Si no hay user_id: retorna solo las globales.
    """
    url = f"{SUPABASE_URL}/rest/v1/plantillas"
    params = {
        "select": "*",
        "order": "nombre_plantilla.asc",
    }

    # ── Filtro RBAC ──
    if not is_admin:
        if user_id:
            # PostgREST OR filter: is_global=true OR owner_id=user_id
            params["or"] = f"(is_global.eq.true,owner_id.eq.{user_id})"
        else:
            # Sin usuario identificado, solo globales
            params["is_global"] = "eq.true"

    try:
        with httpx.Client(timeout=10) as client:
            resp = client.get(url, headers=_HEADERS, params=params)
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        print(f"[supabase_client] Error al obtener todas las plantillas:")
        traceback.print_exc()
        return []

def upsert_config_autollenado(nombre_plantilla: str, config_autollenado: dict,
                               owner_id: str = None, is_global: bool = True) -> bool:
    """
    Inserta o actualiza la configuración de autollenado para una plantilla.
    Incluye owner_id e is_global en el INSERT para RBAC.
    """
    url = f"{SUPABASE_URL}/rest/v1/plantillas"
    existente = get_plantilla_by_nombre(nombre_plantilla)
    
    try:
        with httpx.Client(timeout=10) as client:
            if existente:
                # UPDATE — no cambiamos owner_id/is_global en update para no perder propiedad
                update_url = f"{url}?nombre_plantilla=eq.{nombre_plantilla}"
                resp = client.patch(update_url, headers=_HEADERS, json={"config_autollenado": config_autollenado})
                resp.raise_for_status()
            else:
                # INSERT — incluir owner_id e is_global
                insert_data = {
                    "nombre_plantilla": nombre_plantilla,
                    "config_autollenado": config_autollenado,
                    "is_global": is_global,
                }
                if owner_id:
                    insert_data["owner_id"] = owner_id
                resp = client.post(url, headers=_HEADERS, json=insert_data)
                resp.raise_for_status()
        return True
    except Exception as e:
        print(f"[supabase_client] Error en upsert_config_autollenado:")
        traceback.print_exc()
        return False

def upsert_config_particion(nombre_plantilla: str, config_particion: dict,
                             owner_id: str = None, is_global: bool = True) -> bool:
    """
    Inserta o actualiza la configuración de partición para una plantilla.
    Incluye owner_id e is_global en el INSERT para RBAC.
    """
    url = f"{SUPABASE_URL}/rest/v1/plantillas"
    existente = get_plantilla_by_nombre(nombre_plantilla)
    
    try:
        with httpx.Client(timeout=10) as client:
            if existente:
                # UPDATE — no cambiamos owner_id/is_global en update para no perder propiedad
                update_url = f"{url}?nombre_plantilla=eq.{nombre_plantilla}"
                resp = client.patch(update_url, headers=_HEADERS, json={"config_particion": config_particion})
                resp.raise_for_status()
            else:
                # INSERT — incluir owner_id e is_global
                insert_data = {
                    "nombre_plantilla": nombre_plantilla,
                    "config_particion": config_particion,
                    "is_global": is_global,
                }
                if owner_id:
                    insert_data["owner_id"] = owner_id
                resp = client.post(url, headers=_HEADERS, json=insert_data)
                resp.raise_for_status()
        return True
    except Exception as e:
        print(f"[supabase_client] Error en upsert_config_particion:")
        traceback.print_exc()
        return False
