/* BitGold V5.3 — local, privacy-friendly simulation onboarding. */
(() => {
  if (!/^\/investir\/?$/.test(location.pathname)) return;
  const key = 'bitgold:onboarding:v1';
  const steps = [
    {label:'Explorer les marchés',href:'#marches'},
    {label:'Ouvrir votre portefeuille virtuel',href:'/#dashboard'},
    {label:'Comparer les stratégies de bots',href:'/#bots'}
  ];
  const init = () => {
    if (document.getElementById('bitgoldOnboarding')) return;
    const market = document.getElementById('marches');
    if (!market) return;
    const section = document.createElement('section');
    section.id = 'bitgoldOnboarding';
    section.className = 'bitgold-onboarding';
    section.setAttribute('aria-label','Vos premiers pas sur BitGold');
    const title = document.createElement('h2'); title.textContent = 'Vos premiers pas dans la simulation';
    const info = document.createElement('p');
    info.textContent = 'Explorez à votre rythme. Votre progression reste sur cet appareil ; aucune opération réelle.';
    const progress = document.createElement('p'); progress.setAttribute('role','status');
    const list = document.createElement('ol');
    const read = () => { try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch { return {}; } };
    const track = event => window.dispatchEvent(new CustomEvent('bitgold:analytics',{detail:{event,page:'/investir',source:'onboarding'}}));
    const render = () => {
      const done = read();
      list.replaceChildren();
      steps.forEach((step,i) => {
        const li=document.createElement('li');
        const label=document.createElement('label');
        const check=document.createElement('input'); check.type='checkbox'; check.checked=Boolean(done[i]);
        check.setAttribute('aria-label','Étape terminée : '+step.label);
        check.addEventListener('change',() => {
          const next=read(); next[i]=check.checked;
          try { localStorage.setItem(key,JSON.stringify(next)); } catch {}
          track('onboarding_step_'+(check.checked?'complete':'reopen'));
          render();
        });
        const link=document.createElement('a'); link.href=step.href; link.textContent=step.label;
        label.append(check,' ',link); li.append(label); list.append(li);
      });
      const count=steps.filter((_,i)=>done[i]).length;
      progress.textContent=count+' étape'+(count>1?'s':'')+' sur '+steps.length+' terminée'+(count>1?'s':'');
      if(count===steps.length) track('onboarding_all_steps_complete');
    };
    section.append(title,info,progress,list);
    market.parentNode.insertBefore(section,market);
    render();
    track('onboarding_view');
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();