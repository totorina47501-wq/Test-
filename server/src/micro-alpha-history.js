// Immutable, user-scoped snapshots: never backfill fictitious price history.
export function observedPerformance(points){
 const rows=points.map(p=>({at:p.observedAt,priceUpdatedAt:p.priceUpdatedAt,equityEur:Number(p.equityEur),pnlEur:Number(p.pnlEur),priceEur:Number(p.priceEur)}));
 let peak=0,maxDrawdownPct=0;
 for(const p of rows){
  if(!Number.isFinite(p.equityEur)||p.equityEur<=0)throw Error("Invalid equity history");
  peak=Math.max(peak,p.equityEur);
  maxDrawdownPct=Math.max(maxDrawdownPct,(peak-p.equityEur)/peak*100);
 }
 return {points:rows,sampleCount:rows.length,maxObservedDrawdownPct:rows.length>1?maxDrawdownPct:null,firstObservedAt:rows[0]?.at||null,lastObservedAt:rows.at(-1)?.at||null,simulation:true,marketVerified:true,scope:"observed-points-only"};
}
export async function recordMarketValuation(client,userId,valuation){
 if(valuation?.marketVerified!==true||valuation.valuation!=="verified-market-snapshot"||valuation.priceSource!=="CoinGecko"||!Number.isFinite(valuation.priceUpdatedAt))throw Error("Unverified market valuation");
 // One point per user per quote timestamp. Conflict updates the latest account equity without inflating sample count.
 const result=await client.query(`INSERT INTO micro_alpha_valuations(user_id,price_updated_at,price_eur,equity_eur,pnl_eur,exposure_eur)
 VALUES($1,to_timestamp($2::double precision / 1000),$3,$4,$5,$6)
 ON CONFLICT(user_id,price_updated_at) DO UPDATE SET
 price_eur=EXCLUDED.price_eur,equity_eur=EXCLUDED.equity_eur,pnl_eur=EXCLUDED.pnl_eur,exposure_eur=EXCLUDED.exposure_eur
 RETURNING price_updated_at`,[userId,valuation.priceUpdatedAt,valuation.priceEur,valuation.equityEur,valuation.pnlEur,valuation.exposureEur]);
 return result.rows.length>0;
}
export async function marketHistory(client,userId,limit=90){
 const safeLimit=Math.min(365,Math.max(1,Math.trunc(Number(limit)||90)));
 const result=await client.query(`SELECT observed_at AS "observedAt",extract(epoch FROM price_updated_at)*1000 AS "priceUpdatedAt",
 price_eur AS "priceEur",equity_eur AS "equityEur",pnl_eur AS "pnlEur"
 FROM micro_alpha_valuations WHERE user_id=$1 ORDER BY price_updated_at DESC LIMIT $2`,[userId,safeLimit]);
 return observedPerformance(result.rows.reverse());
}
export async function clearMarketHistory(client,userId){
 await client.query("DELETE FROM micro_alpha_valuations WHERE user_id=$1",[userId]);
}
