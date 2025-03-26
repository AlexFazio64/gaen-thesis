<script>
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  export let show_distribution = false;
  export let categories_set = new Set();
  $: categories_set = Array.from(categories_set).sort();

  let categories = new Set();
  let degrees = 0;

  function sendFilter({ target }) {
    const category = target.title ? target.title : null;
    if (category !== null) {
      target.classList.toggle("selected");

      if (!show_distribution) {
        categories.has(category)
          ? categories.delete(category)
          : categories.add(category);
      } else {
        if (categories.has(category)) categories = new Set();
        else {
          categories = new Set([category]);
          document.querySelectorAll("section>button").forEach((button) => {
            button.classList.remove("selected");
          });
          target.classList.add("selected");
        }
      }
    }
    categories = categories;

    dispatch("filter", { degrees, categories });
  }

  function clear(_e) {
    categories = new Set();
    degrees = -1;

    document.querySelectorAll("section>button.selected").forEach((button) => {
      button.classList.remove("selected");
    });

    dispatch("filter", { degrees, categories });
    dispatch("clear");
  }
</script>

<nav>
  <section id="categories">
    <span></span>
    {#each categories_set as category}
      <button title={category} on:click={sendFilter}>{category}</button>
    {/each}
    <span></span>
  </section>

  <div>
    <input
      type="number"
      min="-1"
      max="250"
      value={degrees}
      on:input={(e) => (degrees = e.target.value)}
      on:blur={sendFilter}
      on:keypress={(e) => {
        if (e.key === "Enter") sendFilter(e);
      }}
    />
  </div>

  <button class="clear selected" on:click={clear}>Clear</button>
</nav>

<style>
  nav {
    display: grid;
    grid-template-columns: 1fr auto auto;

    grid-column: 2 / 3;
    position: relative;
  }

  section {
    display: flex;
    flex-direction: row-reverse;
    align-items: center;
    gap: 0.5rem;

    border: 1px solid #606060;

    overflow-x: auto;
    white-space: nowrap;
  }

  section button {
    min-width: 125px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .clear {
    width: 80px;
    font-size: 1rem;
    align-self: center;
  }

  button {
    border: none;
    background-color: hsl(0, 0%, 18%);
    color: white;
    text-transform: uppercase;
    font-size: 0.7rem;
    padding: 0.5rem;
    cursor: pointer;

    white-space: nowrap;
  }

  .selected {
    background-color: hsl(0, 68%, 38%);
  }

  nav::before,
  div::before {
    content: "";
    width: 60px;
    height: 100%;
    position: absolute;
    pointer-events: none;
  }

  nav::before {
    left: 0;
    background: linear-gradient(
      to right,
      rgba(24, 26, 27, 1) 10%,
      rgba(24, 26, 27, 0) 100%
    );
  }

  div::before {
    left: -60px;
    background: linear-gradient(
      to left,
      rgba(24, 26, 27, 1) 10%,
      rgba(24, 26, 27, 0) 100%
    );
  }

  div {
    position: relative;
    display: flex;
    align-items: center;
  }

  input {
    width: 60px;
    height: 100%;
    background: none;
    color: white;
    border: none;
    text-align: center;
    font-size: 1rem;
  }

  input:focus {
    outline: none;
  }

  section::-webkit-scrollbar {
    display: none;
  }
</style>
