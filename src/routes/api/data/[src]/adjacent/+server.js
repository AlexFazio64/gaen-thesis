import { dataset, get_adjacent } from "$lib/stores";

export async function GET({ params }) {
  const { src } = params;
  let neighbors = get_adjacent(src);

  neighbors = neighbors.map((neighbor) => neighbor[1]);
  neighbors = neighbors.filter(
    (neighbor, index) => neighbors.indexOf(neighbor) === index
  );
  
  return new Response(JSON.stringify(neighbors), {
    headers: { "content-type": "application/json" },
  });
}
