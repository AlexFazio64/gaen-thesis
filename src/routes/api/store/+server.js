import fs from "fs";
import path from "path";

import pg from "pg";
const { Client } = pg;

export async function GET({ params }) {
  return new Response("not implemented", { status: 501 });
}

export async function POST({ request }) {
  try {
    request = await request.json();
  } catch (error) {
    return new Response("unable to parse request", { status: 500 });
  }
  
  const { data, name } = request;

  try {
    fs.writeFileSync(path.join(process.cwd(), "static", name), data);
  } catch (error) {
    return new Response(JSON.stringify(error), { status: 500 });
  }

  return new Response("stored");
}

async function query_db(client, str) {
  // find the closest embeddings in the database based on the prompt
  const vec = await fetch("http://localhost:11434/api/embeddings", {
    method: "POST",
    body: JSON.stringify({
      model: "nomic-embed-text",
      prompt: str,
    }),
  });

  const json = await vec.json();

  const res = await client.query(
    "SELECT * FROM embeddings WHERE 1- (vec <=> $1) >= 0.7 ORDER BY (vec <=> $1) ASC LIMIT 4",
    [JSON.stringify(json.embedding)]
  );

  return res.rows.map((row) => row.id);
}

async function write_embed_to_db(client, str) {
  const res = await fetch("http://localhost:11434/api/embeddings", {
    method: "POST",
    body: JSON.stringify({
      model: "nomic-embed-text",
      prompt: str,
    }),
  });

  const json = await res.json();

  try {
    await client.query("INSERT INTO embeddings (id, vec) VALUES ($1, $2)", [
      str,
      JSON.stringify(json.embedding),
    ]);
  } catch (error) {
    console.error(error);
  }
}
