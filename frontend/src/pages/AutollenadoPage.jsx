import React, { useState, useEffect, useMemo } from 'react';
import FormularioAutollenado from '../components/FormularioAutollenado';
import VisorPDF from '../components/VisorPDF';


const emptyPrestamo = { entidad: '', moneda: 'PEN', numero_prestamo: '', monto_soles: '', monto_dolares: '', tipo_cambio: '' };
const emptyTarjeta = { entidad: '', moneda: 'PEN', numero_tarjeta: '', monto_soles: '', monto_dolares: '', tipo_cambio: '' };

const INITIAL = {
  plantilla_id: '',
  datos_personales: { tipo_documento: 'DNI', numero_documento: '', sexo: '', apellido_paterno: '', apellido_materno: '', primer_nombre: '', segundo_nombre: '', estado_civil: '', nivel_educacion: '', cargo_actual: '', email: '', talla: '', peso: '', domicilio_actual: '', av_calle_jr: '', numero_lt: '', dpto_int: '', urbanizacion: '', distrito: '', provincia: '', departamento: '', localidad: '', telefono_celular: '', fecha_nacimiento: '', fecha_firma: '' },
  datos_convenio: { tipo_convenio: '', ruc: '', jefe_negocio: '', tasa: '', oficina_derivar: '', nombre_supervisor: '', dni_supervisor: '', nombre_promotor: '', dni_promotor: '' },
  datos_prestamo: { tipo_prestamo: '', monto_solicitado: '', plazo: '', periodo_gracia: '', tipo_seguro: '' },
  datos_laborales: { giro_empresa: '', giro_negocio: '', fecha_ingreso: '', av_calle_jr: '', numero_lt: '', dpto_int: '', distrito: '', provincia: '', departamento: '' },
  instituciones_especiales: { ministerio_publico: { airhsp: '', regimen_laboral: '', dependencia: '' }, ffaa: { cip: '', godofin: '', grado: '', dependencia: '' }, essalud: { codigo: '', sede: '' } },
  compra_deuda: { prestamos: [{ ...emptyPrestamo }], tarjetas: [{ ...emptyTarjeta }] },
};

