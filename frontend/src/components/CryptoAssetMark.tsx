import type {CSSProperties} from "react";

const marks:Record<string,{glyph:string;color:string;name:string}>={
  BTC:{glyph:"₿",color:"#f7931a",name:"Bitcoin"},
  ETH:{glyph:"◆",color:"#6777ae",name:"Ethereum"},
  SOL:{glyph:"≋",color:"#8054cf",name:"Solana"},
  USDC:{glyph:"$",color:"#2775ca",name:"USD Coin"},
  LINK:{glyph:"⬡",color:"#326ce5",name:"Chainlink"},
  AVAX:{glyph:"▲",color:"#e84142",name:"Avalanche"}
};
/** Lightweight, offline crypto identifiers; glyphs are illustrative, not official brand artwork. */
export function CryptoAssetMark({symbol,size=32}:{symbol:string;size?:number}){
  const code=String(symbol||"").trim().toUpperCase();
  const mark=marks[code];
  const style:CSSProperties={width:size,height:size,background:mark?.color||"#334155",fontSize:size*.57};
  return <span role="img" aria-label={mark?.name||code||"Actif crypto"} title={mark?.name||code} style={style} className="inline-flex shrink-0 items-center justify-center rounded-full font-black leading-none text-white shadow-sm shadow-black/30">{mark?.glyph||code.slice(0,1)||"?"}</span>;
}
