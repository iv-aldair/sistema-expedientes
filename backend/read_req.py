import os
import sys

# Leer requirements
try:
    with open(r"d:\exp_sistema_ag\sistema_expedientes\backend\requirements.txt", "rb") as f:
        data = f.read()
    
    try:
        text = data.decode("utf-16le")
    except:
        text = data.decode("utf-8", errors="ignore")
    print("REQUIREMENTS:\n", text)
except Exception as e:
    print(e)
