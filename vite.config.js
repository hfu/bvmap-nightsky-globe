export default {
  base: "./",
  build: { outDir: "docs", emptyOutDir: true },
  optimizeDeps: { exclude: ["@ortho-earth/globe", "@ortho-earth/core"] },
  worker: { format: "es" },
};
