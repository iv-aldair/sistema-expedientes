import { useState, useEffect, useRef } from 'react';



const API = 'http://localhost:8000';

export default function ParticionPage() {
  const [plantillas, setPlantillas] = useState([]);
  const [plantillaId, setPlantillaId] = useState('');
  const [nombres, setNombres] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const fileRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/api/particion/plantillas`)
      .then(res => res.json())
      .then(data => setPlantillas(data.plantillas || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!plantillaId) { setStatus({ type: 'error', message: 'Seleccione una plantilla de corte.' }); return; }
    if (!nombres.trim()) { setStatus({ type: 'error', message: 'Ingrese apellidos y nombres.' }); return; }
    if (!archivo) { setStatus({ type: 'error', message: 'Seleccione un archivo PDF.' }); return; }

    const apellidosNombres = nombres.trim();
    const fileName = `${apellidosNombres.replace(/\s+/g, '_')}.zip`;
    let fileHandle = null;

    // 1. SOLUCIÓN VENTANITA: Pedir ubicación AL PRINCIPIO (mientras el clic está fresco)
    if (window.showSaveFilePicker) {
      try {
        fileHandle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [{ description: 'Archivo ZIP', accept: { 'application/zip': ['.zip'] } }],
        });
      } catch (err) {
        if (err.name === 'AbortError') return; // El usuario canceló la ventana, no hacemos nada
        console.warn("La API nativa falló al inicio, se usará descarga automática al final:", err);
      }
    }

    setLoading(true); setStatus({ type: '', message: '' });

    try {
      const formData = new FormData();
      formData.append('archivo', archivo);
      formData.append('plantilla_id', plantillaId);
      formData.append('apellidos_nombres', apellidosNombres);

      const res = await fetch(`${API}/api/particion/procesar`, { method: 'POST', body: formData });

      if (!res.ok) {
        const err = await res.json();
        setStatus({ type: 'error', message: err.detail || 'Error al procesar.' });
        return; // El bloque finally igual se ejecutará
      }

      const blob = await res.blob();

      // 2. Escribir directamente en el archivo que el usuario eligió al inicio
      if (fileHandle) {
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        // Fallback clásico si la API no funcionó
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }

      // 3. Notificar Éxito
      setStatus({ type: 'success', message: `¡"${fileName}" guardado exitosamente!` });

    } catch (error) {
      // 4. Manejo de Errores (para el fetch o conversión a blob)
      console.error(error);
      setStatus({ type: 'error', message: 'Hubo un problema al procesar o guardar el archivo.' });
    } finally {
      // 5. APAGAR EL BOTÓN SIEMPRE
      setLoading(false);
    }
  };

  const selectedPlantilla = plantillas.find(p => p.id === plantillaId);

  return (
    <div className="p-6 lg:p-8 max-w-[800px] mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-800">Partición PDF</h1>
        <p className="text-slate-400 text-sm mt-1">Sube un PDF grande, selecciona una plantilla de corte y descarga un ZIP con los fragmentos</p>
      </div>

      {status.message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-fade-in ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {status.type === 'success' ? '✓' : '✕'} {status.message}
          <button onClick={() => setStatus({ type: '', message: '' })} className="ml-auto text-lg leading-none opacity-50 hover:opacity-100">×</button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden animate-fade-in">
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-bbva-sky/60 to-white flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-bbva-blue/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-bbva-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243z" />
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-bbva-dark">Cortar y Generar ZIP</h2>
              <p className="text-xs text-slate-400 mt-0.5">Selecciona plantilla, sube el PDF y descarga los fragmentos</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Plantilla selector */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1.5 uppercase tracking-wide">
                Plantilla de Corte <span className="text-red-400">*</span>
              </label>
              <select value={plantillaId} onChange={(e) => setPlantillaId(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-bbva-blue/20 focus:border-bbva-blue transition-all duration-200 appearance-none cursor-pointer">
                <option value="">— Seleccione una plantilla de corte —</option>
                {plantillas.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre} ({p.cortes?.length || 0} cortes)</option>
                ))}
              </select>
            </div>

            {/* Preview of cuts */}
            {selectedPlantilla && selectedPlantilla.cortes?.length > 0 && (
              <div className="bg-bbva-sky/40 rounded-xl p-4 border border-bbva-light/50 animate-fade-in">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-bbva-dark mb-2">Cortes configurados</p>
                <div className="flex flex-wrap gap-2">
                  {selectedPlantilla.cortes.map((c, i) => (
                    <span key={i} className="px-2.5 py-1 bg-white rounded-lg text-xs font-medium text-slate-600 border border-slate-200 shadow-sm">
                      📄 {c.nombre_corte}.pdf <span className="text-slate-400">(pág. {c.paginas || `${c.inicio}–${c.fin}`})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Apellidos */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1.5 uppercase tracking-wide">
                Apellidos y Nombres <span className="text-red-400">*</span>
              </label>
              <input type="text" value={nombres} onChange={(e) => setNombres(e.target.value)}
                placeholder="Ej: Garcia Lopez Juan Carlos"
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-300 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-bbva-blue/20 focus:border-bbva-blue transition-all duration-200" />
            </div>

            {/* File upload */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1.5 uppercase tracking-wide">
                Archivo PDF <span className="text-red-400">*</span>
              </label>
              <div onClick={() => fileRef.current?.click()}
                className="group cursor-pointer border-2 border-dashed border-slate-200 hover:border-bbva-blue/40 rounded-xl p-6 text-center transition-all duration-200 hover:bg-bbva-sky/30">
                <input ref={fileRef} type="file" accept=".pdf" onChange={(e) => setArchivo(e.target.files?.[0] || null)} className="hidden" />
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-bbva-sky flex items-center justify-center group-hover:bg-bbva-light transition-colors">
                  <svg className="w-5 h-5 text-bbva-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-xs text-slate-500 group-hover:text-bbva-blue transition-colors">
                  {archivo ? (
                    <><span className="font-medium text-bbva-dark">{archivo.name}</span> <span className="text-slate-400">({(archivo.size / 1024).toFixed(1)} KB)</span></>
                  ) : (
                    <>Click para seleccionar el <span className="font-medium">PDF grande</span></>
                  )}
                </p>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-bbva-dark to-bbva-blue hover:from-bbva-blue hover:to-bbva-medium shadow-lg shadow-bbva-blue/25 hover:shadow-bbva-blue/40 transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Procesando...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243z" /></svg> Cortar y Generar ZIP</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
