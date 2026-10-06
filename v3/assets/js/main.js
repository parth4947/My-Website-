/* Tapcore Media · v3 interactions.
   GSAP + ScrollTrigger drive the scroll scenes, Lenis smooths the scroll,
   Matter.js (lazy-loaded) runs the network playground. If any of them is
   missing, or the visitor prefers reduced motion, the page stays static. */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const motion = hasGsap && !reduced;
  root.classList.add(motion ? "js-motion" : "no-motion");

  const yearEl = $("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Clocks (Gurugram, IST) ---------- */
  const clockShort = $$("[data-clock]"), clockFull = $("[data-clock-full]");
  const fmtShort = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });
  const fmtFull = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const tickClock = () => {
    const now = new Date();
    clockShort.forEach((el) => (el.textContent = fmtShort.format(now)));
    if (clockFull) clockFull.textContent = fmtFull.format(now);
  };
  tickClock();
  setInterval(tickClock, 1000);

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (motion && window.Lenis) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95 });
    root.classList.add("has-lenis");
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollToEl = (target, offset = 0) => {
    const el = typeof target === "string" ? $(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset, duration: 1.4 });
    else el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  };
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id.length < 2 || !$(id)) return;
    e.preventDefault();
    scrollToEl(id === "#top" ? document.body : id);
  }));

  /* ---------- Intro counter ---------- */
  const loader = $(".loader");
  const skipIntro = root.classList.contains("skip-intro");
  function finishIntro() {
    loader.classList.add("done");
    try { sessionStorage.setItem("tc-intro", "1"); } catch (e) {}
    if (lenis) lenis.start();
    document.dispatchEvent(new Event("intro:done"));
  }
  if (!skipIntro && loader) {
    if (lenis) lenis.stop();
    const out = $(".ld-count span");
    const t0 = performance.now();
    const minDur = 900, maxDur = 1600;
    let fontsReady = false;
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { fontsReady = true; });
    const step = (t) => {
      const el = t - t0;
      const target = fontsReady ? minDur : maxDur;
      const p = clamp(el / target, 0, 1);
      out.textContent = String(Math.round(100 * (1 - Math.pow(1 - p, 3)))).padStart(3, "0");
      if (p < 1 && el < maxDur) requestAnimationFrame(step);
      else { out.textContent = "100"; setTimeout(finishIntro, 120); }
    };
    requestAnimationFrame(step);
  } else {
    requestAnimationFrame(() => document.dispatchEvent(new Event("intro:done")));
  }

  /* ---------- Nav ---------- */
  const nav = $("#nav"), burger = $(".burger"), menu = $("#menu");
  let lastY = scrollY;
  function setMenu(open) {
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add("open"));
      if (lenis) lenis.stop(); else document.body.style.overflow = "hidden";
    } else {
      menu.classList.remove("open");
      if (lenis) lenis.start(); else document.body.style.overflow = "";
      setTimeout(() => { if (!menu.classList.contains("open")) menu.hidden = true; }, 700);
    }
  }
  burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && menu.classList.contains("open")) setMenu(false); });

  const navLinks = $$(".nav-links a");
  const secIO = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach((s) => secIO.observe(s));

  /* ---------- KPI pill ---------- */
  const kpi = $("#kpi"), kpiIn = $("#kpi-in");
  // The pill steps aside where it would cover content: the flight scene, contact and footer.
  const hideZones = new Set();
  let nearContact = false;
  const contactIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? hideZones.add(e.target) : hideZones.delete(e.target)));
    nearContact = hideZones.size > 0;
    onScrollUI();
  }, { threshold: 0.05 });
  [$("#contact"), $(".footer"), $(".flight-stage")].forEach((el) => contactIO.observe(el));
  kpi.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = kpiIn.value.trim();
    const msg = $("#f-msg");
    if (v) { msg.value = v; msg.dispatchEvent(new Event("input")); }
    kpiIn.value = "";
    kpiIn.blur();
    scrollToEl("#contact");
    setTimeout(() => $("#f-name").focus({ preventScroll: true }), 1500);
  });
  addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); kpi.classList.add("show"); kpiIn.focus(); }
  });

  function onScrollUI() {
    const y = scrollY;
    if (!menu.classList.contains("open")) nav.classList.toggle("hide", y > lastY && y > 300);
    lastY = y;
    const showKpi = (y > innerHeight * 0.6 && !nearContact) || document.activeElement === kpiIn;
    kpi.classList.toggle("show", showKpi);
  }
  addEventListener("scroll", onScrollUI, { passive: true });

  /* ---------- Cursor ---------- */
  if (finePointer && !reduced) {
    const cur = $(".cursor"), label = $(".c-label");
    let mx = -100, my = -100, cx = -100, cy = -100, raf = null;
    const loop = () => {
      cx += (mx - cx) * 0.25; cy += (my - cy) * 0.25;
      cur.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = Math.abs(mx - cx) + Math.abs(my - cy) > 0.2 ? requestAnimationFrame(loop) : null;
    };
    addEventListener("pointermove", (e) => {
      mx = e.clientX; my = e.clientY;
      if (!cur.classList.contains("on")) { cx = mx; cy = my; cur.classList.add("on"); }
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener("pointerleave", () => cur.classList.remove("on"));
    document.addEventListener("pointerover", (e) => {
      const t = e.target;
      const lab = t.closest(".physics .pg") ? "Drag" : t.closest(".fmt-scroller") ? "Drag" : "";
      label.textContent = lab;
      cur.classList.toggle("labelled", !!lab);
      cur.classList.toggle("link", !lab && !!t.closest("a, button, label, input, textarea, .ctable li"));
    });
  }

  /* ---------- Counters ---------- */
  const countIO = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    countIO.unobserve(e.target);
    const el = e.target, end = +el.dataset.count;
    if (reduced) { el.textContent = fmt(end); return; }
    const t0 = performance.now(), dur = 1600;
    const tick = (t) => {
      const p = clamp((t - t0) / dur, 0, 1);
      el.textContent = fmt(end * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: 0.5 });
  $$("[data-count]").forEach((el) => countIO.observe(el));

  /* ---------- Text splitting ---------- */
  function splitChars(el) {
    const words = el.textContent.split(" ");
    el.textContent = "";
    words.forEach((w, i) => {
      const ws = document.createElement("span");
      ws.style.display = "inline-block";
      ws.style.whiteSpace = "nowrap";
      for (const ch of w) {
        const c = document.createElement("span");
        c.className = "ch";
        c.textContent = ch;
        ws.appendChild(c);
      }
      el.appendChild(ws);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
    return $$(".ch", el);
  }

  /* =========================================================
     SCROLL SCENES (GSAP)
     ========================================================= */
  if (motion) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    /* ----- HERO: tap, the screen turns into a window, fly through it ----- */
    const hero = $(".hero"), device = $(".device"), screen = $(".screen");
    const world = $(".scr-world"), install = $(".scr-install");
    const chars = $$(".mf-line").flatMap(splitChars);
    gsap.set(device, { xPercent: -50, yPercent: -50, transformPerspective: 1600 });

    const zoomScale = () => Math.max(innerWidth / screen.offsetWidth, innerHeight / screen.offsetHeight) * 1.4;
    // The sky inside the screen counter-scales, so it reads as far away while the frame rushes past.
    const syncDepth = () => gsap.set(world, { scale: Math.pow(gsap.getProperty(device, "scale"), -0.55) });

    const heroTl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: hero, start: "top top", end: "+=360%", pin: true, scrub: 1.4, invalidateOnRefresh: true,
        onUpdate: (self) => install.classList.toggle("done", self.progress > 0.1),
      },
    });
    heroTl
      // 1. the tap
      .fromTo(".finger", { opacity: 0, xPercent: 140, yPercent: 160 }, { opacity: 1, xPercent: 0, yPercent: 0, duration: 1, ease: "power2.out" }, 0)
      .to(".finger", { scale: 0.82, duration: 0.25 }, 1)
      .fromTo(".finger i", { opacity: 0.9, scale: 1 }, { opacity: 0, scale: 2.4, duration: 0.6 }, 1.05)
      .to(".finger", { scale: 1, opacity: 0, duration: 0.4 }, 1.4)
      // 2. the room falls away, the phone leans back and its screen clears to sky
      .to(".hh-l", { xPercent: -40, opacity: 0, filter: "blur(12px)", duration: 1.6, ease: "power2.in" }, 1.4)
      .to(".hh-r", { xPercent: 40, opacity: 0, filter: "blur(12px)", duration: 1.6, ease: "power2.in" }, 1.4)
      .to([".hero-top", ".hero-sub", ".hero-foot"], { opacity: 0, y: 24, duration: 0.9 }, 1.4)
      .to(device, { rotationX: 9, scale: 1.07, duration: 1.3, ease: "sine.inOut", onUpdate: syncDepth }, 1.5)
      .to(".scr-ui", { opacity: 0, scale: 1.08, duration: 1, ease: "power1.in" }, 1.9)
      .to(".scr-sky", { opacity: 1, duration: 1 }, 1.9)
      .to(".device-shadow", { opacity: 0, scale: 1.6, duration: 0.8 }, 2.4)
      // 3. the push: straighten up and fly through the screen
      .to(device, { rotationX: 0, scale: zoomScale, duration: 3.6, ease: "power2.in", onUpdate: syncDepth }, 2.8)
      .fromTo(".fly-clouds .cloud", { opacity: 0, scale: 0.45 }, { opacity: 0.95, scale: 1.2, duration: 0.9, stagger: 0.25, ease: "power1.in" }, 4.7)
      .to(".fly-clouds .cloud", { opacity: 0, scale: 3, duration: 1.1, stagger: 0.25, ease: "power1.out" }, 5.6)
      .to(".hero-sky", { opacity: 1, duration: 0.5 }, 5.9)
      .set(device, { visibility: "hidden" }, 6.45)
      // 4. the manifesto settles in
      .to(".mf-corner", { opacity: 1, duration: 0.6, stagger: 0.08 }, 6.5)
      .fromTo(".mf-mark", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, 6.6)
      .fromTo(chars, {
        opacity: 0,
        x: () => rand(-0.36, 0.36) * innerWidth,
        y: () => rand(-0.36, 0.36) * innerHeight,
        rotation: () => rand(-50, 50),
        scale: () => rand(0.6, 1.6),
      }, { opacity: 1, x: 0, y: 0, rotation: 0, scale: 1, duration: 2.4, ease: "power3.out", stagger: { each: 0.022, from: "random" } }, 6.6)
      .to(".mf-rule", { scaleX: 1, duration: 1, ease: "power2.inOut" }, 8.1)
      .fromTo(".mf-sub", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.7 }, 8.8)
      .to({}, { duration: 0.9 });

    /* ----- ABOUT: letters wait in two columns, then fall into place as you scroll ----- */
    const aboutP = $("[data-assemble]"), aboutPin = $(".about-pin");
    const aChars = splitChars(aboutP);
    const seeds = aChars.map(() => ({ side: Math.random() < 0.5, fx: Math.random(), fy: Math.random(), r: rand(-30, 30), s: rand(0.55, 0.85) }));
    const homeOf = (el) => {
      // centre of the letter inside the pinned box, ignoring transforms
      let x = el.offsetWidth / 2, y = el.offsetHeight / 2, n = el;
      while (n && n !== aboutPin) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
      return { x, y };
    };
    const target = (i) => {
      const W = aboutPin.offsetWidth, H = innerHeight, sd = seeds[i];
      const narrow = W < 720 ? 0.12 : 0.15;
      return { x: (sd.side ? 0.03 + sd.fx * narrow : 0.97 - narrow + sd.fx * narrow) * W, y: (0.12 + sd.fy * 0.8) * H };
    };
    gsap.fromTo(aChars, {
      x: (i, el) => target(i).x - homeOf(el).x,
      y: (i, el) => target(i).y - homeOf(el).y,
      rotation: (i) => seeds[i].r,
      scale: (i) => seeds[i].s,
      opacity: 0.5,
    }, {
      x: 0, y: 0, rotation: 0, scale: 1, opacity: 1, ease: "power2.inOut",
      stagger: { each: 0.004, from: "random" },
      scrollTrigger: { trigger: aboutPin, start: "top top", end: "+=170%", pin: true, scrub: 1, invalidateOnRefresh: true },
    });
    gsap.from(".about-cols article", { y: 40, opacity: 0, duration: 1, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: ".about-cols", start: "top 85%" } });
  }

  /* ----- FLIGHT: the Tapcore mark flies the funnel ----- */
  const NODES = [
    { ev: "Impression", m: "CPM", d: "Impression buying, where reach is the goal." },
    { ev: "Click", m: "CPC", d: "Click buying, where traffic is the goal." },
    { ev: "Install", m: "CPI", d: "Cost per install." },
    { ev: "Registration", m: "CPR", d: "Cost per registration." },
    { ev: "In-app action", m: "CPA", d: "Cost per in-app action, such as a deposit, trade or purchase." },
    { ev: "Sale", m: "CPS", d: "Cost per sale." },
    { ev: "Revenue", m: "Rev Share", d: "A share of the revenue your users generate." },
  ];
  const flight = (() => {
    const stage = $(".flight-stage"), svg = $(".flight-svg");
    const base = $(".fp-base"), trail = $(".fp-trail"), plane = $(".plane"), nodesWrap = $(".fp-nodes");
    const card = $(".flight-card"), cStep = $(".fc-step b"), cModel = $(".fc-model"), cDesc = $(".fc-desc");
    let L = 1, fracs = [], nodeEls = [], current = -1, p = 0;

    // Catmull-Rom through waypoints → smooth cubic path
    const toPath = (pts) => {
      let d = `M${pts[0][0]},${pts[0][1]}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
        d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
      }
      return d;
    };

    function build() {
      const W = stage.clientWidth, H = stage.clientHeight;
      const mobile = W <= 720;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const wp = mobile
        ? [[0.5, 1.08], [0.22, 0.95], [0.7, 0.88], [0.28, 0.8], [0.72, 0.72], [0.26, 0.64], [0.7, 0.57], [0.42, 0.5]]
        : [[0.36, 1.1], [0.42, 0.86], [0.6, 0.8], [0.52, 0.6], [0.68, 0.5], [0.84, 0.6], [0.92, 0.38], [0.8, 0.22]];
      const d = toPath(wp.map(([x, y]) => [x * W, y * H]));
      base.setAttribute("d", d);
      trail.setAttribute("d", d);
      L = trail.getTotalLength();
      trail.style.strokeDasharray = L;
      fracs = NODES.map((_, i) => 0.14 + (i / (NODES.length - 1)) * 0.86);
      nodesWrap.innerHTML = "";
      nodeEls = NODES.map((n, i) => {
        const pt = trail.getPointAtLength(fracs[i] * L);
        const el = document.createElement("div");
        el.className = "fp-node";
        if (pt.x > W * (mobile ? 0.55 : 0.78)) el.classList.add("left");
        el.style.left = pt.x + "px";
        el.style.top = pt.y + "px";
        el.innerHTML = `<i></i><span class="mono">${String(i + 1).padStart(2, "0")} ${n.ev} · <b>${n.m}</b></span>`;
        nodesWrap.appendChild(el);
        return el;
      });
      current = -1;
      render(p);
    }

    function render(prog) {
      p = prog;
      const len = clamp(prog, 0, 1) * L;
      trail.style.strokeDashoffset = L - len;
      const a = trail.getPointAtLength(Math.max(0, len - 1)), b = trail.getPointAtLength(Math.min(L, len + 1));
      const pt = trail.getPointAtLength(len);
      const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
      plane.style.transform = `translate(${pt.x}px, ${pt.y}px) rotate(${ang}deg)`;
      let idx = 0;
      fracs.forEach((f, i) => { const on = prog >= f - 0.004; nodeEls[i].classList.toggle("on", on); if (on) idx = i; });
      if (idx !== current) {
        current = idx;
        const n = NODES[idx];
        cStep.textContent = String(idx + 1).padStart(2, "0");
        cModel.textContent = n.m;
        cDesc.textContent = n.d;
        [cModel, cDesc].forEach((el) => { el.classList.remove("swap"); void el.offsetWidth; el.classList.add("swap"); });
      }
    }
    build();
    addEventListener("resize", () => { clearTimeout(build.t); build.t = setTimeout(build, 150); });
    return { render, stage };
  })();

  if (motion) {
    const proxy = { p: 0 };
    gsap.to(proxy, {
      p: 1, ease: "none",
      onUpdate: () => flight.render(proxy.p),
      scrollTrigger: { trigger: ".flight", start: "top top", end: "+=320%", pin: true, scrub: 0.8, invalidateOnRefresh: true },
    });
  } else {
    flight.render(1);
  }

  /* ----- SERVICES: circles swell, cards drift ----- */
  if (motion) {
    $$(".split").forEach((s) => {
      gsap.fromTo($(".big-circle", s), { scale: 0.45 }, { scale: 1.1, ease: "none", scrollTrigger: { trigger: s, start: "top bottom", end: "bottom top", scrub: true } });
      gsap.fromTo($(".ui-card", s), { y: 90, rotation: -4 }, { y: -90, rotation: 3, ease: "none", scrollTrigger: { trigger: s, start: "top bottom", end: "bottom top", scrub: true } });
      gsap.from($(".h-split", s), { xPercent: 12, opacity: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: s, start: "top 70%" } });
      gsap.from($$(".dash-list li", s), { x: 30, opacity: 0, duration: 0.8, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: s, start: "top 60%" } });
    });
    gsap.from(".ua-bars i", { scaleY: 0.1, duration: 1.2, stagger: 0.07, ease: "power3.out", scrollTrigger: { trigger: ".ua-bars", start: "top 85%" } });
    gsap.from(".rt-notif", { y: 30, opacity: 0, duration: 0.9, stagger: 0.25, ease: "back.out(1.6)", scrollTrigger: { trigger: ".ui-rt", start: "top 80%" } });

    /* ----- GLOBAL: the word slides behind the globe ----- */
    gsap.set(".global-word", { xPercent: -50, yPercent: -54 });
    gsap.fromTo(".global-word", { xPercent: -30 }, { xPercent: -72, ease: "none", scrollTrigger: { trigger: ".global-stage", start: "top bottom", end: "bottom top", scrub: true } });
    gsap.fromTo(".globe", { scale: 0.82 }, { scale: 1.08, ease: "none", scrollTrigger: { trigger: ".global-stage", start: "top bottom", end: "bottom top", scrub: true } });
    gsap.from(".bar i", { scaleX: 0, duration: 1.3, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: ".g-inv", start: "top 85%" } });
    gsap.from(".g-card", { y: 60, opacity: 0, duration: 1, stagger: 0.12, ease: "power3.out", scrollTrigger: { trigger: ".global-grid", start: "top 88%" } });

    /* ----- CLIENTS + QUALITY + headings ----- */
    gsap.from(".ctable li", { y: 40, opacity: 0, duration: 0.9, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: ".ctable", start: "top 85%" } });
    gsap.from(".q-list li", { y: 30, opacity: 0, duration: 0.8, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: ".q-list", start: "top 85%" } });
    $$(".h-wide, .h-giant").forEach((h) => {
      if (h.closest(".flight-stage, .proc-stage")) return;
      gsap.from(h, { y: 60, opacity: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: h, start: "top 88%" } });
    });

    /* ----- PROCESS: horizontal run ----- */
    const track = $(".proc-track");
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    gsap.to(track, {
      x: () => -dist(), ease: "none",
      scrollTrigger: { trigger: ".process", start: "top top", end: () => "+=" + dist(), pin: true, scrub: 0.8, invalidateOnRefresh: true },
    });
  } else {
    root.classList.add("static-process");
  }

  /* ----- Live cursors in the process scene ----- */
  if (motion) {
    const stage = $(".proc-stage");
    let live = false;
    const wander = (el) => {
      if (!live) { el._idle = true; return; }
      el._idle = false;
      gsap.to(el, {
        x: rand(0.08, 0.85) * stage.clientWidth, y: rand(0.22, 0.82) * stage.clientHeight,
        duration: rand(1.4, 2.8), ease: "power2.inOut", onComplete: () => wander(el),
      });
    };
    const cursors = $$(".mc");
    cursors.forEach((c) => gsap.set(c, { x: rand(0.2, 0.7) * innerWidth, y: rand(0.3, 0.7) * innerHeight }));
    new IntersectionObserver(([e]) => {
      live = e.isIntersecting;
      if (live) cursors.forEach((c) => { if (c._idle !== false) wander(c); });
    }).observe(stage);
  }

  /* =========================================================
     CANVASES
     ========================================================= */
  function onVisible(el, start, stop) {
    new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { rootMargin: "120px" }).observe(el);
  }
  function setupCanvas(cv) {
    const ctx = cv.getContext("2d");
    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const r = cv.getBoundingClientRect();
      const w = cv.offsetWidth || r.width, h = cv.offsetHeight || r.height;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w, h };
    };
    return { ctx, size };
  }
  function animate(cv, frame) {
    let raf = null, last = 0;
    const loop = (t) => {
      const dt = Math.min((t - (last || t)) / 1000, 0.05);
      last = t; frame(dt, t / 1000);
      raf = requestAnimationFrame(loop);
    };
    const start = () => { if (!raf && !document.hidden) { last = 0; raf = requestAnimationFrame(loop); } };
    const stop = () => { cancelAnimationFrame(raf); raf = null; };
    let vis = false;
    onVisible(cv, () => { vis = true; start(); }, () => { vis = false; stop(); });
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : vis && start()));
  }

  /* ----- Globe (white dots on sky) ----- */
  const globe = $(".globe");
  if (globe) {
    const { ctx, size } = setupCanvas(globe);
    let W = 0, H = 0;
    const resize = () => ({ w: W, h: H } = size());
    resize(); addEventListener("resize", resize);
    const N = 1800, pts = [];
    const land = (lat, lon) => Math.sin(lat * 3.1 + 1.3) * Math.cos(lon * 2.2) + Math.sin(lon * 1.3 + lat * 1.7) * 0.8 + Math.cos(lat * 5 - lon * 0.7) * 0.35 > 0.05;
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963;
      const x = Math.cos(th) * r, z = Math.sin(th) * r;
      pts.push({ x, y, z, land: land(Math.asin(y), Math.atan2(z, x)) });
    }
    const landPts = pts.filter((q) => q.land);
    const arcs = [], pings = [];
    let rot = 0;
    const tilt = -0.35, ct = Math.cos(tilt), st = Math.sin(tilt);
    const project = (q, R, cx, cy) => {
      const cr = Math.cos(rot), sr = Math.sin(rot);
      const x = q.x * cr - q.z * sr; let z = q.x * sr + q.z * cr;
      const y = q.y * ct - z * st; z = q.y * st + z * ct;
      return { x: cx + x * R, y: cy - y * R, z };
    };
    const draw = (dt) => {
      if (!W) return;
      rot += dt * 0.16;
      const R = Math.min(W, H) * 0.46, cx = W / 2, cy = H / 2;
      ctx.clearRect(0, 0, W, H);
      const g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R * 1.05);
      g.addColorStop(0, "rgba(255,255,255,.34)"); g.addColorStop(1, "rgba(255,255,255,.04)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      for (const q of pts) {
        const pr = project(q, R, cx, cy);
        if (pr.z < -0.05 && !q.land) continue;
        const front = pr.z > 0, a = front ? 0.6 + pr.z * 0.4 : 0.16;
        ctx.fillStyle = q.land ? `rgba(255,255,255,${a})` : `rgba(255,255,255,${a * 0.3})`;
        const s = q.land ? (front ? 2.2 + pr.z * 2.2 : 1.2) : 1.3;
        ctx.fillRect(pr.x - s / 2, pr.y - s / 2, s, s);
      }
      if (arcs.length < 8 && Math.random() < dt * 3.5) {
        const a = landPts[(Math.random() * landPts.length) | 0], b = landPts[(Math.random() * landPts.length) | 0];
        if (a !== b) arcs.push({ a, b, t: 0 });
      }
      for (let i = arcs.length - 1; i >= 0; i--) {
        const arc = arcs[i]; arc.t += dt * 0.55;
        const A = project(arc.a, R, cx, cy), B = project(arc.b, R, cx, cy);
        if (arc.t > 1.6 || A.z < 0 || B.z < 0) { if (arc.t > 1 && A.z >= 0 && B.z >= 0) pings.push({ x: B.x, y: B.y, t: 0 }); arcs.splice(i, 1); continue; }
        const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, dx = mx - cx, dy = my - cy, d = Math.hypot(dx, dy) || 1;
        const lift = Math.hypot(B.x - A.x, B.y - A.y) * 0.45, qx = mx + dx / d * lift, qy = my + dy / d * lift;
        const head = clamp(arc.t, 0, 1), tail = clamp(arc.t - 0.6, 0, 1);
        ctx.beginPath();
        for (let s = tail; s <= head; s += 0.04) {
          const u = 1 - s, px = u * u * A.x + 2 * u * s * qx + s * s * B.x, py = u * u * A.y + 2 * u * s * qy + s * s * B.y;
          s === tail ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.strokeStyle = "#FFD23F"; ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.stroke();
      }
      for (let i = pings.length - 1; i >= 0; i--) {
        const q = pings[i]; q.t += dt;
        if (q.t > 1.2) { pings.splice(i, 1); continue; }
        ctx.beginPath(); ctx.arc(q.x, q.y, 3 + q.t * 20, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,210,63,${1 - q.t / 1.2})`; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = "#FFD23F"; ctx.beginPath(); ctx.arc(q.x, q.y, 4, 0, Math.PI * 2); ctx.fill();
      }
    };
    if (reduced) draw(0); else animate(globe, draw);
  }

  /* ----- Anti-fraud filter ----- */
  const filter = $(".filter");
  if (filter) {
    const { ctx, size } = setupCanvas(filter);
    const blockedEl = $("[data-blocked]");
    let W = 0, H = 0, blocked = 0;
    const resize = () => ({ w: W, h: H } = size());
    resize(); addEventListener("resize", resize);
    const parts = [], sparks = [];
    const draw = (dt, t) => {
      if (!W) return;
      ctx.clearRect(0, 0, W, H);
      const gate = W * 0.48, appX = W - 46, appY = H / 2;
      if (Math.random() < dt * 14) parts.push({ x: -6, y: 16 + Math.random() * (H - 32), v: 70 + Math.random() * 70, bad: Math.random() < 0.24, stage: 0, a: 1, vy: 0 });
      const gg = ctx.createLinearGradient(gate - 30, 0, gate + 30, 0);
      gg.addColorStop(0, "rgba(43,91,255,0)"); gg.addColorStop(0.5, "rgba(43,91,255,.12)"); gg.addColorStop(1, "rgba(43,91,255,0)");
      ctx.fillStyle = gg; ctx.fillRect(gate - 30, 0, 60, H);
      ctx.setLineDash([6, 8]); ctx.lineDashOffset = -t * 30;
      ctx.strokeStyle = "rgba(43,91,255,.55)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(gate, 8); ctx.lineTo(gate, H - 8); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = "500 10px 'JetBrains Mono', monospace"; ctx.fillStyle = "rgba(11,27,51,.45)";
      ctx.fillText("INCOMING TRAFFIC", 12, 20); ctx.fillText("FILTER", gate + 10, 20);
      const ag = ctx.createLinearGradient(appX - 26, appY - 26, appX + 26, appY + 26);
      ag.addColorStop(0, "#2B5BFF"); ag.addColorStop(1, "#23C4E8");
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(appX - 26, appY - 26, 52, 52, 14) : ctx.rect(appX - 26, appY - 26, 52, 52);
      ctx.fillStyle = ag; ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = "700 12px 'Archivo', sans-serif"; ctx.textAlign = "center"; ctx.fillText("APP", appX, appY + 4); ctx.textAlign = "left";
      for (let i = parts.length - 1; i >= 0; i--) {
        const q = parts[i];
        if (q.stage === 0) {
          q.x += q.v * dt;
          if (q.x >= gate - 4) {
            if (q.bad) { q.stage = 2; q.v = -q.v * 0.35; q.vy = (Math.random() - 0.5) * 80; blocked++; if (blockedEl) blockedEl.textContent = fmt(blocked); sparks.push({ x: gate, y: q.y, t: 0 }); }
            else q.stage = 1;
          }
        } else if (q.stage === 1) {
          const dx = appX - q.x, dy = appY - q.y, d = Math.hypot(dx, dy), sp = q.v * 1.5;
          q.x += dx / d * sp * dt; q.y += dy / d * sp * dt;
          if (d < 24) { parts.splice(i, 1); continue; }
        } else {
          q.x += q.v * dt; q.y += q.vy * dt; q.a -= dt * 1.4;
          if (q.a <= 0) { parts.splice(i, 1); continue; }
        }
        ctx.globalAlpha = clamp(q.a, 0, 1);
        ctx.fillStyle = q.bad ? "#FF6A1A" : q.stage === 1 ? "#2B5BFF" : "#7C8AA3";
        ctx.beginPath(); ctx.arc(q.x, q.y, q.bad ? 4 : 3.4, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]; s.t += dt * 2.2;
        if (s.t > 1) { sparks.splice(i, 1); continue; }
        ctx.strokeStyle = `rgba(255,106,26,${1 - s.t})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(s.x, s.y, 4 + s.t * 14, 0, Math.PI * 2); ctx.stroke();
      }
    };
    for (let i = 0; i < 240; i++) draw(1 / 60, i / 60);
    if (reduced) draw(0, 0); else animate(filter, draw);
  }

  /* =========================================================
     NETWORK PLAYGROUND (Matter.js, lazy)
     ========================================================= */
  const pg = $(".playground");
  if (pg && !reduced) {
    let loaded = false;
    new IntersectionObserver(([e], io) => {
      if (!e.isIntersecting || loaded) return;
      loaded = true; io.disconnect();
      const s = document.createElement("script");
      s.src = "assets/vendor/matter.min.js";
      s.onload = () => initPhysics(pg);
      document.head.appendChild(s);
    }, { rootMargin: "600px 0px" }).observe(pg);
  }

  function initPhysics(box) {
    const M = window.Matter;
    if (!M) return;
    const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint, Events } = M;
    box.classList.add("physics");
    const engine = Engine.create({ gravity: { y: 1.1 } });
    const els = $$(".pg", box);
    let W = box.clientWidth, H = box.clientHeight;
    const T = 400;
    const walls = [
      Bodies.rectangle(W / 2, H + T / 2, W * 3, T, { isStatic: true }),
      Bodies.rectangle(-T / 2, H / 2 - 1000, T, H * 2 + 2000, { isStatic: true }),
      Bodies.rectangle(W + T / 2, H / 2 - 1000, T, H * 2 + 2000, { isStatic: true }),
    ];
    Composite.add(engine.world, walls);

    const items = els.map((el) => {
      const w = el.offsetWidth, h = el.offsetHeight;
      const shape = el.dataset.shape;
      const opts = { restitution: 0.35, friction: 0.3, frictionAir: 0.012, density: 0.0016 };
      let body;
      if (shape === "circle") body = Bodies.circle(0, 0, w / 2, opts);
      else if (shape === "hex") body = Bodies.polygon(0, 0, 6, h / 2, opts);
      else if (shape === "box") body = Bodies.rectangle(0, 0, w, h, { ...opts, chamfer: { radius: 6 } });
      else body = Bodies.rectangle(0, 0, w, h, { ...opts, chamfer: { radius: h / 2 } });
      return { el, body, w, h, pupil: $("i", el) };
    });

    let dropped = false;
    function drop() {
      if (dropped) return;
      dropped = true;
      items.forEach((it, i) => {
        Body.setPosition(it.body, { x: rand(it.w / 2 + 10, W - it.w / 2 - 10), y: -it.h - i * 70 - rand(0, 80) });
        Body.setAngle(it.body, rand(-0.6, 0.6));
        Composite.add(engine.world, it.body);
        it.el.classList.add("live");
      });
    }

    if (finePointer) {
      const mouse = Mouse.create(box);
      ["wheel", "touchmove", "touchstart", "touchend"].forEach((ev) => {
        box.removeEventListener(ev, ev === "wheel" ? mouse.mousewheel : ev === "touchmove" ? mouse.mousemove : ev === "touchstart" ? mouse.mousedown : mouse.mouseup);
      });
      const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.18, damping: 0.1, render: { visible: false } } });
      Composite.add(engine.world, mc);
      Events.on(mc, "startdrag", () => box.classList.add("dragging"));
      Events.on(mc, "enddrag", () => box.classList.remove("dragging"));
    } else {
      items.forEach((it) => it.el.addEventListener("pointerdown", () => {
        Body.setVelocity(it.body, { x: rand(-8, 8), y: rand(-18, -12) });
        Body.setAngularVelocity(it.body, rand(-0.3, 0.3));
      }));
    }

    let px = -1e4, py = -1e4;
    addEventListener("pointermove", (e) => { const r = box.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top; }, { passive: true });

    let raf = null, visible = false;
    const loop = () => {
      Engine.update(engine, 1000 / 60);
      for (const it of items) {
        const { x, y } = it.body.position, a = it.body.angle;
        it.el.style.transform = `translate(${x - it.w / 2}px, ${y - it.h / 2}px) rotate(${a}rad)`;
        if (it.pupil) {
          let dx = px - x, dy = py - y;
          const d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 200) * it.w * 0.16;
          const c = Math.cos(-a), s = Math.sin(-a);
          const rx = (dx * c - dy * s) / d * k, ry = (dx * s + dy * c) / d * k;
          it.pupil.style.setProperty("--ex", rx.toFixed(1) + "px");
          it.pupil.style.setProperty("--ey", ry.toFixed(1) + "px");
        }
      }
      raf = requestAnimationFrame(loop);
    };
    const start = () => { if (!raf && !document.hidden) raf = requestAnimationFrame(loop); };
    const stop = () => { cancelAnimationFrame(raf); raf = null; };
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) { drop(); start(); } else stop();
    }, { threshold: 0.25 }).observe(box);
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : visible && start()));
    addEventListener("resize", () => {
      const nw = box.clientWidth, nh = box.clientHeight;
      if (Math.abs(nw - W) < 2 && Math.abs(nh - H) < 2) return;
      W = nw; H = nh;
      Body.setPosition(walls[0], { x: W / 2, y: H + T / 2 });
      Body.setPosition(walls[2], { x: W + T / 2, y: H / 2 - 1000 });
      items.forEach((it) => {
        const p = it.body.position;
        Body.setPosition(it.body, { x: clamp(p.x, it.w / 2, W - it.w / 2), y: Math.min(p.y, H - it.h / 2) });
      });
    });
  }

  /* =========================================================
     FORMATS drag
     ========================================================= */
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
  }

  /* =========================================================
     CONTACT
     ========================================================= */
  const form = $("#leadForm");
  const msgEl = $(".form-msg", form);
  function readForm() {
    const d = Object.fromEntries(new FormData(form));
    let ok = true;
    [["name", (v) => v.trim().length > 1], ["email", (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)]].forEach(([k, test]) => {
      const good = test(d[k] || "");
      form.elements[k].closest(".field").classList.toggle("err", !good);
      ok = ok && good;
    });
    if (!ok) { msgEl.textContent = "Please add your name and a valid work email."; return null; }
    const body = [
      `Name: ${d.name}`, `Email: ${d.email}`, `App: ${d.app || "-"}`,
      `Payable event: ${d.model}`, `Target GEO: ${d.geo || "-"}`, "", "KPI and budget:", d.msg || "-",
    ].join("\n");
    return { d, body };
  }
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const r = readForm();
    if (!r) return;
    const subject = `Test brief${r.d.app ? ": " + r.d.app : ""}`;
    location.href = `mailto:parth@tapcoremedia.net?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(r.body)}`;
    msgEl.textContent = "Thanks! Your email app is opening with the brief ready to send.";
  });
  $("[data-wa]", form).addEventListener("click", () => {
    const r = readForm();
    if (!r) return;
    window.open(`https://wa.me/919625898987?text=${encodeURIComponent("Hi Tapcore, here is a test brief.\n\n" + r.body)}`, "_blank", "noopener");
    msgEl.textContent = "Opening WhatsApp with your brief.";
  });

  /* ---------- Final refresh once fonts settle ---------- */
  if (motion) {
    const refresh = () => ScrollTrigger.refresh();
    if (document.fonts) document.fonts.ready.then(refresh);
    addEventListener("load", refresh);
  }
})();
