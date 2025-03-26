import { nodes } from "$lib/stores";

export async function GET() {
  let nodes_list = nodes;
  nodes_list = nodes_list.map((node) => node.id);
  return new Response(JSON.stringify(nodes_list));
}