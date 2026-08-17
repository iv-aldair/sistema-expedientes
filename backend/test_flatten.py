import os
import sys

# Agregamos la ruta del backend para importar los módulos
sys.path.append(r"d:\exp_sistema_ag\sistema_expedientes\backend")

from schemas import AutollenadoRequest
from utils.pdf_core import flatten_data

payload = {
    "plantilla_id": "1",
    "datos_personales": {
        "apellido_paterno": "Perez",
        "distrito": "MIRAFLORES",
        "provincia": "LIMA",
        "departamento": "LIMA"
    },
    "datos_convenio": {
        "tipo_convenio": "TEST"
    },
    "datos_prestamo": {
        "monto_solicitado": "1000"
    },
    "datos_laborales": {
        "av_calle_jr": "Girón Junín 141",
        "distrito": "HUANCANE",
        "provincia": "SAN ROMAN",
        "departamento": "PUNO",
        "centro_trabajo_actual": "MI EMPRESA"
    },
    "compra_deuda": {
        "prestamos": [],
        "tarjetas": []
    }
}

try:
    req = AutollenadoRequest(**payload)
    print("=== TEST SCHEMA VALIDATION ===")
    print("Schema Validation: SUCCESS")
    print("Parsed datos_personales (Domicilio):", req.datos_personales.distrito, req.datos_personales.provincia, req.datos_personales.departamento)
    print("Parsed datos_laborales (Trabajo):", req.datos_laborales.distrito, req.datos_laborales.provincia, req.datos_laborales.departamento)
    
    flat = flatten_data(req)
    print("\n=== TEST FLATTEN OUTPUT (MAPEO A NITRO) ===")
    print("  [DISTRITO] ->", flat.get("DISTRITO"))
    print("  [PROVINCIA] ->", flat.get("PROVINCIA"))
    print("  [DEPARTAMENTO] ->", flat.get("DEPARTAMENTO"))
    print("  ---------------------------------")
    print("  [LAB_DISTRITO] ->", flat.get("LAB_DISTRITO"))
    print("  [LAB_PROVINCIA] ->", flat.get("LAB_PROVINCIA"))
    print("  [LAB_DEPARTAMENT] ->", flat.get("LAB_DEPARTAMENT"))
    print("  [LAB_AVCALLEJR] ->", flat.get("LAB_AVCALLEJR"))
except Exception as e:
    import traceback
    traceback.print_exc()
