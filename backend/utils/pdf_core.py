import io
import re
# pyrefly: ignore [missing-import]
import fitz
import zipfile
import os
from datetime import datetime
from schemas import AutollenadoRequest

# ── Mapeo: clave interna → nombre real del campo en el PDF de Nitro ──
PDF_FIELD_MAP = {
# -- DATOS PERSONALES --
    "dp_tipo_documento":   "TIPO DE DOCUMENTO DE IDENTIDAD",
    "dp_numero_documento": "dp.numero_documento",
    "dp_sexo":             "M",
    "dp_apellido_paterno": "dp.apellido_paterno",
    "dp_apellido_materno": "dp.apellido_materno",
    "dp_primer_nombre":    "dp.primer_nombre",
    "dp_segundo_nombre":   "dp.segundo_nombre",
    "dp_fecha_nacimiento": "FECHA DE NACIMIENTO",
    "dp_email":            "dp.email",
    "dp_talla":            "dp.talla",
    "dp_peso":             "dp.peso",
    "dp_telefono_celular": "dp.telefono_celular",
    "dp_av_calle_jr":      "dp.AVCALLE",
    "dp_numero_lt":        "N_MZ_LT",
    "dp_distrito":         "DISTRITO",
    "dp_provincia":        "PROVINCIA",
    "dp_departamento":     "DEPARTAMENTO",
    "dp_avcalle_jpsje": "AVCALLE JRPSJE",
    "dp_periodo_gracia":   "PERIODO DE GRACIA",
    #DATOS DE CONVENIO --
    "conv_tasa":              "TASA INTERES",   
    "conv_oficina_derivar":   "OFICINA PROPIETARIA",
    "conv_nombre_supervisor": "dc.nombre_supervisor",
    "conv_nombre_promotor":   "dc.nombre_promotor",
    "conv_jefe_negocio":      "dc.negocio_nombre",
    "conv_ruc":               "RUC",
    "prest_plazo":            "PLAZO MESES",
    "lab_cargo_actual":       "CARGO",
    "total_prestamos":        "Total CD1",
    "total_tc":               "Total CD2",
    #DATOS PRESTAMO --
    "prest_monto_solicitado":   "MONTO SOLICITADO",
    "prest_plazos_meses":     "PLAZO MESES",   
    #DATOS LABORALES --
    "lab_giro_empresa":         "GIRO DE LA EMPRESA",
    "lab_provincia":          "LAB_PROVINCIA",
    "lab_distrito":           "LAB_DISTRITO",
    "lab_departamento":       "LAB_DEPARTAMENT",
    "lab_av_calle_jr":        "LAB_AVCALLEJR",
    "lab_numero_lt":          "LAB_N_MZ_LT",
    "lab_centro_trabajo_actual": "LAB DIRECCION ACTUAL",
    "lab_ruc":                "RUC",
    "lab_fecha_ingreso":      "FECHA DE INGRESO",
    "lab_ingreso_neto":       "LAB INGRESO NETO",
    # Campos compuestos
    "dp_direccion_completa":  "DIRECCION COMPLETA",
    "dp_ubigeo_completo":     "UBIGEO",
    "lab_direccion_completa": "LAB DIRECCION COMPLETA",
    "lab_ubigeo_completo":    "LAB UBIGEO",
}

