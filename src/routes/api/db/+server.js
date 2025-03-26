import pg from "pg";
const { Client } = pg;

export async function POST({ request }) {
  try {
    request = await request.json();
  } catch (error) {
    return new Response("unable to parse request", { status: 500 });
  }

  const { id, vec } = request;
  // console.log(id, vec.length);

  const client = new Client({
    host: "localhost",
    port: 5432,
    user: "alex",
    password: "password",
    database: "monogatari",
  });

  await client.connect();
  await write_embed_to_db(client, id, vec);
  await client.end();

  return new Response("stored");
}

async function write_embed_to_db(client, id, vec) {
  try {
    await client.query("INSERT INTO embeddings (id, vec) VALUES ($1, $2)", [
      id,
      JSON.stringify(vec),
    ]);
  } catch (error) {
    console.error(error);
  }
}