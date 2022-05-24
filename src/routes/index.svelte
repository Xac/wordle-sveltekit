<script context="module">
  export const prerender = true;
</script>

<script>
  import Wordle from '$lib/Wordle.svelte';
</script>

<svelte:head>
  <title>Wordle</title>
  <meta name="description" content="Wordle clone in Sveltekit!" />
</svelte:head>

<section>
  <Wordle />
</section>