def flatten_data(data: AutollenadoRequest) -> dict:
    """
    Aplana el modelo Pydantic a un dict {nombre_campo_PDF: valor}.
    Intenta mapear cada clave interna al nombre real del campo en el
    PDF de Nitro usando PDF_FIELD_MAP.
    """
    raw: dict[str, str] = {}

    # ══════ BLOQUE 1: EXTRACCIÓN BASE (Texto Plano) ══════
    dp = getattr(data, "datos_personales", None)
    if dp:
        for field in getattr(dp, "model_fields", []):
            val = getattr(dp, field, None)
            if val is not None and str(val).strip(): 
                raw[f"dp_{field}"] = str(val)

    dc = getattr(data, "datos_convenio", None)
    if dc:
        for field in getattr(dc, "model_fields", []):
            val = getattr(dc, field, None)
            if val is not None and str(val).strip(): 
                raw[f"conv_{field}"] = str(val)

    pr = getattr(data, "datos_prestamo", None)
    if pr:
        for field in getattr(pr, "model_fields", []):
            val = getattr(pr, field, None)
            if val is not None and str(val).strip(): 
                raw[f"prest_{field}"] = str(val)

    dl = getattr(data, "datos_laborales", None)
    if dl:
        for field in getattr(dl, "model_fields", []):
            val = getattr(dl, field, None)
            if val is not None and str(val).strip(): 
                raw[f"lab_{field}"] = str(val)

    ie = getattr(data, "instituciones_especiales", None)
    if ie:
        mp = getattr(ie, "ministerio_publico", None)
        if mp:
            for f in getattr(mp, "model_fields", []):
                v = getattr(mp, f, None)
                if v is not None and str(v).strip(): 
                    raw[f"mp_{f}"] = str(v)
        ffaa = getattr(ie, "ffaa", None)
        if ffaa:
            for f in getattr(ffaa, "model_fields", []):
                v = getattr(ffaa, f, None)
                if v is not None and str(v).strip(): 
                    raw[f"ffaa_{f}"] = str(v)
        essalud = getattr(ie, "essalud", None)
        if essalud:
            for f in getattr(essalud, "model_fields", []):
                v = getattr(essalud, f, None)
                if v is not None and str(v).strip(): 
                    raw[f"essalud_{f}"] = str(v)

    cd = getattr(data, "compra_deuda", None)
    if cd:
        raw["total_prestamos"] = str(getattr(cd, "total_prestamos", 0) or 0)
        raw["total_tc"] = str(getattr(cd, "total_tc", 0) or 0)
        raw["total_cd"] = str(getattr(cd, "total_cd", 0) or 0)
    else:
        raw["total_prestamos"] = "0"
        raw["total_tc"] = "0"
        raw["total_cd"] = "0"

    # ══════ BLOQUE 2: CAMPOS COMPUESTOS (Concatenación de Nombre) ══════
    nombres_partes = []
    if dp:
        nombres_partes = [
            getattr(dp, "apellido_paterno", ""),
            getattr(dp, "apellido_materno", ""),
            getattr(dp, "primer_nombre", ""),
            getattr(dp, "segundo_nombre", "")
        ]
    
    # Limpiamos cada parte de espacios vacíos y filtramos las que queden vacías
    partes_validas = [str(parte).strip() for parte in nombres_partes if parte is not None and str(parte).strip()]
    nombre_completo = " ".join(partes_validas)
    
    if nombre_completo:
        raw["dp_nombres_completos"] = nombre_completo

    # ══════ BLOQUE 3: LÓGICA DE CASILLAS DE VERIFICACIÓN (Checkboxes) ══════
    # 1. Tipo de Préstamo
    tipo_prest = raw.pop("prest_tipo_prestamo", None)
    if tipo_prest is not None:
        if tipo_prest == "NUEVO": raw["chk_prest_nuevo"] = "Yes"
        elif tipo_prest == "SUBROGADO": raw["chk_prest_subrogado"] = "Yes"
        elif tipo_prest == "AMPLIACION": raw["chk_prest_ampliacion"] = "Yes"
        elif tipo_prest == "SUBROGADO Y AMPLIACION": raw["chk_prest_subrogado_ampliacion"] = "Yes"

    # 2. Periodo de Gracia
    gracia = raw.pop("prest_periodo_gracia", None)
    if gracia is not None:
        if gracia == "1 mes": raw["chk_gracia_1"] = "Yes"
        elif gracia == "2 meses": raw["chk_gracia_2"] = "Yes"

    # 3. Domicilio Actual
    dom = raw.pop("dp_domicilio_actual", None)
    if dom is not None:
        if dom == "Familiar": raw["chk_dom_familiar"] = "Yes"
        elif dom == "Financiada": raw["chk_dom_financiada"] = "Yes"
        elif dom == "Alquilada": raw["chk_dom_alquilada"] = "Yes"
        elif dom == "Propia": raw["chk_dom_propia"] = "Yes"

    # 4. Nivel de Educación
    edu = raw.pop("dp_nivel_educacion", None)
    if edu is not None:
        if edu == "Secundaria": raw["chk_edu_secundaria"] = "Yes"
        elif edu == "Universitaria": raw["chk_edu_universitaria"] = "Yes"
        elif edu == "Técnica": raw["chk_edu_tecnica"] = "Yes"
        elif edu == "superior": raw["chk_edu_superior"] = "Yes"

    # 5. Estado Civil
    civil = raw.pop("dp_estado_civil", None)
    if civil is not None:
        if civil == "Soltero": raw["chk_civil_soltero"] = "Yes"
        elif civil == "Casado": raw["chk_civil_casado"] = "Yes"
        elif civil == "Conviviente": raw["chk_civil_conviviente"] = "Yes"
        elif civil == "Divorciado": raw["chk_civil_divorciado"] = "Yes"
        elif civil == "Viudo": raw["chk_civil_viudo"] = "Yes"

    # 6. Tipo de Seguro
    seguro = raw.pop("prest_tipo_seguro", None)
    if seguro is not None:
        if seguro == "Individual Convencional": raw["chk_seguro_ind_conv"] = "Yes"
        elif seguro == "Mancomunado Convencional": raw["chk_seguro_manc_conv"] = "Yes"
        elif seguro == "Individual con Devolución": raw["chk_seguro_ind_dev"] = "Yes"
        elif seguro == "Mancomunado con Devolución": raw["chk_seguro_manc_dev"] = "Yes"

    # 7. Sexo
    sexo = raw.pop("dp_sexo", None)
    if sexo is not None:
        if sexo == "Masculino": raw["chk_sexo_m"] = "Yes"
        elif sexo == "Femenino": raw["chk_sexo_f"] = "Yes"

    # 8. Tipo de Documento
    tipo_doc = raw.pop("dp_tipo_documento", None)
    if tipo_doc is not None:
        if tipo_doc == "DNI": raw["chk_doc_dni"] = "Yes"
        elif tipo_doc in ["CE", "Carnet Extranjería"]: raw["chk_doc_ce"] = "Yes"

    # ══════ BLOQUE 4: CONVERSIÓN DE FECHAS ══════
    DATE_RE = re.compile(r'^(\d{4})-(\d{2})-(\d{2})$')
    for key in list(raw.keys()):
        val = raw[key]
        if val:
            m = DATE_RE.match(val)
            if m:
                # Convierte YYYY-MM-DD → DD/MM/YYYY para el PDF
                raw[key] = f"{m.group(3)}/{m.group(2)}/{m.group(1)}"

    # ══════ BLOQUE 5: VARIABLES COMPUESTAS (Dirección + Ubigeo) ══════
    def _join(*parts: str) -> str:
        """Une partes no vacías con un espacio, ignorando nulos/blancos."""
        return " ".join(p.strip() for p in parts if p and p.strip())

    def _join_ubigeo(*parts: str) -> str:
        """Une partes no vacías con ' / ' como separador."""
        return " / ".join(p.strip() for p in parts if p and p.strip())

    # --- Dirección personal completa ---
    dp_dir = _join(raw.get("dp_tipo_via", ""), raw.get("dp_numero_lt", ""))
    if dp_dir:
        raw["dp_direccion_completa"] = dp_dir

    # --- Ubigeo personal completo (Distrito / Provincia / Departamento) ---
    dp_ubigeo = _join_ubigeo(
        raw.get("dp_distrito", ""),
        raw.get("dp_provincia", ""),
        raw.get("dp_departamento", ""),
    )
    if dp_ubigeo:
        raw["dp_ubigeo_completo"] = dp_ubigeo

    # --- Dirección laboral completa ---
    lab_dir = _join(raw.get("lab_tipo_via", ""), raw.get("lab_numero_lt", ""))
    if lab_dir:
        raw["lab_direccion_completa"] = lab_dir

    # --- Ubigeo laboral completo ---
    lab_ubigeo = _join_ubigeo(
        raw.get("lab_distrito", ""),
        raw.get("lab_provincia", ""),
        raw.get("lab_departamento", ""),
    )
    if lab_ubigeo:
        raw["lab_ubigeo_completo"] = lab_ubigeo

    # ══════ BLOQUE 6: MAPEO FINAL Y RETORNO ══════
    flat: dict[str, str] = {}
    for key, val in raw.items():
        if key in PDF_FIELD_MAP:
            flat[PDF_FIELD_MAP[key]] = val
        flat[key] = val
        prefix, _, rest = key.partition("_")
        if rest:
            flat[f"{prefix}.{rest}"] = val

    return flat

