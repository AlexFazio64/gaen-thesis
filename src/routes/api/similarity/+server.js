import { nodes, ids, shortest_path } from "$lib/stores";

export async function POST({ request }) {
  try {
    request = await request.json();
  } catch (error) {
    return new Response("unable to parse request", { status: 500 });
  }
  let resp = [];

  for (let pair of request) {
    const [id1, id2] = pair;
    const node1 = nodes.find((node) => node.id === id1);
    const node2 = nodes.find((node) => node.id === id2);

    if (!node1 || !node2) continue;

    // let score = similarity(node1, node2);
    let score = 1 / shortest_path(id1, id2);
    if (score === NaN || score === undefined || score > 1 || score < 0) continue;

    // if (score <= -1 || score >= 1) continue;

    resp.push({ id1, id2, score });
  }

  return new Response(JSON.stringify(resp), { status: 200 });
}

function similarity(node, other) {
  let text = 0;
  for (let key in node) {
    if (
      !node.hasOwnProperty(key) ||
      typeof node[key] !== "object" ||
      !node[key] ||
      !node[key].link
    )
      continue;

    const links = node[key].link;

    for (let link of links) {
      if (ids.get(link) === other.id) {
        text++;
      }
    }
  }
  return 1 - 1 / text;
}
