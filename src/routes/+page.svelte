<script lang="ts">
	import { select_element, attach_listener } from '$lib/index.ts';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';

	const reset = () => {
		status = '';
	};

	const unload = () => {
		fetch('http://localhost:11434/api/generate', {
			method: 'POST',
			body: JSON.stringify({ model: model, 'keep_alive': 0 })
		})
			.then((res) => res.json())
			.then((data) => {
				console.log('unloaded model', data.model);
				status = '';
			});
	};

	function load_models(data: string[]) {
		models.push(...data);
		models.sort((a, b) => (a.split(':')[0] < b.split(':')[0] ? -1 : 1));
		models = models;

		if (models.length > 0) {
			status = '';

			const saved = localStorage.getItem('model');
			if (saved && models.includes(saved)) {
				model = saved;
			} else model = models[0];
		}
	}

	async function mount_model(e: MouseEvent) {
		localStorage.setItem('model', model);

		let btn = e.currentTarget as HTMLButtonElement;
		btn.disabled = true;

		fetch(`http://localhost:11434/api/generate`, {
			body: JSON.stringify({ model }),
			headers: {
				'Content-Type': 'application/json'
			},
			method: 'POST'
		})
			.then((res) => {
				if (res.ok) status = 'ready';
				btn.disabled = false;
			})
			.catch((_err) => {
				console.error(_err);
				status = 'error';
				btn.disabled = false;
			});
	}

	onMount(() => {
		attach_listener();

		fetch('http://localhost:11434/api/tags')
			.then((res) => res.json())
			.then((data) => {
				load_models(data.models.map((m: any) => m.name));
			})
			.catch((_err) => {
				console.error(_err);
			});
	});

	let models: string[] = [];
	let model: string = '';
	let status: string = '';
</script>

<main>
	<cite>"I know everything."</cite>

	<p class="settings">settings</p>

	<div class="grid">
		<p>model</p>

		<span id="light" class={status}></span>

		<!-- error here in anonymous functions? -->
		<select name="llm" bind:value={model} on:change={reset} on:click={unload}>
		<!-- <select name="llm" bind:value={model} on:change={reset}> -->
			{#each models as m}
				{#if models.filter((mdl) => mdl.split(':')[0] === m.split(':')[0]).length > 1}
					<option value={m}>{m}</option>
				{:else}
				<option value={m}>{m.split(':')[0]}</option>
				{/if}
			{/each}
		</select>

		{#if status !== 'ready'}
			<button on:click={mount_model} transition:slide class="span3">load model</button>
		{/if}
	</div>

	<button
		on:click={(_e) => {
			select_element(model);
		}}>find text</button
	>
</main>

<style>
	main {
		padding: 20px;

		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: stretch;

		gap: 1em;
	}

	main > button {
		text-transform: uppercase;
	}

	cite {
		font-size: 1.3rem;
		align-self: center;
	}

	cite,
	p {
		cursor: default;
		user-select: none;
	}

	.h0 {
		height: 0;
	}

	.span3 {
		grid-column: span 3;
		width: fit-content;
		justify-self: center;
	}

	.settings {
		text-transform: uppercase;
		font-weight: bold;
		width: 100%;
		text-align: center;

		border-bottom: 1px solid var(--hat);
	}

	.grid {
		display: grid;
		grid-template-columns: auto 30px 1fr;
		grid-template-rows: 1fr 1fr;
		align-items: center;
		align-content: space-between;

		gap: 1em;
	}

	button {
		background-color: var(--hair);
		color: var(--shirt);
		border: 1px solid var(--shirt);
		border-radius: 5px;
		padding: 5px 10px;
		cursor: pointer;
	}

	button:disabled {
		background-color: var(--pants);
		color: var(--hat);
		border-color: var(--hat);
		cursor: wait;
	}

	select {
		background-color: rgba(0, 0, 0, 0);
		border: none;
		border-bottom: 1px solid var(--hat);
		color: var(--hat);
		outline: none;
		cursor: pointer;
	}

	option {
		background-color: var(--hair);
		color: var(--hat);
	}

	option:checked {
		background-color: var(--shirt);
		color: var(--hat);
	}

	#light {
		width: 15px;
		height: 15px;
		border-radius: 50%;
		border-color: transparent;
		background-color: var(--hat);
		animation: none;
		justify-self: end;
	}

	#light.loading {
		background-color: var(--star);
		animation: blink 1s infinite;
	}

	#light.error {
		background-color: var(--pants);
		animation: none;
	}

	#light.ready {
		background-color: var(--shirt);
		animation: fade 2s forwards;
	}

	@keyframes fade {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}

	@keyframes blink {
		0% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
		100% {
			opacity: 1;
		}
	}
</style>
