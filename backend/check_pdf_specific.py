import os
import sys
import fitz

sys.path.append(r"d:\exp_sistema_ag\sistema_expedientes\backend")
pdf_dir = r"d:\exp_sistema_ag\sistema_expedientes\backend\plantillas_pdf"

# Revisar las plantillas 17 y 21 que podrían ser la que el usuario subió recientemente.
targets = ["plantilla_17.pdf", "plantilla_21.pdf"]

print("=== ANALYZING EXACT PDF FIELDS ===")
for filename in targets:
    filepath = os.path.join(pdf_dir, filename)
    if not os.path.exists(filepath): continue
    try:
        doc = fitz.open(filepath)
        fields = []
        for page in doc:
            for widget in page.widgets():
                fname = widget.field_name
                if fname:
                    fields.append(fname)
        
        if fields:
            print(f"\n--- Template: {filename} ---")
            for f in sorted(set(fields)):
                if "LAB" in f.upper() or "DIST" in f.upper() or "PROV" in f.upper() or "DEP" in f.upper() or "DP." in f.upper():
                    print(f"  FOUND: '{f}'")
    except Exception as e:
        print(f"Error reading {filename}: {e}")

print("==================================")
