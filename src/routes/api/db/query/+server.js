import pg from "pg";
const { Client } = pg;

export async function POST({ request }) {
  try {
    request = await request.json();
  } catch (error) {
    return new Response("unable to parse request", { status: 500 });
  }

  const { vec, threshold } = request;
  console.log(vec.length, threshold);

  const client = new Client({
    host: "localhost",
    port: 5432,
    user: "alex",
    password: "password",
    database: "monogatari",
  });

  await client.connect();
  const res = await query_db(client, vec, threshold);
  await client.end();

  return new Response(JSON.stringify(res));
}

async function query_db(client, vec, threshold) {
  const res = await client.query(
    `
    SELECT id, 1 - (vec <=> $1) as dist
    FROM embeddings 
    WHERE 1 - (vec <=> $1) >= $2 
    ORDER BY (vec <=> $1) ASC LIMIT 5
    `,
    [JSON.stringify(vec), threshold]
  );
  
  return res.rows.map((row) => ({
    id: row.id,
    dist: row.dist,
  }));

  return res.rows.map((row) => row.id);
}
