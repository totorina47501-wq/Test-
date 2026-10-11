// Never label a cached quote as fresh when the provider omits an asset.
export function resolveMarketQuote(item,previousPrice,previousUpdatedAt,now){
 const price=Number(item?.eur);
 const fresh=Number.isFinite(price)&&price>0;
 const fallback=Number(previousPrice);
 return {price:fresh?price:Number.isFinite(fallback)&&fallback>0?fallback:0,priceFresh:fresh,priceUpdatedAt:fresh?now:(Number(previousUpdatedAt)||null)};
}

// Preserve the last known prices and their timestamps, but never report a
// failed provider refresh as a fresh quote. Do not mutate the cached rows.
export function markMarketSnapshotStale(snapshot){
 return snapshot.map(row=>({...row,priceFresh:false,priceUpdatedAt:row.priceUpdatedAt??null}));
}
