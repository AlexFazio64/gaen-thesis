import fs from "fs";
import path from "path";

let initialized = false;
const MAX_DISTANCE = 3;
let nodes = [];
let dataset = [];
let connections = [];
let ids = {};
let degrees = {};
let categories = [];

export const loadFileData = () => {
  if (!initialized) {
    const filePath = path.resolve(
      path.join(process.cwd(), "static", "nodes.json")
    );
    const datasetPath = path.resolve(
      path.join(process.cwd(), "static", "dataset_cleaned.json")
    );

    const connectionsPath = path.resolve(
      path.join(process.cwd(), "static", "distances.json")
    );

    const idsPath = path.resolve(
      path.join(process.cwd(), "static", "urls.json")
    );

    const degreesPath = path.resolve(
      path.join(process.cwd(), "static", "degrees.json")
    );

    const categoriesPath = path.resolve(
      path.join(process.cwd(), "static", "categories.json")
    );

    try {
      const data = fs.readFileSync(filePath, "utf-8");
      const datasetData = fs.readFileSync(datasetPath, "utf-8");
      const connectionsData = fs.readFileSync(connectionsPath, "utf-8");
      const idsData = fs.readFileSync(idsPath, "utf-8");
      const degreesData = fs.readFileSync(degreesPath, "utf-8");
      const categoriesData = fs.readFileSync(categoriesPath, "utf-8");

      nodes = JSON.parse(data);
      dataset = JSON.parse(datasetData);
      connections = JSON.parse(connectionsData);
      ids = new Map(JSON.parse(idsData));
      degrees = new Map(JSON.parse(degreesData));
      categories = new Map(JSON.parse(categoriesData));

      initialized = true;
      console.log("loaded files");
    } catch (error) {
      console.error("Error loading file:", error);
    }
  }
};

export const shortest_path = (src, dst) => {
  const idx = nodes.findIndex((node) => node.id === src);

  let paths = connections[idx];
  const found = paths.findIndex((path) => {
    const len = path.length;
    return path[len - 1] === dst;
  });

  if (found !== -1) return paths[found].length - 1;
  console.log("no path found");
  return undefined;
};

export const is_connected = (src, dst, max_distance) => {
  if (max_distance === undefined) max_distance = MAX_DISTANCE;
  const idx = nodes.findIndex((node) => node.id === src);

  if (idx === -1) {
    console.log("source not found");
    return undefined;
  }

  let dist = -1;
  let path = undefined;
  let ret_path = undefined;

  for (let i = 0; i < connections[idx].length; i++) {
    path = connections[idx][i];
    const pos = path.findIndex((node) => node === dst);
    if (pos !== -1 && dist < pos) {
      dist = pos;
      ret_path = path;
    }
  }

  if (dist !== -1 && dist + 1 <= max_distance) return ret_path;
  else console.log(ret_path ? "threshold crossed" : "not connected");
  return undefined;
};

export function get_adjacent(src) {
  const idx = nodes.findIndex((node) => node.id === src);
  if (idx === -1) return undefined;
  return connections[idx];
}

export { nodes, dataset, ids, degrees, categories };