def generar_pdf(data: AutollenadoRequest, plantilla_nombre: str, plantilla_path: str) -> tuple[bytes, str]:
    """
    Genera un PDF con los datos del formulario y retorna (pdf_bytes, filename).
    """
    nombre_cliente = f"{data.datos_personales.apellido_paterno or ''} {data.datos_personales.primer_nombre or ''}".strip() or "SinNombre"
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"EXP_{nombre_cliente.replace(' ', '_')}_{timestamp}.pdf"

    if os.path.exists(plantilla_path):
        doc = fitz.open(plantilla_path)
        flat = flatten_data(data)
        matched = 0
        for page in doc:
            for widget in page.widgets():
                field_name = widget.field_name
                if field_name and field_name in flat:
                    raw_val = flat[field_name]
                    if raw_val is None:
                        str_val = ""
                    else:
                        str_val = str(raw_val)
                    
                    widget.field_value = str_val
                    widget.update()
                    matched += 1
        print(f"[autollenado] Campos rellenados: {matched} de {len(flat)} disponibles")
    else:
        doc = fitz.open()
        page = doc.new_page(width=595, height=842)
        y = 50
        header_rect = fitz.Rect(40, y, 555, y + 35)
        page.draw_rect(header_rect, color=fitz.pdfcolor["navy"], fill=fitz.pdfcolor["navy"])
        page.insert_text(fitz.Point(50, y + 24), f"EXPEDIENTE - {plantilla_nombre}", fontsize=14, color=fitz.pdfcolor["white"], fontname="helv")
        y += 50
        page.insert_text(fitz.Point(50, y), f"Fecha: {datetime.now().strftime('%d/%m/%Y %H:%M')}", fontsize=8, color=fitz.pdfcolor["gray"])
        y += 25
        flat = flatten_data(data)
        for key, val in flat.items():
            page.insert_text(fitz.Point(50, y), f"{key}:", fontsize=7, fontname="hebo", color=fitz.pdfcolor["black"])
            page.insert_text(fitz.Point(200, y), val, fontsize=7, color=fitz.pdfcolor["black"])
            y += 12
            if y > 790:
                page = doc.new_page(width=595, height=842)
                y = 50

    # ── Flatten: quemar widgets antes de guardar ──
    # Impide que los campos interactivos se descarten al repartir con pypdf.
    try:
        doc.bake()         # PyMuPDF ≥ 1.21
    except AttributeError:
        pass               # versiones antiguas: el save con garbage=4 ya ayuda

    buffer = io.BytesIO()
    doc.save(buffer, deflate=True, clean=True, garbage=4)
    doc.close()
    buffer.seek(0)
    return buffer.read(), filename

