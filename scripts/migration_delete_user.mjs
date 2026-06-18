import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://postgres.acowoegaamsjhykzwzyh:Yx%25Acx3%26%2Bi4ezU%2C@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  try {
    await client.connect();
    console.log("Connected successfully to database pooler!");

    console.log("Creating delete_user_self RPC function...");
    await client.query(`
      CREATE OR REPLACE FUNCTION public.delete_user_self()
      RETURNS BOOLEAN AS $$
      DECLARE
        current_user_id UUID;
      BEGIN
        current_user_id := auth.uid();
        IF current_user_id IS NULL THEN
          RAISE EXCEPTION 'Non autorizzato: Nessun utente autenticato';
        END IF;

        -- Rimuovi dati correlati (catture, ecc)
        DELETE FROM public.user_captures WHERE user_id = current_user_id;

        -- Rimuovi il profilo utente
        DELETE FROM public.user_profiles WHERE id = current_user_id;

        -- Rimuovi l'utente dalla tabella auth.users (richiede SECURITY DEFINER)
        DELETE FROM auth.users WHERE id = current_user_id;

        RETURN TRUE;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE NOTICE 'Errore durante la rimozione dell''utente: %', SQLERRM;
          RETURN FALSE;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    
    console.log("RPC function delete_user_self created successfully!");
  } catch (err) {
    console.error("Migration failed:", err.stack);
  } finally {
    await client.end();
  }
}

main();
