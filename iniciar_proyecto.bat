@echo off
echo Iniciando el Proyecto: Sistema de Expedientes...

:: 1. Iniciar el Backend (FastAPI)
:: Usa 'start' para abrir una nueva ventana.
:: 'cmd /k' mantiene la ventana abierta despues de ejecutar los comandos.
:: Navega a la carpeta backend, activa el entorno virtual y arranca uvicorn.
start "Backend FastAPI" cmd /k "cd backend &&   "

:: 2. Iniciar el Frontend (React/Vite)
:: Abre otra ventana independiente.
:: Navega a la carpeta frontend y ejecuta el servidor de desarrollo de Vite.
start "Frontend React/Vite" cmd /k "cd frontend && npm run dev"

echo Ventanas de terminal abiertas exitosamente.
echo Puedes cerrar esta ventana.
pause
