# pyrefly: ignore [missing-import]
import uvicorn
import subprocess
import threading
import time
from dotenv import load_dotenv
# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.responses import Response
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()  # Cargar variables de entorno (.env) para Supabase

from routers import autollenado, particion, configuracion, expediente_completo, usuarios
from utils.config import PLANTILLAS_DIR # Solo para asegurar carpetas

app = FastAPI(title="Sistema de Expedientes Bancarios")

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:5174", 
        "http://127.0.0.1:5173", 
        "http://127.0.0.1:5174",
        "http://localhost:8000",
        "https://sistema-expedientes-seven.vercel.app" # TODO: Reemplazar con tu dominio real de Vercel
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Ya no inicializamos plantillas locales en JSON, todo es por Supabase

# ── Registrar Enrutadores (Modularización) ──
app.include_router(autollenado.router)
app.include_router(particion.router)
app.include_router(configuracion.router)
app.include_router(expediente_completo.router)
app.include_router(usuarios.router)

@app.get("/")
def inicio():
    """Endpoint de estado raíz."""
    return {
        "mensaje": "Servidor de Expedientes activo",
        "estado": "Listo para procesar PDFs",
    }

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    """Silencia los 404 de favicon en los logs."""
    return Response(status_code=204)

# ── Lanzador ──
def lanzar_ventana_navegador():
    """
    Espera a que el servidor FastAPI inicie y abre 
    una ventana de Edge en modo aplicación.
    """
    time.sleep(2) 
    url = "http://127.0.0.1:8000"
    comando = f'start msedge --app={url}'
    subprocess.run(comando, shell=True)

if __name__ == "__main__":
    threading.Thread(target=lanzar_ventana_navegador, daemon=True).start()
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)