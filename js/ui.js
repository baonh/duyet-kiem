"use strict";
// ============================================================================
// ui.js — 2026-11-14 — BẢNG DUYỆT: chọn công pháp kiếm / chiêu / tầng / nhánh, vũ khí kiếm (+cấp), pháp bảo kiếm; phím như game.
// Các file bộ chiêu đăng ký bằng DK.dangKyBo(ma, {...}) — xem HOP_DONG.md.
// ============================================================================
(function () {
const DK = window.DK, T = DK.T, V3 = DK.V3, nc = DK.nc;
const $ = s => document.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = s => String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
const TEN_TANG = DL.TEN_TANG;
const PHIM = ['Z', 'X', 'C', 'V', 'R'];

// ---------------------------------------------------------------- trạng thái chọn
const S = DK.chon = { bo: DL.CONG_PHAP[0].ma, tang: 1, nhanh: {}, vk: DL.VU_KHI[0].ma, cap: 0, pb: DL.PHAP_BAO[0].ma, lap: false, tab: 'cp' };
const boDL = ma => DL.CONG_PHAP.find(b => b.ma === ma);
const vkDL = ma => DL.VU_KHI.find(v => v.ma === ma);
const pbDL = ma => DL.PHAP_BAO.find(v => v.ma === ma);
const phamDL = ma => DL.PHAM.find(p => p.ma === ma) || DL.PHAM[0];

// ---------------------------------------------------------------- đăng ký bộ (file bo_*.js gọi)
DK.dangKyBo = function (ma, bo) { bo.ma = ma; DK.BO[ma] = bo; if (bo.tuThe) DK.ttBang(bo.tuThe); if (ui) veCP(); };
DK.PB = DK.PB || {};

// ---------------------------------------------------------------- ngữ cảnh chiêu
function taoCtx(chieuDL) {
  const bo = boDL(S.bo), dich = DK.mucTieu();
  const vk = nc.vk;
  const ctx = {
    nv: nc, dich, tang: Math.min(S.tang, 5), nhanh: chieuDL ? (S.nhanh[chieuDL.ma] || null) : null, ch: chieuDL, bo,
    vk, mau: new T.Color(vk ? vk.mau_hex : '#ffffff'), mauBo: new T.Color().setRGB(bo.mau[0], bo.mau[1], bo.mau[2]),
    vfx: DK.vfx, sau: DK.sau, lap: DK.lap,
    phat: (clip, op) => DK.phat(nc, clip, op),
    trung: (d, op = {}) => DK.trung(d, Object.assign({ nguon: nc }, op)),
    /** điểm ngắm: mục tiêu (nếu có trong tầm) hoặc trước mặt `xa` m */
    diemNgam: (xa) => { const t = dich; if (t && t.pos.distanceTo(nc.pos) <= (xa || 30)) return t.pos.clone(); return nc.quanh(0, 0, Math.min(xa || 8, 8)); },
    tangTen: TEN_TANG[Math.min(S.tang, 5) - 1],
  };
  if (dich && dich.pos.distanceTo(nc.pos) < 40) nc.ngam(dich.pos);
  return ctx;
}
DK.taoCtx = taoCtx;
let tChieuCuoi = -9;
DK.tungChieu = function (maChieu) {
  const bo = boDL(S.bo); const ch = bo.chieu.find(c => c.ma === maChieu); if (!ch) return;
  const B = DK.boDung(S.bo); const impl = (B && B.chieu && B.chieu[maChieu]) || (DK.BO[S.bo] && DK.BO[S.bo].chieu && DK.BO[S.bo].chieu[maChieu]);   // 2026-11-15 — ưu tiên bản nâng cấp khi bật
  if (nc.hd && nc.hd.t < (nc.hd.clip.huy || nc.hd.clip.dai) && !nc.hd.op.choHuy) return;
  tChieuCuoi = DK.now; S.chieuCuoi = maChieu;
  hienTen(ch);
  const ctx = taoCtx(ch);
  try { if (impl) impl(ctx); else chieuTam(ctx); } catch (e) { console.error(e); DK.baoLoi(e); }
};
// chiêu chưa dựng: một nhát chém chung + chữ báo
function chieuTam(ctx) {
  DK.vfx.chu('chưa dựng bản HTML: ' + ctx.ch.ten, { mau: '#ff8a8a', song: 1.2 });
  ctx.phat('DANH_1', { moc: { vet0: () => DK.vfx.vet(nc, { song: .12 }), trung: () => DK.trongNon(nc, 2.5, 120).forEach(d => ctx.trung(d, { st: ctx.ch.sat_thuong })) } });
}
// combo đòn thường
let iCombo = 0, tComboCuoi = -9;
function danhThuong() {
  if (nc.dangCuoi) return;
  const bo = DK.boDung(S.bo);
  if (nc.hd && nc.hd.t < (nc.hd.clip.huy || nc.hd.clip.dai) * .85) { nc.choDanh = true; return; }
  if (DK.now - tComboCuoi > 1.1) iCombo = 0;
  const so = bo && bo.soNhat || 7;
  const ctx = taoCtx(null); ctx.i = iCombo;
  try {
    if (bo && bo.danh) bo.danh(ctx, iCombo);
    else ctx.phat('DANH_' + (iCombo + 1), { moc: { vet0: () => DK.vfx.vet(nc, { song: .12 }), trung: () => DK.trongNon(nc, 2.6, 140).forEach(d => ctx.trung(d, { st: 40, day: .3 })) } });
  } catch (e) { console.error(e); DK.baoLoi(e); }
  iCombo = (iCombo + 1) % so; tComboCuoi = DK.now;
}
DK.nghe('buoc', () => { if (nc.choDanh && (!nc.hd || nc.hd.t >= (nc.hd.clip.huy || nc.hd.clip.dai) * .85)) { nc.choDanh = false; danhThuong(); } if (nc.hd) tComboCuoi = DK.now; });

DK.nghe('phim', k => {
  const bo = boDL(S.bo);
  const i = PHIM.indexOf(String(k).toUpperCase());
  if (i >= 0 && k.length === 1) { const ch = bo.chieu.find(c => (c.phim || '').toUpperCase() === PHIM[i]) || bo.chieu[i]; if (ch) DK.tungChieu(ch.ma); return; }
  if (k === 'j') danhThuong();
  else if (k === 'Shift' || k === 'l') { const b = DK.boDung(S.bo); if (b && b.lon && !nc.hd) { try { b.lon(taoCtx(null)); } catch (e) { DK.baoLoi(e); } } }
  else if (k === 'q') { const PBQ = (DK.NC && DK.PB_NC && DK.PB_NC.kiemTran) ? DK.PB_NC : DK.PB; if (PBQ.kiemTran) { hienTen({ ten: 'Phi kiếm trận', phim: 'Q' }); try { PBQ.kiemTran(taoCtx(null)); } catch (e) { DK.baoLoi(e); } return; } if (DK.PB.kiemTran) { hienTen({ ten: 'Phi kiếm trận', phim: 'Q' }); try { DK.PB.kiemTran(taoCtx(null)); } catch (e) { DK.baoLoi(e); } } else DK.vfx.chu('Phi kiếm trận: chưa dựng', { mau: '#ff8a8a' }); }
  else if (k === 'f') { const PBF = (DK.NC && DK.PB_NC && DK.PB_NC.nguKiem) ? DK.PB_NC : DK.PB; if (PBF.nguKiem) { try { PBF.nguKiem(taoCtx(null), pbDL(S.pb)); } catch (e) { DK.baoLoi(e); } return; } if (DK.PB.nguKiem) { try { DK.PB.nguKiem(taoCtx(null), pbDL(S.pb)); } catch (e) { DK.baoLoi(e); } } else DK.vfx.chu('Ngự kiếm: chưa dựng', { mau: '#ff8a8a' }); }
  else if (k === 'Escape') document.exitPointerLock && document.exitPointerLock();
  else if (k === 'p') { DK.dung = !DK.dung; }
  else if (k === 'Backspace') DK.datLai();
});
function hienTen(ch) { const e = $('#ten_chieu'); e.textContent = (ch.phim ? '[' + ch.phim + '] ' : '') + ch.ten; e.classList.remove('hien'); void e.offsetWidth; e.classList.add('hien'); }

// lặp lại chiêu cuối
DK.nghe('buoc', () => { if (S.lap && S.chieuCuoi && !nc.hd && DK.now - tChieuCuoi > 2.2) { DK.datLai(); DK.tungChieu(S.chieuCuoi); } });

// ---------------------------------------------------------------- vẽ bảng
let ui = null;
function veTab() {
  for (const b of document.querySelectorAll('#tab button')) b.classList.toggle('chon', b.dataset.tab === S.tab);
  for (const p of document.querySelectorAll('.trang')) p.hidden = p.id !== 'tr_' + S.tab;
}
function veCP() {
  const bo = boDL(S.bo), impl = DK.boDung(S.bo), goc = DK.BO[S.bo];
  const sel = $('#chon_bo'); sel.innerHTML = '';
  for (const b of DL.CONG_PHAP) { const o = el('option', null, esc(b.ten) + (DK.BO[b.ma] ? '' : '  (chưa dựng)')); o.value = b.ma; o.selected = b.ma === S.bo; sel.appendChild(o); }
  const mau = '#' + new T.Color().setRGB(bo.mau[0], bo.mau[1], bo.mau[2]).getHexString();
  $('#bo_tt').innerHTML = `<div class="the" style="border-color:${mau}"><b style="color:${mau}">${esc(bo.ten)}</b> · ${esc(bo.thuoc_tinh || '')} · ${esc(bo.pham || '')} · ${esc(bo.dao_lo || '')}
    <div class="nho">${esc(bo.mo_ta || '')}</div><div class="nguon">dữ liệu: ${esc(bo._nguon)} · mã ${esc(bo.ma)}${impl && impl.nguon ? ' · code game: ' + esc(impl.nguon) : ''}</div>
    ${impl && impl.nc ? `<div class="ytuong">✦ BẢN NÂNG CẤP (đề xuất): ${esc(impl.yTuong || '')}</div>` : ''}${goc && goc.ghiChu ? `<div class="ghi">Game hiện tại: ${esc(goc.ghiChu)}</div>` : ''}</div>`;
  const tg = $('#tang'); tg.innerHTML = '';
  TEN_TANG.forEach((t, i) => { const b = el('button', S.tang === i + 1 ? 'chon' : '', (i + 1) + ' ' + t); b.onclick = () => { S.tang = i + 1; veCP(); }; tg.appendChild(b); });
  const ds = $('#ds_chieu'); ds.innerHTML = '';
  for (const ch of bo.chieu) {
    const co = !!(impl && impl.chieu && impl.chieu[ch.ma]) || !!(goc && goc.chieu && goc.chieu[ch.ma]); const ncCo = !!(impl && impl.nc && impl.chieu && impl.chieu[ch.ma]);
    const tang = ch.tang && ch.tang[S.tang - 1], moTaTang = tang && tang.vfx_tang && tang.vfx_tang.mo_ta;
    const d = el('div', 'chieu' + (co ? '' : ' chua'));
    d.innerHTML = `<div class="dong"><span class="phim">${esc(ch.phim || '')}</span><b>${esc(ch.ten)}</b><span class="tt">${ncCo ? '✦ nâng cấp' : co ? '✔' : '✖ chưa dựng'}</span><button class="xem">▶ xem</button></div>
      <div class="nho">${esc(ch.mo_ta || '')}</div>
      ${ncCo && impl.moTaChieu && impl.moTaChieu[ch.ma] ? `<div class="ytuong">✦ ${esc(impl.moTaChieu[ch.ma])}</div>` : ''}
      ${moTaTang ? `<div class="tang_mt">Tầng ${S.tang} · ${esc(TEN_TANG[S.tang - 1])}: ${esc(moTaTang)}</div>` : ''}
      ${S.tang >= 4 && ch.mo_ta_vien_man ? `<div class="tang_mt">Viên Mãn: ${esc(ch.mo_ta_vien_man)}</div>` : ''}
      <div class="so">LL ${ch.linh_luc ?? '-'} · hồi ${ch.hoi ?? '-'}s · tầm ${ch.tam ?? '-'}m · ST ${ch.sat_thuong ?? '-'}${ch.so_nhat > 1 ? ' ×' + ch.so_nhat : ''} · hình ${esc(ch.hinh || '')}</div>
      <div class="chong">Né/chống: ${esc(ch.chong || '')}</div>`;
    if (ch.nhanh && ch.nhanh.length) {
      const s = el('select', 'nhanh'); s.appendChild(new Option('— nhánh: chưa chọn —', ''));
      for (const n of ch.nhanh) { const o = new Option(n.ten + (n.mo_ta ? ' — ' + n.mo_ta : ''), n.ma); o.selected = S.nhanh[ch.ma] === n.ma; s.appendChild(o); }
      s.onchange = () => { S.nhanh[ch.ma] = s.value || null; };
      d.appendChild(s);
    }
    d.querySelector('.xem').onclick = () => { DK.datLai(); DK.tungChieu(ch.ma); };
    ds.appendChild(d);
  }
  const cb = $('#combo_tt'); cb.innerHTML = impl && impl.danh ? `Đòn thường (chuột trái / J): ${impl.soNhat || 7} nhát của bộ ✔` : 'Đòn thường: combo web chung DANH_1…7 (bộ chưa có combo riêng)';
  if (impl && impl.lon) cb.innerHTML += ' · Lộn né (Shift) ✔';
}
function veVK() {
  const ds = $('#ds_vk'); ds.innerHTML = '';
  for (const v of DL.VU_KHI) {
    const p = phamDL(v.pham);
    const d = el('div', 'chieu' + (S.vk === v.ma ? ' dang' : ''));
    d.innerHTML = `<div class="dong"><span class="cham" style="background:${v.mau_hex}"></span><b>${esc(v.ten)}</b><span class="pham" style="color:${p.mau}">${esc(p.ten)}</span></div>
      <div class="nho">${esc(v.mo_ta)}</div><div class="so">ST ${v.chi_so.sat_thuong} · tốc ${v.chi_so.toc_do} · tầm ${v.chi_so.tam} · cương khí ${v.chi_so.cuong_khi} · ${v.chi_so.so_don_nhe} đòn nhẹ · màu vệt ${v.mau_hex}</div>`;
    d.onclick = () => { S.vk = v.ma; nc.camKiem(v); DK.suKien('doiVuKhi', { vk: v, cap: S.cap }); veVK(); };
    ds.appendChild(d);
  }
  $('#cap_so').textContent = '+' + S.cap;
  $('#cap_mt').textContent = DK.PB.moTaCap ? DK.PB.moTaCap(S.cap) : (S.cap >= 3 ? 'mốc +3/+5/+7/+10: hiệu ứng hào quang chưa dựng' : '');
}
function vePB() {
  const ds = $('#ds_pb'); ds.innerHTML = '';
  for (const p of DL.PHAP_BAO) {
    const d = el('div', 'chieu' + (S.pb === p.ma ? ' dang' : ''));
    d.innerHTML = `<div class="dong"><span class="cham" style="background:${p.mau_hex}"></span><b>${esc(p.ten)}</b><span class="tt">${esc(p.thuoc_tinh)}</span><button class="xem">▶ ngự (F)</button></div><div class="nho">${esc(p.mo_ta)}</div>`;
    d.querySelector('.xem').onclick = e => { e.stopPropagation(); S.pb = p.ma; vePB(); DK.datLai(); DK.suKien('phim', 'f'); };
    d.onclick = () => { S.pb = p.ma; vePB(); };
    ds.appendChild(d);
  }
  const k = DL.PB_DANH[0];
  if (k) $('#pb_danh').innerHTML = `<div class="chieu${DK.PB.kiemTran ? '' : ' chua'}"><div class="dong"><span class="phim">Q</span><b>${esc(k.ten)}</b><span class="tt">${DK.PB.kiemTran ? '✔' : '✖ chưa dựng'}</span><button class="xem">▶ xem</button></div>
    <div class="nho">${esc(k.mo_ta)}</div><div class="so">LL ${k.linh_luc} · hồi ${k.hoi}s · tầm ${k.tam.join('–')}m · ${k.tg}s</div><div class="chong">Né/chống: ${esc(k.chong)}</div></div>`;
  const b = $('#pb_danh .xem'); if (b) b.onclick = () => { DK.datLai(); DK.suKien('phim', 'q'); };
  $('#pb_ghi').innerHTML = (DK.NC && DK.PB_NC && DK.PB_NC.ghiChu ? '<div class="ytuong">✦ BẢN NÂNG CẤP: ' + esc(DK.PB_NC.ghiChu) + '</div>' : '') + (DK.PB.ghiChu ? 'Game hiện tại: ' + esc(DK.PB.ghiChu) : '');   // 2026-11-15
}
function veCu() {
  $('#ds_cu').innerHTML = DL.CONG_PHAP_CU.map(c => `<div class="chieu chua"><b>${esc(c.ten)}</b> <span class="nho">(${esc(c.ma)})</span><div class="nho">${c.chieu.map(esc).join(' · ')}</div></div>`).join('') +
    '<div class="nho">Các bộ trên nằm trong cong_phap_vu_khi.json nhưng đã bị tệp cong_phap/*.json thay (cùng mã) hoặc không có bản web — game không dùng. Liệt kê để biết, không dựng.</div>';
}
function dung() {
  ui = true;
  for (const b of document.querySelectorAll('#tab button')) b.onclick = () => { S.tab = b.dataset.tab; veTab(); };
  $('#chon_bo').onchange = e => { S.bo = e.target.value; const b = DK.boDung(S.bo); nc.theThu = b && b.theThu || 'THU'; nc.theDo = b && b.theDo || 'DO'; veCP(); };
  $('#cap').oninput = e => { S.cap = +e.target.value; DK.suKien('doiVuKhi', { vk: nc.vk, cap: S.cap }); veVK(); };
  $('#toc').onchange = e => { DK.tocDo = +e.target.value; };
  $('#may').onchange = e => { DK.may.che = e.target.value; };
  $('#bu').onchange = e => { const v = e.target.value; if (v === '3') { DK.datBuNhin(3); DK.cheDoBuNhin = 'dung'; } else { if (DK.dsBuNhin.length !== 1) DK.datBuNhin(1); DK.cheDoBuNhin = v; } };
  $('#lap').onchange = e => { S.lap = e.target.checked; };
  $('#nen').onchange = e => datNen(e.target.value); datNen($('#nen').value);
  $('#dat_lai').onclick = () => DK.datLai();
  $('#dien').onclick = dienCaBo;
  $('#thu_gon').onclick = () => document.body.classList.toggle('gon');
  veTab(); veCP(); veVK(); vePB(); veCu();
  nc.camKiem(vkDL(S.vk)); DK.suKien('doiVuKhi', { vk: nc.vk, cap: S.cap });
  const b = DK.boDung(S.bo); nc.theThu = b && b.theThu || 'THU'; nc.theDo = b && b.theDo || 'DO';
  $('#ban').value = DK.NC ? '1' : '0'; $('#ban').onchange = e => { DK.datNC(e.target.value === '1'); const b2 = DK.boDung(S.bo); nc.theThu = b2 && b2.theThu || 'THU'; nc.theDo = b2 && b2.theDo || 'DO'; };
}
// diễn lần lượt cả bộ (đòn thường 7 nhát rồi 5 chiêu)
function dienCaBo() {
  const bo = boDL(S.bo); DK.datLai(); let t = 0;
  const so = (DK.boDung(S.bo) && DK.boDung(S.bo).soNhat) || 7;
  for (let i = 0; i < so; i++) { DK.sau(t, danhThuong); t += .5; }
  t += 1.2;
  for (const ch of bo.chieu) { DK.sau(t, () => { DK.datLai(); DK.tungChieu(ch.ma); }); t += 3.2; }
}
// 2026-11-14 — nền sân: sân sáng làm hiệu ứng cộng sáng cháy trắng ⇒ mặc định tối
function datNen(n) {
  const B = { sang: [0x8fa6bf, 1.05, 1.6, .55], toi: [0x2a3140, .8, .9, .38], dem: [0x0c0f16, .62, .45, .25] }[n] || [0x8fa6bf, 1.05, 1.6, .55];
  DK.scene.background.setHex(B[0]); DK.scene.fog.color.setHex(B[0]); DK.renderer.toneMappingExposure = B[1]; DK.nang.intensity = B[2]; DK.hemi.intensity = B[3];
  if (DK.vfx && DK.vfx.datTroiGoc) DK.vfx.datTroiGoc();
}
DK.datNen = datNen;
DK.veLai = () => { if (ui) { veCP(); veVK(); vePB(); } };
window.addEventListener('load', () => {
  dung();
  // ---- chụp tự kiểm: ?anh=1&bo=..&chieu=<ma>|combo|q|f&tang=..&seek=..&may=sau|ngang&yaw=..
  const q = new URLSearchParams(location.search);
  if (q.get('bo')) { S.bo = q.get('bo'); const b = DK.boDung(S.bo); nc.theThu = b && b.theThu || 'THU'; nc.theDo = b && b.theDo || 'DO'; veCP(); }
  if (q.get('vk')) { S.vk = q.get('vk'); nc.camKiem(vkDL(S.vk)); }
  if (q.get('cap')) { S.cap = +q.get('cap'); DK.suKien('doiVuKhi', { vk: nc.vk, cap: S.cap }); }
  if (q.get('vk') || q.get('cap')) veVK();   // 2026-11-15 — cập nhật mô tả cấp khi đặt qua URL
  if (q.get('tang')) S.tang = +q.get('tang');
  if (q.get('nhanh') && q.get('chieu')) S.nhanh[q.get('chieu')] = q.get('nhanh');
  if (q.get('may')) DK.may.che = q.get('may');
  if (q.get('xa')) DK.may.xa = DK.may.xaMuc = +q.get('xa');
  if (q.get('pb')) S.pb = q.get('pb');
  if (q.get('nen')) { $('#nen').value = q.get('nen'); datNen(q.get('nen')); }
  if (q.get('anh') === '1') {
    DK.dung = true; DK.tua(.3);
    if (q.get('truoc')) { try { eval(q.get('truoc')); } catch (e) { DK.baoLoi(e); } }
    if (q.get('yaw')) DK.may.yaw = +q.get('yaw');
    const c = q.get('chieu');
    if (c === 'combo') { const n = +(q.get('n') || 1); for (let i = 0; i < n; i++) { if (i) DK.tua(+(q.get('cach') || .45)); danhThuong(); } }
    else if (c === 'q') DK.suKien('phim', 'q'); else if (c === 'f') DK.suKien('phim', 'f'); else if (c) DK.tungChieu(c);
    DK.tua(+(q.get('seek') || .5));
    const pre = document.createElement('pre'); pre.id = 'anh'; pre.textContent = DK.chupAnh(); document.body.appendChild(pre);
    const l = document.createElement('pre'); l.id = 'nhat_ky'; l.textContent = ($('#loi').hidden ? '' : $('#loi').textContent);
    if (q.get('dbg')) { try { l.textContent += ' DBG: ' + JSON.stringify(eval(q.get('dbg'))); } catch (e) { l.textContent += ' DBG lỗi: ' + e.message; } } document.body.appendChild(l);
  } else DK.batDau();
});
})();
