const WIKI_HEADERS = {
  "User-Agent": "AirDexAirportBot/1.0 (Local Development; contact: admin@localhost)"
};

async function test() {
  const query = "Hartsfield-Jackson Atlanta International Airport";
  const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=1&prop=pageimages&piprop=original|thumbnail&pithumbsize=1000&format=json&origin=*`;
  
  console.log("Fetching url:", url);
  const res = await fetch(url, { headers: WIKI_HEADERS });
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("JSON Response:", JSON.stringify(data, null, 2));
}

test();
