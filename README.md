# Sistema de Gestión y Automatización de Expedientes 📄
*Versión 3.1 - Producción*

Plataforma web integral para la automatización, procesamiento inteligente y autollenado de expedientes crediticios y convenios, con partición dinámica de legajos PDF y control de acceso basado en roles (RBAC).

---

## 🌟 Características Principales

- **Autollenado Inteligente de PDFs**: Mapeo y estampado preciso de datos en formularios PDF oficiales (AcroForms / Widgets) mediante PyMuPDF.
- **Concatenación Dinámica**: Unificación inteligente de nombres completos, direcciones (`Av/Calle` + `N°/Lt`) y ubigeos (`Distrito / Provincia / Departamento`).
- **Generación en Lote (ZIP)**: Creación concurrente de todos los documentos del expediente comprimidos en formato `.zip` descargable.
- **Visor PDF Integrado**: Previsualización interactiva en tiempo real con zoom, rotación y paginación.
- **Módulo de Partición de PDFs**: Segmentación y extracción de páginas o secciones de legajos escaneados según reglas personalizables.
- **Seguridad y Control de Acceso (RBAC)**: Autenticación y autorización mediante Tokens JWT integrados con Supabase.

---

## 🛠️ Stack Tecnológico

### Backend
- **Lenguaje**: Python 3.10+
- **Framework Web**: FastAPI (ASGI Asíncrono)
- **Motor de PDFs**: PyMuPDF (`fitz`), `pypdf`
- **Validación de Datos**: Pydantic
- **Base de Datos & Auth**: Supabase (PostgreSQL)

### Frontend
- **Framework**: React 18+ (Vite)
- **Estilos**: Tailwind CSS & Vanilla CSS
- **Iconografía**: Lucide React
- **Navegación**: React Router DOM

### Infraestructura
- **Servidor Cloud**: AWS EC2 (Ubuntu Linux)
- **Gestión de Procesos**: Uvicorn Background Runner
- **Repositorio**: GitHub

---

## 🚀 Puesta en Marcha Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/iv-aldair/sistema-expedientes.git
cd sistema-expedientes
```

### 2. Configurar y Ejecutar el Backend
```bash
cd backend
python -m venv venv
# En Windows:
venv\Scripts\activate
# En Linux / Mac:
source venv/bin/activate

pip install -r requirements.txt
python main.py
```
*El backend se ejecutará en: `http://localhost:8000`*

### 3. Configurar y Ejecutar el Frontend
```bash
cd ../frontend
npm install
npm run dev
```
*El frontend se ejecutará en: `http://localhost:5173`*

---

## 📂 Estructura del Proyecto

```text
sistema_expedientes/
├── backend/
│   ├── main.py                  # Punto de entrada de FastAPI y configuración CORS
│   ├── schemas.py               # Modelos y contratos de datos con Pydantic
│   ├── routers/                 # Endpoints organizados por módulos
│   │   ├── autollenado.py       # Vista previa y llenado individual
│   │   ├── expediente_completo.py # Generación masiva en archivo ZIP
│   │   ├── particion.py         # Particionado y segmentación de PDFs
│   │   ├── configuracion.py     # Gestión de plantillas y reglas
│   │   └── usuarios.py          # Administración de usuarios y roles
│   └── utils/
│       ├── pdf_core.py          # Motor de procesamiento y aplanado de PDFs
│       ├── supabase_client.py   # Conexión y operaciones con Supabase
│       └── config.py            # Manejo de variables de entorno
├── frontend/
│   ├── src/
│   │   ├── components/          # Componentes reutilizables y formularios
│   │   ├── pages/               # Vistas principales del sistema
│   │   ├── context/             # Contexto global de autenticación
│   │   └── lib/                 # Clientes y librerías de conexión
│   └── package.json
└── README.md
```

---

## 👥 Autor
- **Desarrollador**: iv-aldair
- **Repositorio**: [sistema-expedientes](https://github.com/iv-aldair/sistema-expedientes)
