"use strict";
// ============================================================================
// bo_thanh_lien.js — 2026-11-14 — THANH LIÊN KIẾM CA ('kiem_cp1') — bản xem trước chép từ Unity:
//   Assets/Game/CongPhap/Bo/ThanhLien.cs (ThanhLienKiemCa + lớp gốc KiemTuThanhVan: PhiKiem, ReCay, SenNo, GaiNo, VeSen, VeKiem)
//   + KichBanVuKhiWeb (ChieuDaoThuong.cs: BaoDai/BaoVong/BaoQuat/Op) + ChieuVe.cs (TrangTinh, QuangNo, SongXung, NoLon, VetThang…).
// Thời gian = giây MÔ PHỎNG như C# (c.Luc). Sát thương = số trong kịch bản × hệ số tầng × hệ số nhánh (như GanChieuNguoiChoi).
// Trạng thái trúng đòn = bảng tầng json (+ nhánh ghi đè) như CongPhapVuKhi.ThuanThucVaTrangThai.
// Nhánh chỉ có hiệu lực từ Đại Thành (tầng ≥ 3) — như KiemTuThanhVan.Nhanh().
// ============================================================================
(function () {
const DK = window.DK, T = DK.T, V3 = DK.V3, vfx = DK.vfx;
const D = Math.PI / 180, LEN = new V3(0, 1, 0);
const clamp = DK.clamp, cl01 = x => clamp(x, 0, 1);
const RR = (a, b) => a + Math.random() * (b - a);
// ChieuDanh.Ease
const E = { l: u => u, o: u => { const v = 1 - cl01(u); return 1 - v * v * v; }, i: u => { u = cl01(u); return u * u * u; },
  io: u => { u = cl01(u); return u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; } };

// ---------------------------------------------------------------- màu (ThanhLienKiemCa.XANH / NGOC / RE)
const XANH = new T.Color(.36, .95, .7), NGOC = new T.Color(.62, 1, .86), RE = new T.Color(.2, .42, .16);
const TRANG = new T.Color(1, 1, 1);
const lerpC = (a, b, k) => a.clone().lerp(b, k);

// mã nhánh (khớp thanh_lien.json)
const N_TAN_DIEP = 'lien_hoa_tan_diep', N_TRUY_HON = 'bich_lac_truy_hon', N_THANH_TAM = 'thanh_tam_lien', N_TOAN_VU = 'lien_phong_toan_vu',
  N_PHUOC_DIA = 'van_can_phuoc_dia', N_THON_LINH = 'thanh_dang_thon_linh', N_TAM_THIEM = 'lien_anh_tam_thiem', N_KHAI_LIEN = 'nhat_kiem_khai_lien',
  N_HO_THE = 'lien_dai_ho_the', N_SAT_TRAN = 'thien_diep_sat_tran';

// ---------------------------------------------------------------- clip (ThanhLienKiemCa.CLIP_TL — tư thế KP_* có sẵn), huy = ThongSoChieuWeb.huy
DK.clip('kp_tl_kiem_khi', '0 KP_THU · .1 KP_W1 o · .2 KP_W1 h · .26 KP_S1 s · .5 KP_S1 h · .8 KP_THU io', null, { huy: .6 });
DK.clip('kp_tl_tam_diep', '0 KP_THU · .08 KP_W1 o · .16 KP_S1 s · .3 KP_S1b io · .42 KP_S2 s · .56 KP_W4 io · .7 KP_S4 s · .86 KP_S4 h · 1.0 KP_THU io', null, { huy: .8 });
DK.clip('kp_tl_trien_can', '0 KP_THU · .14 KP_TU_LUC o · .3 KP_TU_LUC h · .38 KP_XG s · .7 KP_XG h · 1.0 KP_THU io', null, { huy: .8 });
DK.clip('kp_tl_pha_khong', '0 KP_HW o · .2 KP_HW h · .24 KP_THUAN l · .3 KP_XG o · .58 KP_XG h · .66 KP_S1 s · .9 KP_THU io', null, { huy: .72 });
DK.clip('kp_tl_kiem_tran', '0 KP_THU · .15 KP_CHI o · .55 KP_CHI h · .65 KP_TU_LUC io · .9 KP_TU_LUC h · 1.0 KP_XG s · 1.3 KP_XG h · 1.5 KP_THU io', null, { huy: 1.25 });

// ================================================================ TIỆN ÍCH CHUNG
const ngang = v => { const h = v.clone(); h.y = 0; return h.lengthSq() > 1e-8 ? h.normalize() : new V3(0, 0, 1); };
/** Xoay(h, độ) của Unity: +độ quay sang PHẢI nhân vật */
const xoay = (h, g) => { const c = Math.cos(g * D), s = Math.sin(g * D); return new V3(h.x * c - h.z * s, h.y, h.z * c + h.x * s); };
/** Xoay(Vector3.forward, yaw) — dùng chung cho cánh sen / tia toả (đối xứng nên không cần khớp chiều Unity) */
const huongYaw = g => new V3(Math.sin(g * D), 0, Math.cos(g * D));
const nguc = nv => nv.pos.clone().add(new V3(0, 1.25, 0));                 // ChieuDanh.Nguc (người tung + bù nhìn)
const datTai = p => { const q = p.clone(); q.y = 0; return q; };            // DatTai: sân phẳng y = 0
const huongNgang = (nv, d) => d ? ngang(new V3().subVectors(d.pos, nv.pos)) : nv.toi();
const huongNgam = (nv, d) => d ? ngang(new V3().subVectors(d.pos, nv.pos)) : nv.toi();   // ngực → ngực; đứng đất ⇒ ngang
const muiKiem = nv => nv.mui();
const rung = k => DK.rung(Math.min(k, .22));                               // ChieuDanh.Rung (trần web 0,22)
const conSong = d => d && DK.dsBuNhin.indexOf(d) >= 0;

// ---- hiệu ứng ChieuVe ↔ vfx
const quangNo = (p, r, mau, song = .35) => vfx.chop(p, { co: r * 1.6, mau, song });
function songXung(p, r, mau, song = .45, phap = null, day = .12) {
  const op = { bk0: r * .1, bk1: r * .8, song, mau, day, cao: 0, op: .6 };
  op.phap = phap || new V3().subVectors(DK.cam.position, p);
  return vfx.vong(p, op);
}
const tiaLua = (p, n, mau, toc = 9) => vfx.hat(p, { so: n, mau, toc, co: .11, song: .32, trongLuc: 10, can: 2 });
const hatBay = (p, v, mau, co, song) => vfx.hat(p, { so: 1, mau, toc: v.length() * 1.15, huong: v.lengthSq() > 1e-6 ? v : LEN, loe: 0, co, song, trongLuc: 0, can: 2 });
// 2026-11-14 — bụi đất: khối nhỏ màu đất (Unity: hạt bụi mờ α .55; cộng sáng trên sân HTML sáng ra trắng) ⇒ thu nhỏ cho khỏi che người
const bui = (p, n, r = 1.5, toc = 4) => vfx.hat(p.clone().add(new V3(0, .1, 0)), { so: n, mau: 0x8a7d6a, to: true, toc, huong: LEN, loe: 2.5, co: .14, song: .8, trongLuc: -.2, can: 2.2, lech: r * .3 });
const gachVo = (p, n, toc = 7) => vfx.hat(p.clone().add(new V3(0, .1, 0)), { so: n, mau: 0x9a948f, to: true, toc, huong: LEN, loe: .9, co: .3, song: 1.4, trongLuc: 22, can: .3, lech: .5 });
function noLon(p, r, mau) {
  quangNo(p, r * .6, mau, .35); quangNo(p, r * .22, TRANG, .14);
  songXung(p, r * 1.3, mau, .45);
  tiaLua(p, Math.round(16 + r * 6), mau, 6 + r * 2);
  rung(.3 + r * .14);
}
function vetThang(a, b, mau, day = .08, song = .4) {
  // ChieuVe.VetThang: vạch thẳng tắt sau `song` (lõi sáng + thân màu)
  const g = taoVet(mau); return vfx.them(g, song, (dt, u) => g.dat(a, b, day, 1 - u));
}
// báo trước (ChieuVe.DaiBao / VongBao / QuatBao): song = tTrung + .08
const baoDai = (a, b, rong, tg, mau) => vfx.dai(a, b, { rong, song: tg + .08, mau });
const baoVong = (p, r, tg, mau) => vfx.vung(datTai(p), { r, song: tg + .08, mau });
function baoQuat(p, h, r, gocDo, tg, mau) {
  const g = new T.Group(), a = gocDo * D, yaw = Math.atan2(h.x, h.z);
  // CircleGeometry nằm trong mặt XY, góc 0 = +x; xoay để tâm quạt trùng hướng h trên đất
  const mk = op => { const m = new T.Mesh(new T.CircleGeometry(r, 40, Math.PI / 2 - a / 2, a), op); m.rotation.x = -Math.PI / 2; return m; };
  const nen = mk(vfx.matThuong(mau, .18)); g.add(nen);
  const tien = mk(vfx.matCong(mau, .3)); tien.position.y = .005; g.add(tien);
  g.position.set(p.x, .03, p.z); g.rotation.y = yaw + Math.PI;     // +z cục bộ (sau xoay x) = −y của hình tròn ⇒ quay nửa vòng cho đúng hướng
  return vfx.them(g, tg + .08, (dt, u) => { tien.scale.setScalar(Math.max(.001, u)); });
}

// ---------------------------------------------------------------- hộp sáng dùng chung
const HOP = new T.BoxGeometry(1, 1, 1); HOP.giu = true;
const hopCong = (c, op) => new T.Mesh(HOP, vfx.matCong(c, op));
// 2026-11-14 — lớp màu chính trộn thường (không cộng sáng): sân HTML sáng ⇒ cộng sáng ra trắng, mất màu chủ đạo xanh ngọc
const hopMau = (c, op) => new T.Mesh(HOP, vfx.matThuong(c, op));
const _m4 = new T.Matrix4(), _x = new V3(), _y = new V3(), _z = new V3();
/** đặt hướng vật: trục z cục bộ = f, trục y cục bộ ≈ len (như Quaternion.LookRotation) */
function nhin(o, f, len) {
  _z.copy(f).normalize(); _y.copy(len || (Math.abs(_z.y) > .97 ? new V3(0, 0, 1) : LEN));
  _x.crossVectors(_y, _z); if (_x.lengthSq() < 1e-8) _x.set(1, 0, 0); _x.normalize(); _y.crossVectors(_z, _x);
  _m4.makeBasis(_x, _y, _z); o.quaternion.setFromRotationMatrix(_m4);
}
/** VeVet: thanh sáng thẳng a→b dày `day` (hai hộp) */
function taoVet(mau) {
  const g = new T.Group(); const m1 = hopMau(mau, .35), m2 = hopCong(lerpC(mau, TRANG, .6), .5); g.add(m1); g.add(m2);
  g.dat = (a, b, day, k) => {
    const ab = new V3().subVectors(b, a), L = ab.length(); g.visible = L > .02 && k > .01; if (!g.visible) return;
    g.position.copy(a).add(b).multiplyScalar(.5); nhin(g, ab);
    m1.scale.set(day, day * .4, L); m2.scale.set(day * .3, day * .2, L * .95);
    m1.material.opacity = .35 * k; m2.material.opacity = .5 * k;
  };
  return g;
}

// ---------------------------------------------------------------- trăng khuyết (ChieuVe.TaoTrang: cung ±80°, dày 0,34 ở giữa, viền trong mờ)
const TRANG_GEO = (() => {
  const N = 20, GOC = 80 * D, P = [], C = [], I = [];
  for (let k = 0; k <= N; k++) {
    const u = k / N, g = -GOC + 2 * GOC * u, dx = Math.sin(g), dz = Math.cos(g);
    const w = .34 * Math.pow(Math.max(0, Math.cos((u - .5) * Math.PI)), .8);
    P.push(dx, 0, dz, dx * (1 - w), 0, dz * (1 - w) - w * .25);
    C.push(1, 1, 1, 1, 1, 1, 1, .12);
    if (k < N) { const a = k * 2; I.push(a, a + 1, a + 3, a, a + 3, a + 2); }
  }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('color', new T.Float32BufferAttribute(C, 4)); g.setIndex(I);
  g.giu = true; return g;
})();
const matTrang = (c, op, thuong) => new T.MeshBasicMaterial({ color: vfx.mau(c), vertexColors: true, transparent: true, opacity: op, blending: thuong ? T.NormalBlending : T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
/** VeTrang: ba lớp (màu .8, sáng .5, quầng .22). g.dat(p, q-hướng (f, phap), r, k) */
function taoTrang(mau) {
  const g = new T.Group();
  const a = new T.Mesh(TRANG_GEO, matTrang(mau, .8, true)), b = new T.Mesh(TRANG_GEO, matTrang(lerpC(mau, TRANG, .55), .5)), c = new T.Mesh(TRANG_GEO, matTrang(mau, .22));
  b.scale.set(.92, 1, .92); c.scale.setScalar(1.15); g.add(a); g.add(b); g.add(c);
  g.dat = (p, f, phap, r, k) => { g.position.copy(p); nhin(g, f, phap); g.scale.setScalar(Math.max(.001, r)); a.material.opacity = .8 * k; b.material.opacity = .5 * k; c.material.opacity = .22 * k; };
  return g;
}
/** ChieuVe.HuongTrang: dung ⇒ mặt trăng dựng đứng (pháp tuyến ngang), không thì nằm ngang; nghieng (rad) quanh hướng bay */
function phapTrang(d, dung, nghieng) {
  const f = d.clone().normalize();
  let n = dung ? new V3().crossVectors(LEN, f) : LEN.clone(); if (n.lengthSq() < 1e-4) n.set(1, 0, 0); n.normalize();
  if (nghieng) n.applyAxisAngle(f, nghieng);
  return n;
}
/** ChieuVe.TrangTinh: trăng đọng lại, r .3r → r (ease o trong 1/3 đời), mờ 1 − u² */
function trangTinh(p, d, r, mau, song = .6, dung = true, nghieng = 0) {
  const g = taoTrang(mau), phap = phapTrang(d, dung, nghieng), f = d.clone().normalize();
  return vfx.them(g, song, (dt, u) => { g.dat(p, f, phap, r * .3 + (r - r * .3) * E.o(Math.min(1, u * 3)), 1 - u * u); });
}

// ---------------------------------------------------------------- KiemTuThanhVan.VeKiem — thanh kiếm sáng dựng từ hộp
function taoKiemSang(mau) {
  const g = new T.Group(), sang = lerpC(mau, TRANG, .55);
  const quang = hopCong(mau, .22), luoi = hopMau(mau, .85), song = hopCong(sang, .9), mui = hopCong(mau, .85), chan = hopCong(sang, .8), chuoi = hopCong(mau, .7);
  [quang, luoi, song, mui, chan, chuoi].forEach(m => g.add(m));
  mui.rotation.y = 45 * D;
  g.dat = (p, f, L, k) => {
    g.visible = k > .01 && L > .01; if (!g.visible) return;
    g.position.copy(p); nhin(g, f);
    const w = L * .085, d = L * .022;
    quang.scale.set(w * 2.4, d * 2.5, L * 1.12); luoi.scale.set(w, d, L); song.scale.set(w * .32, d * 1.3, L * .96);
    mui.position.set(0, 0, L * .5); mui.scale.set(w * .72, d, w * .72);
    chan.position.set(0, 0, -L * .5); chan.scale.set(w * 3.4, d * 2.6, w * .7);
    chuoi.position.set(0, 0, -L * .62); chuoi.scale.set(w * .55, w * .55, L * .22);
    quang.material.opacity = .22 * k; luoi.material.opacity = .85 * k; song.material.opacity = .9 * k; mui.material.opacity = .85 * k; chan.material.opacity = .8 * k; chuoi.material.opacity = .7 * k;
  };
  return g;
}

// ---------------------------------------------------------------- KiemTuThanhVan.VeSen — đoá sen lop × canh cánh (4 hộp / cánh) + nhuỵ
function taoSen(lop, canh, mau) {
  const g = new T.Group(), sang = lerpC(mau, TRANG, .6);
  const mA = vfx.matThuong(mau, .5), mV = vfx.matCong(sang, .55), mQ = vfx.matThuong(mau, .14), mN = vfx.matCong(lerpC(mau, TRANG, .7), .7);
  const canhs = [];
  for (let l = 0; l < lop; l++) for (let i = 0; i < canh; i++) {
    const ngoai = new T.Group(), trong = new T.Group(); ngoai.add(trong); g.add(ngoai);
    const a = new T.Mesh(HOP, mA), b = new T.Mesh(HOP, mA), v = new T.Mesh(HOP, mV), q = new T.Mesh(HOP, mQ);
    b.rotation.y = 45 * D; [a, b, v, q].forEach(m => trong.add(m));
    canhs.push({ l, i, ngoai, trong, a, b, v, q });
  }
  const nhuy = new T.Mesh(HOP, mN); g.add(nhuy);
  /** ve(tam, R, mo (độ: 0 khép dựng, 90 nằm), xoay (độ), k, boCanh(l,i)) */
  g.ve = (tam, R, mo, xo, k, boCanh) => {
    g.visible = k > .01; if (!g.visible) return;
    mA.opacity = .5 * k; mV.opacity = .55 * k; mQ.opacity = .14 * k; mN.opacity = .7 * k;
    for (const c of canhs) {
      const Lc = R * (1 - c.l * .2), W = Lc * .4, m = clamp(mo - c.l * 16, 0, 90), lech = c.l * (180 / canh);
      c.ngoai.visible = !(boCanh && boCanh(c.l, c.i)) && Lc > .01;
      c.ngoai.position.set(tam.x, tam.y + .05 + c.l * .07, tam.z);
      c.ngoai.rotation.y = (xo + lech + c.i * 360 / canh) * D;
      c.trong.rotation.x = -(90 - m) * D;
      c.a.position.set(0, 0, Lc * .36); c.a.scale.set(W, .035, Lc * .72);
      c.b.position.set(0, 0, Lc * .72); c.b.scale.set(W * .62, .035, W * .62);
      c.v.position.set(0, 0, Lc * .45); c.v.scale.set(W * .1, .05, Lc * .8);
      c.q.position.set(0, 0, Lc * .4); c.q.scale.set(W * 1.35, .02, Lc * .95);
    }
    nhuy.position.set(tam.x, tam.y + .1 + R * .05, tam.z); nhuy.rotation.y = xo * D; nhuy.scale.set(R * .2, R * .08, R * .2);
  };
  return g;
}
/** KiemTuThanhVan.MutCanh — đầu mút cánh (khớp đúng phép quay taoSen) */
function mutCanh(goc, yaw, mo, L) {
  const e = (90 - mo) * D; return goc.clone().addScaledVector(huongYaw(yaw), Math.cos(e) * L * .8).add(new V3(0, Math.sin(e) * L * .8, 0));
}

// ================================================================ ĐÁNH TRÚNG (bù nhìn)
const TEN_TT = { troi: 'Trói', cham: 'Chậm', dong_bang: 'Đóng băng', giap_vo: 'Giáp vỡ', doc: 'Độc', thieu: 'Thiêu', choang: 'Choáng' };
/** ngữ cảnh đánh của một lần ra chiêu: hệ số tầng × nhánh + trạng thái theo bảng tầng (nhánh ghi đè) */
function taoPhien(ctx) {
  const t = clamp(ctx.tang | 0, 1, 5), ch = ctx.ch;
  const n = t >= 3 ? (ctx.nhanh || null) : null;
  const tg = ch && ch.tang ? ch.tang[t - 1] : null, nh = n && ch && ch.nhanh ? ch.nhanh.find(x => x.ma === n) : null;
  let hs = tg && tg.he_so > 0 ? tg.he_so : [1, 1.25, 1.6, 2, 2.5][t - 1];
  if (nh && nh.so_mod && nh.so_mod.he_so > 0) hs *= nh.so_mod.he_so;
  let ma = tg && tg.trang_thai ? tg.trang_thai.ma : '';
  if (nh && nh.so_mod && nh.so_mod.trang_thai) ma = nh.so_mod.trang_thai;
  return { ctx, nv: ctx.nv, dich: ctx.dich, t, n, hs, tt: ma ? (TEN_TT[ma] || ma) : null, daTrung: [] };
}
/** một đòn (ChieuDanh.Trung): op { manh, pha, len, lui }; trả true = trúng, false = bị đỡ */
function trungMot(c, d, op, them) {
  const chan = DK.cheDoBuNhin === 'do';
  DK.trung(d, { st: op.manh * c.hs, nguon: c.nv, day: op.lui || 0, hat: op.len || 0, mau: XANH, trangThai: (them && them.tt) || c.tt || undefined });
  return !chan;
}
const diemThan = (o, p) => new V3(o.pos.x, clamp(p.y, o.pos.y + .2, o.pos.y + 1.7), o.pos.z);   // ChieuDanh.DiemThan (cao 1,8)
function kcDoan(p, a, b) { const ab = new V3().subVectors(b, a), L2 = ab.lengthSq(); if (L2 < 1e-8) return p.distanceTo(a); const t = cl01(new V3().subVectors(p, a).dot(ab) / L2); return p.distanceTo(a.clone().addScaledVector(ab, t)); }
const BK = .35;   // bán kính thân bù nhìn
/** VungCb: cầu tâm `tam` bán kính r */
function vungCb(c, tam, r, op, cb, ds) {
  let so = 0;
  for (const o of DK.dsBuNhin.slice()) {
    if (ds && ds.indexOf(o) >= 0) continue;
    const p = diemThan(o, tam); if (p.distanceTo(tam) > r + BK) continue;
    if (ds) ds.push(o);
    const kq = trungMot(c, o, op); so++; if (cb) cb(o, kq, p);
  }
  return so;
}
/** DoanCb: đoạn a→b nửa bề rộng rn */
function doanCb(c, a, b, rn, op, ds, mau, cb) {
  let so = 0;
  for (const o of DK.dsBuNhin.slice()) {
    if (ds && ds.indexOf(o) >= 0) continue;
    const p1 = o.pos.clone().add(new V3(0, .35, 0)), p2 = o.pos.clone().add(new V3(0, 1.44, 0)), gi = p1.clone().add(p2).multiplyScalar(.5);
    if (Math.min(kcDoan(p1, a, b), kcDoan(p2, a, b), kcDoan(gi, a, b)) > rn + BK) continue;
    if (ds) ds.push(o);
    const diem = nguc(o), kq = trungMot(c, o, op);
    if (kq) quangNo(diem, .9, mau, .2);
    so++; if (cb) cb(o, kq, diem);
  }
  return so;
}
/** QuatCb: quạt tâm `tam`, hướng h, bán kính r, góc toàn phần gocDo */
function quatCb(c, tam, h, r, gocDo, op, ds, mau, cb) {
  const cg = Math.cos(gocDo * .5 * D); let so = 0;
  for (const o of DK.dsBuNhin.slice()) {
    if (ds && ds.indexOf(o) >= 0) continue;
    const dx = o.pos.x - tam.x, dz = o.pos.z - tam.z, dh = Math.hypot(dx, dz);
    if (dh > r + BK) continue;
    if (dh > BK + .3 && (dx * h.x + dz * h.z) / dh < cg) continue;
    if (ds) ds.push(o);
    const diem = nguc(o), kq = trungMot(c, o, op);
    if (kq) quangNo(diem, .7, mau, .16);
    so++; if (cb) cb(o, kq, diem);
  }
  return so;
}
const keThuQuanh = (p, r) => DK.dsBuNhin.filter(o => Math.hypot(o.pos.x - p.x, o.pos.z - p.z) <= r + BK);

// ---- hồi máu (người chơi máu 1000 thang web) — HTML chỉ hiện số hồi
function hoiMau(nv, tiLe, mau) {
  if (tiLe <= 0) return;
  const p = nguc(nv); quangNo(p, .8, mau, .4);
  for (let k = 0; k < 6; k++) hatBay(p.clone().add(new V3(RR(-.6, .6), RR(-.6, .6), RR(-.6, .6))), new V3(0, RR(1.5, 3), 0), mau, .12, .7);
  DK.chuNoi('+' + Math.round(1000 * tiLe), nv.diem('dau').add(new V3(0, .4, 0)), '#9effc8');
}
function hutMau(c, manh, tiLe, mau) {
  if (tiLe <= 0) return;
  quangNo(nguc(c.nv), .5, mau, .25);
  DK.chuNoi('+' + Math.round(manh * c.hs * tiLe), c.nv.diem('dau').add(new V3(0, .4, 0)), '#9effc8');
}
/** DiemVung: mục tiêu trong tầm (+2 m) ⇒ chân nó; không thì `xa` m trước mặt */
function diemVung(c, tam, xa = 8) {
  const nv = c.nv, d = c.dich;
  if (conSong(d) && Math.hypot(d.pos.x - nv.pos.x, d.pos.z - nv.pos.z) <= tam + 2) return datTai(d.pos);
  return datTai(nv.pos.clone().addScaledVector(nv.toi(), Math.min(xa, tam)));
}
/** DiToi(c, đến, tg, ease): dời người tung (mặt phẳng) */
function diToi(nv, den, tg, e = 'l') {
  const tu = nv.pos.clone(), f = E[e] || E.l;
  DK.lap((dt, tl) => { const u = cl01(tl / Math.max(.01, tg)), k = f(u); nv.pos.x = tu.x + (den.x - tu.x) * k; nv.pos.z = tu.z + (den.z - tu.z) * k; return u < 1; });
}
/** Yaw(c, tới): quay mặt về điểm (giữ suốt chiêu) */
function yaw(c, toi) {
  const nv = c.nv; nv.ngam(toi); const y0 = nv.yaw;
  c.yaw = y0;
  DK.lap(() => { if (!nv.hd || nv.hd !== c.hd) return false; nv.yaw = c.yaw; return true; });
}
const datYaw = (c, toi) => { const d = new V3().subVectors(toi, c.nv.pos); if (d.x * d.x + d.z * d.z > 1e-6) { c.yaw = Math.atan2(d.x, d.z); c.nv.yaw = c.yaw; } };

// ================================================================ ĐẠN / HIỆU ỨNG THEO THỜI GIAN
/** KiemTuThanhVan.PhiKiem — phi kiếm / cánh sen bay: (tuỳ chọn) lơ lửng tới diemCho trong `cho` s rồi lao; duoi = đuổi đích */
function phiKiem(c, o) {
  const p = Object.assign({ toc: 28, tam: 26, r: .5, L: 1.4, cho: 0, vet: 0, quay: 8, coTrang: 1.4, nghieng: 0, mau: TRANG, duoi: false, xuyen: false, quaDat: false, laTrang: false }, o);
  let pos = p.pos.clone(), vel = p.vel ? p.vel.clone() : new V3(0, 0, p.toc);
  const goc = pos.clone(); let conLai = p.tam, t = 0, het = false, tHet = 0, daPhong = false;
  const thu = [];
  const g = new T.Group();
  const hinh = p.laTrang ? taoTrang(p.mau) : taoKiemSang(p.mau); g.add(hinh);
  const vet = taoVet(p.mau); g.add(vet); vet.visible = false;
  const nhamToi = () => {
    if (conSong(p.dich)) return new V3().subVectors(nguc(p.dich), pos);
    if (p.diemDich) return new V3().subVectors(p.diemDich, pos);
    return vel.clone();
  };
  const xoayToi = (muon, maxRad) => {   // Vector3.RotateTowards (chỉ hướng)
    const a = vel.clone().normalize(), b = muon.clone().normalize(), goc = a.angleTo(b);
    if (goc <= maxRad || goc < 1e-5) { vel.copy(b).multiplyScalar(p.toc); return; }
    const q = new T.Quaternion().setFromUnitVectors(a, b), q2 = new T.Quaternion().slerp(q, maxRad / goc);
    vel.copy(a.applyQuaternion(q2)).multiplyScalar(p.toc);
  };
  const ve = (k, phong) => {
    const f = vel.lengthSq() > 1e-6 ? vel.clone().normalize() : new V3(0, 0, 1);
    if (p.laTrang) {
      hinh.dat(pos, f, phapTrang(vel, true, p.nghieng), p.coTrang * phong, k);
      if (p.vet > 0) vet.dat(pos.clone().addScaledVector(f, -p.vet), pos, p.coTrang * .5, k * .7); else vet.visible = false;
    } else {
      hinh.dat(pos, f, p.L * phong, k);
      if (p.vet > 0 && t >= p.cho) vet.dat(pos.clone().addScaledVector(f, -(p.L * .5 + p.vet)), pos.clone().addScaledVector(f, -p.L * .4), p.L * .12, k); else vet.visible = false;
    }
  };
  const ket = q => { if (het) return; het = true; tHet = t; if (p.khiHet) try { p.khiHet(q.clone()); } catch (e) { console.error(e); DK.baoLoi(e); } };
  ve(0, 1);
  vfx.them(g, 60, dt => {
    if (het) { const k = 1 - (t - tHet) / .2; t += dt; if (k <= 0) return false; ve(k, 1 + (1 - k) * .5); return true; }
    t += dt;
    if (t < p.cho) {
      if (p.diemCho) pos.lerpVectors(goc, p.diemCho, E.o(t / Math.max(.01, p.cho)));
      const f = nhamToi(); if (f.lengthSq() > 1e-6) xoayToi(f, 10 * dt);
      ve(cl01(t / .1), 1); return true;
    }
    if (!daPhong) {
      daPhong = true;
      if (p.cho > 0) { const f = nhamToi(); if (f.lengthSq() > 1e-6) vel.copy(f.normalize().multiplyScalar(p.toc)); }
      quangNo(pos, .4, p.mau, .12);
    }
    if (p.duoi && conSong(p.dich)) { const muon = new V3().subVectors(nguc(p.dich), pos); if (muon.lengthSq() > 1e-4) xoayToi(muon, p.quay * dt); }
    const truoc = pos.clone(); pos.addScaledVector(vel, dt); conLai -= p.toc * dt;
    for (const o2 of DK.dsBuNhin.slice()) {
      if (het || thu.indexOf(o2) >= 0) continue;
      const p1 = o2.pos.clone().add(new V3(0, .3, 0)), p2 = o2.pos.clone().add(new V3(0, 1.53, 0)), gi = p1.clone().add(p2).multiplyScalar(.5);
      if (Math.min(kcDoan(p1, truoc, pos), kcDoan(p2, truoc, pos), kcDoan(gi, truoc, pos)) > p.r + BK) continue;
      thu.push(o2);
      const diem = nguc(o2);
      if (trungMot(c, o2, p.op)) {
        quangNo(diem, clamp(p.r * 1.6, .7, 2.2), p.mau, .22);
        if (p.khiTrung) try { p.khiTrung(o2, true, diem); } catch (e) { console.error(e); DK.baoLoi(e); }
        if (!p.xuyen) ket(pos);
      } else { tiaLua(pos, 18, p.mau, 7); p.khiHet = null; ket(pos); }   // đỡ làm gãy kiếm
    }
    if (het) { ve(1, 1); return true; }
    if (!p.quaDat && pos.y < .05) { pos.y = .05; ket(pos); ve(1, 1); return true; }
    if (conLai <= 0) { ket(pos); ve(1, 1); return true; }
    ve(1, 1); return true;
  });
}

/** KiemTuThanhVan.SenNo — đoá sen nở trên đất rồi nổ sau tNo (op null ⇒ chỉ hình) */
function senNo(c, o) {
  const p = Object.assign({ R: 1.8, tNo: .5, lop: 1, canh: 6, mau: XANH, hoi: 0 }, o);
  let tam = p.tam.clone(), t = 0, daNo = false; const xo = RR(0, 60);
  const sen = taoSen(p.lop, p.canh, p.mau);
  vfx.them(sen, 30, dt => {
    t += dt;
    if (!daNo && conSong(p.theo)) tam = datTai(p.theo.pos);
    if (!daNo) {
      const u = cl01(t / Math.max(.05, p.tNo));
      sen.ve(tam, p.R * (.4 + .6 * u), 10 + 60 * E.o(u), xo + t * 40, cl01(u * 3));
      if (u >= 1) {
        daNo = true;
        if (p.op && p.op.manh > 0) vungCb(c, tam.clone().add(new V3(0, .7, 0)), p.R, p.op, p.khiTrung);
        quangNo(tam.clone().add(new V3(0, .5, 0)), p.R * .7, p.mau, .3);
        songXung(tam.clone().add(new V3(0, .15, 0)), p.R * 1.4, p.mau, .4, LEN, .1);
        tiaLua(tam.clone().add(new V3(0, .5, 0)), 10, lerpC(p.mau, TRANG, .5), 4);
        if (p.hoi > 0) hoiMau(c.nv, p.hoi, p.mau);
      }
      return true;
    }
    const k = 1 - (t - p.tNo) / .3; if (k <= 0) return false;
    sen.ve(tam, p.R * (1 + (1 - k) * .4), 80, xo + t * 40, k * .7);
    return true;
  });
}

/** KiemTuThanhVan.ReCay — rễ chạy dọc đất a→b trong tLon, đánh mỗi kẻ một lần; giữ `giu` rồi chìm .4 s */
function reCay(c, o) {
  const p = Object.assign({ tLon: .45, giu: 1.2, rn: 1, day: .32, mau: XANH, mauRe: RE }, o);
  const n = clamp(Math.ceil(p.a.distanceTo(p.b) / .55), 4, 40);
  const diem = []; for (let i = 0; i <= n; i++) diem.push(datTai(new V3().lerpVectors(p.a, p.b, i / n)).add(new V3(0, .08, 0)));
  const ds = p.ds || [], pha = RR(0, 6.28);
  const g = new T.Group();
  const matRe = new T.MeshStandardMaterial({ color: p.mauRe, roughness: .9, transparent: true, opacity: .95 });
  const matSang = vfx.matCong(p.mau, .45), matLa = vfx.matCong(p.mau, .55);
  const dot = [];
  for (let i = 0; i < n; i++) {
    const re = new T.Mesh(HOP, matRe), s = new T.Mesh(HOP, matSang); re.castShadow = true; g.add(re); g.add(s);
    const la = i % 3 === 1 ? new T.Mesh(HOP, matLa) : null; if (la) g.add(la);
    dot.push({ re, s, la });
  }
  const dau = new T.Mesh(HOP, vfx.matCong(p.mau, .8)); g.add(dau);
  let t = 0, daLon = 0;
  vfx.them(g, 30, dt => {
    t += dt;
    const u = cl01(t / Math.max(.05, p.tLon)), den = u * n;
    if (den > daLon && p.op && p.op.manh > 0) {
      const i0 = Math.floor(daLon), i1 = Math.min(n, Math.ceil(den));
      if (i1 > i0) doanCb(c, diem[i0].clone().add(new V3(0, .5, 0)), diem[i1].clone().add(new V3(0, .5, 0)), p.rn, p.op, ds, p.mau, p.khiTrung);
      // Unity: 50 % mỗi khung (60 hình/s) — HTML tua 120 hình/s ⇒ tính theo đốt mới mọc cho khỏi dày gấp đôi
      for (let i = Math.floor(daLon) + 1; i <= i1; i++) if (Math.random() < .5) bui(diem[i], 2, .5, 2.5);
      daLon = den;
    }
    const tat = t > p.tLon + p.giu ? 1 - (t - p.tLon - p.giu) / .4 : 1;
    if (tat <= 0) return false;
    const chim = (1 - tat) * .5, m = Math.min(n, Math.ceil(den));
    matRe.opacity = .95 * tat; matSang.opacity = .45 * tat; matLa.opacity = .55 * tat;
    for (let i = 0; i < n; i++) {
      const D0 = dot[i]; const hien = i < m; D0.re.visible = D0.s.visible = hien; if (D0.la) D0.la.visible = hien; if (!hien) continue;
      const p0 = diem[i], p1 = diem[i + 1], dir = new V3().subVectors(p1, p0), ben = new V3().crossVectors(LEN, dir).normalize();
      const s = Math.sin(i * .9 + pha) * .18, k = 1 - i / n * .55;
      const gg = p0.clone().add(p1).multiplyScalar(.5).addScaledVector(ben, s).add(new V3(0, Math.abs(Math.sin(i * 1.7 + pha)) * .12 - chim, 0));
      const d = p.day * k, L = dir.length();
      D0.re.position.copy(gg); nhin(D0.re, dir.clone().add(new V3(0, Math.sin(i * 2.1 + pha) * .25, 0))); D0.re.scale.set(d, d * .8, L * 1.25);
      D0.s.position.copy(gg).add(new V3(0, d * .3, 0)); D0.s.quaternion.copy(D0.re.quaternion); D0.s.scale.set(d * .35, d * .3, L * 1.1);
      if (D0.la) { D0.la.position.copy(gg).add(new V3(0, d * .6, 0)).addScaledVector(ben, d); nhin(D0.la, ben.clone().add(new V3(0, .6, 0))); D0.la.scale.set(d * .9, .02, d * 1.6); }
    }
    dau.visible = u < 1; if (dau.visible) { dau.position.copy(diem[Math.min(m, n)]).add(new V3(0, .2, 0)); dau.scale.setScalar(p.day * 1.6); }
    return true;
  });
}

/** KiemTuThanhVan.GaiNo — gai ngọc trồi quanh điểm rồi nổ */
function gaiNo(c, o) {
  const p = Object.assign({ R: 1.6, tNo: .25, cao: 1.6, so: 7, mau: XANH, mauGoc: RE }, o);
  const xo = RR(0, 360), g = new T.Group();
  const matGoc = new T.MeshStandardMaterial({ color: p.mauGoc, roughness: .8, transparent: true, opacity: .9 }), matS = vfx.matCong(p.mau, .7);
  const gai = [];
  for (let i = 0; i < p.so; i++) {
    const a = xo + i * 360 / p.so, ra = huongYaw(a);
    const goc = p.tam.clone().addScaledVector(ra, p.R * (.3 + .25 * (i % 2))), f = new V3(0, 1.4, 0).addScaledVector(ra, .6).normalize();
    const m1 = new T.Mesh(HOP, matGoc), m2 = new T.Mesh(HOP, matS); m1.castShadow = true; nhin(m1, f); nhin(m2, f); m2.rotateZ(45 * D);
    g.add(m1); g.add(m2); gai.push({ goc, f, m1, m2, dai: i % 2 === 0 ? 1 : .7 });
  }
  let t = 0, daNo = false;
  vfx.them(g, 10, dt => {
    t += dt; const u = cl01(t / Math.max(.05, p.tNo));
    if (!daNo && u >= 1) {
      daNo = true;
      if (p.op && p.op.manh > 0) vungCb(c, p.tam.clone().add(new V3(0, .6, 0)), p.R, p.op, p.khiTrung);
      quangNo(p.tam.clone().add(new V3(0, .6, 0)), p.R * .6, p.mau, .25);
    }
    const k = t < p.tNo + .35 ? 1 : 1 - (t - p.tNo - .35) / .3; if (k <= 0) return false;
    const h = p.cao * E.o(u); matGoc.opacity = .9 * k; matS.opacity = .7 * k;
    for (const G of gai) {
      const Li = h * G.dai; G.m1.visible = G.m2.visible = Li >= .05; if (Li < .05) continue;
      G.m1.position.copy(G.goc).addScaledVector(G.f, Li * .5); G.m1.scale.set(.16, .16, Li);
      G.m2.position.copy(G.goc).addScaledVector(G.f, Li * .55); G.m2.scale.set(.07, .07, Li * 1.05);
    }
    return true;
  });
}

// ================================================================ Z · Thanh Liên Kiếm Khí
//   Sơ Khuy 1 cánh · Đại Thành 3 cánh 20° · Hoá Cảnh 5 cánh 28° · Tán Diệp 5 cánh 50° / Truy Hồn 1 cánh lớn đuổi + trói; Viên Mãn: cuối đường nở sen
function kiemKhi(ctx) {
  const c = taoPhien(ctx), nv = c.nv, t = c.t, n = c.n;
  const h = huongNgang(nv, c.dich);
  const tam = n === N_TAN_DIEP ? 17.6 : 22;
  const a = datTai(nv.pos).addScaledVector(h, .6);
  baoDai(a, a.clone().addScaledVector(h, tam), n === N_TAN_DIEP ? 7 : t >= 3 ? 4 : 2.4, .26, XANH);
  c.hd = ctx.phat('kp_tl_kiem_khi'); yaw(c, a.clone().addScaledVector(h, 5));
  DK.sau(.06, () => quangNo(muiKiem(nv), .6, XANH, .22));
  DK.sau(.26, () => {
    const hh = huongNgam(nv, c.dich), tu = nguc(nv).addScaledVector(hh, .9);
    let so, goc, frac, co = 1.5, duoi = false;
    if (n === N_TRUY_HON) { so = 1; goc = 0; frac = 1; duoi = true; co = 2.1; }
    else if (n === N_TAN_DIEP) { so = 5; goc = 50; frac = .3; co = 1.2; }
    else if (t >= 5) { so = 5; goc = 28; frac = .28; }
    else if (t >= 3) { so = 3; goc = 20; frac = .42; }
    else { so = 1; goc = 0; frac = 1; }
    if (t >= 2) co *= 1.1;
    if (t >= 4) co *= 1.15;
    for (let k = 0; k < so; k++) {
      const g = so > 1 ? -goc * .5 + goc * k / (so - 1) : 0;
      const dir = xoay(hh, g), coDuoi = duoi && !!c.dich;
      phiKiem(c, {
        dich: c.dich, duoi: coDuoi, quay: 5, pos: tu, vel: dir.clone().multiplyScalar(26), toc: duoi ? 22 : 26, tam,
        r: co * .55, laTrang: true, coTrang: co, nghieng: g * .01, mau: XANH, xuyen: !duoi, vet: t >= 2 ? 2.4 : 0,
        op: { manh: 60 * frac, pha: 10 },
        // Truy Hồn: Gan("troi", .8) — trùng trạng thái nhánh (so_mod troi .8) ⇒ đã có trong c.tt
        khiHet: t >= 4 ? (q => senNo(c, { tam: datTai(q), R: 1.6, tNo: .25, op: null, mau: NGOC })) : null,
      });
    }
    rung(.18);
  });
}

// ================================================================ X · Liên Hoa Tam Điệp
//   ba nhát quạt → đoá sen; nhát cuối hồi máu theo số kẻ trúng. Đại Thành: nhát cuối quét tròn, sen 2 lớp; Viên Mãn 3 lớp; Hoá Cảnh 4 lớp
function tamDiep(ctx) {
  const c = taoPhien(ctx), nv = c.nv, t = c.t, n = c.n;
  const h = huongNgang(nv, c.dich), R = 4.6;
  if (t >= 3) baoVong(nv.pos, R * 1.1, .7, XANH); else baoQuat(nv.pos, h, R, 110, .16, XANH);
  c.hd = ctx.phat('kp_tl_tam_diep'); yaw(c, nv.pos.clone().addScaledVector(h, 5));
  const lopSen = t >= 5 ? 4 : t >= 4 ? 3 : t >= 3 ? 2 : 1;
  const hoi = .015 * (n === N_THANH_TAM ? 2.5 : 1) * (t >= 4 ? 1.4 : 1);
  function chem(k) {
    const hh = huongNgang(nv, c.dich), tam = nguc(nv);
    const cuoi = k === 2, tron = cuoi && t >= 3, manh = cuoi ? 34 : 24;
    let dem = 0;
    const cb = (o, kq, p) => {
      if (!kq) return; dem++;
      if (n === N_THANH_TAM) hutMau(c, manh, .08, NGOC);
      if (t >= 2) tiaLua(p, 6, NGOC, 3);
    };
    if (tron) vungCb(c, tam, R * 1.1, { manh, pha: 9, len: 0, lui: 1.5 }, cb);
    else quatCb(c, nv.pos, hh, R, 110, { manh, pha: 8 }, null, XANH, cb);
    // vệt chém nằm ngang hình trăng — mỗi nhát nghiêng khác nhau
    const ngh = k === 0 ? .45 : k === 1 ? -.45 : 0;
    trangTinh(tam.clone().addScaledVector(hh, 1.3), hh, tron ? 3.2 : 2.4, t >= 2 ? NGOC : XANH, .32, false, ngh);
    if (t >= 2) for (let j = 0; j < 4; j++) hatBay(tam.clone().addScaledVector(hh, RR(1, 3)).add(new V3(RR(-.8, .8), RR(-.8, .8), RR(-.8, .8))), new V3(0, -.6, 0), NGOC, .14, .8);
    rung(cuoi ? .3 : .16);
    if (!cuoi) return;
    const tamSen = tron ? datTai(nv.pos) : datTai(nv.pos.clone().addScaledVector(hh, 2.3));
    senNo(c, { tam: tamSen, R: tron ? 3.6 : 2.4, tNo: .2, lop: lopSen, canh: 6, op: null, mau: NGOC });
    if (tron) songXung(tam.clone().add(new V3(0, -.4, 0)), R * 1.3, XANH, .4, LEN, .12);
    if (dem > 0) hoiMau(nv, hoi * Math.min(3, dem), NGOC);
  }
  DK.sau(.16, () => chem(0));
  DK.sau(.42, () => chem(1));
  DK.sau(.7, () => chem(2));
  if (n === N_TOAN_VU) DK.sau(.86, () => {
    const tam = nguc(nv);
    vungCb(c, tam, 4.5, { manh: 30, pha: 8, len: 0, lui: 2.5 });
    songXung(tam, 4.5, XANH, .35, null, .1);
    for (let j = 0; j < 10; j++) { const r = huongYaw(j * 36); hatBay(tam.clone().addScaledVector(r, 1.5), xoay(r, 90).multiplyScalar(5), NGOC, .16, .5); }
    rung(.25);
  });
}

// ================================================================ C · Bích Mộc Triền Căn
//   một rễ → ba rễ ±18° (Đại Thành) → gai ngọc chỗ quấn (Viên Mãn) → năm rễ ±18° ±36° (Hoá Cảnh). Nhánh Phược Địa: vòng rễ 5 m mọc vào tâm.
function trienCan(ctx) {
  const c = taoPhien(ctx), nv = c.nv, t = c.t, n = c.n;
  const h = huongNgang(nv, c.dich);
  const a = datTai(nv.pos).addScaledVector(h, .8);
  c.hd = ctx.phat('kp_tl_trien_can'); yaw(c, a.clone().addScaledVector(h, 4));
  DK.sau(.08, () => { if (nv.datDat) bui(nv.pos, 6, 1, 2); });
  DK.sau(.38, () => { quangNo(muiKiem(nv), .8, XANH, .25); rung(.25); if (nv.datDat) gachVo(datTai(nv.pos.clone().addScaledVector(h, 1)), 8, 4); });
  const cb = (o, kq, p) => {
    if (!kq) return;
    if (n === N_THON_LINH) hutMau(c, 70, .25, NGOC);
    if (t >= 4) gaiNo(c, { tam: datTai(o.pos), R: 1.6, tNo: .25, cao: t >= 5 ? 2.2 : 1.6, so: t >= 5 ? 9 : 7, op: { manh: 21, pha: 6, len: 1.5 }, mau: NGOC, mauGoc: RE });
  };
  if (n === N_PHUOC_DIA) {
    const tam = diemVung(c, 14), Rv = 5;
    baoVong(tam, Rv, .42, XANH);
    DK.sau(.42, () => {
      const ds = [], soRe = t >= 4 ? 12 : 10;
      for (let k = 0; k < soRe; k++) {
        const r = huongYaw(k * 360 / soRe + RR(-8, 8));
        reCay(c, { a: tam.clone().addScaledVector(r, Rv), b: tam.clone().addScaledVector(r, .4), tLon: .32, giu: 1.6, rn: 1.1, day: .26, op: { manh: 56, pha: 10 }, mau: XANH, mauRe: RE, khiTrung: cb, ds });
      }
      const sen = taoSen(1, 6, NGOC); vfx.them(sen, .05, () => sen.ve(tam, 1.2, 40, 0, .8));   // VeSen tức thời (một khung)
      songXung(tam.clone().add(new V3(0, .15, 0)), Rv * 1.2, XANH, .5, LEN, .14);
    });
    return;
  }
  const L = 13;
  baoDai(a, a.clone().addScaledVector(h, L), 2.2, .42, XANH);
  if (t >= 3) { baoDai(a, a.clone().addScaledVector(xoay(h, 18), L * .85), 1.6, .42, XANH); baoDai(a, a.clone().addScaledVector(xoay(h, -18), L * .85), 1.6, .42, XANH); }
  DK.sau(.42, () => {
    const giu = n === N_THON_LINH ? .9 : 1.3 + t * .15;
    reCay(c, { a, b: a.clone().addScaledVector(h, L), tLon: .45, giu, rn: 1, day: t >= 2 ? .38 : .32, op: { manh: 70, pha: 12 }, mau: XANH, mauRe: RE, khiTrung: cb });
    if (t < 3) return;
    const goc = t >= 5 ? [18, -18, 36, -36] : [18, -18];
    for (const g of goc) reCay(c, { a, b: a.clone().addScaledVector(xoay(h, g), L * .85), tLon: .42, giu, rn: .9, day: .28, op: { manh: 70 * .4, pha: 6 }, mau: XANH, mauRe: RE, khiTrung: cb });
  });
}

// ================================================================ V · Thanh Liên Phá Không
//   lướt xuyên 11 m, sen nở trên kẻ bị xuyên; Đại Thành: 3 đoá sen dọc đường (Hoá Cảnh 5); nhánh Tam Thiểm (3 chớp chữ Z) / Khai Liên (16 m + sen lớn)
function phaKhong(ctx) {
  const c = taoPhien(ctx), nv = c.nv, t = c.t, n = c.n;
  const h = huongNgang(nv, c.dich), chan = datTai(nv.pos);
  const rSen = t >= 4 ? 2.3 : 1.8;
  const cbSen = (o, kq) => { if (!kq) return; senNo(c, { theo: o, tam: datTai(o.pos), R: rSen, tNo: .5, op: { manh: 30, pha: 6 }, mau: NGOC }); };
  c.hd = ctx.phat('kp_tl_pha_khong');
  if (n === N_TAM_THIEM) {
    const d = [xoay(h, 32), xoay(h, -32), h];
    const diemDau = chan.clone().addScaledVector(d[0], 5), diemHai = diemDau.clone().addScaledVector(d[1], 5);
    baoDai(chan, diemDau, 2.2, .18, XANH); baoDai(diemDau, diemHai, 2.2, .36, XANH); baoDai(diemHai, diemHai.clone().addScaledVector(d[2], 5), 2.2, .58, XANH);
    yaw(c, nv.pos.clone().addScaledVector(d[0], 5));
    for (let k = 0; k < 3; k++) {
      let p0 = null;
      DK.sau(.2 + k * .22, () => {
        p0 = nguc(nv);
        const hd = conSong(c.dich) && k === 2 ? huongNgang(nv, c.dich) : d[k];
        datYaw(c, nv.pos.clone().addScaledVector(hd, 5));
        diToi(nv, nv.pos.clone().addScaledVector(hd, 5), .15, 'o');
      });
      DK.sau(.2 + k * .22 + .16, () => {
        const p1 = nguc(nv);
        doanCb(c, p0, p1, 1.2, { manh: 85 * .45, pha: 12 }, [], XANH, cbSen);
        vetThang(p0, p1, NGOC, .22, .45);
        quangNo(p1, .7, XANH, .2); rung(.14);
      });
    }
    return;
  }
  const khaiLien = n === N_KHAI_LIEN, L = khaiLien ? 16 : 11;
  baoDai(chan, chan.clone().addScaledVector(h, L), khaiLien ? 3 : 2.4, .2, XANH);
  yaw(c, chan.clone().addScaledVector(h, L));
  let dau = null;
  DK.sau(.06, () => { quangNo(muiKiem(nv), .5, XANH, .2); if (nv.datDat) bui(nv.pos, 5, 1, 2.5); });
  DK.sau(.22, () => { dau = nguc(nv); diToi(nv, nv.pos.clone().addScaledVector(h, L), khaiLien ? .3 : .24, 'o'); });
  DK.sau(khaiLien ? .54 : .47, () => {
    const cuoi = nguc(nv);
    doanCb(c, dau, cuoi, 1.3, { manh: 85, pha: 20, len: 0, lui: 2 }, c.daTrung, XANH, cbSen);
    vetThang(dau, cuoi, NGOC, t >= 2 ? .32 : .22, .55);
    quangNo(cuoi, 1, XANH, .25); rung(.24);
    if (t >= 3) {   // Liên Hoa Lộ
      const so = t >= 5 ? 5 : 3;
      for (let k = 0; k < so; k++) senNo(c, { tam: datTai(new V3().lerpVectors(dau, cuoi, (k + .5) / so)), R: t >= 4 ? 2.8 : 2.2, tNo: .3 + k * .1, lop: t >= 4 ? 2 : 1, op: { manh: 26, pha: 6 }, mau: NGOC });
    }
    if (khaiLien) senNo(c, { tam: datTai(nv.pos), R: 3.2, tNo: .35, lop: 2, op: { manh: 50, pha: 15, len: 3, lui: 2 }, mau: NGOC });
  });
}

// ================================================================ R · Thanh Liên Kiếm Trận (tuyệt kỹ)
//   sen 6 cánh/6 kiếm → Đại Thành 2 lớp 12 kiếm vòng ×1,5 → Viên Mãn 3 lớp, cánh bay lên trời rồi giáng (chữ chiêu + trời xanh ngọc + rung) → Hoá Cảnh 4 lớp hai đợt
function kiemTran(ctx) {
  const c = taoPhien(ctx), nv = c.nv, t = c.t, n = c.n;
  const hoThe = n === N_HO_THE, satTran = n === N_SAT_TRAN;
  const tam = hoThe ? datTai(nv.pos) : diemVung(c, 16);
  const lop = t >= 5 ? 4 : t >= 4 ? 3 : t >= 3 ? 2 : 1;
  const R = 5 * (t >= 5 ? 1.9 : t >= 4 ? 1.7 : t >= 3 ? 1.5 : t >= 2 ? 1.1 : 1) * (hoThe ? .8 : 1);
  baoVong(tam, R, .5, XANH);
  c.hd = ctx.phat('kp_tl_kiem_tran'); yaw(c, hoThe ? nv.pos.clone().addScaledVector(nv.toi(), 5) : tam);
  DK.sau(.1, () => quangNo(muiKiem(nv), .7, XANH, .3));
  if (t >= 4) DK.sau(.3, () => {   // TuyetKy: chữ chiêu + trời nhẹ
    vfx.chu(t >= 5 ? 'Nhất Hoa Nhất Thế Giới' : 'Thanh Liên Kiếm Trận · Thiên Diệp Quy Nguyên', { mau: '#' + XANH.getHexString(), song: 1.6 });
    vfx.troi(XANH, 3.2, t >= 5 ? .5 : .38);
  });
  DK.sau(.12, () => tranSen(c, tam, R, lop, t, satTran, hoThe));
}
/** TranSen: nở → rễ trói (.38) → cánh hoá kiếm (.78; Hoá Cảnh thêm đợt .5 ở 1,23) → sen khép (1,3 / VM 1,75) → nổ ngọc quang */
function tranSen(c, tam, R, lop, tang, satTran, hoThe) {
  const canh = 6, daBay = []; for (let l = 0; l < lop; l++) daBay.push(new Array(canh).fill(false));
  const vm = tang >= 4, tBay = .78, tKhep = vm ? 1.75 : 1.3, tNo = tKhep + .2, tHet = tNo + .5;
  let xo = RR(0, 60), t = 0, tHoi = 0, daTroi = false, daBay1 = false, daBay2 = false, daNo = false;
  const boCanh = (l, i) => daBay[l][i] && !daNo;
  const sen = taoSen(lop, canh, NGOC);
  songXung(tam.clone().add(new V3(0, .1, 0)), R * 1.2, XANH, .6, LEN, .14);
  const nv = c.nv;
  function phong1(mut, yawDo, stt, manh, dich) {
    const ra = huongYaw(yawDo), d = dich.length ? dich[stt % dich.length] : null;
    const pk = { dich: d, duoi: !!d, quay: 9, pos: mut.clone().add(new V3(0, .3, 0)), toc: 30, tam: R * 3 + 14, r: .6, L: 1.5 + (tang >= 3 ? .2 : 0), mau: XANH, vet: tang >= 2 ? 1.6 : 0, op: { manh, pha: 6 }, cho: .1 + stt * .025, quaDat: false };
    if (vm) { pk.diemCho = tam.clone().addScaledVector(ra, R * .5).add(new V3(0, 8 + (stt % 3) * 1.2, 0)); pk.cho = .42 + stt * .018; pk.toc = 34; pk.L = 1.8; }
    else pk.diemCho = mut.clone().add(new V3(0, 1.6, 0)).addScaledVector(ra, .4);
    if (!d) { pk.diemDich = tam.clone().addScaledVector(ra, R * .15 * (stt % 3)).add(new V3(0, -.3, 0)); pk.tam = 40; }
    pk.vel = new V3().subVectors(d ? nguc(d) : pk.diemDich, pk.pos).normalize().multiplyScalar(pk.toc);
    phiKiem(c, pk);
  }
  function banCanh(frac2) {
    const dich = keThuQuanh(tam, R + 1.5);
    const so = lop * canh + (satTran ? 6 : 0);
    const K = tang >= 5 ? 1.3 : tang >= 4 ? 1.25 : tang >= 3 ? 1.1 : 1;
    const manh = 30 * K * 6 / so * frac2;
    let dem = 0;
    for (let l = 0; l < lop; l++) {
      const Lc = R * .62 * (1 - l * .2), m = clamp(72 - l * 16, 0, 90), lech = l * (180 / canh), g = tam.clone().add(new V3(0, .05 + l * .07, 0));
      for (let i = 0; i < canh; i++) { const y = xo + lech + i * 360 / canh; daBay[l][i] = true; phong1(mutCanh(g, y, m, Lc), y, dem++, manh, dich); }
    }
    for (let i = 0; satTran && i < 6; i++) { const y = xo + 30 + i * 60; phong1(tam.clone().addScaledVector(huongYaw(y), R).add(new V3(0, .5, 0)), y, dem++, manh, dich); }
    quangNo(tam.clone().add(new V3(0, 1, 0)), 1.6, NGOC, .3);
    rung(.22);
  }
  vfx.them(sen, 30, dt => {
    t += dt; xo += dt * 14;
    const uNo = E.o(cl01(t / tBay));
    const mo = t < tKhep ? 5 + 67 * uNo : 72 + (0 - 72) * cl01((t - tKhep) / (tNo - tKhep));
    const co = t < tKhep ? .35 + .65 * uNo : 1 + (.55 - 1) * cl01((t - tKhep) / (tNo - tKhep));
    const k = t > tNo ? cl01(1 - (t - tNo) / (tHet - tNo)) : cl01(t / .12);
    if (k <= 0) return false;
    sen.ve(tam, R * .62 * co, mo, xo, k * (daNo ? .5 : 1), boCanh);
    if (!daNo && Math.random() < .35) { const r = huongYaw(RR(0, 360)).multiplyScalar(R * RR(.85, 1)); hatBay(tam.clone().add(r).add(new V3(0, .1, 0)), new V3(0, RR(.8, 2), 0), NGOC, .12, .9); }
    // rễ trói (đòn nhẹ để bảng tầng gắn Trói)
    if (!daTroi && t >= .38) {
      daTroi = true;
      vungCb(c, tam.clone().add(new V3(0, .6, 0)), R, { manh: 10, pha: 4 });
      const so = 6 + lop * 2;
      for (let i = 0; i < so; i++) { const r = huongYaw(i * 360 / so + xo); gaiNo(c, { tam: tam.clone().addScaledVector(r, R * RR(.55, .95)), R: .8, tNo: .2, cao: 1.1, so: 5, op: null, mau: XANH, mauGoc: RE }); }
      rung(.2);
    }
    // Liên Đài Hộ Thể: đứng trong đài sen hồi máu theo nhịp
    if (hoThe && t < tNo && Math.hypot(nv.pos.x - tam.x, nv.pos.z - tam.z) < R) { tHoi += dt; if (tHoi >= .3) { tHoi = 0; hoiMau(nv, .008, NGOC); } }
    if (!daBay1 && t >= tBay) { daBay1 = true; banCanh(1); }
    if (tang >= 5 && !daBay2 && t >= tBay + .45) { daBay2 = true; banCanh(.5); }
    if (!daNo && t >= tNo) {
      daNo = true;
      const p = tam.clone().add(new V3(0, .8, 0)), K = tang >= 3 ? 1.1 : 1;
      vungCb(c, p, R * .75, { manh: 40 * K, pha: 12, len: 2, lui: 1.5 });
      noLon(p, tang >= 4 ? 3.2 : 2.2, NGOC);
      songXung(tam.clone().add(new V3(0, .2, 0)), R * 1.4, XANH, .55, LEN, .16);
      tiaLua(p, tang >= 4 ? 60 : 30, NGOC, 8);
      if (tang >= 4) DK.rung(.45); else rung(.3);   // RungLon: người chơi tầng ≥ 4 vượt trần .22 (≤ .6)
      if (!satTran) hoiMau(nv, Math.min((tang >= 4 ? .08 : .04) * (hoThe ? 3 : 1), .24), NGOC);
    }
    return true;
  });
}

// ================================================================ ĐĂNG KÝ
DK.dangKyBo('kiem_cp1', {
  nguon: 'CongPhap/Bo/ThanhLien.cs (ThanhLienKiemCa + KiemTuThanhVan), ChieuDaoThuong.cs (KichBanVuKhiWeb), ChieuVe.cs',
  ghiChu: 'Code ≠ JSON: (1) vfx_tang tầng 4–5 của Z/X/C/V ghi chữ chiêu + đổi màu trời + rung máy, code chỉ làm cho R. ' +
    '(2) C mô tả "trói kẻ ĐẦU TIÊN chạm phải" nhưng rễ đánh MỌI kẻ chạm (mỗi kẻ một lần). ' +
    '(3) X nhánh Toàn Vũ: nhát 4 (.86 s) chỉ là vùng 4,5 m + gió, clip không có động tác xoay người (đang giữ KP_S4). ' +
    '(4) X Hoá Cảnh "trăm cánh sen xoay quanh thân" — code chỉ là sen 4 lớp. (5) V Viên Mãn "quầng lan khắp đường lướt" — code chỉ to sen (R 2,8, 2 lớp). ' +
    '(6) V nhánh Tam Thiểm dùng chung clip kp_tl_pha_khong (1 cú lướt) cho 3 chớp — dáng không khớp nhịp .2/.42/.64. ' +
    '(7) Phược Địa: ban_kinh_nhan 1,5 trong json nhưng code cố định vòng 5 m; mỗi rễ 56 (=70×0,8) lại còn nhân he_so nhánh 0,8 ⇒ nghi trừ 2 lần. ' +
    '(8) Tam Thiểm: mỗi chớp 85×0,45 trong code + he_so nhánh 0,75 ⇒ cũng nghi trừ 2 lần. (9) Liên Đài Hộ Thể: code thu vòng ×0,8 nhưng json ban_kinh_nhan 1. ' +
    'Gần đúng: lưới trăng khuyết / cánh sen / kiếm sáng / rễ / gai dựng lại bằng hộp đúng tỉ lệ ChieuVe; lớp màu chính trộn thường (game cộng sáng — sân HTML sáng sẽ ra trắng); hạt bụi thành khối nhỏ. ' +
    'Game không vẽ vệt lưỡi kiếm trong chiêu (VetKiem chỉ mở ở đòn thường) ⇒ HTML cũng không. Bộ không có combo đòn thường riêng.',
  tuThe: [],
  chieu: {
    tl_kiem_khi: kiemKhi,
    tl_tam_diep: tamDiep,
    tl_trien_can: trienCan,
    tl_pha_khong: phaKhong,
    tl_kiem_tran: kiemTran,
  },
});
})();
