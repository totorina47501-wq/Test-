import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const base=process.env.VITE_BASE_PATH||"/react-preview/";

export default defineConfig({
  base,
  plugins:[react()],
  server:{proxy:{"/api":"http://localhost:3000"}}
});
