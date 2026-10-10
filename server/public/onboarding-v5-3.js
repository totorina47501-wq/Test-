/* BitGold V5.3 – contextual onboarding with device-only analytics. */
(() => {
  const path = window.location.pathname;
  if (!/^\/investir\/?$/.test(path) && path !== '/' && path !== '/index.html') return;
  const progressKey = 'bitgold:onboarding:v2';
  const analyticsKey = 'bitgold:onboarding:metrics:v1';
  const sessionKey = 'bitgold:onboarding:session:v1';
  const maxEntries = 120;
  const eventNames = new Set(['onboarding_view','onboarding_complete','onboarding_step_complete','onboarding_first_trade','onboarding_return_d1']);
  const isAuthed = () => document.body.classList.contains('is-authenticated');
  const isInvestir = () => /^\/investir\/?$/.test(path);
  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
  function write(key,value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
  function track(event) {
    if (!eventNames.has(event)) return;
    try {
      const metrics = read(analyticsKey,[]);
      const now = new Date().toISOString();
      metrics.push({event,at:now});
      write(analyticsKey,metrics.slice(-maxEntries));
      window.dispatchEvent(new CustomEvent('bitgold:analytics',{detail:{event,page:path,source:'onboarding',storage:'local'}}));
    } catch {}
  }
  const steps = [
    {title:'Explorer les marchés',href:'/investir#marches',id:'markets'},
    {title:'Découvrir le portefeuille virtuel',href:'/#dashboard',id:'wallet'},
    {title:'Réaliser votre première opération simulée',href:'/investir#marches',id:'trade'},
    {title:'Comparer les stratégies',href:'/#bots',id:'bots'}
  ];
  function completion() {
    const done=read(progressKey,{});
    if (!done || typeof done !== 'object') return {};
    return done;
  }
  function complete(id) {
    if(!steps.some(x=>x.id===id))return;
    const done=completion();
    if(done[id])return;
    done[id]=true;write(progressKey,done);track('onboarding_step_complete');
    window.dispatchEvent(new Event('bitgold:onboarding:update'));
    if(steps.every(x=>done[x.id]))track('onboarding_complete');
  }
  function d1() {
    if(!isAuthed())return;
    const session=read(sessionKey,{});
    const now=Date.now();
    if(!Number.isFinite(session.firstSeen) || session.firstSeen>now){ write(sessionKey,{firstSeen:now,lastSeen:now,returnedD1:false});return; }
    const delta=now-session.firstSeen;
    if(delta >= 86400000 && delta < 172800000 && !session.returnedD1){
      session.returnedD1=true;track('onboarding_return_d1');
    }
    session.lastSeen=now;write(sessionKey,session);
  }
  function init(){
    const anchor=document.getElementById('marches') || document.getElementById('dashboard');
    if(!anchor || document.getElementById('bitgoldOnboarding'))return;
    const box=document.createElement('section');box.id='bitgoldOnboarding';box.className='bitgold-onboarding auth-only';
    box.setAttribute('aria-label','Guide de démarrage de votre simulation');
    const title=document.createElement('h2');title.textContent='Bienvenue dans votre espace de simulation';
    const desc=document.createElement('p');desc.textContent='Suivez vos premiers pas. Seules des données de progression anonymes sont enregistrées sur cet appareil.';
    const progress=document.createElement('p');progress.setAttribute('role','status');progress.setAttribute('aria-live','polite');
    const list=document.createElement('ol');
    const draw=()=>{
      box.hidden=!isAuthed();
      const done=completion();
      const count=steps.filter(x=>done[x.id]).length;
      progress.textContent=count+' étape'+(count>1?'s':'')+' sur '+steps.length+' terminée'+(count>1?'s':'');
      list.replaceChildren();
      steps.forEach(step=>{
        const li=document.createElement('li');
        const badge=document.createElement('span');badge.className='bitgold-onboarding-badge';badge.textContent=done[step.id]?'✓':'○';
        badge.setAttribute('aria-label',done[step.id]?'Terminé':'À découvrir');
        const link=document.createElement('a');link.href=step.href;link.textContent=step.title;
        link.addEventListener('click',()=>{if(step.id==='markets'||step.id==='wallet')complete(step.id);});
        li.append(badge,' ',link);list.append(li);
      });
    };
    box.append(title,desc,progress,list);
    anchor.parentNode.insertBefore(box,anchor);
    let wasAuthed=isAuthed();
    const observer=new MutationObserver(()=>{const nowAuthed=isAuthed();if(nowAuthed&&!wasAuthed){track('onboarding_view');if(isInvestir())complete('markets');}wasAuthed=nowAuthed;draw();d1();});
    observer.observe(document.body,{attributes:true,attributeFilter:['class']});
    window.addEventListener('bitgold:onboarding:update',draw);
    window.addEventListener('bitgold:wallet-loaded',e=>{
      if(!isAuthed())return;
      complete('wallet');
    });
    window.addEventListener('bitgold:simulated-trade',()=>{if(isAuthed()){complete('trade');track('onboarding_first_trade');}});
    const markBotsVisited=()=>{if(isAuthed() && (location.hash==='#bots' || location.hash.startsWith('#bots-')))complete('bots');};
    window.addEventListener('hashchange',markBotsVisited);
    markBotsVisited();
    if(isInvestir() && isAuthed())complete('markets');
    if(isAuthed()){track('onboarding_view');d1();}
    draw();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();