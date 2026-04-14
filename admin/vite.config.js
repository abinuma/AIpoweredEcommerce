import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite'   // ← this import is required!

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),],
  server: { port: 5174 },
});
