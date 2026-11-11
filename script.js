/* Martin Nyandigisi Mylles — portfolio interactions (no dependencies) */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  /* ---------- Theme toggle ---------- */
  const root = document.documentElement;
  const themeBtn = $('#theme-toggle');
  const themeMeta = $('meta[name="theme-color"]');
  const syncTheme = () => {
    const light = root.getAttribute('data-theme') === 'light';
    themeBtn.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
    if (themeMeta) themeMeta.setAttribute('content', light ? '#f6f8fb' : '#06080c');
    window.dispatchEvent(new Event('themechange'));
  };
  const setTheme = (theme, persist) => {
    if (!reduceMotion) {
      root.classList.add('theme-anim');
      setTimeout(() => root.classList.remove('theme-anim'), 400);
    }
    root.setAttribute('data-theme', theme);
    if (persist) { try { localStorage.setItem('theme', theme); } catch (e) { /* storage unavailable */ } }
    syncTheme();
  };
  themeBtn.addEventListener('click', () => {
    setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light', true);
  });
  // Follow OS changes unless the visitor has made an explicit choice
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    let saved = null;
    try { saved = localStorage.getItem('theme'); } catch (err) { /* ignore */ }
    if (!saved) setTheme(e.matches ? 'light' : 'dark', false);
  });
  syncTheme();

  /* ---------- Year ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Nav: scrolled state, progress bar, timeline fill ---------- */
  const nav = $('#nav');
  const progress = $('.progress');
  const timeline = $('#timeline');
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 24);

    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : 0);

    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const start = window.innerHeight * 0.6;
      const fill = Math.min(1, Math.max(0, (start - r.top) / r.height));
      timeline.style.setProperty('--fill', fill.toFixed(4));
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const toggle = $('.nav__toggle');
  const links = $('#nav-links');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    links.classList.toggle('is-open', open);
    nav.classList.toggle('menu-open', open);
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  $$('a', links).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && links.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });
  window.matchMedia('(min-width: 961px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* ---------- Active nav link ---------- */
  const navLinks = $$('.nav__link');
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navLinks.forEach(l => {
        const active = l.getAttribute('href') === `#${id}`;
        l.classList.toggle('is-active', active);
        if (active) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => sectionObserver.observe(s));

  /* ---------- Reveal on scroll ---------- */
  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        obs.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  $$('.reveal, .job').forEach(el => revealObserver.observe(el));

  /* ---------- Typed role ---------- */
  const typed = $('.typed');
  if (typed && !reduceMotion) {
    const words = JSON.parse(typed.dataset.words);
    let w = 0, i = words[0].length, deleting = true;
    const tick = () => {
      const word = words[w];
      if (deleting) {
        i--;
        typed.textContent = word.slice(0, i);
        if (i === 0) { deleting = false; w = (w + 1) % words.length; return setTimeout(tick, 280); }
        return setTimeout(tick, 34);
      }
      const next = words[w];
      i++;
      typed.textContent = next.slice(0, i);
      if (i === next.length) { deleting = true; return setTimeout(tick, 2200); }
      setTimeout(tick, 62);
    };
    setTimeout(tick, 2600);
  }

  /* ---------- Count-up stats ---------- */
  const counters = $$('[data-count]');
  if (!reduceMotion) {
    const countObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = +el.dataset.count;
        const dur = 1400;
        const t0 = performance.now();
        const step = (t) => {
          const p = Math.min(1, (t - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 4);
          el.textContent = Math.round(target * eased);
          if (p < 1) requestAnimationFrame(step);
        };
        el.textContent = '0';
        requestAnimationFrame(step);
        obs.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach(c => countObserver.observe(c));
  }

  /* ---------- ID badge: scan, verify, tilt ---------- */
  const badge = $('#badge');
  if (badge) {
    const img = $('img', badge);
    const verify = () => {
      if (reduceMotion) { badge.classList.add('is-verified'); return; }
      badge.classList.add('is-scanning');
      setTimeout(() => badge.classList.add('is-verified'), 2100);
    };
    if (img.complete) setTimeout(verify, 400); else img.addEventListener('load', () => setTimeout(verify, 400), { once: true });

    if (finePointer && !reduceMotion) {
      const stage = badge.parentElement;
      let raf = 0;
      stage.addEventListener('pointermove', (e) => {
        const r = badge.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          badge.classList.add('is-tilting');
          badge.style.setProperty('--ry', `${(px - 0.5) * 18}deg`);
          badge.style.setProperty('--rx', `${(0.5 - py) * 14}deg`);
          badge.style.setProperty('--mx', `${px * 100}%`);
          badge.style.setProperty('--my', `${py * 100}%`);
        });
      });
      stage.addEventListener('pointerleave', () => {
        cancelAnimationFrame(raf);
        badge.style.setProperty('--rx', '0deg');
        badge.style.setProperty('--ry', '0deg');
        setTimeout(() => badge.classList.remove('is-tilting'), 50);
      });
    }
  }

  /* ---------- Card spotlight ---------- */
  if (finePointer) {
    document.addEventListener('pointermove', (e) => {
      const card = e.target.closest && e.target.closest('.card');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--sx', `${e.clientX - r.left}px`);
      card.style.setProperty('--sy', `${e.clientY - r.top}px`);
    }, { passive: true });
  }

  /* ---------- MITRE ATT&CK row: sweep highlight ---------- */
  const attackCells = $$('#attack-row .attack-cell');
  if (attackCells.length) {
    const sweep = () => {
      attackCells.forEach((c, idx) => {
        setTimeout(() => c.classList.add('is-lit'), idx * 90);
        setTimeout(() => c.classList.remove('is-lit'), idx * 90 + 700);
      });
    };
    if (reduceMotion) {
      attackCells.forEach(c => c.classList.add('is-lit'));
    } else {
      let timer = null;
      new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !timer) { sweep(); timer = setInterval(sweep, 4200); }
        else if (!entry.isIntersecting && timer) { clearInterval(timer); timer = null; }
      }, { threshold: 0.4 }).observe($('#attack-row'));
    }
  }

  /* ---------- Experience: show more ---------- */
  $$('.job__more').forEach(btn => {
    const job = btn.closest('.job');
    const label = $('span', btn);
    const original = label.textContent;
    btn.addEventListener('click', () => {
      const open = !job.classList.contains('is-expanded');
      job.classList.toggle('is-expanded', open);
      btn.setAttribute('aria-expanded', String(open));
      label.textContent = open ? 'Show less' : original;
    });
  });

  /* ---------- Labs filter ---------- */
  const filters = $$('.filter');
  const labs = $$('.lab');
  const labsStatus = $('#labs-status');
  filters.forEach(btn => btn.addEventListener('click', () => {
    const type = btn.dataset.filter;
    filters.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    let shown = 0;
    labs.forEach(lab => {
      const match = type === 'all' || lab.dataset.type === type;
      if (lab.classList.contains('lab--more')) { lab.hidden = type !== 'all'; return; }
      lab.hidden = !match;
      lab.classList.remove('is-entering');
      if (match) {
        shown++;
        lab.classList.add('is-in');
        if (!reduceMotion) { void lab.offsetWidth; lab.classList.add('is-entering'); }
      }
    });
    labsStatus.textContent = `Showing ${shown} lab${shown === 1 ? '' : 's'}`;
  }));

  /* ---------- Copy email ---------- */
  const toast = $('#toast');
  let toastTimer;
  const showToast = (msg) => {
    $('span', toast).textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
  };
  $$('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
    const text = btn.dataset.copy;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Email copied to clipboard');
      const label = $('span', btn);
      label.textContent = 'Copied!';
      setTimeout(() => { label.textContent = 'Copy email'; }, 2000);
    } catch {
      window.location.href = `mailto:${text}`;
    }
  }));

  /* ---------- Terminal ---------- */
  const term = $('#terminal');
  if (term) {
    const P = '<span class="t-prompt">martin@soc</span>:<span class="t-path">~</span>$ ';
    const script = [
      { cmd: 'whoami' },
      { out: 'martin.mylles <span class="t-dim">// cybersecurity analyst</span>' },
      { cmd: 'cat profile.yml' },
      { out: '<span class="t-key">role:</span>      Systems &amp; Securities Infrastructure Officer' },
      { out: '<span class="t-key">org:</span>       COMESA Competition &amp; Consumer Commission' },
      { out: '<span class="t-key">focus:</span>     [soc_ops, threat_detection, incident_response]' },
      { out: '<span class="t-key">degree:</span>    B.Sc. IST — Forensic IT &amp; Cybercrime' },
      { out: '<span class="t-key">certs:</span>     HCIA-Security · CyberShujaa · CAISR · Google' },
      { out: '<span class="t-key">labs:</span>      40+ <span class="t-dim">(HTB · TryHackMe · CyberShujaa)</span>' },
      { cmd: 'systemctl status martin' },
      { out: '<span class="t-ok">●</span> martin.service — Blue Team Analyst' },
      { out: '   Active: <span class="t-ok">active (running)</span> since 2025' },
      { out: '   Status: <span class="t-ok">"open to SOC analyst roles"</span>' },
    ];

    const renderAll = () => {
      term.innerHTML = script.map(l => `<div class="t-line">${l.cmd ? P + l.cmd : l.out}</div>`).join('') +
        `<div class="t-line">${P}<span class="t-caret"></span></div>`;
    };

    const play = async () => {
      term.innerHTML = '';
      const wait = (ms) => new Promise(r => setTimeout(r, ms));
      for (const line of script) {
        const row = document.createElement('div');
        row.className = 't-line';
        term.appendChild(row);
        if (line.cmd) {
          row.innerHTML = P;
          const typedSpan = document.createElement('span');
          const caret = document.createElement('span');
          caret.className = 't-caret';
          row.append(typedSpan, caret);
          await wait(350);
          for (const ch of line.cmd) { typedSpan.textContent += ch; await wait(45 + Math.random() * 50); }
          await wait(250);
          caret.remove();
        } else {
          row.innerHTML = line.out;
          await wait(70);
        }
      }
      const end = document.createElement('div');
      end.className = 't-line';
      end.innerHTML = `${P}<span class="t-caret"></span>`;
      term.appendChild(end);
    };

    if (reduceMotion) {
      renderAll();
    } else {
      renderAll(); // reserve final height so layout doesn't jump
      term.style.minHeight = `${term.offsetHeight}px`;
      new IntersectionObserver(([entry], obs) => {
        if (entry.isIntersecting) { obs.disconnect(); play(); }
      }, { threshold: 0.35 }).observe(term);
    }
  }

  /* ---------- Hero network canvas ---------- */
  const canvas = $('.hero__canvas');
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = 1, nodes = [], running = false, rafId = 0;
    const mouse = { x: -9999, y: -9999 };
    const LINK = 140;
    let colors = {};
    const readColors = () => {
      const cs = getComputedStyle(document.documentElement);
      colors = {
        link: cs.getPropertyValue('--canvas-link').trim() || '52, 232, 184',
        node: cs.getPropertyValue('--canvas-node').trim() || 'rgba(180, 255, 235, 0.7)',
        alert: cs.getPropertyValue('--canvas-alert').trim() || '255, 181, 71',
        info: cs.getPropertyValue('--info-rgb').trim() || '92, 200, 255',
      };
    };
    readColors();
    window.addEventListener('themechange', readColors);

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(90, (w * h) / 16000));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.4 + 0.6,
        alert: Math.random() < 0.06,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;

        // gentle pull toward pointer
        const mdx = mouse.x - a.x, mdy = mouse.y - a.y;
        const md = Math.hypot(mdx, mdy);
        if (md < 180) { a.x += mdx * 0.004; a.y += mdy * 0.004; }

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = dx * dx + dy * dy;
          if (d < LINK * LINK) {
            const o = 1 - Math.sqrt(d) / LINK;
            ctx.strokeStyle = `rgba(${colors.link}, ${o * 0.22})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        if (md < 180) {
          ctx.strokeStyle = `rgba(${colors.info}, ${(1 - md / 180) * 0.35})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
      const t = performance.now() / 1000;
      for (const n of nodes) {
        if (n.alert) {
          const pulse = (Math.sin(t * 2 + n.x) + 1) / 2;
          ctx.fillStyle = `rgba(${colors.alert}, ${0.15 * pulse})`;
          ctx.beginPath(); ctx.arc(n.x, n.y, 6 + pulse * 6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = `rgba(${colors.alert}, 0.9)`;
        } else {
          ctx.fillStyle = colors.node;
        }
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      }
      rafId = requestAnimationFrame(draw);
    };

    const start = () => { if (!running) { running = true; rafId = requestAnimationFrame(draw); } };
    const stop = () => { running = false; cancelAnimationFrame(rafId); };

    resize();
    let resizeTimer;
    window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 200); });
    const hero = $('.hero');
    hero.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });

    let heroVisible = true;
    new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      heroVisible && !document.hidden ? start() : stop();
    }).observe(hero);
    document.addEventListener('visibilitychange', () => {
      document.hidden || !heroVisible ? stop() : start();
    });
  }
})();
