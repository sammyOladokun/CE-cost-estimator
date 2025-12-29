import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "NexWidget",
      fileName: "nex-widget",
      formats: ["iife"],
    },
    rollupOptions: {
      output: {
        extend: true, // keep window.nexWidget assignment
      },
    },
  },
});
