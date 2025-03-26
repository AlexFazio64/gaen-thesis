<script>
  import * as d3 from "d3";
  import { onMount } from "svelte";

  export let degrees = new Map();
  export let categories_map = new Map();
  export let dist_filter = undefined;

  let _x = -1;
  let _y = -1;

  $: if (dist_filter) {
    plot(degrees);
  }

  $: if (dist_filter === undefined) {
    plot(degrees);
  }

  function plot(data) {
    let filtered = new Map();

    if (dist_filter) {
      for (const degree of data.keys()) {
        if (!categories_map.get(degree).find((v) => v.text == dist_filter))
          continue;
        filtered.set(degree, data.get(degree));
      }
    } else {
      filtered = data;
    }

    const degreeCounts = {};
    for (const degree of filtered.values()) {
      degreeCounts[degree] = (degreeCounts[degree] || 0) + 1;
    }

    const degrees = Object.keys(degreeCounts).map(Number);
    const counts = Object.values(degreeCounts);

    const svg = d3.select("svg"),
      margin = { top: 40, right: 20, bottom: 50, left: 70 };

    let width, height;

    try {
      svg.attr("width");
      width = +svg.attr("width") - margin.left - margin.right;
      height = +svg.attr("height") - margin.top - margin.bottom;
    } catch (error) {
      console.error("oops");
      return;
    }

    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const maxBarWidth = 30;
    const barPadding = 0.1;

    let x = d3
      .scaleBand()
      .domain(degrees)
      .range([0, width])
      .padding(barPadding);

    let barWidth = x.bandwidth();
    if (barWidth > maxBarWidth) {
      x = d3
        .scaleBand()
        .domain(degrees)
        .range([0, degrees.length * (maxBarWidth + maxBarWidth * barPadding)])
        .padding(barPadding);
    }

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(counts)])
      .nice()
      .rangeRound([height, 0]);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat((d) => d))
      .selectAll("text")
      .attr("fill", "white")
      .attr("dy", "0.35em")
      .attr("x", 10)
      .attr("y", 10)
      .attr("transform", "rotate(45)")
      .style("text-anchor", "start");

    svg
      .append("text")
      .attr("fill", "white")
      .attr("x", margin.left + width / 2)
      .attr("y", height + margin.top + margin.bottom)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .text("Degree");

    g.append("g")
      .call(d3.axisLeft(y).ticks(10, "d"))
      .append("text")
      .attr("fill", "white")
      .attr("transform", "rotate(-90)")
      .attr("y", -50)
      .attr("dy", "0.71em")
      .attr("text-anchor", "middle")
      .text("Count");

    g.selectAll(".bar")
      .data(degrees)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d))
      .attr("y", (d) => y(degreeCounts[d]))
      .attr("width", x.bandwidth())
      .attr("height", (d) => height - y(degreeCounts[d]))
      .attr("fill", "white")
      .on("mouseover", function (d) {
        d3.select(this).attr("fill", "steelblue");
        _x = d.srcElement.__data__;
        _y = degreeCounts[d.srcElement.__data__];
      })
      .on("mouseout", function (_d) {
        d3.select(this).attr("fill", "white");
        _x = -1;
        _y = -1;
      });

    g.selectAll(".bar-text")
      .data(degrees)
      .enter()
      .append("text")
      .attr("x", (d) => x(d) + x.bandwidth() / 2)
      .attr("y", (d) => y(degreeCounts[d]) - 5)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", ".8em")
      .text((d) => degreeCounts[d]);
  }

  onMount(async () => {
    plot(degrees);
  });
</script>

<section id="distribution">
  <span>
    <p>
      Degree Distribution {dist_filter
        ? ": " + dist_filter
        : ": all categories"}
    </p>
    <p>{_x >= 0 ? "Degree: " + _x : ""}</p>
    <p>{_y >= 0 ? "#Nodes: " + _y : ""}</p>
  </span>
  <svg width="1200" height="590"></svg>
</section>

<style>
  span {
    width: 100%;
    max-width: 100%;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
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

  svg {
    background: rgb(30, 30, 30);
    border: 1px solid #606060;

    font-size: 1rem;
    font-family: sans-serif;

    height: 100%;
    width: 100%;
    box-sizing: border-box;

    color: white;
    fill: white;
  }

  section {
    grid-row: 2 / 3;
    grid-column: 2 / 3;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-evenly;
  }
</style>
