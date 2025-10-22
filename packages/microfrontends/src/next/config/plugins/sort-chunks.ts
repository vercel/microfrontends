import { type Compiler } from 'webpack';

export class SortChunksPlugin {
  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap('SortChunksPlugin', (compilation) => {
      compilation.hooks.optimizeChunks.tap('SortChunksPlugin', (chunks) => {
        const sortedChunks = Array.from(chunks).sort((a, b) => {
          // Sort by chunk name first
          if (a.name && b.name) {
            return a.name.localeCompare(b.name);
          }
          // If names are the same or undefined, sort by id
          return (String(a.id) || '').localeCompare(String(b.id) || '');
        });

        // Clear the original chunks set and add sorted chunks
        Array.from(chunks).forEach((chunk) => {
          compilation.chunks.delete(chunk);
        });
        sortedChunks.forEach((chunk) => {
          compilation.chunks.add(chunk);
        });
      });
    });
  }
}
