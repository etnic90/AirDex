import pg from 'pg';

const { Client } = pg;
const client = new Client({
  connectionString: "postgresql://postgres.acowoegaamsjhykzwzyh:Yx%25Acx3%26%2Bi4ezU%2C@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  await client.connect();
  const res = await client.query(`
    SELECT name, iata_code, icao_code, country
    FROM airlines
  `);
  
  const airlines = res.rows;
  const search = "ita";
  const q = search.toLowerCase();
  
  // Apply filter
  const filtered = airlines.filter(a => 
    a.name.toLowerCase().includes(q) ||
    (a.iata_code && a.iata_code.toLowerCase().includes(q)) ||
    (a.icao_code && a.icao_code.toLowerCase().includes(q))
  );
  
  const getScore = (item) => {
    const nameLower = item.name.toLowerCase();
    const iataLower = (item.iata_code || "").toLowerCase();
    const icaoLower = (item.icao_code || "").toLowerCase();
    
    if (nameLower === q) return 100;
    if (nameLower.startsWith(q)) return 80;
    if (iataLower === q) return 70;
    if (icaoLower === q) return 60;
    if (nameLower.includes(q)) return 50;
    if (iataLower.includes(q) || icaoLower.includes(q)) return 40;
    return 0;
  };
  
  const sorted = filtered.map(item => ({
    name: item.name,
    iata: item.iata_code,
    icao: item.icao_code,
    score: getScore(item)
  })).sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score;
    }
    return a.name.localeCompare(b.name);
  });
  
  console.log(sorted.slice(0, 10));
  await client.end();
}
main();
