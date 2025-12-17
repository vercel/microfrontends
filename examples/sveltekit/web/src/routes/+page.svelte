<script>
import { onMount } from 'svelte';

let showWelcome = false;

onMount(() => {
  showWelcome = true;
});
</script>

<svelte:head>
  <title>SvelteKit Microfrontends</title>
</svelte:head>

<div class="flex flex-col min-h-screen bg-gray-100">
  <header class="bg-purple-700 text-white p-4">
    <div class="container mx-auto flex justify-between items-center">
      <div class="text-2xl font-bold">SvelteKit</div>
      <nav>
        <ul class="flex space-x-4">
          <li><a href="/" class="hover:text-purple-200">Home</a></li>
          <li><a href="/docs" class="hover:text-purple-200">Docs</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main class="flex-grow container mx-auto px-4 py-8">
    {#if showWelcome}
      <div in:fly="{{ y: 50, duration: 500 }}" class="text-center">
        <h1 class="text-4xl font-bold mb-4">Welcome to SvelteKit</h1>
        <p class="text-xl mb-8">Build high-performance web apps with ease</p>
        <a href="/docs" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition duration-300">
          Explore Docs
        </a>
      </div>
    {/if}
  </main>

  <footer class="bg-gray-200 p-4">
    <div class="container mx-auto text-center text-gray-600">
      <p>&copy; 2025 SvelteKit. All rights reserved.</p>
    </div>
  </footer>
</div>
