import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL;

export default function ConfigParticionPage() {
  const { session, userRole } = useAuth();
  const [plantillas, setPlantillas] = useState([]);
  const [nombre, setNombre] = useState('');
  const [cortes, setCortes] = useState([{ nombre_corte: '', paginas: '' }]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [editingId, setEditingId] = useState(null);

  const fetchPlantillas = async () => {
    try {
      const userId = session?.user?.id || '';
      const role = userRole || 'user';
      const params = new URLSearchParams({ user_id: userId, role });
      const res = await fetch(`${API}/api/particion/plantillas?${params}`);
      const data = await res.json();
      setPlantillas(data.plantillas || []);
    } catch { /* silent */ }
  };

  useEffect(() => { fetchPlantillas(); }, []);

  const updateCorte = (idx, key, val) => {
    setCortes(prev => {
      const arr = [...prev];
      arr[idx] = { ...arr[idx], [key]: val };
      return arr;
    });
  };

  const addCorte = () => setCortes(prev => [...prev, { nombre_corte: '', paginas: '' }]);

  const removeCorte = (idx) => setCortes(prev => prev.filter((_, i) => i !== idx));

  const resetForm = () => {
    setNombre('');
    setCortes([{ nombre_corte: '', paginas: '' }]);
    setEditingId(null);
  };

  const handleEdit = (plantilla) => {
    setEditingId(plantilla.id);
    setNombre(plantilla.nombre);
    // Normalizar cortes: asegurar que todos tengan nombre_corte y paginas
    const cortesNormalizados = (plantilla.cortes || []).map(c => ({
      nombre_corte: c.nombre_corte || '',
      paginas: c.paginas || (c.inicio && c.fin ? `${c.inicio}-${c.fin}` : ''),
    }));
    setCortes(cortesNormalizados.length > 0 ? cortesNormalizados : [{ nombre_corte: '', paginas: '' }]);
    setStatus({ type: '', message: '' });
    // Scroll al formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) { setStatus({ type: 'error', message: 'Ingrese un nombre.' }); return; }
    if (cortes.some(c => !c.nombre_corte || !c.paginas)) {
      setStatus({ type: 'error', message: 'Complete nombre y páginas de cada corte.' }); return;
    }
    setLoading(true); setStatus({ type: '', message: '' });
    try {
      const url = editingId
        ? `${API}/api/particion/plantillas/${editingId}`
        : `${API}/api/particion/plantillas`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          cortes,
          user_id: session?.user?.id || '',
          role: userRole || 'user',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', message: data.mensaje || (editingId ? 'Actualizada.' : 'Guardada.') });
        resetForm();
        await fetchPlantillas();
      } else {
        setStatus({ type: 'error', message: data.detail || 'Error.' });
      }
    } catch { setStatus({ type: 'error', message: 'Sin conexión.' }); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar la plantilla?")) return;
    try {
      await fetch(`${API}/api/particion/plantillas/${id}`, { method: 'DELETE' });
      // Si estamos editando la que se elimina, limpiar el form
      if (editingId === id) resetForm();
      await fetchPlantillas();
      setStatus({ type: 'success', message: 'Plantilla eliminada.' });
    } catch { /* silent */ }
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1000px] mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-800">Configuración Partición</h1>
        <p className="text-slate-400 text-sm mt-1">Define plantillas de corte para dividir PDFs grandes en partes</p>
      </div>

      {status.message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-fade-in ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {status.type === 'success' ? '✓' : '✕'} {status.message}
          <button onClick={() => setStatus({ type: '', message: '' })} className="ml-auto text-lg leading-none opacity-50 hover:opacity-100">×</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Form Card ── */}
        <div className="lg:col-span-3 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-bbva-sky/60 to-white flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-bbva-blue/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-bbva-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243z" />
                </svg>
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-bbva-dark">
                  {editingId ? 'Editar Plantilla de Corte' : 'Nueva Plantilla de Corte'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {editingId ? `Editando plantilla ID: ${editingId}` : 'Define nombre y rangos de páginas'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Nombre */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1.5 uppercase tracking-wide">
                  Nombre de la Plantilla <span className="text-red-400">*</span>
                </label>
                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Corte Estándar 15 páginas"
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-300 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-bbva-blue/20 focus:border-bbva-blue transition-all duration-200" />
              </div>

              {/* Dynamic table */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-2 uppercase tracking-wide">
                  Reglas de Corte <span className="text-red-400">*</span>
                </label>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-[140px_1fr_40px] gap-0 bg-slate-50 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <span>Nombre archivo</span><span>Páginas (ej: 1-3, 5, 8-10)</span><span className="text-center">Quitar</span>
                  </div>
                  <div className="bg-slate-50/50 p-2 space-y-2">
                    {cortes.map((c, i) => (
                      <div key={i} className="grid grid-cols-[140px_1fr_40px] gap-3 px-3 py-2.5 bg-white rounded-xl border border-slate-200/60 shadow-sm items-center hover:border-bbva-blue/30 hover:shadow-md transition-all">
                        <input type="text" value={c.nombre_corte} onChange={(e) => updateCorte(i, 'nombre_corte', e.target.value)}
                          placeholder="CS" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-bbva-blue/20 focus:border-bbva-blue transition-all" />
                        <input type="text" value={c.paginas} onChange={(e) => updateCorte(i, 'paginas', e.target.value)}
                          placeholder="Ej: 1-3, 5, 8-10" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-bbva-blue/20 focus:border-bbva-blue transition-all" />
                        <button type="button" onClick={() => removeCorte(i)} disabled={cortes.length <= 1}
                          className="p-2 text-slate-300 bg-slate-50 rounded-lg hover:text-red-500 hover:bg-red-50 disabled:opacity-30 transition-all mx-auto shadow-sm border border-slate-100">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <button type="button" onClick={addCorte}
                  className="mt-2 px-3 py-1.5 text-xs font-medium text-bbva-blue border border-bbva-light rounded-lg hover:bg-bbva-sky transition-colors flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Agregar fila
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {editingId && (
                  <button type="button" onClick={resetForm}
                    className="flex-1 py-3 rounded-xl text-sm font-medium text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 transition-all duration-200">
                    Cancelar Edición
                  </button>
                )}
                <button type="submit" disabled={loading}
                  className={`${editingId ? 'flex-1' : 'w-full'} py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-bbva-dark to-bbva-blue hover:from-bbva-blue hover:to-bbva-medium shadow-lg shadow-bbva-blue/25 hover:shadow-bbva-blue/40 transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2`}>
                  {loading ? (
                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> {editingId ? 'Actualizando...' : 'Guardando...'}</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> {editingId ? 'Actualizar Plantilla' : 'Guardar Plantilla de Corte'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Saved templates list ── */}
        <div className="lg:col-span-2 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-bbva-sky/60 to-white flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-bbva-blue/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-bbva-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-bbva-dark">Plantillas Guardadas</h2>
                <p className="text-xs text-slate-400 mt-0.5">{plantillas.length} plantilla{plantillas.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {plantillas.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-slate-400 text-sm">No hay plantillas de corte.</p>
                </div>
              ) : (
                plantillas.map((p) => (
                  <div key={p.id} className={`px-6 py-3.5 hover:bg-slate-50/80 transition-colors group ${editingId === p.id ? 'bg-bbva-sky/30 border-l-2 border-bbva-blue' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{p.nombre}</p>
                        <p className="text-[10px] text-slate-400">ID: {p.id} · {p.cortes?.length || 0} corte{(p.cortes?.length || 0) !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {/* Botón Editar */}
                        <button onClick={() => handleEdit(p)}
                          className="p-2 text-slate-400 hover:text-bbva-blue hover:bg-bbva-sky rounded-lg transition-all"
                          title="Editar plantilla">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {/* Botón Eliminar */}
                        <button onClick={() => handleDelete(p.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Eliminar plantilla">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {p.cortes && p.cortes.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {p.cortes.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 bg-bbva-sky text-bbva-dark text-[10px] font-medium rounded-md">
                            {c.nombre_corte} (pág. {c.paginas || `${c.inicio}-${c.fin}`})
                          </span>
                        ))}
                      </div>
                    )}
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
