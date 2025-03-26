import { loadFileData } from "$lib/stores";

export async function handle({ event, resolve }) {
  loadFileData();
  return resolve(event);
}
