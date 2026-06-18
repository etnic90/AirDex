const WIKI_HEADERS = {
  "User-Agent": "AviationPokedexBot/3.0 (https://github.com/google/aviation-pokedex; mirko.user@example.com) next-intl/3.0"
};

async function test() {
  const query = "Hartsfield-Jackson Atlanta International Airport";
  const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=1&prop=pageimages&piprop=original|thumbnail&pithumbsize=1000&format=json&origin=*`;
  
  console.log("Fetching url:", url);
  const res = await fetch(url, { headers: WIKI_HEADERS });
  console.log("Status:", res.status);
  if (res.ok) {
    const data = await res.json();
    console.log("Success! Data keys:", Object.keys(data));
  } else {
    const text = await res.text();
    console.log("Body snippet:", text.substring(0, 200));
  }
}

test();
