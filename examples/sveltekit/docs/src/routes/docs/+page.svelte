<script>
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  let searchQuery = '';
  let topics = [
    { title: 'Getting Started', href: '#getting-started' },
    { title: 'Routing', href: '#routing' },
    { title: 'Data Fetching', href: '#data-fetching' },
  ];

  let filteredTopics = topics;
  let showContent = false;

  $: {
    filteredTopics = topics.filter(topic => 
      topic.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  onMount(() => {
    showContent = true;
  });
</script>

<svelte:head>
  <title>SvelteKit Microfrontends Documentation</title>
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
    {#if showContent}
      <div in:fade="{{ duration: 300 }}" class="max-w-3xl mx-auto">
        <h1 class="text-4xl font-bold mb-6">Documentation</h1>
        
        <div class="mb-8">
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search documentation..."
            class="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        <div class="grid md:grid-cols-2 gap-4">
          {#each filteredTopics as topic (topic.title)}
            <a
              href={topic.href}
              class="bg-white p-4 rounded shadow hover:shadow-md transition duration-300"
            >
              <h2 class="text-xl font-semibold text-purple-700">{topic.title}</h2>
              <p class="text-gray-600 mt-2">Learn about {topic.title.toLowerCase()} in SvelteKit</p>
            </a>
          {/each}
        </div>

        {#if filteredTopics.length === 0}
          <p class="text-center text-gray-600 mt-4">No results found for "{searchQuery}"</p>
        {/if}
      </div>
    {/if}
  </main>

  <footer class="bg-gray-200 p-4 mt-8">
    <div class="container mx-auto text-center text-gray-600">
      <p>&copy; 2025 SvelteKit. All rights reserved.</p>
    </div>
  </footer>
</div>

<style>
  /* You can add any additional global styles here if needed */
</style>