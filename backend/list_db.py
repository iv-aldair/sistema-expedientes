import sys
sys.path.append(r"d:\exp_sistema_ag\sistema_expedientes\backend")
from utils.supabase_client import get_all_plantillas

print("Listing all templates from Supabase:")
plantillas = get_all_plantillas(is_admin=True)
for p in plantillas:
    print(p["nombre_plantilla"], "->", p.get("config_autollenado", {}).get("archivo_pdf"))