export default function AutollenadoPage() {
  const [plantillas, setPlantillas] = useState([]);
  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem('autollenado_form');
    return saved ? JSON.parse(saved) : INITIAL;
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(true);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('autollenado_form', JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/plantillas`)
      .then(res => res.json())
      .then(data => setPlantillas(data.plantillas || []))
      .catch(() => { });
  }, []);

  /* ── Lógica de autollenado ── */
  useEffect(() => {
    if (form.datos_convenio.nombre_supervisor === 'JHON QUISPE') {
      if (form.datos_convenio.dni_supervisor !== '12345678') {
        setForm(p => ({ ...p, datos_convenio: { ...p.datos_convenio, dni_supervisor: '12345678' } }));
      }
    }
  }, [form.datos_convenio.nombre_supervisor]);

  /* ── Totales calculados ── */
  const sumSoles = (arr) => arr.reduce((s, r) => s + (parseFloat(r.monto_soles) || 0), 0);
  const totalPrestamos = useMemo(() => sumSoles(form.compra_deuda.prestamos), [form.compra_deuda.prestamos]);
  const totalTC = useMemo(() => sumSoles(form.compra_deuda.tarjetas), [form.compra_deuda.tarjetas]);
  const totalCD = totalPrestamos + totalTC;

  /* ── Vista previa en vivo con debounce y AbortController ── */
  useEffect(() => {
    if (!form.plantilla_id) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setIsPreviewLoading(true);
      try {
        const body = {
          ...form,
          compra_deuda: {
            ...form.compra_deuda,
            total_prestamos: totalPrestamos,
            total_tc: totalTC,
            total_cd: totalCD,
          },
        };
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/autollenado/preview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,        // cancela si el usuario sigue tipeando
        });
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          setPreviewUrl(prev => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          });
        }
      } catch (e) {
        if (e.name !== 'AbortError') console.error('Preview error', e);
      } finally {
        setIsPreviewLoading(false);
      }
    }, 2500);                               // 2500 ms — evita que el servidor colapse al escribir rápido

    return () => {
      clearTimeout(timer);
      controller.abort();                   // cancela el fetch si el timer no disparó
    };
  }, [form, totalPrestamos, totalTC, totalCD]);

  /* ── Envío: Flujo unificado (Llenado + Partición) ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.plantilla_id) { setStatus({ type: 'error', message: 'Seleccione una plantilla.' }); return; }

    try {
      // Buscar la plantilla seleccionada para saber si tiene particiones configuradas
      const plantillaSeleccionada = plantillas.find(p => p.id === form.plantilla_id);
      const nombrePlantilla = plantillaSeleccionada?.nombre || '';
      const cortesConfigurados = plantillaSeleccionada?.config_particion?.cortes || [];
      const isZip = cortesConfigurados.length > 0;

      // Determinar nombre sugerido antes de la petición
      const apellido = (form.datos_personales.apellido_paterno || 'Generado').replace(/\s+/g, '_');
      const extension = isZip ? '.zip' : '.pdf';
      const suggestedName = `Expediente_${apellido}${extension}`;

      // 2. Solicitar ubicación de guardado (Solo en navegadores Chromium)
      let fileHandle;
      if (window.showSaveFilePicker) {
        fileHandle = await window.showSaveFilePicker({
          suggestedName: suggestedName,
          types: [{
            description: isZip ? 'Archivo ZIP' : 'Documento PDF',
            accept: isZip ? { 'application/zip': ['.zip'] } : { 'application/pdf': ['.pdf'] },
          }],
        });
      }

      // 4. Mostrar estado de "Cargando..." en UI
      setLoading(true);
      setStatus({ type: '', message: '' });

      // Construir los datos del formulario con totales calculados
      const datosFormulario = {
        ...form,
        compra_deuda: {
          ...form.compra_deuda,
          total_prestamos: totalPrestamos,
          total_tc: totalTC,
          total_cd: totalCD,
        },
      };

      // 5. Ejecutar fetch al endpoint
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/generar-expediente-completo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_plantilla: nombrePlantilla,
          datos_formulario: datosFormulario,
        }),
      });

      if (!res.ok) {
        let errMessage = 'Error al procesar.';
        try {
          const err = await res.json();
          errMessage = err.detail || errMessage;
        } catch (parseErr) {
          console.error("No se pudo parsear el error JSON:", parseErr);
        }
        setStatus({ type: 'error', message: errMessage });
        setLoading(false);
        return;
      }

      // 6. Obtener Blob (Asegurarse de manejar como Blob siempre)
      const blob = await res.blob();

      // 7. Escribir archivo o usar fallback
      if (fileHandle) {
        // Chromium: Escribir directamente en el archivo elegido
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        // Firefox/Safari/Edge Antiguo: Fallback de descarga automática
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = suggestedName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setStatus({ type: 'success', message: `Archivo guardado exitosamente.` });

    } catch (error) {
      // 3. Si el usuario cancela la ventana
      if (error.name === 'AbortError') {
        return;
      }
      console.error("Error en handleSubmit:", error);
      setStatus({ type: 'error', message: 'No se pudo generar o guardar el archivo.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClearForm = () => {
    setForm(INITIAL);
    setStatus({ type: '', message: '' });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Encabezado — fijo en altura, sin scroll */}
      <div className="shrink-0 px-6 lg:px-8 pt-6 pb-4 max-w-[1600px] w-full mx-auto">
        <div className="mb-4 animate-fade-in">
          <h1 className="text-2xl font-bold text-slate-800">Autollenado de Expedientes</h1>
          <p className="text-slate-400 text-sm mt-1">Complete el formulario y genere el expediente PDF automáticamente</p>
        </div>

        {/* Alertas */}
        {status.message && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-fade-in ${status.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
            {status.type === 'success' ? '✓' : '✕'} {status.message}
            <button type="button" onClick={() => setStatus({ type: '', message: '' })} className="ml-auto text-lg leading-none opacity-50 hover:opacity-100">×</button>
          </div>
        )}
      </div>

      {/* Grid de dos columnas — ocupa el espacio restante, sin scroll en este nivel */}
      <div className={`flex-1 overflow-hidden px-6 lg:px-8 pb-6 max-w-[1600px] w-full mx-auto grid grid-cols-1 ${mostrarVistaPrevia ? 'lg:grid-cols-2 xl:grid-cols-[1fr_minmax(500px,600px)]' : ''
        } gap-8`}>
        {/* Columna Izquierda: Formulario */}
        <div className="h-full overflow-y-auto pr-4 pb-20 custom-scrollbar">
          <FormularioAutollenado
            form={form}
            setForm={setForm}
            plantillas={plantillas}
            handleSubmit={handleSubmit}
            loading={loading}
            mostrarVistaPrevia={mostrarVistaPrevia}
            setMostrarVistaPrevia={setMostrarVistaPrevia}
            onClearForm={handleClearForm}
            totalPrestamos={totalPrestamos}
            totalTC={totalTC}
            totalCD={totalCD}
          />
        </div>

        {/* Columna Derecha: Vista Previa PDF */}
        {mostrarVistaPrevia && (
          <div className="hidden lg:flex flex-col h-full overflow-hidden">
            <VisorPDF
              previewUrl={previewUrl}
              isPreviewLoading={isPreviewLoading}
              setIsPreviewLoading={setIsPreviewLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
}
