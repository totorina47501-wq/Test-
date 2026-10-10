// Never label a cached quote as fresh when the provider omits an asset.
export function resolveMarketQuote(item,previousPrice,previousUpdatedAt,now){
 const price=Number(item?.eur);
 const fresh=Number.isFinite(price)&&price>0;
 const fallback=Number(previousPrice);
 return {price:fresh?price:Number.isFinite(fallback)&&fallback>0?fallback:0,priceFresh:fresh,priceUpdatedAt:fresh?now:(Number(previousUpdatedAt)||null)};
}
