import React, { useState, useCallback, useRef } from 'react';
import { SubGroup, FormInput, FormSelect, DynamicTable } from './FormPrimitives';

// ═══════════════════════════════════════════════════════════════
// CATÁLOGO DE CONVENIOS — fuente de verdad para el autollenado
// Cada clave debe coincidir EXACTAMENTE con el value del selector
// ═══════════════════════════════════════════════════════════════
const CONVENIOS_DB = {
  "MINSA - REDESS HUANCANE": {
    ruc: "20363839500",
    domicilio: "AV SANTA CRUZ S/N",
    distrito: "HUANCANE",
    provincia: "HUANCANE",
    departamento: "PUNO",
    giro_negocio: "SALUD",
  },
  "ESSALUD - ESSALUD": {
    ruc: "20131257750",
    domicilio: "AV JOSE SANTOS CHOCANO 1123",
    distrito: "JULIACA",
    provincia: "SAN ROMAN",
    departamento: "PUNO",
    giro_negocio: "SALUD",
  },
  "UGEL - PUNO": {
    ruc: "20447153064",
    domicilio: "JR AREQUIPA 330",
    distrito: "PUNO",
    provincia: "PUNO",
    departamento: "PUNO",
    giro_negocio: "EDUCACION",
  },
  "PNP - PUNO": {
    ruc: "20131369477",
    domicilio: "AV EL EJERCITO 327",
    distrito: "PUNO",
    provincia: "PUNO",
    departamento: "PUNO",
    giro_negocio: "SEGURIDAD",
  },
  "GORE - PUNO": {
    ruc: "20407609603",
    domicilio: "JR AYACUCHO 682",
    distrito: "PUNO",
    provincia: "PUNO",
    departamento: "PUNO",
    giro_negocio: "GOBIERNO REGIONAL",
  },
  "MINSA - DIRESA PUNO": {
    ruc: "20363826700",
    domicilio: "AV EL SOL 1022",
    distrito: "PUNO",
    provincia: "PUNO",
    departamento: "PUNO",
    giro_negocio: "SALUD",
  },
};

const emptyPrestamo = { entidad: '', moneda: 'PEN', numero_prestamo: '', monto_soles: '', monto_dolares: '', tipo_cambio: '' };
const emptyTarjeta = { entidad: '', moneda: 'PEN', numero_tarjeta: '', monto_soles: '', monto_dolares: '', tipo_cambio: '' };

const colsPrestamo = [
  { key: 'entidad', label: 'Entidad', placeholder: 'Ej: BCP' },
  { key: 'moneda', label: 'Moneda', type: 'select', options: ['PEN', 'USD'] },
  { key: 'numero_prestamo', label: 'Nro. Préstamo', placeholder: '000-000' },
  { key: 'monto_soles', label: 'Monto S/', type: 'number', placeholder: '0.00' },
  { key: 'monto_dolares', label: 'Monto US$', type: 'number', placeholder: '0.00' },
  { key: 'tipo_cambio', label: 'T.C.', type: 'number', placeholder: '3.75' },
];
const colsTarjeta = [
  { key: 'entidad', label: 'Entidad', placeholder: 'Ej: BBVA' },
  { key: 'moneda', label: 'Moneda', type: 'select', options: ['PEN', 'USD'] },
  { key: 'numero_tarjeta', label: 'Nro. Tarjeta', placeholder: '**** 0000' },
  { key: 'monto_soles', label: 'Monto S/', type: 'number', placeholder: '0.00' },
  { key: 'monto_dolares', label: 'Monto US$', type: 'number', placeholder: '0.00' },
  { key: 'tipo_cambio', label: 'T.C.', type: 'number', placeholder: '3.75' },
];

const IconUser = () => <svg className="w-4 h-4 text-bbva-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const IconBrief = () => <svg className="w-4 h-4 text-bbva-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const IconBank = () => <svg className="w-4 h-4 text-bbva-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;

