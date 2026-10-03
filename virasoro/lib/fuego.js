/* Simulador de extintor con realidad aumentada (técnica PASA) */
(function () {
  var root, cv, cx, video, bgImg, W, H, dpr, raf, last;
  var S = {};
  var ori = {on: false, a0: null, b0: null, a: 0, b: 0};
  var audio = null;

  var PE = 'Calle J. R. Vidal, frente a la garita S-1 (Acceso Norte). Quedate sobre la vereda del corralón: no cruces hacia la Ruta Nacional 14.';
  var SCEN = {
    _def: {title: 'Simulador de extintor', bg: '../img/escena_sin_fuego.jpg', fx: .5, fy: .555, fw: .24, ext: ['PQS', 'ABC'],
      desc: 'Practicá la técnica <b>PASA</b> sobre un principio de incendio virtual. Con la cámara, el fuego aparece en tu entorno real: <b>mové el celular</b> para apuntar.'},
    cisterna: {title: '⛽ Fuego en la cisterna de combustible', bg: '../pano/real_tanque.jpg', fx: .57, fy: .62, fw: .3, ext: ['PQS', 'ABC'],
      desc: 'Un derrame de combustible junto a la cisterna (S-17) se encendió con el cargador que estaba al lado.',
      alert: '🔥 ¡Se prendió el combustible derramado!',
      q: [{t: '¿Qué hacés primero?', o: [['Grito "¡FUEGO EN LA CISTERNA!", aviso al responsable y que llamen al 100', 1, 'Correcto: primero la alarma, así se evacúa y llega ayuda.'], ['Tiro un balde de agua', 0, '¡No! El agua sobre combustible esparce el fuego.'], ['Intento mover la cisterna', 0, 'No: perdés tiempo y te exponés a las llamas.']]},
        {t: 'Si es seguro, ¿qué más hacés antes de atacar el fuego?', o: [['Corto la energía del cargador desde el tablero', 1, 'Bien: eliminás la fuente de ignición.'], ['Desenchufo el cargador tirando del cable junto al fuego', 0, 'No te acerques a las llamas: cortá desde el tablero.']]},
        {t: '¿Qué extintor usás?', o: [['PQS ABC del puesto E-12 (o el carro E-10 de 50 kg)', 1, 'Correcto: el polvo químico sirve para combustibles (clase B).'], ['Una manguera de agua', 0, 'No: el agua no sirve para combustibles líquidos.']]}],
      after: 'Cubrí el derrame con arena o absorbente para evitar que se vuelva a encender y no uses la zona hasta que la revisen.'},
    taller: {title: '🛞 Fuego en las cubiertas del taller', bg: '../pano/real_cubiertas.jpg', fx: .49, fy: .7, fw: .36, ext: ['PQS', 'ABC'], mode: 'evac', ex: .12, ey: .9,
      desc: 'La pila de cubiertas del taller mecánico (S-14) se prendió fuego y sale mucho humo negro.',
      alert: '🔥 ¡Arde la pila de cubiertas!',
      q: [{t: '¿Qué hacés primero?', o: [['Grito "¡FUEGO EN EL TALLER!" y aviso a todos', 1, 'Correcto: la alarma es lo primero.'], ['Busco el celular para filmar', 0, 'No: cada segundo cuenta.']]},
        {t: 'La pila es alta y el humo negro avanza rápido. ¿Intentás apagarlo?', o: [['No: evacúo y que llamen al 100 (Bomberos)', 1, 'Correcto: un fuego de cubiertas ya no es incipiente y su humo es tóxico.'], ['Sí, con el extintor E-08', 0, 'No: es demasiado grande para un extintor, y además el E-08 está vencido (RECARGA).']]},
        {t: '¿Cómo salís si hay humo?', o: [['Agachado, por debajo del humo, sin correr y sin volver atrás', 1, 'Correcto: abajo el aire es más limpio.'], ['Parado y corriendo', 0, 'No: el humo caliente está arriba y podés caerte.']]}],
      evac: '🏃 <b>Evacuá:</b> tocá <b>Ir a la salida</b> (o la salida verde) para ir a la playa', evacEnd: 'Saliste a tiempo. En la playa no te detengas: andá al punto de encuentro, avisá que estás bien y recibí a Bomberos con el portón libre.'},
    deposito: {title: '🛢️ Fuego en el depósito de lubricantes', bg: '../pano/real_dep1t.jpg', fx: .8, fy: .74, fw: .22, ext: ['PQS', 'ABC'],
      desc: 'Se prendió fuego el lubricante derramado al lado de un tambor en el Depósito 1 (S-15).',
      alert: '🔥 ¡Fuego junto al tambor de lubricante!',
      q: [{t: '¿Qué hacés primero?', o: [['Doy la alarma y aviso al responsable', 1, 'Correcto.'], ['Saco los tambores corriendo', 0, 'No: te exponés a las llamas y a los vapores.']]},
        {t: '¿Qué extintor usás?', o: [['PQS ABC del puesto E-09 o el carro E-10', 1, 'Correcto: aceites y lubricantes son clase B.'], ['Agua', 0, 'No: el aceite encendido salpica y se esparce con agua.']]},
        {t: 'Hay humo en el depósito. ¿Qué tenés en cuenta?', o: [['Ataco con la puerta detrás mío, y si el humo crece salgo', 1, 'Correcto: siempre con la salida a tu espalda.'], ['Cierro la puerta para que no salga el humo', 0, 'No: te quedás encerrado con el fuego.']]}],
      after: 'Ventilá el depósito, revisá que no quede nada caliente y avisá para recargar el extintor.'},
    electrico: {title: '⚡ Fuego en el tablero eléctrico', bg: '../pano/real_dep1.jpg', fx: .9, fy: .45, fw: .22, ext: ['CO₂', 'BC'],
      desc: 'Sale fuego y humo del tablero eléctrico del Depósito 1.',
      alert: '🔥 ¡Fuego en el tablero eléctrico!',
      q: [{t: '¿Qué hacés primero?', o: [['Corto la energía desde el tablero general, si puedo hacerlo sin riesgo', 1, 'Correcto: sin corriente, el fuego es más fácil de controlar y no hay riesgo de electrocución.'], ['Tiro agua', 0, '¡Nunca! El agua conduce la electricidad: riesgo de electrocución.'], ['Abro la tapa del tablero para ver', 0, 'No: el fuego puede avivarse.']]},
        {t: '¿Qué extintor usás?', o: [['CO₂ (o PQS ABC)', 1, 'Correcto: el CO₂ no conduce electricidad ni deja residuos.'], ['Espuma o agua', 0, 'No: conducen la electricidad.']]}],
      after: 'No vuelvas a dar energía: que un electricista matriculado revise el tablero.'},
    herreria: {title: '🔥 Chispas de soldadura en la herrería', bg: '../pano/real_herreria.jpg', fx: .44, fy: .78, fw: .22, ext: ['PQS', 'ABC'],
      desc: 'Las chispas de la soldadura prendieron unos trapos con aceite debajo de la dobladora (S-13).',
      alert: '🔥 ¡Se prendieron los trapos!',
      q: [{t: '¿Qué hacés primero?', o: [['Apago la soldadora y doy la alarma', 1, 'Correcto: cortá la fuente de calor y avisá.'], ['Sigo soldando y después veo', 0, 'No: el fuego puede crecer en segundos.']]},
        {t: '¿Con qué lo apagás?', o: [['Extintor PQS ABC del puesto E-06 (sobre la columna)', 1, 'Correcto.'], ['Lo tapo con la ropa', 0, 'No: te podés quemar y no siempre se apaga.']]}],
      after: 'Antes de volver a soldar: retirá los combustibles a 10 m y usá cortina o biombo. Quedate 30 minutos vigilando la zona.'}
  };
  var SC = SCEN._def;
  function $(q) { return root.querySelector(q); }
  function build() {
    root = document.createElement('div'); root.id = 'sim';
    root.innerHTML =
      '<video playsinline muted autoplay></video><canvas></canvas>' +
      '<div class="top"><div class="steps"><span>P</span><span>A</span><span>S</span><span>A</span></div><button class="close">✕</button></div>' +
      '<div class="msg"></div>' +
      '<div class="meters"><div class="meter">🔥 FUEGO<i><b class="mf" style="background:#e67e22"></b></i></div><div class="meter">🧯 CARGA EXTINTOR<i><b class="mc" style="background:#ecf0f1"></b></i></div></div>' +
      '<svg class="ext" viewBox="0 0 100 190"><defs><linearGradient id="gx" x1="0" x2="1"><stop offset="0" stop-color="#7d1810"/><stop offset=".35" stop-color="#e74c3c"/><stop offset=".6" stop-color="#c0392b"/><stop offset="1" stop-color="#6b140d"/></linearGradient></defs>' +
      '<rect x="22" y="58" width="56" height="128" rx="22" fill="url(#gx)"/><rect x="30" y="100" width="40" height="44" rx="4" fill="#fff" opacity=".9"/><text x="50" y="118" font-size="9" text-anchor="middle" font-weight="700" fill="#c0392b" class="el1">PQS</text><text x="50" y="132" font-size="9" text-anchor="middle" font-weight="700" fill="#333" class="el2">ABC</text>' +
      '<rect x="40" y="34" width="20" height="26" fill="#333"/><path d="M36 30 L84 22 L86 28 L40 38Z" fill="#222"/><path d="M36 40 L80 50 L78 56 L36 46Z" fill="#444"/>' +
      '<circle cx="28" cy="46" r="11" fill="#eee" stroke="#555" stroke-width="2"/><line class="needle" x1="28" y1="46" x2="34" y2="38" stroke="#c0392b" stroke-width="2"/><path d="M20 49 A9 9 0 0 1 36 49" stroke="#27ae60" stroke-width="2" fill="none"/>' +
      '<g class="pin"><circle cx="62" cy="36" r="9" fill="none" stroke="#f1c40f" stroke-width="4"/><line x1="56" y1="36" x2="44" y2="36" stroke="#f1c40f" stroke-width="3"/><circle cx="62" cy="36" r="16" fill="transparent"/></g>' +
      '<path d="M60 40 C95 60 96 120 80 150" stroke="#111" stroke-width="5" fill="none"/></svg>' +
      '<button class="squeeze" disabled>MANTENÉ<br>APRETADO</button>' +
      '<div class="start"><div style="font-size:3rem">🧯🔥</div><h2 class="st">Simulador de extintor</h2><p class="sd"></p>' +
      '<button class="btn btn-r" data-m="cam">📷 Usar cámara (realidad aumentada)</button><button class="btn btn-p" data-m="img">🏭 Usar la foto del lugar</button><p style="font-size:.72rem;opacity:.7">Entrenamiento orientativo. No reemplaza la práctica real con fuego controlado.</p></div>' +
      '<div class="quiz"></div><button class="exitb">🏃 Ir a la salida</button><div class="end"></div>';
    document.body.appendChild(root);
    cv = $('canvas'); cx = cv.getContext('2d'); video = $('video');
    bgImg = new Image(); bgImg.src = (window.SIM_BG || '../img/escena_sin_fuego.jpg');
    $('.close').onclick = close;
    $('[data-m=cam]').onclick = function () { start(true); };
    $('[data-m=img]').onclick = function () { start(false); };
    $('.pin').addEventListener('click', pullPin);
    $('.exitb').onclick = function () { if (S.phase === 'evac') end('evac'); };
    cv.addEventListener('pointerdown', function (e) { if (S.phase !== 'evac' || !S.exitXY) return; var dx = e.clientX - S.exitXY[0], dy = e.clientY - S.exitXY[1]; if (dx * dx + dy * dy < 60 * 60) end('evac'); });
    var sq = $('.squeeze');
    function down(e) { e.preventDefault(); if (sq.disabled) return; S.btn = true; sq.classList.add('down'); }
    function up() { S.btn = false; sq.classList.remove('down'); }
    sq.addEventListener('pointerdown', down); sq.addEventListener('pointerup', up); sq.addEventListener('pointercancel', up); sq.addEventListener('pointerleave', up);
    cv.addEventListener('pointerdown', function (e) { S.ptr = true; S.px = e.clientX; S.py = e.clientY; S.lpx = e.clientX; S.lpy = e.clientY; });
    cv.addEventListener('pointermove', function (e) { if (S.ptr && !ori.on) { S.ox += e.clientX - S.lpx; S.oy += e.clientY - S.lpy; } S.lpx = e.clientX; S.lpy = e.clientY; });
    window.addEventListener('pointerup', function () { S.ptr = false; });
    window.addEventListener('keydown', function (e) { if (root.classList.contains('on') && e.code === 'Space') { e.preventDefault(); if (!sq.disabled) { S.btn = true; sq.classList.add('down'); } } });
    window.addEventListener('keyup', function (e) { if (e.code === 'Space') up(); });
    window.addEventListener('resize', size);
  }
  function size() { dpr = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function onOri(e) {
    if (e.alpha == null) return;
    ori.on = true; ori.a = e.alpha; ori.b = e.beta;
    if (ori.a0 == null) { ori.a0 = e.alpha; ori.b0 = e.beta; }
  }
  function initAudio() {
    try {
      var A = window.AudioContext || window.webkitAudioContext; if (!A) return;
      var ac = new A(), len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      function chain(type, f, q) { var s = ac.createBufferSource(); s.buffer = buf; s.loop = true; var fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; var g = ac.createGain(); g.gain.value = 0; s.connect(fl); fl.connect(g); g.connect(ac.destination); s.start(); return g; }
      audio = {ac: ac, spray: chain('bandpass', 2500, .6), fire: chain('lowpass', 500, .8)};
    } catch (e) { audio = null; }
  }
  function start(cam) {
    $('.start').style.display = 'none'; $('.end').style.display = 'none';
    S = {cam: cam, step: 0, health: 1, charge: 1, ox: 0, oy: 0, aimT: 0, t0: performance.now(), parts: [], powder: [], smoke: [], btn: false, sweep: 0, lastAimX: null, done: false, onBaseT: 0};
    ori.a0 = null; ori.on = false;
    S.grow = 1; S.phase = SC.q ? 'quiz' : 'pasa';
    size();
    if (bgImg.complete && bgImg.naturalWidth) { var sc0 = Math.max(W / bgImg.naturalWidth, H / bgImg.naturalHeight) * 1.35, iw0 = bgImg.naturalWidth * sc0, ih0 = bgImg.naturalHeight * sc0; S.ox = iw0 * (.5 - SC.fx); S.oy = H * .6 - (H - ih0) / 2 - ih0 * SC.fy; } setSteps(); $('.squeeze').disabled = true; $('.exitb').style.display = 'none';
    if (S.phase === 'quiz') { $('.pin').style.display = 'none'; msg(SC.alert, 'Respondé cómo actuar'); showQ(0); }
    else { $('.quiz').style.display = 'none'; $('.pin').style.display = ''; msg('1 · <b>P</b>alanca: tocá el <b>pasador amarillo</b> del extintor', 'Antes: asegurate de tener una salida detrás tuyo'); }
    if (!audio) initAudio(); if (audio && audio.ac.state === 'suspended') audio.ac.resume();
    var p = (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') ? DeviceOrientationEvent.requestPermission().catch(function () {}) : Promise.resolve();
    p.then(function () { window.addEventListener('deviceorientation', onOri); });
    if (cam && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({video: {facingMode: {ideal: 'environment'}}, audio: false}).then(function (st) { video.srcObject = st; video.play(); S.stream = st; })
        .catch(function () { S.cam = false; if (S.phase === 'pasa') msg('No se pudo abrir la cámara: usamos la foto del lugar', 'Tocá el pasador amarillo para empezar'); });
    } else S.cam = false;
    last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  }
  function close() {
    root.classList.remove('on'); cancelAnimationFrame(raf);
    if (S.stream) S.stream.getTracks().forEach(function (t) { t.stop(); });
    window.removeEventListener('deviceorientation', onOri);
    if (audio) { audio.spray.gain.value = 0; audio.fire.gain.value = 0; }
    document.body.style.overflow = '';
  }
  function setSteps() { var sp = root.querySelectorAll('.steps span'); for (var i = 0; i < 4; i++) sp[i].className = i < S.step ? 'ok' : (i === S.step ? 'on' : ''); }
  function msg(a, b) { $('.msg').innerHTML = a + (b ? '<small>' + b + '</small>' : ''); }
  function showQ(i) {
    var q = SC.q[i], z = $('.quiz'); z.style.display = 'block';
    z.innerHTML = '<div class="qn">Paso ' + (i + 1) + ' de ' + SC.q.length + '</div><b>' + q.t + '</b>' + q.o.map(function (o, k) { return k; }).sort(function () { return Math.random() - .5; }).map(function (k) { return '<button data-k="' + k + '">' + q.o[k][0] + '</button>'; }).join('') + '<div class="fb"></div>';
    z.querySelectorAll('button').forEach(function (b) {
      b.onclick = function () {
        var o = q.o[+b.dataset.k], fb = z.querySelector('.fb');
        if (!o[1]) { b.classList.add('bad'); fb.className = 'fb bad'; fb.textContent = '✗ ' + o[2]; if (navigator.vibrate) navigator.vibrate(200); return; }
        b.classList.add('good'); fb.className = 'fb good'; fb.textContent = '✓ ' + o[2];
        z.querySelectorAll('button').forEach(function (x) { x.disabled = true; });
        setTimeout(function () { if (i + 1 < SC.q.length) showQ(i + 1); else afterQuiz(); }, 1600);
      };
    });
  }
  function afterQuiz() {
    $('.quiz').style.display = 'none';
    if (SC.mode === 'evac') { S.phase = 'evac'; $('.exitb').style.display = 'block'; msg(SC.evac, 'El fuego crece: no te detengas'); }
    else { S.phase = 'pasa'; $('.pin').style.display = ''; msg('Fuego incipiente: podés atacarlo. 1 · <b>P</b>alanca: tocá el <b>pasador amarillo</b>', 'Con la salida detrás tuyo · extintor ' + SC.ext.join(' ')); }
  }
  function pullPin() {
    if (S.step !== 0 || S.phase !== 'pasa') return;
    var pin = $('.pin'); pin.style.transition = 'transform .5s, opacity .5s'; pin.style.transform = 'translate(30px,-40px) rotate(40deg)'; pin.style.opacity = 0;
    setTimeout(function () { pin.style.display = 'none'; pin.style.transform = ''; pin.style.opacity = 1; }, 520);
    S.step = 1; setSteps(); $('.squeeze').disabled = false; if (navigator.vibrate) navigator.vibrate(40);
    msg('2 · <b>A</b>puntá a la <b>BASE</b> del fuego', ori.on ? 'Mové el celular hasta que la mira ⊕ quede en la base de las llamas' : 'Arrastrá la escena hasta que la mira ⊕ quede en la base');
  }
  function geom() {
    // fire anchor in screen coords
    var k = Math.max(W, H) / 55;
    var dx = 0, dy = 0;
    if (ori.on && ori.a0 != null) { var da = ori.a - ori.a0; if (da > 180) da -= 360; if (da < -180) da += 360; dx = da * k; dy = (ori.b - ori.b0) * k; }
    var ox = S.ox + dx, oy = S.oy + dy;
    var g = {};
    if (!S.cam && bgImg.complete && bgImg.naturalWidth) {
      var sc = Math.max(W / bgImg.naturalWidth, H / bgImg.naturalHeight) * 1.35, iw = bgImg.naturalWidth * sc, ih = bgImg.naturalHeight * sc;
      var mx = (iw - W) / 2, my = (ih - H) / 2;
      ox = Math.max(-mx, Math.min(mx, ox)); oy = Math.max(-my, Math.min(my, oy));
      g.ix = (W - iw) / 2 + ox; g.iy = (H - ih) / 2 + oy; g.iw = iw; g.ih = ih;
      g.fx = g.ix + iw * SC.fx; g.fy = g.iy + ih * SC.fy; g.fw = iw * SC.fw * S.grow;
      if (SC.ex != null) g.exit = [g.ix + iw * SC.ex, g.iy + ih * SC.ey];
    } else { g.fx = W / 2 + ox + W * 0.18; g.fy = H * 0.62 + oy; g.fw = Math.min(W, H) * 0.42 * S.grow; }
    return g;
  }
  function drawBg(g) {
    if (S.cam && video.readyState >= 2) {
      var vw = video.videoWidth, vh = video.videoHeight, sc = Math.max(W / vw, H / vh);
      cx.drawImage(video, (W - vw * sc) / 2, (H - vh * sc) / 2, vw * sc, vh * sc);
      // ember bed on the real floor
      var r = cx.createRadialGradient(g.fx, g.fy, 2, g.fx, g.fy, g.fw * .6);
      r.addColorStop(0, 'rgba(40,20,10,.85)'); r.addColorStop(1, 'rgba(0,0,0,0)');
      cx.fillStyle = r; cx.beginPath(); cx.ellipse(g.fx, g.fy + g.fw * .04, g.fw * .6, g.fw * .16, 0, 0, 7); cx.fill();
    } else if (g.iw) cx.drawImage(bgImg, g.ix, g.iy, g.iw, g.ih);
    else { cx.fillStyle = '#222'; cx.fillRect(0, 0, W, H); }
  }
  function loop(now) {
    var dt = Math.min(.05, (now - last) / 1000); last = now;
    if (S.phase === 'quiz') S.grow = Math.min(1.3, S.grow + dt * .012); else if (S.phase === 'evac') S.grow = Math.min(2.3, S.grow + dt * .2);
    var g = geom(); drawBg(g);
    var aimX = W / 2, aimY = H / 2;
    var spraying = S.btn && S.step >= 1 && S.charge > 0 && !S.done;
    // aim evaluation
    var rx = (aimX - g.fx) / g.fw, ry = (aimY - g.fy) / g.fw;
    var onBase = Math.abs(rx) < 0.55 * Math.max(.45, S.health) && ry > -0.22 && ry < 0.18;
    var onFlames = Math.abs(rx) < 0.6 && ry <= -0.22 && ry > -1.2;
    if (S.lastAimX != null) { var v = Math.abs((aimX - g.fx) - S.lastAimX) / dt; S.sweep = S.sweep * .9 + v * .1; }
    S.lastAimX = aimX - g.fx;
    if (S.step === 1 && onBase) { S.aimT += dt; if (S.aimT > .5) { S.step = 2; setSteps(); msg('3 · apretá (<b>S</b>queeze): <b>mantené apretado</b> el botón rojo', 'Descarga firme y sostenida'); } }
    if (spraying) {
      S.charge = Math.max(0, S.charge - dt / 13);
      if (S.step === 2) { S.step = 3; setSteps(); }
      var dmg = 0;
      if (onBase) { dmg = dt * (0.07 + 0.22 * Math.min(1, S.sweep / (W * .35))); S.onBaseT += dt; }
      else if (onFlames) dmg = dt * 0.015;
      S.health = Math.max(0, S.health - dmg);
      if (S.step === 3) {
        if (!onBase) msg(onFlames ? '⬇️ ¡Más abajo! Apuntá a la <b>BASE</b>, no a las llamas' : '🎯 Apuntá al fuego', '');
        else if (S.sweep < W * .12) msg('4 · <b>A</b>banicá: mové de <b>lado a lado</b> barriendo la base', ori.on ? 'Girá el celular suavemente izquierda ↔ derecha' : 'Arrastrá izquierda ↔ derecha');
        else msg('✅ ¡Muy bien! Seguí barriendo la base', 'No des la espalda al fuego');
      }
      if (navigator.vibrate && Math.random() < .2) navigator.vibrate(25);
      for (var i = 0; i < 9; i++) {
        var sx = W * .62, sy = H + 10, t = Math.random();
        S.powder.push({x: sx, y: sy, vx: (aimX - sx) * (1.6 + Math.random() * .6) + (Math.random() - .5) * 120, vy: (aimY - sy) * (1.6 + Math.random() * .6) + (Math.random() - .5) * 120, life: 0, max: .55 + Math.random() * .5, r: 6 + Math.random() * 10});
      }
    } else if (!S.done) S.health = Math.min(1, S.health + dt * (S.step >= 3 ? 0.035 : 0));
    if (audio) { audio.spray.gain.value = spraying ? .35 : 0; audio.fire.gain.value = S.done ? 0 : .5 * S.health; }
    // fire particles (additive)
    var hcur = S.health, n = Math.round(26 * hcur * (W > 700 ? 1.3 : 1));
    for (i = 0; i < n; i++) S.parts.push({x: (Math.random() - .5) * g.fw * .62 * Math.max(.3, hcur), y: 0, vx: (Math.random() - .5) * 20, vy: -(90 + Math.random() * 160) * (.5 + hcur * .7) * (g.fw / 300), life: 0, max: .5 + Math.random() * .7, r: g.fw * (.06 + Math.random() * .07) * (.5 + hcur * .6)});
    if (Math.random() < hcur * .7 + (S.done ? 0 : 0)) S.smoke.push({x: (Math.random() - .5) * g.fw * .4, y: -g.fw * .7 * hcur, vx: (Math.random() - .5) * 15, vy: -40 - Math.random() * 30, life: 0, max: 2.5, r: g.fw * .12});
    cx.save();
    // smoke
    S.smoke = S.smoke.filter(function (p) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += 14 * dt; var a = (1 - p.life / p.max) * .22; if (a <= 0) return false; cx.fillStyle = 'rgba(60,60,60,' + a + ')'; cx.beginPath(); cx.arc(g.fx + p.x, g.fy + p.y, p.r, 0, 7); cx.fill(); return true; });
    cx.globalCompositeOperation = 'lighter';
    // glow
    if (hcur > 0.02) { var gl = cx.createRadialGradient(g.fx, g.fy - g.fw * .25, 0, g.fx, g.fy - g.fw * .25, g.fw * 1.3); gl.addColorStop(0, 'rgba(255,140,40,' + (.35 * hcur) + ')'); gl.addColorStop(1, 'rgba(255,80,0,0)'); cx.fillStyle = gl; cx.fillRect(g.fx - g.fw * 1.4, g.fy - g.fw * 1.6, g.fw * 2.8, g.fw * 2.4); }
    S.parts = S.parts.filter(function (p) {
      p.life += dt; var k = p.life / p.max; if (k >= 1) return false;
      p.x += p.vx * dt - p.x * dt * 1.6; p.y += p.vy * dt; var r = p.r * (1 - k * .7);
      var col = k < .25 ? [255, 240, 180] : k < .55 ? [255, 160, 40] : [220, 60, 10];
      var gr = cx.createRadialGradient(g.fx + p.x, g.fy + p.y, 0, g.fx + p.x, g.fy + p.y, r);
      gr.addColorStop(0, 'rgba(' + col + ',' + (.55 * (1 - k)) + ')'); gr.addColorStop(1, 'rgba(' + col + ',0)');
      cx.fillStyle = gr; cx.beginPath(); cx.arc(g.fx + p.x, g.fy + p.y, r, 0, 7); cx.fill(); return true;
    });
    cx.globalCompositeOperation = 'source-over';
    // powder
    S.powder = S.powder.filter(function (p) {
      p.life += dt; var k = p.life / p.max; if (k >= 1) return false;
      p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .93; p.vy *= .93; p.r += 50 * dt;
      cx.fillStyle = 'rgba(245,245,240,' + (.32 * (1 - k)) + ')'; cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 7); cx.fill(); return true;
    });
    cx.restore();
    // crosshair
    cx.strokeStyle = onBase ? '#2ecc71' : '#fff'; cx.lineWidth = 3; cx.beginPath(); cx.arc(aimX, aimY, 22, 0, 7); cx.moveTo(aimX - 34, aimY); cx.lineTo(aimX - 10, aimY); cx.moveTo(aimX + 10, aimY); cx.lineTo(aimX + 34, aimY); cx.moveTo(aimX, aimY - 34); cx.lineTo(aimX, aimY - 10); cx.moveTo(aimX, aimY + 10); cx.lineTo(aimX, aimY + 34); cx.stroke();
    // off-screen arrow
    if (g.fx < 0 || g.fx > W || g.fy < 0 || g.fy > H) { var ang = Math.atan2(g.fy - H / 2, g.fx - W / 2); cx.save(); cx.translate(W / 2 + Math.cos(ang) * Math.min(W, H) * .35, H / 2 + Math.sin(ang) * Math.min(W, H) * .35); cx.rotate(ang); cx.fillStyle = '#e67e22'; cx.beginPath(); cx.moveTo(22, 0); cx.lineTo(-12, -14); cx.lineTo(-12, 14); cx.fill(); cx.restore(); }
    S.exitXY = null;
    if (S.phase === 'evac') {
      cx.fillStyle = 'rgba(30,30,30,' + Math.min(.45, (S.grow - 1) * .35) + ')'; cx.fillRect(0, 0, W, H * .45);
      if (g.exit) { var pr = 26 + Math.sin(now / 200) * 6; S.exitXY = g.exit; cx.fillStyle = 'rgba(39,174,96,.9)'; cx.beginPath(); cx.arc(g.exit[0], g.exit[1], pr, 0, 7); cx.fill(); cx.strokeStyle = '#fff'; cx.lineWidth = 3; cx.stroke(); cx.fillStyle = '#fff'; cx.font = '700 22px system-ui'; cx.textAlign = 'center'; cx.fillText('🏃', g.exit[0], g.exit[1] + 8); cx.font = '700 13px system-ui'; cx.fillText('SALIDA', g.exit[0], g.exit[1] - pr - 6); }
    }
    $('.mf').style.width = (S.health * 100) + '%'; $('.mc').style.width = (S.charge * 100) + '%';
    $('.needle').setAttribute('x2', 28 + Math.cos(Math.PI * (1 - S.charge) + Math.PI) * -8); $('.needle').setAttribute('y2', 46 - Math.abs(Math.sin(Math.PI * (1 - S.charge))) * 8 - (S.charge > .5 ? 0 : 0));
    if (!S.done && S.health <= 0) end(true);
    else if (!S.done && S.charge <= 0 && S.health > 0) end(false);
    raf = requestAnimationFrame(loop);
  }
  function end(ok) {
    if (ok === 'evac') {
      S.done = true; S.phase = 'end'; $('.exitb').style.display = 'none';
      var e2 = $('.end'); e2.innerHTML = '<div style="font-size:3rem">✅</div><h2>¡Evacuaste bien!</h2><p>' + SC.evacEnd + '<br><br>📍 <b>Punto de encuentro:</b> ' + PE + '</p><a class="btn btn-r" href="tel:100">🚒 Llamar al 100</a><button class="btn btn-p" data-r>🔁 Repetir</button><button class="btn btn-g" data-c>Cerrar</button>';
      e2.querySelector('[data-r]').onclick = function () { start(S.cam); }; e2.querySelector('[data-c]').onclick = close;
      e2.style.display = 'flex'; if (navigator.vibrate) navigator.vibrate([60, 60, 60]); return;
    }
    S.done = true; S.phase = 'end'; S.btn = false; $('.squeeze').disabled = true; S.step = 4; setSteps();
    var secs = ((performance.now() - S.t0) / 1000).toFixed(0), e = $('.end');
    e.innerHTML = ok ? '<div style="font-size:3rem">✅</div><h2>¡Fuego extinguido!</h2><p>Lo lograste en <b>' + secs + ' s</b> usando el ' + Math.round((1 - S.charge) * 100) + '% de la carga.<br><br>Ahora: <b>no des la espalda</b>, retirate observando el foco, avisá al responsable y verificá que no haya reignición. Reportá el uso para <b>recargar</b> el extintor.' + (SC.after ? '<br><br>' + SC.after : '') + '</p>'
      : '<div style="font-size:3rem">🚨</div><h2>El extintor se vació</h2><p>El fuego no se controló. <b>Evacuá de inmediato</b> por la ruta más cercana hacia el punto de encuentro (' + PE + ') y llamá al <b>100</b>.<br><br>Consejo: apuntá siempre a la <b>base</b> y abanicá de lado a lado.</p><a class="btn btn-r" href="tel:100">🚒 Llamar al 100</a>';
    e.innerHTML += '<button class="btn btn-p" data-r>🔁 Intentar de nuevo</button><button class="btn btn-g" data-c>Cerrar</button>';
    e.querySelector('[data-r]').onclick = function () { start(S.cam); };
    e.querySelector('[data-c]').onclick = close;
    setTimeout(function () { e.style.display = 'flex'; }, 900);
    if (navigator.vibrate) navigator.vibrate(ok ? [60, 60, 60] : [300]);
  }
  window.abrirSimulador = function (id) {
    if (!root) build();
    SC = SCEN[id] || SCEN._def; bgImg.src = id && SCEN[id] ? SC.bg : (window.SIM_BG || SC.bg);
    $('.st').textContent = SC.title; $('.sd').innerHTML = SC.desc + (SC.q ? '<br><br>Primero elegí <b>cómo actuar</b> y después actuá sobre el fuego.' : '');
    $('.el1').textContent = SC.ext[0]; $('.el2').textContent = SC.ext[1];
    $('.quiz').style.display = 'none'; $('.exitb').style.display = 'none';
    root.classList.add('on'); document.body.style.overflow = 'hidden';
    $('.start').style.display = 'flex'; $('.end').style.display = 'none'; size();
  };
})();