def parse_pages(text: str, total: int) -> list:
    """
    Convierte un string flexible como "1-3, 5, 8-10" en una lista
    de índices base-0 válidos para PyMuPDF.

    Soporta:
      - Rangos:       "1-3"          → [0, 1, 2]
      - Individuales: "5"            → [4]
      - Separados:    "9,16"         → [8, 15]
      - Mixtos:       "1-3, 5, 8-10" → [0,1,2,4,7,8,9]
      - Espacios extra y comas finales se ignoran.
    """
    if not text or not text.strip():
        return []

    pages: list[int] = []
    # Limpiar espacios y dividir por comas
    cleaned = text.replace(" ", "")
    parts = [p.strip() for p in cleaned.split(",") if p.strip()]

    for part in parts:
        if "-" in part:
            bounds = part.split("-", 1)
            try:
                start = int(bounds[0]) - 1
                end = int(bounds[1]) - 1
            except (ValueError, IndexError):
                print(f"[parse_pages] Rango inválido ignorado: '{part}'")
                continue
            # Clampar a rango válido del documento
            start = max(0, min(start, total - 1))
            end = max(start, min(end, total - 1))
            pages.extend(range(start, end + 1))
        else:
            try:
                p = int(part) - 1
            except ValueError:
                print(f"[parse_pages] Valor no numérico ignorado: '{part}'")
                continue
            if 0 <= p < total:
                pages.append(p)
            else:
                print(f"[parse_pages] Página {part} fuera de rango (doc tiene {total} págs), clampeada.")
                pages.append(max(0, min(p, total - 1)))

    # Deduplicar manteniendo el orden
    seen = set()
    unique: list[int] = []
    for p in pages:
        if p not in seen:
            seen.add(p)
            unique.append(p)
    return unique
