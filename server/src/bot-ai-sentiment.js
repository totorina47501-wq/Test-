const POSITIVE = [
  "bullish","rally","surge","soar","gain","gains","growth","adoption","approval","approved",
  "breakout","record","strong","strength","positive","optimistic","recovery","recover","inflow",
  "inflows","accumulate","accumulation","support","upgrade","partnership","launch","institutional"
];
const NEGATIVE = [
  "bearish","crash","drop","drops","loss","losses","decline","fall","falls","selloff","selling",
  "liquidation","liquidations","hack","hacked","exploit","lawsuit","ban","banned","outflow",
  "outflows","risk-off","negative","pessimistic","fear","fraud","scam","bankruptcy","default",
  "downgrade","warning","volatility"
];
const ASSET_ALIASES = {
  BTC:["bitcoin","btc"],
  ETH:["ethereum","eth"],
  SOL:["solana","sol"],
  LINK:["chainlink","link"],
  AVAX:["avalanche","avax"]
};
const SOURCE_WEIGHT = {
  Cointelegraph:1,
  CoinDesk:1,
  Decrypt:.9,
  "Bitcoin Magazine":.9,
  CryptoSlate:.8,
  "The Block":1
};
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
function tokens(text){
  return String(text||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").split(/[^a-z0-9-]+/).filter(Boolean);
}
function lexiconScore(text){
  const list=tokens(text);
  if(!list.length)return 0;
  let score=0;
  for(const token of list){
    if(POSITIVE.includes(token))score+=1;
    if(NEGATIVE.includes(token))score-=1;
  }
  return clamp(score/Math.max(4,Math.sqrt(list.length)*2),-1,1);
}
function articleSentiment(item,now=Date.now()){
  const title=String(item?.title||"");
  const summary=String(item?.summary||item?.description||"");
  const raw=Math.max(-1,Math.min(1,lexiconScore(title)*1.35+lexiconScore(summary)*.65));
  const ageHours=Math.max(0,(now-Date.parse(item?.publishedAt||""))/3600000);
  const freshness=Math.exp(-ageHours/36);
  const source=SOURCE_WEIGHT[String(item?.source||"")]||.75;
  const strength=Math.abs(raw)*freshness*source;
  return {score:raw*freshness*source,confidence:clamp(.35+Math.min(.6,Math.abs(raw)*.65)*freshness,0,1),freshness,sourceWeight:source,strength};
}
export function scoreNews(items=[],now=Date.now()){
  const articles=Array.isArray(items)?items.filter(Boolean):[];
  const perAsset=Object.fromEntries(Object.keys(ASSET_ALIASES).map(asset=>[asset,{score:0,confidence:0,articles:0}]));
  let globalWeighted=0,globalWeight=0;
  for(const item of articles){
    const text=(String(item.title||"")+" "+String(item.summary||item.description||"")).toLowerCase();
    const result=articleSentiment(item,now);
    const weight=Math.max(.15,result.confidence*result.freshness);
    globalWeighted+=result.score*weight;
    globalWeight+=weight;
    for(const [asset,aliases] of Object.entries(ASSET_ALIASES)){
      if(aliases.some(alias=>text.includes(alias))){
        const bucket=perAsset[asset];
        bucket.score+=result.score*weight;
        bucket.confidence=Math.max(bucket.confidence,result.confidence);
        bucket.articles+=1;
      }
    }
  }
  for(const bucket of Object.values(perAsset)){
    if(bucket.articles){bucket.score=clamp(bucket.score/Math.max(.25,bucket.articles),-1,1);}
    bucket.confidence=clamp(bucket.confidence,0,1);
    bucket.bias=bucket.score>.15?"positive":bucket.score<-.15?"negative":"neutral";
  }
  const globalScore=globalWeight?clamp(globalWeighted/globalWeight,-1,1):0;
  return {
    score:Number(globalScore.toFixed(3)),
    confidence:Number(clamp(Math.min(1,globalWeight/Math.max(1,articles.length*.55)),0,1).toFixed(3)),
    bias:globalScore>.15?"positive":globalScore<-.15?"negative":"neutral",
    articles:articles.length,
    perAsset
  };
}
export function blendForecastWithSentiment(forecastValue,sentiment){
  const newsScore=clamp(Number(sentiment?.score||0),-1,1);
  const confidence=clamp(Number(sentiment?.confidence||0),0,1);
  const adjustment=newsScore*.14*confidence;
  const score=clamp(Number(forecastValue?.score||.5)+adjustment,0,1);
  return {...forecastValue,score,upProbability:clamp(.5+(score-.5)*1.25,0,1),sentimentAdjustment:Number(adjustment.toFixed(3))};
}
