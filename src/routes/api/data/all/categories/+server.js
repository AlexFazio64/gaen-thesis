import { categories } from "$lib/stores";

export async function GET() {
  const all_categories = new Set();
  for (const category of categories.keys()) {
    for (const entry of categories.get(category)) {
      all_categories.add(entry.text);
    }
  }
  return new Response(JSON.stringify([...all_categories]), { status: 200 });
}
