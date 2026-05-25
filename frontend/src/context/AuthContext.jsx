import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole') || null);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);

  const mountedRef = useRef(true);

  // ─────────────────────────────────────────────────────────────────────────
  // fetchProfile — Obtiene el rol desde `profiles`. Nunca cuelga, nunca lanza.
  // ─────────────────────────────────────────────────────────────────────────
  const fetchProfile = async (userId, fallbackEmail) => {
    try {
      // ── TIMEOUT STRICTO ──
      // Si la base de datos se cuelga (ej. proyecto en pausa o latencia de red),
      // forzamos la resolución en 3 segundos para no bloquear el login.
      const fetchPromise = supabase
        .from('profiles')
        .select('role, email')
        .eq('id', userId)
        .single();

      const timeoutPromise = new Promise((resolve) =>
        setTimeout(() => resolve({ data: null, error: { code: 'TIMEOUT', message: 'Tiempo de espera agotado' } }), 3000)
      );

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      console.log('[Auth] fetchProfile response:', data, error);

      if (!mountedRef.current) return;

      if (error) {
        if (error.code !== 'PGRST116' && error.code !== 'TIMEOUT') {
          console.error('[Auth] perfiles error:', error.code, error.message);
        }
        
        // BLINDAJE: Si falla la red/BD, pero el usuario ya era admin en caché, NO lo degradamos.
        const currentCache = localStorage.getItem('userRole');
        if (currentCache === 'admin') {
          console.log('[Auth] Manteniendo rol admin por caché a pesar de error.');
          setUserRole('admin');
        } else {
          setUserRole(null);
          localStorage.removeItem('userRole');
        }
        
        setUserEmail(fallbackEmail || '');
        return;
      }

      const newRole = data?.role ?? null;
      // BLINDAJE ADICIONAL: Si por alguna razón devuelve null, revisamos caché
      if (!newRole && localStorage.getItem('userRole') === 'admin') {
         console.log('[Auth] Evitando degradar a usuario normal. Mantenemos admin.');
         setUserRole('admin');
      } else {
         setUserRole(newRole);
         if (newRole) localStorage.setItem('userRole', newRole);
         else localStorage.removeItem('userRole');
      }
      
      setUserEmail(data?.email || fallbackEmail || '');
    } catch (err) {
      console.error('[Auth] fetchProfile exception:', err);
      if (!mountedRef.current) return;
      
      const currentCache = localStorage.getItem('userRole');
      if (currentCache === 'admin') {
        setUserRole('admin');
      } else {
        setUserRole(null);
        localStorage.removeItem('userRole');
      }
      
      setUserEmail(fallbackEmail || '');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ESTRATEGIA DEFINITIVA — Dos fases:
  //
  //  FASE 1 (síncrona): getSession() → carga sesión del localStorage
  //                      instantáneamente. Si hay sesión, la aplica y
  //                      llama fetchProfile. Si no hay → loading=false.
  //
  //  FASE 2 (listener):  onAuthStateChange → escucha eventos POSTERIORES
  //                      (SIGNED_IN por login, SIGNED_OUT por logout,
  //                      TOKEN_REFRESHED por renovación automática).
  //                      NO procesa INITIAL_SESSION porque FASE 1 ya lo hizo.
  //
  //  Esto elimina la dependencia del listener para el arranque,
  //  haciendo que la carga sea instantánea (no hay que esperar
  //  a que Supabase emita un evento async).
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    let subscription = null;

    // ── KILL SWITCH: cortafuegos absoluto ────────────────────────────────────
    // Si getSession() o fetchProfile() se cuelgan (red muerta, Supabase caído,
    // .env mal configurado), este timeout GARANTIZA que loading=false se ejecuta
    // y el usuario no se queda eternamente en "Cargando sesión...".
    const killSwitch = setTimeout(() => {
      if (mountedRef.current && loading) {
        console.error('[Auth] ⚠️ Kill Switch: Supabase no respondió en 5s. Apagando loading.');
        setLoading(false);
      }
    }, 5000);

    // ── FASE 1: Carga inmediata ────────────────────────────────────────────
    const bootstrap = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (!mountedRef.current) return;

        if (currentSession?.user) {
          // Pre-fetch del rol ANTES de establecer la sesión para evitar parpadeos
          await fetchProfile(currentSession.user.id, currentSession.user.email);
          setSession(currentSession);
        } else {
          setSession(null);
          setUserRole(null);
          setUserEmail('');
        }
      } catch (err) {
        console.error('[Auth] bootstrap error:', err);
        if (!mountedRef.current) return;
        setSession(null);
        setUserRole(null);
        setUserEmail('');
      } finally {
        // Apagar spinner y cancelar killSwitch (ya no lo necesitamos)
        clearTimeout(killSwitch);
        if (mountedRef.current) setLoading(false);
      }
    };

    bootstrap();

    // ── FASE 2: Listener para eventos posteriores ──────────────────────────
    const { data } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mountedRef.current) return;

        // Ignorar INITIAL_SESSION — bootstrap() ya lo procesó
        if (event === 'INITIAL_SESSION') return;

        console.log('[Auth] evento:', event);

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUserRole(null);
          setUserEmail('');
          setLoading(false);
          return;
        }

        // SIGNED_IN o TOKEN_REFRESHED
        if (newSession?.user) {
          // Pre-fetch del rol ANTES de establecer la sesión para evitar race conditions
          await fetchProfile(newSession.user.id, newSession.user.email);
          setSession(newSession);
          if (mountedRef.current) setLoading(false);
        }
      }
    );
    subscription = data.subscription;

    return () => {
      mountedRef.current = false;
      clearTimeout(killSwitch);
      subscription?.unsubscribe();
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // signOut — SIMPLE, PREDECIBLE, SIN RACE CONDITIONS:
  //
  // Limpia el estado de React y el localStorage INMEDIATAMENTE de forma
  // síncrona. Esto garantiza que el usuario vea la pantalla de login al
  // instante (App.jsx reacciona a session=null). 
  // La petición a Supabase se hace de fondo. Si falla o no emite evento,
  // no importa, el usuario ya está deslogueado localmente.
  // ─────────────────────────────────────────────────────────────────────────
  const signOut = async () => {
    console.log('[Auth] signOut invocado');

    // 1. Limpieza INMEDIATA del estado (UI reacciona al instante)
    if (mountedRef.current) {
      setSession(null);
      setUserRole(null);
      setUserEmail('');
      setLoading(false);
    }

    // 2. Limpieza agresiva del navegador
    localStorage.removeItem('userRole'); // Explicit removal per requirements
    localStorage.clear();
    sessionStorage.clear();

    // 3. Notificar a Supabase en background
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[Auth] signOut exception:', err);
    }
  };

  const value = {
    session,
    userRole,
    userEmail,
    loading,
    isAdmin: String(userRole || '').toLowerCase().trim() === 'admin',
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return context;
}
