<script>
  import { createEventDispatcher, onMount } from "svelte";
  const dispatch = createEventDispatcher();

  onMount(() => {
    const search = document.getElementById("search");
    search.focus();
  });
</script>

<section>
  <div>
    <input
      id="search"
      type="text"
      placeholder="search nodes"
      on:keypress={(e) => {
        if (e.key === "Enter") {
          dispatch("search", { query: e.target.value });
        }
      }}
    />
  </div>
</section>

<style>
  section {
    width: 100vw;
    height: 100vh;
    z-index: 100;

    position: absolute;

    display: flex;
    align-items: center;
    justify-content: center;

    background-color: rgba(0, 0, 0, 0.7);
  }

  div {
    width: 70%;
    display: flex;
    justify-content: center;
  }

  input {
    width: 100%;
    max-width: 800px;
    font-size: 1.5rem;
    padding: 0.5rem;
    border: 1px solid #606060;
    border-radius: 5px;
    background: rgb(30, 30, 30);
    color: white;
  }
</style>
