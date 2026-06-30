import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const port = Number(process.env.PORT) || 5173;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/trpc": { target: "http://localhost:3001", changeOrigin: true },
      "/health": { target: "http://localhost:3001", changeOrigin: true },
    },
  },
  preview: {
    host: "0.0.0.0",
    port,
    strictPort: true,
  },
});
