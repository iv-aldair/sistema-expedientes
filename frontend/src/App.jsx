// Sistema de Expedientes - Version 3.1
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';
import Sidebar from './components/Sidebar';
import AutollenadoPage from './pages/AutollenadoPage';
import ParticionPage from './pages/ParticionPage';
import ConfigAutoPage from './pages/ConfigAutoPage';
import ConfigParticionPage from './pages/ConfigParticionPage';
import LoginPage from './pages/LoginPage';
import UsersModule from './pages/UsersModule';

const VIEWS = {
  'autollenado': AutollenadoPage,
  'particion': ParticionPage,
  'config-auto': ConfigAutoPage,
  'config-particion': ConfigParticionPage,
  'users': UsersModule,
};

function AppContent() {
  const { session, loading, isAdmin } = useAuth();
  const [activeView, setActiveView] = useState('autollenado');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/80">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          <p className="text-slate-400 text-sm">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  // Protección RBAC: si no es admin e intenta acceder a vistas restringidas, redirigir
  const adminOnlyViews = ['users', 'config-auto'];
  const safeView = (adminOnlyViews.includes(activeView) && !isAdmin) ? 'autollenado' : activeView;
  const ActivePage = VIEWS[safeView] || AutollenadoPage;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/80">
      <Sidebar activeView={safeView} onNavigate={setActiveView} />
      <main className="flex-1 h-screen overflow-hidden flex flex-col">
        <ActivePage key={safeView} />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
