import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import {execFileSync} from "node:child_process";

const buildSha=process.env.BITGOLD_BUILD_SHA||process.env.GITHUB_SHA||(()=>{try{return execFileSync("git",["rev-parse","--short","HEAD"],{encoding:"utf8"}).trim()}catch{return "unknown"}})();
const base=process.env.VITE_BASE_PATH||"/react-preview/";

export default defineConfig({
  base,
  define:{"__BITGOLD_BUILD_SHA__":JSON.stringify(buildSha)},
  plugins:[react()],
  server:{proxy:{"/api":"http://localhost:3000"}}
});
