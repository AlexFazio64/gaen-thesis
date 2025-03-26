import { dataset } from "$lib/stores";

export async function GET({ params }) {
  const { src } = params;
  const examples = dataset.filter((d) => d.query === src);
  return new Response(JSON.stringify(examples), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
