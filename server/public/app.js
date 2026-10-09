
/* BitGold i18n — automatic locale detection with manual override. */
const BITGOLD_LANGS={
  fr:{label:"Français",countries:["FR","BE","CH","LU","MC","CA"]},
  en:{label:"English",countries:["US","GB","IE","AU","NZ","CA","IN","SG","ZA"]},
  es:{label:"Español",countries:["ES","MX","AR","CL","CO","PE","UY"]},
  de:{label:"Deutsch",countries:["DE","AT","CH","LI"]},
  it:{label:"Italiano",countries:["IT","SM","VA","CH"]},
  pt:{label:"Português",countries:["PT","BR","AO","MZ"]},
  nl:{label:"Nederlands",countries:["NL","BE"]},
};
const BITGOLD_TRANSLATIONS={
  en:{
    "Accueil":"Home","Marchés":"Markets","Tarifs":"Pricing","Sécurité":"Security","Transparence":"Transparency","À propos":"About","FAQ":"FAQ","Cockpit":"Cockpit","Activité":"Activity",
    "Commencer gratuitement":"Start for free","Explorer les marchés →":"Explore the markets →","La crypto,":"Crypto,","Plus simple. Plus maîtrisée.":"Simpler. More controlled.",
    "Votre niveau BitGold":"Your BitGold plan","Abonnement":"Subscription","Vos positions actuelles":"Your current positions","Aucun actif détenu.":"No assets held.",
    "Connexion sécurisée avec Google":"Secure sign-in with Google","Mode démo":"Demo mode","Se connecter":"Sign in","Créer un compte":"Create an account","Connexion":"Sign in","Inscription":"Create account",
    "Enregistrer":"Save","Déconnexion":"Sign out","Profil":"Profile","Voir les bots disponibles →":"View available bots →","Voir tout →":"View all →",
    "Actualisation en attente":"Waiting for refresh","SIMULATION":"SIMULATION","Live":"Live","Calculer":"Calculate","Simuler les frais":"Simulate fees",
    "Conservateur":"Conservative","Modéré":"Moderate","Dynamique":"Dynamic","EUR":"EUR","USD":"USD","GBP":"GBP"
  },
  es:{
    "Accueil":"Inicio","Marchés":"Mercados","Tarifs":"Precios","Sécurité":"Seguridad","Transparence":"Transparencia","À propos":"Acerca de","FAQ":"Preguntas frecuentes","Cockpit":"Panel","Activité":"Actividad",
    "Commencer gratuitement":"Empezar gratis","Explorer les marchés →":"Explorar los mercados →","La crypto,":"Cripto,","Plus simple. Plus maîtrisée.":"Más sencilla. Más controlada.",
    "Votre niveau BitGold":"Tu plan BitGold","Abonnement":"Suscripción","Vos positions actuelles":"Tus posiciones actuales","Aucun actif détenu.":"No tienes activos.",
    "Connexion sécurisée avec Google":"Inicio de sesión seguro con Google","Mode démo":"Modo demo","Se connecter":"Iniciar sesión","Créer un compte":"Crear cuenta","Connexion":"Iniciar sesión","Inscription":"Crear cuenta",
    "Enregistrer":"Guardar","Déconnexion":"Cerrar sesión","Profil":"Perfil","Voir les bots disponibles →":"Ver los bots disponibles →","Voir tout →":"Ver todo →",
    "Actualisation en attente":"Esperando actualización","SIMULATION":"SIMULACIÓN","Live":"En directo","Calculer":"Calcular","Simuler les frais":"Simular las comisiones",
    "Conservateur":"Conservador","Modéré":"Moderado","Dynamique":"Dinámico"
  },
  de:{
    "Accueil":"Startseite","Marchés":"Märkte","Tarifs":"Preise","Sécurité":"Sicherheit","Transparence":"Transparenz","À propos":"Über uns","FAQ":"FAQ","Cockpit":"Cockpit","Activité":"Aktivität",
    "Commencer gratuitement":"Kostenlos starten","Explorer les marchés →":"Märkte entdecken →","La crypto,":"Krypto,","Plus simple. Plus maîtrisée.":"Einfacher. Kontrollierter.",
    "Votre niveau BitGold":"Dein BitGold-Tarif","Abonnement":"Abonnement","Vos positions actuelles":"Deine aktuellen Positionen","Aucun actif détenu.":"Keine Assets vorhanden.",
    "Connexion sécurisée avec Google":"Sichere Anmeldung mit Google","Mode démo":"Demomodus","Se connecter":"Anmelden","Créer un compte":"Konto erstellen","Connexion":"Anmelden","Inscription":"Registrieren",
    "Enregistrer":"Speichern","Déconnexion":"Abmelden","Profil":"Profil","Voir les bots disponibles →":"Verfügbare Bots anzeigen →","Voir tout →":"Alle anzeigen →",
    "Actualisation en attente":"Warten auf Aktualisierung","SIMULATION":"SIMULATION","Live":"Live","Calculer":"Berechnen","Simuler les frais":"Gebühren simulieren",
    "Conservateur":"Konservativ","Modéré":"Moderat","Dynamique":"Dynamisch"
  },
  it:{
    "Accueil":"Home","Marchés":"Mercati","Tarifs":"Prezzi","Sécurité":"Sicurezza","Transparence":"Trasparenza","À propos":"Chi siamo","FAQ":"FAQ","Cockpit":"Pannello","Activité":"Attività",
    "Commencer gratuitement":"Inizia gratis","Explorer les marchés →":"Esplora i mercati →","La crypto,":"Crypto,","Plus simple. Plus maîtrisée.":"Più semplice. Più controllata.",
    "Votre niveau BitGold":"Il tuo piano BitGold","Abonnement":"Abbonamento","Vos positions actuelles":"Le tue posizioni attuali","Aucun actif détenu.":"Nessun asset detenuto.",
    "Connexion sécurisée avec Google":"Accesso sicuro con Google","Mode démo":"Modalità demo","Se connecter":"Accedi","Créer un compte":"Crea account","Connexion":"Accedi","Inscription":"Registrati",
    "Enregistrer":"Salva","Déconnexion":"Esci","Profil":"Profilo","Voir les bots disponibles →":"Vedi i bot disponibili →","Voir tout →":"Vedi tutto →",
    "Actualisation en attente":"In attesa di aggiornamento","SIMULATION":"SIMULAZIONE","Live":"Live","Calculer":"Calcola","Simuler les frais":"Simula le commissioni",
    "Conservateur":"Conservativo","Modéré":"Moderato","Dynamique":"Dinamico"
  },
  pt:{
    "Accueil":"Início","Marchés":"Mercados","Tarifs":"Preços","Sécurité":"Segurança","Transparence":"Transparência","À propos":"Sobre nós","FAQ":"Perguntas frequentes","Cockpit":"Painel","Activité":"Atividade",
    "Commencer gratuitement":"Começar grátis","Explorer les marchés →":"Explorar os mercados →","La crypto,":"Cripto,","Plus simple. Plus maîtrisée.":"Mais simples. Mais controlada.",
    "Votre niveau BitGold":"O teu plano BitGold","Abonnement":"Subscrição","Vos positions actuelles":"As tuas posições atuais","Aucun actif détenu.":"Nenhum ativo detido.",
    "Connexion sécurisée avec Google":"Início de sessão seguro com Google","Mode démo":"Modo de demonstração","Se connecter":"Iniciar sessão","Créer un compte":"Criar conta","Connexion":"Iniciar sessão","Inscription":"Criar conta",
    "Enregistrer":"Guardar","Déconnexion":"Terminar sessão","Profil":"Perfil","Voir les bots disponibles →":"Ver bots disponíveis →","Voir tout →":"Ver tudo →",
    "Actualisation en attente":"A aguardar atualização","SIMULATION":"SIMULAÇÃO","Live":"Em direto","Calculer":"Calcular","Simuler les frais":"Simular as comissões",
    "Conservateur":"Conservador","Modéré":"Moderado","Dynamique":"Dinâmico"
  },
  nl:{
    "Accueil":"Home","Marchés":"Markten","Tarifs":"Prijzen","Sécurité":"Beveiliging","Transparence":"Transparantie","À propos":"Over ons","FAQ":"Veelgestelde vragen","Cockpit":"Cockpit","Activité":"Activiteit",
    "Commencer gratuitement":"Gratis starten","Explorer les marchés →":"Markten bekijken →","La crypto,":"Crypto,","Plus simple. Plus maîtrisée.":"Eenvoudiger. Beter beheerst.",
    "Votre niveau BitGold":"Jouw BitGold-plan","Abonnement":"Abonnement","Vos positions actuelles":"Je huidige posities","Aucun actif détenu.":"Geen activa aangehouden.",
    "Connexion sécurisée avec Google":"Veilig inloggen met Google","Mode démo":"Demomodus","Se connecter":"Inloggen","Créer un compte":"Account aanmaken","Connexion":"Inloggen","Inscription":"Registreren",
    "Enregistrer":"Opslaan","Déconnexion":"Uitloggen","Profil":"Profiel","Voir les bots disponibles →":"Beschikbare bots bekijken →","Voir tout →":"Alles bekijken →",
    "Actualisation en attente":"Wachten op update","SIMULATION":"SIMULATIE","Live":"Live","Calculer":"Berekenen","Simuler les frais":"Kosten simuleren",
    "Conservateur":"Conservatief","Modéré":"Gemiddeld","Dynamique":"Dynamisch"
  }
};
function detectBitGoldLanguage(){
  const saved=localStorage.getItem("bitgold-language");
  if(saved && BITGOLD_LANGS[saved]) return {lang:saved,source:"manual"};
  const locales=[...(navigator.languages||[]),navigator.language||"fr-FR"];
  for(const locale of locales){
    const parts=String(locale).toLowerCase().split("-");
    const base=parts[0], region=(parts[1]||"").toUpperCase();
    if(BITGOLD_LANGS[base]) return {lang:base,source:"locale"};
    for(const [lang,data] of Object.entries(BITGOLD_LANGS)) if(region && data.countries.includes(region)) return {lang,source:"country"};
  }
  return {lang:"en",source:"default"};
}
function translateBitGoldText(lang){
  const dict=BITGOLD_TRANSLATIONS[lang]||{};
  if(lang==="fr") return;
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  const nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node=>{
    if(node.parentElement?.closest("script,style,svg,option")) return;
    const original=node.nodeValue.trim();
    if(!original) return;
    const translated=dict[original];
    if(translated) node.nodeValue=node.nodeValue.replace(original,translated);
  });
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const key=el.getAttribute("data-i18n");
    if(dict[key]) el.textContent=dict[key];
  });
}
function initBitGoldI18n(){
  const select=document.getElementById("languageSelect"); if(!select) return;
  const detected=detectBitGoldLanguage();
  select.value=detected.source==="manual"?detected.lang:"auto";
  document.documentElement.lang=detected.lang;
  translateBitGoldText(detected.lang);
  document.documentElement.dataset.i18nReady="true";
  select.addEventListener("change",()=>{
    const value=select.value;
    if(value==="auto") localStorage.removeItem("bitgold-language");
    else localStorage.setItem("bitgold-language",value);
    location.reload();
  });
}


const BITGOLD_CURRENCIES={
  EUR:{label:"Euro",countries:["AT","BE","CY","DE","EE","ES","FI","FR","GR","HR","IE","IT","LT","LU","LV","MC","MT","NL","PT","SI","SK"]},
  USD:{label:"Dollar américain",countries:["US","EC","SV","PA","PR"]},
  GBP:{label:"Livre sterling",countries:["GB","GG","IM","JE"]},
  CHF:{label:"Franc suisse",countries:["CH","LI"]},
  CAD:{label:"Dollar canadien",countries:["CA"]},
  AUD:{label:"Dollar australien",countries:["AU"]},
  NZD:{label:"Dollar néo-zélandais",countries:["NZ"]},
  JPY:{label:"Yen japonais",countries:["JP"]},
  CNY:{label:"Yuan chinois",countries:["CN"]},
  HKD:{label:"Dollar de Hong Kong",countries:["HK"]},
  SGD:{label:"Dollar de Singapour",countries:["SG"]},
  BRL:{label:"Real brésilien",countries:["BR"]},
  MXN:{label:"Peso mexicain",countries:["MX"]},
  INR:{label:"Roupie indienne",countries:["IN"]},
  SEK:{label:"Couronne suédoise",countries:["SE"]},
  NOK:{label:"Couronne norvégienne",countries:["NO"]},
  DKK:{label:"Couronne danoise",countries:["DK"]},
  PLN:{label:"Zloty polonais",countries:["PL"]},
  CZK:{label:"Couronne tchèque",countries:["CZ"]},
  HUF:{label:"Forint hongrois",countries:["HU"]},
  RON:{label:"Leu roumain",countries:["RO"]},
  TRY:{label:"Livre turque",countries:["TR"]}
};
function countryCodeFromLocale(){
  const locales=[...(navigator.languages||[]),navigator.language||"fr-FR"];
  for(const locale of locales){
    const parts=String(locale).split("-");
    if(parts[1]&&/^[A-Za-z]{2}$/.test(parts[1])) return parts[1].toUpperCase();
  }
  return "FR";
}
function currencyForCountry(country){
  const value=String(country||"").trim().toUpperCase();
  if(/^[A-Z]{2}$/.test(value)){
    for(const [currency,data] of Object.entries(BITGOLD_CURRENCIES)) if(data.countries.includes(value)) return currency;
  }
  const normalized=String(country||"").trim().toLowerCase();
  const aliases={france:"EUR",germany:"EUR",espagne:"EUR",spain:"EUR",italie:"EUR",italy:"EUR",portugal:"EUR",belgique:"EUR",belgium:"EUR",suisse:"CHF",switzerland:"CHF",canada:"CAD","états-unis":"USD","united states":"USD","royaume-uni":"GBP","united kingdom":"GBP",japon:"JPY",japan:"JPY",brésil:"BRL",brazil:"BRL",mexique:"MXN",mexico:"MXN",inde:"INR",india:"INR"};
  return aliases[normalized]||"EUR";
}
function currencyForCurrentUser(){
  return safeStorageGet("bitgold-currency")||currencyForCountry(countryCodeFromLocale());
}
function setCurrencyPreference(currency){
  const value=Object.prototype.hasOwnProperty.call(BITGOLD_CURRENCIES,currency)?currency:"EUR";
  safeStorageSet("bitgold-currency",value);
  if(typeof window!=="undefined")window.dispatchEvent(new CustomEvent("bitgold:currency-ready"));
  return value;
}
function applyCountryCurrencyDefaults(){
  const detected=currencyForCountry(countryCodeFromLocale());
  const signupCurrency=document.getElementById("authCurrency");
  const profileCurrency=document.getElementById("profileCurrency");
  if(signupCurrency && !signupCurrency.dataset.userChanged) signupCurrency.value=currencyForCurrentUser()||detected;
  if(profileCurrency && !profileCurrency.dataset.userChanged && !profileCurrency.value) profileCurrency.value=detected;
}
function syncCurrencyFromCountry(inputId,currencyId){
  const country=document.getElementById(inputId),currency=document.getElementById(currencyId);
  if(!country||!currency||currency.dataset.userChanged)return;
  currency.value=currencyForCountry(country.value);
}

