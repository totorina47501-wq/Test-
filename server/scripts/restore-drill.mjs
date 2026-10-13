#!/usr/bin/env node
/**
 * Operator-controlled PostgreSQL backup/restore drill.
 * Never touches the production database as a restore destination.
 * Requires separate explicit source and disposable destination URLs.
 */
import {spawnSync} from "node:child_process";
import {mkdtemp,rm,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
const source=process.env.BITGOLD_BACKUP_SOURCE_URL;
const destination=process.env.BITGOLD_RESTORE_DISPOSABLE_URL;
const consent=process.env.BITGOLD_RESTORE_DRILL_ACK;
const isSafeUrl=value=>{try{const u=new URL(value);return ["postgres:","postgresql:"].includes(u.protocol)&&Boolean(u.hostname&&u.pathname.length>1)}catch{return false}};
const sameDb=(a,b)=>{const x=new URL(a),y=new URL(b);return x.hostname===y.hostname&&x.port===y.port&&x.pathname===y.pathname};
if(!isSafeUrl(source)||!isSafeUrl(destination)||sameDb(source,destination)||consent!=="DISPOSABLE_DATABASE_ONLY"){
 console.error("Restore drill blocked: provide distinct PostgreSQL source/destination URLs and explicit disposable-only acknowledgment.");
 process.exit(2);
}
if(process.env.NODE_ENV==="production"||process.env.BITGOLD_PRODUCTION_DATABASE_URL===destination){
 console.error("Restore drill blocked: production destination prohibited.");
 process.exit(2);
}
const dir=await mkdtemp(join(tmpdir(),"bitgold-restore-"));
const dump=join(dir,"backup.dump");
const run=(command,args,env)=>spawnSync(command,args,{env,stdio:"pipe",timeout:120000,encoding:"utf8"});
try{
 const backup=run("pg_dump",["--format=custom","--no-owner","--file",dump,source],process.env);
 if(backup.status!==0)throw new Error("pg_dump failed; verify source access and pg_dump installation");
 const restore=run("pg_restore",["--clean","--if-exists","--no-owner","--dbname",destination,dump],process.env);
 if(restore.status!==0)throw new Error("pg_restore failed; verify disposable database and privileges");
 const verify=run("psql",[destination,"-X","-A","-t","-c","SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'"],process.env);
 if(verify.status!==0||Number(verify.stdout.trim())<1)throw new Error("Restored schema verification failed");
 const result={checkedAt:new Date().toISOString(),outcome:"PASS",restoredPublicTables:Number(verify.stdout.trim()),source:"redacted",destination:"redacted"};
 if(process.env.BITGOLD_RESTORE_EVIDENCE_PATH)await writeFile(process.env.BITGOLD_RESTORE_EVIDENCE_PATH,JSON.stringify(result,null,2)+"\n");
 console.log(JSON.stringify(result));
}catch(error){console.error("Restore drill FAIL:",error.message);process.exitCode=1}
finally{await rm(dir,{recursive:true,force:true})}
