import os
import time
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, UploadFile, File, Form
# pyrefly: ignore [missing-import]
from fastapi.responses import JSONResponse

from utils.config import PLANTILLAS_DIR
from utils.supabase_client import get_all_plantillas, upsert_config_autollenado, get_plantilla_by_nombre

router = APIRouter(prefix="/api/plantillas", tags=["Configuración Plantillas"])

@router.get("")
def obtener_plantillas():
    """Retorna las plantillas de autollenado desde Supabase."""
    plantillas_db = get_all_plantillas()
    # Filtramos las que tienen config_autollenado
    resultado = []
    for p in plantillas_db:
        if p.get("config_autollenado"):
            resultado.append({
                "id": p["nombre_plantilla"],
                "nombre": p["nombre_plantilla"],
                "archivo": p["config_autollenado"].get("archivo_pdf", "")
            })
    return {"plantillas": resultado}

@router.post("/upload")
async def subir_plantilla(
    nombre_plantilla: str = Form(...),
    archivo: UploadFile = File(...),
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
    
    try:
        exito = upsert_config_autollenado(nombre_plantilla, config_autollenado)
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
