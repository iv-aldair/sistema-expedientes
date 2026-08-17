import os
import sys
import fitz

# Agregamos la ruta del backend para importar los módulos
sys.path.append(r"d:\exp_sistema_ag\sistema_expedientes\backend")

pdf_dir = r"d:\exp_sistema_ag\sistema_expedientes\backend\plantillas_pdf"

print("=== ANALYZING PDF FIELDS IN TEMPLATES ===")
for filename in os.listdir(pdf_dir):
    if not filename.endswith(".pdf"): continue
    
    filepath = os.path.join(pdf_dir, filename)
    try:
        doc = fitz.open(filepath)
        fields = []
        for page in doc:
            for widget in page.widgets():
                fname = widget.field_name
                if fname:
                    fname_up = fname.upper()
                    # Buscar campos relacionados a laborales o ubicaciones
                    if "LAB" in fname_up or "PROV" in fname_up or "DIST" in fname_up or "DEP" in fname_up or "TRABAJO" in fname_up or "RUC" in fname_up or "GIRO" in fname_up:
                        fields.append(fname)
        
        if fields:
            print(f"\nTemplate: {filename}")
            for f in sorted(set(fields)):
                print(f"  - '{f}'")
    except Exception as e:
        print(f"Error reading {filename}: {e}")

print("=========================================")
