import { defineConfig } from "vite";

// TODO: *must* copy memes.json to dist
export default defineConfig({
  build: {
    target: "es2018",
    minify: "esbuild"
  }
});
