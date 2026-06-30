import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://acowoegaamsjhykzwzyh.supabase.co",
  "Yx%Acx3%+i4ezU," // placeholder/anon key
);

async function main() {
  const { data, error } = await supabase
    .from("airlines")
    .select("*")
    .limit(5);
  
  if (error) {
    console.error(error);
  } else {
    console.log(data);
  }
}
main();