let BITGOLD_FX={base:"EUR",rates:{EUR:1},updatedAt:0,source:"ECB"};
function currentCurrency(){return currencyForCurrentUser()||"EUR"}
function fxRate(currency=currentCurrency()){return Number(BITGOLD_FX.rates[currency]||1)}
function formatMoney(value,options={}){
  const eur=Number(value)||0;
  const currency=options.currency||currentCurrency();
  const converted=eur*Number(BITGOLD_FX.rates[currency]||1);
  const requestedMax=options.maximumFractionDigits;
  const digits=Number.isInteger(requestedMax)&&requestedMax>=0?requestedMax:(Math.abs(converted)<10?4:2);
  const requestedMin=options.minimumFractionDigits;
  const minDigits=Number.isInteger(requestedMin)&&requestedMin>=0?Math.min(requestedMin,digits):Math.min(2,digits);
  return converted.toLocaleString("fr-FR",{minimumFractionDigits:minDigits,maximumFractionDigits:digits,style:"currency",currency});
}
function formatCompactMoney(value){
  const eur=Number(value)||0,converted=eur*fxRate();
  if(Math.abs(converted)>=1000000)return (converted/1000000).toLocaleString("fr-FR",{maximumFractionDigits:1})+" M "+currentCurrency();
  if(Math.abs(converted)>=1000)return (converted/1000).toLocaleString("fr-FR",{maximumFractionDigits:1})+" k "+currentCurrency();
  return formatMoney(eur);
}
async function loadFxRates(){
  try{
    const data=await apiFetch("/api/fx");
    if(data?.rates){BITGOLD_FX=data;window.dispatchEvent(new CustomEvent("bitgold:fx-ready"))}
  }catch(e){console.warn("Taux de change:",e.message)}
}
function formatVisitorEuro(value){return formatMoney(value,{currency:"EUR"})}
const VISITOR_FEE_POLICY={
  free:{cashin:{rate:0.015,fixed:0.50},cashout:{rate:0.0199,fixed:0.50}},
  pro:{cashin:{rate:0.009,fixed:0.35},cashout:{rate:0.0125,fixed:0.35}},
  elite:{cashin:{rate:0.0045,fixed:0.20},cashout:{rate:0.0075,fixed:0.20}}
};
function simulateVisitorFees(){
  const plan=document.getElementById("visitorFeePlan")?.value||"free";
  const type=document.getElementById("visitorFeeType")?.value||"cashin";
  const amount=Number(document.getElementById("visitorFeeAmount")?.value||0);
  const result=document.getElementById("visitorFeeResult");
  if(!result)return;
  if(!Number.isFinite(amount)||amount<=0){result.innerHTML="<span>Montant invalide</span><strong>Entrez un montant supérieur à 0 €</strong><small>Simulation uniquement · aucun mouvement réel</small>";return}
  const rule=VISITOR_FEE_POLICY[plan]?.[type]||VISITOR_FEE_POLICY.free.cashin;
  const fee=Math.round((amount*rule.rate+rule.fixed)*100)/100;
  const net=Math.round((amount-fee)*100)/100;
  const operation=type==="cashin"?"Cash-in":"Cash-out";
  const label=plan.charAt(0).toUpperCase()+plan.slice(1);
  result.innerHTML="<span>Pour "+formatVisitorEuro(amount)+" en "+operation+" "+label+"</span><strong>"+formatVisitorEuro(fee)+" de frais</strong><small>Net simulé : "+formatVisitorEuro(net)+" · "+(rule.rate*100).toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})+" % + "+formatVisitorEuro(rule.fixed)+" · Aucun mouvement réel</small>";
}
const DEMO_BOTS={
  shield:{name:"Shield Bot",asset:"BTC",amount:180,confidence:82,signals:"volatilité modérée · réserve cash · momentum positif",message:"Protection d'abord : petite exposition BTC avec une réserve de cash élevée."},
  silver:{name:"Silver Bot",asset:"BTC",amount:300,confidence:76,signals:"tendance · diversification · momentum positif",message:"Équilibre tendance et diversification : renforcement progressif du leader."},
  gold:{name:"Gold Bot",asset:"BTC",amount:450,confidence:88,signals:"momentum fort · régime risk-on · tendance dominante",message:"Approche offensive : renforcement du leader dans la simulation."},
  "adaptive-ai":{name:"Adaptive AI Bot",asset:"ETH",amount:400,confidence:84,signals:"score adaptatif · momentum · volatilité",message:"Score adaptatif simulé : allocation vers l'actif présentant le meilleur signal."},
  "quant-pulse":{name:"Quant Pulse Bot",asset:"SOL",amount:350,confidence:79,signals:"mean-reversion · écart au prix moyen · volatilité",message:"Mean-reversion simulée : recherche d'un excès de prix avant entrée."},
  "macro-rotation":{name:"Macro Rotation Bot",asset:"BTC",amount:500,confidence:81,signals:"régime macro · rotation · momentum",message:"Rotation macro simulée : privilégie le leader en régime risk-on."}
};
const demoState={cash:10000,holdings:{BTC:0,ETH:0,SOL:0},activity:[]};
function demoPortfolioTotal(){
  return demoState.cash+Object.entries(demoState.holdings).reduce((sum,[asset,qty])=>sum+(Number(qty)||0)*(Number(marketPrices[asset])||0),0);
}
function renderDemoLab(){
  const cash=document.getElementById("demoCash"),holdings=document.getElementById("demoHoldings"),total=document.getElementById("demoTotal"),price=document.getElementById("demoBtcPrice"),log=document.getElementById("demoActivity");
  if(!cash)return;
  const positions=Object.entries(demoState.holdings).filter(([,qty])=>Number(qty)>0).map(([asset,qty])=>asset+" "+Number(qty).toFixed(6));
  cash.textContent=formatMoney(demoState.cash,{currency:"EUR"});
  if(holdings)holdings.textContent=positions.length?positions.join(" · "):"Aucune";
  total.textContent=formatMoney(demoPortfolioTotal(),{currency:"EUR"});
  if(price)price.textContent="BTC · "+formatMoney(marketPrices.BTC,{currency:"EUR"});
  if(log)log.innerHTML=demoState.activity.length?demoState.activity.slice().reverse().map(item=>'<div class="demo-activity-row"><span>'+item.icon+'</span><div><strong>'+escapeHtml(item.title)+'</strong><small>'+escapeHtml(item.text)+'</small></div></div>').join(""):'<div class="demo-empty">Aucune opération simulée.</div>';
}
function openDemoLab(){
  const modal=document.getElementById("demoModal");if(!modal)return;
  document.body.classList.add("modal-open");modal.hidden=false;renderDemoLab();
}
function closeDemoLab(){const modal=document.getElementById("demoModal");if(modal){modal.hidden=true;document.body.classList.remove("modal-open")}}
function demoBuyBitcoin(){
  const amount=Number(document.getElementById("demoBuyAmount")?.value||0),price=Number(marketPrices.BTC||0),maxTrade=250;
  if(!Number.isFinite(amount)||amount<10)return setDemoResult("demoTradeResult","Montant invalide. Choisissez au moins 10 €.","error");
  if(!Number.isFinite(price)||price<=0)return setDemoResult("demoTradeResult","Cours BTC indisponible. Réessayez lorsque les données de marché sont chargées.","error");
  if(amount>maxTrade)return setDemoResult("demoTradeResult","Le garde-fou démo limite cette opération à 250 €.","error");
  if(amount>demoState.cash)return setDemoResult("demoTradeResult","Solde démo insuffisant.","error");
  const qty=amount/price;demoState.cash-=amount;demoState.holdings.BTC+=qty;
  demoState.activity.push({icon:"↗",title:"Achat BTC simulé",text:formatMoney(amount,{currency:"EUR"})+" · "+qty.toFixed(8)+" BTC"});
  setDemoResult("demoTradeResult","Achat simulé confirmé : "+qty.toFixed(8)+" BTC pour "+formatMoney(amount,{currency:"EUR"})+".","success");renderDemoLab();
}
function demoApplyBot(){
  const type=document.getElementById("demoBotSelect")?.value||"shield",bot=DEMO_BOTS[type],price=Number(marketPrices[bot.asset]||0),amount=Math.min(bot.amount,250,demoState.cash*.7);
  if(!bot||!price||amount<10)return setDemoResult("demoBotResult","Le bot ne peut pas agir dans ces conditions de simulation.","error");
  const qty=amount/price;demoState.cash-=amount;demoState.holdings[bot.asset]=(demoState.holdings[bot.asset]||0)+qty;
  demoState.activity.push({icon:"⚙",title:bot.name+" · décision simulée",text:bot.message+" "+formatMoney(amount,{currency:"EUR"})+" sur "+bot.asset+"."});
  setDemoResult("demoBotResult",bot.name+" a appliqué son scénario démo : "+formatMoney(amount,{currency:"EUR"})+" sur "+bot.asset+".","success");
  const decision=document.getElementById("demoDecision");if(decision){decision.hidden=false;decision.innerHTML='<div><span>DÉCISION DU BOT</span><strong>'+escapeHtml(bot.name)+'</strong></div><div><b>'+escapeHtml(bot.asset)+'</b><small>Actif sélectionné</small></div><div><b>'+formatMoney(amount,{currency:"EUR"})+'</b><small>Allocation simulée</small></div><div><b>'+qty.toFixed(8)+' '+escapeHtml(bot.asset)+'</b><small>Position ajoutée</small></div><div class="demo-decision-why"><span>POURQUOI ?</span><strong>'+escapeHtml(String(bot.confidence||0))+' % de confiance</strong><small>'+escapeHtml(bot.signals||"Signaux simulés")+'</small><em>'+escapeHtml(bot.message)+'</em></div>'}
  pushSimNotification(bot.name+" · décision simulée",bot.message+" Allocation de "+formatMoney(amount,{currency:"EUR"})+" sur "+bot.asset+".","⚙");renderDemoLab();
}
function runDemoSimulation(){
  const type=document.getElementById("demoBotSelect")?.value||"shield",bot=DEMO_BOTS[type],days=Number(document.getElementById("demoSimDays")?.value||30);
  if(!bot)return;
  const profiles={shield:{beta:.55,alpha:.00035,vol:.007},silver:{beta:.78,alpha:.00045,vol:.010},gold:{beta:1.08,alpha:.00055,vol:.014},"adaptive-ai":{beta:.92,alpha:.0008,vol:.011},"quant-pulse":{beta:.84,alpha:.0007,vol:.009},"macro-rotation":{beta:.72,alpha:.00065,vol:.008}};
  const profile=profiles[type]||profiles.shield;
  let value=10000,peak=value,maxDd=0;const curve=[value],events=[];
  for(let day=1;day<=days;day++){
    const wave=Math.sin(day*.71+type.length)*.004;
    const cycle=Math.sin(day*.19+type.length*.7)*.003;
    const shock=(Math.sin(day*12.9898+type.length*78.233)*43758.5453%1)*profile.vol;
    const marketReturn=wave+cycle+shock;
    const daily=marketReturn*profile.beta+profile.alpha;
    value*=1+daily;
    if(value>peak)peak=value;
    const dd=(value-peak)/peak;
    if(dd<maxDd)maxDd=dd;
    curve.push(value);
    if(day===1||day%Math.max(5,Math.round(days/6))===0||day===days){
      const action=day%3===0?"Renforcement simulé":"Ajustement de risque";
      events.push({day,value,action,text:bot.name+" · "+action+" · exposition "+bot.asset});
    }
  }
  const pnl=value-10000,chartW=900,chartH=220,padX=8,padY=18,min=Math.min(...curve),max=Math.max(...curve),range=Math.max(max-min,1);
  const points=curve.map((v,i)=>(padX+(i/(curve.length-1))*(chartW-padX*2)).toFixed(1)+","+(padY+(1-(v-min)/range)*(chartH-padY*2)).toFixed(1)).join(" ");
  const chart='<div class="demo-sim-chart-head"><span>Valeur du portefeuille</span><b>'+days+' jours</b></div><svg viewBox="0 0 '+chartW+' '+chartH+'" preserveAspectRatio="none" role="img" aria-label="Courbe de simulation sur '+days+' jours"><polyline points="'+points+'" fill="none" stroke="#b3ffca" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg><div class="demo-sim-axis"><span>J0 · 10 000 €</span><span>J'+Math.round(days/2)+'</span><span>J'+days+'</span></div>';
  const chartEl=document.getElementById("demoSimChart");if(chartEl)chartEl.innerHTML=chart;
  const end=document.getElementById("demoSimEnd"),pnlEl=document.getElementById("demoSimPnl"),ddEl=document.getElementById("demoSimDrawdown");
  if(end)end.textContent=formatMoney(value,{currency:"EUR"});
  if(pnlEl){pnlEl.textContent=(pnl>=0?"+":"")+formatMoney(pnl,{currency:"EUR"});pnlEl.className=pnl>=0?"positive":"negative"}
  if(ddEl){ddEl.textContent=(maxDd*100).toFixed(2).replace(".",",")+"%";ddEl.className=maxDd<=-.08?"negative":""}
  const timeline=document.getElementById("demoSimTimeline");
  if(timeline)timeline.innerHTML=events.map(e=>'<div class="demo-sim-event"><span>J'+e.day+'</span><div><strong>'+escapeHtml(e.action)+'</strong><small>'+escapeHtml(e.text)+'</small></div><b>'+formatMoney(e.value,{currency:"EUR"})+'</b></div>').join("");
  demoState.activity.unshift({icon:"▶",title:bot.name+" · simulation "+days+" jours",text:"Résultat synthétique : "+(pnl>=0?"+":"")+formatMoney(pnl,{currency:"EUR"})+" · drawdown max "+(maxDd*100).toFixed(2).replace(".",",")+" %."});
}
function resetDemoLab(){
  demoState.cash=10000;demoState.holdings={BTC:0,ETH:0,SOL:0};demoState.activity=[];
  setDemoResult("demoTradeResult","Portefeuille démo réinitialisé.","success");setDemoResult("demoBotResult","Prêt pour une nouvelle simulation.","success");const decision=document.getElementById("demoDecision");if(decision){decision.hidden=true;decision.innerHTML=""}renderDemoLab();
}
function setDemoResult(id,message,type=""){const el=document.getElementById(id);if(el){el.textContent=message;el.className="demo-result"+(type?" "+type:"")}}
function initHomeExplorer(){
  const topics={
    demo:{eyebrow:"MODE DÉMO",title:"Achetez votre premier Bitcoin en quelques secondes.",text:"Commencez avec 10 000 € virtuels, choisissez un montant en BTC et voyez immédiatement l'impact sur votre portefeuille.",bullets:["✓ Prix de marché","✓ Solde simulé","✓ Historique des opérations"],action:"Tester maintenant",link:"/investir",linkText:"Explorer les marchés →",handler:openDemoLab},
    cockpit:{eyebrow:"COCKPIT",title:"Une vue unique pour piloter votre portefeuille.",text:"Performance, risque, positions, activité et recommandation Autopilot réunis dans un espace clair.",bullets:["✓ Valeur & performance","✓ Risk Center","✓ Autopilot"],action:"Voir le cockpit",link:"#dashboard",linkText:"Découvrir le cockpit →"},
    bots:{eyebrow:"BOTS",title:"Choisissez une stratégie et voyez ses garde-fous.",text:"Shield, Silver, Gold, Adaptive AI, Quant Pulse et Macro Rotation : chaque bot expose son profil et ses limites.",bullets:["✓ 6 stratégies","✓ Plans Free / Pro / Elite","✓ Paramètres de risque"],action:"Voir les bots",link:"#bots",linkText:"Comparer les stratégies →"},
    fees:{eyebrow:"TRANSPARENCE",title:"Connaissez le coût avant toute opération.",text:"Les taux cash-in et cash-out sont affichés par formule, avec un simulateur de frais accessible sans compte.",bullets:["✓ Grille Free / Pro / Elite","✓ Simulateur public","✓ Aucun mouvement réel"],action:"Simuler les frais",link:"#transparence",linkText:"Voir la transparence →"},
    guardrails:{eyebrow:"GARDE-FOUS",title:"La stratégie vient avec ses limites.",text:"Montant maximum, position maximum, stop de protection et réserve de cash encadrent les décisions simulées des bots.",bullets:["✓ Max trade","✓ Max position","✓ Stop-loss & cash minimum"],action:"Voir les protections",link:"#bots",linkText:"Voir les paramètres →"}
  };
  const buttons=[...document.querySelectorAll("[data-home-topic]")],stage=document.querySelector(".home-topic-stage");
  const render=(key)=>{
    const topic=topics[key]||topics.demo;buttons.forEach(b=>b.classList.toggle("active",b.dataset.homeTopic===key));
    const eyebrow=document.getElementById("homeTopicEyebrow"),title=document.getElementById("homeTopicTitle"),text=document.getElementById("homeTopicText"),bullets=document.getElementById("homeTopicBullets"),action=document.getElementById("homeTopicAction"),link=document.getElementById("homeTopicLink");
    if(eyebrow)eyebrow.textContent=topic.eyebrow;if(title)title.textContent=topic.title;if(text)text.textContent=topic.text;if(bullets)bullets.innerHTML=topic.bullets.map(x=>"<span>"+x+"</span>").join("");if(action){action.textContent=topic.action;action.onclick=topic.handler||(()=>document.querySelector(topic.link)?.scrollIntoView({behavior:"smooth",block:"start"}))}if(link){link.href=topic.link;link.textContent=topic.linkText}
    const value=document.getElementById("homeStageValue"),meta=document.getElementById("homeStageMeta");
    const values={demo:["10 000 €","Capital démo disponible"],cockpit:["100 %","Pilotage du portefeuille"],bots:["6 bots","6 philosophies"],fees:["3 formules","Frais affichés avant validation"],guardrails:["4 limites","Risque encadré"]}[key]||["10 000 €","Capital démo disponible"];
    if(value)value.textContent=values[0];if(meta)meta.textContent=values[1];
    if(stage){stage.dataset.topic=key}
  };
  buttons.forEach(b=>b.addEventListener("click",()=>render(b.dataset.homeTopic)));render("demo");
}
async function submitNewsletter(event){
  event.preventDefault();
  const form=document.getElementById("newsletterForm"),input=document.getElementById("newsletterEmail"),result=document.getElementById("newsletterResult"),button=form?.querySelector("button[type=submit]");
  if(!form||!input||!result)return;
  const email=String(input.value||"").trim().toLowerCase();
  if(!/^\S+@\S+\.\S+$/.test(email)){result.textContent="Entrez une adresse email valide.";result.className="newsletter-result error";return}
  if(button)button.disabled=true;
  result.textContent="Inscription en cours…";result.className="newsletter-result";
  try{
    const data=await apiFetch("/api/newsletter/subscribe",{method:"POST",body:JSON.stringify({email})});
    result.textContent=data.message||"Inscription confirmée.";
    result.className="newsletter-result success";
    form.reset();
  }catch(e){result.textContent=e.message||"Inscription impossible pour le moment.";result.className="newsletter-result error"}
  finally{if(button)button.disabled=false}
}

function safeStorageGet(key){try{return localStorage.getItem(key)||""}catch{return ""}}
function safeStorageSet(key,value){try{localStorage.setItem(key,value)}catch{}}
function safeStorageRemove(key){try{localStorage.removeItem(key)}catch{}}
const configuredApi=(safeStorageGet("bitgold-api")||window.BITGOLD_API||"").trim().replace(/\/$/,"");
const API=configuredApi||window.location.origin;
let apiToken=safeStorageGet("bitgold-token");
let authMode="login";
let tradeSide="buy";
let state={cash:10000,holdings:{BTC:0,ETH:0,SOL:0,USDC:0,LINK:0,AVAX:0},portfolio:null};
const marketNames={BTC:"Bitcoin",ETH:"Ethereum",SOL:"Solana",USDC:"USD Coin",LINK:"Chainlink",AVAX:"Avalanche"};
let marketPrices={BTC:67420.10,ETH:3248.70,SOL:154.20,USDC:0.92,LINK:17.84,AVAX:28.16};
const fallbackMarkets=[["Bitcoin","BTC",67420.10,0],["Ethereum","ETH",3248.70,0],["Solana","SOL",154.20,0],["USD Coin","USDC",0.92,0],["Chainlink","LINK",17.84,0],["Avalanche","AVAX",28.16,0]];
let marketPreviewDays=1;
let botState={catalog:[],items:[],activity:[],plan:{plan:"free"}};
let lastMarketData=[];
function marketCategory(symbol){if(symbol==="USDC")return "stable";if(["LINK","AVAX"].includes(symbol))return "defi";return "majors"}
function renderMarket(markets){
  lastMarketData=markets||[];
  const grid=document.getElementById("marketGrid");
  if(!grid)return;
  const query=String(document.getElementById("investirMarketSearch")?.value||"").trim().toLowerCase();
  const filter=document.querySelector("[data-market-filter].active")?.dataset.marketFilter||"all";
  const filtered=lastMarketData.filter(item=>{const symbol=String(item.symbol||"").toLowerCase();const name=String(marketNames[item.symbol]||item.symbol||"").toLowerCase();return (!query||symbol.includes(query)||name.includes(query))&&(filter==="all"||marketCategory(item.symbol)===filter)});
  const count=document.getElementById("investirMarketCount");if(count)count.textContent=filtered.length+" actif"+(filtered.length>1?"s":"")+" affiché"+(filtered.length>1?"s":"");
  grid.innerHTML=filtered.length?filtered.map(({symbol,price,change24h,marketCap})=>{
    const name=marketNames[symbol]||symbol;
    const change=Number(change24h||0);
    marketPrices[symbol]=Number(price)||marketPrices[symbol];
    const priceText=formatMoney(marketPrices[symbol]);
    const changeText=(change>0?"+":"")+change.toFixed(2).replace(".",",")+"%";
    const canTrade=["BTC","ETH","SOL","USDC","LINK","AVAX"].includes(symbol);
    return `<article class="market market-clickable" data-crypto="${symbol}">
      <div class="market-card-head">
        <div class="market-identity"><span class="coin-mark coin-${symbol.toLowerCase()}">${coinIcon(symbol)}</span><div><strong>${name}</strong><span class="symbol">${symbol}</span></div></div>
        <span class="market-live"><i></i> Live</span>
      </div>
      <div class="market-price-row"><div class="price">${priceText}</div><span class="market-change ${change>=0?"up":"down"}">${changeText}</span></div>
      <div class="market-chart-head"><span>Évolution <b>${marketPreviewDays===1?"24h":marketPreviewDays+"j"}</b></span><span>${currentCurrency()}</span></div>
      <div class="market-sparkline" data-sparkline="${symbol}"><span>Chargement…</span></div>
      <div class="market-card-foot"><span class="market-meta">${marketCap?formatCompactMoney(marketCap)+" cap.": "Marché crypto"}</span><span class="market-arrow">Voir le détail →</span></div>
      <div class="market-indicators" data-indicators="${symbol}" aria-label="Indicateurs techniques"><span class="market-indicator muted">Analyse…</span></div>
      <div class="market-actions">${canTrade?`<button class="btn btn-primary market-btn" data-trade-side="buy" data-trade-asset="${symbol}" type="button">Simuler</button>`:""}</div>
    </article>`;
  }).join(""):"";
}
async function loadMarket(){
  try{
    const data=await apiFetch("/api/market");
    renderMarket(data.markets||[]);
    return data;
  }catch(e){
    console.warn("Cours marché:",e.message);
    if(lastMarketData.length){renderMarket(lastMarketData);document.querySelectorAll("#marketGrid .market-live").forEach(label=>{label.textContent="Dernières données disponibles";label.classList.add("market-stale")});}else{renderMarket([]);const grid=document.getElementById("marketGrid");if(grid)grid.innerHTML='<div class="market-unavailable" role="status">Cours temporairement indisponibles. Aucun prix de démonstration n’est affiché comme un cours réel. Réessayez dans quelques instants.</div>';}
  }
}
let marketHistoryPreview={};

