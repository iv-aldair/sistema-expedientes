import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users } from 'lucide-react';

/* ── Iconos auxiliares SVG ── */
const IconDoc = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const IconScissors = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
  </svg>
);
const IconCog = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const IconChevron = ({ open }) => (
  <svg className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);
const IconSubItem = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);
const IconMenu = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
const IconLogout = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

export default function Sidebar({ activeView, onNavigate }) {
  const { session, userRole, signOut } = useAuth();
  const userEmail = session?.user?.email;
  const [configOpen, setConfigOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Normalización segura del rol
  const safeRole = String(userRole || '').toLowerCase().trim();
  const isAdmin = safeRole === 'admin';

  const linkActive = "bg-white/15 text-white shadow-lg shadow-black/10";
  const linkInactive = "text-blue-200/80 hover:bg-white/8 hover:text-white";
  const linkBase = `flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer select-none`;

  const subBase = `flex items-center gap-2.5 ${isCollapsed ? 'justify-center pl-0 pr-0' : 'pl-12 pr-4'} py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 cursor-pointer select-none`;
  const subActive = "bg-bbva-aqua/20 text-bbva-aqua";
  const subInactive = "text-blue-300/60 hover:bg-white/5 hover:text-blue-200";

  return (
    <aside className={`sticky top-0 ${isCollapsed ? 'w-[80px]' : 'w-[272px]'} h-screen bg-gradient-to-b from-bbva-navy via-bbva-dark to-bbva-navy flex flex-col shrink-0 shadow-2xl transition-all duration-300 z-50`}>
      {/* ── Marca y Alternador ── */}
      <div className={`px-4 py-7 border-b border-white/10 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-bbva-aqua to-bbva-blue flex items-center justify-center shadow-lg shrink-0">
              <span className="text-white font-bold text-lg">SE</span>
            </div>
            <div className="whitespace-nowrap">
              <h1 className="text-white font-semibold text-[15px] leading-tight">Sistema</h1>
              <p className="text-blue-300/60 text-xs">Expedientes Bancarios</p>
            </div>
          </div>
        )}
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-white/70 hover:text-white transition-colors">
          <IconMenu />
        </button>
      </div>

      {/* ── Navegación ── */}
      <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'px-4'} py-6 space-y-1.5 overflow-y-auto overflow-x-hidden`}>
        {!isCollapsed && <p className="px-4 mb-3 text-[10px] font-semibold uppercase tracking-widest text-blue-400/50">Módulos</p>}

        {/* Autollenado */}
        <div
          title="Autollenado"
          className={`${linkBase} ${activeView === 'autollenado' ? linkActive : linkInactive}`}
          onClick={() => onNavigate('autollenado')}
        >
          <IconDoc />
          {!isCollapsed && <span>Autollenado</span>}
        </div>

        {/* Partición */}
        <div
          title="Partición PDF"
          className={`${linkBase} ${activeView === 'particion' ? linkActive : linkInactive}`}
          onClick={() => onNavigate('particion')}
        >
          <IconScissors />
          {!isCollapsed && <span>Partición PDF</span>}
        </div>

        {/* ── Separador ── */}
        <div className="my-4 border-t border-white/8" />
        {!isCollapsed && <p className="px-4 mb-3 text-[10px] font-semibold uppercase tracking-widest text-blue-400/50">Sistema</p>}

        {/* Acordeón de Configuración — Visible para todos */}
        <div
          title="Configuración"
          className={`${linkBase} ${!isCollapsed ? 'justify-between' : ''} ${
            activeView === 'config-auto' || activeView === 'config-particion' ? linkActive : linkInactive
          }`}
          onClick={() => {
            if (isCollapsed) {
              setIsCollapsed(false);
              setConfigOpen(true);
            } else {
              setConfigOpen(!configOpen);
            }
          }}
        >
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <IconCog /> 
            {!isCollapsed && <span>Configuración</span>}
          </div>
          {!isCollapsed && <IconChevron open={configOpen} />}
        </div>

        {/* Subelementos */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${configOpen && !isCollapsed ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0 hidden'}`}>
          <div className="space-y-1 py-1">
            {/* Config. Autollenado — Solo Admin */}
            {isAdmin && (
              <div
                className={`${subBase} ${activeView === 'config-auto' ? subActive : subInactive}`}
                onClick={() => onNavigate('config-auto')}
              >
                <IconSubItem />
                <span className="whitespace-nowrap">Config. Autollenado</span>
              </div>
            )}
            {/* Config. Partición — Todos los usuarios */}
            <div
              className={`${subBase} ${activeView === 'config-particion' ? subActive : subInactive}`}
              onClick={() => onNavigate('config-particion')}
            >
              <IconSubItem />
              <span className="whitespace-nowrap">Config. Partición</span>
            </div>
          </div>
        </div>

        {/* ══ Módulo de Usuarios (Solo Admin) ══ */}
        {isAdmin && (
          <>
            <div className="my-4 border-t border-white/8" />
            {!isCollapsed && <p className="px-4 mb-3 text-[10px] font-semibold uppercase tracking-widest text-amber-400/60">Administración</p>}
            <div
              title="Gestión de Usuarios"
              className={`${linkBase} ${activeView === 'users' ? linkActive : linkInactive}`}
              onClick={() => onNavigate('users')}
            >
              <Users className="w-5 h-5" />
              {!isCollapsed && <span>Usuarios</span>}
            </div>
          </>
        )}
      </nav>

      {/* ── Pie de página ── */}
      <div className={`px-4 py-4 border-t border-white/10 flex flex-col gap-3`}>
        {/* Tarjeta de perfil de usuario */}
        {userEmail && (
          <div className={`flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 transition-all ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-inner">
              <span className="text-white text-sm font-bold tracking-wider">
                {userEmail.charAt(0).toUpperCase()}
              </span>
            </div>
            
            {!isCollapsed && (
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-semibold text-white truncate" title={userEmail}>
                  {userEmail}
                </p>
                <div className="mt-0.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                    isAdmin 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {isAdmin ? 'Administrador' : 'Usuario'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Indicador de estado */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2 px-1'}`}>
          <div className="w-2 h-2 rounded-full bg-bbva-success shrink-0" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
          {!isCollapsed && <span className="text-[11px] text-blue-300/50 whitespace-nowrap">Backend conectado</span>}
        </div>
        
        {/* Botón de cerrar sesión */}
        <button
          type="button"
          onClick={async (e) => { e.preventDefault(); await signOut(); }}
          title="Cerrar Sesión"
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2 w-full rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors`}
        >
          <IconLogout />
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
}
