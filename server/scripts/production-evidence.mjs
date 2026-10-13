#!/usr/bin/env node
/** Read-only deployment evidence. Never infer deployed SHA from HTTP 200 or GitHub CI. */
import {writeFile} from "node:fs/promises";
const base=(process.env.BITGOLD_PROD_URL||"https://p01--service-bitgold--dvn9t2gvmtgx.code.run").replace(/\/$/,"");
const expected=(process.env.BITGOLD_EXPECTED_SHA||"").trim().toLowerCase();
const paths=["/","/api/health","/investir","/bots","/portefeuille","/activite"];
const routes=[];
const revisionHeaders=["x-deployment-sha","x-commit-sha","x-git-sha","x-revision"];
let homeHtml="";
for(const path of paths){
 try{
  const response=await fetch(base+path,{signal:AbortSignal.timeout(12000),redirect:"follow"});
  const exposed=Object.fromEntries(revisionHeaders.filter(h=>response.headers.has(h)).map(h=>[h,response.headers.get(h)]));
  if(path==="/")homeHtml=await response.text();
  routes.push({path,status:response.status,ok:response.ok,revisionHeaders:exposed});
 }catch(error){routes.push({path,ok:false,error:error?.name==="TimeoutError"?"timeout":"request failed"});}
}
const candidates=[...new Set(routes.flatMap(r=>Object.values(r.revisionHeaders||{})).filter(Boolean).map(s=>String(s).trim().toLowerCase()))];
const exactHeaderMatch=Boolean(expected&&candidates.some(x=>x===expected));
let bundleContainsExpectedSha=false;
const checkedBundles=[];
if(expected&&homeHtml){
 const sources=[...homeHtml.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(match=>match[1]).slice(0,6);
 for(const src of sources){
  try{
   const url=new URL(src,base+"/");
   if(url.origin!==new URL(base).origin)continue;
   const response=await fetch(url,{signal:AbortSignal.timeout(12000),redirect:"follow"});
   checkedBundles.push({path:url.pathname,status:response.status});
   if(!response.ok)continue;
   const body=await response.text();
   if(body.toLowerCase().includes(expected)){bundleContainsExpectedSha=true;break;}
  }catch{checkedBundles.push({path:String(src),status:"ERR"});}
 }
}
const identity=expected&&(exactHeaderMatch||bundleContainsExpectedSha)?"VERIFIED":"UNVERIFIED";
const evidenceSources=[...(exactHeaderMatch?["revision-header"]:[]),...(bundleContainsExpectedSha?["frontend-bundle"]:[])];
const result={checkedAt:new Date().toISOString(),productionUrl:base,expectedGithubSha:expected||null,identity,evidenceSources,exposedRevisions:candidates,checkedBundles,routes,warning:identity==="UNVERIFIED"?"HTTP success and browser smoke do not prove deployed commit identity. Verify Northflank deployment revision independently.":null};
await writeFile("production-evidence.json",JSON.stringify(result,null,2)+"\n");
console.log("Production deployment identity:",identity,"; evidence:",evidenceSources.join(",")||"none","; public routes:",routes.map(r=>r.path+":"+String(r.status||"ERR")).join(" "));
if(routes.some(r=>!r.ok)){console.error("One or more production routes unavailable");process.exitCode=1;}
