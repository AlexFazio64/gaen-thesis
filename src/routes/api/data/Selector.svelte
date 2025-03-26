<script>
  import { onMount } from "svelte";

  let data = [];

  onMount(() => {
    data = fetch("/api/data/all").then(async (res) => await res.json());
  });

  function redirect() {
    let selected = document.querySelector("select").value;
    selected = encodeURIComponent(selected);
    window.location.href = window.location.href + `/${selected}`;
  }
</script>

<section>
  <div>
    <select>
      {#await data then options}
        {#each options as item}
          <option value={item}>{item}</option>
        {/each}
      {/await}
    </select>
  </div>
  <input type="button" value="GO" on:click={redirect} />
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
    flex-direction: column;
    gap: 2em;

    background-color: rgba(0, 0, 0, 0.7);
  }

  div {
    width: 70%;
    display: flex;
    justify-content: center;
  }

  select {
    width: 100%;
    max-width: 800px;
    font-size: 1.5rem;
    padding: 0.5rem;
    border: 1px solid #606060;
    border-radius: 5px;
    background: rgb(30, 30, 30);
    color: white;
  }

  input[type="button"] {
    font-size: 1.5rem;
    padding: 0.5rem;
    border: 1px solid #606060;
    border-radius: 5px;
    background: rgb(30, 30, 30);
    color: white;

    width: 20%;
  }
</style>