function formatPrice(value){
  return Number(value).toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:value<10?4:2})+" €";
}
const HISTORY_RANGES={"5m":{label:"5 min",days:1},"1h":{label:"1 h",days:1},"24h":{label:"24 h",days:1},"7d":{label:"7 jours",days:7},"30d":{label:"30 jours",days:30},"1y":{label:"1 an",days:365},"5y":{label:"5 ans",days:"max"}};
let historyState={symbol:"BTC",range:"24h",points:[]};
let cryptoDetailRefreshTimer=null;
function chartPeriodLabel(range){return HISTORY_RANGES[range]?.label||"24 h";}
function formatChartValue(value){return formatMoney(value,{maximumFractionDigits:Number(value)<10?4:Number(value)>=1000?0:2})}
function hasEliteChartTools(){
  return !!apiToken && botState.plan?.plan==="elite" && botState.plan?.features?.chartAdvanced===true;
}
let eliteChartZoom=1;
let eliteChartPanX=0;
let eliteChartPanY=0;
function resetEliteChartTransform(){
  eliteChartZoom=1;eliteChartPanX=0;eliteChartPanY=0;
  const svg=document.querySelector("#cryptoDetailChart .history-chart");
  if(svg)svg.style.transform="";
}
function applyEliteChartTransform(){
  const svg=document.querySelector("#cryptoDetailChart .history-chart");
  if(!svg)return;
  svg.style.transform="translate("+eliteChartPanX+"px,"+eliteChartPanY+"px) scale("+eliteChartZoom+")";
  svg.style.transformOrigin="50% 50%";
  svg.style.cursor=eliteChartZoom>1?"grab":"crosshair";
}
function bindEliteChartTools(){
  const chart=document.getElementById("cryptoDetailChart");
  if(!chart||!hasEliteChartTools())return;
  const wrap=chart.querySelector(".history-chart-wrap");
  const svg=chart.querySelector(".history-chart");
  if(!wrap||!svg)return;
  wrap.classList.add("elite-chart-enabled");
  wrap.style.position="relative";
  const oldToolbar=wrap.querySelector(".elite-chart-toolbar"); if(oldToolbar)oldToolbar.remove();
  const oldOverlay=wrap.querySelector(".elite-chart-overlay"); if(oldOverlay)oldOverlay.remove();
  const toolbar=document.createElement("div");
  toolbar.className="elite-chart-toolbar";
  toolbar.innerHTML='<span class="elite-chart-badge">ELITE · OUTILS TRADING</span><button type="button" data-chart-tool="crosshair" aria-pressed="true">Curseur</button><button type="button" data-chart-tool="zoom-in">Zoom +</button><button type="button" data-chart-tool="zoom-out">Zoom −</button><button type="button" data-chart-tool="reset">Réinitialiser</button><span class="elite-chart-hint">Molette = zoom · glisser = déplacer</span>';
  wrap.insertBefore(toolbar,wrap.querySelector(".chart-labels")||svg);
  const overlay=document.createElement("div");
  overlay.className="elite-chart-overlay";
  overlay.innerHTML='<div class="elite-crosshair-v"></div><div class="elite-crosshair-h"></div><div class="elite-chart-tooltip"></div>';
  wrap.appendChild(overlay);
  const tooltip=overlay.querySelector(".elite-chart-tooltip"),vLine=overlay.querySelector(".elite-crosshair-v"),hLine=overlay.querySelector(".elite-crosshair-h");
  let crosshair=true,dragging=false,lastX=0,lastY=0;
  const points=historyState.points||[];
  const clean=points.map(p=>({timestamp:Number(p.timestamp),price:Number(p.price)})).filter(p=>Number.isFinite(p.timestamp)&&Number.isFinite(p.price)&&p.price>0);
  const nearest=(ratio)=>{
    if(!clean.length)return null;
    const index=Math.max(0,Math.min(clean.length-1,Math.round(ratio*(clean.length-1))));
    return clean[index];
  };
  const show=(event)=>{
    if(!crosshair||!clean.length)return;
    const rect=svg.getBoundingClientRect();
    const x=Math.max(0,Math.min(rect.width,event.clientX-rect.left));
    const y=Math.max(0,Math.min(rect.height,event.clientY-rect.top));
    const point=nearest(x/Math.max(rect.width,1));
    if(!point)return;
    vLine.style.left=(x/Math.max(rect.width,1)*100)+"%";
    hLine.style.top=(y/Math.max(rect.height,1)*100)+"%";
    const d=new Date(point.timestamp);
    const date=d.toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric"});
    const time=d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
    tooltip.innerHTML="<strong>"+formatPrice(point.price)+"</strong><span>"+date+" · "+time+"</span>";
    tooltip.style.left=Math.min(78,Math.max(2,x/Math.max(rect.width,1)*100+2))+"%";
    tooltip.style.top=Math.min(82,Math.max(4,y/Math.max(rect.height,1)*100-12))+"%";
    overlay.classList.add("visible");
  };
  const hide=()=>overlay.classList.remove("visible");
  svg.addEventListener("pointermove",show);
  svg.addEventListener("pointerleave",hide);
  svg.addEventListener("wheel",event=>{
    event.preventDefault();
    const factor=event.deltaY<0?1.12:.89;
    eliteChartZoom=Math.min(4,Math.max(1,eliteChartZoom*factor));
    applyEliteChartTransform();
  },{passive:false});
  svg.addEventListener("pointerdown",event=>{
    if(eliteChartZoom<=1)return;
    dragging=true;lastX=event.clientX;lastY=event.clientY;svg.setPointerCapture?.(event.pointerId);svg.style.cursor="grabbing";
  });
  svg.addEventListener("pointermove",event=>{
    if(!dragging)return;
    eliteChartPanX+=event.clientX-lastX;eliteChartPanY+=event.clientY-lastY;lastX=event.clientX;lastY=event.clientY;applyEliteChartTransform();
  });
  const stopDrag=()=>{dragging=false;applyEliteChartTransform()};
  svg.addEventListener("pointerup",stopDrag);svg.addEventListener("pointercancel",stopDrag);
  toolbar.querySelectorAll("button").forEach(button=>button.addEventListener("click",()=>{
    const tool=button.dataset.chartTool;
    if(tool==="crosshair"){
      crosshair=!crosshair;button.setAttribute("aria-pressed",String(crosshair));if(!crosshair)hide();
    }else if(tool==="zoom-in"){eliteChartZoom=Math.min(4,eliteChartZoom*1.25);applyEliteChartTransform();}
    else if(tool==="zoom-out"){eliteChartZoom=Math.max(1,eliteChartZoom/1.25);if(eliteChartZoom===1){eliteChartPanX=0;eliteChartPanY=0}applyEliteChartTransform();}
    else if(tool==="reset"){resetEliteChartTransform();}
  }));
  applyEliteChartTransform();
  if(!clean.length)return;
  const indicators=calculateIndicators(clean);
  const panel=document.createElement("div");
  panel.className="elite-chart-indicators";
  panel.innerHTML=`<span><b>Momentum</b> ${indicators.momentum==null?"—":(indicators.momentum>=0?"+":"")+indicators.momentum.toFixed(2).replace(".",",")+"%"}</span><span><b>RSI</b> ${indicators.rsi==null?"—":indicators.rsi.toFixed(0)}</span><span><b>Volatilité</b> ${indicators.volatility==null?"—":indicators.volatility.toFixed(2).replace(".",",")+"%"}</span><span><b>Repère</b> date/heure au survol</span>`;
  wrap.appendChild(panel);
}
function buildHistoryChart(points,symbol=historyState.symbol,range=historyState.range){
  if(!points?.length) return "<div class=\"history-empty\">Aucune donnée historique disponible.</div>";
  const clean=points.map(p=>({timestamp:Number(p.timestamp),price:Number(p.price)})).filter(p=>Number.isFinite(p.price)&&p.price>0);
  if(!clean.length) return "<div class=\"history-empty\">Aucune donnée historique disponible.</div>";
  // Densité élevée pour une lecture proche des plateformes de trading.
  const pointCounts={"5m":120,"1h":240,"24h":288,"7d":336,"30d":360,"1y":365,"5y":720};
  const chartRange=HISTORY_RANGES[range]?range:"24h";
  const targetCount=pointCounts[chartRange]||24;
  const sampled=clean.length>targetCount?Array.from({length:targetCount},(_,i)=>clean[Math.round(i*(clean.length-1)/Math.max(targetCount-1,1))]):clean;
  if(sampled.length<2) return "<div class=\"history-empty\">Historique insuffisant pour afficher une courbe fiable.</div>";
  const values=sampled.map(p=>p.price);
  const minValue=Math.min(...values),maxValue=Math.max(...values);
  const spread=Math.max(maxValue-minValue,0.0000001);
  const padding=spread*0.12;
  const axisMin=Math.max(0,minValue-padding),axisMax=maxValue+padding,valueRange=axisMax-axisMin||1;
  const width=900,height=340,left=92,right=18,top=20,bottom=38;
  const plotWidth=width-left-right,plotHeight=height-top-bottom;
  const coords=values.map((value,i)=>[left+(i/Math.max(values.length-1,1))*plotWidth,top+((axisMax-value)/valueRange)*plotHeight]);
  const line=coords.map(([x,y])=>x.toFixed(1)+","+y.toFixed(1)).join(" ");
  const area=line+" "+(width-right)+","+(height-bottom)+" "+left+","+(height-bottom);
  const rawLast=clean[clean.length-1],rawFirst=clean[0];
  const pct=rawFirst.price?((rawLast.price-rawFirst.price)/rawFirst.price)*100:0;
  const cls=pct>=0?"positive":"negative";
  const yTicks=Array.from({length:5},(_,i)=>axisMax-(valueRange*i/4));
  const axisFormat=(value)=>formatMoney(value,{maximumFractionDigits:Number(value)<1?2:0})
  const yGrid=yTicks.map((value,i)=>{
    const y=top+(plotHeight*i/4);
    return "<line x1=\""+left+"\" y1=\""+y.toFixed(1)+"\" x2=\""+(width-right)+"\" y2=\""+y.toFixed(1)+"\" stroke=\"currentColor\" opacity=\".10\"/><text x=\""+(left-10)+"\" y=\""+(y+4).toFixed(1)+"\" text-anchor=\"end\" fill=\"currentColor\" opacity=\".58\" font-size=\"12\">"+axisFormat(value)+"</text>";
  }).join("");
  const dateLabel=(timestamp)=>{const d=new Date(timestamp);if(chartRange==="5m"||chartRange==="1h"||chartRange==="24h")return d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});if(chartRange==="7d")return d.toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit"}).replace(".","");if(chartRange==="30d")return d.toLocaleDateString("fr-FR",{day:"2-digit",month:"short"}).replace(".","");return d.toLocaleDateString("fr-FR",{month:"short",year:"2-digit"}).replace(".","")};
  const first=sampled[0],last=sampled[sampled.length-1];
  const axisIndexes=[0,Math.round((sampled.length-1)*.25),Math.round((sampled.length-1)*.5),Math.round((sampled.length-1)*.75),sampled.length-1];
  const axisPoints=axisIndexes.map(index=>sampled[index]).filter((point,index,array)=>index===0||point.timestamp!==array[index-1].timestamp);
  const axisTicks=axisPoints.map(point=>{const index=sampled.indexOf(point);const x=left+(index/Math.max(sampled.length-1,1))*plotWidth;return {x,label:dateLabel(point.timestamp)}}); 
  const xGrid=axisTicks.map(tick=>"<line x1=\""+tick.x.toFixed(1)+"\" y1=\""+top+"\" x2=\""+tick.x.toFixed(1)+"\" y2=\""+(height-bottom)+"\" stroke=\"currentColor\" opacity=\".055\"/>").join("");
  const axisMarkup=axisTicks.map(tick=>"<span class=\"history-axis-tick\" style=\"--axis-position:"+((tick.x/width)*100).toFixed(2)+"%\"><i></i><b>"+tick.label+"</b></span>").join("");
  const formatVariation=(value)=>(value>=0?"+":"")+Number(value).toFixed(2).replace(".",",")+"%";
  return "<div class=\"history-chart-wrap\"><div class=\"chart-labels\"><span>Prix en euros</span><span>"+chartPeriodLabel(chartRange)+" · "+sampled.length+" points</span></div><svg class=\"history-chart\" viewBox=\"0 0 "+width+" "+height+"\" preserveAspectRatio=\"none\" role=\"img\" aria-label=\"Prix de "+symbol+" en euros sur "+chartPeriodLabel(chartRange)+"\"><defs><linearGradient id=\"chartFill\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0%\" stop-color=\"#b3ffca\" stop-opacity=\".24\"/><stop offset=\"100%\" stop-color=\"#b3ffca\" stop-opacity=\"0\"/></linearGradient></defs>"+yGrid+xGrid+"<polygon points=\""+area+"\" fill=\"url(#chartFill)\"/><polyline points=\""+line+"\" fill=\"none\" stroke=\"#b3ffca\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg><div class=\"history-axis\" aria-label=\"Échelle temporelle\">"+axisMarkup+"</div></div><div class=\"history-stats\"><div><span>Départ</span><strong>"+formatPrice(first.price)+"</strong></div><div><span>Dernier cours</span><strong>"+formatPrice(last.price)+"</strong></div><div><span>Variation</span><strong class=\""+cls+"\">"+formatVariation(pct)+"</strong></div><div><span>Min / Max</span><strong>"+formatPrice(minValue)+" / "+formatPrice(maxValue)+"</strong></div></div>";
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
  return `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-label="Courbe sur ${marketPreviewDays===1?"24 heures":marketPreviewDays+" jours"}"><defs><linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#b3ffca" stop-opacity=".20"/><stop offset="100%" stop-color="#b3ffca" stop-opacity="0"/></linearGradient></defs><polyline points="${line} ${width-pad},${height-pad} ${pad},${height-pad}" fill="url(#sparkFill)" stroke="none"/><polyline points="${line}" fill="none" stroke="#b3ffca" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
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
function formatCompactEuro(value){return formatCompactMoney(value)}
function setDetailText(id,value){const el=document.getElementById(id);if(el)el.textContent=value}
function syncCryptoDetailRefresh(){
  if(cryptoDetailRefreshTimer){clearInterval(cryptoDetailRefreshTimer);cryptoDetailRefreshTimer=null;}
  const modal=document.getElementById("cryptoDetailModal");
  if(!modal||modal.hidden||historyState.range!=="5m")return;
  cryptoDetailRefreshTimer=setInterval(()=>loadCryptoDetailRange("5m",{silent:true}),12000);
}
async function loadCryptoDetailRange(range,options={}){
  if(!historyState.symbol)return;
  const safeRange=HISTORY_RANGES[range]?range:"24h";
  const silent=Boolean(options.silent);
  historyState.range=safeRange;
  document.querySelectorAll(".crypto-detail-ranges button").forEach(b=>b.classList.toggle("active",b.dataset.range===safeRange));
  const chart=document.getElementById("cryptoDetailChart");
  if(chart&&!silent)chart.innerHTML="<div class=\"history-loading\">Chargement de "+HISTORY_RANGES[safeRange].label+"…</div>";
  try{
    const data=await apiFetch("/api/market/details/"+encodeURIComponent(historyState.symbol)+"?range="+encodeURIComponent(safeRange));
    const points=data.history?.points||[];
    historyState.points=points;
    setDetailText("detailPeriodLabel","Min / Max · "+HISTORY_RANGES[safeRange].label);
    setDetailText("detailPeriodMin",data.history?.min!=null?formatPrice(data.history.min):"—");
    setDetailText("detailPeriodMax",data.history?.max!=null?formatPrice(data.history.max):"—");
    if(chart){
      chart.innerHTML=points.length?buildHistoryChart(points,historyState.symbol,safeRange):"<div class=\"history-empty\">Historique indisponible.</div>";
      bindEliteChartTools();
    }
    syncCryptoDetailRefresh();
  }catch(e){if(chart&&!silent)chart.innerHTML='<div class="history-empty">'+e.message+"</div>";}
}
async function openCryptoDetail(symbol){
  const modal=document.getElementById("cryptoDetailModal"); if(!modal)return;
  historyState={symbol,range:"24h",points:[]}; document.body.classList.add("modal-open"); modal.hidden=false;
  setDetailText("cryptoDetailTitle",(marketNames[symbol]||symbol)+" ("+symbol+")");
  setDetailText("cryptoDetailRank","Chargement…"); setDetailText("cryptoDetailPrice","—"); setDetailText("cryptoDetailChange","—");
  setDetailText("detailCurrentPrice","—"); setDetailText("detail24h","—"); setDetailText("detailPeriodLabel","Min / Max · 24 h");
  setDetailText("detailPeriodMin","—"); setDetailText("detailPeriodMax","—"); setDetailText("detailMarketCap","—"); setDetailText("detailVolume","—");
  setDetailText("cryptoDetailSource","Chargement des données…");
  document.getElementById("cryptoDetailChart").innerHTML="<div class=\"history-loading\">Chargement des données…</div>";
  try{
    const data=await apiFetch("/api/market/details/"+encodeURIComponent(symbol)+"?range=24h");
    marketPrices[symbol]=Number(data.price)||marketPrices[symbol]; const price=formatPrice(data.price),change=Number(data.change24h||0);
    setDetailText("cryptoDetailPrice",price); const changeEl=document.getElementById("cryptoDetailChange");
    changeEl.textContent=(change>=0?"+":"")+change.toFixed(2).replace(".",",")+"% · 24h"; changeEl.className=change>=0?"positive":"negative";
    setDetailText("cryptoDetailRank",data.marketCapRank?"Classement #"+data.marketCapRank:"Classement indisponible");
    setDetailText("detailCurrentPrice",price); setDetailText("detail24h",(change>=0?"+":"")+change.toFixed(2).replace(".",",")+"%");
    setDetailText("detailPeriodMin",data.history?.min!=null?formatPrice(data.history.min):"—"); setDetailText("detailPeriodMax",data.history?.max!=null?formatPrice(data.history.max):"—");
    setDetailText("detailMarketCap",formatCompactMoney(data.marketCap)); setDetailText("detailVolume",formatCompactMoney(data.volume24h));
    document.getElementById("cryptoDetailChart").innerHTML=(data.history?.points||[]).length?buildHistoryChart(data.history.points,symbol,"24h"):"<div class=\"history-empty\">Historique indisponible.</div>";
    bindEliteChartTools();
    loadAssetAnalytics(symbol,data.history?.points||[],data).catch(e=>console.warn("Fiche actif:",e.message));
    setDetailText("cryptoDetailSource","Source : CoinGecko · données mises à jour automatiquement");
    document.getElementById("detailBuy").onclick=()=>{closeCryptoDetail();openTrade("buy",symbol)};
  }catch(e){document.getElementById("cryptoDetailChart").innerHTML='<div class="history-empty">'+e.message+"</div>";setDetailText("cryptoDetailSource","Données temporairement indisponibles");}
}
function correlationCoefficient(a,b){const n=Math.min(a.length,b.length);if(n<3)return null;const x=a.slice(0,n),y=b.slice(0,n),mx=x.reduce((s,v)=>s+v,0)/n,my=y.reduce((s,v)=>s+v,0)/n;let num=0,dx=0,dy=0;for(let i=0;i<n;i++){const vx=x[i]-mx,vy=y[i]-my;num+=vx*vy;dx+=vx*vx;dy+=vy*vy}return dx&&dy?num/Math.sqrt(dx*dy):null}
function maxDrawdown(points){if(!points.length)return null;let peak=points[0],worst=0;for(const p of points){peak=Math.max(peak,p);worst=Math.min(worst,(p-peak)/peak*100)}return Math.abs(worst)}
function annualizedVolatility(points){if(points.length<3)return null;const returns=[];for(let i=1;i<points.length;i++)if(points[i-1])returns.push((points[i]-points[i-1])/points[i-1]);if(returns.length<2)return null;const mean=returns.reduce((a,b)=>a+b,0)/returns.length;const variance=returns.reduce((a,b)=>a+(b-mean)**2,0)/(returns.length-1);return Math.sqrt(variance)*Math.sqrt(365)*100}
function renderAssetScenario(symbol,basePrice,returnPct){const el=document.getElementById("assetScenarioChart");if(!el)return;const seed=String(symbol).split("").reduce((s,c)=>s+c.charCodeAt(0),0);let level=100;const points=Array.from({length:31},(_,i)=>{if(i>0){const drift=(Number(returnPct)||0)/30;const noise=seededNoise(seed,i)*1.7;level=Math.max(55,level+drift+noise)}return level});const min=Math.min(...points),max=Math.max(...points),range=max-min||1;const line=points.map((v,i)=>{const x=4+(i/30)*92,y=92-((v-min)/range)*72;return x.toFixed(1)+","+y.toFixed(1)}).join(" ");const last=points[points.length-1];el.innerHTML='<svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Scénario synthétique sur 30 jours"><line x1="4" y1="92" x2="96" y2="92" stroke="currentColor" opacity=".12"/><line x1="4" y1="56" x2="96" y2="56" stroke="currentColor" opacity=".08"/><line x1="4" y1="20" x2="96" y2="20" stroke="currentColor" opacity=".08"/><polyline points="'+line+'" fill="none" stroke="currentColor" stroke-width="1.8" vector-effect="non-scaling-stroke"/></svg><div class="asset-scenario-axis"><span>J0</span><span>J15</span><span>J30 · '+last.toFixed(1)+'</span></div>';const label=document.getElementById("assetScenarioLabel");if(label)label.textContent="Base 100 · niveau final "+last.toFixed(1)}
async function loadAssetAnalytics(symbol,points,data){const status=document.getElementById("assetAnalyticsStatus");if(!status)return;try{const prices=points.map(p=>Number(p.price)).filter(Number.isFinite);if(prices.length<3)throw new Error("Historique insuffisant");let btc=[];if(symbol!=="BTC"){const btcData=await apiFetch("/api/market/details/BTC?range="+encodeURIComponent(historyState.range));btc=(btcData.history?.points||[]).map(p=>Number(p.price)).filter(Number.isFinite)}else btc=prices.slice();const returns=prices.slice(1).map((v,i)=>prices[i]?((v-prices[i])/prices[i]):0);const btcReturns=btc.slice(1).map((v,i)=>btc[i]?((v-btc[i])/btc[i]):0);const perf=prices[0]?((prices[prices.length-1]-prices[0])/prices[0])*100:0;const btcPerf=btc.length>1&&btc[0]?((btc[btc.length-1]-btc[0])/btc[0])*100:null;const corr=correlationCoefficient(returns,btcReturns);const vol=annualizedVolatility(prices);const dd=maxDrawdown(prices);const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};const pct=v=>v==null||!Number.isFinite(v)?"—":(v>=0?"+":"")+v.toFixed(2).replace(".",",")+" %";set("assetMetricReturn",pct(perf));set("assetMetricVsBtc",btcPerf==null?"—":pct(perf-btcPerf));set("assetMetricVolatility",vol==null?"—":vol.toFixed(2).replace(".",",")+" %");set("assetMetricDrawdown",dd==null?"—":"−"+dd.toFixed(2).replace(".",",")+" %");set("assetMetricCorrelation",corr==null?"—":corr.toFixed(2).replace(".",","));set("assetMetricRank",data?.marketCapRank?"#"+data.marketCapRank:"—");const total=Number(state.cash||0)+Object.entries(state.holdings||{}).reduce((sum,[sym,qty])=>sum+(Number(qty)||0)*(Number(marketPrices[sym])||0),0);const positionValue=(Number(state.holdings?.[symbol])||0)*(Number(marketPrices[symbol])||0);const exposure=total>0?positionValue/total*100:0;set("assetMetricExposure",exposure.toFixed(2).replace(".",",")+" %");set("assetMetricConcentration",exposure.toFixed(2).replace(".",",")+" %");renderAssetScenario(symbol,Number(data?.price)||prices[prices.length-1],perf);status.textContent=historyState.range+" · historique marché · simulation pédagogique";}catch(e){status.textContent=e.message||"Analyse indisponible";}}
function closeCryptoDetail(){if(cryptoDetailRefreshTimer){clearInterval(cryptoDetailRefreshTimer);cryptoDetailRefreshTimer=null;}const modal=document.getElementById("cryptoDetailModal");if(modal)modal.hidden=true;document.body.classList.remove("modal-open")}
function cockpitFocusValue(){return safeStorageGet("bitgold-cockpit-focus")||"performance"}
function cockpitVisibilityValue(){try{const raw=safeStorageGet("bitgold-cockpit-visibility");const parsed=raw?JSON.parse(raw):null;return parsed&&typeof parsed==="object"?{performance:parsed.performance!==false,risk:parsed.risk!==false,bots:parsed.bots!==false}:{performance:true,risk:true,bots:true}}catch{return{performance:true,risk:true,bots:true}}}
function applyCockpitVisibility(visibility,save=true){
  const value={performance:visibility?.performance!==false,risk:visibility?.risk!==false,bots:visibility?.bots!==false};
  const groups={performance:[".performance-panel",".performance-history-panel"],risk:[".risk-panel"],bots:[".autopilot-panel",".decision-panel",".bot-stats-panel"]};
  Object.entries(groups).forEach(([key,selectors])=>selectors.forEach(selector=>document.querySelectorAll(selector).forEach(el=>el.classList.toggle("cockpit-module-hidden",!value[key]))));
  document.querySelectorAll("[data-cockpit-visibility]").forEach(btn=>{const key=btn.dataset.cockpitVisibility;btn.classList.toggle("active",!!value[key]);btn.setAttribute("aria-pressed",String(!!value[key]))});
  if(save)safeStorageSet("bitgold-cockpit-visibility",JSON.stringify(value));
  return value;
}
function applyCockpitFocus(focus,save=true){
  const value=["performance","risk","bots"].includes(focus)?focus:"performance";
  const grid=document.querySelector(".dashboard-pro-grid");
  if(grid){grid.dataset.cockpitFocus=value;grid.classList.remove("focus-performance","focus-risk","focus-bots");grid.classList.add("focus-"+value)}
  document.querySelectorAll("[data-cockpit-focus]").forEach(btn=>btn.classList.toggle("active",btn.dataset.cockpitFocus===value));
  if(save)safeStorageSet("bitgold-cockpit-focus",value);
  return value;
}
function initCockpitPersonalization(connected=false){
  applyCockpitFocus(cockpitFocusValue(),false);
  applyCockpitVisibility(cockpitVisibilityValue(),false);
  const modal=document.getElementById("cockpitOnboarding");
  if(!modal)return;
  if(!modal.dataset.initialized){
    modal.dataset.initialized="true";
    let selected=cockpitFocusValue();
    document.querySelectorAll("[data-cockpit-focus]").forEach(btn=>btn.addEventListener("click",()=>applyCockpitFocus(btn.dataset.cockpitFocus)));
    document.querySelectorAll("[data-cockpit-visibility]").forEach(btn=>btn.addEventListener("click",()=>{const current=cockpitVisibilityValue(),key=btn.dataset.cockpitVisibility;current[key]=!current[key];if(!current.performance&&!current.risk&&!current.bots)current[key]=true;applyCockpitVisibility(current)}));
    document.querySelectorAll("[data-cockpit-choice]").forEach(btn=>btn.addEventListener("click",()=>{selected=btn.dataset.cockpitChoice;document.querySelectorAll("[data-cockpit-choice]").forEach(item=>item.classList.toggle("active",item===btn))}));
    const hide=()=>{modal.hidden=true;document.body.classList.remove("modal-open")};
    document.getElementById("cockpitOnboardingClose")?.addEventListener("click",hide);
    document.getElementById("cockpitOnboardingLater")?.addEventListener("click",()=>{safeStorageSet("bitgold-cockpit-onboarding","seen");hide()});
    document.getElementById("cockpitOnboardingSave")?.addEventListener("click",()=>{applyCockpitFocus(selected);safeStorageSet("bitgold-cockpit-onboarding","seen");hide();const dash=document.getElementById("dashboard");if(dash&&!dash.hidden)dash.scrollIntoView({behavior:"smooth",block:"start"})});
  }
  if(connected&&!safeStorageGet("bitgold-cockpit-onboarding")){modal.hidden=false;document.body.classList.add("modal-open")}
}
function setConnected(connected){removeHomepageActivity();document.getElementById("authState").textContent=connected?"● Connecté":"● Mode visiteur";const accountStatus=document.getElementById("accountStatus");if(accountStatus)accountStatus.textContent=connected?"Compte connecté":"Compte démo";document.body.classList.toggle("is-authenticated",connected);document.body.classList.toggle("is-visitor",!connected);document.querySelectorAll(".auth-only:not(#activite)").forEach(el=>{el.hidden=!connected;el.setAttribute("aria-hidden",String(!connected))});document.querySelectorAll(".visitor-only").forEach(el=>{el.hidden=connected;el.setAttribute("aria-hidden",String(connected))});if(connected&&document.body.classList.contains("bot-detail-mode")){const match=window.location.pathname.match(/^\/bot\/([^/]+)/);if(match)renderBotDetail(match[1]).catch(e=>console.warn("Bot detail auth refresh:",e.message))}const activityPage=document.getElementById("activite");if(activityPage && window.location.pathname!=="/activite")activityPage.hidden=true;const topLogin=document.getElementById("topLogin");if(topLogin){topLogin.classList.toggle("is-connected",connected);topLogin.setAttribute("aria-label",connected?"Ouvrir mon profil":"Se connecter");topLogin.setAttribute("title",connected?"Mon profil":"Se connecter")}initCockpitPersonalization(connected);loadBots().catch(e=>console.warn("Bots:",e.message))}
function logout(){apiToken="";safeStorageRemove("bitgold-token");botState={catalog:[],items:[],activity:[]};state={cash:10000,holdings:{BTC:0,ETH:0,SOL:0,USDC:0,LINK:0,AVAX:0}};setConnected(false);renderWallet();loadBots();loadNews();window.scrollTo({top:0,behavior:"smooth"})}
function coinIcon(symbol){const icons={BTC:"btc",ETH:"eth",SOL:"sol",USDC:"usdc",LINK:"link",AVAX:"avax"};const icon=icons[symbol];return `<span class="coin-icon coin-${symbol.toLowerCase()}" aria-hidden="true">${icon?`<img src="/icons/${icon}.svg" alt="" loading="eager" decoding="async"><span class="coin-fallback">${symbol.slice(0,1)}</span>`:`<span class="coin-fallback">${symbol.slice(0,1)}</span>`}</span>`}
function removeHomepageActivity(){document.querySelectorAll(".bot-activity").forEach(el=>el.remove())}
function renderWallet(){const cash=document.getElementById("cashBalance"),holdings=document.getElementById("holdings"),totalEl=document.getElementById("portfolioTotal"),countEl=document.getElementById("holdingsCount");const cashValue=Number(state.cash)||0;if(cash)cash.textContent=cashValue.toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})+" €";const assets=["BTC","ETH","SOL","USDC","LINK","AVAX"].map(symbol=>{const quantity=Number(state.holdings[symbol]||0);const price=Number(marketPrices[symbol]||0);return{symbol,quantity,price,value:quantity*price}}).sort((a,b)=>b.value-a.value);const invested=assets.reduce((sum,item)=>sum+item.value,0),total=cashValue+invested;if(totalEl)totalEl.textContent=total.toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})+" €";const active=assets.filter(item=>item.quantity>0);if(countEl)countEl.textContent=active.length+" actif"+(active.length>1?"s":"");if(holdings)holdings.innerHTML=assets.map(item=>{const allocation=total?item.value/total*100:0;const quantityText=item.quantity?item.quantity.toLocaleString("fr-FR",{minimumFractionDigits:0,maximumFractionDigits:8}):"0";return `<article class="portfolio-asset ${item.quantity?"":"is-empty"}"><div class="portfolio-asset-identity">${coinIcon(item.symbol)}<div><strong>${marketNames[item.symbol]}</strong><span>${item.symbol} · ${formatPrice(item.price)}</span></div></div><div class="portfolio-asset-quantity"><strong>${quantityText}</strong><span>unités</span></div><div class="portfolio-asset-value"><strong>${item.value.toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})} €</strong><span>${allocation.toFixed(1).replace(".",",")}% du portefeuille</span></div></article>`}).join("")}
async function apiFetch(path,options={}){const headers={...(options.headers||{})};if(!headers["Content-Type"]&&options.body)headers["Content-Type"]="application/json";if(apiToken)headers.Authorization=`Bearer ${apiToken}`;let r;try{r=await fetch(API+path,{...options,headers})}catch(e){throw Error("Impossible de joindre l'API. Vérifiez que le service Northflank est démarré et que /api/health répond.")}let data={};try{data=await r.json()}catch{}if(!r.ok){if(r.status===401 && apiToken && !/^\/api\/auth\//.test(path)){apiToken="";safeStorageRemove("bitgold-token");setConnected(false);renderWallet();throw Error("Votre session a expiré. Reconnectez-vous pour continuer.")}throw Error(data.error||`Erreur API (${r.status})`)}return data}
function formatEuro(value){return formatMoney(value)}
function renderDashboardAnalytics(data){
  const points=data?.performance?.points||[];
  const chart=document.getElementById("dashPerformanceChart");
  if(chart){
    if(!points.length){chart.innerHTML='<div class="empty-state">Pas encore assez d’opérations pour tracer une courbe.</div>'}
    else{
      const values=points.map(p=>Number(p.total)||0),min=Math.min(...values),max=Math.max(...values),spread=Math.max(max-min,1),w=760,h=210,pad=18;
      const coords=values.map((v,i)=>[pad+(i/Math.max(values.length-1,1))*(w-pad*2),h-pad-((v-min)/spread)*(h-pad*2)]);
      const line=coords.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ");
      const area=line+" "+(w-pad)+","+(h-pad)+" "+pad+","+(h-pad);
      chart.innerHTML='<div class="dashboard-chart-wrap"><svg viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" aria-label="Évolution simulée du portefeuille"><defs><linearGradient id="dashFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#b3ffca" stop-opacity=".20"/><stop offset="100%" stop-color="#b3ffca" stop-opacity="0"/></linearGradient></defs><polygon points="'+area+'" fill="url(#dashFill)"/><polyline points="'+line+'" fill="none" stroke="#b3ffca" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg><div class="dashboard-chart-axis"><span>'+escapeHtml(points[0].date)+'</span><strong>'+formatEuro(values[values.length-1])+'</strong><span>'+escapeHtml(points[points.length-1].date)+'</span></div></div>';
    }
  }
  const list=document.getElementById("dashBotStats");
  if(list){
    const names={"shield":"Shield","silver":"Silver","gold":"Gold","adaptive-ai":"Adaptive AI","quant-pulse":"Quant Pulse","macro-rotation":"Macro Rotation"};
    const bots=data?.bots||[];
    list.innerHTML=bots.length?bots.map(bot=>'<div class="bot-stat-row"><div><strong>'+escapeHtml(names[bot.bot_type]||bot.bot_type)+'</strong><span>'+((bot.active?'Actif':'Inactif'))+' · '+Number(bot.signals||0)+' signaux</span></div><div><b>'+Number(bot.buys||0)+'</b><small>achats</small></div><div><b>'+Number(bot.sells||0)+'</b><small>ventes</small></div><div><b>'+Number(bot.holds||0)+'</b><small>holds</small></div></div>').join(""):'<div class="empty-state">Aucun bot configuré.</div>';
  }
}
function renderDashboard(data){
  const p=data?.portfolio||{}, perf=data?.performance||{}, risk=data?.risk||{}, auto=data?.autopilot||{}, market=data?.market||{};
  const total=document.getElementById("dashTotal"), ret=document.getElementById("dashReturn"), perfEl=document.getElementById("dashPerformance"), riskEl=document.getElementById("dashRisk"), botsEl=document.getElementById("dashBots");
  if(total)total.textContent=formatEuro(p.total);
  if(ret)ret.textContent=(Number(p.returnPct)>=0?"+":"")+Number(p.returnPct||0).toFixed(2).replace(".",",")+" % depuis le début";
  if(perfEl)perfEl.textContent=(Number(perf.returnPct)>=0?"+":"")+Number(perf.returnPct||0).toFixed(2).replace(".",",")+" %";
  if(riskEl)riskEl.textContent=risk.label||"—";
  if(botsEl)botsEl.textContent=Number(data?.bots?.active||0)+" / "+Number(data?.bots?.total||0);
  const returnEur=document.getElementById("dashReturnEur");if(returnEur)returnEur.textContent=(Number(perf.returnEur)>=0?"+":"")+formatEuro(perf.returnEur);
  const initial=document.getElementById("dashInitial");if(initial)initial.textContent=formatEuro(p.initialCapital||10000);
  const cash=document.getElementById("dashCash");if(cash)cash.textContent=formatEuro(p.cash);
  const trades=document.getElementById("dashTrades");if(trades)trades.textContent=String(perf.trades||0);
  const bar=document.getElementById("dashPerformanceBar");if(bar)bar.style.width=Math.max(3,Math.min(100,50+Number(perf.returnPct||0)*4))+"%";
  const riskScore=document.getElementById("dashRiskScore");if(riskScore)riskScore.textContent=Number(risk.score||0)+"/100";
  const riskMeter=document.getElementById("dashRiskMeter");if(riskMeter)riskMeter.style.width=Math.max(3,Number(risk.score||0))+"%";
  const riskText=document.getElementById("dashRiskText");if(riskText)riskText.textContent=risk.label==="Élevé"?"Exposition élevée : surveillez la concentration et gardez une réserve de liquidités.":risk.label==="Modéré"?"Exposition modérée : la structure reste surveillable, mais la concentration mérite attention.":"Exposition maîtrisée : la liquidité et la diversification restent dans une zone prudente.";
  const concentration=document.getElementById("dashConcentration");if(concentration)concentration.textContent=Number(risk.concentration||0).toFixed(1).replace(".",",")+" %";
  const cashPct=document.getElementById("dashCashPct");if(cashPct)cashPct.textContent=Number(risk.cashPct||0).toFixed(1).replace(".",",")+" %";
  const riskMeta=document.getElementById("dashRiskMeta");if(riskMeta)riskMeta.textContent="Score "+Number(risk.score||0)+"/100";
  const advancedStressButtons=document.querySelectorAll("[data-advanced-stress]");
function renderAdvancedStress(shock){
  const positions=(p.positions||[]).filter(row=>Number(row.value||0)>0);
  const riskyValue=positions.reduce((sum,row)=>sum+Number(row.value||0),0);
  const total=Number(p.total||0);
  const cashValue=Math.max(0,total-riskyValue);
  const shockPct=Number(shock)||0;
  const loss=Math.abs(riskyValue*(shockPct/100));
  const stressedValue=Math.max(0,total-loss);
  const exposure=stressedValue>0?Math.max(0,(riskyValue*(1+shockPct/100))/stressedValue*100):0;
  const baseRisk=Number(p.riskScore||0);
  const postRisk=Math.min(100,Math.max(0,baseRisk+Math.abs(shockPct)*0.55));
  const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value};
  set("dashStressAdvancedShock",(shockPct>0?"+":"")+shockPct.toFixed(0)+" %");
  set("dashStressAdvancedLoss",formatMoney(-loss));
  set("dashStressAdvancedValue",formatMoney(stressedValue));
  set("dashStressAdvancedCash",formatMoney(cashValue));
  set("dashStressAdvancedExposure",exposure.toFixed(1).replace(".",",")+" %");
  set("dashStressAdvancedRisk",Math.round(postRisk)+"/100");
  const status=document.getElementById("dashStressAdvancedStatus");
  if(status)status.textContent="Choc "+Math.abs(shockPct).toFixed(0)+" % · simulation";
}
advancedStressButtons.forEach(button=>button.addEventListener("click",()=>{
  advancedStressButtons.forEach(item=>item.classList.remove("active"));
  button.classList.add("active");
  renderAdvancedStress(Number(button.dataset.advancedStress));
}));
const stressButtons=document.querySelectorAll("[data-stress]");
  const stressRender=(shock)=>{const positions=(p.positions||[]).filter(row=>Number(row.value||0)>0);const riskyValue=positions.reduce((sum,row)=>sum+Number(row.value||0),0);const cashValue=Math.max(0,Number(p.total||0)-riskyValue);const shockPct=Number(shock)||0;const impact=riskyValue*(shockPct/100);const stressedTotal=Math.max(0,Number(p.total||0)+impact);const impactPct=Number(p.total||0)>0?(impact/Number(p.total||0))*100:0;const currentReturn=Number(perf.returnPct||0);const drawdown=Math.min(0,currentReturn+impactPct);const impactEl=document.getElementById("dashStressImpact"),valueEl=document.getElementById("dashStressValue"),ddEl=document.getElementById("dashStressDrawdown");if(impactEl)impactEl.textContent=(impact>=0?"+":"")+formatEuro(impact);if(valueEl)valueEl.textContent=formatEuro(stressedTotal);if(ddEl)ddEl.textContent=drawdown.toLocaleString("fr-FR",{minimumFractionDigits:1,maximumFractionDigits:1})+" %";const status=document.getElementById("dashStressStatus");if(status)status.textContent=Math.abs(shockPct)+" % choc · simulé";};
  stressButtons.forEach(button=>button.addEventListener("click",()=>{stressButtons.forEach(item=>item.classList.remove("active"));button.classList.add("active");stressRender(button.dataset.stress)}));
  stressRender(document.querySelector("[data-stress].active")?.dataset.stress||"-10");
  const updated=document.getElementById("dashboardUpdated");if(updated){const ledger=state.portfolio?.integrity;const integrity=ledger?.ok===false||ledger?.reconciliation?.ok===false?"Anomalie de portefeuille — vérifier les opérations":"Portefeuille simulé · suivi actif";updated.textContent="Mis à jour à "+new Date(data.updatedAt||Date.now()).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})+" · "+integrity;updated.setAttribute("role",ledger?.ok===false||ledger?.reconciliation?.ok===false?"alert":"status")}
  const regime=document.getElementById("dashRegime");if(regime)regime.textContent=market.regime||"Neutre";
  const subscription=data?.subscription||{};const planKey=subscription.plan==="elite"?"elite":subscription.plan==="pro"?"pro":"free";const transferFees=data?.transferFees||null;const planLabels={free:"BitGold Free",pro:"BitGold Pro",elite:"BitGold Elite"};const planLimits={free:1,pro:3,elite:5};const planName=document.getElementById("dashPlanName");if(planName)planName.textContent=subscription.label||planLabels[planKey];const planBadge=document.getElementById("dashPlanBadge");if(planBadge)planBadge.textContent=planKey.toUpperCase();const planMeta=document.getElementById("dashPlanMeta");if(planMeta)planMeta.textContent=Number(subscription.botLimit||planLimits[planKey])+" bot"+(Number(subscription.botLimit||planLimits[planKey])>1?"s":"")+" actif"+(Number(subscription.botLimit||planLimits[planKey])>1?"s":"")+" maximum";const planReminder=document.getElementById("dashPlanReminder");if(planReminder)planReminder.textContent=planKey==="elite"?"Vous êtes sur le niveau Elite : toutes les stratégies et jusqu’à 5 bots sont disponibles.":planKey==="pro"?"Vous êtes sur le niveau Pro : jusqu’à 3 bots, IA Adaptive et Quant Pulse sont disponibles.":"Vous êtes sur le niveau Free : Shield est inclus et 1 bot actif est autorisé.";const portal=document.getElementById("stripePortalButton");if(portal){portal.hidden=planKey==="free";portal.textContent=planKey==="elite"?"Gérer mon abonnement Elite":"Gérer mon abonnement Pro";}const feePlan=document.getElementById("dashFeePlan"),cashinFee=document.getElementById("dashCashinFee"),cashinFixed=document.getElementById("dashCashinFixed"),cashoutFee=document.getElementById("dashCashoutFee"),cashoutFixed=document.getElementById("dashCashoutFixed"),transferLimit=document.getElementById("dashTransferLimit");
  if(feePlan)feePlan.textContent=planKey.toUpperCase();
  const formatFeeRate=value=>(Number(value||0)*100).toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})+" %";
  const formatFixedFee=value=>"+"+formatEuro(value);
  if(cashinFee)cashinFee.textContent=transferFees?formatFeeRate(transferFees.cashin?.rate):"—";
  if(cashinFixed)cashinFixed.textContent=transferFees?formatFixedFee(transferFees.cashin?.fixed):"—";
  if(cashoutFee)cashoutFee.textContent=transferFees?formatFeeRate(transferFees.cashout?.rate):"—";
  if(cashoutFixed)cashoutFixed.textContent=transferFees?formatFixedFee(transferFees.cashout?.fixed):"—";
  if(transferLimit)transferLimit.textContent=transferFees?formatEuro(transferFees.dailyLimit):"—";
  const held=document.getElementById("dashHeldAssets");const heldCount=document.getElementById("dashHeldCount");const heldRows=(p.positions||[]).filter(row=>Number(row.quantity||0)>0);if(heldCount)heldCount.textContent=heldRows.length+" actif"+(heldRows.length>1?"s":"");if(held)held.innerHTML=heldRows.length?heldRows.map(row=>"<div class=\"held-asset-row\"><div class=\"held-asset-name\"><strong>"+escapeHtml(marketNames[row.asset]||row.asset)+"</strong><span>"+escapeHtml(row.asset)+" · "+Number(row.quantity||0).toLocaleString("fr-FR",{maximumFractionDigits:8})+"</span></div><div class=\"held-asset-price\"><strong>"+formatEuro(row.value)+"</strong><span>"+Number(row.price||0).toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:4})+" € · "+Number(row.allocation||0).toFixed(1).replace(".",",")+"%</span></div></div>").join(""):"<div class=\"empty-state\">Aucun actif détenu pour le moment.</div>";
  const allocations=document.getElementById("dashAllocations");
  if(allocations){
    const rows=p.positions||[];
    allocations.innerHTML=rows.length?rows.slice(0,5).map(row=>`<div class="allocation-row"><strong>${escapeHtml(row.asset)}</strong><div class="allocation-track"><span style="width:${Math.min(100,Number(row.allocation||0))}%"></span></div><em>${Number(row.allocation||0).toFixed(1).replace(".",",")}%</em></div>`).join(""):'<div class="empty-state">Aucun actif détenu pour le moment.</div>';
  }
  const decisionRows=data.activity||[], latestDecision=decisionRows[0];
  const decisionEmpty=document.getElementById("dashDecisionEmpty"),decisionBody=document.getElementById("dashDecisionBody");
  if(latestDecision){
    if(decisionEmpty)decisionEmpty.hidden=true;
    if(decisionBody)decisionBody.hidden=false;
    const dBot=document.getElementById("dashDecisionBot"),dAction=document.getElementById("dashDecisionAction"),dAsset=document.getElementById("dashDecisionAsset"),dSignal=document.getElementById("dashDecisionSignal"),dConfidence=document.getElementById("dashDecisionConfidence"),dRegime=document.getElementById("dashDecisionRegime"),dTime=document.getElementById("dashDecisionTime"),dReason=document.getElementById("dashDecisionReason"),dWhyTitle=document.getElementById("dashDecisionWhyTitle"),dSignals=document.getElementById("dashDecisionSignals");
    const decision=data.latestDecision||latestDecision||null;
    if(dBot)dBot.textContent=({"shield":"Shield","silver":"Silver","gold":"Gold","adaptive-ai":"Adaptive AI","quant-pulse":"Quant Pulse","macro-rotation":"Macro Rotation"})[decision.bot_type]||decision.bot_type||"Bot";
    if(dAction)dAction.textContent=(decision.action||"Signal").toUpperCase();
    if(dAsset)dAsset.textContent=decision.asset||"—";
    if(dSignal)dSignal.textContent=decision.message||decision.reason||"Signal enregistré";
    if(dConfidence)dConfidence.textContent=Math.round(Number(decision.confidence||0)*100)+" %";
    if(dRegime)dRegime.textContent=decision.regime||"—";
    if(dTime)dTime.textContent=formatNewsAge(decision.created_at);
    if(dReason)dReason.textContent=decision.reason||decision.message||"Décision enregistrée dans le journal simulé.";
    if(dWhyTitle)dWhyTitle.textContent=(decision.action||"hold")==="hold"?"Pourquoi le moteur attend":"Pourquoi le moteur agit";
    const features=decision.features?.features||decision.features||{};
    const signalItems=[
      ["Momentum",features.momentum!=null?Number(features.momentum).toFixed(2).replace(".",",")+" %":null],
      ["RSI",features.rsi!=null?Number(features.rsi).toFixed(0):null],
      ["Volatilité",features.volatility!=null?Number(features.volatility).toFixed(2).replace(".",",")+" %":null],
      ["Position dans la range",features.rangePosition!=null?Number(features.rangePosition).toFixed(0)+" %":null],
      ["Sentiment",decision.sentiment?.bias||null],
      ["Risque portefeuille",decision.portfolioRisk?.score!=null?Number(decision.portfolioRisk.score).toFixed(0)+"/100":null]
    ].filter(([,value])=>value!=null);
    if(dSignals)dSignals.innerHTML=signalItems.length?signalItems.map(([label,value])=>"<span><b>"+escapeHtml(label)+"</b><em>"+escapeHtml(String(value))+"</em></span>").join(""):"<span><b>Signaux</b><em>Voir le détail du moteur</em></span>";
  }else{
    if(decisionEmpty)decisionEmpty.hidden=false;
    if(decisionBody)decisionBody.hidden=true;
  }
  const status=document.getElementById("autopilotStatus");if(status)status.textContent=auto.status||"—";
  const title=document.getElementById("autopilotTitle");if(title)title.textContent=auto.title||"Analyse du marché";
  const reason=document.getElementById("autopilotReason");if(reason)reason.textContent=auto.reason||"Aucune recommandation disponible.";
  const botNames={"shield":"Shield","silver":"Silver","gold":"Gold","adaptive-ai":"Adaptive AI","quant-pulse":"Quant Pulse","macro-rotation":"Macro Rotation"};
  const bot=document.getElementById("autopilotBot");if(bot)bot.textContent=botNames[auto.bot]||auto.bot||"—";
  const alloc=document.getElementById("autopilotAllocation");if(alloc)alloc.textContent=Number(auto.allocation||0).toFixed(0)+" %";
  const action=document.getElementById("autopilotAction");if(action){action.onclick=()=>auto.bot&&openBotDetail(auto.bot)}
  const activity=document.getElementById("dashActivity");
  if(activity){
    const rows=data.activity||[];
    activity.innerHTML=rows.length?rows.slice(0,6).map(row=>`<div class="dashboard-activity-row"><span class="bot">${escapeHtml(botNames[row.bot_type]||row.bot_type||"Bot")}</span><span class="action">${escapeHtml(row.action||"signal")}</span><span class="message">${escapeHtml(row.message||row.asset||"Signal enregistré")}</span><time>${escapeHtml(formatNewsAge(row.created_at))}</time></div>`).join(""):'<div class="empty-state">Aucun signal récent.</div>';
  }
}
async function simulateTransferFee(){
  const result=document.getElementById("transferFeeResult"),type=document.getElementById("transferFeeType")?.value||"cashin",amount=Number(document.getElementById("transferFeeAmount")?.value||0);
  if(!result)return;
  if(!apiToken){result.textContent="Connectez-vous pour calculer les frais de votre formule.";return}
  if(!Number.isFinite(amount)||amount<=0){result.textContent="Entrez un montant valide.";return}
  result.textContent="Calcul des frais…";
  try{
    const data=await apiFetch("/api/transfers/quote",{method:"POST",body:JSON.stringify({type,amount})});
    const q=data.quote;
    result.textContent=(type==="cashin"?"Cash-in":"Cash-out")+" de "+formatEuro(q.amount)+" → frais "+formatEuro(q.fee)+" · net "+formatEuro(q.net)+" · "+formatFeePercent(q.rate)+" + "+formatEuro(q.fixed);
  }catch(e){result.textContent=e.message||"Impossible de calculer les frais."}
}
function formatFeePercent(value){return (Number(value||0)*100).toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})+" %"}
async function loadDashboard(){if(!apiToken)return;const chart=document.getElementById("dashPerformanceChart");if(chart)chart.setAttribute("aria-busy","true");try{const [data,analytics]=await Promise.all([apiFetch("/api/dashboard"),apiFetch("/api/dashboard/analytics")]);renderDashboard(data);renderDashboardAnalytics(analytics)}catch(e){console.warn("Dashboard:",e.message);if(chart){const message=document.createElement("div");message.className="empty-state";message.setAttribute("role","alert");message.textContent=e.message||"Impossible de charger le tableau de bord.";const retry=document.createElement("button");retry.type="button";retry.textContent="Réessayer";retry.addEventListener("click",()=>loadDashboard());message.append(" ",retry);chart.replaceChildren(message)}}finally{if(chart)chart.removeAttribute("aria-busy")}}
async function loadPortfolio(){if(!apiToken){setConnected(false);renderWallet();return}try{const data=await apiFetch("/api/portfolio");state.cash=Number(data.cash||0);state.holdings={BTC:0,ETH:0,SOL:0,USDC:0,LINK:0,AVAX:0};for(const row of data.holdings||[]){if(row.asset in state.holdings)state.holdings[row.asset]=Number(row.quantity||0);if(Number(row.price)>0)marketPrices[row.asset]=Number(row.price)}state.portfolio={invested:Number(data.invested||0),total:Number(data.total||0),integrity:data.integrity||null,updatedAt:data.updatedAt||Date.now()};renderWallet();setConnected(true);await loadDashboard()}catch(e){if(/authentifié|401/i.test(e.message)){apiToken="";safeStorageRemove("bitgold-token");setConnected(false);renderWallet()}throw e}}
function simulate(){const amount=Number(document.getElementById("amount").value||0);const asset=document.getElementById("asset").value;const rates={"Bitcoin (BTC)":1.2842,"Ethereum (ETH)":1.192,"Solana (SOL)":1.431};const gain=amount*(rates[asset]-1);document.getElementById("result").textContent=`Simulation : ${amount.toLocaleString("fr-FR")} € en ${asset} → estimation théorique ${(amount+gain).toLocaleString("fr-FR",{maximumFractionDigits:2})} €. Gain/perte : ${gain.toLocaleString("fr-FR",{maximumFractionDigits:2})} €.`}
function openTrade(side,asset="BTC"){tradeSide=side;document.getElementById("tradeTitle").textContent=side==="buy"?"Acheter des cryptos":"Vendre des cryptos";document.getElementById("tradeAsset").value=asset;document.getElementById("tradeAmount").value=100;document.getElementById("tradeResult").textContent=apiToken?"":"Connectez-vous pour effectuer une opération démo.";document.getElementById("tradeModal").hidden=false;document.body.classList.add("modal-open")}
function closeTrade(){document.getElementById("tradeModal").hidden=true;document.body.classList.remove("modal-open")}
async function executeTrade(){const result=document.getElementById("tradeResult");const asset=document.getElementById("tradeAsset").value;const amount=Number(document.getElementById("tradeAmount").value||0);if(!apiToken){result.textContent="Connectez-vous pour effectuer une opération démo.";return}if(amount<=0){result.textContent="Montant invalide.";return}result.textContent="Traitement…";try{await apiFetch("/api/trades",{method:"POST",body:JSON.stringify({side:tradeSide,asset,amount})});await loadPortfolio();result.textContent=`Opération démo effectuée : ${tradeSide==="buy"?"achat":"vente"} de ${(amount/(marketPrices[asset]||1)).toFixed(6)} ${asset} pour ${amount.toFixed(2)} €.`}catch(e){result.textContent=e.message}}
function setAuthFormMode(mode){
  const signup=mode==="signup";
  const fields=document.getElementById("signupFields");
  if(fields)fields.hidden=!signup;
  const password=document.getElementById("authPassword");
  if(password)password.autocomplete=signup?"new-password":"current-password";
  const submit=document.getElementById("authSubmit");
  if(submit)submit.textContent=signup?"Créer mon compte":"Se connecter";
  const title=document.getElementById("modalTitle");
  if(title)title.textContent=signup?"Créer un compte BitGold":"Connexion BitGold";
  const note=document.querySelector("#modal .modal-note");
  if(note)note.textContent=signup?"Complétez votre profil pour personnaliser votre espace BitGold.":"Connectez-vous avec votre email ou votre compte Google.";
  const switchButton=document.getElementById("authSwitch");
  if(switchButton)switchButton.textContent=signup?"J'ai déjà un compte":"Créer un compte";
}
function collectSignupProfile(){
  const currency=document.getElementById("authCurrency")?.value||currencyForCountry(document.getElementById("authCountry")?.value)||"EUR";
  setCurrencyPreference(currency);
  return {
    first_name:document.getElementById("authFirstName")?.value||"",
    last_name:document.getElementById("authLastName")?.value||"",
    phone:document.getElementById("authPhone")?.value||"",
    birth_date:document.getElementById("authBirthDate")?.value||"",
    country:document.getElementById("authCountry")?.value||"",
    city:document.getElementById("authCity")?.value||"",
    postal_code:document.getElementById("authPostalCode")?.value||"",
    address:document.getElementById("authAddress")?.value||"",
    preferred_currency:currency,
    risk_profile:document.getElementById("authRisk")?.value||"moderate"
  };
}
function fillProfileForm(profile){
  const map={profileFirstName:"first_name",profileLastName:"last_name",profileEmail:"email",profilePhone:"phone",profileBirthDate:"birth_date",profileCountry:"country",profileCity:"city",profilePostalCode:"postal_code",profileAddress:"address",profileCurrency:"preferred_currency",profileRisk:"risk_profile"};
  Object.entries(map).forEach(([id,key])=>{const el=document.getElementById(id);if(el)el.value=profile?.[key]||""});
  const currency=document.getElementById("profileCurrency"); if(currency&&profile?.preferred_currency){currency.value=profile.preferred_currency;setCurrencyPreference(profile.preferred_currency)}
}
async function openProfile(){
  if(!apiToken)return openModal("connexion");
  const result=document.getElementById("profileResult");
  if(result){result.textContent="Chargement du profil…";result.className="result"}
  document.getElementById("profileModal").hidden=false;
  document.body.classList.add("modal-open");
  try{
    const profile=await apiFetch("/api/me");
    fillProfileForm(profile);
    if(result)result.textContent="";
  }catch(e){
    if(result){result.textContent=e.message||"Impossible de charger le profil.";result.className="result error"}
  }
}
function closeProfile(){const modal=document.getElementById("profileModal");if(modal)modal.hidden=true;document.body.classList.remove("modal-open")}
async function saveProfile(){
  const result=document.getElementById("profileResult");
  if(result){result.textContent="Enregistrement…";result.className="result"}
  try{
    const selectedCurrency=document.getElementById("profileCurrency")?.value||"EUR";
    setCurrencyPreference(selectedCurrency);
    const payload={
      first_name:document.getElementById("profileFirstName")?.value||"",
      last_name:document.getElementById("profileLastName")?.value||"",
      phone:document.getElementById("profilePhone")?.value||"",
      birth_date:document.getElementById("profileBirthDate")?.value||"",
      country:document.getElementById("profileCountry")?.value||"",
      city:document.getElementById("profileCity")?.value||"",
      postal_code:document.getElementById("profilePostalCode")?.value||"",
      address:document.getElementById("profileAddress")?.value||"",
      preferred_currency:selectedCurrency,
      risk_profile:document.getElementById("profileRisk")?.value||"moderate"
    };
    const data=await apiFetch("/api/me",{method:"PUT",body:JSON.stringify(payload)});
    fillProfileForm(data.profile);
    if(result){result.textContent="Profil enregistré.";result.className="result success"}
  }catch(e){
    if(result){result.textContent=e.message||"Impossible d'enregistrer le profil.";result.className="result error"}
  }
}
async function initGoogleAuth(){
  try{
    const config=await apiFetch("/api/auth/google/config");
    const wrap=document.getElementById("googleAuthWrap");
    if(!config.enabled||!config.clientId){if(wrap){wrap.hidden=false;const target=document.getElementById("googleSignInButton");if(target)target.innerHTML="<span class=\"google-unavailable\">Connexion Google bientôt disponible — configuration requise</span>"}return}
    const render=()=>{
      if(!window.google?.accounts?.id)return false;
      window.google.accounts.id.initialize({client_id:config.clientId,callback:handleGoogleCredential,ux_mode:"popup"});
      const target=document.getElementById("googleSignInButton");
      if(target){target.innerHTML="";window.google.accounts.id.renderButton(target,{type:"standard",theme:"filled_black",size:"large",text:"continue_with",shape:"rectangular",logo_alignment:"left",width:360})}
      return true;
    };
    if(render())return;
    let attempts=0;
    const timer=setInterval(()=>{attempts++;if(render()||attempts>=30)clearInterval(timer)},250);
  }catch(e){console.warn("Google Sign-In:",e.message)}
}
async function handleGoogleCredential(response){
  const result=document.getElementById("authResult");
  if(result){result.textContent="Connexion Google…";result.className="result"}
  try{
    const data=await apiFetch("/api/auth/google",{method:"POST",body:JSON.stringify({credential:response.credential})});
    if(data.requires2FA){const verified=await requestBitGold2FA(data.challengeToken);if(!verified||!verified.token)return;Object.assign(data,verified)}
    apiToken=data.token;safeStorageSet("bitgold-token",apiToken);setConnected(true);closeModal();
    await loadProfileAfterAuth(data.profile);
    document.getElementById("dashboard")?.scrollIntoView({behavior:"smooth",block:"start"});
    await loadPortfolio().catch(e=>console.warn("Portfolio après Google:",e.message));
  }catch(e){if(result)result.textContent=e.message||"Connexion Google impossible."}
}
async function loadProfileAfterAuth(profile){
  if(!profile)return;
  fillProfileForm(profile);
}
function openModal(type){authMode=type==="inscription"?"signup":"login";setAuthFormMode(authMode);document.getElementById("authResult").textContent="";document.getElementById("modal").hidden=false;document.body.classList.add("modal-open")}
function switchAuth(){openModal(authMode==="signup"?"connexion":"inscription")}
async function submitAuth(){const email=document.getElementById("authEmail").value.trim(),password=document.getElementById("authPassword").value,result=document.getElementById("authResult");result.textContent=authMode==="signup"?"Création du compte…":"Connexion…";result.className="result";try{const payload={email,password};if(authMode==="signup")Object.assign(payload,collectSignupProfile());const d=await apiFetch("/api/auth/"+(authMode==="signup"?"signup":"login"),{method:"POST",body:JSON.stringify(payload)});if(d.requires2FA){const verified=await requestBitGold2FA(d.challengeToken);if(!verified||!verified.token)return;Object.assign(d,verified)}apiToken=d.token;safeStorageSet("bitgold-token",apiToken);setConnected(true);closeModal();await loadProfileAfterAuth(d.profile);document.getElementById("dashboard")?.scrollIntoView({behavior:"smooth",block:"start"});try{await loadPortfolio()}catch(e){console.warn("Portfolio après authentification:",e.message)}}catch(e){result.textContent=e.message;result.className="result error"}}
function closeModal(){document.getElementById("modal").hidden=true;document.body.classList.remove("modal-open")}
async function loadBots(){removeHomepageActivity();try{botState=apiToken?await apiFetch("/api/bots"):await apiFetch("/api/bots/catalog");if(!botState.plan)botState.plan={plan:"free"};if(!botState.ai){const catalogState=await apiFetch("/api/bots/catalog");botState.ai=catalogState.ai||{enabled:false,provider:"none"}}renderBots();if(hasEliteChartTools()&&document.getElementById("cryptoDetailModal")&&!document.getElementById("cryptoDetailModal").hidden&&historyState.points?.length)bindEliteChartTools()}catch(e){console.warn("Bots:",e.message)}}
function botCatalogOrder(catalog){const order=["shield","silver","gold","adaptive-ai","quant-pulse","macro-rotation"];return (catalog||[]).slice().sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id))}
function renderPlan(){const plan=botState.plan?.plan==="elite"?"elite":botState.plan?.plan==="pro"?"pro":"free",label=document.getElementById("botPlanLabel"),desc=document.getElementById("botPlanDescription"),mode=document.getElementById("botsMode");if(label)label.textContent=plan==="elite"?"BitGold Elite":plan==="pro"?"BitGold Pro":"BitGold Free";if(desc)desc.textContent=plan==="elite"?"5 bots actifs · Quant + IA + rotation macro · garde-fous Elite · outils trading avancés":plan==="pro"?"3 bots actifs · stratégies avancées · IA Adaptive + Quant Pulse":"1 bot actif · Shield inclus · passez Pro pour débloquer Silver, Gold et IA";if(mode)mode.textContent=plan==="elite"?"ELITE":plan==="pro"?"PRO":"FREE";document.querySelectorAll("[data-plan-demo]").forEach(b=>{b.hidden=false;const active=b.dataset.planDemo===plan;b.classList.toggle("active",active);b.setAttribute("aria-pressed",active?"true":"false");b.disabled=!!apiToken&&active;const card=b.closest("[data-pricing-card]");if(card)card.classList.toggle("current",active);b.textContent=active?"Niveau actuel":b.dataset.planDemo==="elite"?"Passer à Elite":b.dataset.planDemo==="pro"?"Passer à Pro":"Choisir Free"})}
function renderBots(){
  removeHomepageActivity();
  const grid=document.getElementById("botGrid"),title=document.getElementById("botsTitle"),summary=document.getElementById("botsSummary"),aiStatus=document.getElementById("botsAIStatus");
  if(!grid)return;
  const active=new Set((botState.items||[]).filter(b=>b.active!==false).map(b=>b.bot_type)),connected=!!apiToken,plan=botState.plan?.plan==="elite"?"elite":botState.plan?.plan==="pro"?"pro":"free",catalog=botCatalogOrder(botState.catalog);
  if(title)title.textContent=connected?"Votre centre d'automatisation":"Les bots BitGold";
  if(summary)summary.textContent=connected?"Choisissez une stratégie, comparez son profil et gardez la main sur les limites.":"Six stratégies, six personnalités de risque. Comparez leur style avant d'en activer une.";
  if(aiStatus){const ai=botState.ai||{enabled:false,provider:"none"};aiStatus.classList.toggle("active",!!ai.enabled);aiStatus.innerHTML="<i></i> "+(ai.enabled?"IA active · "+String(ai.provider||"fournisseur").toUpperCase():"Ensemble quantitatif · IA LLM optionnelle")}
  renderPlan();
  const meta={
    shield:{icon:"🛡️",family:"Traditionnel",tagline:"Vous gardez la main",tone:"defensif",focus:"Protection & discipline",engine:"Contrôle utilisateur",engineKind:"traditional"},
    silver:{icon:"◈",family:"Traditionnel",tagline:"Vous gardez la main",tone:"equilibre",focus:"Momentum modéré",engine:"Règles de stratégie",engineKind:"traditional"},
    gold:{icon:"✦",family:"Traditionnel",tagline:"Vous gardez la main",tone:"dynamique",focus:"Opportunités marché",engine:"Règles de stratégie",engineKind:"traditional"},
    "adaptive-ai":{icon:"✧",family:"IA autonome",tagline:"Son moteur travaille avec vous",tone:"intelligent",focus:"Signaux + contexte",engine:"Moteur IA autonome",engineKind:"ai"},
    "quant-pulse":{icon:"◌",family:"IA autonome",tagline:"Son moteur travaille avec vous",tone:"quant",focus:"Facteurs quantitatifs",engine:"Moteur IA quantitatif",engineKind:"ai"},
    "macro-rotation":{icon:"◎",family:"IA autonome",tagline:"Son moteur travaille avec vous",tone:"macro",focus:"Rotation multi-actifs",engine:"Moteur IA macro",engineKind:"ai"}
  };
  grid.innerHTML=catalog.map((bot,index)=>{
    const subscribed=active.has(bot.id),planRank={free:0,pro:1,elite:2},locked=planRank[plan]<planRank[bot.plan],m=meta[bot.id]||meta.silver;
    const assets=(bot.compatible_assets||[]).slice(0,4).join(" · ");
    const access=locked?"Réservé "+(bot.plan==="elite"?"Elite":"Pro"):subscribed?"Actif":"Disponible";
    const action=subscribed?"Gérer":locked?"Voir les conditions":"Découvrir";
    return '<article class="bot-card bot-'+bot.id+(locked?" bot-locked":"")+'" data-bot-tone="'+m.tone+'" data-bot-open="'+bot.id+'" tabindex="0" role="button" aria-label="Ouvrir la fiche '+escapeHtml(bot.name.replace(/ Bot$/,""))+'">'+
      '<div class="bot-card-rank">Niveau '+(index+1)+'</div>'+
      '<div class="bot-card-hero"><div class="bot-portrait"><span>'+m.icon+'</span></div><div class="bot-card-identity"><span class="bot-kicker">'+escapeHtml(m.family)+'</span><h3>'+escapeHtml(bot.name.replace(/ Bot$/,""))+'</h3><p>'+escapeHtml(m.tagline)+'</p></div><span class="bot-access '+(subscribed?"active":locked?"locked":"")+'">'+access+'</span></div>'+
      '<div class="bot-card-engine '+m.engineKind+'"><span class="bot-engine-badge">'+(m.engineKind==="ai"?"IA":"TRADITIONNEL")+'</span><span>'+escapeHtml(m.engine)+'</span></div>'+
      '<div class="bot-card-focus"><span>'+escapeHtml(m.focus)+'</span><span>'+escapeHtml(bot.tier)+'</span><span>'+String(bot.plan||"free").toUpperCase()+'</span></div>'+
      '<p class="bot-card-summary">'+escapeHtml(bot.summary||bot.description)+'</p>'+
      '<div class="bot-control-line '+m.engineKind+'"><b>'+(m.engineKind==="ai"?"AUTONOMIE":"CONTRÔLE")+'</b><span>'+(m.engineKind==="ai"?"Le moteur analyse et ajuste la stratégie.":"Vous définissez et pilotez les règles.")+'</span></div>'+
      '<div class="bot-stats"><span><b>Risque</b>'+escapeHtml(bot.risk)+'</span><span><b>Allocation max</b>'+bot.allocation+'%</span><span><b>Rythme</b>'+escapeHtml(bot.frequency)+'</span></div>'+
      '<p class="bot-risk-clarity">Performances issues de simulations historiques, sans garantie de rendement. Les ordres simulés sont suspendus si les données sont insuffisantes.</p>'+
      '<div class="bot-compatible"><b>ACTIFS</b><span>'+escapeHtml(assets||"Multi-actifs")+'</span></div>'+
      '<div class="bot-card-footer"><span class="bot-card-note">'+(locked?"Profil verrouillé · voir les conditions.":"Simulation uniquement · aucun ordre réel.")+'</span><span class="bot-card-open-label">'+(subscribed?"Gérer la stratégie":"Ouvrir la fiche")+' <b>→</b></span></div>'+
    '</article>';
  }).join("");
}

async function openBotDetail(type){const allowed=["shield","silver","gold","adaptive-ai","quant-pulse","macro-rotation"];if(!allowed.includes(type))return;history.pushState({}, "", "/bot/"+type);await renderBotDetail(type)}
async function renderBotDetail(type){const detail=document.getElementById("bot-detail");if(!detail)return;const catalogData=await apiFetch("/api/bots/catalog");const bot=(catalogData.catalog||[]).find(item=>item.id===type);if(!bot)return;let subscription=(botState.items||[]).find(item=>item.bot_type===type);if(apiToken){try{const data=await apiFetch("/api/bots");botState=data;subscription=(data.items||[]).find(item=>item.bot_type===type)}catch(e){console.warn("Bot detail:",e.message)}}const plan=botState.plan?.plan==="elite"?"elite":botState.plan?.plan==="pro"?"pro":"free",planRank={free:0,pro:1,elite:2},locked=planRank[plan]<planRank[bot.plan];document.body.classList.add("bot-detail-mode");detail.hidden=false;const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value};const title=bot.name.replace(/ Bot$/,"");set("botDetailTier",bot.tier);set("botDetailName",title);set("botDetailSummary",bot.summary);set("botDetailDescription",bot.description);set("botDetailStrategy",bot.strategy);set("botDetailAlgorithm",bot.algorithm||bot.strategy);set("botDetailCompatible",(bot.compatible_assets||[]).join(" · "));set("botDetailRisk",bot.risk);set("botDetailAllocation",bot.allocation+"%");set("botDetailFrequency",bot.frequency);set("botDetailPrice",bot.plan==="elite"?"Inclus dans BitGold Elite":bot.plan==="pro"?"Inclus dans BitGold Pro":"Inclus dans BitGold Free");const accent=detail.querySelector(".bot-detail-hero");if(accent)accent.dataset.bot=bot.id;const defaults=plan==="elite"?{botMaxTrade:2500,botMaxPosition:15000,botStopLoss:3,botReserve:10}:plan==="pro"?{botMaxTrade:1000,botMaxPosition:5000,botStopLoss:5,botReserve:15}:{botMaxTrade:250,botMaxPosition:1000,botStopLoss:8,botReserve:30};["botMaxTrade","botMaxPosition","botStopLoss","botReserve"].forEach(id=>{const el=document.getElementById(id);if(el)el.value=subscription?.[({botMaxTrade:"max_trade_eur",botMaxPosition:"max_position_eur",botStopLoss:"stop_loss_pct",botReserve:"min_cash_pct"}[id])]??defaults[id]});const action=document.getElementById("botActivate"),unsubscribe=document.getElementById("botUnsubscribe"),upgrade=document.getElementById("botUpgrade");if(action){action.textContent=locked?"Pro requis":subscription?.active?"Enregistrer mes paramètres":"Activer "+title;action.dataset.botType=bot.id;action.disabled=locked}if(unsubscribe){unsubscribe.hidden=!subscription?.active;unsubscribe.dataset.botType=bot.id}if(upgrade){upgrade.hidden=!locked;upgrade.onclick=()=>startStripeCheckout("pro")}const note=document.getElementById("botConfigNote");if(note)note.textContent=locked?"Ce bot est réservé au plan Pro. Activez le mode Pro de démonstration pour le tester.":subscription?.active?"Votre bot est actif. Modifiez les limites puis enregistrez-les.":"Aucun engagement réel : cette version pilote uniquement le portefeuille démo BitGold.";updateBotAIDetail(type,bot,catalogData.ai).catch(e=>console.warn("Bot AI detail:",e.message));if(apiToken)loadBotAnalytics(type,30).catch(e=>console.warn("Bot analytics:",e.message))}
async function loadBotAnalytics(type,days=30){
  const panel=document.querySelector(".bot-analytics-card"),status=document.getElementById("botAnalyticsStatus");
  if(!panel||!apiToken)return;
  document.querySelectorAll("[data-bot-period]").forEach(button=>button.classList.toggle("active",Number(button.dataset.botPeriod)===Number(days)));
  if(status)status.textContent="Calcul de la simulation…";
  try{
    const data=await apiFetch("/api/bots/"+encodeURIComponent(type)+"/backtest?days="+encodeURIComponent(days));
    const b=data?.backtest||{};
    const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value};
    const pct=(value)=>Number.isFinite(Number(value))?((Number(value)>0?"+":"")+Number(value).toFixed(2)+" %"):"—";
    set("botMetricReturn",pct(b.totalReturn));
    set("botMetricBenchmark","vs BTC "+pct(b.benchmarkBTC));
    set("botMetricSharpe",Number.isFinite(Number(b.sharpe))?Number(b.sharpe).toFixed(2):"—");
    set("botMetricSortino",Number.isFinite(Number(b.sortino))?Number(b.sortino).toFixed(2):"—");
    set("botMetricVolatility",Number.isFinite(Number(b.volatility))?Number(b.volatility).toFixed(2)+" %":"—");
    set("botMetricDrawdown",Number.isFinite(Number(b.maxDrawdown))?"−"+Number(b.maxDrawdown).toFixed(2)+" %":"—");
    set("botMetricTrades",Number.isFinite(Number(b.trades))?String(b.trades):"—");
    set("botMetricTradeSplit","achats "+Number(b.buyTrades||0)+" · ventes "+Number(b.sellTrades||0));
    set("botMetricFees",Number.isFinite(Number(b.fees))?Number(b.fees).toFixed(2)+" €":"—");
    set("botMetricTurnover",Number.isFinite(Number(b.turnover))?Number(b.turnover).toFixed(2)+" €":"—");
    renderBotPerformanceComparison(b,days);
    if(status)status.textContent="Simulation "+days+" jours · historique marché · frais + slippage inclus.";
  }catch(e){
    if(status)status.textContent=e.message||"Métriques temporairement indisponibles.";
  }
}
function renderBotPerformanceComparison(backtest,days){
  const root=document.getElementById("botPerformanceChart");
  if(!root)return;
  const strategy=Number(backtest?.totalReturn),benchmark=Number(backtest?.benchmarkBTC);
  root.replaceChildren();
  if(!Number.isFinite(strategy)||!Number.isFinite(benchmark)||backtest?.totalReturn==null||backtest?.benchmarkBTC==null){
    root.textContent="Données historiques insuffisantes pour tracer une comparaison.";
    root.setAttribute("aria-label","Comparaison indisponible");
    return;
  }
  const max=Math.max(Math.abs(strategy),Math.abs(benchmark),1);
  root.setAttribute("aria-label","Sur "+days+" jours : stratégie "+strategy.toFixed(2)+" pour cent, Bitcoin "+benchmark.toFixed(2)+" pour cent");
  for(const [name,value,kind] of [["Stratégie",strategy,"strategy"],["Bitcoin",benchmark,"benchmark"]]){
    const line=document.createElement("div");line.className="bot-performance-row";
    const label=document.createElement("span");label.textContent=name;
    const track=document.createElement("div");track.className="bot-performance-track";
    const zero=document.createElement("span");zero.className="bot-performance-zero";track.append(zero);
    const bar=document.createElement("span");bar.className="bot-performance-bar "+kind+(value<0?" negative":"");
    bar.style.width=(Math.abs(value)/max*48)+"%";
    bar.style.left=value<0?(50-Math.abs(value)/max*48)+"%":"50%";
    track.append(bar);
    const figure=document.createElement("strong");figure.textContent=(value>0?"+":"")+value.toFixed(2)+" %";
    line.append(label,track,figure);root.append(line);
  }
}
async function updateBotAIDetail(type,bot,aiConfig={}){
  const actionEl=document.getElementById("botAIAction"),confidenceEl=document.getElementById("botAIConfidence"),regimeEl=document.getElementById("botAIRegime"),reasonEl=document.getElementById("botAIReason");
  if(!actionEl||!reasonEl)return;
  if(!apiToken){actionEl.textContent="Connexion requise";confidenceEl.textContent="—";regimeEl.textContent="—";reasonEl.textContent="Connectez-vous pour consulter la décision calculée sur les données de marché.";return}
  try{const decision=await apiFetch("/api/bots/"+encodeURIComponent(type)+"/decision");actionEl.textContent=(decision.action||"hold").toUpperCase()+" · "+(decision.asset||"—");confidenceEl.textContent=Math.round(Number(decision.confidence||0)*100)+" %";regimeEl.textContent=decision.regime?.label||decision.regime?.name||"—";const sentiment=decision.sentiment||{};
  const sentimentLabel=sentiment.bias==="positive"?"sentiment positif":sentiment.bias==="negative"?"sentiment négatif":"sentiment neutre";
  reasonEl.textContent=(decision.message||"Décision IA disponible.")+" · "+sentimentLabel+" · "+(decision.provider&&decision.provider!=="none"?"LLM "+decision.provider:"ensemble quantitatif");}
  catch(e){actionEl.textContent="Indisponible";confidenceEl.textContent="—";regimeEl.textContent="—";reasonEl.textContent=aiConfig.enabled?"Le fournisseur IA est temporairement indisponible.":"Le moteur quantitatif est prêt ; aucun fournisseur LLM externe n'est configuré."}
}
async function setDemoPlan(plan){if(!apiToken){openModal("connexion");return}try{await apiFetch("/api/plan/demo",{method:"POST",body:JSON.stringify({plan})});await loadBots();const current=document.getElementById("botDetailName")?.textContent,bot=botState.catalog.find(x=>x.name.replace(/ Bot$/,"")===current);if(bot)await renderBotDetail(bot.id)}catch(e){alert(e.message)}}
async function startStripeCheckout(plan){if(!apiToken){openModal("connexion");return}const safePlan=plan==="elite"?"elite":plan==="pro"?"pro":"";if(!safePlan)return;try{const data=await apiFetch("/api/stripe/checkout",{method:"POST",body:JSON.stringify({plan:safePlan})});if(!data.url)throw new Error("Stripe n’a pas renvoyé d’URL de paiement.");window.location.assign(data.url)}catch(e){alert(e.message||"Impossible d’ouvrir le paiement Stripe.")}}
async function openStripePortal(){if(!apiToken){openModal("connexion");return}try{const data=await apiFetch("/api/stripe/portal",{method:"POST"});if(!data.url)throw new Error("Stripe n’a pas renvoyé l’URL de gestion.");window.location.assign(data.url)}catch(e){alert(e.message||"Impossible d’ouvrir la gestion Stripe.")}}
function handleStripeReturn(){const status=new URLSearchParams(window.location.search).get("stripe");if(status==="success"){alert("Paiement Stripe terminé. Votre abonnement sera activé dès réception de la confirmation Stripe.");window.history.replaceState({},"",window.location.pathname+window.location.hash)}else if(status==="cancel"){alert("Paiement Stripe annulé. Aucun abonnement n’a été confirmé.");window.history.replaceState({},"",window.location.pathname+window.location.hash)}}
document.querySelectorAll("[data-bot-period]").forEach(button=>button.addEventListener("click",()=>{const type=document.getElementById("botActivate")?.dataset.botType;if(type)loadBotAnalytics(type,Number(button.dataset.botPeriod||30)).catch(e=>console.warn("Bot analytics period:",e.message))}));
async function saveBotConfiguration(){const button=document.getElementById("botActivate"),type=button?.dataset.botType;if(!type)return;if(!apiToken){openModal("connexion");return}button.disabled=true;try{await apiFetch("/api/bots/subscriptions",{method:"POST",body:JSON.stringify({botType:type,maxTradeEur:Number(document.getElementById("botMaxTrade").value),maxPositionEur:Number(document.getElementById("botMaxPosition").value),stopLossPct:Number(document.getElementById("botStopLoss").value),minCashPct:Number(document.getElementById("botReserve").value)})});await loadBots();await renderBotDetail(type);await loadActivity();const note=document.getElementById("botConfigNote");if(note)note.textContent="Paramètres enregistrés. Le bot applique désormais ces limites au moteur démo."}catch(e){alert(e.message)}finally{button.disabled=false}}
async function unsubscribeBot(){const button=document.getElementById("botUnsubscribe"),type=button?.dataset.botType;if(!type||!apiToken)return;if(!confirm("Désabonner ce bot ? Il cessera ses décisions automatiques, sans supprimer votre portefeuille."))return;button.disabled=true;try{await apiFetch("/api/bots/subscriptions/"+encodeURIComponent(type),{method:"DELETE"});await loadBots();await renderBotDetail(type);await loadActivity()}catch(e){alert(e.message)}finally{button.disabled=false}}
async function loadActivity(){if(!apiToken)return;const log=document.getElementById("activityLog");if(log){log.setAttribute("aria-busy","true");log.innerHTML='<div class="bot-empty" role="status">Chargement du journal…</div>'}try{const data=await apiFetch("/api/activity");window.activityState=data;renderActivity(document.querySelector("[data-activity-filter].active")?.dataset.activityFilter||"all")}catch(e){console.warn("Activité:",e.message);if(log){const message=document.createElement("div");message.className="bot-empty";message.setAttribute("role","alert");message.textContent=e.message||"Journal temporairement indisponible.";if(apiToken){const retry=document.createElement("button");retry.type="button";retry.className="btn btn-ghost";retry.textContent="Réessayer";retry.addEventListener("click",loadActivity);message.append(" ",retry)}log.replaceChildren(message)}}finally{log?.removeAttribute("aria-busy")}}
function renderActivity(filter="all"){const data=window.activityState||{botLogs:[],trades:[]},log=document.getElementById("activityLog"),summary=document.getElementById("activitySummary");if(!log)return;const botLogs=(data.botLogs||[]).map(x=>({kind:x.action==="subscribe"||x.action==="unsubscribe"?"subscription":"bot",type:x.action,bot:x.bot_type,asset:x.asset,message:x.message,date:x.created_at,id:x.id}));const trades=(data.trades||[]).map(x=>({kind:x.side==="buy"?"buy":"sell",type:x.side,bot:"Trading",asset:x.asset,message:(x.side==="buy"?"Achat de ":"Vente de ")+x.asset+" · "+Number(x.amount_eur||0).toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})+" €",date:x.created_at,details:Number(x.quantity||0).toFixed(6)+" unités",id:x.id}));let items=[...botLogs,...trades].sort((a,b)=>new Date(b.date)-new Date(a.date));if(filter!=="all")items=items.filter(x=>x.kind===filter);const query=(document.getElementById("activitySearch")?.value||"").trim().toLocaleLowerCase("fr");if(query)items=items.filter(x=>[x.bot,x.type,x.asset,x.message,x.details,x.id].some(value=>String(value??"").toLocaleLowerCase("fr").includes(query)));const resultCount=document.getElementById("activitySearchCount");if(resultCount)resultCount.textContent=items.length+" résultat"+(items.length>1?"s":"");const counts={all:botLogs.length+trades.length,bot:botLogs.filter(x=>x.kind==="bot").length,buy:trades.filter(x=>x.kind==="buy").length,sell:trades.filter(x=>x.kind==="sell").length,subscription:botLogs.filter(x=>x.kind==="subscription").length};if(summary)summary.innerHTML=Object.entries(counts).map(([k,v])=>'<span><b>'+v+'</b><small>'+({all:"événements",bot:"logs bots",buy:"achats",sell:"ventes",subscription:"abonnements"}[k])+'</small></span>').join("");log.innerHTML=items.length?items.map(item=>{const title=item.kind==="bot"?(item.bot+" · "+item.type):item.message;const meta=item.kind==="bot"?(item.asset?item.asset+" · ":"")+"Décision du bot":(item.details||"Opération journalisée");const ref=item.id!=null?"Réf. "+item.id:"Simulation";return '<article class="activity-row activity-'+item.kind+'"><span class="activity-icon">'+({bot:"⚙",buy:"↗",sell:"↘",subscription:"✓"}[item.kind])+'</span><div><strong>'+escapeHtml(title)+'</strong><span>'+escapeHtml(meta)+' · '+escapeHtml(ref)+'</span></div><time>'+escapeHtml(formatNewsAge(item.date))+'</time></article>'}).join(""):'<div class="bot-empty">Aucune activité dans cette catégorie.</div>';document.querySelectorAll("[data-activity-filter]").forEach(b=>b.classList.toggle("active",b.dataset.activityFilter===filter))}document.getElementById("activitySearch")?.addEventListener("input",()=>renderActivity(document.querySelector("[data-activity-filter].active")?.dataset.activityFilter||"all"));function openActivity(){if(!apiToken){openModal("connexion");return}history.pushState({}, "", "/activite");document.body.classList.add("activity-mode");document.getElementById("activite").hidden=false;loadActivity()}
function closeActivity(){document.body.classList.remove("activity-mode");const page=document.getElementById("activite");if(page)page.hidden=true;history.pushState({}, "", "/#dashboard");document.getElementById("dashboard")?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"})}
function closeBotDetail(){document.body.classList.remove("bot-detail-mode");const detail=document.getElementById("bot-detail");if(detail)detail.hidden=true;history.pushState({}, "", "/#bots");document.getElementById("bots")?.scrollIntoView({behavior:"smooth"})}
function initBotRoute(){const match=window.location.pathname.match(/^\/bot\/(shield|silver|gold|adaptive-ai|quant-pulse|macro-rotation)$/);if(match)renderBotDetail(match[1]).catch(e=>console.warn("Bot route:",e.message));const activity=window.location.pathname==="/activite";const investir=/^\/investir\/?$/.test(window.location.pathname);if(activity){if(apiToken)openActivity();else openModal("connexion")}if(investir)openInvestirPage();window.addEventListener("popstate",()=>{const next=window.location.pathname.match(/^\/bot\/(shield|silver|gold|adaptive-ai|quant-pulse|macro-rotation)$/);if(next)renderBotDetail(next[1]);else if(window.location.pathname==="/activite"){closeInvestirPage();if(apiToken)openActivity();else openModal("connexion")}else if(/^\/investir\/?$/.test(window.location.pathname)){openInvestirPage()}else{closeInvestirPage();document.body.classList.remove("bot-detail-mode","activity-mode");const detail=document.getElementById("bot-detail"),page=document.getElementById("activite");if(detail)detail.hidden=true;if(page)page.hidden=true}})}
// Legacy #marches links must use the same /investir route and live market grid.
function redirectLegacyMarketHash(){
  if(window.location.hash.toLowerCase()==="#marches"){
    window.location.replace("/investir");
    return true;
  }
  return false;
}
window.addEventListener("hashchange",redirectLegacyMarketHash);
if(window.location.pathname!=="/investir")redirectLegacyMarketHash();
function openInvestirPage(){document.body.classList.add("investir-page-mode");document.body.classList.remove("activity-mode","bot-detail-mode");const page=document.getElementById("activite"),detail=document.getElementById("bot-detail");if(page)page.hidden=true;if(detail)detail.hidden=true;document.querySelectorAll(".main-nav a").forEach(link=>link.classList.toggle("active",link.classList.contains("nav-investir")));if(!lastMarketData.length)loadMarket();loadMarketHistoryPreviews();loadNews()}function closeInvestirPage(){document.body.classList.remove("investir-page-mode");document.querySelectorAll(".main-nav a").forEach(link=>link.classList.remove("active"))}
function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]||char))}
function formatNewsAge(timestamp){const date=new Date(timestamp);if(!Number.isFinite(date.getTime()))return "Récent";const minutes=Math.max(1,Math.floor((Date.now()-date.getTime())/60000));if(minutes<60)return "Il y a "+minutes+" min";const hours=Math.floor(minutes/60);if(hours<24)return "Il y a "+hours+" h";return "Il y a "+Math.floor(hours/24)+" j"}
function renderNews(items,sourceLabel="Sources crypto"){
  const grid=document.getElementById("newsGrid");
  if(!grid)return;
  if(!items?.length){grid.innerHTML="<div class=\"news-empty\">Aucune actualité disponible pour le moment.</div>";return}
  grid.innerHTML=items.slice(0,6).map((item,index)=>{
    const image=item.imageUrl||"";
    const source=escapeHtml(item.source||"Crypto");
    const category=escapeHtml(item.category||"Crypto");
    const age=escapeHtml(formatNewsAge(item.publishedAt));
    return `<article class="news-rail-item ${index===0?"featured":"compact"}">
      <a class="news-rail-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" aria-label="Lire : ${escapeHtml(item.title)}">
        <div class="news-rail-item-media">
          <div class="news-rail-image-wrap">${image?`<img class="news-rail-image" src="${escapeHtml(image)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`:`<div class="news-rail-image news-rail-image-placeholder" aria-hidden="true">BG</div>`}</div>
          <div class="news-rail-item-body">
            <div class="news-rail-item-meta"><span class="news-category">${category}</span><span class="news-age">${age}</span></div>
            <h3>${escapeHtml(item.title)}</h3>
            <div class="news-rail-source"><span>${source}</span><span>Lire →</span></div>
          </div>
        </div>
      </a>
    </article>` }).join("");
  const intro=document.querySelector(".news-rail-intro");
  if(intro)intro.textContent=sourceLabel+" · sélection actualisée automatiquement.";
}
async function loadNews(){
  const section=document.getElementById("actualites");
  if(!section)return;
  const grid=document.getElementById("newsGrid");
  if(grid)grid.innerHTML="<div class=\"news-loading\">Actualités en cours de chargement…</div>";
  try{
    const data=await apiFetch("/api/news");
    renderNews(data.items||[],data.source||"BitGold News");
  }catch(e){
    console.warn("Actualités:",e.message);
    renderNews([{title:"Voir les dernières actualités crypto",url:"https://www.coindesk.com/arc/outboundfeeds/rss/",publishedAt:new Date().toISOString(),source:"CoinDesk",category:"Actualités",imageUrl:""}],"Flux de secours");
  }
}
async function refreshMarketView(){await loadMarket();await loadMarketHistoryPreviews();if(apiToken)renderWallet();loadNews()}
initBotRoute();applyCountryCurrencyDefaults();setConnected(!!apiToken);if(apiToken)loadPortfolio().catch(e=>console.warn("Portfolio API:",e.message));else loadNews();refreshMarketView();setInterval(refreshMarketView,60000);
window.openModal=openModal;window.openDemoLab=openDemoLab;window.closeDemoLab=closeDemoLab;window.openBotDetail=openBotDetail;window.saveBotConfiguration=saveBotConfiguration;window.unsubscribeBot=unsubscribeBot;window.openActivity=openActivity;window.closeActivity=closeActivity;window.logout=logout;window.setMarketPreviewRange=setMarketPreviewRange;window.loadBots=loadBots;window.switchAuth=switchAuth;window.submitAuth=submitAuth;window.closeModal=closeModal;window.openProfile=openProfile;window.closeProfile=closeProfile;window.openTrade=openTrade;window.executeTrade=executeTrade;window.closeTrade=closeTrade;window.simulate=simulate;window.openCryptoDetail=openCryptoDetail;window.closeCryptoDetail=closeCryptoDetail;window.loadCryptoDetailRange=loadCryptoDetailRange;window.simulateVisitorFees=simulateVisitorFees;
document.getElementById("newsletterForm")?.addEventListener("submit",submitNewsletter);
document.getElementById("authCurrency")?.addEventListener("change",e=>{e.target.dataset.userChanged="true";setCurrencyPreference(e.target.value)});
document.getElementById("profileCurrency")?.addEventListener("change",e=>{e.target.dataset.userChanged="true";setCurrencyPreference(e.target.value)});
document.getElementById("authCountry")?.addEventListener("change",()=>syncCurrencyFromCountry("authCountry","authCurrency"));
document.getElementById("profileCountry")?.addEventListener("change",()=>syncCurrencyFromCountry("profileCountry","profileCurrency"));
document.getElementById("authSubmit")?.addEventListener("click",submitAuth);
document.getElementById("authSwitch")?.addEventListener("click",switchAuth);
document.getElementById("authClose")?.addEventListener("click",closeModal);document.getElementById("profileClose")?.addEventListener("click",closeProfile);document.getElementById("profileSave")?.addEventListener("click",saveProfile);document.getElementById("profileLogout")?.addEventListener("click",()=>{closeProfile();logout()});
document.querySelector("#topLogin")?.addEventListener("click",()=>apiToken?openProfile():openModal("connexion"));const menuToggle=document.getElementById("menuToggle"),mainNav=document.getElementById("mainNav");menuToggle?.addEventListener("click",()=>{const open=mainNav?.classList.toggle("menu-open");menuToggle.setAttribute("aria-expanded",String(!!open));});
document.addEventListener("keydown",event=>{if(event.key!=="Escape"||!mainNav?.classList.contains("menu-open"))return;mainNav.classList.remove("menu-open");menuToggle?.setAttribute("aria-expanded","false");menuToggle?.focus()});document.querySelectorAll(".main-nav a").forEach(link=>link.addEventListener("click",()=>{mainNav?.classList.remove("menu-open");menuToggle?.setAttribute("aria-expanded","false")}));
document.querySelectorAll(".topbar nav a[href^='#']").forEach(link=>link.addEventListener("click",event=>{const target=link.getAttribute("href");if(target==="#"){if(window.location.pathname!=="/"){event.preventDefault();window.location.href="/";return}window.scrollTo({top:0,behavior:"smooth"});return}if(window.location.pathname!=="/"){event.preventDefault();window.location.href="/"+target;return}event.preventDefault();document.querySelector(target)?.scrollIntoView({behavior:"smooth",block:"start"})}));
const navLinks=[...document.querySelectorAll(".main-nav a[href^='#']")];const navSections=navLinks.map(link=>({link,section:link.getAttribute("href")==="#"?null:document.querySelector(link.getAttribute("href"))})).filter(x=>x.section);const navObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){navLinks.forEach(link=>link.classList.remove("active"));const item=navSections.find(x=>x.section===entry.target);item?.link.classList.add("active")}})},{rootMargin:"-30% 0px -55% 0px",threshold:0});navSections.forEach(x=>navObserver.observe(x.section));
document.querySelector("#heroSignup")?.addEventListener("click",()=>openModal("inscription"));
document.querySelectorAll(".market-periods button").forEach(button=>button.addEventListener("click",()=>setMarketPreviewRange(Number(button.dataset.days))));
document.querySelectorAll(".crypto-detail-ranges button").forEach(button=>button.addEventListener("click",()=>loadCryptoDetailRange(button.dataset.range)));
document.querySelectorAll("[data-market-filter]").forEach(button=>button.addEventListener("click",()=>{document.querySelectorAll("[data-market-filter]").forEach(item=>item.classList.remove("active"));button.classList.add("active");renderMarket(lastMarketData)}));document.getElementById("investirMarketSearch")?.addEventListener("input",()=>renderMarket(lastMarketData));document.getElementById("marketGrid")?.addEventListener("click",event=>{const tradeButton=event.target.closest("[data-trade-side]");if(tradeButton){event.stopPropagation();openTrade(tradeButton.dataset.tradeSide,tradeButton.dataset.tradeAsset||"BTC");return}const card=event.target.closest(".market[data-crypto]");if(card)openCryptoDetail(card.dataset.crypto)});
document.getElementById("dashDecisionOpen")?.addEventListener("click",()=>openActivity());document.getElementById("simulateButton")?.addEventListener("click",simulate);document.getElementById("heroDemo")?.addEventListener("click",openDemoLab);document.getElementById("demoBuyButton")?.addEventListener("click",demoBuyBitcoin);document.getElementById("demoApplyBot")?.addEventListener("click",demoApplyBot);document.getElementById("demoRunSimulation")?.addEventListener("click",runDemoSimulation);document.getElementById("demoReset")?.addEventListener("click",resetDemoLab);document.getElementById("demoClose")?.addEventListener("click",closeDemoLab);initHomeExplorer();document.getElementById("visitorFeeSimulate")?.addEventListener("click",simulateVisitorFees);
document.getElementById("walletBuy")?.addEventListener("click",()=>openTrade("buy"));
document.getElementById("walletSell")?.addEventListener("click",()=>openTrade("sell"));
document.getElementById("tradeConfirm")?.addEventListener("click",executeTrade);
document.getElementById("botGrid")?.addEventListener("click",event=>{const card=event.target.closest("[data-bot-open]");if(!card)return;openBotDetail(card.dataset.botOpen)});document.getElementById("botGrid")?.addEventListener("keydown",event=>{const card=event.target.closest("[data-bot-open]");if(!card||!["Enter"," "].includes(event.key))return;event.preventDefault();openBotDetail(card.dataset.botOpen)});document.querySelectorAll("[data-plan-demo]").forEach(button=>button.addEventListener("click",()=>{const plan=button.dataset.planDemo;if(plan==="pro"||plan==="elite")startStripeCheckout(plan);else setDemoPlan(plan)}));document.getElementById("stripePortalButton")?.addEventListener("click",openStripePortal);document.getElementById("transferFeeQuote")?.addEventListener("click",simulateTransferFee);document.getElementById("botActivate")?.addEventListener("click",saveBotConfiguration);document.getElementById("botUnsubscribe")?.addEventListener("click",unsubscribeBot);document.getElementById("botBack")?.addEventListener("click",closeBotDetail);document.getElementById("activityBack")?.addEventListener("click",closeActivity);document.querySelectorAll("[data-activity-filter]").forEach(button=>button.addEventListener("click",()=>renderActivity(button.dataset.activityFilter)));document.getElementById("activityNav")?.addEventListener("click",event=>{if(apiToken){event.preventDefault();openActivity()}});document.getElementById("dashboardActivityLink")?.addEventListener("click",event=>{event.preventDefault();openActivity()});
document.querySelectorAll(".modal .close").forEach(button=>button.addEventListener("click",()=>{const modal=button.closest(".modal");if(modal?.id==="tradeModal")closeTrade();else if(modal?.id==="cryptoDetailModal")closeCryptoDetail();else if(modal?.id==="demoModal")closeDemoLab();else if(modal?.id==="modal")closeModal();else if(modal?.id==="profileModal")closeProfile()}));
document.querySelectorAll(".modal").forEach(modal=>modal.addEventListener("click",event=>{if(event.target===modal){if(modal.id==="tradeModal")closeTrade();else if(modal.id==="cryptoDetailModal")closeCryptoDetail();else if(modal.id==="demoModal")closeDemoLab();else if(modal.id==="modal")closeModal();else if(modal.id==="profileModal")closeProfile()}}));
document.addEventListener("keydown",event=>{if(event.key!=="Escape")return;const open=document.querySelector(".modal:not([hidden])");if(!open)return;if(open.id==="tradeModal")closeTrade();else if(open.id==="cryptoDetailModal")closeCryptoDetail();else if(open.id==="profileModal")closeProfile();else if(open.id==="demoModal")closeDemoLab();else closeModal()});
window.addEventListener("error",e=>{const el=document.getElementById("authResult");if(el)el.textContent="Erreur JavaScript : "+e.message;});

removeHomepageActivity();
handleStripeReturn();initGoogleAuth();

window.addEventListener('DOMContentLoaded',initBitGoldI18n);

window.addEventListener("DOMContentLoaded",()=>{loadFxRates()});
function rerenderCurrency(){if(lastMarketData.length)renderMarket(lastMarketData);if(state?.portfolio)renderWallet();if(apiToken)loadDashboard().catch(()=>{});}
window.addEventListener("bitgold:fx-ready",rerenderCurrency);
window.addEventListener("bitgold:currency-ready",rerenderCurrency);

async function requestBitGold2FA(challenge){return new Promise(resolve=>{let m=document.getElementById("bitgold2faPrompt");if(!m){m=document.createElement("div");m.id="bitgold2faPrompt";m.innerHTML='<div style="position:fixed;inset:0;background:rgba(0,0,0,.65);display:grid;place-items:center;z-index:9999;padding:20px"><div style="background:#fff;border-radius:20px;padding:28px;max-width:420px;width:100%;color:#111"><h3>Vérification en 2 étapes</h3><p>Ouvrez Google Authenticator et saisissez le code à 6 chiffres.</p><input id="bitgold2faCode" inputmode="numeric" maxlength="20" autocomplete="one-time-code" style="width:100%;padding:14px;font-size:24px;letter-spacing:6px;text-align:center"><div style="display:flex;gap:10px;margin-top:16px"><button id="bitgold2faCancel" type="button">Annuler</button><button id="bitgold2faOk" type="button">Vérifier</button></div><small id="bitgold2faError"></small></div></div>';document.body.appendChild(m)}m.hidden=false;const input=document.getElementById("bitgold2faCode");input.value="";input.focus();document.getElementById("bitgold2faCancel").onclick=()=>{m.hidden=true;resolve(null)};document.getElementById("bitgold2faOk").onclick=async()=>{const v=input.value.trim();if(!/^\d{6}$/.test(v)&&!/^[A-Z0-9]{20}$/.test(v)){document.getElementById("bitgold2faError").textContent="Code invalide.";return}try{const d=await apiFetch("/api/auth/2fa/verify",{method:"POST",body:JSON.stringify({challengeToken:challenge,code:v})});m.hidden=true;resolve(d)}catch(e){document.getElementById("bitgold2faError").textContent=e.message}}})}
async function openSecurityCenter(){
  if(!apiToken){openModal("connexion");return}
  let m=document.getElementById("securityManager");
  if(!m){
    m=document.createElement("div");
    m.id="securityManager";
    m.innerHTML='<div style="position:fixed;inset:0;background:rgba(0,0,0,.65);display:grid;place-items:center;z-index:9998;padding:20px"><div style="background:#fff;border-radius:22px;padding:28px;max-width:560px;width:100%;color:#111"><button id="securityClose" type="button" style="float:right">×</button><h2>Centre de sécurité</h2><p>Google Authenticator protège votre connexion avec un code temporaire.</p><div id="securityManagerBody">Chargement…</div></div></div>';
    document.body.appendChild(m);
    document.getElementById("securityClose").onclick=()=>m.hidden=true;
  }
  m.hidden=false;
  const body=document.getElementById("securityManagerBody");
  try{
    const x=await apiFetch("/api/security");
    if(x.twoFA.enabled){
      body.innerHTML='<p><strong>✓ 2FA activé</strong></p><button id="securityDisable" type="button">Désactiver le 2FA</button>';
      document.getElementById("securityDisable").onclick=async()=>{
        const p=prompt("Mot de passe BitGold :");
        const code=prompt("Code Google Authenticator :");
        if(!p||!code)return;
        try{
          await apiFetch("/api/security/2fa/disable",{method:"POST",body:JSON.stringify({password:p,code})});
          body.innerHTML="<p><strong>2FA désactivé.</strong></p>";
        }catch(e){alert(e.message)}
      };
    }else{
      body.innerHTML='<button id="securityStart" type="button">Activer Google Authenticator</button><div id="securitySetup"></div>';
      document.getElementById("securityStart").onclick=async()=>{
        const q=await apiFetch("/api/security/2fa/setup",{method:"POST"});
        document.getElementById("securitySetup").innerHTML='<p>1. Scannez ce QR code avec Google Authenticator.</p><img src="'+q.qr+'" alt="QR code Google Authenticator" style="width:260px;max-width:100%"><p>Secret manuel : <code>'+q.secret+'</code></p><input id="securityEnableCode" inputmode="numeric" maxlength="6"><button id="securityEnable" type="button">Activer</button>';
        document.getElementById("securityEnable").onclick=async()=>{
          try{
            const r=await apiFetch("/api/security/2fa/enable",{method:"POST",body:JSON.stringify({code:document.getElementById("securityEnableCode").value})});
            document.getElementById("securitySetup").innerHTML="<p><strong>2FA activé.</strong></p><p>Codes de récupération :</p><pre>"+r.recoveryCodes.join("\n")+"</pre>";
          }catch(e){alert(e.message)}
        };
      };
    }
  }catch(e){body.textContent=e.message}
}
window.openSecurityCenter=openSecurityCenter;
window.addEventListener("DOMContentLoaded",()=>{if(apiToken){const b=document.createElement("button");b.type="button";b.textContent="Sécurité / 2FA";b.className="btn btn-ghost";b.style.position="fixed";b.style.right="18px";b.style.bottom="18px";b.style.zIndex="9990";b.onclick=openSecurityCenter;document.body.appendChild(b)}});

/* BitGold AI comparator — simulation only. */
let comparatorCachedRows=[];
let comparatorRequestVersion=0;
const comparatorBotNames={shield:"Shield","adaptive-ai":"Adaptive AI","quant-pulse":"Quant Pulse",silver:"Silver",gold:"Gold","macro-rotation":"Macro Rotation"};
function comparatorNumber(value,fallback=0){return Number.isFinite(Number(value))?Number(value):fallback}
function comparatorPct(value){return value!==null&&value!==undefined&&Number.isFinite(Number(value))?((Number(value)>0?"+":"")+Number(value).toFixed(2)+" %"):"—"}
function comparatorScore(row,sort){
  if(sort==="excess")return comparatorNumber(row.excessReturnBTC,-Infinity);
  if(sort==="sharpe")return comparatorNumber(row.sharpe,-Infinity);
  if(sort==="sortino")return comparatorNumber(row.sortino,-Infinity);
  if(sort==="drawdown")return -comparatorNumber(row.maxDrawdown,Infinity);
  if(sort==="robustness")return comparatorNumber(row.robustness?.confidence?.p50,-Infinity);
  return comparatorNumber(row.totalReturn,-Infinity);
}
function renderBotComparator(rows){
  const body=document.querySelector("#botComparatorPanel [data-comparator-body]");
  const summary=document.getElementById("botComparatorSummary");
  if(!body)return;
  if(!rows.length){
    if(summary)summary.hidden=true;
    body.innerHTML='<div class="comparator-empty">Aucun résultat.</div>';
    return;
  }
  const sort=document.getElementById("botComparatorSort")?.value||"return";
  const ranked=rows.slice().sort((a,b)=>comparatorScore(b,sort)-comparatorScore(a,sort));
  const best=ranked[0];
  const btcExcess=ranked.reduce((sum,row)=>sum+comparatorNumber(row.excessReturnBTC),0)/ranked.length;
  const robustValues=ranked.map(row=>row.robustness?.confidence?.p50).filter(value=>value!==null&&value!==undefined&&Number.isFinite(Number(value))).map(Number).sort((a,b)=>a-b);
  const avgReturn=ranked.reduce((sum,row)=>sum+comparatorNumber(row.totalReturn),0)/ranked.length;
  const avgDrawdown=ranked.reduce((sum,row)=>sum+comparatorNumber(row.maxDrawdown),0)/ranked.length;
  if(summary){
    summary.hidden=false;
    const medianRobustness=robustValues.length?robustValues[Math.floor(robustValues.length/2)]:null;
    summary.innerHTML=`<div><span>Leader selon le tri</span><strong>${escapeHtml(comparatorBotNames[best.botType]||best.botType)}</strong></div><div><span>Rendement moyen</span><strong>${comparatorPct(avgReturn)}</strong></div><div><span>Écart moyen vs BTC</span><strong>${comparatorPct(btcExcess)}</strong></div><div><span>Drawdown moyen</span><strong>−${avgDrawdown.toFixed(2)} %</strong></div><div><span>Robustesse médiane</span><strong>${medianRobustness!==null?comparatorPct(medianRobustness):"—"}</strong></div>`;
  }
  body.innerHTML=ranked.map((row,index)=>{
    const robust=row.robustness||{},conf=robust.confidence||{};
    const name=comparatorBotNames[row.botType]||row.botType;
    const badge=index===0?'<span class="comparator-badge">Leader</span>':"";
    return `<article class="comparator-card${index===0?" highlight":""}"><div class="comparator-rank">#${index+1}</div><div class="comparator-main"><strong>${escapeHtml(name)}</strong><span>${row.trades} trades · ${row.periodPoints} points${badge}</span></div><div><small>Rendement</small><strong>${comparatorPct(row.totalReturn)}</strong></div><div><small>BTC (même période)</small><strong>${comparatorPct(row.benchmarkBTC)}</strong></div><div><small>Écart vs BTC</small><strong>${comparatorPct(row.excessReturnBTC)}</strong></div><div><small>Sharpe</small><strong>${comparatorNumber(row.sharpe).toFixed(2)}</strong></div><div><small>Sortino</small><strong>${comparatorNumber(row.sortino).toFixed(2)}</strong></div><div><small>Volatilité</small><strong>${comparatorPct(row.volatility)}</strong></div><div><small>Drawdown max</small><strong>−${comparatorNumber(row.maxDrawdown).toFixed(2)} %</strong></div><div><small>Robustesse P05/P50/P95</small><strong>${comparatorPct(conf.p05)} / ${comparatorPct(conf.p50)} / ${comparatorPct(conf.p95)}</strong></div></article>`;
  }).join("");
}
async function loadBotComparator(){
  const requestVersion=++comparatorRequestVersion;
  const panel=document.getElementById("botComparatorPanel");
  if(!panel)return;
  const days=Number(document.getElementById("botComparatorDays")?.value||90);
  const selected=[...document.querySelectorAll("#botComparatorBots input:checked")].map(input=>input.value);
  const body=panel.querySelector("[data-comparator-body]");
  const status=document.getElementById("botComparatorStatus");
  if(selected.length<2){
    comparatorCachedRows=[];
    const summary=document.getElementById("botComparatorSummary");
    if(summary)summary.hidden=true;
    if(status)status.textContent="Sélectionnez au moins 2 stratégies.";
    if(body)body.innerHTML='<div class="comparator-empty">Sélectionnez au moins deux stratégies pour comparer leurs profils.</div>';
    return;
  }
  if(body)body.innerHTML=`<div class="comparator-loading">Calcul des backtests simulés · ${days} jours · frais + slippage…</div>`;
  if(status)status.textContent="Calcul en cours…";
  try{
    const data=await apiFetch("/api/bots/comparator?days="+encodeURIComponent(days)+"&bots="+encodeURIComponent(selected.join(",")));
    if(requestVersion!==comparatorRequestVersion)return;
    const rows=Array.isArray(data?.bots)?data.bots:[];
    comparatorCachedRows=rows;
    renderBotComparator(rows);
    if(status)status.textContent=rows.length+" stratégies · historique identique · simulation uniquement.";
  }catch(error){
    if(requestVersion!==comparatorRequestVersion)return;
    comparatorCachedRows=[];
    const summary=document.getElementById("botComparatorSummary");
    if(summary)summary.hidden=true;
    if(body)body.innerHTML=`<div class="comparator-empty">${escapeHtml(error.message||"Comparateur indisponible.")}</div>`;
    if(status)status.textContent="Calcul indisponible.";
  }
}
function updateBotComparatorSelection(){
  const count=document.querySelectorAll("#botComparatorBots input:checked").length;
  const label=document.getElementById("botComparatorSelection");
  if(label)label.textContent=count+" stratégie"+(count>1?"s":"")+" sélectionnée"+(count>1?"s":"");
}
function initBotComparator(){
  const panel=document.getElementById("botComparatorPanel");
  if(!panel)return;
  panel.querySelector("[data-comparator-run]")?.addEventListener("click",loadBotComparator);
  panel.querySelectorAll("#botComparatorBots input").forEach(input=>input.addEventListener("change",()=>{
    comparatorRequestVersion++;
    comparatorCachedRows=[];
    const summary=document.getElementById("botComparatorSummary");
    if(summary)summary.hidden=true;
    const body=panel.querySelector("[data-comparator-body]");
    if(body)body.innerHTML='<div class="comparator-empty">Sélection modifiée : relancez la comparaison.</div>';
    updateBotComparatorSelection();
  }));
  document.getElementById("botComparatorDays")?.addEventListener("change",()=>{
    comparatorRequestVersion++;
    comparatorCachedRows=[];
    const summary=document.getElementById("botComparatorSummary");
    if(summary)summary.hidden=true;
    const body=panel.querySelector("[data-comparator-body]");
    if(body)body.innerHTML='<div class="comparator-empty">Période modifiée : relancez la comparaison.</div>';
  });
  document.getElementById("botComparatorSort")?.addEventListener("change",()=>{
    const cards=panel.querySelectorAll(".comparator-card");
    if(cards.length)renderBotComparator(comparatorCachedRows);
  });
  updateBotComparatorSelection();
}
document.addEventListener("DOMContentLoaded",initBotComparator);


