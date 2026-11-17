// mobile.js — 2026-11-17 — giao diện điện thoại: cần đi bên trái, nút đánh/chiêu bên phải, vuốt màn xoay máy, chụm hai ngón để gần/xa.
// Mọi nút bắn sự kiện phím giả (keydown/keyup) nên dùng lại nguyên logic bàn phím của loi.js/ui.js.
// Bật tự động trên máy cảm ứng; ép bật bằng ?dt=1, ép tắt bằng ?dt=0.
(function () {
const DK = window.DK;
const q = location.search;
const coCam = /[?&]dt=1/.test(q) || (!/[?&]dt=0/.test(q) && (matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window));
if (!coCam) return;
document.body.classList.add('dt', 'gon');   // điện thoại: bảng chọn thu gọn sẵn
// máy yếu: giảm độ phân giải vẽ
try { const r = DK.renderer || null; if (r && r.setPixelRatio) { r.setPixelRatio(Math.min(1.5, devicePixelRatio || 1)); dispatchEvent(new Event('resize')); } } catch (e) {}

const bam = (k, len) => dispatchEvent(new KeyboardEvent(len === false ? 'keyup' : 'keydown', { key: k, bubbles: true }));
const go = k => { bam(k); setTimeout(() => bam(k, false), 60); };

// ---------------------------------------------------------------- khung nút
const ui = document.createElement('div'); ui.id = 'dt_ui';
ui.innerHTML = `
  <div id="dt_can"><div id="dt_num"></div></div>
  <div id="dt_phai">
    <button data-k="j" class="to" id="dt_danh">⚔</button>
    <button data-k="z" class="cc">Z</button><button data-k="x" class="cc">X</button><button data-k="c" class="cc">C</button>
    <button data-k="v" class="cc">V</button><button data-k="r" class="cc">R</button>
    <button data-k="Shift" class="nho">Lộn</button><button data-k=" " class="nho">Nhảy</button>
    <button data-k="k" data-giu="1" class="nho">Đỡ</button>
  </div>
  <div id="dt_tren">
    <button data-k="q">Q trận</button><button data-k="f">F ngự</button><button data-k="Tab">Khoá</button>
    <button data-k="Backspace">⟲</button><button data-k="p">⏸</button>
  </div>`;
document.body.appendChild(ui);
ui.querySelectorAll('button').forEach(b => {
  const k = b.dataset.k, giu = b.dataset.giu;
  b.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); b.classList.add('an'); if (giu) bam(k); else go(k); }, { passive: false });
  const tha = e => { e.preventDefault(); b.classList.remove('an'); if (giu) bam(k, false); };
  b.addEventListener('touchend', tha, { passive: false }); b.addEventListener('touchcancel', tha, { passive: false });
  b.addEventListener('click', e => { if (!giu) go(k); });   // thử bằng chuột khi ?dt=1
});

// ---------------------------------------------------------------- cần đi (analog → DK.joy)
const can = ui.querySelector('#dt_can'), num = ui.querySelector('#dt_num');
DK.joy = { x: 0, y: 0 };
let idCan = null, tam = null; const RC = 52;
function datCan(t) {
  let dx = t.clientX - tam.x, dy = t.clientY - tam.y; const l = Math.hypot(dx, dy);
  if (l > RC) { dx *= RC / l; dy *= RC / l; }
  num.style.transform = `translate(${dx}px,${dy}px)`;
  DK.joy.x = dx / RC; DK.joy.y = -dy / RC;
}
can.addEventListener('touchstart', e => {
  e.preventDefault(); const t = e.changedTouches[0]; idCan = t.identifier;
  const r = can.getBoundingClientRect(); tam = { x: r.left + r.width / 2, y: r.top + r.height / 2 }; datCan(t);
}, { passive: false });
can.addEventListener('touchmove', e => { e.preventDefault(); for (const t of e.changedTouches) if (t.identifier === idCan) datCan(t); }, { passive: false });
const thaCan = e => { for (const t of e.changedTouches) if (t.identifier === idCan) { idCan = null; DK.joy.x = DK.joy.y = 0; num.style.transform = ''; } };
can.addEventListener('touchend', thaCan); can.addEventListener('touchcancel', thaCan);

// ---------------------------------------------------------------- vuốt canvas xoay máy, chụm hai ngón gần/xa
const cv = document.getElementById('cv'), may = DK.may;
const ngon = new Map(); let kc0 = 0, xa0 = 0;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
cv.addEventListener('touchstart', e => {
  e.preventDefault();
  for (const t of e.changedTouches) ngon.set(t.identifier, { x: t.clientX, y: t.clientY });
  if (ngon.size === 2) { const [a, b] = [...ngon.values()]; kc0 = Math.hypot(a.x - b.x, a.y - b.y); xa0 = may.xaMuc; }
}, { passive: false });
cv.addEventListener('touchmove', e => {
  e.preventDefault();
  if (ngon.size === 1) {
    const t = e.changedTouches[0], c = ngon.get(t.identifier); if (!c) return;
    may.yaw -= (t.clientX - c.x) * .008; may.pitch = clamp(may.pitch + (t.clientY - c.y) * .006, -.5, 1.2);
    c.x = t.clientX; c.y = t.clientY;
  } else {
    for (const t of e.changedTouches) { const c = ngon.get(t.identifier); if (c) { c.x = t.clientX; c.y = t.clientY; } }
    const [a, b] = [...ngon.values()]; const kc = Math.hypot(a.x - b.x, a.y - b.y);
    if (kc0 > 0) may.xaMuc = clamp(xa0 * kc0 / kc, 1.8, 40);
  }
}, { passive: false });
const thaNgon = e => { for (const t of e.changedTouches) ngon.delete(t.identifier); if (ngon.size < 2) kc0 = 0; };
cv.addEventListener('touchend', thaNgon); cv.addEventListener('touchcancel', thaNgon);
// chạm thanh bảng chọn không cuộn cả trang
document.addEventListener('gesturestart', e => e.preventDefault());
})();
