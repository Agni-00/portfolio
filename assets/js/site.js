/* 林峰 · 作品集 — 交互（无依赖，约 6KB） */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nav = doc.getElementById('nav');
  var progress = doc.querySelector('.progress');
  var sections = [].slice.call(doc.querySelectorAll('main > section[id]'));
  var railDots = [].slice.call(doc.querySelectorAll('.rail-dot'));
  var navLinks = [].slice.call(doc.querySelectorAll('.nav-links a'));

  /* ---------- 入场 ---------- */
  [].slice.call(doc.querySelectorAll('.reveal')).forEach(function (el) {
    var sibs = [].slice.call(el.parentElement.children).filter(function (c) {
      return c.classList && c.classList.contains('reveal');
    });
    var i = sibs.indexOf(el);
    if (i > 0) el.style.setProperty('--d', Math.min(i, 5) * 80 + 'ms');
  });

  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    [].slice.call(doc.querySelectorAll('.reveal')).forEach(function (el) { io.observe(el); });
  } else {
    [].slice.call(doc.querySelectorAll('.reveal')).forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- 图片淡入 ---------- */
  function markLoaded(img) { img.classList.add('is-loaded'); }
  [].slice.call(doc.querySelectorAll('.spread img, .lb-img')).forEach(function (img) {
    if (img.complete && img.naturalWidth) markLoaded(img);
    else img.addEventListener('load', function () { markLoaded(img); }, { once: true });
  });

  /* ---------- 数字滚动 ---------- */
  function fmt(v, dec, compact) {
    if (compact) {
      return (v / 10000).toFixed(dec) + (v >= 10000 ? '' : '');
    }
    var s = v.toFixed(dec);
    var parts = s.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var compact = el.hasAttribute('data-compact');
    if (isNaN(target)) return;
    if (reduced) { el.textContent = fmt(target, dec, compact); return; }
    var dur = 1250, t0 = 0;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * e, dec, compact);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = fmt(target, dec, compact);
    }
    requestAnimationFrame(step);
  }
  [].slice.call(doc.querySelectorAll('[data-count]')).forEach(function (el) {
    el.textContent = fmt(reduced ? parseFloat(el.getAttribute('data-count')) : 0,
      parseInt(el.getAttribute('data-dec') || '0', 10),
      el.hasAttribute('data-compact'));
  });
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { countUp(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    [].slice.call(doc.querySelectorAll('[data-count]')).forEach(function (el) { cio.observe(el); });
  } else {
    [].slice.call(doc.querySelectorAll('[data-count]')).forEach(countUp);
  }

  /* ---------- 滚动状态：导航 / 主题 / 进度 / 章节 ---------- */
  var lastTheme = '';
  function onScroll() {
    var y = window.pageYOffset || doc.documentElement.scrollTop;
    var vh = window.innerHeight;
    var max = Math.max(1, doc.documentElement.scrollHeight - vh);

    if (progress) progress.style.width = Math.min(100, (y / max) * 100) + '%';
    if (nav) nav.classList.toggle('is-shown', y > vh * 0.62);

    // 当前章节
    var focusLine = y + vh * 0.38;
    var current = sections[0];
    var theme = 'light';
    sections.forEach(function (s) {
      if (s.offsetTop <= focusLine) {
        current = s;
        theme = s.classList.contains('sec-dark') ? 'dark' : 'light';
      }
    });
    if (theme !== lastTheme) {
      doc.body.setAttribute('data-theme', theme);
      lastTheme = theme;
    }
    var id = current ? current.id : '';
    railDots.forEach(function (d) {
      d.classList.toggle('is-active', d.getAttribute('data-for') === id);
    });
    navLinks.forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
    });

    parallax();
  }

  /* ---------- 极轻微视差 ---------- */
  var wideImg = doc.querySelector('.ph-wide img');
  function parallax() {
    if (!wideImg || reduced || window.innerWidth < 1000) return;
    var r = wideImg.getBoundingClientRect();
    if (r.bottom < -80 || r.top > window.innerHeight + 80) return;
    var off = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
    wideImg.style.transform = 'translate3d(0,' + (off * -26).toFixed(2) + 'px,0) scale(1.04)';
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* ---------- 侧栏圆点 ---------- */
  railDots.forEach(function (d) {
    d.addEventListener('click', function () {
      var t = doc.getElementById(d.getAttribute('data-for'));
      if (t) t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    });
  });

  /* ---------- 灯箱 ---------- */
  var lb = doc.getElementById('lb');
  var lbImg = doc.getElementById('lb-img');
  var lbCap = doc.getElementById('lb-cap');
  var lbCount = doc.getElementById('lb-count');
  var items = [].slice.call(doc.querySelectorAll('[data-lb]'));
  var group = [], gi = 0;

  function loadImg(src, alt) {
    lbImg.classList.remove('is-loaded');
    lbImg.src = src;
    lbImg.alt = alt || '';
    if (lbImg.complete && lbImg.naturalWidth) lbImg.classList.add('is-loaded');
  }
  function show(i) {
    if (!group.length) return;
    gi = (i + group.length) % group.length;
    var el = group[gi];
    var inner = el.querySelector('img');
    loadImg(el.getAttribute('data-full') || (inner && inner.src), inner && inner.getAttribute('alt'));
    if (lbCap) lbCap.textContent = el.getAttribute('data-cap') || '';
    if (lbCount) lbCount.textContent = (gi + 1) + ' / ' + group.length;
    var pre = group[(gi + 1) % group.length];
    if (pre) { var p = new Image(); p.src = pre.getAttribute('data-full'); }
  }
  function open(el) {
    var key = el.getAttribute('data-lb');
    group = items.filter(function (x) { return x.getAttribute('data-lb') === key; });
    gi = group.indexOf(el);
    show(gi);
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    doc.body.classList.add('lb-open');
    if (lb && lb.querySelector('.lb-close')) lb.querySelector('.lb-close').focus({ preventScroll: true });
  }
  function close() {
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    doc.body.classList.remove('lb-open');
    lbImg.removeAttribute('src');
  }
  items.forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); open(el); });
  });
  if (lb) {
    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function (e) { e.stopPropagation(); show(gi - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function (e) { e.stopPropagation(); show(gi + 1); });
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.classList.contains('lb-stage')) close();
    });
    doc.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(gi - 1);
      else if (e.key === 'ArrowRight') show(gi + 1);
    });
    var sx = 0, sy = 0;
    lb.addEventListener('touchstart', function (e) {
      sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - sx;
      var dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 46 && Math.abs(dx) > Math.abs(dy)) show(gi + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  /* ---------- 二维码缺图时优雅隐藏 ---------- */
  var qr = doc.getElementById('qr-img');
  if (qr) {
    var hideQr = function () {
      var fig = qr.closest('.contact-qr');
      if (fig) fig.style.display = 'none';
    };
    if (qr.complete && qr.naturalWidth === 0) hideQr();
    else qr.addEventListener('error', hideQr);
  }

  /* ---------- 导航链接平滑滚动（补齐旧浏览器） ---------- */
  [].slice.call(doc.querySelectorAll('a[href^="#"]')).forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1);
      var t = id && doc.getElementById(id);
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', '#' + id);
    });
  });
})();
