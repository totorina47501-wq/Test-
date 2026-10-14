import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
const root=path.resolve("src"),files=[];
const walk=dir=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())walk(f);else if(e.isFile()&&f.endsWith(".tsx"))files.push(f)}};
walk(root);let failed=false;
for(const file of files){const sf=ts.createSourceFile(file,fs.readFileSync(file,"utf8"),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);for(const d of sf.parseDiagnostics){failed=true;const p=sf.getLineAndCharacterOfPosition(d.start??0);console.error(`${file}:${p.line+1}:${p.character+1} TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText," ")}`)}}
if(failed)process.exit(1);console.log(`TSX syntax lint passed: ${files.length} files checked.`);
