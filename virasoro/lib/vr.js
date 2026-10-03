/* Recorrido 360° interactivo (Pannellum) */
window.VR = function (cfg) {
  var wrap = document.getElementById(cfg.el);
  var colors = {ext:'#c0392b',risk:'#e67e22',exit:'#27ae60',info:'#1f3a93',elec:'#8e44ad',link:'#555'};
  var names = {ext:'EXTINTOR',risk:'RIESGO',exit:'EVACUACIÓN',info:'INFORMACIÓN',elec:'ELÉCTRICO',link:'IR A'};
  wrap.innerHTML = '<div class="pano"></div>' +
    '<div class="vrtop"></div>' +
    '<div class="vrbot"><div class="vrhint">👆 Arrastrá para mirar alrededor · tocá los puntos</div><div class="vrbtns">' +
    (cfg.hunt ? '<div class="vrcount">0/0</div>' : '') +
    '<button class="vrchip" data-a="gyro">📱 Mover con el celular</button>' +
    '<button class="vrchip" data-a="full">⛶ Pantalla completa</button></div></div>' +
    '<div class="vrsheet"><button class="x">✕</button><div class="c"></div></div>';
  var sheet = wrap.querySelector('.vrsheet'), top = wrap.querySelector('.vrtop');
  var found = {}, total = 0, viewer;
  function open(h) {
    var c = colors[h.t] || '#1f3a93';
    sheet.querySelector('.c').innerHTML = '<span class="tg" style="background:' + c + '">' + (names[h.t] || '') + (h.l ? ' · ' + h.l : '') + '</span>' +
      '<h3>' + h.i + ' ' + h.title + '</h3>' + (h.img ? '<img src="' + h.img + '" alt="">' : '') + '<p>' + h.text + '</p>';
    sheet.classList.add('on');
  }
  sheet.querySelector('.x').onclick = function () { sheet.classList.remove('on'); };
  function updCount() { var e = wrap.querySelector('.vrcount'); if (e) e.textContent = '🔎 Riesgos encontrados: ' + Object.keys(found).length + '/' + total; }
  var scenes = {};
  function fitHfov(s) {
    if (!s.haov) return s.hfov || 100;
    var r = wrap.clientWidth / Math.max(1, wrap.clientHeight), d2r = Math.PI / 180;
    var byV = 2 * Math.atan(Math.tan(s.vaov * 0.92 * d2r / 2) * r) / d2r;
    return Math.max(20, Math.min(s.hfov || 75, s.haov * 0.92, byV));
  }
  Object.keys(cfg.scenes).forEach(function (sid) {
    var s = cfg.scenes[sid];
    scenes[sid] = {title: s.title, type: 'equirectangular', panorama: s.pano, yaw: s.yaw || 0, pitch: s.pitch || 0, hfov: fitHfov(s),
      haov: s.haov || 360, vaov: s.vaov || 180, vOffset: 0, minHfov: 15, maxHfov: s.haov ? fitHfov(s) : 120,
      hotSpots: s.hs.map(function (h, idx) {
        var key = sid + idx, hunt = cfg.hunt && h.t !== 'link';
        if (hunt) total++;
        return {pitch: h.p, yaw: h.y, cssClass: 'hs-wrap',
          createTooltipFunc: function (div) {
            div.className += ' hs hs-' + h.t + (hunt ? ' hunt' : '') + (found[key] ? ' found' : '');
            div.innerHTML = (hunt && !found[key] ? '❔' : h.i) + '<span class="lbl">' + (h.l || h.title) + '</span>';
          },
          clickHandlerFunc: function (e) {
            if (h.t === 'link') { viewer.loadScene(h.scene); return; }
            if (hunt && !found[key]) { found[key] = 1; var d = e.target.closest('.hs'); if (d) { d.classList.add('found'); d.firstChild.textContent = h.i; } updCount();
              if (Object.keys(found).length === total && cfg.onComplete) setTimeout(cfg.onComplete, 600); }
            open(h);
          }};
      })};
    var b = document.createElement('button'); b.className = 'vrchip'; b.textContent = s.title; b.dataset.s = sid;
    b.onclick = function () { viewer.loadScene(sid); }; top.appendChild(b);
  });
  viewer = pannellum.viewer(wrap.querySelector('.pano'), {
    default: {firstScene: cfg.first, sceneFadeDuration: 900, autoLoad: true, autoRotate: -2, autoRotateInactivityDelay: 6000, showControls: false, compass: false},
    scenes: scenes});
  function mark() { var cur = viewer.getScene(); top.querySelectorAll('.vrchip').forEach(function (b) { b.classList.toggle('on', b.dataset.s === cur); }); sheet.classList.remove('on'); }
  viewer.on('scenechange', mark); mark(); updCount();
  var gyro = false;
  wrap.querySelector('[data-a=gyro]').onclick = function () {
    var btn = this;
    if (gyro) { viewer.stopOrientation(); gyro = false; btn.classList.remove('on'); return; }
    function go() { viewer.startOrientation(); gyro = true; btn.classList.add('on'); }
    if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then(function (r) { if (r === 'granted') go(); else alert('Permiso de movimiento denegado'); }).catch(function () { alert('No se pudo activar el giroscopio'); });
    } else if (viewer.isOrientationSupported && viewer.isOrientationSupported()) go();
    else if ('ondeviceorientation' in window) go();
    else alert('Tu dispositivo no tiene giroscopio. Arrastrá con el dedo o el mouse para mirar.');
  };
  wrap.querySelector('[data-a=full]').onclick = function () {
    var on = !wrap.classList.contains('full');
    wrap.classList.toggle('full', on); this.textContent = on ? '✕ Salir' : '⛶ Pantalla completa';
    try { if (on && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); else if (!on && document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
    setTimeout(function () { viewer.resize(); }, 250);
  };
  document.addEventListener('fullscreenchange', function () { if (!document.fullscreenElement && wrap.classList.contains('full')) { wrap.classList.remove('full'); wrap.querySelector('[data-a=full]').textContent = '⛶ Pantalla completa'; setTimeout(function () { viewer.resize(); }, 250); } });
  return {viewer: viewer, go: function (sid) { wrap.scrollIntoView({behavior: 'smooth'}); viewer.loadScene(sid); }};
};
