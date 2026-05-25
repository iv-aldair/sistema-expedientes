import os
import traceback
# pyrefly: ignore [missing-import]
from fastapi import APIRouter
# pyrefly: ignore [missing-import]
from fastapi.responses import JSONResponse, Response

from schemas import AutollenadoRequest
from utils.config import PLANTILLAS_DIR
from utils.pdf_core import generar_pdf
from utils.supabase_client import get_plantilla_by_nombre

router = APIRouter(prefix="/api/autollenado", tags=["Autollenado"])

@router.post("")
def autollenado(data: AutollenadoRequest):
    """Genera el expediente PDF final forzando su descarga."""
    try:
        # data.plantilla_id ahora contiene el nombre de la plantilla desde el frontend
        nombre = data.plantilla_id
        plantilla = get_plantilla_by_nombre(nombre)
        
        if not plantilla or not plantilla.get("config_autollenado"):
            return JSONResponse(status_code=404, content={"detail": f"Plantilla '{nombre}' no encontrada o sin config de autollenado."})
            
        archivo_pdf = plantilla["config_autollenado"].get("archivo_pdf")
        if not archivo_pdf:
            return JSONResponse(status_code=404, content={"detail": f"Archivo PDF base no definido para la plantilla '{nombre}'."})
            
        plantilla_path = os.path.join(PLANTILLAS_DIR, archivo_pdf)

        pdf_bytes, filename = generar_pdf(data, nombre, plantilla_path)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
            },
        )
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"detail": f"Error al generar PDF: {str(e)}"})

@router.post("/preview")
def autollenado_preview(data: AutollenadoRequest):
    """Genera el expediente PDF para previsualización en el navegador."""
    try:
        nombre = data.plantilla_id
        plantilla = get_plantilla_by_nombre(nombre)
        
        if not plantilla or not plantilla.get("config_autollenado"):
            return JSONResponse(status_code=404, content={"detail": f"Plantilla '{nombre}' no encontrada o sin config de autollenado."})
            
        archivo_pdf = plantilla["config_autollenado"].get("archivo_pdf")
        if not archivo_pdf:
            return JSONResponse(status_code=404, content={"detail": f"Archivo PDF base no definido para la plantilla '{nombre}'."})
            
        plantilla_path = os.path.join(PLANTILLAS_DIR, archivo_pdf)

        pdf_bytes, _ = generar_pdf(data, nombre, plantilla_path)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf"
        )
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"detail": f"Error al generar vista previa: {str(e)}"})

