import { useState, useEffect, useRef } from 'react';

const API = import.meta.env.VITE_API_URL;

const IconUpload = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const IconTrash = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const IconPencil = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const IconPDF = () => (
  <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="currentColor">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h5v7h7v9H6z" />
    <path d="M8 14h1.5c.83 0 1.5.45 1.5 1s-.67 1-1.5 1H9v1.5H8V14zm1 1.5h.5c.28 0 .5-.11.5-.25s-.22-.25-.5-.25H9v.5zM12 14h1.5c.83 0 1.5.67 1.5 1.5S14.33 17 13.5 17H13v.5h-1V14zm1 2.5h.5c.28 0 .5-.22.5-.5s-.22-.5-.5-.5H13v1zM16 14h2v.75h-1.25v.5H18v.75h-1.25V17.5H16V14z" />
  </svg>
);

export default function ConfigAutoPage() {
  const [plantillas, setPlantillas] = useState([]);
  const [nombre, setNombre] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [deleting, setDeleting] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const fileRef = useRef(null);

  /* ── Cargar plantillas ── */
  const fetchPlantillas = async () => {
    try {
      const res = await fetch(`${API}/api/plantillas`);
      const data = await res.json();
      setPlantillas(data.plantillas || []);
    } catch { /* silencioso */ }
  };

  useEffect(() => { fetchPlantillas(); }, []);

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setNombre('');
    setArchivo(null);
    if (fileRef.current) fileRef.current.value = '';
    setStatus({ type: '', message: '' });
  };

  const handleEdit = (p) => {
    setIsEditing(true);
    setEditingId(p.id);
    setNombre(p.nombre);
    setArchivo(null);
    if (fileRef.current) fileRef.current.value = '';
    setStatus({ type: 'success', message: `Editando plantilla: ${p.nombre}. Seleccione el nuevo PDF para actualizar.` });
  };

  /* ── Subir / Actualizar plantilla ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) { setStatus({ type: 'error', message: 'Ingrese un nombre para la plantilla.' }); return; }
    if (!archivo) { setStatus({ type: 'error', message: 'Seleccione un archivo PDF.' }); return; }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const formData = new FormData();
      formData.append('nombre_plantilla', nombre.trim());
      formData.append('archivo', archivo);

      const res = await fetch(`${API}/api/plantillas/upload`, { method: 'POST', body: formData });
      const data = await res.json();

      if (res.ok) {
        setStatus({ type: 'success', message: data.mensaje || 'Plantilla guardada.' });
        handleCancelEdit(); // Limpia y vuelve al estado de "Nueva Plantilla"
        await fetchPlantillas();
      } else {
        setStatus({ type: 'error', message: data.detail || 'Error al subir.' });
      }
    } catch {
      setStatus({ type: 'error', message: 'No se pudo conectar con el servidor.' });
    } finally {
      setLoading(false);
    }
  };

  /* ── Eliminar plantilla ── */
  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      const res = await fetch(`${API}/api/plantillas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchPlantillas();
        setStatus({ type: 'success', message: 'Plantilla eliminada correctamente.' });
        if (isEditing && editingId === id) {
          handleCancelEdit();
        }
      }
    } catch { /* silencioso */ }
    finally { setDeleting(null); }
  };

  const fileLabel = archivo ? archivo.name : 'Ningún archivo seleccionado';

  return (
    <div className="p-6 lg:p-8 max-w-[900px] mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-800">Configuración Autollenado</h1>
        <p className="text-slate-400 text-sm mt-1">Administra las plantillas PDF disponibles para el módulo de autollenado</p>
      </div>

      {/* Alerts */}
      {status.message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-fade-in ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {status.type === 'success' ? '✓' : '✕'} {status.message}
          <button onClick={() => setStatus({ type: '', message: '' })} className="ml-auto text-lg leading-none opacity-50 hover:opacity-100">×</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Upload Card ── */}
        <div className="lg:col-span-2 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden h-full transition-all">
            <div className={`px-6 py-4 border-b border-slate-100 flex items-center gap-3 transition-colors ${isEditing ? 'bg-gradient-to-r from-yellow-50 to-white' : 'bg-gradient-to-r from-bbva-sky/60 to-white'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isEditing ? 'bg-yellow-100/50 text-yellow-600' : 'bg-bbva-blue/10 text-bbva-blue'}`}>
                {isEditing ? <IconPencil /> : <IconUpload />}
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-bbva-dark">{isEditing ? 'Editar Plantilla' : 'Nueva Plantilla'}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{isEditing ? 'Sube el nuevo archivo PDF' : 'Sube un archivo PDF'}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Nombre */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1.5 uppercase tracking-wide">
                  Nombre de la Plantilla <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Solicitud Essalud 2026"
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-300 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-bbva-blue/20 focus:border-bbva-blue transition-all duration-200"
                />
              </div>

              {/* File input */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1.5 uppercase tracking-wide">
                  Archivo PDF <span className="text-red-400">*</span>
                </label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className={`group cursor-pointer border-2 border-dashed border-slate-200 hover:border-bbva-blue/40 rounded-xl p-6 text-center transition-all duration-200 ${isEditing ? 'hover:bg-yellow-50/30' : 'hover:bg-bbva-sky/30'}`}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <div className={`w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center transition-colors ${isEditing ? 'bg-yellow-50 text-yellow-500 group-hover:bg-yellow-100' : 'bg-bbva-sky text-bbva-blue group-hover:bg-bbva-light'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p className={`text-xs transition-colors ${isEditing ? 'text-slate-500 group-hover:text-yellow-600' : 'text-slate-500 group-hover:text-bbva-blue'}`}>
                    {archivo ? (
                      <span className="font-medium text-bbva-dark">{fileLabel}</span>
                    ) : (
                      <>Click para seleccionar <span className="font-medium">.pdf</span></>
                    )}
                  </p>
                  {archivo && (
                    <p className="text-[10px] text-slate-400 mt-1">{(archivo.size / 1024).toFixed(1)} KB</p>
                  )}
                </div>
              </div>

              {/* Submit / Actions */}
              <div className="flex gap-2 pt-2">
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={loading}
                    className="w-1/3 py-3 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all duration-300 disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className={`${isEditing ? 'w-2/3 from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 shadow-yellow-500/25 hover:shadow-yellow-500/40' : 'w-full from-bbva-dark to-bbva-blue hover:from-bbva-blue hover:to-bbva-medium shadow-bbva-blue/25 hover:shadow-bbva-blue/40'} py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r shadow-lg transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2`}
                >
                  {loading ? (
                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Subiendo...</>
                  ) : (
                    <>{isEditing ? <IconPencil /> : <IconUpload />} {isEditing ? 'Actualizar' : 'Guardar'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Template List Card ── */}
        <div className="lg:col-span-3 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-bbva-sky/60 to-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-bbva-blue/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-bbva-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-bbva-dark">Plantillas Registradas</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{plantillas.length} plantilla{plantillas.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <button
                onClick={fetchPlantillas}
                className="p-2 text-slate-400 hover:text-bbva-blue hover:bg-bbva-sky rounded-lg transition-all"
                title="Refrescar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
              {plantillas.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-slate-400 text-sm">No hay plantillas registradas.</p>
                </div>
              ) : (
                plantillas.map((p, idx) => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 px-6 py-3.5 hover:bg-slate-50/80 transition-colors group ${isEditing && editingId === p.id ? 'bg-yellow-50/40' : ''}`}
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                      <IconPDF />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{p.nombre}</p>
                      <p className="text-[10px] text-slate-400">Archivo: {p.archivo || `${p.id}.pdf`}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => handleEdit(p)}
                        disabled={deleting === p.id}
                        className="p-2 text-slate-300 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg disabled:opacity-50 transition-colors"
                        title="Editar plantilla"
                      >
                        <IconPencil />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deleting === p.id}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50 transition-colors"
                        title="Eliminar plantilla"
                      >
                        {deleting === p.id ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        ) : (
                          <IconTrash />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
