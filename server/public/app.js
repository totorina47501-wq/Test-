function safeStorageGet(key){try{return localStorage.getItem(key)||""}catch{return ""}}
function safeStorageSet(key,value){try{localStorage.setItem(key,value)}catch{}}
function safeStorageRemove(key){try{localStorage.removeItem(key)}catch{}}
const configuredApi=(safeStorageGet("bitgold-api")||window.BITGOLD_API||"").trim().replace(/\/$/,"");
const API=configuredApi||window.location.origin;
let apiToken=safeStorageGet("bitgold-token");
let authMode="login";
let tradeSide="buy";
let state={cash:10000,holdings:{BTC:0,ETH:0,SOL:0,USDC:0,LINK:0,AVAX:0}};
const marketNames={BTC:"Bitcoin",ETH:"Ethereum",SOL:"Solana",USDC:"USD Coin",LINK:"Chainlink",AVAX:"Avalanche"};
let marketPrices={BTC:67420.10,ETH:3248.70,SOL:154.20,USDC:0.92,LINK:17.84,AVAX:28.16};
const fallbackMarkets=[["Bitcoin","BTC",67420.10,0],["Ethereum","ETH",3248.70,0],["Solana","SOL",154.20,0],["USD Coin","USDC",0.92,0],["Chainlink","LINK",17.84,0],["Avalanche","AVAX",28.16,0]];
let marketPreviewDays=1;
let botState={catalog:[],items:[],activity:[]};
function renderMarket(markets){
  document.getElementById("marketGrid").innerHTML=markets.map(({symbol,price,change24h,marketCap})=>{
    const name=marketNames[symbol]||symbol;
    const change=Number(change24h||0);
    marketPrices[symbol]=Number(price)||marketPrices[symbol];
    const priceText=Number(marketPrices[symbol]).toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:marketPrices[symbol]<10?4:2})+" €";
    const changeText=(change>0?"+":"")+change.toFixed(2).replace(".",",")+"%";
    const canTrade=["BTC","ETH","SOL","USDC","LINK","AVAX"].includes(symbol);
    return `<article class="market market-clickable" data-crypto="${symbol}">
      <div class="market-card-head">
        <div class="market-identity"><span class="coin-mark coin-${symbol.toLowerCase()}">${symbol.slice(0,1)}</span><div><strong>${name}</strong><span class="symbol">${symbol}</span></div></div>
        <span class="market-live"><i></i> Live</span>
      </div>
      <div class="market-price-row"><div class="price">${priceText}</div><span class="market-change ${change>=0?"up":"down"}">${changeText}</span></div>
      <div class="market-chart-head"><span>Évolution <b>${marketPreviewDays===1?"24h":marketPreviewDays+"j"}</b></span><span>EUR</span></div>
      <div class="market-sparkline" data-sparkline="${symbol}"><span>Chargement…</span></div>
      <div class="market-card-foot"><span class="market-meta">${marketCap?formatCompactEuro(marketCap)+" cap.": "Marché crypto"}</span><span class="market-arrow">Voir le détail →</span></div>
      <div class="market-indicators" data-indicators="${symbol}" aria-label="Indicateurs techniques"><span class="market-indicator muted">Analyse…</span></div>
      <div class="market-actions">${canTrade?`<button class="btn btn-primary market-btn" data-trade-side="buy" data-trade-asset="${symbol}" type="button">Acheter</button>`:""}</div>
    </article>`;
  }).join("");
}
async function loadMarket(){
  try{
    const data=await apiFetch("/api/market");
    renderMarket(data.markets||[]);
    return data;
  }catch(e){
    console.warn("Cours marché:",e.message);
    renderMarket(fallbackMarkets.map(([name,symbol,price,change24h])=>({symbol,price,change24h})));
  }
}
let marketHistoryPreview={};

