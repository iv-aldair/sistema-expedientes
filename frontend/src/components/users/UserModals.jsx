import { useState } from 'react';
import { X, KeyRound, Pencil, ChevronDown } from 'lucide-react';

const API = `${import.meta.env.VITE_API_URL}/api/users`;

/* ── Modal Editar Rol ──────────────────────────────────────────────────────── */
export function UserEditRoleModal({ user, onClose, onSaved }) {
  const [role, setRole]     = useState(user.role || 'user');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API}/${user.id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.detail || 'Error al actualizar rol');
        return;
      }

      setSuccess('Rol actualizado exitosamente');
      setTimeout(() => { onSaved(); onClose(); }, 1200);
    } catch {
      setError('Error de conexión al actualizar rol');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell
      icon={<Pencil className="w-5 h-5 text-white" />}
      iconBg="bg-gradient-to-br from-blue-600 to-blue-700"
      title="Editar Rol"
      subtitle={user.email}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Rol</label>
          <div className="relative">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm text-slate-700 outline-none appearance-none
                         focus:border-blue-500 focus:bg-blue-50/30 transition-all duration-300 bg-white cursor-pointer"
            >
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {error   && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}
        {success && <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-sm text-green-600">{success}</div>}

        <SubmitButton loading={loading} label="Guardar Cambios" color="blue" />
      </form>
    </ModalShell>
  );
}

/* ── Modal Cambiar Contraseña ──────────────────────────────────────────────── */
export function UserPasswordModal({ user, onClose, onSaved }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API}/${user.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.detail || 'Error al cambiar contraseña');
        return;
      }

      setSuccess('Contraseña actualizada exitosamente');
      setTimeout(() => { onSaved?.(); onClose(); }, 1200);
    } catch {
      setError('Error de conexión al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell
      icon={<KeyRound className="w-5 h-5 text-white" />}
      iconBg="bg-gradient-to-br from-amber-500 to-amber-600"
      title="Cambiar Contraseña"
      subtitle={user.email}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Nueva Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoFocus
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm text-slate-700 outline-none
                       focus:border-amber-400 focus:bg-amber-50/20 transition-all duration-300 placeholder:text-slate-400"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        {error   && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}
        {success && <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-sm text-green-600">{success}</div>}

        <SubmitButton loading={loading} label="Actualizar Contraseña" color="amber" />
      </form>
    </ModalShell>
  );
}

/* ── Primitivos compartidos ────────────────────────────────────────────────── */
function ModalShell({ icon, iconBg, title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${iconBg}`}>
              {icon}
            </div>
            <div>
              <h3 className="font-bold text-slate-800">{title}</h3>
              <p className="text-xs text-slate-400">{subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SubmitButton({ loading, label, color }) {
  const colors = {
    blue:  'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-600/20',
    amber: 'from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/20',
  };
  return (
    <button
      type="submit"
      disabled={loading}
      className={`w-full py-3 rounded-xl text-white font-semibold text-sm bg-gradient-to-r
                 shadow-lg hover:scale-[1.02] active:scale-[0.98]
                 transition-all duration-200 disabled:opacity-60 ${colors[color] || colors.blue}`}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          Procesando...
        </div>
      ) : label}
    </button>
  );
}
