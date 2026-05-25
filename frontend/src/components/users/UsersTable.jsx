import { Shield, User as UserIcon, Pencil, KeyRound, Trash2, Users } from 'lucide-react';

/* ── Badge de rol ──────────────────────────────────────────────────────────── */
export function RoleBadge({ role }) {
  const styles = {
    admin:    'bg-blue-100 text-blue-700 border-blue-200',
    user:     'bg-slate-100 text-slate-600 border-slate-200',
    inactive: 'bg-red-50 text-red-500 border-red-200',
  };
  const labels = { admin: 'Admin', user: 'Usuario', inactive: 'Inactivo' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${styles[role] || styles.user}`}>
      {role === 'admin' ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
      {labels[role] || role}
    </span>
  );
}

/* ── Tabla de usuarios ─────────────────────────────────────────────────────── */
export default function UsersTable({
  users,
  loading,
  currentUserId,
  deleteConfirm,
  deleteLoading,
  onEdit,
  onPassword,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Users className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm">No se encontraron usuarios</p>
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-slate-100">
          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Correo</th>
          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Rol</th>
          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Fecha Registro</th>
          <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr
            key={user.id}
            className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors duration-150"
          >
            {/* Correo */}
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shrink-0">
                  <span className="text-slate-600 font-semibold text-sm">
                    {user.email?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
                <span className="text-sm font-medium text-slate-700">{user.email}</span>
              </div>
            </td>

            {/* Rol */}
            <td className="px-6 py-4">
              <RoleBadge role={user.role} />
            </td>

            {/* Fecha */}
            <td className="px-6 py-4 text-sm text-slate-400">
              {user.created_at
                ? new Date(user.created_at).toLocaleDateString('es-MX', {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })
                : '—'}
            </td>

            {/* Acciones */}
            <td className="px-6 py-4 text-right">
              <div className="flex items-center justify-end gap-2">
                {user.id !== currentUserId ? (
                  <>
                    <button
                      onClick={() => onEdit(user)}
                      className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Editar rol"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onPassword(user)}
                      className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                      title="Cambiar contraseña"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                    {deleteConfirm === user.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onDeleteConfirm(user.id)}
                          disabled={deleteLoading}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60"
                        >
                          {deleteLoading ? '...' : 'Confirmar'}
                        </button>
                        <button
                          onClick={onDeleteCancel}
                          className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onDeleteRequest(user.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-slate-400 italic">Tú</span>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
