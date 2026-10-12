import {readdirSync,statSync} from "node:fs";
import {join,relative,extname} from "node:path";
import {spawnSync} from "node:child_process";
const root=new URL("../",import.meta.url).pathname;
const extensions=new Set([".js",".mjs",".cjs"]);
const ignore=new Set(["node_modules",".git","dist","build","coverage","playwright-report","test-results",".next"]);
const files=[];
function walk(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){if(ignore.has(entry.name))continue;const file=join(dir,entry.name);if(entry.isDirectory())walk(file);else if(entry.isFile()&&extensions.has(extname(entry.name)))files.push(file)}}
walk(root);
files.sort();let errors=0;
for(const file of files){const result=spawnSync(process.execPath,["--check",file],{encoding:"utf8"});if(result.status!==0){errors++;console.error("\\n[syntax] "+relative(root,file)+"\\n"+(result.stderr||result.stdout))}}
console.log("JavaScript syntax: "+files.length+" files, "+errors+" errors");
if(errors)process.exitCode=1;
