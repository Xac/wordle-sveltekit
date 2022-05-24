<script>
  import '../app.css';
</script>

<main>
  <slot />
</main>

<style>
  :global(body) {
    @apply dark:bg-zinc-900;
  }
</style>
