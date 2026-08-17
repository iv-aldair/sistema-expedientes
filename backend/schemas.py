"""Pydantic schemas for the Autollenado module."""
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from typing import Optional, List


class DatosPersonales(BaseModel):
    tipo_documento: Optional[str] = None
    numero_documento: Optional[str] = None
    sexo: Optional[str] = None
    apellido_paterno: Optional[str] = None
    apellido_materno: Optional[str] = None
    primer_nombre: Optional[str] = None
    segundo_nombre: Optional[str] = None
    estado_civil: Optional[str] = None
    nivel_educacion: Optional[str] = None
    cargo_actual: Optional[str] = None
    email: Optional[str] = None
    talla: Optional[str] = None
    peso: Optional[str] = None
    fecha_nacimiento: Optional[str] = None
    fecha_firma: Optional[str] = None
    # Domicilio
    domicilio_actual: Optional[str] = None
    av_calle_jr: Optional[str] = None
    numero_lt: Optional[str] = None
    dpto_int: Optional[str] = None
    urbanizacion: Optional[str] = None
    distrito: Optional[str] = None
    provincia: Optional[str] = None
    departamento: Optional[str] = None
    localidad: Optional[str] = None
    telefono_celular: Optional[str] = None


class DatosConvenio(BaseModel):
    tipo_convenio: Optional[str] = None
    ruc: Optional[str] = None
    jefe_negocio: Optional[str] = None
    tasa: Optional[str] = None
    oficina_derivar: Optional[str] = None
    nombre_supervisor: Optional[str] = None
    dni_supervisor: Optional[str] = None
    nombre_promotor: Optional[str] = None
    dni_promotor: Optional[str] = None


class DatosPrestamo(BaseModel):
    tipo_prestamo: Optional[str] = None
    monto_solicitado: Optional[str] = None
    plazo: Optional[str] = None
    periodo_gracia: Optional[str] = None
    tipo_seguro: Optional[str] = None


class DatosLaborales(BaseModel):
    giro_empresa: Optional[str] = None
    fecha_ingreso: Optional[str] = None
    av_calle_jr: Optional[str] = None
    numero_lt: Optional[str] = None
    dpto_int: Optional[str] = None
    distrito: Optional[str] = None
    provincia: Optional[str] = None
    departamento: Optional[str] = None
    ingreso_neto: Optional[str] = None


class MinisterioPublico(BaseModel):
    airhsp: Optional[str] = None
    regimen_laboral: Optional[str] = None
    dependencia: Optional[str] = None


class FFAA(BaseModel):
    cip: Optional[str] = None
    godofin: Optional[str] = None
    grado: Optional[str] = None
    dependencia: Optional[str] = None


class ESSALUD(BaseModel):
    codigo: Optional[str] = None
    sede: Optional[str] = None


class InstitucionesEspeciales(BaseModel):
    ministerio_publico: Optional[MinisterioPublico] = None
    ffaa: Optional[FFAA] = None
    essalud: Optional[ESSALUD] = None


class FilaPrestamo(BaseModel):
    entidad: Optional[str] = None
    moneda: Optional[str] = None
    numero_prestamo: Optional[str] = None
    monto_soles: Optional[str] = None
    monto_dolares: Optional[str] = None
    tipo_cambio: Optional[str] = None


class FilaTarjeta(BaseModel):
    entidad: Optional[str] = None
    moneda: Optional[str] = None
    numero_tarjeta: Optional[str] = None
    monto_soles: Optional[str] = None
    monto_dolares: Optional[str] = None
    tipo_cambio: Optional[str] = None


class CompraDeuda(BaseModel):
    prestamos: List[FilaPrestamo] = []
    tarjetas: List[FilaTarjeta] = []
    total_prestamos: Optional[float] = 0
    total_tc: Optional[float] = 0
    total_cd: Optional[float] = 0


class AutollenadoRequest(BaseModel):
    plantilla_id: str
    datos_personales: DatosPersonales
    datos_convenio: DatosConvenio
    datos_prestamo: DatosPrestamo
    datos_laborales: DatosLaborales
    instituciones_especiales: Optional[InstitucionesEspeciales] = None
    compra_deuda: CompraDeuda
