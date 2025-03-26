import { is_connected, dataset } from "$lib/stores";

export async function GET({ params }) {
  const { src, dst } = params;
  const path = is_connected(src, dst);

  if (!path) {
    const filtered = dataset.filter((data) => {
      if (data.query == dst) return data;
    });

    return new Response(JSON.stringify(filtered), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  return new Response(JSON.stringify(path), {
    status: 403,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
