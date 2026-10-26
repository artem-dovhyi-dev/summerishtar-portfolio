(() => {
  const projects = window.PROJECTS;
  const img = (name) => `assets/img/${name}.webp`;
  const $ = (sel, root = document) => root.querySelector(sel);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Small bits ----------
  $('#year').textContent = new Date().getFullYear();
  $('#email').textContent = window.SITE.email;
  $('#count').textContent = `(${projects.length})`;

  const clock = $('#clock');
  const tick = () => {
    clock.textContent = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok',
    }).format(new Date());
  };
  tick();
  setInterval(tick, 20_000);

  $('#copy').addEventListener('click', async () => {
    const hint = $('#copy .copy__hint');
    try {
      await navigator.clipboard.writeText(window.SITE.email);
      hint.textContent = hint.dataset.done;
    } catch {
      location.href = `mailto:${window.SITE.email}`;
    }
    setTimeout(() => (hint.textContent = 'Copy'), 1800);
  });

  // ---------- Marquee ----------
  const marquee = $('#marquee');
  const loop = [...projects, ...projects];
  marquee.innerHTML = loop
    .map(
      (p, i) => `<a href="#work/${p.slug}" style="--tone:${p.tone}" ${i >= projects.length ? 'aria-hidden="true" tabindex="-1"' : ''}>
        <img src="${img(p.cover)}" alt="${i >= projects.length ? '' : p.title}" loading="lazy" decoding="async" />
      </a>`
    )
    .join('');

  // ---------- Grid ----------
  // Rhythm of card widths: wide/narrow alternates per row so the grid feels editorial.
  const layout = ['wide', 'narrow', 'narrow', 'wide', '', ''];
  const grid = $('#grid');
  grid.innerHTML = projects
    .map(
      (p, i) => `<a class="card reveal ${layout[i % layout.length]}" href="#work/${p.slug}" data-tags="${p.tags.join('|')}" style="--tone:${p.tone}">
        <div class="card__media">
          <img src="${img(p.cover)}" alt="${p.title}" loading="lazy" decoding="async" />
          <div class="card__chips">${p.tags.map((t) => `<span>${t}</span>`).join('')}</div>
        </div>
        <div class="card__info">
          <h3 class="card__title">${p.title} <small>${p.subtitle}</small></h3>
          <span class="card__num">${String(i + 1).padStart(2, '0')}</span>
        </div>
      </a>`
    )
    .join('');

  // ---------- Filters ----------
  const filters = ['All', ...new Set(projects.flatMap((p) => p.tags))];
  const filterBar = $('#filters');
  filterBar.innerHTML = filters
    .map((f, i) => `<button role="tab" aria-selected="${i === 0}" data-filter="${f}">${f}</button>`)
    .join('');
  filterBar.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const f = btn.dataset.filter;
    filterBar.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', b === btn));
    const cards = [...grid.children];
    let shown = 0;
    cards.forEach((c) => {
      const match = f === 'All' || c.dataset.tags.split('|').includes(f);
      c.classList.toggle('hidden', !match);
      // Re-flow wide/narrow rhythm over the visible cards only
      c.classList.remove('wide', 'narrow');
      if (match) {
        const cls = layout[shown % layout.length];
        if (cls) c.classList.add(cls);
        shown++;
      }
    });
    $('#count').textContent = `(${shown})`;
  });

  // ---------- Reveal on scroll ----------
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      }),
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );
  const observeReveals = (root = document) => root.querySelectorAll('.reveal:not(.in)').forEach((el) => io.observe(el));
  observeReveals();

  // Count-up stats
  const countIO = new IntersectionObserver((entries) =>
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      countIO.unobserve(en.target);
      const el = en.target;
      const to = +el.dataset.count;
      const from = to > 1000 ? to - 40 : 0;
      if (reduceMotion) return;
      const t0 = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - t0) / 1400);
        const eased = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(from + (to - from) * eased);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    })
  );
  document.querySelectorAll('[data-count]').forEach((el) => countIO.observe(el));

  // ---------- Cursor ----------
  const cursor = $('.cursor');
  let cx = 0, cy = 0, tx = 0, ty = 0;
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    tx = e.clientX;
    ty = e.clientY;
    cursor.classList.add('on');
    const overCard = e.target.closest('.card, .marquee__track a');
    cursor.classList.toggle('big', !!overCard);
  });
  document.addEventListener('pointerleave', () => cursor.classList.remove('on'));
  const follow = () => {
    cx += (tx - cx) * 0.22;
    cy += (ty - cy) * 0.22;
    cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(follow);
  };
  follow();

  // ---------- Case study overlay (hash routed: #work/<slug>) ----------
  const caseEl = $('#case');
  const caseScroll = $('#case-scroll');
  const caseBody = $('#case-body');
  let lastScroll = 0;

  const figure = (name, title) =>
    `<figure class="reveal"><img src="${img(name)}" alt="${title}" loading="lazy" decoding="async" /></figure>`;

  const renderCase = (p) => {
    const i = projects.indexOf(p);
    const next = projects[(i + 1) % projects.length];
    const facts = [
      ['Discipline', p.discipline],
      p.client && ['Client', p.client],
      p.year && ['Year', p.year],
      ['Category', p.tags.join(', ')],
    ].filter(Boolean);
    const cols = [
      p.problem && `<div><h3>The problem</h3><p>${p.problem}</p></div>`,
      p.solution && `<div><h3>${p.problem ? 'The solution' : 'My role'}</h3><p>${p.solution}</p></div>`,
    ].filter(Boolean);

    caseBody.style.setProperty('--tone', p.tone);
    caseBody.innerHTML = `
      <p class="case__eyebrow">${String(i + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}</p>
      <h1 class="case__title" id="case-title">${p.title}</h1>
      <p class="case__subtitle">${p.subtitle}</p>
      <div class="case__hero"><img src="${img(p.hero || p.cover)}" alt="${p.title}" /></div>
      <div class="case__meta">
        <ul class="case__facts">${facts.map(([k, v]) => `<li><span>${k}</span><span>${v}</span></li>`).join('')}</ul>
        <div>
          <p class="case__intro">${p.intro}</p>
          ${cols.length ? `<div class="case__cols">${cols.join('')}</div>` : ''}
        </div>
      </div>
      <div class="case__gallery">
        ${p.gallery
          .map((g) => (Array.isArray(g) ? `<div class="case__row">${g.map((n) => figure(n, p.title)).join('')}</div>` : figure(g, p.title)))
          .join('')}
      </div>
      <a class="case__next" href="#work/${next.slug}"><small>Next project</small><strong>${next.title}</strong></a>
    `;
    caseScroll.scrollTop = 0;
    caseBody.querySelectorAll('.reveal').forEach((el) => caseIO.observe(el));
  };

  const caseIO = new IntersectionObserver(
    (entries) => entries.forEach((en) => en.isIntersecting && en.target.classList.add('in')),
    { root: caseScroll, threshold: 0.05 }
  );

  const openCase = (slug) => {
    const p = projects.find((x) => x.slug === slug);
    if (!p) return closeCase();
    renderCase(p);
    if (caseEl.hidden) {
      lastScroll = scrollY;
      caseEl.hidden = false;
      document.body.classList.add('locked');
      requestAnimationFrame(() => requestAnimationFrame(() => caseEl.classList.add('open')));
      $('#case-close').focus({ preventScroll: true });
    }
    document.title = `${p.title} · Thet Htar San`;
  };

  const closeCase = () => {
    if (caseEl.hidden) return;
    caseEl.classList.remove('open');
    document.body.classList.remove('locked');
    document.title = 'Thet Htar San (Summer) · Visual Designer';
    setTimeout(() => (caseEl.hidden = true), reduceMotion ? 0 : 600);
    scrollTo({ top: lastScroll, behavior: 'instant' });
  };

  const route = () => {
    const m = location.hash.match(/^#work\/(.+)$/);
    if (m) openCase(m[1]);
    else closeCase();
  };

  const dismiss = () => history.pushState(null, '', '#work') || closeCase();
  $('#case-close').addEventListener('click', dismiss);
  caseEl.addEventListener('click', (e) => e.target === caseEl && dismiss());
  addEventListener('keydown', (e) => e.key === 'Escape' && !caseEl.hidden && dismiss());
  addEventListener('hashchange', route);
  route();
})();
