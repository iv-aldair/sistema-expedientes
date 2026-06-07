import os
import time
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, UploadFile, File, Form, Query
# pyrefly: ignore [missing-import]
from fastapi.responses import JSONResponse
from typing import Optional

from utils.config import PLANTILLAS_DIR
from utils.supabase_client import get_all_plantillas, upsert_config_autollenado, get_plantilla_by_nombre

router = APIRouter(prefix="/api/plantillas", tags=["Configuración Plantillas"])

@router.get("")
def obtener_plantillas(
    user_id: Optional[str] = Query(None, description="UUID del usuario autenticado"),
    role: Optional[str] = Query(None, description="Rol del usuario (admin/user)"),
):
    """Retorna las plantillas de autollenado desde Supabase, filtradas por RBAC."""
    is_admin = str(role or "").lower().strip() == "admin"
    plantillas_db = get_all_plantillas(user_id=user_id, is_admin=is_admin)

    # Filtramos las que tienen config_autollenado
    resultado = []
    for p in plantillas_db:
        if p.get("config_autollenado"):
            resultado.append({
                "id": p["nombre_plantilla"],
                "nombre": p["nombre_plantilla"],
                "archivo": p["config_autollenado"].get("archivo_pdf", ""),
                "is_global": p.get("is_global", True),
                "owner_id": p.get("owner_id"),
            })
    return {"plantillas": resultado}

@router.post("/upload")
async def subir_plantilla(
    nombre_plantilla: str = Form(...),
    archivo: UploadFile = File(...),
    user_id: Optional[str] = Form(None),
    role: Optional[str] = Form(None),
):
    """Sube un PDF y lo registra en Supabase como configuración de autollenado."""
    if not archivo.filename.lower().endswith(".pdf"):
        return JSONResponse(status_code=400, content={"detail": "Solo se aceptan archivos PDF."})

    timestamp = int(time.time())
    file_name = f"plantilla_{timestamp}.pdf"

    file_path = os.path.join(PLANTILLAS_DIR, file_name)
    contents = await archivo.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    config_autollenado = {"archivo_pdf": file_name}
    
    # ── RBAC: determinar owner_id e is_global ──
    is_admin = str(role or "").lower().strip() == "admin"
    if is_admin:
        owner_id_val = None
        is_global_val = True
    else:
        owner_id_val = user_id
        is_global_val = False

    try:
        exito = upsert_config_autollenado(
            nombre_plantilla,
            config_autollenado,
            owner_id=owner_id_val,
            is_global=is_global_val,
        )
        if exito:
            return {
                "mensaje": f"Plantilla '{nombre_plantilla}' guardada exitosamente en Supabase.",
                "id": nombre_plantilla,
                "archivo": file_name,
            }
        else:
            return JSONResponse(status_code=500, content={"detail": "Error al guardar en Supabase."})
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": f"Excepción al guardar: {str(e)}"})

@router.delete("/{plantilla_id}")
def eliminar_plantilla(plantilla_id: str):
    """Elimina el archivo PDF de la plantilla."""
    plantilla = get_plantilla_by_nombre(plantilla_id)
    if not plantilla:
        return JSONResponse(status_code=404, content={"detail": "Plantilla no encontrada en Supabase."})

    config = plantilla.get("config_autollenado") or {}
    pdf_filename = config.get("archivo_pdf")
    
    if pdf_filename:
        file_path = os.path.join(PLANTILLAS_DIR, pdf_filename)
        if os.path.exists(file_path):
            os.remove(file_path)

    # (Nota: No eliminamos de Supabase explícitamente para no romper config de partición si existiera,
    # solo simulamos el delete para mantener compatibilidad, o se podría hacer un UPDATE config_autollenado = null)
    
    return {"mensaje": f"Archivo de plantilla {plantilla_id} eliminado."}
