import { dataset } from "$lib/stores";

export async function GET({ params }) {
  const { src } = params;
  let res;
  let random_index;

  do {
    random_index = Math.floor(Math.random() * dataset.length);
    const dst = encodeURIComponent(dataset[random_index].query);
    res = await fetch(`http://localhost:5173/api/data/${src}/${dst}`);
  } while (res.status !== 200);

  return new Response(JSON.stringify(await res.json()), {
    headers: { "content-type": "application/json" },
  });
}
