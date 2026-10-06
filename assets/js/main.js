/* Tapcore Media — interactions. Vanilla JS, no dependencies. */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const fmt = (n) => Math.round(n).toLocaleString("en-US");

  const yearEl = $("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Visibility helper: run loops only on screen ---------- */
  function onVisible(el, start, stop) {
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { rootMargin: "100px" });
    io.observe(el);
  }

  /* ---------- Nav: hide on scroll down, active section ---------- */
  const nav = $("#nav");
  const burger = $(".burger");
  const menu = $("#menu");
  let lastY = scrollY;

  function setMenu(open) {
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add("open"));
      document.body.style.overflow = "hidden";
    } else {
      menu.classList.remove("open");
      document.body.style.overflow = "";
      setTimeout(() => { if (!menu.classList.contains("open")) menu.hidden = true; }, 700);
    }
  }
  burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && menu.classList.contains("open")) setMenu(false); });

  const navLinks = $$(".nav-links a");
  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("section[id]").forEach((s) => sectionIO.observe(s));

  /* ---------- Reveal on scroll (auto-stagger siblings) ---------- */
  const reveals = $$(".reveal");
  reveals.forEach((el) => {
    const sibs = Array.from(el.parentElement.children).filter((c) => c.classList.contains("reveal"));
    const i = sibs.indexOf(el);
    if (i > 0) el.style.setProperty("--rd", Math.min(i, 6) * 80 + "ms");
  });
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); revealIO.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  reveals.forEach((el) => revealIO.observe(el));
  $$(".card").forEach((el) => revealIO.observe(el));

  /* ---------- Counters ---------- */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countIO.unobserve(e.target);
      const el = e.target, end = +el.dataset.count;
      if (reduced) { el.textContent = fmt(end); return; }
      const t0 = performance.now(), dur = 1800;
      const tick = (t) => {
        const p = clamp((t - t0) / dur, 0, 1);
        el.textContent = fmt(end * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  $$("[data-count]").forEach((el) => countIO.observe(el));

  /* ---------- Hero: rotating word ---------- */
  const rot = $(".rot-word");
  if (rot && !reduced) {
    const words = ["installs", "registrations", "deposits", "trades", "purchases", "sales"];
    let wi = 0;
    setInterval(() => {
      if (document.hidden) return;
      rot.classList.add("out");
      setTimeout(() => {
        wi = (wi + 1) % words.length;
        rot.textContent = words[wi];
        rot.classList.remove("out");
        rot.classList.add("in");
        void rot.offsetWidth;
        rot.classList.remove("in");
      }, 450);
    }, 2400);
  }

  /* ---------- Hero: live phone (illustrative UI) ---------- */
  const ticker = $("[data-ticker]");
  const feed = $(".feed");
  const events = [
    ["I", "#2B5BFF", "New install", "Brazil · Android"],
    ["R", "#23C4E8", "Registration", "India · iOS"],
    ["$", "#0B1B33", "First deposit", "Mexico · Android"],
    ["✕", "#FF6B4D", "Bot install blocked", "Fraud filter"],
    ["T", "#8B6CFF", "Trade placed", "Turkey · iOS"],
    ["I", "#2B5BFF", "New install", "Indonesia · Android"],
    ["P", "#14C47F", "Purchase", "UAE · iOS"],
    ["R", "#23C4E8", "Registration", "Philippines · Android"],
  ];
  let installs = 12480, ei = 0, phoneTimer = null;
  const toasts = [];
  function pushToast() {
    const [ic, c, t, s] = events[ei++ % events.length];
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<i style="background:${c}">${ic}</i><div><b>${t}</b><small>${s}</small></div>`;
    el.style.transform = "translateY(110%)";
    el.style.opacity = "0";
    feed.appendChild(el);
    toasts.unshift(el);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      toasts.forEach((n, i) => {
        n.style.transform = `translateY(${-i * 50}px)`;
        n.style.opacity = i > 3 ? "0" : "1";
      });
    }));
    if (toasts.length > 5) toasts.pop().remove();
  }
  function phoneStep() {
    installs += 1 + Math.floor(Math.random() * 6);
    ticker.textContent = fmt(installs);
    pushToast();
  }
  if (feed && ticker) {
    pushToast(); pushToast(); pushToast();
    if (!reduced) {
      onVisible($(".phone"),
        () => { if (!phoneTimer) phoneTimer = setInterval(() => { if (!document.hidden) phoneStep(); }, 1700); },
        () => { clearInterval(phoneTimer); phoneTimer = null; });
    }
  }

  /* Phone tilt follows pointer */
  const phone = $(".phone");
  const hero = $(".hero");
  if (phone && finePointer && !reduced) {
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      phone.style.setProperty("--ry", (x * 18).toFixed(2) + "deg");
      phone.style.setProperty("--rx", (-y * 14).toFixed(2) + "deg");
    });
    hero.addEventListener("pointerleave", () => {
      phone.style.setProperty("--ry", "0deg");
      phone.style.setProperty("--rx", "0deg");
    });
  }

  /* ---------- Cursor + magnetic buttons ---------- */
  if (finePointer && !reduced) {
    const cur = $(".cursor");
    let mx = -100, my = -100, cx = -100, cy = -100, raf = null;
    const loop = () => {
      cx += (mx - cx) * 0.22; cy += (my - cy) * 0.22;
      cur.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = Math.abs(mx - cx) + Math.abs(my - cy) > 0.3 ? requestAnimationFrame(loop) : null;
    };
    addEventListener("pointermove", (e) => {
      mx = e.clientX; my = e.clientY;
      cur.classList.add("on");
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener("pointerleave", () => cur.classList.remove("on"));
    const bigSel = "a, button, .fmt, .track span, select, input, textarea";
    document.addEventListener("pointerover", (e) => cur.classList.toggle("big", !!e.target.closest(bigSel)));

    $$(".magnetic").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        b.style.setProperty("--bx", ((e.clientX - r.left - r.width / 2) * 0.25).toFixed(1) + "px");
        b.style.setProperty("--by", ((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1) + "px");
      });
      b.addEventListener("pointerleave", () => { b.style.setProperty("--bx", "0px"); b.style.setProperty("--by", "0px"); });
    });
  }

  /* ---------- Buying models: journey + tabs ---------- */
  const MODELS = {
    cpi: { step: 2, big: "CPI", title: "A user installs your app.", desc: "Cost per install." },
    cpr: { step: 3, big: "CPR", title: "A user registers.", desc: "Cost per registration." },
    cpa: { step: 4, big: "CPA", title: "A user takes an in-app action.", desc: "Cost per in-app action, such as a deposit, trade or purchase." },
    cps: { step: 5, big: "CPS", title: "A user completes a sale.", desc: "Cost per sale." },
    rev: { step: 6, big: "REV", title: "Your users generate revenue.", desc: "A share of the revenue your users generate." },
    cpc: { step: 1, big: "CPC", title: "A user clicks or sees your ad.", desc: "Click or impression buying, where it fits the goal." },
  };
  const tabs = $$(".model-tabs button");
  const card = $(".model-card");
  const jInner = $(".j-inner");
  const steps = $$(".j-steps li");
  const mTitle = $(".m-title"), mDesc = $(".m-desc");
  let autoTimer = null, userPicked = false;

  function selectModel(key, fromUser) {
    const m = MODELS[key];
    tabs.forEach((t) => t.setAttribute("aria-selected", String(t.dataset.model === key)));
    steps.forEach((s, i) => {
      s.classList.toggle("on", i === m.step);
      s.classList.toggle("done", i < m.step);
    });
    jInner.style.setProperty("--p", (m.step / 6) * 100 + "%");
    card.setAttribute("data-big", m.big);
    mTitle.textContent = m.title;
    mDesc.textContent = m.desc;
    [mTitle, mDesc].forEach((el) => { el.classList.remove("swap"); void el.offsetWidth; el.classList.add("swap"); });
    if (fromUser) { userPicked = true; clearInterval(autoTimer); }
  }
  tabs.forEach((t) => {
    t.addEventListener("click", () => selectModel(t.dataset.model, true));
    t.addEventListener("keydown", (e) => {
      const i = tabs.indexOf(t);
      let n = null;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") n = (i + 1) % tabs.length;
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length;
      if (n !== null) { e.preventDefault(); tabs[n].focus(); selectModel(tabs[n].dataset.model, true); }
    });
  });
  steps.forEach((s) => {
    s.style.cursor = "pointer";
    s.addEventListener("click", () => {
      const i = +s.dataset.step;
      const key = Object.keys(MODELS).find((k) => MODELS[k].step === i) || (i === 0 ? "cpc" : null);
      if (key) selectModel(key, true);
    });
  });
  if (card) {
    selectModel("cpi");
    if (!reduced) {
      const order = ["cpi", "cpr", "cpa", "cps", "rev", "cpc"];
      let oi = 0;
      onVisible(card,
        () => { if (!userPicked && !autoTimer) autoTimer = setInterval(() => { if (!document.hidden) selectModel(order[++oi % order.length]); }, 3200); },
        () => { clearInterval(autoTimer); autoTimer = null; });
    }
  }

  /* ---------- Formats: drag to scroll ---------- */
  const scroller = $(".fmt-scroller");
  if (scroller && finePointer) {
    let down = false, sx = 0, sl = 0, moved = false;
    scroller.addEventListener("pointerdown", (e) => { down = true; moved = false; sx = e.clientX; sl = scroller.scrollLeft; });
    addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 4) { moved = true; scroller.classList.add("drag"); }
      scroller.scrollLeft = sl - dx;
    });
    addEventListener("pointerup", () => { down = false; scroller.classList.remove("drag"); });
    scroller.addEventListener("click", (e) => { if (moved) e.preventDefault(); }, true);
    scroller.addEventListener("wheel", (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const max = scroller.scrollWidth - scroller.clientWidth;
        const next = scroller.scrollLeft + e.deltaY;
        if (next > 0 && next < max) { e.preventDefault(); scroller.scrollLeft = next; }
      }
    }, { passive: false });
  }

  /* ---------- Scroll-linked: progress, nav, stacking cards, steps ---------- */
  const bar = $(".progress span");
  const cards = $$(".card");
  const stepsWrap = $(".steps");
  const stepEls = $$(".step");
  const isDesktop = () => innerWidth > 760;
  let ticking = false;

  function onScroll() {
    ticking = false;
    const y = scrollY;
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? y / h : 0})`;

    if (!menu.classList.contains("open")) nav.classList.toggle("hide", y > lastY && y > 200);
    lastY = y;

    if (isDesktop() && !reduced) {
      cards.forEach((c, i) => {
        const next = cards[i + 1];
        if (!next) return;
        const top = parseFloat(getComputedStyle(c).top) || 100;
        const dist = next.getBoundingClientRect().top - top;
        const p = clamp(1 - dist / c.offsetHeight, 0, 1);
        c.style.transform = `scale(${1 - p * 0.06})`;
        c.style.opacity = String(1 - p * 0.35);
      });
    } else {
      cards.forEach((c) => { c.style.transform = ""; c.style.opacity = ""; });
    }

    if (stepsWrap) {
      const r = stepsWrap.getBoundingClientRect();
      const p = clamp((innerHeight * 0.75 - r.top) / (r.height + innerHeight * 0.2), 0, 1);
      stepsWrap.style.setProperty("--sp", p.toFixed(3));
      stepEls.forEach((s, i) => s.classList.toggle("lit", p >= (i / stepEls.length) + 0.02));
    }
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();

  /* ---------- Canvas helper ---------- */
  function setupCanvas(cv) {
    const ctx = cv.getContext("2d");
    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const r = cv.getBoundingClientRect();
      cv.width = Math.round(r.width * dpr);
      cv.height = Math.round(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w: r.width, h: r.height };
    };
    return { ctx, size };
  }
  function animate(cv, frame) {
    let raf = null, last = 0;
    const loop = (t) => {
      const dt = Math.min((t - (last || t)) / 1000, 0.05);
      last = t;
      frame(dt, t / 1000);
      raf = requestAnimationFrame(loop);
    };
    onVisible(cv,
      () => { if (!raf) { last = 0; raf = requestAnimationFrame(loop); } },
      () => { cancelAnimationFrame(raf); raf = null; });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
    });
  }

  /* ---------- Supply: dotted globe ---------- */
  const globe = $(".globe");
  if (globe) {
    const { ctx, size } = setupCanvas(globe);
    let W = 0, H = 0;
    const resize = () => ({ w: W, h: H } = size());
    resize();
    addEventListener("resize", resize);

    // Fibonacci sphere; a cheap pseudo-landmass mask makes it read as a planet.
    const N = 1600, pts = [];
    const land = (lat, lon) =>
      Math.sin(lat * 3.1 + 1.3) * Math.cos(lon * 2.2) + Math.sin(lon * 1.3 + lat * 1.7) * 0.8 + Math.cos(lat * 5 - lon * 0.7) * 0.35 > 0.05;
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = i * 2.399963;
      const x = Math.cos(th) * r, z = Math.sin(th) * r;
      const lat = Math.asin(y), lon = Math.atan2(z, x);
      pts.push({ x, y, z, land: land(lat, lon) });
    }
    const landPts = pts.filter((p) => p.land);
    const arcs = [];
    const pings = [];
    let rot = 0;
    const tilt = -0.35;

    const project = (p, R, cx, cy) => {
      const cr = Math.cos(rot), sr = Math.sin(rot);
      let x = p.x * cr - p.z * sr;
      let z = p.x * sr + p.z * cr;
      const ct = Math.cos(tilt), st = Math.sin(tilt);
      const y = p.y * ct - z * st;
      z = p.y * st + z * ct;
      return { x: cx + x * R, y: cy - y * R, z };
    };

    const draw = (dt) => {
      if (!W) return;
      rot += dt * 0.18;
      const R = Math.min(W, H) * 0.42, cx = W / 2, cy = H * 0.47;
      ctx.clearRect(0, 0, W, H);

      // glow
      const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R * 1.15);
      g.addColorStop(0, "rgba(228,242,255,1)");
      g.addColorStop(0.7, "rgba(228,242,255,.55)");
      g.addColorStop(1, "rgba(228,242,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.15, 0, Math.PI * 2); ctx.fill();

      for (const p of pts) {
        const q = project(p, R, cx, cy);
        if (q.z < -0.1 && !p.land) continue;
        const front = q.z > 0;
        const a = front ? 0.35 + q.z * 0.65 : 0.08;
        ctx.fillStyle = p.land ? `rgba(43,91,255,${a})` : `rgba(11,27,51,${a * 0.3})`;
        const s = p.land ? (front ? 1.6 + q.z * 1.8 : 1) : 1.2;
        ctx.fillRect(q.x - s / 2, q.y - s / 2, s, s);
      }

      // traffic arcs between front-facing points
      if (arcs.length < 7 && Math.random() < dt * 3) {
        const a = landPts[(Math.random() * landPts.length) | 0];
        const b = landPts[(Math.random() * landPts.length) | 0];
        if (a !== b) arcs.push({ a, b, t: 0 });
      }
      for (let i = arcs.length - 1; i >= 0; i--) {
        const arc = arcs[i];
        arc.t += dt * 0.55;
        const A = project(arc.a, R, cx, cy), B = project(arc.b, R, cx, cy);
        if (arc.t > 1.6 || A.z < 0 || B.z < 0) {
          if (arc.t > 1 && A.z >= 0 && B.z >= 0) pings.push({ x: B.x, y: B.y, t: 0 });
          arcs.splice(i, 1); continue;
        }
        const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
        const dx = mx - cx, dy = my - cy, d = Math.hypot(dx, dy) || 1;
        const lift = Math.hypot(B.x - A.x, B.y - A.y) * 0.45;
        const qx = mx + (dx / d) * lift, qy = my + (dy / d) * lift;
        const head = clamp(arc.t, 0, 1), tail = clamp(arc.t - 0.6, 0, 1);
        ctx.beginPath();
        for (let s = tail; s <= head; s += 0.04) {
          const u = 1 - s;
          const px = u * u * A.x + 2 * u * s * qx + s * s * B.x;
          const py = u * u * A.y + 2 * u * s * qy + s * s * B.y;
          s === tail ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.strokeStyle = "rgba(35,196,232,.9)";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.stroke();
      }
      for (let i = pings.length - 1; i >= 0; i--) {
        const p = pings[i];
        p.t += dt;
        if (p.t > 1.2) { pings.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 + p.t * 18, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(150,200,40,${1 - p.t / 1.2})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#B5E03A";
        ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2); ctx.fill();
      }
    };
    if (reduced) { draw(0); } else animate(globe, draw);
  }

  /* ---------- Quality: traffic filter ---------- */
  const filter = $(".filter");
  if (filter) {
    const { ctx, size } = setupCanvas(filter);
    const blockedEl = $("[data-blocked]");
    let W = 0, H = 0, blocked = 0;
    const resize = () => ({ w: W, h: H } = size());
    resize();
    addEventListener("resize", resize);
    const parts = [];
    const sparks = [];

    const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); };

    const draw = (dt, t) => {
      if (!W) return;
      ctx.clearRect(0, 0, W, H);
      const gate = W * 0.48, appX = W - 46, appY = H / 2;

      // spawn
      if (Math.random() < dt * 14) {
        parts.push({ x: -6, y: 16 + Math.random() * (H - 32), v: 70 + Math.random() * 70, bad: Math.random() < 0.24, stage: 0, a: 1, vy: 0 });
      }

      // gate
      const gg = ctx.createLinearGradient(gate - 30, 0, gate + 30, 0);
      gg.addColorStop(0, "rgba(43,91,255,0)");
      gg.addColorStop(0.5, "rgba(43,91,255,.12)");
      gg.addColorStop(1, "rgba(43,91,255,0)");
      ctx.fillStyle = gg;
      ctx.fillRect(gate - 30, 0, 60, H);
      ctx.setLineDash([6, 8]);
      ctx.lineDashOffset = -t * 30;
      ctx.strokeStyle = "rgba(43,91,255,.55)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(gate, 8); ctx.lineTo(gate, H - 8); ctx.stroke();
      ctx.setLineDash([]);

      // labels
      ctx.font = "600 11px 'DM Sans', sans-serif";
      ctx.fillStyle = "rgba(11,27,51,.45)";
      ctx.fillText("INCOMING TRAFFIC", 12, 20);
      ctx.fillText("ANTI-FRAUD FILTER", gate + 10, 20);

      // app target
      const ag = ctx.createLinearGradient(appX - 26, appY - 26, appX + 26, appY + 26);
      ag.addColorStop(0, "#2B5BFF"); ag.addColorStop(1, "#23C4E8");
      ctx.shadowColor = "rgba(43,91,255,.45)"; ctx.shadowBlur = 20;
      rr(appX - 26, appY - 26, 52, 52, 14); ctx.fillStyle = ag; ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff";
      ctx.font = "700 12px 'Outfit', sans-serif";
      ctx.textAlign = "center"; ctx.fillText("APP", appX, appY + 4); ctx.textAlign = "left";

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        if (p.stage === 0) {
          p.x += p.v * dt;
          if (p.x >= gate - 4) {
            if (p.bad) {
              p.stage = 2; p.v = -p.v * 0.35; p.vy = (Math.random() - 0.5) * 80;
              blocked++; if (blockedEl) blockedEl.textContent = fmt(blocked);
              sparks.push({ x: gate, y: p.y, t: 0 });
            } else p.stage = 1;
          }
        } else if (p.stage === 1) {
          // pass: steer into the app
          const dx = appX - p.x, dy = appY - p.y, d = Math.hypot(dx, dy);
          const sp = p.v * 1.5;
          p.x += (dx / d) * sp * dt; p.y += (dy / d) * sp * dt;
          if (d < 24) { parts.splice(i, 1); continue; }
        } else {
          p.x += p.v * dt; p.y += p.vy * dt; p.a -= dt * 1.4;
          if (p.a <= 0) { parts.splice(i, 1); continue; }
        }
        ctx.globalAlpha = clamp(p.a, 0, 1);
        ctx.fillStyle = p.bad ? "#FF6B4D" : p.stage === 1 ? "#2B5BFF" : "#7C8AA3";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.bad ? 4 : 3.4, 0, Math.PI * 2); ctx.fill();
        if (p.stage === 1) {
          ctx.globalAlpha = 0.18;
          ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.t += dt * 2.2;
        if (s.t > 1) { sparks.splice(i, 1); continue; }
        ctx.strokeStyle = `rgba(255,107,77,${1 - s.t})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(s.x, s.y, 4 + s.t * 14, 0, Math.PI * 2); ctx.stroke();
      }
    };
    // Pre-warm so the stream is already flowing when it scrolls into view.
    for (let i = 0; i < 240; i++) draw(1 / 60, i / 60);
    if (reduced) { draw(0, 0); } else animate(filter, draw);
  }

  /* ---------- Contact form → prefilled email ---------- */
  const form = $("#leadForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const msg = $(".form-msg", form);
      const d = Object.fromEntries(new FormData(form));
      let ok = true;
      [["name", (v) => v.trim().length > 1], ["email", (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)]].forEach(([k, test]) => {
        const field = form.elements[k].closest(".field");
        const good = test(d[k] || "");
        field.classList.toggle("err", !good);
        ok = ok && good;
      });
      if (!ok) { msg.textContent = "Please add your name and a valid work email."; return; }
      const subject = `Test brief${d.app ? " — " + d.app : ""}`;
      const body = [
        `Name: ${d.name}`, `Email: ${d.email}`, `App: ${d.app || "-"}`,
        `Payable event: ${d.model}`, `Target GEO: ${d.geo || "-"}`, "", `KPI and budget:`, d.msg || "-",
      ].join("\n");
      location.href = `mailto:parth@tapcoremedia.net?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      msg.textContent = "Thanks! Your email app is opening with the brief ready to send.";
    });
  }
})();
