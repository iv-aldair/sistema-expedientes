import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, Search } from 'lucide-react';

import UsersTable from '../components/users/UsersTable';
import UserCreateModal from '../components/users/UserCreateModal';
import { UserEditRoleModal, UserPasswordModal } from '../components/users/UserModals';

const API = `${import.meta.env.VITE_API_URL}/api/users`;

/* ══════════════════════════════════════════════════════════════════════════════
   UsersModule — CONTROLADOR
   Solo gestiona: estado de UI (modales, selección), llamadas fetch, y
   coordina los sub-componentes. No contiene JSX de tabla ni de formulario.
   ══════════════════════════════════════════════════════════════════════════════ */
export default function UsersModule() {
  const { session } = useAuth();

  // ── Datos ────────────────────────────────────────────────────────────────
  const [users, setUsers]           = useState([]);
  const [loadingUsers, setLoading]  = useState(true);
  const [searchTerm, setSearch]     = useState('');

  // ── UI de modales ─────────────────────────────────────────────────────────
  const [showCreate, setShowCreate]       = useState(false);
  const [editingUser, setEditingUser]     = useState(null); // { mode: 'role'|'password', user }
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Carga de usuarios ─────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error(await res.text());
      
      const data = await res.json();
      console.log("[UsersModule] Respuesta cruda:", data);
      
      // Asignación directa como array proveniente del backend
      setUsers(data);
      
    } catch (err) {
      console.error('[UsersModule] fetchUsers error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Eliminar usuario ──────────────────────────────────────────────────────
  const handleDeleteConfirm = async (userId) => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API}/${userId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        console.error('[UsersModule] delete error:', err.detail);
      } else {
        await fetchUsers();
      }
    } catch (err) {
      console.error('[UsersModule] delete exception:', err);
    } finally {
      setDeleteLoading(false);
      setDeleteConfirm(null);
    }
  };

  // ── Filtrar ───────────────────────────────────────────────────────────────
  const safeUsers = Array.isArray(users) ? users : [];
  const filteredUsers = safeUsers.filter((u) => {
    const email = u?.email || '';
    return email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Gestión de Usuarios</h1>
            <p className="text-slate-400 text-sm">Administra las cuentas y permisos del sistema</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white
                     bg-gradient-to-r from-blue-600 to-blue-700
                     hover:from-blue-700 hover:to-blue-800 hover:scale-[1.02] active:scale-[0.98]
                     shadow-lg shadow-blue-600/20 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      {/* Buscador */}
      <div className="mb-6">
        <div className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl border border-slate-200 shadow-sm max-w-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por correo..."
            className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-xl shadow-slate-200/50 overflow-hidden">
        <UsersTable
          users={filteredUsers}
          loading={loadingUsers}
          currentUserId={session?.user?.id}
          deleteConfirm={deleteConfirm}
          deleteLoading={deleteLoading}
          onEdit={(user) => setEditingUser({ mode: 'role', user })}
          onPassword={(user) => setEditingUser({ mode: 'password', user })}
          onDeleteRequest={(id) => setDeleteConfirm(id)}
          onDeleteConfirm={handleDeleteConfirm}
          onDeleteCancel={() => setDeleteConfirm(null)}
        />
      </div>

      {/* Contador */}
      <p className="text-xs text-slate-400 mt-4 px-1">
        {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''} encontrado{filteredUsers.length !== 1 ? 's' : ''}
      </p>

      {/* ── Modales ────────────────────────────────────────────────────────── */}
      {showCreate && (
        <UserCreateModal
          onClose={() => setShowCreate(false)}
          onCreated={fetchUsers}
        />
      )}

      {editingUser?.mode === 'role' && (
        <UserEditRoleModal
          user={editingUser.user}
          onClose={() => setEditingUser(null)}
          onSaved={fetchUsers}
        />
      )}

      {editingUser?.mode === 'password' && (
        <UserPasswordModal
          user={editingUser.user}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  );
}
