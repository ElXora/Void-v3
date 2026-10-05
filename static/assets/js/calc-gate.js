/* Calculator front screen. Type 105 then press Enter (or =) to open the main interface. */
(function () {
  var CODE = '105';
  try { if (sessionStorage.getItem('sn_unlocked') === '1') return; } catch (e) {}

  var css = '' +
  'html.sn-lock,html.sn-lock body{overflow:hidden!important;height:100%}' +
  '#sn-calc{position:fixed;inset:0;z-index:2147483647;background:#000;color:#fff;display:flex;justify-content:center;' +
  'font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",Roboto,Helvetica,Arial,sans-serif;' +
  'user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;touch-action:manipulation;transition:opacity .25s ease}' +
  '#sn-calc.sn-out{opacity:0;pointer-events:none}' +
  '#sn-calc *{box-sizing:border-box}' +
  '#sn-calc .sn-wrap{width:100%;max-width:440px;height:100%;max-height:860px;margin:auto 0;display:flex;flex-direction:column;justify-content:flex-end;' +
  'padding:16px 14px calc(18px + env(safe-area-inset-bottom)) 14px;padding-top:calc(16px + env(safe-area-inset-top))}' +
  '#sn-calc .sn-disp{text-align:right;font-weight:300;font-size:88px;line-height:1.05;padding:0 10px 14px;white-space:nowrap;overflow:hidden;font-variant-numeric:tabular-nums}' +
  '#sn-calc .sn-disp.m{font-size:68px}#sn-calc .sn-disp.s{font-size:52px}#sn-calc .sn-disp.xs{font-size:40px}' +
  '#sn-calc .sn-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}' +
  '#sn-calc button{border:0;outline:0;cursor:pointer;font:inherit;font-size:32px;color:#fff;background:#333;border-radius:50%;aspect-ratio:1;' +
  'display:flex;align-items:center;justify-content:center;padding:0;transition:filter .12s ease,background .12s ease}' +
  '#sn-calc button:active{filter:brightness(1.55)}' +
  '#sn-calc button.f{background:#a5a5a5;color:#000}' +
  '#sn-calc button.o{background:#ff9f0a;font-size:38px}' +
  '#sn-calc button.o.on{background:#fff;color:#ff9f0a}' +
  '#sn-calc button.z{grid-column:span 2;aspect-ratio:auto;border-radius:999px;justify-content:flex-start;padding-left:9%}' +
  '@media (max-height:560px){#sn-calc .sn-wrap{max-width:560px}#sn-calc .sn-disp{font-size:44px;padding-bottom:6px}' +
  '#sn-calc .sn-grid{gap:8px}#sn-calc button{aspect-ratio:auto;height:11.5dvh;min-height:34px;border-radius:999px;font-size:22px}}' +
  '@media (min-width:700px) and (min-height:700px){#sn-calc .sn-wrap{max-width:580px}#sn-calc .sn-disp{font-size:104px}}';

  var keys = [
    ['AC','f','ac'],['±','f','neg'],['%','f','pct'],['÷','o','/'],
    ['7','','7'],['8','','8'],['9','','9'],['×','o','*'],
    ['4','','4'],['5','','5'],['6','','6'],['−','o','-'],
    ['1','','1'],['2','','2'],['3','','3'],['+','o','+'],
    ['0','z','0'],['.','','.'],['=','o','=']
  ];
  var html = '<div class="sn-wrap"><div class="sn-disp" id="sn-d">0</div><div class="sn-grid">';
  keys.forEach(function (k) {
    html += '<button type="button" class="' + k[1] + '" data-k="' + k[2] + '"' + (k[2] === 'ac' ? ' id="sn-ac"' : '') + '>' + k[0] + '</button>';
  });
  html += '</div></div>';

  var style = document.createElement('style'); style.textContent = css;
  var root = document.createElement('div'); root.id = 'sn-calc'; root.innerHTML = html;
  var host = document.head || document.documentElement;
  host.appendChild(style);
  document.documentElement.appendChild(root);
  document.documentElement.classList.add('sn-lock');

  var disp = root.querySelector('#sn-d');
  var cur = '0', prev = null, op = null, fresh = false, fromCalc = false;

  function fmt(s) {
    if (s === 'Error') return s;
    var neg = s.charAt(0) === '-', t = neg ? s.slice(1) : s, p = t.split('.');
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? '-' : '') + p.join('.');
  }
  function render() {
    var t = fmt(cur); disp.textContent = t;
    var n = t.length; disp.className = 'sn-disp' + (n > 12 ? ' xs' : n > 9 ? ' s' : n > 6 ? ' m' : '');
    root.querySelector('#sn-ac').textContent = (cur === '0' && prev === null) ? 'AC' : 'C';
    Array.prototype.forEach.call(root.querySelectorAll('button.o'), function (b) {
      b.classList.toggle('on', !!op && fresh && b.getAttribute('data-k') === op);
    });
  }
  function calc(a, b, o) {
    a = parseFloat(a); b = parseFloat(b); var r;
    if (o === '+') r = a + b; else if (o === '-') r = a - b; else if (o === '*') r = a * b;
    else { if (b === 0) return 'Error'; r = a / b; }
    if (!isFinite(r)) return 'Error';
    return String(parseFloat(r.toPrecision(12)));
  }
  function unlock() {
    try { sessionStorage.setItem('sn_unlocked', '1'); } catch (e) {}
    document.removeEventListener('keydown', onKey, true);
    root.classList.add('sn-out');
    setTimeout(function () {
      document.documentElement.classList.remove('sn-lock');
      if (root.parentNode) root.parentNode.removeChild(root);
      if (style.parentNode) style.parentNode.removeChild(style);
    }, 280);
  }
  function press(k) {
    if (cur === 'Error' && k !== 'ac') { cur = '0'; }
    if (/^\d$/.test(k)) {
      if (fresh || cur === '0') cur = k; else if (cur.replace(/[-.]/g, '').length < 12) cur += k;
      fresh = false; fromCalc = false;
    } else if (k === '.') {
      if (fresh) { cur = '0.'; fresh = false; } else if (cur.indexOf('.') < 0) cur += '.';
      fromCalc = false;
    } else if (k === 'ac') {
      cur = '0'; prev = null; op = null; fresh = false; fromCalc = false;
    } else if (k === 'neg') {
      if (cur !== '0') cur = cur.charAt(0) === '-' ? cur.slice(1) : '-' + cur;
    } else if (k === 'pct') {
      cur = String(parseFloat((parseFloat(cur) / 100).toPrecision(12))); fresh = true; fromCalc = true;
    } else if (k === '+' || k === '-' || k === '*' || k === '/') {
      if (op && !fresh) { cur = calc(prev, cur, op); }
      prev = cur; op = k; fresh = true; fromCalc = true;
    } else if (k === '=') {
      if (!op && !fromCalc && cur === CODE) { unlock(); return; }
      if (op) { cur = calc(prev, cur, op); op = null; prev = null; fresh = true; fromCalc = true; }
    }
    render();
  }
  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key, m = null;
    if (/^\d$/.test(k) || k === '.' || k === '+' || k === '-' || k === '*' || k === '/') m = k;
    else if (k === ',') m = '.';
    else if (k === 'x' || k === 'X') m = '*';
    else if (k === 'Enter' || k === '=') m = '=';
    else if (k === '%') m = 'pct';
    else if (k === 'Escape' || k === 'Delete' || k === 'c' || k === 'C') m = 'ac';
    else if (k === 'Backspace') {
      if (!fresh && cur !== 'Error' && cur.length > 1 && cur !== '0') { cur = cur.slice(0, -1); if (cur === '-' ) cur = '0'; render(); }
      else if (!fresh) { cur = '0'; render(); }
      e.preventDefault(); return;
    }
    if (m) { e.preventDefault(); e.stopPropagation(); press(m); }
  }
  root.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button[data-k]') : null;
    if (b) press(b.getAttribute('data-k'));
  });
  document.addEventListener('keydown', onKey, true);
  render();
})();