const AccordionSection = ({ title, subtitle, icon, children, isOpen, onToggle }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden animate-fade-in">
      <button type="button" onClick={onToggle} className="w-full px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-bbva-sky/60 to-white flex items-center justify-between text-left hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-bbva-blue/10 flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-[15px] font-semibold text-bbva-dark">{title}</h2>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <svg className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default function FormularioAutollenado({
  form, setForm, plantillas, handleSubmit, loading,
  mostrarVistaPrevia, setMostrarVistaPrevia, onClearForm,
  totalPrestamos, totalTC, totalCD
}) {
  const [instOpen, setInstOpen] = useState({ mp: false, ffaa: false, essalud: false });
  const [openSections, setOpenSections] = useState({ s1: true, s2: false, s3: false, s4: false, s5: false, s6: false });
  const [convenioAutoFilled, setConvenioAutoFilled] = useState(false);
  const formRef = useRef(null);

  const toggleSection = (s) => setOpenSections(prev => ({ ...prev, [s]: !prev[s] }));

  /* ── Navegación tipo Excel: las 4 flechas entre inputs ── */
  const handleFormKeyDown = useCallback((e) => {
    const NAV_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    if (!NAV_KEYS.includes(e.key)) return;

    const active = document.activeElement;
    if (!active || !formRef.current) return;

    // Solo actuar si el foco está en un campo real
    const isField = active.matches(
      'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), select, textarea'
    );
    if (!isField) return;

    // Para Left/Right: no interferir cuando el cursor está dentro del texto
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const isText = active.type !== 'select-one' && active.type !== 'select-multiple';
      if (isText) {
        const { selectionStart, selectionEnd, value } = active;
        const atStart = selectionStart === 0 && selectionEnd === 0;
        const atEnd   = selectionStart === value.length && selectionEnd === value.length;
        // Solo navegamos a otro campo si el cursor está en los extremos
        if (e.key === 'ArrowLeft'  && !atStart) return;
        if (e.key === 'ArrowRight' && !atEnd)   return;
      }
    }

    // Select abiertos: Up/Down los maneja el navegador (lista de opciones)
    if (active.tagName === 'SELECT' &&
        (e.key === 'ArrowUp' || e.key === 'ArrowDown')) return;

    // Obtener todos los campos visibles del formulario
    const fields = Array.from(
      formRef.current.querySelectorAll(
        'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([disabled]), select:not([disabled]), textarea:not([disabled])'
      )
    ).filter(el => el.offsetParent !== null);

    const currentIdx = fields.indexOf(active);
    if (currentIdx === -1) return;

    const isForward = e.key === 'ArrowDown' || e.key === 'ArrowRight';
    const nextIdx = isForward
      ? Math.min(currentIdx + 1, fields.length - 1)
      : Math.max(currentIdx - 1, 0);

    if (nextIdx === currentIdx) return;

    // Prevenir scroll accidental solo para Arriba/Abajo
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();

    fields[nextIdx].focus();
    if (fields[nextIdx].select) fields[nextIdx].select();
  }, []);

  /* ── Autollenado de convenio ── */
  const handleConvenioChange = useCallback((e) => {
    const selected = e.target.value;
    const convenioData = CONVENIOS_DB[selected];
    if (convenioData) {
      setForm(p => ({
        ...p,
        datos_convenio: { ...p.datos_convenio, tipo_convenio: selected, ruc: convenioData.ruc },
        datos_laborales: {
          ...p.datos_laborales,
          tipo_via: convenioData.domicilio,
          distrito: convenioData.distrito,
          provincia: convenioData.provincia,
          departamento: convenioData.departamento,
          giro_negocio: convenioData.giro_negocio,
        },
      }));
      setConvenioAutoFilled(true);
    } else {
      setForm(p => ({ ...p, datos_convenio: { ...p.datos_convenio, tipo_convenio: selected } }));
      setConvenioAutoFilled(false);
    }
  }, [setForm]);

  /* ── helpers ── */
  const upd = useCallback((section, field, value) => {
    setForm(p => ({ ...p, [section]: { ...p[section], [field]: value } }));
  }, [setForm]);

  const updNested = useCallback((section, sub, field, value) => {
    setForm(p => ({ ...p, [section]: { ...p[section], [sub]: { ...p[section][sub], [field]: value } } }));
  }, [setForm]);

  const updRow = useCallback((table, idx, key, val) => {
    setForm(p => {
      const arr = [...p.compra_deuda[table]];
      arr[idx] = { ...arr[idx], [key]: val };
      return { ...p, compra_deuda: { ...p.compra_deuda, [table]: arr } };
    });
  }, [setForm]);

  const addRow = useCallback((table, empty) => {
    setForm(p => ({ ...p, compra_deuda: { ...p.compra_deuda, [table]: [...p.compra_deuda[table], { ...empty }] } }));
  }, [setForm]);

  const removeRow = useCallback((table, idx) => {
    setForm(p => ({ ...p, compra_deuda: { ...p.compra_deuda, [table]: p.compra_deuda[table].filter((_, i) => i !== idx) } }));
  }, [setForm]);

  /* ── field shortcuts ── */
  const pi = (section, field, label, opts = {}) => (
    <FormInput label={label} name={field} value={form[section][field]} onChange={(e) => upd(section, field, e.target.value)} {...opts} />
  );
  const ps = (section, field, label, options, opts = {}) => (
    <FormSelect label={label} name={field} value={form[section][field]} onChange={(e) => upd(section, field, e.target.value)} options={options} {...opts} />
  );
  const ni = (section, sub, field, label) => (
    <FormInput label={label} name={field} value={form[section][sub][field]} onChange={(e) => updNested(section, sub, field, e.target.value)} />
  );

  const ecOpts = [{ value: 'Soltero', label: 'Soltero/a' }, { value: 'Casado', label: 'Casado/a' }, { value: 'Divorciado', label: 'Divorciado/a' }, { value: 'Viudo', label: 'Viudo/a' }, { value: 'Conviviente', label: 'Conviviente' }];
  const docOpts = [{ value: 'DNI', label: 'DNI' }, { value: 'CE', label: 'Carnet Extranjería' }, { value: 'Pasaporte', label: 'Pasaporte' }];

  return (
    <form ref={formRef} onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-6">
      {/* ── Template Selector + Action Buttons ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 animate-fade-in">
        <FormSelect
          label="Seleccionar Plantilla de PDF" name="plantilla_id" required
          value={form.plantilla_id} onChange={(e) => setForm(p => ({ ...p, plantilla_id: e.target.value }))}
          options={plantillas.map(p => ({ value: p.id, label: `Plantilla ${p.id}: ${p.nombre}` }))}
          placeholder="— Seleccione una plantilla —"
        />
        <div className="flex flex-wrap justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
          <button type="button" onClick={() => setMostrarVistaPrevia(!mostrarVistaPrevia)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-bbva-blue bg-bbva-blue/10 hover:bg-bbva-blue/20 transition-all duration-200 flex items-center gap-2">
            {mostrarVistaPrevia ? (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> Ocultar Vista Previa</>
            ) : (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> Mostrar Vista Previa</>
            )}
          </button>
          <button type="button" onClick={onClearForm}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 transition-all duration-200">
            Limpiar Formulario
          </button>
          <button type="submit" disabled={loading}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-bbva-dark to-bbva-blue hover:from-bbva-blue hover:to-bbva-medium shadow-lg shadow-bbva-blue/25 hover:shadow-bbva-blue/40 transition-all duration-300 disabled:opacity-60 flex items-center gap-2">
            {loading ? (
              <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Procesando...</>
            ) : (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Generar Expediente</>
            )}
          </button>
        </div>
      </div>

      {/* ══════ SECCIÓN 1: CONVENIO ══════ */}
      <AccordionSection title="Convenio" subtitle="Información del acuerdo comercial" icon={<IconBrief />} isOpen={openSections.s1} onToggle={() => toggleSection('s1')}>
        {convenioAutoFilled && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-700 animate-fade-in">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Campos de institución autocompletados desde el catálogo de convenios
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FormSelect
            label="Tipo de Convenio" name="tipo_convenio"
            value={form.datos_convenio.tipo_convenio}
            onChange={handleConvenioChange}
            options={[
              { value: '', label: '— Seleccione —' },
              ...Object.keys(CONVENIOS_DB).map(k => ({ value: k, label: k })),
              { value: 'OTRO', label: 'OTRO (manual)' },
            ]}
          />
          <FormInput label="RUC" name="ruc" value={form.datos_convenio.ruc ?? ''}
            onChange={(e) => upd('datos_convenio', 'ruc', e.target.value)}
            placeholder="20xxxxxxxxx"
          />
          {pi('datos_convenio', 'jefe_negocio', 'Jefe de Negocio')}
          {pi('datos_convenio', 'tasa', 'Tasa (%)', { placeholder: '12.5' })}
          {pi('datos_convenio', 'oficina_derivar', 'Oficina a Derivar')}
          {ps('datos_convenio', 'nombre_supervisor', 'Nombre Supervisor', [{ value: '', label: '— Seleccione —' }, { value: 'JHON QUISPE', label: 'JHON QUISPE' }])}
          {pi('datos_convenio', 'dni_supervisor', 'DNI Supervisor', { placeholder: '12345678' })}
          {pi('datos_convenio', 'nombre_promotor', 'Nombre Promotor')}
          {pi('datos_convenio', 'dni_promotor', 'DNI Promotor', { placeholder: '12345678' })}
        </div>
      </AccordionSection>

      {/* ══════ SECCIÓN 2: DATOS DEL PRÉSTAMO ══════ */}
      <AccordionSection title="Datos del Préstamo" subtitle="Detalles del crédito solicitado" icon={<IconBank />} isOpen={openSections.s2} onToggle={() => toggleSection('s2')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ps('datos_prestamo', 'tipo_prestamo', 'Tipo de Préstamo', [{ value: '', label: '— Seleccione —' }, { value: 'NUEVO', label: 'NUEVO' }, { value: 'SUBROGADO', label: 'SUBROGADO' }, { value: 'AMPLIACION', label: 'AMPLIACION' }, { value: 'SUBROGADO Y AMPLIACION', label: 'SUBROGADO Y AMPLIACION' }])}
          {pi('datos_prestamo', 'monto_solicitado', 'Monto Solicitado (S/)', { type: 'number', placeholder: '10000' })}
          {pi('datos_prestamo', 'plazo', 'Plazo (meses)', { type: 'number', placeholder: '36' })}
          {ps('datos_prestamo', 'periodo_gracia', 'Periodo de Gracia', [{ value: '', label: '— Seleccione —' }, { value: '1 mes', label: '1 mes' }, { value: '2 meses', label: '2 meses' }])}
          {ps('datos_prestamo', 'tipo_seguro', 'Tipo de Seguro', [{ value: '', label: '— Seleccione —' }, { value: 'Individual Convencional', label: 'Individual Convencional' }, { value: 'Mancomunado Convencional', label: 'Mancomunado Convencional' }, { value: 'Individual con Devolución', label: 'Individual con Devolución' }, { value: 'Mancomunado con Devolución', label: 'Mancomunado con Devolución' }])}
        </div>
      </AccordionSection>

      {/* ══════ SECCIÓN 3: DATOS PERSONALES DEL CLIENTE ══════ */}
      <AccordionSection title="Datos Personales del Cliente" subtitle="Información de identidad y contacto" icon={<IconUser />} isOpen={openSections.s3} onToggle={() => toggleSection('s3')}>
        <SubGroup title="Identificación">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ps('datos_personales', 'tipo_documento', 'Tipo Doc.', docOpts)}
            {pi('datos_personales', 'numero_documento', 'Nro. Documento', { required: true, placeholder: '12345678' })}
            {ps('datos_personales', 'sexo', 'Sexo', [{ value: '', label: '— Seleccione —' }, { value: 'Masculino', label: 'Masculino' }, { value: 'Femenino', label: 'Femenino' }])}
            {pi('datos_personales', 'fecha_nacimiento', 'Fec. Nacimiento', { type: 'date' })}
            {pi('datos_personales', 'fecha_firma', 'Fec. Firma', { type: 'date' })}
          </div>
        </SubGroup>
        <SubGroup title="Nombre Completo">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pi('datos_personales', 'apellido_paterno', 'Ap. Paterno', { required: true })}
            {pi('datos_personales', 'apellido_materno', 'Ap. Materno', { required: true })}
            {pi('datos_personales', 'primer_nombre', 'Primer Nombre', { required: true })}
            {pi('datos_personales', 'segundo_nombre', 'Segundo Nombre')}
          </div>
        </SubGroup>
        <SubGroup title="Datos Adicionales">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ps('datos_personales', 'estado_civil', 'Estado Civil', [{ value: '', label: '— Seleccione —' }, ...ecOpts])}
            {ps('datos_personales', 'nivel_educacion', 'Nivel Educación', [{ value: '', label: '— Seleccione —' }, { value: 'Secundaria', label: 'Secundaria' }, { value: 'Universitaria', label: 'Universitaria' }, { value: 'Técnica', label: 'Técnica' }])}
            {pi('datos_personales', 'email', 'E-mail', { type: 'email', placeholder: 'correo@ejemplo.com' })}
            {pi('datos_personales', 'telefono_celular', 'Teléfono Celular', { placeholder: '999 999 999' })}
            {pi('datos_personales', 'talla', 'Talla (m)', { placeholder: '1.70' })}
            {pi('datos_personales', 'peso', 'Peso (kg)', { placeholder: '70' })}
          </div>
        </SubGroup>
      </AccordionSection>

      {/* ══════ SECCIÓN 4: DATOS DE DOMICILIO ══════ */}
      <AccordionSection title="Datos de Domicilio" subtitle="Dirección de residencia actual" icon={<IconUser />} isOpen={openSections.s4} onToggle={() => toggleSection('s4')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ps('datos_personales', 'domicilio_actual', 'Situación de Vivienda', [{ value: '', label: '— Seleccione —' }, { value: 'Familiar', label: 'Familiar' }, { value: 'Financiada', label: 'Financiada' }, { value: 'Alquilada', label: 'Alquilada' }, { value: 'Propia', label: 'Propia' }])}
          {pi('datos_personales', 'tipo_via', 'Av./Calle/Jr.', { placeholder: 'Av. Ejemplo' })}
          {pi('datos_personales', 'numero_lt', 'Número / Lt')}
          {pi('datos_personales', 'dpto_int', 'Dpto / Int')}
          {pi('datos_personales', 'urbanizacion', 'Urbanización')}
          {pi('datos_personales', 'distrito', 'Distrito')}
          {pi('datos_personales', 'provincia', 'Provincia')}
          {pi('datos_personales', 'departamento', 'Departamento')}
          {pi('datos_personales', 'localidad', 'Localidad')}
        </div>
      </AccordionSection>

      {/* ══════ SECCIÓN 5: DATOS LABORALES ══════ */}
      <AccordionSection title="Datos Laborales" subtitle="Información sobre su empleo actual" icon={<IconBrief />} isOpen={openSections.s5} onToggle={() => toggleSection('s5')}>
        <SubGroup title="Empleo y Ubicación">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pi('datos_laborales', 'giro_empresa', 'Giro de Empresa')}
            {pi('datos_personales', 'cargo_actual', 'Cargo Actual')}
            {pi('datos_laborales', 'fecha_ingreso', 'Fecha de Ingreso', { type: 'date' })}
            {pi('datos_laborales', 'tipo_via', 'Av./Calle/Jr.', { placeholder: 'Av. Laboral' })}
            {pi('datos_laborales', 'numero_lt', 'Número / Lt')}
            {pi('datos_laborales', 'dpto_int', 'Dpto / Int')}
            {pi('datos_laborales', 'distrito', 'Distrito')}
            {pi('datos_laborales', 'provincia', 'Provincia')}
            {pi('datos_laborales', 'departamento', 'Departamento')}
          </div>
        </SubGroup>
        <SubGroup title="Instituciones Especiales (Opcional)">
          <div className="space-y-2">
            {/* Ministerio Público */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button type="button" onClick={() => setInstOpen(p => ({ ...p, mp: !p.mp }))} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                <span>Ministerio Público</span>
                <svg className={`w-4 h-4 transition-transform ${instOpen.mp ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {instOpen.mp && (
                <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
                  {ni('instituciones_especiales', 'ministerio_publico', 'airhsp', 'AIRHSP')}
                  {ni('instituciones_especiales', 'ministerio_publico', 'regimen_laboral', 'Régimen Laboral')}
                  {ni('instituciones_especiales', 'ministerio_publico', 'dependencia', 'Dependencia')}
                </div>
              )}
            </div>
            {/* FFAA */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button type="button" onClick={() => setInstOpen(p => ({ ...p, ffaa: !p.ffaa }))} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                <span>FFAA / PNP</span>
                <svg className={`w-4 h-4 transition-transform ${instOpen.ffaa ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {instOpen.ffaa && (
                <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
                  {ni('instituciones_especiales', 'ffaa', 'cip', 'CIP')}
                  {ni('instituciones_especiales', 'ffaa', 'godofin', 'GODOFIN')}
                  {ni('instituciones_especiales', 'ffaa', 'grado', 'Grado')}
                  {ni('instituciones_especiales', 'ffaa', 'dependencia', 'Dependencia')}
                </div>
              )}
            </div>
            {/* ESSALUD */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button type="button" onClick={() => setInstOpen(p => ({ ...p, essalud: !p.essalud }))} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                <span>ESSALUD</span>
                <svg className={`w-4 h-4 transition-transform ${instOpen.essalud ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {instOpen.essalud && (
                <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                  {ni('instituciones_especiales', 'essalud', 'codigo', 'Código')}
                  {ni('instituciones_especiales', 'essalud', 'sede', 'Sede')}
                </div>
              )}
            </div>
          </div>
        </SubGroup>
      </AccordionSection>

      {/* ══════ SECCIÓN 6: COMPRA DE DEUDA ══════ */}
      <AccordionSection title="Compra de Deuda" subtitle="Detalle de préstamos y tarjetas de crédito vigentes" icon={<IconBank />} isOpen={openSections.s6} onToggle={() => toggleSection('s6')}>
        <DynamicTable title="Préstamos" columns={colsPrestamo} rows={form.compra_deuda.prestamos}
          onRowChange={(i, k, v) => updRow('prestamos', i, k, v)}
          onAddRow={() => addRow('prestamos', emptyPrestamo)}
          onRemoveRow={(i) => removeRow('prestamos', i)}
        />
        <DynamicTable title="Tarjetas de Crédito" columns={colsTarjeta} rows={form.compra_deuda.tarjetas}
          onRowChange={(i, k, v) => updRow('tarjetas', i, k, v)}
          onAddRow={() => addRow('tarjetas', emptyTarjeta)}
          onRemoveRow={(i) => removeRow('tarjetas', i)}
        />
        {/* Totales */}
        <div className="mt-6 bg-gradient-to-r from-bbva-sky/80 to-bbva-light/50 rounded-xl p-5 border border-bbva-light">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-bbva-dark mb-3">Resumen de Compra de Deuda</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/80 rounded-lg p-3 text-center border border-white">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Total Préstamos</p>
              <p className="text-lg font-bold text-bbva-dark">S/ {totalPrestamos.toFixed(2)}</p>
            </div>
            <div className="bg-white/80 rounded-lg p-3 text-center border border-white">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Total TC</p>
              <p className="text-lg font-bold text-bbva-dark">S/ {totalTC.toFixed(2)}</p>
            </div>
            <div className="bg-white/80 rounded-lg p-3 text-center border border-bbva-aqua/30">
              <p className="text-[10px] uppercase tracking-wider text-bbva-blue mb-1">Total CD</p>
              <p className="text-xl font-bold text-bbva-blue">S/ {totalCD.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </AccordionSection>

      <div className="pb-8" />
    </form>
  );
}