function formatPrice(value){
  return Number(value).toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:value<10?4:2})+" €";
}
function chartPeriodLabel(chartDays){
  if(chartDays===1) return "24 heures";
  if(chartDays===7) return "7 jours";
  if(chartDays===30) return "30 jours";
  return "90 jours";
}
function formatChartValue(value){
  const n=Number(value);
  if(n>=1000) return n.toLocaleString("fr-FR",{maximumFractionDigits:0})+" €";
  if(n>=10) return n.toLocaleString("fr-FR",{maximumFractionDigits:2})+" €";
  return n.toLocaleString("fr-FR",{maximumFractionDigits:4})+" €";
}
function buildHistoryChart(points,symbol=historyState.symbol,days=historyState.days){
  if(!points?.length) return "<div class=\"history-empty\">Aucune donnée historique disponible.</div>";
  const clean=points.map(p=>({timestamp:Number(p.timestamp),price:Number(p.price)})).filter(p=>Number.isFinite(p.price));
  if(!clean.length) return "<div class=\"history-empty\">Aucune donnée historique disponible.</div>";
  const values=clean.map(p=>p.price);
  const minValue=Math.min(...values),maxValue=Math.max(...values);
  const spread=Math.max(maxValue-minValue,Math.abs(maxValue)*0.001,0.0001);
  const padding=spread*0.18;
  const axisMin=Math.max(0,minValue-padding),axisMax=maxValue+padding,range=axisMax-axisMin||1;
  const width=900,height=340,left=82,right=18,top=20,bottom=38;
  const plotWidth=width-left-right,plotHeight=height-top-bottom;
  const coords=values.map((value,i)=>[left+(i/Math.max(values.length-1,1))*plotWidth,top+((axisMax-value)/range)*plotHeight]);
  const line=coords.map(([x,y])=>x.toFixed(1)+","+y.toFixed(1)).join(" ");
  const area=line+" "+(width-right)+","+(height-bottom)+" "+left+","+(height-bottom);
  const first=clean[0],last=clean[clean.length-1];
  const delta=last.price-first.price,pct=first.price?delta/first.price*100:0;
  const cls=pct>=0?"positive":"negative";
  const chartDays=Number(days)||7;
  const yTicks=Array.from({length:5},(_,i)=>axisMax-(range*i/4));
  const yGrid=yTicks.map((value,i)=>{
    const y=top+(plotHeight*i/4);
    return "<line x1=\""+left+"\" y1=\""+y.toFixed(1)+"\" x2=\""+(width-right)+"\" y2=\""+y.toFixed(1)+"\" stroke=\"currentColor\" opacity=\".10\"/><text x=\""+(left-10)+"\" y=\""+(y+4).toFixed(1)+"\" text-anchor=\"end\" fill=\"currentColor\" opacity=\".58\" font-size=\"12\">"+formatChartValue(value)+"</text>";
  }).join("");
  const dateLabel=(timestamp)=>chartDays===1?new Date(timestamp).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}):new Date(timestamp).toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit"});
  const mid=clean[Math.floor(clean.length/2)];
  return "<div class=\"history-chart-wrap\"><div class=\"chart-labels\"><span>Prix en EUR</span><span>"+chartPeriodLabel(chartDays)+"</span></div><svg class=\"history-chart\" viewBox=\"0 0 "+width+" "+height+"\" preserveAspectRatio=\"none\" role=\"img\" aria-label=\"Évolution du cours de "+symbol+" sur "+chartPeriodLabel(chartDays)+"\"><defs><linearGradient id=\"chartFill\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0%\" stop-color=\"#c8ff45\" stop-opacity=\".24\"/><stop offset=\"100%\" stop-color=\"#c8ff45\" stop-opacity=\"0\"/></linearGradient></defs>"+yGrid+"<polygon points=\""+area+"\" fill=\"url(#chartFill)\"/><polyline points=\""+line+"\" fill=\"none\" stroke=\"#c8ff45\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg><div class=\"history-axis\"><span>"+dateLabel(first.timestamp)+"</span><span>"+dateLabel(mid.timestamp)+"</span><span>"+dateLabel(last.timestamp)+"</span></div></div><div class=\"history-stats\"><div><span>Début</span><strong>"+formatPrice(first.price)+"</strong></div><div><span>Dernier cours</span><strong>"+formatPrice(last.price)+"</strong></div><div><span>Variation</span><strong class=\""+cls+"\">"+(pct>=0?"+":"")+pct.toFixed(2).replace(".",",")+"%</strong></div><div><span>Min / Max</span><strong>"+formatPrice(minValue)+" / "+formatPrice(maxValue)+"</strong></div></div>";
}
function seededNoise(seed,index){
  let x=(Math.imul((seed+index*374761393)|0,668265263)>>>0);
  x^=x>>>13;
  x=Math.imul(x,1274126177)>>>0;
  return (x/4294967296)-0.5;
}
function fallbackHistory(symbol,days){
  const base=Number(marketPrices[symbol])||1;
  const count=Math.max(days===1?24:days===7?56:days===30?90:120,12);
  const span=Math.max(days,1)*86400000,seed=String(symbol).split("").reduce((sum,char)=>sum+char.charCodeAt(0),0);
  const now=Date.now(); let level=1+((seed%9)-4)*0.001;
  return Array.from({length:count},(_,index)=>{
    const progress=index/Math.max(count-1,1);
    level=Math.max(.93,Math.min(1.07,level+seededNoise(seed,index)*.012+seededNoise(seed+97,index)*.004));
    return {timestamp:now-span+(span*progress),price:base*level};
  });
}
function buildSparkline(points){
  if(!points?.length) return "";
  const values=points.map(p=>Number(p.price)).filter(Number.isFinite);
  if(!values.length) return "";
  const min=Math.min(...values),max=Math.max(...values),range=max-min||Math.max(max*.002,.0001);
  const width=240,height=64,pad=4;
  const line=values.map((value,i)=>{const x=pad+(i/Math.max(values.length-1,1))*(width-pad*2);const y=height-pad-((value-min)/range)*(height-pad*2);return x.toFixed(1)+","+y.toFixed(1)}).join(" ");
  return `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-label="Courbe sur ${marketPreviewDays===1?"24 heures":marketPreviewDays+" jours"}"><defs><linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#c8ff45" stop-opacity=".20"/><stop offset="100%" stop-color="#c8ff45" stop-opacity="0"/></linearGradient></defs><polyline points="${line} ${width-pad},${height-pad} ${pad},${height-pad}" fill="url(#sparkFill)" stroke="none"/><polyline points="${line}" fill="none" stroke="#c8ff45" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function calculateIndicators(points){const values=(points||[]).map(p=>Number(p.price)).filter(Number.isFinite);if(values.length<3)return{momentum:null,rsi:null,volatility:null,rangePosition:null};const last=values[values.length-1],first=values[0],momentum=first?((last-first)/first)*100:0,returns=[];for(let i=1;i<values.length;i++)if(values[i-1])returns.push((values[i]-values[i-1])/values[i-1]*100);const mean=returns.reduce((a,b)=>a+b,0)/(returns.length||1),variance=returns.reduce((a,b)=>a+(b-mean)**2,0)/(returns.length||1),volatility=Math.sqrt(variance),gains=[],losses=[];for(let i=Math.max(1,values.length-14);i<values.length;i++){const d=values[i]-values[i-1];if(d>=0)gains.push(d);else losses.push(Math.abs(d))}const avgGain=gains.reduce((a,b)=>a+b,0)/(gains.length||1),avgLoss=losses.reduce((a,b)=>a+b,0)/(losses.length||1),rsi=avgLoss===0?100:100-(100/(1+avgGain/avgLoss)),min=Math.min(...values),max=Math.max(...values),rangePosition=max===min?50:((last-min)/(max-min))*100;return{momentum,rsi,volatility,rangePosition}}
function renderMarketIndicators(symbol,points){const el=document.querySelector(`[data-indicators="${symbol}"]`);if(!el)return;const i=calculateIndicators(points);if(i.momentum===null){el.innerHTML='<span class="market-indicator muted">Indicateurs indisponibles</span>';return}const momentumClass=i.momentum>=0?"up":"down",rsiClass=i.rsi>=70?"hot":i.rsi<=30?"cold":"neutral",momentumText=(i.momentum>=0?"+":"")+i.momentum.toFixed(2).replace(".",",")+"%",rsiText=i.rsi.toFixed(0),rangeText=i.rangePosition.toFixed(0)+"%";el.innerHTML=`<span class="market-indicator ${momentumClass}"><b>Momentum</b> ${momentumText}</span><span class="market-indicator ${rsiClass}"><b>RSI</b> ${rsiText}</span><span class="market-indicator neutral"><b>Vol.</b> ${i.volatility.toFixed(2).replace(".",",")}%</span><span class="market-indicator neutral"><b>Range</b> ${rangeText}</span>`}
function fallbackSparkline(symbol){
  const base=Number(marketPrices[symbol])||1,seed=String(symbol).split("").reduce((sum,char)=>sum+char.charCodeAt(0),0);
  let level=1;
  const count=marketPreviewDays===1?24:marketPreviewDays===7?56:marketPreviewDays===30?90:120;
  const span=Math.max(marketPreviewDays,1)*86400000;
  const points=Array.from({length:count},(_,i)=>{level=Math.max(.985,Math.min(1.015,level+seededNoise(seed,i)*.006+seededNoise(seed+17,i)*.002));return {timestamp:Date.now()-span+(span*i/Math.max(count-1,1)),price:base*level}});
  return buildSparkline(points);
}
async function loadMarketHistoryPreviews(){
  try{
    const data=await apiFetch("/api/market/history?days="+marketPreviewDays);
    marketHistoryPreview=data.markets||{};
  }catch(e){console.warn("Historique marché groupé:",e.message)}
  document.querySelectorAll("[data-sparkline]").forEach(el=>{const symbol=el.dataset.sparkline;const points=marketHistoryPreview[symbol]||fallbackHistory(symbol,marketPreviewDays);el.innerHTML=points.length?buildSparkline(points):fallbackSparkline(symbol);renderMarketIndicators(symbol,points)});
}
async function setMarketPreviewRange(days){
  marketPreviewDays=Number(days)||1;
  document.querySelectorAll(".market-periods button").forEach(button=>button.classList.toggle("active",Number(button.dataset.days)===marketPreviewDays));
  await loadMarketHistoryPreviews();
}
function formatCompactEuro(value){
  const n=Number(value);
  if(!Number.isFinite(n)) return "—";
  if(n>=1e9) return (n/1e9).toLocaleString("fr-FR",{maximumFractionDigits:2})+" Md €";
  if(n>=1e6) return (n/1e6).toLocaleString("fr-FR",{maximumFractionDigits:2})+" M €";
  return n.toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})+" €";
}
function setDetailText(id,value){const el=document.getElementById(id);if(el)el.textContent=value}
async function openCryptoDetail(symbol){
  const modal=document.getElementById("cryptoDetailModal");
  if(!modal) return;
  document.body.classList.add("modal-open");
  modal.hidden=false;
  setDetailText("cryptoDetailTitle",`${marketNames[symbol]||symbol} (${symbol})`);
  setDetailText("cryptoDetailRank","Chargement…");
  setDetailText("cryptoDetailPrice","—");
  setDetailText("cryptoDetailChange","—");
  setDetailText("detailCurrentPrice","—");
  setDetailText("detail24h","—");
  setDetailText("detail7dMin","—");
  setDetailText("detail7dMax","—");
  setDetailText("detailMarketCap","—");
  setDetailText("detailVolume","—");
  setDetailText("cryptoDetailSource","Chargement des données…");
  document.getElementById("cryptoDetailChart").innerHTML="<div class=\"history-loading\">Chargement des données…</div>";
  try{
    const data=await apiFetch(`/api/market/details/${encodeURIComponent(symbol)}`);
    marketPrices[symbol]=Number(data.price)||marketPrices[symbol];
    const price=formatPrice(data.price);
    const change=Number(data.change24h||0);
    setDetailText("cryptoDetailPrice",price);
    const changeEl=document.getElementById("cryptoDetailChange");
    changeEl.textContent=(change>=0?"+":"")+change.toFixed(2).replace(".",",")+"% · 24h";
    changeEl.className=change>=0?"positive":"negative";
    setDetailText("cryptoDetailRank",data.marketCapRank? `Classement #${data.marketCapRank}`:"Classement indisponible");
    setDetailText("detailCurrentPrice",price);
    setDetailText("detail24h",(change>=0?"+":"")+change.toFixed(2).replace(".",",")+"%");
    const points=data.days7?.points||[];
    const values=points.map(p=>Number(p.price)).filter(Number.isFinite);
    setDetailText("detail7dMin",values.length?formatPrice(Math.min(...values)):"—");
    setDetailText("detail7dMax",values.length?formatPrice(Math.max(...values)):"—");
    setDetailText("detailMarketCap",formatCompactEuro(data.marketCap));
    setDetailText("detailVolume",formatCompactEuro(data.volume24h));
    document.getElementById("cryptoDetailChart").innerHTML=points.length?buildHistoryChart(points,symbol,7):"<div class=\"history-empty\">Historique indisponible.</div>";
    setDetailText("cryptoDetailSource","Source : CoinGecko · données mises à jour automatiquement");
    document.getElementById("detailBuy").onclick=()=>{closeCryptoDetail();openTrade("buy",symbol)};
  }catch(e){
    document.getElementById("cryptoDetailChart").innerHTML=`<div class="history-empty">${e.message}</div>`;
    setDetailText("cryptoDetailSource","Données temporairement indisponibles");
  }
}
function closeCryptoDetail(){const modal=document.getElementById("cryptoDetailModal");if(modal)modal.hidden=true;document.body.classList.remove("modal-open")}
function setConnected(connected){document.getElementById("authState").textContent=connected?"● Connecté":"● Mode visiteur";const accountStatus=document.getElementById("accountStatus");if(accountStatus)accountStatus.textContent=connected?"Compte connecté":"Compte démo";document.body.classList.toggle("is-authenticated",connected);document.body.classList.toggle("is-visitor",!connected);document.querySelectorAll(".auth-only").forEach(el=>{el.hidden=!connected;el.setAttribute("aria-hidden",String(!connected))});const topLogin=document.getElementById("topLogin");if(topLogin){topLogin.textContent=connected?"Se déconnecter":"Se connecter";topLogin.setAttribute("aria-label",connected?"Se déconnecter":"Se connecter")}loadBots().catch(e=>console.warn("Bots:",e.message))}
function logout(){apiToken="";safeStorageRemove("bitgold-token");botState={catalog:[],items:[],activity:[]};state={cash:10000,holdings:{BTC:0,ETH:0,SOL:0,USDC:0,LINK:0,AVAX:0}};setConnected(false);renderWallet();loadBots();loadNews();window.scrollTo({top:0,behavior:"smooth"})}
function coinIcon(symbol){const icons={BTC:"₿",ETH:"Ξ",SOL:"S",USDC:"$",LINK:"L",AVAX:"A"};return `<span class="coin-icon coin-${symbol.toLowerCase()}" aria-hidden="true">${icons[symbol]||symbol.slice(0,1)}</span>`}
function renderWallet(){const cash=document.getElementById("cashBalance"),holdings=document.getElementById("holdings"),totalEl=document.getElementById("portfolioTotal"),countEl=document.getElementById("holdingsCount");const cashValue=Number(state.cash)||0;if(cash)cash.textContent=cashValue.toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})+" €";const assets=["BTC","ETH","SOL","USDC","LINK","AVAX"].map(symbol=>{const quantity=Number(state.holdings[symbol]||0);const price=Number(marketPrices[symbol]||0);return{symbol,quantity,price,value:quantity*price}}).sort((a,b)=>b.value-a.value);const invested=assets.reduce((sum,item)=>sum+item.value,0),total=cashValue+invested;if(totalEl)totalEl.textContent=total.toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})+" €";const active=assets.filter(item=>item.quantity>0);if(countEl)countEl.textContent=active.length+" actif"+(active.length>1?"s":"");if(holdings)holdings.innerHTML=assets.map(item=>{const allocation=total?item.value/total*100:0;const quantityText=item.quantity?item.quantity.toLocaleString("fr-FR",{minimumFractionDigits:0,maximumFractionDigits:8}):"0";return `<article class="portfolio-asset ${item.quantity?"":"is-empty"}"><div class="portfolio-asset-identity">${coinIcon(item.symbol)}<div><strong>${marketNames[item.symbol]}</strong><span>${item.symbol} · ${formatPrice(item.price)}</span></div></div><div class="portfolio-asset-quantity"><strong>${quantityText}</strong><span>unités</span></div><div class="portfolio-asset-value"><strong>${item.value.toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})} €</strong><span>${allocation.toFixed(1).replace(".",",")}% du portefeuille</span></div></article>`}).join("")}
async function apiFetch(path,options={}){const headers={...(options.headers||{})};if(!headers["Content-Type"]&&options.body)headers["Content-Type"]="application/json";if(apiToken)headers.Authorization=`Bearer ${apiToken}`;let r;try{r=await fetch(API+path,{...options,headers})}catch(e){throw Error("Impossible de joindre l'API. Vérifiez que le service Northflank est démarré et que /api/health répond.")}let data={};try{data=await r.json()}catch{}if(!r.ok)throw Error(data.error||`Erreur API (${r.status})`);return data}
async function loadPortfolio(){if(!apiToken){setConnected(false);renderWallet();return}try{const data=await apiFetch("/api/portfolio");state.cash=Number(data.cash||0);state.holdings={BTC:0,ETH:0,SOL:0,USDC:0,LINK:0,AVAX:0};for(const row of data.holdings||[])if(row.asset in state.holdings)state.holdings[row.asset]=Number(row.quantity||0);renderWallet();setConnected(true)}catch(e){if(/authentifié|401/i.test(e.message)){apiToken="";safeStorageRemove("bitgold-token");setConnected(false);renderWallet()}throw e}}
function simulate(){const amount=Number(document.getElementById("amount").value||0);const asset=document.getElementById("asset").value;const rates={"Bitcoin (BTC)":1.2842,"Ethereum (ETH)":1.192,"Solana (SOL)":1.431};const gain=amount*(rates[asset]-1);document.getElementById("result").textContent=`Simulation : ${amount.toLocaleString("fr-FR")} € en ${asset} → estimation théorique ${(amount+gain).toLocaleString("fr-FR",{maximumFractionDigits:2})} €. Gain/perte : ${gain.toLocaleString("fr-FR",{maximumFractionDigits:2})} €.`}
function openTrade(side,asset="BTC"){tradeSide=side;document.getElementById("tradeTitle").textContent=side==="buy"?"Acheter des cryptos":"Vendre des cryptos";document.getElementById("tradeAsset").value=asset;document.getElementById("tradeAmount").value=100;document.getElementById("tradeResult").textContent=apiToken?"":"Connectez-vous pour effectuer une opération démo.";document.getElementById("tradeModal").hidden=false;document.body.classList.add("modal-open")}
function closeTrade(){document.getElementById("tradeModal").hidden=true;document.body.classList.remove("modal-open")}
async function executeTrade(){const result=document.getElementById("tradeResult");const asset=document.getElementById("tradeAsset").value;const amount=Number(document.getElementById("tradeAmount").value||0);if(!apiToken){result.textContent="Connectez-vous pour effectuer une opération démo.";return}if(amount<=0){result.textContent="Montant invalide.";return}result.textContent="Traitement…";try{await apiFetch("/api/trades",{method:"POST",body:JSON.stringify({side:tradeSide,asset,amount})});await loadPortfolio();result.textContent=`Opération démo effectuée : ${tradeSide==="buy"?"achat":"vente"} de ${(amount/(marketPrices[asset]||1)).toFixed(6)} ${asset} pour ${amount.toFixed(2)} €.`}catch(e){result.textContent=e.message}}
function openModal(type){authMode=type==="inscription"?"signup":"login";document.getElementById("modalTitle").textContent=authMode==="signup"?"Créer un compte BitGold":"Connexion BitGold";document.getElementById("authSubmit").textContent=authMode==="signup"?"Créer mon compte":"Se connecter";document.getElementById("authSwitch").textContent=authMode==="signup"?"J'ai déjà un compte":"Créer un compte";document.getElementById("authResult").textContent="";document.getElementById("modal").hidden=false;document.body.classList.add("modal-open")}
function switchAuth(){openModal(authMode==="signup"?"connexion":"inscription")}
async function submitAuth(){const email=document.getElementById("authEmail").value,password=document.getElementById("authPassword").value;const result=document.getElementById("authResult");result.textContent="Connexion…";try{const d=await apiFetch("/api/auth/"+(authMode==="signup"?"signup":"login"),{method:"POST",body:JSON.stringify({email,password})});apiToken=d.token;safeStorageSet("bitgold-token",apiToken);setConnected(true);closeModal();document.getElementById("compte")?.scrollIntoView({behavior:"smooth",block:"start"});try{await loadPortfolio()}catch(e){console.warn("Portfolio après authentification:",e.message)}}catch(e){result.textContent=e.message}}
function closeModal(){document.getElementById("modal").hidden=true;document.body.classList.remove("modal-open")}
async function loadBots(){try{botState=apiToken?await apiFetch("/api/bots"):await apiFetch("/api/bots/catalog");renderBots()}catch(e){console.warn("Bots:",e.message)}}
function botCatalogOrder(catalog){const order=["shield","silver","gold"];return (catalog||[]).slice().sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id))}
function renderBots(){const grid=document.getElementById("botGrid"),title=document.getElementById("botsTitle"),summary=document.getElementById("botsSummary"),mode=document.getElementById("botsMode");if(!grid)return;const active=new Set((botState.items||[]).filter(b=>b.active!==false).map(b=>b.bot_type));const connected=!!apiToken;const catalog=botCatalogOrder(botState.catalog);if(title)title.textContent=connected?"Choisissez votre niveau d'automatisation":"Les bots BitGold";if(summary)summary.textContent=connected?"Comparez les trois approches, puis ouvrez une fiche pour activer, régler ou arrêter votre bot.":"Découvrez les trois niveaux : protection, équilibre et performance. Ouvrez une fiche pour voir la stratégie, les cryptos compatibles et le tarif.";if(mode)mode.textContent=connected?"Parcours personnalisé":"Découverte";grid.innerHTML=catalog.map((bot,index)=>{const subscribed=active.has(bot.id);const character=bot.id==="shield"?"🛡️":bot.id==="silver"?"🤖":"🦾";const accent=bot.id==="shield"?"Gardien":bot.id==="silver"?"Analyste":"Chasseur";const assets=(bot.compatible_assets||[]).join(" · ");return '<article class="bot-card bot-'+bot.id+'"><div class="bot-visual"><div class="bot-character"><span class="bot-character-face">'+character+'</span><span class="bot-character-label">'+accent+'</span></div><div class="bot-badge">'+escapeHtml(bot.tier)+'</div><span class="bot-level">Niveau '+(index+1)+'</span><span class="bot-price">'+Number(bot.price_monthly_eur||0).toFixed(2).replace(".",",")+' € / mois</span></div><div class="bot-card-head"><div><span class="bot-tier">'+escapeHtml(bot.tier)+'</span><h3>'+escapeHtml(bot.name.replace(" Bot",""))+'</h3></div><span class="bot-status '+(subscribed?"active":"")+'">'+(subscribed?"Actif":"Disponible")+'</span></div><p class="bot-card-summary">'+escapeHtml(bot.summary||bot.description)+'</p><div class="bot-stats"><span><b>Risque</b>'+escapeHtml(bot.risk)+'</span><span><b>Allocation</b>'+bot.allocation+'%</span><span><b>Rythme</b>'+escapeHtml(bot.frequency)+'</span></div><div class="bot-compatible"><b>CRYPTO COMPATIBLE</b><span>'+escapeHtml(assets)+'</span></div><div class="bot-card-more">'+escapeHtml(bot.description||bot.strategy)+'</div><button class="btn '+(subscribed?"btn-ghost":"btn-primary")+' full" data-bot-open="'+bot.id+'">'+(subscribed?"Gérer mon bot":"Découvrir "+escapeHtml(bot.name.replace(" Bot"))+' →')+'</button></article>'}).join("");}
async function openBotDetail(type){const allowed=["shield","silver","gold"];if(!allowed.includes(type))return;history.pushState({}, "", "/bot/"+type);await renderBotDetail(type)}
async function renderBotDetail(type){const detail=document.getElementById("bot-detail");if(!detail)return;const catalogData=await apiFetch("/api/bots/catalog");const bot=(catalogData.catalog||[]).find(item=>item.id===type);if(!bot)return;let subscription=(botState.items||[]).find(item=>item.bot_type===type);if(apiToken){try{const data=await apiFetch("/api/bots");botState=data;subscription=(data.items||[]).find(item=>item.bot_type===type)}catch(e){console.warn("Bot detail:",e.message)}}document.body.classList.add("bot-detail-mode");detail.hidden=false;const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value};const title=bot.name.replace(" Bot","");set("botDetailTier",bot.tier);set("botDetailName",title);set("botDetailSummary",bot.summary);set("botDetailDescription",bot.description);set("botDetailStrategy",bot.strategy);set("botDetailAlgorithm",bot.algorithm||bot.strategy);set("botDetailCompatible",(bot.compatible_assets||[]).join(" · "));set("botDetailRisk",bot.risk);set("botDetailAllocation",bot.allocation+"%");set("botDetailFrequency",bot.frequency);set("botDetailPrice",Number(bot.price_monthly_eur||0).toFixed(2).replace(".",",")+" €");const accent=detail.querySelector(".bot-detail-hero");if(accent)accent.dataset.bot=bot.id;["botMaxTrade","botMaxPosition","botStopLoss","botReserve"].forEach(id=>{const el=document.getElementById(id);if(el)el.value=subscription?.[({botMaxTrade:"max_trade_eur",botMaxPosition:"max_position_eur",botStopLoss:"stop_loss_pct",botReserve:"min_cash_pct"}[id])]??({botMaxTrade:250,botMaxPosition:1000,botStopLoss:8,botReserve:20}[id])});const action=document.getElementById("botActivate"),unsubscribe=document.getElementById("botUnsubscribe");if(action){action.textContent=subscription?.active?"Enregistrer mes paramètres":"Activer "+title;action.dataset.botType=bot.id;action.disabled=false}if(unsubscribe){unsubscribe.hidden=!subscription?.active;unsubscribe.dataset.botType=bot.id}const note=document.getElementById("botConfigNote");if(note)note.textContent=subscription?.active?"Votre bot est actif. Modifiez les limites puis enregistrez-les.":"Aucun engagement réel : cette version pilote uniquement le portefeuille démo BitGold."}
async function saveBotConfiguration(){const button=document.getElementById("botActivate"),type=button?.dataset.botType;if(!type)return;if(!apiToken){openModal("connexion");return}button.disabled=true;try{await apiFetch("/api/bots/subscriptions",{method:"POST",body:JSON.stringify({botType:type,maxTradeEur:Number(document.getElementById("botMaxTrade").value),maxPositionEur:Number(document.getElementById("botMaxPosition").value),stopLossPct:Number(document.getElementById("botStopLoss").value),minCashPct:Number(document.getElementById("botReserve").value)})});await loadBots();await renderBotDetail(type);await loadActivity();const note=document.getElementById("botConfigNote");if(note)note.textContent="Paramètres enregistrés. Le bot applique désormais ces limites au moteur démo."}catch(e){alert(e.message)}finally{button.disabled=false}}
async function unsubscribeBot(){const button=document.getElementById("botUnsubscribe"),type=button?.dataset.botType;if(!type||!apiToken)return;if(!confirm("Désabonner ce bot ? Il cessera ses décisions automatiques, sans supprimer votre portefeuille."))return;button.disabled=true;try{await apiFetch("/api/bots/subscriptions/"+encodeURIComponent(type),{method:"DELETE"});await loadBots();await renderBotDetail(type);await loadActivity()}catch(e){alert(e.message)}finally{button.disabled=false}}
async function loadActivity(){if(!apiToken)return;const log=document.getElementById("activityLog");if(log)log.innerHTML='<div class="bot-empty">Chargement du journal…</div>';try{const data=await apiFetch("/api/activity");window.activityState=data;renderActivity("all")}catch(e){console.warn("Activité:",e.message);if(log)log.innerHTML='<div class="bot-empty">Journal temporairement indisponible.</div>'}}
function renderActivity(filter="all"){const data=window.activityState||{botLogs:[],trades:[]},log=document.getElementById("activityLog"),summary=document.getElementById("activitySummary");if(!log)return;const botLogs=(data.botLogs||[]).map(x=>({kind:x.action==="subscribe"||x.action==="unsubscribe"?"subscription":"bot",type:x.action,bot:x.bot_type,asset:x.asset,message:x.message,date:x.created_at}));const trades=(data.trades||[]).map(x=>({kind:x.side==="buy"?"buy":"sell",type:x.side,bot:"Trading",asset:x.asset,message:(x.side==="buy"?"Achat de ":"Vente de ")+x.asset+" · "+Number(x.amount_eur||0).toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})+" €",date:x.created_at,details:Number(x.quantity||0).toFixed(6)+" unités"}));let items=[...botLogs,...trades].sort((a,b)=>new Date(b.date)-new Date(a.date));if(filter!=="all")items=items.filter(x=>x.kind===filter);const counts={all:botLogs.length+trades.length,bot:botLogs.filter(x=>x.kind==="bot").length,buy:trades.filter(x=>x.kind==="buy").length,sell:trades.filter(x=>x.kind==="sell").length,subscription:botLogs.filter(x=>x.kind==="subscription").length};if(summary)summary.innerHTML=Object.entries(counts).map(([k,v])=>'<span><b>'+v+'</b><small>'+({all:"événements",bot:"logs bots",buy:"achats",sell:"ventes",subscription:"abonnements"}[k])+'</small></span>').join("");log.innerHTML=items.length?items.map(item=>'<article class="activity-row activity-'+item.kind+'"><span class="activity-icon">'+({bot:"⚙",buy:"↗",sell:"↘",subscription:"✓"}[item.kind])+'</span><div><strong>'+escapeHtml(item.kind==="bot"?(item.bot+" · "+item.type):item.message)+'</strong><span>'+escapeHtml(item.kind==="bot"?item.message:(item.details||"Journal de trading"))+'</span></div><time>'+escapeHtml(formatNewsAge(item.date))+'</time></article>').join(""):'<div class="bot-empty">Aucune activité dans cette catégorie.</div>';document.querySelectorAll("[data-activity-filter]").forEach(b=>b.classList.toggle("active",b.dataset.activityFilter===filter))}
function openActivity(){if(!apiToken){openModal("connexion");return}history.pushState({}, "", "/activite");document.body.classList.add("activity-mode");document.getElementById("activite").hidden=false;loadActivity()}
function closeActivity(){document.body.classList.remove("activity-mode");const page=document.getElementById("activite");if(page)page.hidden=true;history.pushState({}, "", "/#bots");document.getElementById("bots")?.scrollIntoView({behavior:"smooth"})}
function closeBotDetail(){document.body.classList.remove("bot-detail-mode");const detail=document.getElementById("bot-detail");if(detail)detail.hidden=true;history.pushState({}, "", "/#bots");document.getElementById("bots")?.scrollIntoView({behavior:"smooth"})}
function initBotRoute(){const match=window.location.pathname.match(/^\/bot\/(shield|silver|gold)$/);if(match)renderBotDetail(match[1]).catch(e=>console.warn("Bot route:",e.message));const activity=window.location.pathname==="/activite";if(activity){if(apiToken)openActivity();else openModal("connexion")}window.addEventListener("popstate",()=>{const next=window.location.pathname.match(/^\/bot\/(shield|silver|gold)$/);if(next)renderBotDetail(next[1]);else if(window.location.pathname==="/activite"){if(apiToken)openActivity();else openModal("connexion")}else{document.body.classList.remove("bot-detail-mode","activity-mode");const detail=document.getElementById("bot-detail"),page=document.getElementById("activite");if(detail)detail.hidden=true;if(page)page.hidden=true}})}
function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]||char))}
function formatNewsAge(timestamp){const date=new Date(timestamp);if(!Number.isFinite(date.getTime()))return "Récent";const minutes=Math.max(1,Math.floor((Date.now()-date.getTime())/60000));if(minutes<60)return "Il y a "+minutes+" min";const hours=Math.floor(minutes/60);if(hours<24)return "Il y a "+hours+" h";return "Il y a "+Math.floor(hours/24)+" j"}
function renderNews(items){const grid=document.getElementById("newsGrid");if(!grid)return;if(!items?.length){grid.innerHTML="<div class=\"news-empty\">Aucune actualité disponible pour le moment.</div>";return}grid.innerHTML=items.slice(0,5).map((item,index)=>`<article class="news-rail-item ${index===0?"featured":""}"><div class="news-rail-item-meta"><span class="news-category">${escapeHtml(item.category||"Crypto")}</span><span class="news-age">${escapeHtml(formatNewsAge(item.publishedAt))}</span></div><h3><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a></h3><div class="news-rail-source">${escapeHtml(item.source||"Source crypto")}<span>↗</span></div></article>`).join("")}
async function loadNews(){const section=document.getElementById("actualites");if(!section)return;const grid=document.getElementById("newsGrid");if(grid)grid.innerHTML="<div class=\"news-loading\">Actualités en cours de chargement…</div>";try{const data=await apiFetch("/api/news");renderNews(data.items||[])}catch(e){console.warn("Actualités:",e.message);renderNews([{title:"Voir les dernières actualités crypto",url:"https://www.coindesk.com/fr/latest-crypto-news",publishedAt:new Date().toISOString(),source:"CoinDesk · flux de secours",category:"Actualités"}])}}
async function refreshMarketView(){await loadMarket();await loadMarketHistoryPreviews();loadNews()}
initBotRoute();setConnected(!!apiToken);if(apiToken)loadPortfolio().catch(e=>console.warn("Portfolio API:",e.message));else loadNews();refreshMarketView();setInterval(refreshMarketView,60000);
window.openModal=openModal;window.openBotDetail=openBotDetail;window.saveBotConfiguration=saveBotConfiguration;window.unsubscribeBot=unsubscribeBot;window.openActivity=openActivity;window.closeActivity=closeActivity;window.logout=logout;window.setMarketPreviewRange=setMarketPreviewRange;window.loadBots=loadBots;window.switchAuth=switchAuth;window.submitAuth=submitAuth;window.closeModal=closeModal;window.openTrade=openTrade;window.executeTrade=executeTrade;window.closeTrade=closeTrade;window.simulate=simulate;window.openCryptoDetail=openCryptoDetail;window.closeCryptoDetail=closeCryptoDetail;
document.getElementById("authSubmit")?.addEventListener("click",submitAuth);
document.getElementById("authSwitch")?.addEventListener("click",switchAuth);
document.getElementById("authClose")?.addEventListener("click",closeModal);
document.querySelector("#topLogin")?.addEventListener("click",()=>apiToken?logout():openModal("connexion"));
document.querySelector("#heroSignup")?.addEventListener("click",()=>openModal("inscription"));
document.querySelectorAll(".market-periods button").forEach(button=>button.addEventListener("click",()=>setMarketPreviewRange(Number(button.dataset.days))));
document.getElementById("marketGrid")?.addEventListener("click",event=>{const tradeButton=event.target.closest("[data-trade-side]");if(tradeButton){event.stopPropagation();openTrade(tradeButton.dataset.tradeSide,tradeButton.dataset.tradeAsset||"BTC");return}const card=event.target.closest(".market[data-crypto]");if(card)openCryptoDetail(card.dataset.crypto)});
document.getElementById("simulateButton")?.addEventListener("click",simulate);
document.getElementById("walletBuy")?.addEventListener("click",()=>openTrade("buy"));
document.getElementById("walletSell")?.addEventListener("click",()=>openTrade("sell"));
document.getElementById("tradeConfirm")?.addEventListener("click",executeTrade);
document.getElementById("botGrid")?.addEventListener("click",event=>{const button=event.target.closest("[data-bot-open]");if(!button)return;event.stopPropagation();openBotDetail(button.dataset.botOpen)});document.getElementById("botActivate")?.addEventListener("click",saveBotConfiguration);document.getElementById("botUnsubscribe")?.addEventListener("click",unsubscribeBot);document.getElementById("botBack")?.addEventListener("click",closeBotDetail);document.getElementById("activityBack")?.addEventListener("click",closeActivity);document.querySelectorAll("[data-activity-filter]").forEach(button=>button.addEventListener("click",()=>renderActivity(button.dataset.activityFilter)));document.getElementById("activityNav")?.addEventListener("click",event=>{if(apiToken){event.preventDefault();openActivity()}});
document.querySelectorAll(".modal .close").forEach(button=>button.addEventListener("click",()=>{const modal=button.closest(".modal");if(modal?.id==="tradeModal")closeTrade();else if(modal?.id==="cryptoDetailModal")closeCryptoDetail();else if(modal?.id==="modal")closeModal()}));
document.querySelectorAll(".modal").forEach(modal=>modal.addEventListener("click",event=>{if(event.target===modal){if(modal.id==="tradeModal")closeTrade();else if(modal.id==="cryptoDetailModal")closeCryptoDetail();else if(modal.id==="modal")closeModal()}}));
document.addEventListener("keydown",event=>{if(event.key!=="Escape")return;const open=document.querySelector(".modal:not([hidden])");if(!open)return;if(open.id==="tradeModal")closeTrade();else if(open.id==="cryptoDetailModal")closeCryptoDetail();else closeModal()});
window.addEventListener("error",e=>{const el=document.getElementById("authResult");if(el)el.textContent="Erreur JavaScript : "+e.message;});
