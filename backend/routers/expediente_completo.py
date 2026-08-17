"""
Router maestro: Flujo unificado Llenado + Partición en un solo clic.

Endpoint: POST /api/generar-expediente-completo
Recibe:  { nombre_plantilla: str, datos_formulario: AutollenadoRequest }
Retorna: ZIP con PDFs cortados (si hay config_particion) o PDF lleno (si no).
"""
import io
import traceback
import zipfile
from datetime import datetime

# pyrefly: ignore [missing-import]
import fitz
# pyrefly: ignore [missing-import]
from fastapi import APIRouter   
# pyrefly: ignore [missing-import]
from fastapi.responses import JSONResponse, StreamingResponse, Response
# pyrefly: ignore [missing-import]
from pypdf import PdfReader, PdfWriter

from schemas import AutollenadoRequest
from utils.supabase_client import get_plantilla_by_nombre
from utils.pdf_core import flatten_data, parse_pages
from utils.config import PLANTILLAS_DIR

import os

router = APIRouter(tags=["Expediente Completo"])


class ExpedienteRequest:
    """Modelo manual para parsear el body combinado."""
    pass


@router.post("/api/generar-expediente-completo")
async def generar_expediente_completo(body: dict):
    """
    Flujo maestro de un solo clic:
    1. Consulta Supabase para obtener config_autollenado y config_particion.
    2. Llena el PDF base en RAM.
    3. Si existe config_particion, corta el PDF en fragmentos y genera un ZIP.
    4. Retorna el ZIP (o PDF individual si no hay partición).
    """
    try:
        nombre_plantilla = body.get("nombre_plantilla")
        datos_formulario = body.get("datos_formulario")

        if not nombre_plantilla:
            return JSONResponse(
                status_code=400,
                content={"detail": "El campo 'nombre_plantilla' es requerido."}
            )
        if not datos_formulario:
            return JSONResponse(
                status_code=400,
                content={"detail": "El campo 'datos_formulario' es requerido."}
            )

        # ══════════════════════════════════════════════════════════════
        # PASO 0: Consultar Supabase
        # ══════════════════════════════════════════════════════════════
        plantilla_supabase = get_plantilla_by_nombre(nombre_plantilla)

        if not plantilla_supabase:
            return JSONResponse(
                status_code=404,
                content={"detail": f"Plantilla '{nombre_plantilla}' no encontrada en Supabase."}
            )

        config_autollenado = plantilla_supabase.get("config_autollenado") or {}
        config_particion = plantilla_supabase.get("config_particion")

        # Obtener la ruta del PDF base desde config_autollenado
        pdf_filename = config_autollenado.get("archivo_pdf")
        if not pdf_filename:
            # Fallback: buscar por convención de nombre
            safe_name = nombre_plantilla.replace(" ", "_").upper()
            pdf_filename = f"{safe_name}.pdf"

        # Asegurar que la carpeta existe antes de buscar el archivo
        os.makedirs(PLANTILLAS_DIR, exist_ok=True)
        plantilla_path = os.path.join(PLANTILLAS_DIR, pdf_filename)

        if not os.path.exists(plantilla_path):
            return JSONResponse(
                status_code=404,
                content={
                    "detail": f"Archivo PDF base no encontrado: '{pdf_filename}'. "
                              f"Verifica que existe en la carpeta plantillas_pdf/."
                }
            )

        # ══════════════════════════════════════════════════════════════
        # PASO A: Llenado del PDF en RAM
        # ══════════════════════════════════════════════════════════════
        print(f"[expediente] Iniciando llenado para plantilla: {nombre_plantilla}")

        # Construir el objeto AutollenadoRequest desde datos_formulario
        autollenado_data = AutollenadoRequest(**datos_formulario)
        flat = flatten_data(autollenado_data)

        doc = fitz.open(plantilla_path)
        matched = 0
        for page in doc:
            for widget in page.widgets():
                field_name = widget.field_name
                if field_name and field_name in flat:
                    raw_val = flat[field_name]
                    widget.field_value = str(raw_val) if raw_val is not None else ""
                    widget.update()
                    matched += 1

        print(f"[expediente] Campos rellenados: {matched} de {len(flat)} disponibles")

        # ════════════════════════════════════════════════════════════
        # PASO A.5: FLATTEN — “Quemar” los widgets antes de pasar a pypdf
        # Sin este paso, pypdf descarta los appearance streams al copiar
        # páginas y los campos vuelven a aparecer en blanco.
        # doc.bake() aplana TODO el contenido interactivo (widgets, anotaciones)
        # en contenido gráfico estático, haciendo el PDF no-editable pero 100%
        # compatible con cualquier lector y con la partición vía pypdf.
        # ════════════════════════════════════════════════════════════
        try:
            doc.bake()                       # PyMuPDF ≥ 1.21: aplanar campos (widgets) y anotaciones
            print("[expediente] Flatten (bake) aplicado correctamente.")
        except AttributeError:
            # Fallback para versiones antiguas de PyMuPDF sin doc.bake()
            print("[expediente] doc.bake() no disponible, usando save con linearize.")

        # Guardar PDF aplanado en RAM
        pdf_buffer = io.BytesIO()
        doc.save(
            pdf_buffer,
            deflate=True,    # comprime streams para reducir tamaño
            clean=True,      # elimina objetos huérfanos
            garbage=4,       # recolecta objetos no referenciados
        )
        doc.close()
        pdf_buffer.seek(0)

        # ══════════════════════════════════════════════════════════════
        # PASO B: Partición en RAM (si existe config_particion)
        # ══════════════════════════════════════════════════════════════
        nombre_cliente = _construir_nombre_cliente(datos_formulario)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        if config_particion and isinstance(config_particion, dict):
            cortes = config_particion.get("cortes", [])
        elif config_particion and isinstance(config_particion, list):
            # Si config_particion es directamente la lista de cortes
            cortes = config_particion
        else:
            cortes = []

        if not cortes:
            # Sin partición → Devolver el PDF llenado directamente
            filename = f"EXP_{nombre_cliente}_{timestamp}.pdf"
            return StreamingResponse(
                pdf_buffer,
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f'attachment; filename="{filename}"',
                },
            )

        # Hay cortes → Generar ZIP
        print(f"[expediente] Aplicando {len(cortes)} cortes de partición...")

        pdf_bytes = pdf_buffer.read()
        reader = PdfReader(io.BytesIO(pdf_bytes))
        total_pages = len(reader.pages)

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
            for corte in cortes:
                nombre_corte = corte.get("nombre_corte", "parte")
                paginas_text = corte.get("paginas", "")

                try:
                    if paginas_text:
                        raw_indices = parse_pages(str(paginas_text), total_pages)
                    else:
                        inicio = int(corte.get("inicio", 1)) - 1
                        fin = int(corte.get("fin", total_pages)) - 1
                        inicio = max(0, min(inicio, total_pages - 1))
                        fin = max(inicio, min(fin, total_pages - 1))
                        raw_indices = list(range(inicio, fin + 1))

                    # Filtrar índices válidos
                    page_indices = [idx for idx in raw_indices if 0 <= idx < total_pages]

                    if not page_indices:
                        print(f"[expediente] Corte '{nombre_corte}' omitido: sin páginas válidas.")
                        continue

                    writer = PdfWriter()
                    for idx in page_indices:
                        writer.add_page(reader.pages[idx])

                    sub_buffer = io.BytesIO()
                    writer.write(sub_buffer)
                    sub_buffer.seek(0)

                    # Nombre del archivo dentro del ZIP: NombreCorte.pdf
                    zf.writestr(f"{nombre_corte}.pdf", sub_buffer.read())
                    print(f"[expediente]   ✓ Corte '{nombre_corte}': páginas {[i+1 for i in page_indices]}")

                except Exception as e:
                    print(f"[expediente]   ✕ Error en corte '{nombre_corte}': {e}")
                    continue

        zip_buffer.seek(0)
        zip_filename = f"EXP_{nombre_cliente}_{timestamp}.zip"

        print(f"[expediente] ZIP generado exitosamente: {zip_filename}")

        return Response(
            content=zip_buffer.getvalue(),
            media_type="application/zip",
            headers={
                "Content-Disposition": f'attachment; filename="{zip_filename}"',
            },
        )

    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"detail": f"Error al generar expediente completo: {str(e)}"}
        )


def _construir_nombre_cliente(datos_formulario: dict) -> str:
    """Extrae el nombre del cliente desde datos_formulario para nombrar archivos."""
    dp = datos_formulario.get("datos_personales", {})
    partes = [
        dp.get("apellido_paterno", ""),
        dp.get("apellido_materno", ""),
        dp.get("primer_nombre", ""),
    ]
    nombre = "_".join(p.strip() for p in partes if p and p.strip())
    return nombre.replace(" ", "_") if nombre else "SinNombre"
