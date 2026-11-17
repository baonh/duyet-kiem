"use strict";
// ============================================================================
// bo_van_kiem.js — 2026-11-14 — VẠN KIẾM QUY TÔNG (mã 'kiem_cp2'), bản xem trước HTML của bộ kiếm Kim · Địa phẩm.
// Port từ game Unity (chỉ đọc): Assets/Game/CongPhap/Bo/VanKiem.cs (VanKiemQuyTong) + lớp gốc KiemTuThanhVan
//   trong CongPhap/Bo/ThanhLien.cs (PhiKiem, KiemRoi, VeKiem, VeVet, DiemVung, TuyetKy, RungLon) + ChieuVe.cs (QuangNo, SongXung, NoLon…).
// Mọi số (giây mô phỏng, m, số kiếm, bán kính, mốc) chép nguyên từ C#. Màu chủ đạo: VANG (1,.85,.45), lõi KIM (1,.95,.78).
// Kiếm khí vẽ tức thời như ChieuVe.VeHop (hộp cộng sáng) qua một InstancedMesh riêng của file này; phi kiếm Z dùng DK.vfx.kiem (hình thanh đang cầm).
// ============================================================================
(function () {
const DK = window.DK, T = DK.T, V3 = DK.V3, vfx = DK.vfx, D = DK.D;
const MA = 'kiem_cp2';
const VANG = new T.Color(1, .85, .45), KIM = new T.Color(1, .95, .78), TRANG = new T.Color(1, 1, 1);
const MAU_BUI = new T.Color(.5, .48, .47), MAU_GACH = new T.Color(.42, .4, .4);
const UP = new V3(0, 1, 0), DOWN = new V3(0, -1, 0), FWD = new V3(0, 0, 1);
const RR = (a, b) => a + Math.random() * (b - a);
const c01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
const E = (e, u) => DK.ease(e, c01(u));       // 'o' 'i' 'io' — giống ChieuDanh.Ease
const lerp = DK.lerp;

// mã nhánh (khớp van_kiem.json / VanKiem.cs)
const N_LIEN_CHAU = 'kiem_anh_lien_chau', N_TOA_VU = 'phan_quang_toa_vu', N_PHONG_THIEN = 'hong_vu_phong_thien', N_NHAT_TUYEN = 'lac_hong_nhat_tuyen',
      N_XUYEN_THACH = 'toai_kim_xuyen_thach', N_HO_KIEM = 'kim_cuong_ho_kiem', N_THIEN_LA = 'thien_la_kiem_vong', N_TU_KIEM = 'tru_tien_tu_kiem',
      N_NHAT_KICH = 'quy_tong_nhat_kich', N_TE_PHAT = 'van_kiem_te_phat';

// ---------------------------------------------------------------- clip (CLIP_VK của VanKiem.cs — tư thế KP_* / CHI_KIEM có sẵn trong DL.TT)
const CLIP_VK = [
  ['kp_vk_phan_quang', '0 KP_THU · .1 KP_CHI o · .45 KP_CHI h · .7 KP_THU io', .5],
  ['kp_vk_kiem_vu', '0 KP_THU · .14 KP_TRANG io · .6 KP_TRANG h · .7 KP_CHI o · 1.0 KP_THU io', .8],
  ['kp_vk_pha_giap', '0 KP_THU · .1 KP_TU_LUC o · .3 KP_TU_LUC h · .36 CHI_KIEM s · .7 CHI_KIEM h · .9 KP_THU io', .72],
  ['kp_vk_kiem_tran', '0 KP_THU · .14 KP_CHI o · .4 KP_CHI h · .5 KP_XG s · .8 KP_XG h · 1.0 KP_THU io', .8],
  ['kp_vk_quy_tong', '0 KP_THU · .12 KP_TRANG io · .95 KP_TRANG h · 1.05 KP_W4 o · 1.12 KP_W4 h · 1.2 KP_S2 s · 1.45 KP_S2 h · 1.6 KP_THU io', 1.35],
];
for (const [ten, khoa, huy] of CLIP_VK) DK.clip(ten, khoa, null, { huy });

// ================================================================ VẼ TỨC THỜI (ChieuVe.VeHop cộng sáng) — vẽ lại mỗi bước
const VE = (function () {
  const MAX = 9000;
  // shader riêng: màu × a cộng lên nền + nền tối đi 0,6a ⇒ vàng kim vẫn đọc được trên sân sáng (cộng thuần sẽ cháy trắng)
  const geo = new T.BoxGeometry(1, 1, 1);
  const mauA = new T.InstancedBufferAttribute(new Float32Array(MAX * 4), 4); mauA.setUsage(T.DynamicDrawUsage); geo.setAttribute('mauA', mauA);
  const mat = new T.ShaderMaterial({
    vertexShader: 'attribute vec4 mauA; varying vec4 vM; void main(){ vM = mauA; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying vec4 vM; void main(){ gl_FragColor = vec4(vM.rgb * vM.a, vM.a * .6); }',
    transparent: true, depthWrite: false, side: T.DoubleSide,
    blending: T.CustomBlending, blendEquation: T.AddEquation, blendSrc: T.OneFactor, blendDst: T.OneMinusSrcAlphaFactor,
  });
  const im = new T.InstancedMesh(geo, mat, MAX);
  im.instanceMatrix.setUsage(T.DynamicDrawUsage); im.frustumCulled = false; im.count = 0; im.renderOrder = 7;
  DK.scene.add(im);
  let n = 0; const m4 = new T.Matrix4(), s = new V3();
  return {
    batDau() { n = 0; },
    hop(p, q, sx, sy, sz, c, a) {
      if (n >= MAX || a <= .005) return;
      s.set(Math.max(1e-4, sx), Math.max(1e-4, sy), Math.max(1e-4, sz)); m4.compose(p, q, s); im.setMatrixAt(n, m4);
      mauA.setXYZW(n, c.r, c.g, c.b, Math.min(1, a)); n++;
    },
    xong() { im.count = n; im.instanceMatrix.needsUpdate = true; mauA.needsUpdate = true; },
  };
})();
// HuongQ (Quaternion.LookRotation(f, |f.y|>.97 ? forward : up)): +z = f
const _mB = new T.Matrix4(), _bx = new V3(), _by = new V3(), _bz = new V3(), _upT = new V3();
function huongQ(f, q) {
  q = q || new T.Quaternion();
  _bz.copy(f); if (_bz.lengthSq() < 1e-8) _bz.set(0, 0, 1); _bz.normalize();
  if (Math.abs(_bz.y) > .97) _upT.set(0, 0, 1); else _upT.set(0, 1, 0);
  _bx.crossVectors(_upT, _bz).normalize(); _by.crossVectors(_bz, _bx);
  _mB.makeBasis(_bx, _by, _bz); return q.setFromRotationMatrix(_mB);
}
const _qa = new T.Quaternion(), _qb = new T.Quaternion(), _qr = new T.Quaternion(), _pa = new V3(), _fw = new V3(), _cs = new T.Color();
const Q_Y45 = new T.Quaternion().setFromAxisAngle(UP, 45 * D);
/** VeKiem (ThanhLien.cs): thanh kiếm sáng — p tâm lưỡi, f hướng mũi, L dài lưỡi; gon = 2 khối */
function veKiem(p, f, L, mau, k, gon, xoay) {
  if (k <= .01 || L <= .01) return;
  const q = huongQ(f, _qa); if (xoay) q.multiply(_qr.setFromAxisAngle(FWD, xoay * D));
  const fw = _fw.set(0, 0, 1).applyQuaternion(q);
  const w = L * .085, d = L * .022;
  const sang = _cs.copy(mau).lerp(TRANG, .55);
  VE.hop(p, q, w * 2.4, d * 2.5, L * 1.12, mau, .22 * k);                 // quầng
  VE.hop(p, q, w, d, L, gon ? sang : mau, .85 * k);                        // lưỡi
  if (gon) return;
  VE.hop(p, q, w * .32, d * 1.3, L * .96, sang, .9 * k);                   // sống kiếm
  VE.hop(_pa.copy(p).addScaledVector(fw, L * .5), _qb.copy(q).multiply(Q_Y45), w * .72, d, w * .72, mau, .85 * k);   // mũi
  VE.hop(_pa.copy(p).addScaledVector(fw, -L * .5), q, w * 3.4, d * 2.6, w * .7, sang, .8 * k);                         // chắn tay
  VE.hop(_pa.copy(p).addScaledVector(fw, -L * .62), q, w * .55, w * .55, L * .22, mau, .7 * k);                       // chuôi
}
const _vab = new V3(), _vm = new V3(), _qv = new T.Quaternion(), _cv = new T.Color();
/** VeVet: vệt sáng thẳng a→b */
function veVet(a, b, day, mau, k) {
  _vab.subVectors(b, a); const L = _vab.length();
  if (L < .02 || k <= .01) return;
  const q = huongQ(_vab, _qv); _vm.addVectors(a, b).multiplyScalar(.5);
  VE.hop(_vm, q, day, day * .4, L, mau, .35 * k);
  VE.hop(_vm, q, day * .3, day * .2, L * .95, _cv.copy(mau).lerp(TRANG, .6), .5 * k);
}

// ================================================================ ĐẠN (ChieuChay.IDan) — bước mỗi khung, vẽ lại
const dsDan = [];
const themDan = d => { dsDan.push(d); return d; };
DK.moiKhung(dt => {
  VE.batDau();
  for (let i = 0; i < dsDan.length; i++) {
    let xong = true;
    try { xong = dsDan[i].buoc(dt); } catch (e) { console.error(e); DK.baoLoi(e); }
    if (xong) { if (dsDan[i].bo) try { dsDan[i].bo(); } catch (e) { } dsDan.splice(i, 1); i--; }
  }
  VE.xong();
});
DK.nghe('datLai', () => { dsDan.length = 0; VE.batDau(); VE.xong(); });

// ================================================================ ChieuVe → vfx (gần đúng)
const songQuay = p => new V3().subVectors(DK.cam.position, p);
function quangNo(p, r, mau, song) { vfx.chop(p.clone(), { co: r * 2.2, mau, song: song != null ? song : .35 }); }
function songXung(p, r, mau, song, phap, day) {
  vfx.vong(p.clone(), { bk0: r * .1, bk1: r * .8, mau, song: song != null ? song : .45, day: Math.max(.12, (day != null ? day : .12) * 2), phap: phap || songQuay(p), cao: phap && phap.y > .9 ? .02 : 0, op: .75 });
}
function tiaLua(p, n, mau, toc) { vfx.hat(p.clone(), { so: Math.min(120, n), mau, toc: toc != null ? toc : 9, co: .11, song: .32, trongLuc: 10, can: 2, sang: 1.3 }); }
function bui(p, n, r, toc) { vfx.hat(new V3(p.x, (p.y || 0) + .1, p.z), { so: Math.min(60, n), mau: MAU_BUI, toc: toc != null ? toc : 4, huong: new V3(0, .35, 0), loe: 2.5, co: .26, song: .9, trongLuc: -.2, can: 2.2, to: true, lech: (r != null ? r : 1.5) * .3 }); }
function gachVo(p, n, toc) { vfx.hat(new V3(p.x, (p.y || 0) + .1, p.z), { so: Math.min(60, n), mau: MAU_GACH, toc: toc != null ? toc : 7, huong: UP, loe: .9, co: .32, song: 1.4, trongLuc: 22, can: .3, to: true, lech: .5 }); }
function hatBay(p, v, mau, co, song) { vfx.hat(p, { so: 1, mau, toc: v.length(), huong: v.lengthSq() > 1e-6 ? v : UP, loe: 0, co, song, trongLuc: 0 }); }
function noLon(p, r, mau) {
  quangNo(p, r * .6, mau, .35); quangNo(p, r * .22, TRANG, .14);
  songXung(p, r * 1.3, mau, .45);
  tiaLua(p, Math.round(16 + r * 6), mau, 6 + r * 2);
  rung(.3 + r * .14);
}
const rung = k => DK.rung(Math.min(k, .22));                                      // ChieuDanh.Rung (trần web .22)
const rungLon = (k, tang) => DK.rung(tang >= 4 ? Math.min(k, .6) : Math.min(k, .22));  // RungLon: người chơi Viên Mãn+ vượt trần
const baoVong = (p, r, tg) => vfx.vung(new V3(p.x, 0, p.z), { r, song: tg + .08, mau: VANG });
const baoDai = (a, b, rong, tg) => vfx.dai(a, b, { rong, song: tg + .08, mau: VANG });
function tuyetKy(ten, mau, troi, giay) {
  vfx.chu(ten, { mau: '#' + mau.getHexString(), song: 1.6 });
  vfx.troi(mau, giay, troi);
}

// ================================================================ tiện ích thân / hướng
const nguc = o => new V3(o.pos.x, o.pos.y + 1.25, o.pos.z);
const chan = nv => new V3(nv.pos.x, nv.pos.y + .06, nv.pos.z);
const xoay = doY => new V3(Math.sin(doY * D), 0, Math.cos(doY * D));      // Xoay(Vector3.forward, doY)
const benPhai = f => new V3(-f.z, 0, f.x).normalize();                    // Cross(up, f) của Unity = bên phải
function huongNgang(nv, dich) {
  if (dich) { const d = new V3().subVectors(dich.pos, nv.pos); d.y = 0; if (d.lengthSq() > 1e-6) return d.normalize(); }
  return nv.toi();
}
function diemVung(ctx, tam, xa) {
  xa = xa != null ? xa : 8; const nv = ctx.nv, d = ctx.dich;
  if (d && d.pos.distanceTo(nv.pos) <= tam + 2) return new V3(d.pos.x, 0, d.pos.z);
  return nv.pos.clone().addScaledVector(nv.toi(), Math.min(xa, tam)).setY(0);
}
function kcDoan(p, a, b) {
  const ab = new V3().subVectors(b, a), L2 = ab.lengthSq();
  const u = L2 > 1e-8 ? c01(new V3().subVectors(p, a).dot(ab) / L2) : 0;
  return a.clone().addScaledVector(ab, u).distanceTo(p);
}
function quayToi(vel, muon, maxRad, toc) {     // Vector3.RotateTowards(vel, muon.normalized*toc, maxRad, 0).normalized*toc
  const a = vel.clone().normalize(), b = muon.clone().normalize(); const g = a.angleTo(b);
  if (g <= maxRad || g < 1e-5) return vel.copy(b).multiplyScalar(toc);
  let truc = new V3().crossVectors(a, b); if (truc.lengthSq() < 1e-8) truc.set(0, 1, 0); truc.normalize();
  return vel.copy(a.applyAxisAngle(truc, maxRad)).multiplyScalar(toc);
}
const HeK = t => t >= 5 ? 1.26 : t >= 4 ? 1.2 : t >= 3 ? 1.14 : 1;

// ================================================================ PHIÊN CHIÊU + TRÚNG
const TEN_TT = { giap_vo: 'Giáp vỡ', troi: 'Trói', cham: 'Chậm', choang: 'Choáng', dong_bang: 'Đóng băng', doc: 'Độc' };
function phien(ctx, clip) {
  const t = ctx.tang, ch = ctx.ch;
  const n = t >= 3 ? (ctx.nhanh || null) : null;                           // Nhanh(c): chỉ hiệu lực từ Đại Thành
  const nh = n && ch.nhanh ? ch.nhanh.find(x => x.ma === n) : null;
  const tg = ch.tang && ch.tang[t - 1];
  // người chơi: GanChieuNguoiChoi nhân hệ số tầng × nhánh (HS() = 1) ⇒ ở đây nhân thẳng
  let hs = (tg && tg.he_so) || 1; if (nh && nh.so_mod && nh.so_mod.he_so > 0) hs *= nh.so_mod.he_so;
  let tt = tg && tg.trang_thai && tg.trang_thai.ma ? tg.trang_thai.ma : '';
  if (nh && nh.so_mod && nh.so_mod.trang_thai) tt = nh.so_mod.trang_thai;
  const S = { ctx, nv: ctx.nv, t, n, hs, tt: TEN_TT[tt] || tt || '', daTT: new Set(), luc: (s, fn) => DK.sau(s, fn) };
  ctx.phat(clip);
  return S;
}
/** TrungMot: trả 'trung' | 'do' */
function trungMot(S, b, op) {
  const do_ = DK.cheDoBuNhin === 'do' && b.la === 'bu_nhin' && !op.khongTheChan;
  const tt = S.tt && !S.daTT.has(b) ? S.tt : undefined; if (tt) S.daTT.add(b);
  DK.trung(b, { st: op.manh * S.hs, nguon: S.nv, day: op.lui || 0, hat: op.len || 0, mau: VANG, trangThai: do_ ? undefined : tt, khongDo: !!op.khongTheChan });
  return do_ ? 'do' : 'trung';
}
const Op = (manh, pha, len, lui) => ({ manh, pha, len: len || 0, lui: lui || 0 });   // KichBanVuKhiWeb.Op(manh, pha, len, lui)
function vungCb(S, tam, r, op, cb, ds) {
  let n = 0;
  for (const b of DK.trongTron(tam, r)) { if (ds && ds.has(b)) continue; if (ds) ds.add(b); const kq = trungMot(S, b, op); n++; if (cb) cb(b, kq, nguc(b)); }
  return n;
}
function doanCb(S, a, b, rn, op, ds, cb) {
  let n = 0;
  for (const o of DK.trongDuong(a, b, rn * 2)) { if (ds && ds.has(o)) continue; if (ds) ds.add(o); const kq = trungMot(S, o, op); n++; if (cb) cb(o, kq, nguc(o)); }
  return n;
}
const tiaKhiTrung = (so, toc) => (o, kq, p) => { if (kq === 'trung') tiaLua(p, so, KIM, toc); };

// ================================================================ PhiKiem (ThanhLien.cs) — hình thanh đang cầm (vfx.kiem) + quầng VeKiem vàng kim
function phiKiem(S, o) {
  const d = Object.assign({ quay: 8, toc: 28, tam: 26, r: .5, L: 1.4, cho: 0, vet: 0, mau: VANG, duoi: false, xuyen: false }, o);
  const pos = d.pos.clone(), goc = pos.clone(), vel = (d.vel ? d.vel.clone() : FWD.clone().multiplyScalar(d.toc));
  let t = 0, conLai = d.tam, het = false, tHet = 0, daPhong = false;
  const thu = new Set();
  const kiem = vfx.kiem(S.nv.vk, { sang: .7, mau: d.mau, vet: false, quang: false, song: 30 });
  { const m = kiem.o.children[0]; if (m && m.material && m.material.emissive) m.material.emissive.copy(d.mau); }   // ánh vàng kim (màu bộ) thay ánh thanh kiếm
  const co0 = d.L / Math.max(.2, kiem.muiL);
  const f_ = new V3(), h_ = new V3();
  const nhamToi = () => d.dich ? nguc(d.dich).sub(pos) : d.diemDich ? d.diemDich.clone().sub(pos) : vel.clone();
  const ket = () => { if (het) return; het = true; tHet = DK.now; };
  function ve(k, phong) {
    const f = f_.copy(vel); if (f.lengthSq() < 1e-6) f.set(0, 0, 1); f.normalize();
    const L = d.L * phong;
    kiem.o.scale.setScalar(co0 * phong * Math.max(.05, Math.sqrt(k)));
    kiem.dat(h_.copy(pos).addScaledVector(f, -L * .5), f);
    // quầng vàng kim của VeKiem (lớp ngoài) — tô màu bộ lên thanh kiếm
    VE.hop(pos, huongQ(f, _qa), L * .085 * 2.4, L * .022 * 2.5, L * 1.12, d.mau, .3 * k);
    if (d.vet > 0 && t >= d.cho) veVet(pos.clone().addScaledVector(f, -(d.L * .5 + d.vet)), pos.clone().addScaledVector(f, -d.L * .4), d.L * .12, d.mau, k);
  }
  return themDan({
    bo() { kiem.huy(); },
    buoc(dt) {
      if (het) { const k = 1 - (DK.now - tHet) / .2; if (k <= 0) return true; ve(k, 1 + (1 - k) * .5); return false; }
      t += dt;
      if (t < d.cho) {
        if (d.diemCho) pos.lerpVectors(goc, d.diemCho, E('o', t / Math.max(.01, d.cho)));
        const f = nhamToi(); if (f.lengthSq() > 1e-6) quayToi(vel, f, 10 * dt, d.toc);
        ve(c01(t / .1), 1); return false;
      }
      if (!daPhong) {
        daPhong = true;
        if (d.cho > 0) { const f = nhamToi(); if (f.lengthSq() > 1e-6) vel.copy(f.normalize().multiplyScalar(d.toc)); }
        quangNo(pos, .4, d.mau, .12);
      }
      if (d.duoi && d.dich) { const muon = nguc(d.dich).sub(pos); if (muon.lengthSq() > 1e-4) quayToi(vel, muon, d.quay * dt, d.toc); }
      const truoc = pos.clone(); pos.addScaledVector(vel, dt); conLai -= d.toc * dt;
      for (const b of DK.dsBuNhin) {
        if (het || thu.has(b)) continue;
        const p1 = b.pos.clone().add(new V3(0, .3, 0)), p2 = b.pos.clone().add(new V3(0, 1.8 * .85, 0)), gi = p1.clone().add(p2).multiplyScalar(.5);
        const kc = Math.min(kcDoan(p1, truoc, pos), kcDoan(p2, truoc, pos), kcDoan(gi, truoc, pos));
        if (kc > d.r + .35) continue;
        thu.add(b);
        const kq = trungMot(S, b, d.op);
        if (kq === 'trung') { quangNo(nguc(b), Math.min(2.2, Math.max(.7, d.r * 1.6)), d.mau, .22); if (d.khiTrung) d.khiTrung(b, kq, nguc(b)); if (!d.xuyen) ket(); }
        else { tiaLua(pos, 18, d.mau, 7); ket(); }   // đỡ làm gãy kiếm
      }
      if (het) { ve(1, 1); return false; }
      if (pos.y < .05) { pos.y = .05; ket(); ve(1, 1); return false; }
      if (conLai <= 0) { ket(); ve(1, 1); return false; }
      ve(1, 1); return false;
    },
  });
}

// ================================================================ KiemRoi (ThanhLien.cs) — kiếm rơi từ trời xuống `den`
function kiemRoi(S, o) {
  const d = Object.assign({ cao: 12, toc: 34, cho: 0, L: 1.6, r: 1.3, giu: .5, nghieng: 8, coDanh: true, nho: true, mau: VANG, lech: 0, theo: null }, o);
  let t = 0, tCham = -1, daNham = false; const huong = DOWN.clone(); const den = d.den.clone();
  return themDan({
    buoc(dt) {
      t += dt;
      if (t < d.cho) return false;
      if (!daNham) {
        daNham = true;
        if (d.theo) den.set(d.theo.pos.x + RR(-d.lech, d.lech), 0, d.theo.pos.z + RR(-d.lech, d.lech));   // nhắm lại lúc bắt đầu rơi
        huong.set(RR(-1, 1) * Math.tan(d.nghieng * D), -1, RR(-1, 1) * Math.tan(d.nghieng * D)).normalize();
      }
      const tr = t - d.cho, dRoi = d.cao / Math.max(1, d.toc);
      if (tCham < 0) {
        const u = c01(tr / dRoi);
        const mui = den.clone().addScaledVector(huong, -d.cao * (1 - u));
        veKiem(mui.clone().addScaledVector(huong, -d.L * .5), huong, d.L, d.mau, c01(u * 4), d.nho);
        if (u > .25) veVet(mui.clone().addScaledVector(huong, -(d.L + 2.5)), mui.clone().addScaledVector(huong, -d.L), d.L * .1, d.mau, .6);
        if (u >= 1) {
          tCham = t;
          if (d.coDanh) vungCb(S, den.clone().add(new V3(0, .6, 0)), d.r, d.op, d.khiTrung);
          quangNo(den.clone().add(new V3(0, .2, 0)), d.r * .8, d.mau, .22);
          if (!d.nho || Math.random() < .35) bui(den, d.nho ? 3 : 10, d.r * .6, 3);
          if (d.khiCham) d.khiCham(den.clone());
        }
        return false;
      }
      const k = 1 - (t - tCham) / Math.max(.05, d.giu);
      if (k <= 0) return true;
      veKiem(den.clone().addScaledVector(huong, -d.L * .2), huong, d.L, d.mau, k, d.nho);   // cắm nghiêng, ngập 30 % lưỡi
      return false;
    },
  });
}

// ================================================================ Z · Kiếm Ảnh Phân Quang
const THAT_TINH = [[-1.3, .1], [-.75, .35], [-.2, .3], [.3, .45], [.75, .75], [1.35, .65], [1.25, 1.15]];   // gáo Bắc Đẩu
function PhanQuang(ctx) {
  const S = phien(ctx, 'kp_vk_phan_quang'), nv = ctx.nv, t = S.t, n = S.n;
  let so = t >= 5 ? 7 : t >= 4 ? 5 : t >= 3 ? 3 : 1;
  if (n === N_LIEN_CHAU) so += 2;
  const manh = 62 * HeK(t) / so;
  const f = huongNgang(nv, ctx.dich), ben = benPhai(f);
  let dsDich = [];
  if (n === N_TOA_VU) {
    dsDich = DK.trongTron(ctx.dich ? ctx.dich.pos : nv.pos.clone().addScaledVector(f, 8), 10);
    if (ctx.dich) { dsDich = dsDich.filter(b => b !== ctx.dich); dsDich.unshift(ctx.dich); }
  }
  nv.ngam(nv.pos.clone().addScaledVector(f, 4));
  S.luc(.06, () => quangNo(nguc(nv).addScaledVector(f, -.5).add(new V3(0, .5, 0)), .8, VANG, .3));
  S.luc(.12, () => {
    const goc = nguc(nv).addScaledVector(f, -.55).add(new V3(0, .45, 0));
    for (let k = 0; k < so; k++) {
      const u = so > 1 ? k / (so - 1) - .5 : 0;
      let p;
      if (t >= 5 && n == null) { const sao = THAT_TINH[k % THAT_TINH.length]; p = goc.clone().addScaledVector(ben, sao[0]).add(new V3(0, sao[1], 0)).addScaledVector(f, -.3); }
      else p = goc.clone().addScaledVector(ben, u * Math.min(so, 5) * .55).add(new V3(0, (so > 1 ? (1 - Math.abs(u) * 2) * .45 : .2) + (k >= 5 ? .6 : 0), 0));
      const dch = dsDich.length > 0 ? dsDich[k % dsDich.length] : ctx.dich;
      phiKiem(S, {
        dich: dch || null, duoi: !!dch, quay: 9, pos: goc, diemCho: p, toc: 30, tam: 34, r: .5,
        cho: .14 + (n === N_LIEN_CHAU ? k * .1 : k * .045),
        L: t >= 3 ? 1.5 : 1.3, mau: VANG, vet: t >= 2 ? 2.6 : 0, op: Op(manh, 10),
        diemDich: dch ? null : nv.pos.clone().addScaledVector(f, 24).add(new V3(0, 1.2, 0)),
        vel: f.clone().multiplyScalar(30),
        khiTrung: t >= 4 ? tiaKhiTrung(12, 6) : null,
      });
    }
    rung(.15);
  });
}

// ================================================================ X · Kiếm Vũ Lạc Hồng
function KiemVu(ctx) {
  const S = phien(ctx, 'kp_vk_kiem_vu'), nv = ctx.nv, t = S.t, n = S.n;
  const K = t >= 5 ? 1.3 : t >= 4 ? 1.2 : t >= 3 ? 1.1 : 1;
  const N = t >= 5 ? 40 : t >= 4 ? 30 : t >= 3 ? 20 : 10, Nv = N;
  const manh = 13 * K * 10 / N;
  const h = huongNgang(nv, ctx.dich), ben = benPhai(h);
  S.luc(.1, () => quangNo(nv.mui().add(new V3(0, .6, 0)), .8, VANG, .3));

  if (n === N_NHAT_TUYEN) {
    const a = chan(nv).addScaledVector(h, 1.5), b = a.clone().addScaledVector(h, 16);
    baoDai(a, b, 3, .35);
    nv.ngam(b);
    S.luc(.3, () => {
      for (let k = 0; k < Nv; k++) {
        const u = (k + .5) / Nv;
        const den = new V3().lerpVectors(a, b, u).addScaledVector(ben, RR(-1.1, 1.1)).setY(0);
        kiemRoi(S, { den, cao: 11, toc: 36, cho: .05 + u * .6, L: 1.6, r: 1.3, giu: .45, op: Op(manh, 3), mau: VANG });
      }
    });
    return;
  }
  const tam = diemVung(ctx, 16);
  const R = 4 * (t >= 3 ? 1.5 : 1) * (n === N_PHONG_THIEN ? 1.5 : 1);
  baoVong(tam, R, .35);
  nv.ngam(tam);
  const theo = ctx.dich && ctx.dich.pos.distanceTo(tam) < R + 2 ? ctx.dich : null;
  S.luc(.3, () => {
    const G = tam.clone().add(new V3(0, 12, 0));
    quangNo(G, 2.4, VANG, .6);
    if (t >= 4) songXung(G, R * 1.2, VANG, .7, UP, .1);
    for (let k = 0; k < Nv; k++) {
      const nham = theo != null && k % 5 < 3;
      let den;
      if (nham) den = theo.pos.clone().setY(0);
      else { const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * R; den = tam.clone().add(new V3(Math.cos(a) * r, 0, Math.sin(a) * r)); }
      kiemRoi(S, { den, theo: nham ? theo : null, lech: .9, cao: 12, toc: 34, cho: .05 + k / Nv * .7, L: 1.6, r: 1.3, giu: .45, op: Op(manh, 3), mau: VANG });
    }
    // Viên Mãn: một thanh lớn chốt giữa vùng
    if (t >= 4)
      kiemRoi(S, { den: tam, theo, lech: .3, cao: 16, toc: 40, cho: .85, L: 4.2, r: 2.6, giu: .9, nho: false, op: Op(30, 15, 2), mau: KIM,
        khiCham: p => { noLon(p.add(new V3(0, .5, 0)), 2.2, VANG); rungLon(.35, t); } });
  });
}

// ================================================================ C · Kim Qua Phá Giáp
function PhaGiap(ctx) {
  const S = phien(ctx, 'kp_vk_pha_giap'), nv = ctx.nv, t = S.t, n = S.n;
  if (n === N_HO_KIEM) {
    baoVong(chan(nv), 2.6, .2);
    S.luc(.2, () => { hoKiem(S, t, 2.6, 3.5, Op(16, 6)); songXung(nguc(nv), 2.6, VANG, .4, UP, .1); });
    return;
  }
  const xuyen = n === N_XUYEN_THACH;
  const L = t >= 3 ? 12 : 9, rn = t >= 3 ? 1.5 : 1.1, pha = xuyen ? 36 : 18;
  const so = t >= 5 ? 7 : t >= 3 ? 5 : 3;
  const h = huongNgang(nv, ctx.dich);
  const a = chan(nv).addScaledVector(h, .6);
  baoDai(a, a.clone().addScaledVector(h, L), rn * 2, .25);
  nv.ngam(a.clone().addScaledVector(h, L));
  const T0 = .18, TD = .44;
  const Mui0 = () => nguc(nv).addScaledVector(h, .6);
  const Dinh = tt => Mui0().addScaledVector(h, L * E('o', (tt - T0) / TD));
  S.luc(T0, () => muiKhoan(S, h, L, so, t, TD));
  const tia = tiaKhiTrung(8, 5);
  for (let k = 0; k < 3; k++) {
    const tk = .3 + k * .1;
    S.luc(tk, () => {
      const op = Op(22, pha); op.khongTheChan = xuyen;
      doanCb(S, Mui0(), Dinh(tk), rn, op, new Set(), tia);
      rung(.12);
    });
  }
  S.luc(.64, () => {
    const dinh = Dinh(.64);
    const op = Op(40, xuyen ? 60 : 30, 0, 3); op.khongTheChan = xuyen;
    doanCb(S, Mui0(), dinh, rn, op, new Set(), tia);
    if (t >= 4) { noLon(dinh, 2.2, VANG); vungCb(S, dinh, 2.2, Op(20, 10)); }
    else quangNo(dinh, 1.4, VANG, .3);
    rung(.3);
  });
}
/** MuiKhoan: `so` thanh xếp quanh trục, xoáy 900°/s, đẩy ra từ ngực */
function muiKhoan(S, h, L, so, tang, td) {
  let t = 0, xq = 0, tl = 0; const nv = S.nv; const ben = benPhai(h);
  const lech = new V3(), mui = new V3(), chuoi = new V3(), qv = new T.Quaternion(), qx = new T.Quaternion();
  return themDan({
    buoc(dt) {
      t += dt; xq += dt * 900;
      const u = E('o', t / td);
      const k = t < td + .1 ? c01(t / .06) : 1 - (t - td - .1) / .2;
      if (k <= 0) return true;
      const goc = nguc(nv).addScaledVector(h, .6);
      const dinh = goc.clone().addScaledVector(h, L * u);
      const Lk = 1.7 + (tang >= 3 ? .3 : 0);
      for (let i = 0; i < so; i++) {
        const a = xq + i * 360 / so;
        lech.copy(ben).applyAxisAngle(h, a * D).multiplyScalar(.32);
        mui.copy(dinh).addScaledVector(lech, .25);                // thanh nghiêng chụm về mũi
        chuoi.copy(dinh).addScaledVector(h, -Lk).add(lech);
        veKiem(mui.clone().add(chuoi).multiplyScalar(.5), mui.clone().sub(chuoi), Lk, VANG, k, false, a);
      }
      veVet(goc, dinh, .25 + (tang >= 3 ? .12 : 0), VANG, k);
      tl += dt; if (tang >= 2 && tl >= 1 / 60) { tl = 0; if (Math.random() < .6) tiaLua(dinh, 2, KIM, 5); }
      if (tang >= 4)                                              // Viên Mãn: vòng xoáy kim quang quanh mũi khoan
        for (let j = 0; j < 3; j++) {
          const p = new V3().lerpVectors(goc, dinh, .3 + j * .25);
          huongQ(h, qv).multiply(qx.setFromAxisAngle(FWD, (xq * .5 + j * 60) * D));
          VE.hop(p, qv, 1.4 - j * .3, .05, .05, KIM, .5 * k);
          VE.hop(p, qv.clone().multiply(qx.setFromAxisAngle(FWD, 90 * D)), 1.4 - j * .3, .05, .05, KIM, .5 * k);
        }
      return false;
    },
  });
}
/** HoKiem: kiếm xoay quanh thân `dai` giây, chém kẻ áp sát mỗi 0,4 s */
function hoKiem(S, tang, R, dai, op) {
  let t = 0, nhip = 0, xq = 0; const so = tang >= 4 ? 7 : 5, nv = S.nv;
  return themDan({
    buoc(dt) {
      t += dt; xq += dt * 320; nhip += dt;
      const k = Math.min(c01(t / .15), c01((dai - t) / .25));
      if (t >= dai) return true;
      const tam = nguc(nv);
      for (let i = 0; i < so; i++) {
        const a = xq + i * 360 / so; const r = xoay(a);
        const p = tam.clone().addScaledVector(r, 1.5).add(new V3(0, Math.sin(a * D * 2) * .25, 0));
        veKiem(p, xoay(a + 90).add(new V3(0, -.15, 0)), 1.3, VANG, k);
      }
      if (nhip >= .4) { nhip = 0; const trung = vungCb(S, tam, R, op, tiaKhiTrung(6, 4)); if (trung > 0) rung(.1); }
      return false;
    },
  });
}

// ================================================================ V · Kiếm Trận Phong Thiên
function KiemTran(ctx) {
  const S = phien(ctx, 'kp_vk_kiem_tran'), nv = ctx.nv, t = S.t, n = S.n;
  const tam = diemVung(ctx, 14);
  const R = 5 * (t >= 3 ? 1.3 : 1) * (n === N_THIEN_LA ? 1.3 : 1);
  baoVong(tam, R, .3);
  nv.ngam(tam);
  S.luc(.1, () => quangNo(nv.mui(), .7, VANG, .3));
  S.luc(.16, () => tranKiem(S, tam, R, t, n === N_TU_KIEM, n === N_THIEN_LA));
}
function tranKiem(S, tam, R, tang, tuKiem, thienLa) {
  const T_CAM = .14, T_RUT = 1.1, T_BAY = 1.3, T_NO = 1.48, T_HET = 1.85;
  const ds = [];
  if (tuKiem) for (let i = 0; i < 4; i++) ds.push(tam.clone().addScaledVector(xoay(45 + i * 90), R * .8));
  else {
    const vong = tang >= 5 ? 3 : tang >= 3 ? 2 : 1, rv = [1, .6, .3];
    for (let v = 0; v < vong; v++) for (let i = 0; i < 8; i++) ds.push(tam.clone().addScaledVector(xoay(i * 45 + v * 22.5), R * rv[v]));
  }
  const cam = ds.map(p => p.setY(0)), tre = cam.map((_, i) => i * .012);
  const Lk = tuKiem ? 4.5 : tang >= 3 ? 2 : 1.8;
  const gon = cam.length > 16;
  let t = 0, daCam = false, daNo = false;
  const dinhTam = tam.clone().add(new V3(0, 1, 0));
  const COT = new T.Quaternion();
  return themDan({
    buoc(dt) {
      t += dt;
      if (t >= T_HET) return true;
      // ---- cắm xuống: trói kẻ trong vòng
      if (!daCam && t >= T_CAM + tre[tre.length - 1]) {
        daCam = true;
        vungCb(S, tam.clone().add(new V3(0, .6, 0)), R, Op(45, 10));
        songXung(tam.clone().add(new V3(0, .15, 0)), R * 1.15, VANG, .5, UP, .14);
        for (let i = 0; i < cam.length; i += 2) { bui(cam[i], 4, .6, 2.5); if (tang >= 2) tiaLua(cam[i].clone().add(new V3(0, .3, 0)), 4, KIM, 4); }
        rung(.25);
      }
      for (let i = 0; i < cam.length; i++) {
        const ti = t - tre[i];
        let mui, f, k = 1;
        if (ti < T_CAM) {          // rơi từ 9 m
          const u = c01(ti / T_CAM);
          mui = cam[i].clone().add(new V3(0, 9 * (1 - u), 0)); f = DOWN.clone(); k = c01(u * 3);
        } else if (t < T_RUT) { mui = cam[i].clone().add(new V3(0, -Lk * .3, 0)); f = DOWN.clone(); }
        else if (t < T_BAY) {      // rút lên, xoay mũi về tâm
          const u = E('o', (t - T_RUT) / (T_BAY - T_RUT));
          const len = cam[i].clone().add(new V3(0, 2.5 * u, 0));
          const toiTam = dinhTam.clone().sub(len).normalize();
          f = slerpHuong(DOWN, toiTam, u);
          mui = len.clone().addScaledVector(f, Lk * .5).add(new V3(0, -Lk * .3 * (1 - u), 0));
        } else if (t < T_NO) {
          const u = E('i', (t - T_BAY) / (T_NO - T_BAY));
          const tu = cam[i].clone().add(new V3(0, 2.5, 0));
          f = dinhTam.clone().sub(tu).normalize();
          mui = new V3().lerpVectors(tu.clone().addScaledVector(f, Lk * .5), dinhTam, u);
        } else continue;
        veKiem(mui.clone().addScaledVector(f, -Lk * .5), f, Lk, VANG, k, gon);
        // Viên Mãn: cột kim quang trên mỗi kiếm khi trận đứng
        if (tang >= 4 && t >= T_CAM && t < T_RUT) {
          const nhay = .35 + .2 * Math.sin(t * 14 + i);
          VE.hop(cam[i].clone().add(new V3(0, 3.5, 0)), COT, .35, 7, .35, VANG, nhay * .6);
        }
      }
      // Thiên La: lưới kiếm khí nối các kiếm + nối về tâm
      if (thienLa && t >= T_CAM && t < T_RUT)
        for (let i = 0; i < cam.length; i++) {
          const a = cam[i].clone().add(new V3(0, .9, 0));
          veVet(a, cam[(i + 1) % cam.length].clone().add(new V3(0, .9, 0)), .1, KIM, .8);
          if (i % 2 === 0) veVet(a, tam.clone().add(new V3(0, .9, 0)), .08, KIM, .6);
        }
      // ---- hội tâm nổ
      if (!daNo && t >= T_NO) {
        daNo = true;
        const rN = tuKiem ? 3.6 : tang >= 3 ? 3.2 : 2.6;
        vungCb(S, dinhTam, rN, Op(60, 25, 1.5));
        noLon(dinhTam, tang >= 4 ? 3 : 2.2, VANG);
        if (tang >= 4) { vungCb(S, tam.clone().add(new V3(0, .6, 0)), R * .8, Op(15, 5)); songXung(tam.clone().add(new V3(0, .2, 0)), R * 1.5, KIM, .6, UP, .18); }
        rungLon(tang >= 4 ? .4 : .28, tang);
      }
      return false;
    },
  });
}
function slerpHuong(a, b, u) {   // Vector3.Slerp cho hai hướng đơn vị
  const g = a.angleTo(b); if (g < 1e-5) return b.clone();
  let truc = new V3().crossVectors(a, b); if (truc.lengthSq() < 1e-8) truc.set(1, 0, 0); truc.normalize();
  return a.clone().applyAxisAngle(truc, g * u);
}

// ================================================================ R · Vạn Kiếm Quy Tông (tuyệt kỹ)
function QuyTong(ctx) {
  const S = phien(ctx, 'kp_vk_quy_tong'), nv = ctx.nv, t = S.t, n = S.n;
  const nhatKich = n === N_NHAT_KICH, tePhat = n === N_TE_PHAT;
  const tam = diemVung(ctx, 18);
  const R = 6 * (t >= 5 ? 1.7 : t >= 4 ? 1.5 : t >= 3 ? 1.25 : 1) * (nhatKich ? .7 : tePhat ? 1.5 : 1);
  baoVong(tam, R, 1.3);
  nv.ngam(tam);
  S.luc(.08, () => { quangNo(nv.mui().add(new V3(0, .6, 0)), 1, VANG, .4); if (nv.datDat) bui(nv.pos, 8, 1.4, 3); });
  if (t >= 4) S.luc(.2, () => tuyetKy(t >= 5 ? 'Vạn Kiếm Triều Tông' : 'Vạn Kiếm Quy Tông · Nhất Kiếm Định Càn Khôn', VANG, t >= 5 ? .55 : .42, 3.6));
  S.luc(.1, () => quyTongDan(S, tam, R, t, nhatKich, tePhat));
}
function quyTongDan(S, tam, R, tang, nhatKich, tePhat) {
  const T_TU = .95, T_HOP = .2, T_ROI = .17;
  const G = tam.clone().add(new V3(0, 16, 0));
  const Lcu = (tang >= 4 ? 14 : tang >= 3 ? 10 : 7) * (nhatKich ? 1.3 : 1);
  const so = tang >= 5 ? 80 : tang >= 4 ? 60 : tang >= 3 ? 36 : tang >= 2 ? 18 : 12;
  const goc0 = S.nv.pos.clone();
  const anh = [];
  for (let k = 0; k < so; k++) {
    const r = xoay(RR(0, 360)).multiplyScalar(RR(1.5, tang >= 4 ? 9 : 5.5));
    anh.push({ tu: goc0.clone().add(r).add(new V3(0, RR(.4, 2), 0)), t0: k / so * .55, pha: RR(0, 360), rO: RR(1.5, 3.5) });
  }
  const chinh = tang >= 3 && !nhatKich && !tePhat ? .9 : 1;
  let giang;
  if (tang >= 5 && !tePhat)
    giang = [
      { lech: xoay(0).multiplyScalar(R * .45), tRoi: 1.15, co: .7, frac: .3 },
      { lech: xoay(180).multiplyScalar(R * .45), tRoi: 1.4, co: .7, frac: .3 },
      { lech: new V3(), tRoi: 1.65, co: 1.15, frac: chinh },
    ];
  else giang = [{ lech: new V3(), tRoi: 1.15, co: 1, frac: chinh }];
  for (const g of giang) { g.cham = false; g.tCham = 0; }
  const tHet = giang[giang.length - 1].tRoi + T_ROI + 1.4;
  const ds = new Set();
  const gon = anh.length > 20;
  let t = 0, tHat = 0;
  const QCU = huongQ(DOWN), QCOT = new T.Quaternion();

  function veCuKiem(giua, L, k) {
    veKiem(giua, DOWN, L, VANG, k);
    VE.hop(giua, QCU, L * .3, L * .08, L * 1.15, VANG, .12 * k);     // quầng ngoài lớn (cự kiếm đọc rõ từ xa)
  }
  function cham(dat, frac, co) {
    const op = Op(190 * frac, 55, 3, 4); op.khongTheChan = nhatKich;
    const r = R * Math.min(1, co);
    vungCb(S, dat.clone().add(new V3(0, .8, 0)), r, op, tiaKhiTrung(10, 6), ds);
    noLon(dat.clone().add(new V3(0, .6, 0)), tang >= 4 ? 4 : 3, VANG);
    songXung(dat.clone().add(new V3(0, .15, 0)), r * 1.3, VANG, .6, UP, .18);
    gachVo(dat, tang >= 4 ? 40 : 24, 9); bui(dat, tang >= 4 ? 40 : 24, r * .6, 6);
    rungLon(tang >= 4 ? .55 : .35, tang);
    ds.clear();   // cự kiếm sau (Hoá Cảnh) đánh lại được
    // Đại Thành trở lên: vòng kiếm dư rơi quanh chỗ giáng
    if (tang >= 3 && !nhatKich && !tePhat && co >= 1) {
      const N = tang >= 4 ? 24 : 8;
      for (let i = 0; i < N; i++) {
        const r2 = xoay(i * 360 / N + RR(-10, 10)).multiplyScalar(R * RR(.5, 1));
        kiemRoi(S, { den: dat.clone().add(r2).setY(0), cao: 10, toc: 36, cho: .05 + i / N * .55, L: 1.5, r: 1.4, giu: .5, op: Op(12, 4), mau: VANG });
      }
    }
  }
  function voThanhMua() {   // Vạn Kiếm Tề Phát: cự kiếm vỡ trên không thành mưa kiếm
    noLon(G, 3.5, VANG);
    const N = 30, manh = 190 / 12;
    const dsK = DK.trongTron(tam, R);
    for (let i = 0; i < N; i++) {
      const theo = dsK.length > 0 && i % 5 < 2 ? dsK[i % dsK.length] : null;
      let den;
      if (theo) den = theo.pos.clone().setY(0);
      else { const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * R; den = tam.clone().add(new V3(Math.cos(a) * r, 0, Math.sin(a) * r)); }
      kiemRoi(S, { den, theo, lech: 1, cao: 15, toc: 38, cho: i / N * .5, L: 1.8, r: 1.4, giu: .5, op: Op(manh, 6), mau: VANG });
    }
    rungLon(.3, tang);
  }

  return themDan({
    buoc(dt) {
      t += dt;
      if (t >= tHet) return true;
      // ---- kiếm ảnh bay lên rồi xoáy quanh điểm tụ, tan dần khi hợp lại
      const hop = c01((t - T_TU) / T_HOP);
      if (hop < 1) {
        for (const a of anh) {
          if (t < a.t0) continue;
          const u = c01((t - a.t0) / .45), e = E('o', u);
          const gq = a.pha + t * 220;
          const quay = G.clone().addScaledVector(xoay(gq), a.rO * (1 - hop)).add(new V3(0, Math.sin(gq * D) * .5, 0));
          const dk = a.tu.clone().add(new V3(0, 7, 0));
          // Bézier bậc hai tu → dk → quay
          const p = a.tu.clone().multiplyScalar((1 - e) * (1 - e)).addScaledVector(dk, 2 * (1 - e) * e).addScaledVector(quay, e * e);
          const f = u < 1 ? dk.clone().sub(a.tu).multiplyScalar(2 * (1 - e)).addScaledVector(quay.clone().sub(dk), 2 * e) : xoay(gq + 90).add(new V3(0, -.6, 0));
          veKiem(p, f, 1.3, VANG, c01(u * 4) * (1 - hop), gon);
        }
        tHat += dt; if (t > .3 && tHat >= 1 / 60) { tHat = 0; if (Math.random() < .5) { const r = new V3(RR(-1, 1), RR(-1, 1), RR(-1, 1)).multiplyScalar(3); hatBay(G.clone().add(r), G.clone().sub(tam).normalize().multiplyScalar(-.1), KIM, .2, .5); } }
      }
      if (t >= T_TU && t - dt < T_TU) { quangNo(G, 3, VANG, .5); songXung(G, 6, KIM, .5, UP, .15); }

      // ---- cự kiếm
      for (let i = 0; i < giang.length; i++) {
        const g = giang[i];
        const hien = i === 0 ? T_TU : g.tRoi - .3;
        if (t < hien) continue;
        const L = Lcu * g.co;
        const dat = tam.clone().add(g.lech).setY(0);
        const tren = G.clone().add(g.lech);
        const k = c01((t - hien) / T_HOP);
        if (tePhat && i === 0 && t >= g.tRoi) {
          if (!g.cham) { g.cham = true; g.tCham = t; voThanhMua(); }
          continue;
        }
        if (!g.cham) {
          let mui;
          if (t < g.tRoi) { mui = tren.clone().add(new V3(Math.sin(t * 60) * .04, -L * .5, Math.cos(t * 53) * .04)); }
          else {
            const u = E('i', (t - g.tRoi) / T_ROI);
            mui = new V3().lerpVectors(tren.clone().add(new V3(0, -L * .5, 0)), dat, u);
            veVet(mui.clone().add(new V3(0, L, 0)), mui.clone().add(new V3(0, L + 8 * u, 0)), L * .12, KIM, .8);
            if (u >= 1) { g.cham = true; g.tCham = t; cham(dat, g.frac, g.co); }
          }
          veCuKiem(mui.clone().add(new V3(0, L * .5, 0)), L * lerp(.3, 1, k), k);
        } else {
          // cắm ngập một phần tư lưỡi, mờ dần
          const kk = 1 - (t - g.tCham) / 1.3;
          if (kk <= 0) continue;
          veCuKiem(dat.clone().add(new V3(0, L * .25, 0)), L, kk);
          if (tang >= 4 && t - g.tCham < .6) {
            const a = 1 - (t - g.tCham) / .6, s = lerp(1, 1.6, 1 - a);
            VE.hop(dat.clone().add(new V3(0, 15, 0)), QCOT, 1.4 * s, 30 * s, 1.4 * s, KIM, .55 * a);
          }
        }
      }
      return false;
    },
  });
}

// ================================================================ ĐĂNG KÝ
DK.dangKyBo(MA, {
  nguon: 'CongPhap/Bo/VanKiem.cs (VanKiemQuyTong) + ThanhLien.cs (KiemTuThanhVan: PhiKiem, KiemRoi, VeKiem, VeVet, DiemVung, TuyetKy)',
  ghiChu: 'Code ↔ JSON: (1) JSON bật chu_chieu/mau_troi/rung_may ở Viên Mãn cho cả 5 chiêu nhưng code chỉ gọi TuyetKy (chữ + trời vàng) ở R; Z/X/C/V không có chữ chiêu. ' +
    '(2) R Hoá Cảnh: code 80 kiếm ảnh (JSON không nêu); nhánh Quy Tông Nhất Kích ở Hoá Cảnh VẪN ra ba cự kiếm (chỉ Tề Phát mới bỏ) — trái mô tả "dồn hết vào một". ' +
    '(3) Tề Phát: mô tả "vùng 9 m" nhưng R = 6×hệ tầng×1,5 ⇒ 11,25 m (Đại Thành) / 13,5 m (Viên Mãn) / 15,3 m (Hoá Cảnh). ' +
    '(4) Z Hoá Cảnh: xếp gáo Thất Tinh chỉ khi CHƯA chọn nhánh; có nhánh thì 7(+2) thanh xếp hàng ngang. ' +
    '(5) X Lạc Hồng Nhất Tuyến bỏ luôn thanh kiếm chốt Viên Mãn (return sớm). (6) V Hoá Cảnh "cột sáng chạm trời" — code cột 7 m như Viên Mãn. ' +
    '(7) C Kim Cương Hộ Kiếm: mô tả 5 thanh, code Viên Mãn+ là 7. ' +
    'Gần đúng: kiếm khí vẽ bằng hộp cộng sáng như ChieuVe.VeHop; phi kiếm Z dùng hình thanh đang cầm + quầng vàng; QuangNo/SongXung/NoLon/Bui/GachVo → vfx.chop/vong/hat.',
  chieu: {
    vk_phan_quang: PhanQuang,
    vk_kiem_vu: KiemVu,
    vk_pha_giap: PhaGiap,
    vk_kiem_tran: KiemTran,
    vk_quy_tong: QuyTong,
  },
});
})();
