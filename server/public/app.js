function safeStorageGet(key){try{return localStorage.getItem(key)||""}catch{return ""}}
function safeStorageSet(key,value){try{localStorage.setItem(key,value)}catch{}}
function safeStorageRemove(key){try{localStorage.removeItem(key)}catch{}}
const configuredApi=(safeStorageGet("bitgold-api")||window.BITGOLD_API||"").trim().replace(/\/$/,"");
const API=configuredApi||window.location.origin;
let apiToken=safeStorageGet("bitgold-token");
let authMode="login";
let tradeSide="buy";
let state={cash:10000,holdings:{BTC:0,ETH:0,SOL:0}};
const marketNames={BTC:"Bitcoin",ETH:"Ethereum",SOL:"Solana",USDC:"USD Coin",LINK:"Chainlink",AVAX:"Avalanche"};
let marketPrices={BTC:67420.10,ETH:3248.70,SOL:154.20,USDC:0.92,LINK:17.84,AVAX:28.16};
const fallbackMarkets=[["Bitcoin","BTC",67420.10,0],["Ethereum","ETH",3248.70,0],["Solana","SOL",154.20,0],["USD Coin","USDC",0.92,0],["Chainlink","LINK",17.84,0],["Avalanche","AVAX",28.16,0]];
function renderMarket(markets){
  document.getElementById("marketGrid").innerHTML=markets.map(({symbol,price,change24h})=>{
    const name=marketNames[symbol]||symbol;
    const change=Number(change24h||0);
    marketPrices[symbol]=Number(price)||marketPrices[symbol];
    const priceText=Number(marketPrices[symbol]).toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})+" €";
    const changeText=(change>0?"+":"")+change.toFixed(2).replace(".",",")+"%";
    const canTrade=["BTC","ETH","SOL","USDC","LINK","AVAX"].includes(symbol);
    return `<article class="market market-clickable" data-crypto="${symbol}">
      <div class="market-top"><div><strong>${name}</strong> <span class="symbol">${symbol}</span></div><span class="market-dot">●</span></div>
      <div class="price">${priceText}</div>
      <div class="${change<0?"symbol":"positive"}">${changeText} <span class="change-label">24h</span></div>
      <div class="market-sparkline" data-sparkline="${symbol}"><span>Chargement de la courbe…</span></div><div class="market-actions"><button class="btn btn-ghost market-btn history-open" data-symbol="${symbol}" type="button">Historique</button>${canTrade?`<button class="btn btn-primary market-btn" data-trade-side="buy" data-trade-asset="${symbol}" type="button">Acheter</button>`:""}</div>
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
let historyState={symbol:"BTC",days:7,prices:[]};
let marketHistoryPreview={};

function formatPrice(value){
  return Number(value).toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:value<10?4:2})+" €";
}
function buildHistoryChart(points){
  if(!points.length) return "<div class=\"history-empty\">Aucune donnée historique disponible.</div>";
  const values=points.map(p=>Number(p.price));
  const min=Math.min(...values),max=Math.max(...values),range=max-min||1;
  const width=900,height=300,pad=18;
  const coords=values.map((value,i)=>{
    const x=pad+(i/(Math.max(values.length-1,1)))*(width-pad*2);
    const y=height-pad-((value-min)/range)*(height-pad*2);
    return [x,y];
  });
  const line=coords.map(([x,y])=>`${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const first=points[0],last=points[points.length-1];
  const delta=Number(last.price)-Number(first.price);
  const pct=first.price?delta/first.price*100:0;
  const cls=pct>=0?"positive":"negative";
  return `<div class="history-chart-wrap">
    <svg class="history-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="Évolution du cours de ${historyState.symbol}">
      <polyline points="${line}" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <div class="history-axis"><span>${new Date(first.timestamp).toLocaleDateString("fr-FR")}</span><span>${new Date(last.timestamp).toLocaleDateString("fr-FR")}</span></div>
  </div>
  <div class="history-stats">
    <div><span>Début</span><strong>${formatPrice(first.price)}</strong></div>
    <div><span>Fin</span><strong>${formatPrice(last.price)}</strong></div>
    <div><span>Variation</span><strong class="${cls}">${pct>=0?"+":""}${pct.toFixed(2).replace(".",",")}%</strong></div>
    <div><span>Min / Max</span><strong>${formatPrice(min)} / ${formatPrice(max)}</strong></div>
  </div>`;
}
function fallbackHistory(symbol,days){
  const base=Number(marketPrices[symbol])||1;
  const count=Math.max(days===1?24:days===7?56:days===30?90:120,12);
  const span=Math.max(days,1)*86400000;
  const seed=String(symbol).split("").reduce((sum,char)=>sum+char.charCodeAt(0),0);
  const now=Date.now();
  return Array.from({length:count},(_,index)=>{
    const progress=index/Math.max(count-1,1);
    const wave=Math.sin((progress*6+seed)*1.7)*0.018+Math.sin((progress*13+seed)*0.8)*0.009;
    const trend=(progress-0.5)*0.018;
    return {timestamp:now-span+(span*progress),price:base*(1+wave+trend)};
  });
}
function buildSparkline(points){
  if(!points?.length) return "";
  const values=points.map(p=>Number(p.price));
  const min=Math.min(...values),max=Math.max(...values),range=max-min||1;
  const width=240,height=58,pad=3;
  const line=values.map((value,i)=>{
    const x=pad+(i/Math.max(values.length-1,1))*(width-pad*2);
    const y=height-pad-((value-min)/range)*(height-pad*2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-label="Courbe sur 7 jours"><polyline points="${line}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function fallbackSparkline(symbol){
  const base=Number(marketPrices[symbol])||1;
  const factors=[0.96,0.985,0.975,1.01,0.995,1.02,1];
  return buildSparkline(factors.map((factor,i)=>({timestamp:Date.now()-(factors.length-1-i)*86400000,price:base*factor})));
}
async function loadMarketHistoryPreviews(){
  try{
    const data=await apiFetch("/api/market/history?days=7");
    marketHistoryPreview=data.markets||{};
  }catch(e){
    console.warn("Historique marché groupé:",e.message);
  }
  document.querySelectorAll("[data-sparkline]").forEach(el=>{
    const points=marketHistoryPreview[el.dataset.sparkline]||[];
    el.innerHTML=points.length?buildSparkline(points):fallbackSparkline(el.dataset.sparkline);
  });
}
async function openHistory(symbol,days=7){
  historyState={symbol,days,prices:[]};
  const modal=document.getElementById("historyModal");
  document.getElementById("historyTitle").textContent=`${marketNames[symbol]||symbol} (${symbol})`;
  document.getElementById("historySource").textContent="Chargement de l'historique…";
  document.getElementById("historyChart").innerHTML="<div class=\"history-loading\">Chargement des cours…</div>";
  modal.hidden=false;
  document.querySelectorAll(".history-range button").forEach(button=>button.classList.toggle("active",Number(button.dataset.days)===days));
  try{
    const data=await apiFetch(`/api/market/history/${encodeURIComponent(symbol)}?days=${days}`);
    historyState.prices=data.prices||[];
    document.getElementById("historyChart").innerHTML=buildHistoryChart(historyState.prices);
    document.getElementById("historySource").textContent=`Source : CoinGecko · ${historyState.prices.length} points`;
  }catch(e){
    historyState.prices=fallbackHistory(symbol,days);
    document.getElementById("historyChart").innerHTML=buildHistoryChart(historyState.prices);
    document.getElementById("historySource").textContent="Source : BitGold · courbe de secours (CoinGecko indisponible)";
  }
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
    document.getElementById("cryptoDetailChart").innerHTML=points.length?buildSparkline(points).replace("<svg","<svg class=\"crypto-detail-svg\""):"<div class=\"history-empty\">Historique indisponible.</div>";
    setDetailText("cryptoDetailSource","Source : CoinGecko · données mises à jour automatiquement");
    document.getElementById("detailHistory").onclick=()=>{closeCryptoDetail();openHistory(symbol,7)};
    document.getElementById("detailBuy").onclick=()=>{closeCryptoDetail();openTrade("buy",symbol)};
  }catch(e){
    document.getElementById("cryptoDetailChart").innerHTML=`<div class="history-empty">${e.message}</div>`;
    setDetailText("cryptoDetailSource","Données temporairement indisponibles");
  }
}
function closeCryptoDetail(){const modal=document.getElementById("cryptoDetailModal");if(modal)modal.hidden=true;document.body.classList.remove("modal-open")}
function setHistoryRange(days){
  historyState.days=days;
  document.querySelectorAll(".history-range button").forEach(button=>button.classList.toggle("active",Number(button.dataset.days)===days));
  if(historyState.symbol) openHistory(historyState.symbol,days);
}
function closeHistory(){document.getElementById("historyModal").hidden=true;document.body.classList.remove("modal-open")}

function setConnected(connected){document.getElementById("authState").textContent=connected?"Connecté":"Mode démo";document.getElementById("accountStatus").textContent=connected?"Compte connecté":"Compte démo"}
function renderWallet(){document.getElementById("cashBalance").textContent=Number(state.cash).toLocaleString("fr-FR",{minimumFractionDigits:2})+" €";document.getElementById("holdings").innerHTML=["BTC","ETH","SOL"].map(s=>`<div class="holding"><span>${s}</span><strong>${Number(state.holdings[s]||0).toFixed(6)}</strong></div>`).join("")}
async function apiFetch(path,options={}){const headers={...(options.headers||{})};if(!headers["Content-Type"]&&options.body)headers["Content-Type"]="application/json";if(apiToken)headers.Authorization=`Bearer ${apiToken}`;let r;try{r=await fetch(API+path,{...options,headers})}catch(e){throw Error("Impossible de joindre l'API. Vérifiez que le service Northflank est démarré et que /api/health répond.")}let data={};try{data=await r.json()}catch{}if(!r.ok)throw Error(data.error||`Erreur API (${r.status})`);return data}
async function loadPortfolio(){if(!apiToken){setConnected(false);renderWallet();return}try{const data=await apiFetch("/api/portfolio");state.cash=Number(data.cash||0);state.holdings={BTC:0,ETH:0,SOL:0};for(const row of data.holdings||[])if(row.asset in state.holdings)state.holdings[row.asset]=Number(row.quantity||0);setConnected(true);renderWallet()}catch(e){if(/authentifié|401/i.test(e.message)){apiToken="";safeStorageRemove("bitgold-token");setConnected(false);renderWallet()}throw e}}
function simulate(){const amount=Number(document.getElementById("amount").value||0);const asset=document.getElementById("asset").value;const rates={"Bitcoin (BTC)":1.2842,"Ethereum (ETH)":1.192,"Solana (SOL)":1.431};const gain=amount*(rates[asset]-1);document.getElementById("result").textContent=`Simulation : ${amount.toLocaleString("fr-FR")} € en ${asset} → estimation théorique ${(amount+gain).toLocaleString("fr-FR",{maximumFractionDigits:2})} €. Gain/perte : ${gain.toLocaleString("fr-FR",{maximumFractionDigits:2})} €.`}
function openTrade(side,asset="BTC"){tradeSide=side;document.getElementById("tradeTitle").textContent=side==="buy"?"Acheter des cryptos":"Vendre des cryptos";document.getElementById("tradeAsset").value=asset;document.getElementById("tradeAmount").value=100;document.getElementById("tradeResult").textContent=apiToken?"":"Connectez-vous pour effectuer une opération démo.";document.getElementById("tradeModal").hidden=false;document.body.classList.add("modal-open")}
function closeTrade(){document.getElementById("tradeModal").hidden=true;document.body.classList.remove("modal-open")}
async function executeTrade(){const result=document.getElementById("tradeResult");const asset=document.getElementById("tradeAsset").value;const amount=Number(document.getElementById("tradeAmount").value||0);if(!apiToken){result.textContent="Connectez-vous pour effectuer une opération démo.";return}if(amount<=0){result.textContent="Montant invalide.";return}result.textContent="Traitement…";try{await apiFetch("/api/trades",{method:"POST",body:JSON.stringify({side:tradeSide,asset,amount})});await loadPortfolio();result.textContent=`Opération démo effectuée : ${tradeSide==="buy"?"achat":"vente"} de ${(amount/(marketPrices[asset]||1)).toFixed(6)} ${asset} pour ${amount.toFixed(2)} €.`}catch(e){result.textContent=e.message}}
function openModal(type){authMode=type==="inscription"?"signup":"login";document.getElementById("modalTitle").textContent=authMode==="signup"?"Créer un compte BitGold":"Connexion BitGold";document.getElementById("authSubmit").textContent=authMode==="signup"?"Créer mon compte":"Se connecter";document.getElementById("authSwitch").textContent=authMode==="signup"?"J'ai déjà un compte":"Créer un compte";document.getElementById("authResult").textContent="";document.getElementById("modal").hidden=false;document.body.classList.add("modal-open")}
function switchAuth(){openModal(authMode==="signup"?"connexion":"inscription")}
async function submitAuth(){const email=document.getElementById("authEmail").value,password=document.getElementById("authPassword").value;const result=document.getElementById("authResult");result.textContent="Connexion…";try{const d=await apiFetch("/api/auth/"+(authMode==="signup"?"signup":"login"),{method:"POST",body:JSON.stringify({email,password})});apiToken=d.token;safeStorageSet("bitgold-token",apiToken);setConnected(true);closeModal();document.getElementById("compte")?.scrollIntoView({behavior:"smooth",block:"start"});try{await loadPortfolio()}catch(e){console.warn("Portfolio après authentification:",e.message)}}catch(e){result.textContent=e.message}}
function closeModal(){document.getElementById("modal").hidden=true;document.body.classList.remove("modal-open")}
async function refreshMarketView(){await loadMarket();await loadMarketHistoryPreviews()}
refreshMarketView();setInterval(refreshMarketView,60000);
setConnected(!!apiToken);renderWallet();if(apiToken)loadPortfolio().catch(e=>console.warn("Portfolio API:",e.message));
window.openModal=openModal;window.switchAuth=switchAuth;window.submitAuth=submitAuth;window.closeModal=closeModal;window.openTrade=openTrade;window.executeTrade=executeTrade;window.closeTrade=closeTrade;window.simulate=simulate;window.openHistory=openHistory;window.closeHistory=closeHistory;window.setHistoryRange=setHistoryRange;window.openCryptoDetail=openCryptoDetail;window.closeCryptoDetail=closeCryptoDetail;
document.getElementById("authSubmit")?.addEventListener("click",submitAuth);
document.getElementById("authSwitch")?.addEventListener("click",switchAuth);
document.getElementById("authClose")?.addEventListener("click",closeModal);
document.querySelector("#topLogin")?.addEventListener("click",()=>openModal("connexion"));
document.querySelector("#heroSignup")?.addEventListener("click",()=>openModal("inscription"));
document.getElementById("marketGrid")?.addEventListener("click",event=>{const historyButton=event.target.closest(".history-open");if(historyButton){event.stopPropagation();openHistory(historyButton.dataset.symbol,7);return}const tradeButton=event.target.closest("[data-trade-side]");if(tradeButton){event.stopPropagation();openTrade(tradeButton.dataset.tradeSide,tradeButton.dataset.tradeAsset||"BTC");return}const card=event.target.closest(".market[data-crypto]");if(card)openCryptoDetail(card.dataset.crypto)});
document.getElementById("simulateButton")?.addEventListener("click",simulate);
document.getElementById("walletBuy")?.addEventListener("click",()=>openTrade("buy"));
document.getElementById("walletSell")?.addEventListener("click",()=>openTrade("sell"));
document.getElementById("tradeConfirm")?.addEventListener("click",executeTrade);
document.querySelectorAll(".modal .close").forEach(button=>button.addEventListener("click",()=>{const modal=button.closest(".modal");if(modal?.id==="historyModal")closeHistory();else if(modal?.id==="tradeModal")closeTrade();else if(modal?.id==="cryptoDetailModal")closeCryptoDetail();else if(modal?.id==="modal")closeModal()}));
document.querySelectorAll(".history-range button").forEach(button=>button.addEventListener("click",()=>setHistoryRange(Number(button.dataset.days))));
document.querySelectorAll(".modal").forEach(modal=>modal.addEventListener("click",event=>{if(event.target===modal){if(modal.id==="historyModal")closeHistory();else if(modal.id==="tradeModal")closeTrade();else if(modal.id==="cryptoDetailModal")closeCryptoDetail();else if(modal.id==="modal")closeModal()}}));
document.addEventListener("keydown",event=>{if(event.key!=="Escape")return;const open=document.querySelector(".modal:not([hidden])");if(!open)return;if(open.id==="historyModal")closeHistory();else if(open.id==="tradeModal")closeTrade();else if(open.id==="cryptoDetailModal")closeCryptoDetail();else closeModal()});
window.addEventListener("error",e=>{const el=document.getElementById("authResult");if(el)el.textContent="Erreur JavaScript : "+e.message;});