/* Centre de notifications — simulation uniquement. */
const SIM_NOTIFICATION_KEY="bitgold-sim-notifications-v1";
function getSimNotifications(){try{const raw=localStorage.getItem(SIM_NOTIFICATION_KEY);if(raw)return JSON.parse(raw)}catch(e){}return[
  {id:"welcome",title:"Bienvenue dans BitGold AI",text:"Votre cockpit et vos bots sont prêts en mode simulation.",icon:"✦",read:false,date:Date.now()},
  {id:"risk",title:"Risk Center disponible",text:"Surveillez exposition, concentration et drawdown depuis le cockpit.",icon:"◈",read:false,date:Date.now()-60000},
  {id:"market",title:"Signal marché simulé",text:"Les indicateurs marché sont disponibles pour comparer les actifs.",icon:"↗",read:true,date:Date.now()-120000}
]}
function saveSimNotifications(items){try{localStorage.setItem(SIM_NOTIFICATION_KEY,JSON.stringify(items.slice(0,20)))}catch(e){}}
function pushSimNotification(title,text,icon="•"){const items=getSimNotifications();items.unshift({id:Date.now()+Math.random().toString(16).slice(2),title,text,icon,read:false,date:Date.now()});saveSimNotifications(items);renderSimNotifications()}
function renderSimNotifications(){const list=document.getElementById("notificationList"),badge=document.getElementById("notificationBadge");if(!list)return;const items=getSimNotifications();const unread=items.filter(x=>!x.read).length;if(badge){badge.hidden=!unread;badge.textContent=unread>9?"9+":String(unread)}if(!items.length){list.innerHTML='<div class="notification-empty">Aucune notification.</div>';return}list.innerHTML=items.map(x=>'<article class="notification-item '+(x.read?"":"unread")+'"><span class="notification-icon">'+escapeHtml(x.icon||"•")+'</span><div><strong>'+escapeHtml(x.title)+'</strong><p>'+escapeHtml(x.text)+'</p></div><time>'+escapeHtml(formatNewsAge(x.date))+'</time></article>').join("")}
function toggleSimNotifications(force){const panel=document.getElementById("notificationPanel"),trigger=document.getElementById("notificationTrigger");if(!panel)return;const open=force===undefined?panel.hidden:force;panel.hidden=!open;if(trigger)trigger.setAttribute("aria-expanded",String(open));if(open)renderSimNotifications()}
document.getElementById("notificationTrigger")?.addEventListener("click",()=>toggleSimNotifications());document.getElementById("notificationMarkRead")?.addEventListener("click",()=>{const items=getSimNotifications().map(x=>({...x,read:true}));saveSimNotifications(items);renderSimNotifications()});document.addEventListener("click",event=>{const panel=document.getElementById("notificationPanel"),trigger=document.getElementById("notificationTrigger");if(panel&&!panel.hidden&&!panel.contains(event.target)&&!trigger?.contains(event.target))toggleSimNotifications(false)});window.addEventListener("DOMContentLoaded",renderSimNotifications);
