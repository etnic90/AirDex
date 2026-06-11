import { createClient } from '@supabase/supabase-js';

// Prende in automatico i valori segreti dal tuo file .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Crea la connessione sicura e la esporta per usarla altrove
export const supabase = createClient(supabaseUrl, supabaseKey);