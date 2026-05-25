import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ── Validación estricta ─────────────────────────────────────────────────────
// Si falta alguna variable, el cliente Supabase se crea con strings vacíos y
// TODAS las llamadas (auth, queries) fallan silenciosamente o se cuelgan.
// Este bloqueo hace el error INMEDIATAMENTE visible en la consola.
// ─────────────────────────────────────────────────────────────────────────────
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '\n' +
    '╔══════════════════════════════════════════════════════════════╗\n' +
    '║  ❌  ERROR FATAL: Variables de Supabase NO configuradas     ║\n' +
    '╠══════════════════════════════════════════════════════════════╣\n' +
    '║                                                            ║\n' +
    '║  Falta VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY        ║\n' +
    '║  en el archivo:  frontend/.env                              ║\n' +
    '║                                                            ║\n' +
    '║  1. Ve a tu panel de Supabase:                              ║\n' +
    '║     Settings → API → Project URL y anon (public) key        ║\n' +
    '║                                                            ║\n' +
    '║  2. Crea/edita frontend/.env con:                           ║\n' +
    '║     VITE_SUPABASE_URL=https://xxxxx.supabase.co             ║\n' +
    '║     VITE_SUPABASE_ANON_KEY=eyJhbGci...                      ║\n' +
    '║                                                            ║\n' +
    '║  3. Reinicia el dev server (npm run dev)                    ║\n' +
    '║                                                            ║\n' +
    '╚══════════════════════════════════════════════════════════════╝\n'
  );
  console.error('[Supabase] VITE_SUPABASE_URL:', supabaseUrl ? '✅ presente' : '❌ FALTA');
  console.error('[Supabase] VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ presente' : '❌ FALTA');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
