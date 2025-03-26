<script>
  import { onMount } from "svelte";
  import NavBar from "./NavBar.svelte";
  import Search from "./Search.svelte";
  import SideBar from "./SideBar.svelte";
  import ForceGraph from "./ForceGraph.svelte";
  import Distribution from "./Distribution.svelte";
  import Assortativity from "./Assortativity.svelte";

  let show_search = false;
  let show_distribution = false;
  let show_assortativity = false;

  let toggle = false;
  let edges = [];
  let selected_arr = [];
  let categories_map = new Map();
  let categories_set = new Set();
  let degrees = new Map();
  let filter = { degrees: -1, categories: new Set() };
  let dist_filter = "";

  function handle_clear(_e) {
    show_search = false;
    filter = { degrees: 0, categories: new Set() };
    toggle = true;

    const clear = document.querySelector("button.clear");
    if (clear) clear.click();
  }

  function handle_cleared(_e) {
    toggle = false;
  }

  function handle_selection(event) {
    selected_arr = event.detail.arr;
    edges = event.detail.edges;
  }

  function handle_categories(event) {
    let new_set = new Set();
    categories_map = event.detail.categories;
    categories_map.forEach((value) => {
      value.forEach((v) => {
        new_set.add(v.text);
      });
    });
    categories_set = new_set;
  }

  function handle_degrees(event) {
    degrees = event.detail.degrees;
  }

  function handle_filter({ detail }) {
    if (show_distribution) {
      const val = detail.categories.values().next().value;
      dist_filter = val;
      return;
    } else {
      filter.categories = detail.categories;
      filter.degrees = detail.degrees;
    }
    filter = filter;
  }

  function handle_search(event) {
    show_search = false;
    filter.node = event.detail.query;
    filter = filter;
  }

  onMount(() => {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") handle_clear();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "p" && e.altKey) show_search = !show_search;
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "d" && e.altKey && e.ctrlKey) {
        show_distribution = !show_distribution;
        show_search = show_assortativity = false;
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "a" && e.altKey && e.ctrlKey) {
        show_assortativity = !show_assortativity;
        show_search = show_distribution = false;
      }
    });
  });
</script>

<main>
  {#if show_search}
    <Search on:search={handle_search} />
  {/if}

  <SideBar {selected_arr} {edges} {categories_map} {degrees} />
  <NavBar
    on:clear={handle_clear}
    on:filter={handle_filter}
    {categories_set}
    {show_distribution}
  />

  {#if show_distribution}
    <Distribution {degrees} {categories_map} {dist_filter} />
  {:else if show_assortativity}
    <Assortativity {degrees} {categories_map} {categories_set} />
  {:else}
    <ForceGraph
      on:cleared={handle_cleared}
      on:selection={handle_selection}
      on:categories={handle_categories}
      on:degrees={handle_degrees}
      {toggle}
      {filter}
    />
  {/if}
</main>

<style>
  main {
    display: grid;
    height: 100vh;
    width: 100vw;
    column-gap: 0.8rem;

    grid-template-rows: 50px auto;
    grid-template-columns: 1fr 4fr;
  }
</style>
