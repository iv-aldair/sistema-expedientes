import sys
sys.path.append(r"d:\exp_sistema_ag\sistema_expedientes\backend")
from utils.supabase_client import get_plantilla_by_nombre

print("Checking Supabase config for 17_EXP_PNP_CON_SEGURO:")
p1 = get_plantilla_by_nombre("17_EXP_PNP_CON_SEGURO")
print(p1)

print("\nChecking Supabase config for 17_EXP_PNP_SIN_SEGURO:")
p2 = get_plantilla_by_nombre("17_EXP_PNP_SIN_SEGURO")
print(p2)
