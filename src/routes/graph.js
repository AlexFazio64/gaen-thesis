export function getEdges(id1, id2, nodes, url_id) {
  let node1 = null;
  let node2 = null;
  for (let node of nodes) {
    if (node.id === id1) node1 = node;
    if (node.id === id2) node2 = node;

    if (node1 && node2) break;
  }

  function getInfo(node, other, map) {
    const text = [];
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
        if (map.get(link) === other.id) {
          text.push(node[key].text);
        }
      }
    }
    return text;
  }

  let info = [];
  Array.prototype.push.apply(info, getInfo(node1, node2, url_id));
  Array.prototype.push.apply(info, getInfo(node2, node1, url_id));

  info = info.filter((text) => text.length > 0);

  return info;
}

export function assortativity(e, d) {
  let A = 0;
  for (let { source, target } of e) A += d.get(source) * d.get(target);

  A /= e.length;
  const variance = 0.5 * A ** 2;

  let B = 0;
  for (let { source, target } of e)
    B += Math.pow(d.get(source), 2) * Math.pow(d.get(target), 2);
  B /= e.length * 2;

  return (A - variance) / (B - variance);
}

export function assortativity_mixing(edges, categories, map) {
  const is_edge_from_to = ({ source, target }, cat1, cat2) => {
    return (
      map.get(source).filter(({ text }) => text === cat1).length > 0 &&
      map.get(target).filter(({ text }) => text === cat2).length > 0
    );
  };

  const total_edges = () => {
    let acc = 0;
    for (let { source, target } of edges)
      acc += map.get(source).length * map.get(target).length;

    return acc;
  };

  let matrix = new Map();
  let E = 0;
  let A = 0;

  for (let cat of categories) {
    matrix.set(cat, []);

    for (let cat2 of categories) {
      let a_i = 0;
      for (let l2 of edges) if (is_edge_from_to(l2, cat, cat2)) a_i++;

      a_i /= total_edges();
      if (cat === cat2) E += a_i;

      matrix.get(cat).push({ category: cat2, value: a_i });
    }
  }

  let tot = 0;
  let a_i = [];
  for (let cat1 of categories) {
    let a = [];
    for (let { value } of matrix.get(cat1)) {
      a.push(value);
      tot += value;
    }

    let row_sum = a.reduce((acc, val) => acc + val, 0);
    a_i.push(row_sum);
    A += row_sum ** 2; // undirected so A_i = B_i
  }

  let R = E - A / (1 - A);
  return { matrix, a_i, R, tot };
}

export function save(name, data) {
  fetch("/api/store", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: JSON.stringify(data), name }),
  });
}

export async function shortest_path(edges, s, t) {
  let visited = new Set();
  let queue = [];
  let parent = new Map();
  let found = false;

  queue.push(s);
  visited.add(s);

  while (queue.length > 0) {
    let current = queue.shift();

    if (current === t) {
      found = true;
      break;
    }

    for (let { source, target } of edges) {
      if (source === current && !visited.has(target)) {
        visited.add(target);
        parent.set(target, source);
        queue.push(target);
      } else if (target === current && !visited.has(source)) {
        visited.add(source);
        parent.set(source, target);
        queue.push(source);
      }
    }
  }

  if (!found) return [];

  let path = [];
  let current = t;
  while (current !== s) {
    path.push(current);
    current = parent.get(current);
  }
  path.push(s);

  return path.reverse();
}

export async function memoize_distances(nodes, edges) {
  let distance_matrix = Array(nodes.length);
  for (let i = 0; i < nodes.length; i++) {
    distance_matrix[i] = Array(nodes.length);
  }

  let computed = new Set();

  for (let i = 0; i < nodes.length; i++) {
    let source = nodes[i];

    for (let j = 0; j < nodes.length; j++) {
      let target = nodes[j];

      if (source.id === target.id) {
        distance_matrix[i][j] = [source.id];
      } else {
        console.log(source.id, "->", target.id);

        if (!computed.has({ i, j })) {
          let p = await shortest_path(edges, source.id, target.id);

          distance_matrix[i][j] = p;
          distance_matrix[j][i] = [...p].reverse();

          computed.add({ i, j });
          computed.add({ j, i });
        }
      }
    }
  }

  return distance_matrix;
}

export function graph_stats(distance_matrix) {
  let avg = 0;
  let valid = 0;
  let invalid = 0;
  let diameter = 0;
  let closeness = [];

  for (let i = 0; i < distance_matrix.length; i++) {
    let isolated = true;
    let node_closeness = 0;

    for (let j = 0; j < distance_matrix.length; j++) {
      if (distance_matrix[i][j].length > 1) {
        valid++;
        isolated = false;
        avg += distance_matrix[i][j].length;
        node_closeness += distance_matrix[i][j].length;
      }

      if (distance_matrix[i][j].length > diameter)
        diameter = distance_matrix[i][j].length;
    }

    node_closeness = (distance_matrix.length - 1) / node_closeness;
    closeness.push({ i, node_closeness });
    if (isolated) invalid++;
  }

  avg /= valid;
  avg = Math.round(avg * 100) / 100;
  return { diameter, avg, invalid, closeness };
}

export function graph_components(edges, nodes) {
 let visited = new Set();
  visited.add(nodes[0].id);

  let components = [];
  let comp = [];
  let queue = [];

  queue.push(nodes[0].id);

  while (queue.length > 0) {
    let current = queue.shift();
    comp.push(current);

    for (let { source, target } of edges) {
      if (source === current && !visited.has(target)) {
        visited.add(target);
        queue.push(target);
      } else if (target === current && !visited.has(source)) {
        visited.add(source);
        queue.push(source);
      }
    }

    if (queue.length === 0) {
      components.push(comp);
      comp = [];
      for (let node of nodes) {
        if (!visited.has(node.id)) {
          visited.add(node.id);
          queue.push(node.id);
          break;
        }
      }
    }
  }

  return components;
}

export function clustering_coefficient(edges, nodes) {
  let coefficients = new Map();

  for (let node of nodes) {
    let neighbors = new Set();

    for (let { source, target } of edges) {
      if (source === node.id) {
        neighbors.add(target);
      } else if (target === node.id) {
        neighbors.add(source);
      }
    }

    let edges_between_neighbors = new Set();
    for (let neighbor of neighbors) {
      for (let { source, target } of edges) {
        if (
          (source === neighbor && neighbors.has(target)) ||
          (target === neighbor && neighbors.has(source))
        ) {
          let [min, max] = [
            Math.min(source.id, target.id),
            Math.max(source.id, target.id),
          ];
          let key = `${min}-${max}`;

          if (!edges_between_neighbors.has(key)) {
            edges_between_neighbors.add(key);
          }
        }
      }
    }

    let max_num_edges = neighbors.size * (neighbors.size - 1);
    let clustering = 0;

    if (max_num_edges !== 0)
      clustering = (2 * edges_between_neighbors.size) / max_num_edges;
    coefficients.set(node.id, clustering);
  }

  return coefficients;
}

export function graph_density(edges, nodes) {
  return (2 * edges) / (nodes * (nodes - 1));
}
