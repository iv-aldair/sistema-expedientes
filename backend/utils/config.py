import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLANTILLAS_DIR = os.path.join(BASE_DIR, "plantillas_pdf")
EXPEDIENTES_DIR = os.path.join(BASE_DIR, "expedientes_generados")

os.makedirs(PLANTILLAS_DIR, exist_ok=True)
os.makedirs(EXPEDIENTES_DIR, exist_ok=True)

