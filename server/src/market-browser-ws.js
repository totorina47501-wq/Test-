// Read-only, same-origin WebSocket market stream. No authentication tokens or trades on this channel.
import {createHash} from "node:crypto";
const MAGIC="258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
export function encodeFrame(data){
 const body=Buffer.from(JSON.stringify(data));
 const header=body.length<126?Buffer.from([0x81,body.length]):body.length<65536?Buffer.from([0x81,126,body.length>>8,body.length&255]):Buffer.from([0x81,127,0,0,0,0,(body.length/16777216)&255,(body.length>>16)&255,(body.length>>8)&255,body.length&255]);
 return Buffer.concat([header,body]);
}
export function attachMarketSocket(server,getSnapshot,{intervalMs=2000,maxClients=200}={}){
 const clients=new Set();
 server.on("upgrade",(req,socket,head)=>{
  const host=req.headers.host;
  let url;
  try{url=new URL(req.url||"/","http://"+host)}catch{socket.destroy();return}
  const origin=req.headers.origin;
  const key=req.headers["sec-websocket-key"];
  if(url.pathname!=="/api/market/ws"||req.method!=="GET"||req.headers.upgrade?.toLowerCase()!=="websocket"||req.headers["sec-websocket-version"]!=="13"||typeof key!=="string"||!(/^[A-Za-z0-9+/]{22}==$/).test(key)||!origin||new URL(origin).host!==host||clients.size>=maxClients){socket.destroy();return}
  const accept=createHash("sha1").update(key+MAGIC).digest("base64");
  socket.write("HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: "+accept+"\r\n\r\n");
  socket.setTimeout(90000);
  clients.add(socket);
  const remove=()=>clients.delete(socket);
  socket.on("close",remove);socket.on("error",remove);socket.on("timeout",()=>socket.destroy());
  // Client messages are never interpreted as commands. Close on unexpected data.
  socket.on("data",()=>socket.end());
  if(head?.length)socket.end();
 });
 let last="";
 const timer=setInterval(()=>{
  if(!clients.size)return;
  try{
   const snapshot=getSnapshot();
   const serialized=JSON.stringify(snapshot);
   if(serialized===last)return;
   last=serialized;
   const frame=encodeFrame(snapshot);
   for(const socket of clients){if(socket.destroyed){clients.delete(socket);continue}if(socket.writableLength>1024*1024){socket.destroy();continue}socket.write(frame)}
  }catch{/* a provider failure must not stop the server */}
 },intervalMs);
 timer.unref?.();
 return ()=>{clearInterval(timer);for(const socket of clients)socket.destroy();clients.clear()};
}
