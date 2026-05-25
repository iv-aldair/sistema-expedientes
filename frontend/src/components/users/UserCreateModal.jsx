import { useState } from 'react';
import { X, Plus, ChevronDown } from 'lucide-react';

const API = 'http://localhost:8000/api/users';

/* ── Modal Crear Usuario ───────────────────────────────────────────────────── */
export default function UserCreateModal({ onClose, onCreated }) {
  const [formData, setFormData] = useState({ email: '', password: '', role: 'user' });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.detail || 'Error al crear usuario');
        return;
      }

      setSuccess('Usuario creado exitosamente');
      setTimeout(() => {
        onCreated();
        onClose();
      }, 1200);
    } catch {
      setError('Error de conexión al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Nuevo Usuario</h3>
              <p className="text-xs text-slate-400">Registrar una nueva cuenta</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm text-slate-700 outline-none
                         focus:border-blue-500 focus:bg-blue-50/30 transition-all duration-300 placeholder:text-slate-400"
              placeholder="usuario@correo.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm text-slate-700 outline-none
                         focus:border-blue-500 focus:bg-blue-50/30 transition-all duration-300 placeholder:text-slate-400"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          {/* Rol */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Rol
            </label>
            <div className="relative">
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm text-slate-700 outline-none appearance-none
                           focus:border-blue-500 focus:bg-blue-50/30 transition-all duration-300 bg-white cursor-pointer"
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Feedback */}
          {error   && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}
          {success && <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-sm text-green-600">{success}</div>}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm
                       bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800
                       shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98]
                       transition-all duration-200 disabled:opacity-60"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Procesando...
              </div>
            ) : 'Crear Usuario'}
          </button>
        </form>
      </div>
    </div>
  );
}
