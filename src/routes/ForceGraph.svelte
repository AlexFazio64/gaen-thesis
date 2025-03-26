<script>
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import { createEventDispatcher } from "svelte";
  import { getEdges } from "./graph";

  const dispatch = createEventDispatcher();
  export let toggle = false;
  export let filter = { degrees: -1, categories: new Set() };

  $: if (filter.degrees !== -1 || filter.categories.size) {
    updateGraph();
  }

  $: if (filter.node) {
    const node = nodes.find(
      (d) =>
        d.id.toUpperCase().replace(" ", "") ===
        filter.node.toUpperCase().replace(" ", "")
    );
    if (node) {
      d3.selectAll("circle")._groups[0].forEach((element) => {
        if (element.__data__.id === node.id) {
          element.dispatchEvent(new MouseEvent("click", { shiftKey: true }));
        }
      });
    }
  }

  $: if (toggle) {
    clear();
    toggle = false;
    dispatch("cleared");
  }

  $: if (selected_arr) {
    if (selected_arr.length === 2)
      edges = getEdges(
        selected_arr[0].__data__.id,
        selected_arr[1].__data__.id,
        nodes,
        url_id
      );
    else edges = [];
    dispatch("selection", {
      arr: selected_arr.map((d) => d.__data__.id),
      edges: edges,
    });
  }

  $: if (selected) info.root = selected.__data__.id;
  $: if (selected === null) info.root = "";

  let svg;
  let g;
  let simulation;

  let edges = [];
  let selected = null;
  let selected_arr = [];
  let categories = null;
  let info = { root: "", hovered: "" };

  const width = 1200;
  const height = 590;
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  function highlight(c, highlight = true) {
    const node_color = color(degrees.get(c.__data__.id));
    c.attributes.getNamedItem("r").value = highlight ? 15 : 10;
    c.attributes.getNamedItem("fill").value = highlight ? "red" : node_color;
    c.attributes.getNamedItem("stroke-width").value = highlight ? 3 : 1;
    c.attributes.getNamedItem("stroke").value = highlight ? "#1e1e1e" : "#fff";
  }

  let nodes = [];
  let links = [];
  let degrees = new Map();
  let url_id = new Map();

  onMount(async () => {
    nodes = await fetch(
      process.env.NODE_ENV === "development"
        ? "/nodes.json"
        : "/visualizer/nodes.json"
    )
      .then((res) => res.json())
      .then((data) => {
        return data;
      });

    links = await fetch(
      process.env.NODE_ENV === "development"
        ? "/links.json"
        : "/visualizer/links.json"
    )
      .then((res) => res.json())
      .then((data) => {
        return data;
      });

    degrees = await fetch(
      process.env.NODE_ENV === "development"
        ? "/degrees.json"
        : "/visualizer/degrees.json"
    )
      .then((res) => res.json())
      .then((data) => {
        return new Map(data);
      });

    url_id = await fetch(
      process.env.NODE_ENV === "development"
        ? "/urls.json"
        : "/visualizer/urls.json"
    )
      .then((res) => res.json())
      .then((data) => {
        return new Map(data);
      });

    categories = await fetch(
      process.env.NODE_ENV === "development"
        ? "/categories.json"
        : "/visualizer/categories.json"
    )
      .then((res) => res.json())
      .then((data) => {
        return new Map(data);
      });

    dispatch("degrees", { degrees });
    dispatch("categories", { categories });

    function zoomed({ transform }) {
      g.attr("transform", transform);
    }

    const zoom = d3.zoom().scaleExtent([0.01, 20]).on("zoom", zoomed);
    svg = d3.select("svg").call(zoom);
    g = svg.append("g");

    simulation = d3
      .forceSimulation(nodes)
      .force("x", d3.forceX())
      .force("y", d3.forceY())
      .force("charge", d3.forceManyBody().strength(-1000))
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(200)
      );

    simulation.on("tick", () => {
      g.selectAll("line")
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      g.selectAll("circle")
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y);
    });

    updateGraph();
  });

  const initialTranslate = [width / 2, height / 2];

  function mouseover(_event, d) {
    if (!selected || (selected && selected.__data__.id !== d.id))
      d3.select(this).attr("fill", "blue");
    info.hovered = d.id;
  }

  function mouseout() {
    if (
      !selected ||
      (selected && selected.__data__.id !== d3.select(this).data()[0].id)
    )
      d3.select(this).attr("fill", (d) => color(degrees.get(d.id)));
    info.hovered = "";
  }

  function click(_event) {
    const circle = d3.select(this)._groups[0][0];

    if (_event.shiftKey) {
      if (selected) {
        highlight(selected, false);
        if (selected.__data__.id !== circle.__data__.id) {
          selected = circle;
          highlight(selected);
        } else selected = null;
      } else {
        selected = circle;
        highlight(selected);
      }

      updateGraph();
    } else {
      selected_arr.find((d) => d.__data__.id === circle.__data__.id)
        ? selected_arr.splice(selected_arr.indexOf(circle), 1) &&
          highlight(circle, false)
        : selected_arr.push(circle) && highlight(circle);

      selected_arr = [...new Set(selected_arr)];
      if (selected) highlight(selected);
    }
  }

  function drag(simulation) {
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  function updateGraph() {
    let all_nodes = [...nodes];
    let filteredLinks;

    if (selected === null || selected === undefined) {
      filteredLinks = links;
    } else {
      filteredLinks = links.filter(
        (d) =>
          d.source.id === selected.__data__.id ||
          d.target.id === selected.__data__.id
      );
    }

    // Get the ids of nodes connected to the selected node
    const connectedNodeIds = new Set(
      filteredLinks.flatMap((d) => [d.source.id, d.target.id])
    );

    // Filter nodes based on the connectedNodeIds
    let filteredNodes = all_nodes.filter((d) => connectedNodeIds.has(d.id));

    if (selected === null || selected === undefined) {
      filteredNodes = all_nodes;
    } else if (connectedNodeIds.size === 0) {
      filteredNodes = all_nodes.filter((d) => d.id === selected.__data__.id);
    }

    filteredNodes = filteredNodes.filter(
      (d) =>
        degrees.get(d.id) >= filter.degrees &&
        (filter.categories.size === 0 ||
          categories.get(d.id).some((c) => filter.categories.has(c.text)))
    );

    filteredLinks = filteredLinks.filter(
      (d) =>
        filteredNodes.some((n) => n.id === d.source.id) &&
        filteredNodes.some((n) => n.id === d.target.id)
    );

    let linkSelection;
    try {
      linkSelection = g
        .selectAll("line")
        .data(filteredLinks, (d) => `${d.source.id}-${d.target.id}`);
      linkSelection.exit().remove();
    } catch (error) {
      console.error("oops");
      return;
    }

    linkSelection
      .enter()
      .append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.4)
      .merge(linkSelection)
      .attr("transform", `translate(${initialTranslate})`)
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    const nodeSelection = g
      .selectAll("circle")
      .data(filteredNodes, (d) => d.id);
    nodeSelection.exit().remove();
    nodeSelection
      .enter()
      .append("circle")
      .attr("transform", `translate(${initialTranslate})`)
      .attr("r", 10)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .attr("fill", (d) => color(degrees.get(d.id)))
      .on("mouseover", mouseover)
      .on("mouseout", mouseout)
      .on("click", click)
      .merge(nodeSelection)
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .call(drag(simulation));

    g.selectAll("circle").raise();
  }

  function clear() {
    if (selected) {
      highlight(selected, false);
      selected.dispatchEvent(new MouseEvent("click", { shiftKey: true }));
    }

    for (const node of selected_arr) {
      highlight(node, false);
    }
    selected_arr = [];
    filter = { degrees: -1, categories: new Set() };
  }
</script>

<section>
  <span>
    <p>Root:</p>
    <p class="root">
      {info.root}
    </p>
    <p>Hovered:</p>
    <p class="hover">
      {info.hovered}
    </p>
  </span>
  <svg></svg>
</section>

<style>
  span {
    width: 100%;
    max-width: 100%;
    display: grid;
    grid-template-columns: repeat(2, auto 3fr);
    gap: 0.5em;
    justify-items: center;
    align-content: center;
  }

  span p {
    color: white;
    font-size: 1em;
    font-family: sans-serif;

    max-width: 500px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  p:nth-child(odd) {
    text-decoration: underline;
    font-weight: bold;
  }

  section {
    grid-row: 2 / 3;
    grid-column: 2 / 3;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-evenly;
  }

  .root {
    color: red;
  }

  .hover {
    color: cornflowerblue;
  }

  svg {
    background: rgb(30, 30, 30);
    border: 1px solid #606060;

    fill: white;
    font-size: 1rem;
    font-family: sans-serif;

    height: 100%;
    width: 100%;
    box-sizing: border-box;
  }
</style>
