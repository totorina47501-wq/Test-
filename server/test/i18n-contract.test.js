import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");
test("Launch language selector exposes FR EN ES only",()=>{
 const source=read("../../frontend/src/i18n.ts");
 assert.match(source,/export const languages=\["fr","en","es"\] as const/);
 for(const language of ["fr","en","es"])assert.match(source,new RegExp(language+":\\{"));
});
test("Account loading and error status have FR EN ES translations",()=>{
 const source=read("../../frontend/src/components/AccountPage.tsx");
 assert.match(source,/const accountStatusCopy=\{fr:/);
 assert.match(source,/,en:\{loading:/);
 assert.match(source,/,es:\{loading:/);
});
