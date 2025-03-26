import { nodes, categories } from "$lib/stores";

export async function POST({ request }) {
  const body = await request.json();
  let { filters } = body;

  // lowercase every item in the array
  filters = filters.map((cat) => cat.toLowerCase());
  console.log(filters);

  let filteredNodes = nodes.filter((node) => {
    for (let node_cat of categories.get(node.id)) {
      if (filters.includes(node_cat.text.toLowerCase())) {
        return true;
      }
    }
    return false;
  });

  return new Response(JSON.stringify(filteredNodes), { status: 200 });
}
