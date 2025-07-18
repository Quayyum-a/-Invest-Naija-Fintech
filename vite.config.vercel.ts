import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Vercel-specific build config - excludes server dependencies
export default defineConfig({
  build: {
    outDir: "dist/spa",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
        },
      },
      external: [
        // Exclude server dependencies from client build
        "better-sqlite3",
        "pg",
        "express",
        "cors",
        "bcryptjs",
        "jsonwebtoken",
      ],
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  define: {
    "process.env.NODE_ENV": '"production"',
    "process.env.VERCEL": '"1"',
  },
  optimizeDeps: {
    exclude: ["better-sqlite3", "pg", "express"],
  },
});
