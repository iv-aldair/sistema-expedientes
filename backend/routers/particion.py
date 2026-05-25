import io
import fitz
import zipfile
from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse, Response
from pypdf import PdfReader, PdfWriter
from utils.supabase_client import get_all_plantillas, upsert_config_particion, get_plantilla_by_nombre
from utils.pdf_core import parse_pages

router = APIRouter(prefix="/api/particion", tags=["Partición"])

@router.get("/plantillas")
def obtener_plantillas_particion():
    """Retorna las plantillas de corte guardadas desde Supabase."""
    plantillas_db = get_all_plantillas()
    resultado = []
    for p in plantillas_db:
        if p.get("config_particion"):
            config = p["config_particion"]
            cortes = config.get("cortes", []) if isinstance(config, dict) else config
            resultado.append({
                "id": p["nombre_plantilla"],
                "nombre": p["nombre_plantilla"],
                "cortes": cortes
            })
    return {"plantillas": resultado}

@router.post("/plantillas")
def guardar_plantilla_particion(body: dict):
    """Guarda una nueva configuración de corte en Supabase."""
    nombre = body.get("nombre", "Sin nombre")
    cortes = body.get("cortes", [])
    config_particion = {"cortes": cortes}
    
    exito = upsert_config_particion(nombre, config_particion)
    if exito:
        return {"mensaje": f"Configuración de corte '{nombre}' guardada en Supabase.", "id": nombre}
    else:
        return JSONResponse(status_code=500, content={"detail": "Error al guardar configuración de partición en Supabase."})

@router.put("/plantillas/{plantilla_id}")
def actualizar_plantilla_particion(plantilla_id: str, body: dict):
    """Actualiza una plantilla de corte existente."""
    nombre = body.get("nombre", plantilla_id)
    cortes = body.get("cortes", [])
    config_particion = {"cortes": cortes}
    
    exito = upsert_config_particion(nombre, config_particion)
    if exito:
        return {"mensaje": f"Configuración de corte '{nombre}' actualizada en Supabase.", "id": nombre}
    else:
        return JSONResponse(status_code=500, content={"detail": "Error al actualizar configuración de partición en Supabase."})

@router.delete("/plantillas/{plantilla_id}")
def eliminar_plantilla_particion(plantilla_id: str):
    """Elimina una configuración de corte (Pone a null el config_particion en Supabase)."""
    exito = upsert_config_particion(plantilla_id, None)
    if exito:
        return {"mensaje": "Configuración de corte eliminada."}
    else:
        return JSONResponse(status_code=500, content={"detail": "Error al eliminar la configuración de partición en Supabase."})

@router.post("/procesar")
async def procesar_particion(
    archivo: UploadFile = File(...),
    plantilla_id: str = Form(...),
    apellidos_nombres: str = Form(...),
):
    """Recibe un PDF, lo corta según la plantilla en Supabase y devuelve un ZIP."""
    if not archivo.filename.lower().endswith(".pdf"):
        return JSONResponse(status_code=400, content={"detail": "Solo se aceptan archivos PDF."})

    plantilla = get_plantilla_by_nombre(plantilla_id)
    if not plantilla or not plantilla.get("config_particion"):
        return JSONResponse(status_code=404, content={"detail": "Plantilla de corte no encontrada en Supabase."})

    config_particion = plantilla["config_particion"]
    cortes = config_particion.get("cortes", []) if isinstance(config_particion, dict) else config_particion
    
    if not cortes:
        return JSONResponse(status_code=400, content={"detail": "La plantilla no tiene reglas de corte."})

    try:
        pdf_bytes = await archivo.read()
        reader = PdfReader(io.BytesIO(pdf_bytes))
        total_pages = len(reader.pages)
    except Exception as e:
        print(f"[procesar_particion] Error al abrir el PDF original: {e}")
        return JSONResponse(status_code=500, content={"detail": "El archivo PDF subido está corrupto o es inválido."})

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for corte in cortes:
            nombre = corte.get("nombre_corte", "parte")
            paginas_text = corte.get("paginas", "")
            
            try:
                if paginas_text:
                    raw_indices = parse_pages(paginas_text, total_pages)
                else:
                    inicio = int(corte.get("inicio", 1)) - 1
                    fin = int(corte.get("fin", total_pages)) - 1
                    inicio = max(0, min(inicio, total_pages - 1))
                    fin = max(inicio, min(fin, total_pages - 1))
                    raw_indices = list(range(inicio, fin + 1))
                
                page_indices = [idx for idx in raw_indices if 0 <= idx < total_pages]

                if not page_indices:
                    print(f"[procesar_particion] Corte '{nombre}' omitido: no hay páginas válidas.")
                    continue

                writer = PdfWriter()
                for idx in page_indices:
                    writer.add_page(reader.pages[idx])
                
                sub_buffer = io.BytesIO()
                writer.write(sub_buffer)
                
                sub_buffer.seek(0)
                zf.writestr(f"{nombre}.pdf", sub_buffer.read())
                
            except Exception as e:
                print(f"[procesar_particion] Error al procesar el corte '{nombre}': {e}")
                continue

    zip_buffer.seek(0)
    safe_name = apellidos_nombres.replace(" ", "_").replace("/", "_")
    zip_filename = f"{safe_name}.zip"

    return Response(
        content=zip_buffer.read(),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{zip_filename}"'},
    )
