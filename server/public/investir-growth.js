/* BitGold /investir: conversion progressive, no external analytics or personal data. */
(() => {
  if (!/^\/investir\/?$/.test(location.pathname)) return;
  const ready = () => {
    const market = document.getElementById('marches');
    if (!market || document.getElementById('growthJourney')) return;
    const section = document.createElement('section');
    section.id = 'growthJourney';
    section.className = 'growth-journey';
    section.setAttribute('aria-labelledby', 'growthTitle');
    section.innerHTML = `<div class="growth-eyebrow">BITGOLD · SIMULATION GRATUITE</div>
      <h1 id="growthTitle">Découvrez la crypto sans engager votre argent.</h1>
      <p>Explorez les cours, testez vos hypothèses et apprenez à interpréter les risques.</p>
      <div class="growth-actions">
        <button type="button" class="btn btn-primary" data-growth-action="signup">Lancer la simulation gratuite</button>
        <a class="btn btn-ghost" href="#growthSteps">Voir comment ça marche</a>
      </div>
      <p class="growth-risk">Simulation pédagogique uniquement : aucun dépôt, aucun ordre réel, aucun rendement garanti. Les cryptoactifs sont volatils.</p>
      <div id="growthSteps" class="growth-steps" aria-label="Comment ça marche en trois étapes">
        <article><span aria-hidden="true">01</span><h2>Explorez</h2><p>Consultez les marchés et leurs variations.</p></article>
        <article><span aria-hidden="true">02</span><h2>Simulez</h2><p>Testez une stratégie avec un portefeuille virtuel.</p></article>
        <article><span aria-hidden="true">03</span><h2>Apprenez</h2><p>Comparez vos choix et les risques associés.</p></article>
      </div>`;
    market.parentNode.insertBefore(section, market);
    const bar = document.createElement('aside');
    bar.className = 'growth-sticky';
    bar.setAttribute('aria-label', 'Créer un portefeuille virtuel');
    bar.innerHTML = '<span>100 % simulation · sans argent réel</span><button type="button" class="btn btn-primary" data-growth-action="signup">Créer mon portefeuille virtuel</button>';
    document.body.append(bar);
    const sync = () => { bar.hidden = !document.querySelector('.visitor-hero:not([hidden])') && document.getElementById('authState')?.textContent?.toLowerCase().includes('connecté'); };
    const track = name => {
      try { window.dispatchEvent(new CustomEvent('bitgold:analytics', { detail: { event: name, page: '/investir' } })); } catch (_) {}
    };
    document.querySelectorAll('[data-growth-action="signup"]').forEach(button => button.addEventListener('click', () => {
      track('growth_cta_click');
      const signup = document.getElementById('heroSignup');
      const login = document.getElementById('topLogin');
      (signup || login)?.click();
    }));
    document.querySelector('a[href="#growthSteps"]')?.addEventListener('click', () => track('growth_how_it_works_click'));
    sync();
    new MutationObserver(sync).observe(document.getElementById('authState') || document.body, {childList:true,subtree:true});
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
