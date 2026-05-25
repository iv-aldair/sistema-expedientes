import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Mail, Lock, ArrowRight, Shield } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [focusedField, setFocusedField] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(
          error.message === 'Invalid login credentials'
            ? 'Credenciales inválidas. Verifica tu correo y contraseña.'
            : error.message
        );
        return;
      }

      // El AuthContext.jsx tiene un listener (onAuthStateChange) que detectará
      // el inicio de sesión y hará la transición automáticamente.
      // Ya no bloqueamos con window.location.reload().

    } catch (err) {
      console.error('[Login] Exception:', err);
      setError("Error de conexión al servidor o tiempo de espera agotado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ══════════════════════════════════════════════════════
          LADO IZQUIERDO — Branding & Patrón Geométrico
         ══════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-[#1e3a8a]">
        {/* Patrón geométrico SVG de fondo */}
        <div className="absolute inset-0 opacity-[0.07]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
              <pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="2" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        {/* Círculos decorativos */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5 blur-sm" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/5 blur-sm" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-blue-400/10 blur-2xl" />

        {/* Contenido principal */}
        <div className="relative z-10 flex flex-col justify-between w-full p-12">
          {/* Logo superior */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight tracking-tight">Sistema</h2>
              <p className="text-blue-200/60 text-xs font-medium">Expedientes Bancarios</p>
            </div>
          </div>

          {/* Texto central */}
          <div className="space-y-6">
            <h1 className="text-white text-5xl font-extrabold leading-tight tracking-tight">
              Gestión<br />
              Inteligente de<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">
                Expedientes
              </span>
            </h1>
            <p className="text-blue-200/70 text-lg max-w-md leading-relaxed">
              Plataforma integral para la administración, autollenado y partición de documentos bancarios.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
                <span className="text-blue-200/60 text-sm">Seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
                <span className="text-blue-200/60 text-sm">Eficiente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
                <span className="text-blue-200/60 text-sm">Intuitivo</span>
              </div>
            </div>
          </div>

          {/* Footer izquierdo */}
          <p className="text-blue-300/30 text-xs">
            © {new Date().getFullYear()} Sistema de Expedientes — Todos los derechos reservados
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          LADO DERECHO — Formulario de Login
         ══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-[420px]">
          {/* Branding móvil (visible solo en pantallas pequeñas) */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl bg-[#1e3a8a] flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-slate-800 font-bold text-base leading-tight">Sistema de Expedientes</h2>
              <p className="text-slate-400 text-xs">Gestión Inteligente</p>
            </div>
          </div>

          {/* Tarjeta del formulario */}
          <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200/60 border border-slate-100 p-8 sm:p-10">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
                Iniciar Sesión
              </h3>
              <p className="text-slate-400 mt-1.5 text-sm">
                Ingresa tus credenciales para acceder
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Campo Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Correo Electrónico
                </label>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                  focusedField === 'email'
                    ? 'border-blue-500 bg-blue-50/30 shadow-lg shadow-blue-500/10'
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                }`}>
                  <Mail className={`w-5 h-5 shrink-0 transition-colors duration-300 ${
                    focusedField === 'email' ? 'text-blue-500' : 'text-slate-400'
                  }`} />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    required
                    className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
                    placeholder="tu@correo.com"
                  />
                </div>
              </div>

              {/* Campo Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Contraseña
                </label>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                  focusedField === 'password'
                    ? 'border-blue-500 bg-blue-50/30 shadow-lg shadow-blue-500/10'
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                }`}>
                  <Lock className={`w-5 h-5 shrink-0 transition-colors duration-300 ${
                    focusedField === 'password' ? 'text-blue-500' : 'text-slate-400'
                  }`} />
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    required
                    className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl animate-fade-in">
                  <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Botón Submit */}
              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold text-sm
                           bg-gradient-to-r from-blue-600 to-blue-700
                           hover:from-blue-700 hover:to-blue-800
                           hover:scale-[1.02] active:scale-[0.98]
                           shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30
                           transition-all duration-300 disabled:opacity-60 disabled:hover:scale-100"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <>
                    Iniciar Sesión
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Nota inferior */}
          <p className="text-center text-slate-400 text-xs mt-6">
            Acceso restringido a personal autorizado
          </p>
        </div>
      </div>
    </div>
  );
}
