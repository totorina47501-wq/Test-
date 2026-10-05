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
    const canTrade=["BTC","ETH","SOL"].includes(symbol);
    return `<article class="market"><div><strong>${name}</strong> <span class="symbol">${symbol}</span></div><div class="price">${priceText}</div><div class="${change<0?"symbol":"positive"}">${changeText}</div>${canTrade?`<button class="btn btn-ghost market-btn" onclick="openTrade('buy','${symbol}')">Acheter</button>`:"<span class=\"symbol\">Cours actuel</span>"}</article>`;
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
function setConnected(connected){document.getElementById("authState").textContent=connected?"Connecté":"Mode démo";document.getElementById("accountStatus").textContent=connected?"Compte connecté":"Compte démo"}
function renderWallet(){document.getElementById("cashBalance").textContent=Number(state.cash).toLocaleString("fr-FR",{minimumFractionDigits:2})+" €";document.getElementById("holdings").innerHTML=["BTC","ETH","SOL"].map(s=>`<div class="holding"><span>${s}</span><strong>${Number(state.holdings[s]||0).toFixed(6)}</strong></div>`).join("")}
async function apiFetch(path,options={}){const headers={...(options.headers||{})};if(!headers["Content-Type"]&&options.body)headers["Content-Type"]="application/json";if(apiToken)headers.Authorization=`Bearer ${apiToken}`;let r;try{r=await fetch(API+path,{...options,headers})}catch(e){throw Error(`Impossible de joindre l'API (${API}). Vérifiez que le service Northflank est démarré.`)}let data={};try{data=await r.json()}catch{}if(!r.ok)throw Error(data.error||`Erreur API (${r.status})`);return data}
async function loadPortfolio(){if(!apiToken){setConnected(false);renderWallet();return}try{const data=await apiFetch("/api/portfolio");state.cash=Number(data.cash||0);state.holdings={BTC:0,ETH:0,SOL:0};for(const row of data.holdings||[])if(row.asset in state.holdings)state.holdings[row.asset]=Number(row.quantity||0);setConnected(true);renderWallet()}catch(e){if(/authentifié|401/i.test(e.message)){apiToken="";localStorage.removeItem("bitgold-token");setConnected(false);renderWallet()}throw e}}
function simulate(){const amount=Number(document.getElementById("amount").value||0);const asset=document.getElementById("asset").value;const rates={"Bitcoin (BTC)":1.2842,"Ethereum (ETH)":1.192,"Solana (SOL)":1.431};const gain=amount*(rates[asset]-1);document.getElementById("result").textContent=`Simulation : ${amount.toLocaleString("fr-FR")} € en ${asset} → estimation théorique ${(amount+gain).toLocaleString("fr-FR",{maximumFractionDigits:2})} €. Gain/perte : ${gain.toLocaleString("fr-FR",{maximumFractionDigits:2})} €.`}
function openTrade(side,asset="BTC"){tradeSide=side;document.getElementById("tradeTitle").textContent=side==="buy"?"Acheter des cryptos":"Vendre des cryptos";document.getElementById("tradeAsset").value=asset;document.getElementById("tradeAmount").value=100;document.getElementById("tradeResult").textContent=apiToken?"":"Connectez-vous pour effectuer une opération démo.";document.getElementById("tradeModal").hidden=false}
function closeTrade(){document.getElementById("tradeModal").hidden=true}
async function executeTrade(){const result=document.getElementById("tradeResult");const asset=document.getElementById("tradeAsset").value;const amount=Number(document.getElementById("tradeAmount").value||0);if(!apiToken){result.textContent="Connectez-vous pour effectuer une opération démo.";return}if(amount<=0){result.textContent="Montant invalide.";return}result.textContent="Traitement…";try{await apiFetch("/api/trades",{method:"POST",body:JSON.stringify({side:tradeSide,asset,amount})});await loadPortfolio();result.textContent=`Opération démo effectuée : ${tradeSide==="buy"?"achat":"vente"} de ${(amount/(marketPrices[asset]||1)).toFixed(6)} ${asset} pour ${amount.toFixed(2)} €.`}catch(e){result.textContent=e.message}}
function openModal(type){authMode=type==="inscription"?"signup":"login";document.getElementById("modalTitle").textContent=authMode==="signup"?"Créer un compte BitGold":"Connexion BitGold";document.getElementById("authSubmit").textContent=authMode==="signup"?"Créer mon compte":"Se connecter";document.getElementById("authSwitch").textContent=authMode==="signup"?"J'ai déjà un compte":"Créer un compte";document.getElementById("authResult").textContent="";document.getElementById("modal").hidden=false}
function switchAuth(){openModal(authMode==="signup"?"connexion":"inscription")}
async function submitAuth(){const email=document.getElementById("authEmail").value,password=document.getElementById("authPassword").value;const result=document.getElementById("authResult");result.textContent="Connexion…";try{const d=await apiFetch("/api/auth/"+(authMode==="signup"?"signup":"login"),{method:"POST",body:JSON.stringify({email,password})});apiToken=d.token;localStorage.setItem("bitgold-token",apiToken);setConnected(true);closeModal();document.getElementById("compte")?.scrollIntoView({behavior:"smooth",block:"start"});try{await loadPortfolio()}catch(e){console.warn("Portfolio après authentification:",e.message)}}catch(e){result.textContent=e.message}}
function closeModal(){document.getElementById("modal").hidden=true}
loadMarket();setInterval(loadMarket,60000);
setConnected(!!apiToken);renderWallet();if(apiToken)loadPortfolio().catch(e=>console.warn("Portfolio API:",e.message));
window.openModal=openModal;window.switchAuth=switchAuth;window.submitAuth=submitAuth;window.closeModal=closeModal;window.openTrade=openTrade;window.executeTrade=executeTrade;window.closeTrade=closeTrade;window.simulate=simulate;
document.getElementById("authSubmit")?.addEventListener("click",submitAuth);
document.getElementById("authSwitch")?.addEventListener("click",switchAuth);
document.getElementById("authClose")?.addEventListener("click",closeModal);
document.querySelector("#topLogin")?.addEventListener("click",()=>openModal("connexion"));
document.querySelector("#heroSignup")?.addEventListener("click",()=>openModal("inscription"));
window.addEventListener("error",e=>{const el=document.getElementById("authResult");if(el)el.textContent="Erreur JavaScript : "+e.message;});
