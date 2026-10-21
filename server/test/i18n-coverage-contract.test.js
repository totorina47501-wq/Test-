import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../../frontend/src/i18n.ts",import.meta.url),"utf8");
test("Only FR EN ES can be selected and persisted",()=>{
 assert.match(source,/export const languages=\["fr","en","es"\] as const/);
 assert.match(source,/languages\.includes\(language as SupportedLanguage\)/);
 assert.match(source,/document\.documentElement\.lang=supported/);
});
test("UI translation dictionary is statically typed",()=>{
 assert.match(source,/export type TranslationKey=keyof typeof translations\.fr/);
 assert.match(source,/const translations=\{/);
 assert.match(source,/\n fr:\{/);
 assert.match(source,/\n en:\{/);
 assert.match(source,/\n es:\{/);
});
