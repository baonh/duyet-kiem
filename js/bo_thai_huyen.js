"use strict";
// ============================================================================
// bo_thai_huyen.js — 2026-11-14 — THÁI HUYỀN KIẾM Ý (mã kiem_cp3, hệ Thuỷ → Băng) cho Phòng duyệt Kiếm.
// Port từ game: Assets/Game/CongPhap/Bo/ThaiHuyen.cs (+ KichBanVuKhiWeb/ChieuDaoThuong.cs, ChieuVe.cs, HeTrangThai.cs, KhacChe.cs,
//   VFXThamSoThuocTinh.cs cho hào quang trạng thái). Số / mốc / tầm / bán kính / màu chép nguyên (giây mô phỏng như C#).
// Trạng thái (Ướt / Chậm tích / Đóng băng / Vỡ băng / Giáp vỡ) mô phỏng theo luật HeTrangThai + BangKhacChe ngay trong file này,
//   lưu ở bù nhìn: b.trangThai.th (lõi xoá khi Đặt lại).
// ============================================================================
(function () {
const DK = window.DK, T = DK.T, V3 = DK.V3, vfx = DK.vfx, D = DK.D;
const MA = 'kiem_cp3';

// ---------------------------------------------------------------- màu (ThaiHuyenKiemY)
const NUOC = new T.Color(.3, .68, 1), BANG = new T.Color(.6, .87, 1), TRANG_BANG = new T.Color(.86, .96, 1);
const SUONG = new T.Color(.8, .9, 1).multiplyScalar(.3);           // game alpha .45 (hạt mềm) — khối voxel cộng sáng: dịu hơn
const MAU_THUY = new T.Color(.35, .7, 1), MAU_BANG_TT = new T.Color(.65, .9, 1);   // VFXThamSoThuocTinh
const XAM_DA = new T.Color(.58, .55, .6);

// ---------------------------------------------------------------- luật trạng thái (BangKhacChe)
const GIAY_UOT = 5, GIAY_CHAM = 3, TICH_BANG = .34, GIAY_DONG_BANG = 1.5, MIEN_DONG_BANG = 3, TICH_GIAM = .25, GIAY_GIAP_VO = 4;
const BK_DICH = .35, BK_NGUOI = .4;      // bán kính thân (≈ IThucThe.BanKinh)

// ---------------------------------------------------------------- tiện ích
const KichTang = t => t >= 5 ? 1.5 : t >= 4 ? 1.25 : t >= 3 ? 1.12 : 1;
const RR = (a, b) => a + Math.random() * (b - a);
const phaiCua = h => new V3(-h.z, 0, h.x);                         // bên phải của hướng h (quy ước nv.phai())
const nguc = nv => new V3(nv.pos.x, nv.pos.y + 1.25, nv.pos.z);     // ChieuDanh.Nguc
const ngucDich = b => new V3(b.pos.x, b.pos.y + 1.25, b.pos.z);
const xoayY = (v, doDo) => { const a = doDo * D, c = Math.cos(a), s = Math.sin(a); return new V3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c); };
/** KcThan: khoảng cách từ p tới trục thân bù nhìn (cao 1.8) */
function kcThan(b, p) { const y = DK.clamp(p.y, b.pos.y + .2, b.pos.y + 1.7); return Math.hypot(p.x - b.pos.x, p.y - y, p.z - b.pos.z); }
function kcDoan(p, a, b) { const ab = new V3().subVectors(b, a), L2 = ab.lengthSq(); const u = L2 > 1e-8 ? DK.clamp(new V3().subVectors(p, a).dot(ab) / L2, 0, 1) : 0; return a.clone().addScaledVector(ab, u).distanceTo(p); }
const _m = new T.Matrix4(), _x = new V3(), _y = new V3(), _z = new V3();
/** Quaternion.LookRotation(f, up) của Unity → quaternion three */
function qNhin(f, up, out) {
  _z.copy(f).normalize(); _y.copy(up).addScaledVector(_z, -up.dot(_z)); if (_y.lengthSq() < 1e-8) _y.set(0, 0, 1).addScaledVector(_z, -_z.z); _y.normalize();
  _x.crossVectors(_y, _z); _m.makeBasis(_x, _y, _z); return (out || new T.Quaternion()).setFromRotationMatrix(_m);
}
const LEN = new V3(0, 1, 0);
function rung(k) { DK.rung(k, .25); }

// ---------------------------------------------------------------- vẽ (port ChieuVe)
const HOP = new T.BoxGeometry(1, 1, 1); HOP.giu = true;
/** lưới trăng khuyết y TaoTrang (±80°, mép trong mờ) — trục +z = hướng trăng, mặt phẳng XZ */
const TRANG = (function () {
  const N = 20, GOC = 80 * D, P = [], C = [], I = [];
  for (let k = 0; k <= N; k++) {
    const u = k / N, g = -GOC + 2 * GOC * u, dx = Math.sin(g), dz = Math.cos(g);
    const w = .34 * Math.pow(Math.max(0, Math.cos((u - .5) * Math.PI)), .8);
    P.push(dx, 0, dz, dx * (1 - w), 0, dz * (1 - w) - w * .25); C.push(1, 1, 1, 1, 1, 1, 1, .12);
    if (k < N) { const a = k * 2; I.push(a, a + 1, a + 3, a, a + 3, a + 2); }
  }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('color', new T.Float32BufferAttribute(C, 4)); g.setIndex(I); g.giu = true; return g;
})();
const matCongVC = (c, op) => new T.MeshBasicMaterial({ color: c, vertexColors: true, transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
/** HuongTrang(d, dung, nghieng rad) → quaternion */
function huongTrang(d, dung, nghieng, out) {
  const dd = d.clone(); if (dd.lengthSq() < 1e-6) dd.set(0, 0, 1); dd.normalize();
  let n = dung ? new V3().crossVectors(LEN, dd) : LEN.clone(); if (n.lengthSq() < 1e-4) n.set(1, 0, 0); n.normalize();
  if (nghieng) n.applyAxisAngle(dd, nghieng);
  return qNhin(dd, n, out);
}
/** trăng khuyết ba lớp (VeTrang) — trả { o, ve(p, q, r, k) } */
function taoTrang(mau) {
  const g = new T.Group(), c = new T.Color(mau);
  // lớp chính trộn thường (giữ màu nước/băng trên nền sân sáng — game cộng sáng cả ba lớp, ở đây cộng thì cháy trắng)
  const m1 = new T.Mesh(TRANG, Object.assign(matCongVC(c, .8), { blending: T.NormalBlending })), m2 = new T.Mesh(TRANG, matCongVC(c.clone().lerp(new T.Color(1, 1, 1), .55), .5)), m3 = new T.Mesh(TRANG, matCongVC(c, .22));
  m2.scale.set(.92, 1, .92); m3.scale.setScalar(1.15); g.add(m1, m2, m3); g.renderOrder = 7;
  for (const m of [m1, m2, m3]) m.frustumCulled = false;
  return { o: g, ve(p, q, r, k) { g.position.copy(p); g.quaternion.copy(q); g.scale.setScalar(Math.max(.001, r)); m1.material.opacity = .6 * k; m2.material.opacity = .5 * k; m3.material.opacity = .22 * k; g.visible = k > .003; } };
}
/** TrangTinh: trăng đọng tại chỗ, r từ .3r → r (ease o, trong 1/3 đời), mờ 1−u² */
function trangTinh(p, d, r, mau, song = .6, dung = true, nghieng = 0) {
  const tr = taoTrang(mau), q = huongTrang(d, dung, nghieng), p0 = p.clone();
  tr.ve(p0, q, r * .3, 1);
  return vfx.them(tr.o, song, (dt, u) => tr.ve(p0, q, DK.lerp(r * .3, r, DK.ease('o', Math.min(1, u * 3))), 1 - u * u));
}
/** QuangNo: quầng tròn quay về máy quay, bán kính .32r → 1.76r */
function quangNo(p, r, mau, song = .35) {
  const sp = new T.Sprite(new T.SpriteMaterial({ map: vfx.texTron, color: new T.Color(mau), blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: .7 }));
  sp.position.copy(p); sp.renderOrder = 8; const r0 = r * .32, r1 = r * 1.76;
  const cap = (dt, u) => { const rr = DK.lerp(r0, r1, DK.ease('o', u)) * 2; sp.scale.set(rr, rr, 1); sp.material.opacity = .7 * (1 - u * u); };
  cap(0, 0); return vfx.them(sp, song, cap);
}
/** SongXung: vòng nở .1r → .8r; phap null = quay về máy quay */
function songXung(p, r, mau, song = .45, phap = null, day = .12) {
  const m = new T.Mesh(new T.RingGeometry(1 - Math.min(.9, day), 1, 64), new T.MeshBasicMaterial({ color: new T.Color(mau), transparent: true, opacity: .45, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
  m.position.copy(p); const h = phap ? phap.clone().normalize() : new V3().subVectors(DK.cam.position, p).normalize();
  m.quaternion.setFromUnitVectors(new V3(0, 0, 1), h); m.renderOrder = 7;
  const r0 = r * .096, r1 = r * .8;
  const cap = (dt, u) => { const rr = Math.max(.001, DK.lerp(r0, r1, DK.ease('o', u))); m.scale.set(rr, rr, rr); m.material.opacity = .45 * (1 - u * u); };   // game .6 — hạ .45 vì nền sân sáng
  cap(0, 0); return vfx.them(m, song, cap);
}
/** TiaLua: tia toé cầu */
const tiaLua = (p, n, mau, toc = 9) => vfx.hat(p, { so: n, mau, toc: toc * .9, co: .11, song: .3, trongLuc: 10, can: 2 });
/** GachVo: khối đá/băng vụn nặng (đặc) */
const gachVo = (p, n, toc = 7) => vfx.hat(p.clone().setY(p.y + .1), { so: n, mau: XAM_DA, toc, huong: LEN, loe: .9, co: .44, song: 1.4, trongLuc: 22, can: .3, to: true, lech: .4 });
/** HatBay: một hạt bay theo vận tốc cho sẵn */
const hatBay = (p, v, mau, co, song) => { const l = v.length(); vfx.hat(p, { so: 1, mau, toc: l, huong: l > 1e-4 ? v : LEN, loe: 0, co, song, trongLuc: 0, can: 2, dat: false }); };
/** VFXThamSo.PhatThuocTinh(Băng): băng vụn 3D + vòng sương (gần đúng) */
function thuocTinhBang(p, manh) { vfx.hat(p, { so: Math.round(8 * manh), mau: MAU_BANG_TT, toc: 4 + manh, co: .13, song: .5, trongLuc: 9.8 }); songXung(p, 1.2 * manh, MAU_BANG_TT, .3, LEN, .15); }
/** NoLon: một quầng màu + lõi trắng + vòng + tia */
function noLon(p, r, mau) { quangNo(p, r * .6, mau, .35); quangNo(p, r * .22, 0xffffff, .14); songXung(p, r * 1.3, mau, .45); tiaLua(p, Math.round(16 + r * 6), mau, 6 + r * 2); rung(.3 + r * .14); }
/** VetThang: vạch ngắm a→b */
const vetThang = (a, b, mau, day = .08, song = .4) => vfx.tia(a, b, { rong: day * 2, mau, song });

/** tinh thể băng (VeTinhThe): hộp xoay 45° mọc từ goc theo len — trả { o, ve(goc, len, cao, rong, k) } */
function taoTinhThe() {
  const g = new T.Group();
  const loi = new T.Mesh(HOP, new T.MeshBasicMaterial({ color: TRANG_BANG, transparent: true, opacity: .55, depthWrite: false }));
  const vien = new T.Mesh(HOP, new T.MeshBasicMaterial({ color: BANG, transparent: true, opacity: .3, blending: T.AdditiveBlending, depthWrite: false }));
  g.add(loi, vien); const q45 = new T.Quaternion().setFromAxisAngle(new V3(0, 0, 1), Math.PI / 4), q = new T.Quaternion();
  return {
    o: g,
    ve(goc, len, cao, rong, k) {
      if (cao <= .02 || k <= .01) { g.visible = false; return; } g.visible = true;
      const l = len.lengthSq() < 1e-6 ? LEN : len.clone().normalize();
      qNhin(l, Math.abs(l.y) > .9 ? new V3(0, 0, 1) : LEN, q).multiply(q45);
      g.position.copy(goc).addScaledVector(l, cao * .5); g.quaternion.copy(q);
      loi.scale.set(rong, rong, cao); vien.scale.set(rong * 1.5, rong * 1.5, cao * 1.06);
      loi.material.opacity = .55 * k; vien.material.opacity = .3 * k;
    },
  };
}
/** băng kiếm (VeKiemBang): mũi ở p, chuôi lùi theo huong — trả { o, ve(p, huong, dai, k) } */
function taoKiemBang() {
  const g = new T.Group();
  const mk = (mau, op, cong) => new T.Mesh(HOP, new T.MeshBasicMaterial({ color: mau, transparent: true, opacity: op, depthWrite: !cong && false, blending: cong ? T.AdditiveBlending : T.NormalBlending }));
  const luoi = mk(TRANG_BANG, .92, false), quang = mk(BANG, .38, true), chan = mk(BANG, .85, true), mui = mk(0xffffff, .9, true);
  g.add(luoi, quang, chan, mui); const q = new T.Quaternion(), q45 = new T.Quaternion().setFromAxisAngle(new V3(0, 0, 1), Math.PI / 4);
  mui.quaternion.copy(q45);
  return {
    o: g,
    ve(p, huong, dai, k) {
      const f = huong.lengthSq() < 1e-6 ? new V3(0, 0, 1) : huong.clone().normalize();
      qNhin(f, Math.abs(f.y) > .95 ? new V3(0, 0, 1) : LEN, q);
      g.position.copy(p); g.quaternion.copy(q);       // gốc nhóm = mũi, trục −z = về chuôi
      luoi.position.set(0, 0, -dai * .5); luoi.scale.set(.16, .045, dai);
      quang.position.set(0, 0, -dai * .5); quang.scale.set(.36, .14, dai * 1.1);
      chan.position.set(0, 0, -dai); chan.scale.set(.5, .07, .07);
      mui.position.set(0, 0, -.06); mui.scale.set(.1, .1, .18);
      luoi.material.opacity = .92 * k; quang.material.opacity = .38 * k; chan.material.opacity = .85 * k; mui.material.opacity = .9 * k;
      g.visible = k > .003;
    },
  };
}

// ---------------------------------------------------------------- dấu báo (BaoDai / BaoVong / BaoQuat)
// màu báo dịu (.55) — dấu báo của game là lớp mờ .16/.4, cộng sáng nguyên màu băng trên nền sáng sẽ thành mảng trắng
const mauBao = c => new T.Color(c).multiplyScalar(.55);
const baoDai = (a, b, rong, tg, mau) => vfx.dai(a, b, { rong, song: tg + .08, mau: mauBao(mau) });
const baoVong = (p, r, tg, mau) => vfx.vung(p, { r, song: tg + .08, mau: mauBao(mau) });
function baoQuat(p, h, r, gocDo, tg, mau) {
  mau = mauBao(mau);
  const g = new T.Group(); g.position.set(p.x, .03, p.z); g.rotation.y = Math.atan2(h.x, h.z);
  const goc = gocDo * D, mk = (rr, op, cong) => { const m = new T.Mesh(new T.CircleGeometry(rr, 48, -Math.PI / 2 - goc / 2, goc), cong ? vfx.matCong(mau, op) : vfx.matThuong(mau, op)); m.rotation.x = -Math.PI / 2; g.add(m); return m; };
  mk(r, .16, false); const lap = mk(r, .4, true);
  const vien = new T.Mesh(new T.RingGeometry(r - .08, r, 48, 1, -Math.PI / 2 - goc / 2, goc), vfx.matCong(mau, .9)); vien.rotation.x = -Math.PI / 2; g.add(vien);
  return vfx.them(g, tg + .08, (dt, u, t) => { const uu = DK.clamp(t / Math.max(.01, tg), .01, 1); lap.scale.setScalar(uu); vien.material.opacity = .9 * (.6 + .4 * Math.sin(t * 30)); });
}

// ---------------------------------------------------------------- TRẠNG THÁI (HeTrangThai rút gọn)
function tt(b) { return b.trangThai.th || (b.trangThai.th = { uot: 0, cham: 0, tich: 0, dong: 0, mien: 0, giapVo: 0 }); }
const coDong = b => { const s = b.trangThai.th; return !!s && s.dong > DK.now; };
const coUot = b => { const s = b.trangThai.th; return !!s && s.uot > DK.now; };
/** Gan(cham): tích băng; đầy ⇒ Đóng băng (đang / vừa đông ⇒ chỉ chậm). Trả true nếu vừa đông. */
function ganCham(b, giay, manh) {
  const s = tt(b), now = DK.now;
  if (s.dong > now || s.mien > now) { s.cham = Math.max(s.cham, now + giay); return false; }
  s.tich += manh > 0 ? manh : TICH_BANG;
  if (s.tich >= 1 - 1e-4) { s.tich = 0; s.cham = 0; s.dong = now + GIAY_DONG_BANG; return true; }
  s.cham = Math.max(s.cham, now + giay); return false;
}
function gan(b, ma, giay, manh) {
  const s = tt(b);
  if (ma === 'uot') { s.uot = Math.max(s.uot, DK.now + giay); return false; }
  if (ma === 'cham') return ganCham(b, giay, manh);
  if (ma === 'giap_vo') { s.giapVo = Math.max(s.giapVo, DK.now + giay); return false; }
  return false;
}
// hào quang trạng thái bám bù nhìn (VFXThamSoThuocTinh: Ướt nhỏ giọt, Chậm vòng chân, Đóng băng 6 tinh thể + quầng)
function auraCua(b) {
  if (b._thAura) return b._thAura;
  const g = new T.Group(); b.root.add(g);
  const vong = new T.Mesh(new T.RingGeometry(.62, .77, 40), new T.MeshBasicMaterial({ color: MAU_BANG_TT, transparent: true, opacity: .45, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
  vong.rotation.x = -Math.PI / 2; vong.position.y = .04; g.add(vong);
  const bang = new T.Group(); g.add(bang); const tinh = [];
  for (let k = 0; k < 6; k++) { const x = taoTinhThe(); bang.add(x.o); tinh.push({ x, g: k * 60 + Math.random() * 30, h: .5 + .4 * Math.random() }); }
  const quang = new T.Sprite(new T.SpriteMaterial({ map: vfx.texTron, color: MAU_BANG_TT, blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: .35 }));
  quang.position.y = .9; quang.scale.set(1.8, 1.8, 1); bang.add(quang);
  return (b._thAura = { g, vong, bang, tinh, quang, tDrip: 0, vao: 0 });
}
DK.moiKhung(dt => {
  for (const b of DK.dsBuNhin) {
    const s = b.trangThai && b.trangThai.th, now = DK.now;
    if (!s) { if (b._thAura) b._thAura.g.visible = false; continue; }
    s.tich = Math.max(0, s.tich - TICH_GIAM * dt);
    if (s.dong > 0 && now >= s.dong) { s.dong = 0; s.mien = now + MIEN_DONG_BANG; if (b.hd) b.hd.tocDo = 1; }
    const a = auraCua(b); a.g.visible = true;
    // Ướt: giọt nước rơi
    if (s.uot > now) { a.tDrip += dt * 8; while (a.tDrip >= 1) { a.tDrip -= 1; vfx.hat(new V3(b.pos.x + RR(-.3, .3), b.pos.y + RR(.3, 1.8), b.pos.z + RR(-.3, .3)), { so: 1, mau: MAU_THUY.clone().multiplyScalar(.8), toc: .05, co: .06, song: .55, trongLuc: 9.8 }); } }
    // Chậm: vòng sương dưới chân, xoay
    a.vong.visible = s.cham > now && !(s.dong > now); a.vong.rotation.z += dt * .5;
    // Đóng băng: 6 tinh thể quanh thân + quầng; bù nhìn đứng khựng
    const dong = s.dong > now; a.vao = DK.clamp(a.vao + (dong ? dt / .12 : -dt / .15), 0, 1);
    a.bang.visible = a.vao > 0;
    if (a.vao > 0) for (const x of a.tinh) { const d = xoayY(new V3(0, 0, 1), x.g); x.x.ve(d.clone().multiplyScalar(.25), new V3(-d.x * .15, 1, -d.z * .15), 1.8 * x.h * a.vao, .32, 1); }
    a.quang.material.opacity = .25 * a.vao;
    if (dong && b.hd) b.hd.tocDo = 0;
  }
});

// ---------------------------------------------------------------- ĐÒN TRÚNG (Danh)
const TEN_TT = ['thuy', 'bang', 'bang', 'bang', 'bang'];
/** một đòn của chiêu L.i trúng b. op: { manh, pha, len, lui, phaBang, diem, huong } → { trung, vo } */
function danh(L, b, op) {
  if (!b) return { trung: false, vo: false };
  const s = tt(b), dongBang = coDong(b), uot = coUot(b);
  const nang = !!op.phaBang && dongBang;
  let st = (op.manh || 0) * L.heSo * (nang ? 2 : 1);
  let nhan = null;
  // phản ứng (đọc trạng thái TRƯỚC đòn): đông + đòn nặng ⇒ vỡ băng ×2
  if (nang) { s.dong = 0; s.mien = DK.now + MIEN_DONG_BANG; if (b.hd) b.hd.tocDo = 1; nhan = 'Vỡ băng ×2'; }
  if (s.giapVo > DK.now) st *= 1.2;
  // trạng thái theo thuộc tính đòn
  let vuaDong = false;
  if (TEN_TT[L.i] === 'thuy') { gan(b, 'uot', GIAY_UOT, 1); nhan = nhan || 'Ướt'; }
  else vuaDong = ganCham(b, GIAY_CHAM, TICH_BANG) || vuaDong;
  // trạng thái theo tầng (TienDoCongPhap.TrangThaiTang — CongPhapVuKhi.ThuanThucVaTrangThai)
  if (L.ttTang && L.ttTang.ma && L.ttTang.giay > 0) vuaDong = gan(b, L.ttTang.ma, L.ttTang.giay, L.ttTang.manh) || vuaDong;
  // băng đánh vào đích Ướt ⇒ tích thêm một nấc (đông nhanh gấp đôi)
  if (!nang && uot && TEN_TT[L.i] === 'bang' && !coDong(b)) { vuaDong = ganCham(b, GIAY_CHAM, TICH_BANG) || vuaDong; tiaLua(op.diem || ngucDich(b), 8, TRANG_BANG, 3); }
  if (!nhan) nhan = vuaDong ? 'Đóng băng' : coDong(b) ? null : (TEN_TT[L.i] === 'bang' ? 'Chậm ' + Math.round(tt(b).tich * 100) + '%' : null);
  if (op.giapVo) { gan(b, 'giap_vo', GIAY_GIAP_VO, .2); nhan = (nhan ? nhan + ' · ' : '') + 'Giáp vỡ'; }
  DK.trung(b, { st, nguon: L.nv, day: op.lui || 0, hat: op.len >= 3 ? op.len * .3 : 0, mau: TEN_TT[L.i] === 'thuy' ? NUOC : BANG, trangThai: nhan || undefined });
  if (coDong(b) && b.hd) b.hd.tocDo = 0;
  if (nang) noVoBang(L, op.diem || ngucDich(b));
  return { trung: true, vo: nang };
}
/** vỡ băng: chùm băng vụn + quầng trắng (Viên Mãn: cánh sen băng) */
function noVoBang(L, p) {
  quangNo(p, 1.6, TRANG_BANG, .3); songXung(p, 2.6, BANG, .35, null, .1);
  tiaLua(p, 26, TRANG_BANG, 9); gachVo(p.clone().setY(p.y - .8), 10, 7);
  thuocTinhBang(p, 2);
  vfx.hat(p, { so: 36, mau: MAU_BANG_TT, toc: 8, co: .16, song: .35, trongLuc: 9.8 }); songXung(p, 1.8 / .8, MAU_BANG_TT, .3, LEN, .12);   // phản ứng vo_bang
  if (L.tang >= 4) for (let k = 0; k < 6; k++) { const d = xoayY(new V3(0, 0, 1), k * 60); trangTinh(p.clone().addScaledVector(d, .9), d, 1.3, BANG, .45, true, .5); }
  rung(.3);
}

// ---------------------------------------------------------------- ĐẠN: KiemBay (nước / sóng kép / sông / băng kiếm)
const K_NUOC = 0, K_SONG_KEP = 1, K_SONG = 2, K_BANG = 3;
function kiemBay(L, kieu, tu, huong, r, toc, tam, manh, pha, xuyen, khiTrung, dich) {
  const kb = { kieu, pos: tu.clone(), truoc: tu.clone(), vel: (huong.lengthSq() > 1e-6 ? huong.clone().normalize() : new V3(0, 0, 1)).multiplyScalar(toc), conLai: tam,
    het: false, tHet: 0, t: 0, tHat: 0, daPhong: kieu !== K_BANG, cho: 0, duoi: 0, lechCho: new V3(), khiTrung, thu: [] };
  kb.phong = h => { if (kb.het) return; kb.daPhong = true; kb.vel = (h.lengthSq() > 1e-6 ? h.clone().normalize() : kb.vel.clone().normalize()).multiplyScalar(toc); };
  const g = new T.Group(); let ves = [];
  if (kieu === K_NUOC) ves = [taoTrang(NUOC)];
  else if (kieu === K_SONG_KEP) ves = [taoTrang(NUOC), taoTrang(TRANG_BANG), taoTrang(NUOC)];
  else if (kieu === K_SONG) for (let j = 0; j < 6; j++) ves.push(taoTrang(j % 2 === 0 ? NUOC : TRANG_BANG));
  else ves = [taoKiemBang()];
  for (const v of ves) g.add(v.o);
  const q = new T.Quaternion();
  const ve = k => {
    const vn = kb.vel.clone().normalize();
    if (kieu === K_NUOC) ves[0].ve(kb.pos, huongTrang(kb.vel, false, .12, q), r, k);
    else if (kieu === K_SONG_KEP) {
      ves[0].ve(kb.pos, huongTrang(kb.vel, false, .12, q), r, k);
      ves[1].ve(kb.pos.clone().addScaledVector(LEN, .38).addScaledVector(vn, -.35), huongTrang(kb.vel, false, -.1, q), r * .82, k * .8);
      ves[2].ve(kb.pos.clone().addScaledVector(LEN, -.34).addScaledVector(vn, -.55), huongTrang(kb.vel, false, .25, q), r * .74, k * .7);
    } else if (kieu === K_SONG) {
      const ben = phaiCua(vn).normalize();
      for (let j = 0; j < 6; j++) { const s = Math.sin(kb.t * 10 - j * .9) * .5; const p = kb.pos.clone().addScaledVector(vn, -j * 1.1).addScaledVector(ben, s).addScaledVector(LEN, Math.cos(kb.t * 7 - j) * .2); ves[j].ve(p, huongTrang(kb.vel, false, s * .3, q), r * (1 - j * .1), k * (1 - j * .12)); }
    } else ves[0].ve(kb.pos, kb.vel, .95 * KichTang(L.tang) * (L.tang >= 4 ? 1.4 : 1), k);
  };
  const ket = () => { if (kb.het) return; kb.het = true; kb.tHet = DK.now; };
  ve(kieu === K_BANG ? 0 : 1);
  kb.x = vfx.them(g, 30, (dt) => {
    kb.t += dt;
    if (kb.het) { const k = 1 - (DK.now - kb.tHet) / .16; if (k <= 0) return false; ve(k); return; }
    if (!kb.daPhong) {
      // treo sau lưng người tung (lắc nhẹ), quá `cho` giây tự phóng thẳng
      kb.pos.copy(L.nv.pos).add(kb.lechCho).addScaledVector(LEN, Math.sin(kb.t * 9 + kb.lechCho.x) * .06);
      const nhin = dich ? new V3().subVectors(ngucDich(dich), kb.pos) : L.nv.toi();
      kb.vel.copy(nhin).normalize().multiplyScalar(toc);
      if (kb.t >= kb.cho) kb.daPhong = true;
      ve(DK.clamp(kb.t / .12, 0, 1)); return;
    }
    if (kb.duoi > 0 && dich) {
      const muon = new V3().subVectors(ngucDich(dich), kb.pos);
      if (muon.lengthSq() > .04) { const v0 = kb.vel.clone().normalize(), v1 = muon.normalize(), goc = v0.angleTo(v1), buoc = kb.duoi * dt; if (goc > 1e-4) { const k = Math.min(1, buoc / goc); const ax = new V3().crossVectors(v0, v1); if (ax.lengthSq() > 1e-10) kb.vel.applyAxisAngle(ax.normalize(), goc * k); } }
    }
    kb.truoc.copy(kb.pos); kb.pos.addScaledVector(kb.vel, dt); kb.conLai -= toc * dt;
    const rn = kieu === K_BANG ? .35 : kieu === K_SONG ? r * .8 : r * .6;
    for (const o of DK.dsBuNhin) {
      if (kb.het || kb.thu.indexOf(o) >= 0) continue;
      const p1 = o.pos.clone().setY(o.pos.y + .3), p2 = o.pos.clone().setY(o.pos.y + 1.8 * .85), giua = p1.clone().lerp(p2, .5);
      const kc = Math.min(kcDoan(p1, kb.truoc, kb.pos), kcDoan(p2, kb.truoc, kb.pos), kcDoan(giua, kb.truoc, kb.pos));
      if (kc > rn + BK_DICH) continue;
      kb.thu.push(o);
      const diem = ngucDich(o), h = kb.vel.clone().setY(0);
      danh(L, o, { manh, pha, len: 0, lui: kieu === K_SONG ? 3 : 1.2, diem, huong: h });
      const mau = kieu === K_BANG ? TRANG_BANG : NUOC;
      quangNo(diem, kieu === K_BANG ? .8 : 1.1, mau, .2); tiaLua(diem, kieu === K_BANG ? 8 : 12, mau, 5);
      if (kb.khiTrung) kb.khiTrung(o, diem);
      if (!xuyen) ket();
    }
    if (kb.het) { ve(1); return; }
    if (kb.pos.y < .05) { kb.pos.y = .05; if (kieu !== K_SONG) { tiaLua(kb.pos, 10, kieu === K_BANG ? TRANG_BANG : NUOC, 4); ket(); ve(1); return; } }
    if (kb.conLai <= 0) { ket(); ve(1); return; }
    kb.tHat += dt;
    if (kb.tHat >= .045) {
      kb.tHat = 0; const vn = kb.vel.clone().normalize();
      if (kieu === K_BANG) { if (L.tang >= 2) hatBay(kb.pos.clone().addScaledVector(vn, -.6).add(new V3(RR(-.15, .15), RR(-.15, .15), RR(-.15, .15))), kb.vel.clone().multiplyScalar(-.05).add(new V3(0, -.4, 0)), TRANG_BANG, .09, .6); }
      else {
        if (Math.random() < .7) tiaLua(kb.pos.clone().add(new V3(RR(-1, 1), RR(-1, 1), RR(-1, 1)).multiplyScalar(r * .4)), 1, NUOC, 1.6);
        if (L.tang >= 2) hatBay(kb.pos.clone().add(new V3(RR(-1, 1), RR(-1, 1), RR(-1, 1)).multiplyScalar(r * .5)), new V3(0, -1.2, 0), TRANG_BANG, .1, .5);   // bọt nước
      }
    }
    ve(1);
  });
  return kb;
}

/** băng kiếm / gai băng rơi từ trên xuống p (rơi tRoi giây), chạm đất đánh vùng r; phaBang ⇒ vỡ băng được */
function kiemRoi(L, p, r, manh, phaBang, tRoi) {
  tRoi = Math.max(.05, tRoi);
  const g = new T.Group(), kb = taoKiemBang(), tinh = taoTinhThe(); g.add(kb.o, tinh.o); tinh.o.visible = false;
  const tren = p.clone().add(new V3(.8, 9, .4)), huong = new V3().subVectors(p, tren);
  let t = 0, xong = false;
  kb.ve(tren, huong, 1.2, 1);
  vfx.them(g, 10, (dt) => {
    t += dt;
    if (!xong) {
      const u = DK.clamp(t / tRoi, 0, 1); const vt = new V3().lerpVectors(tren, p.clone().setY(p.y + .2), u * u);
      kb.ve(vt, huong, 1.2, 1);
      if (u < 1) return;
      xong = true; t = 0; kb.o.visible = false;
      const q = p.clone().setY(p.y + .3); quangNo(q, r * .8, TRANG_BANG, .22); tiaLua(q, 10, TRANG_BANG, 5);
      const tam = p.clone().setY(p.y + .8);
      for (const o of DK.dsBuNhin) if (kcThan(o, tam) <= r + BK_DICH) danh(L, o, { manh, pha: 4, phaBang, diem: ngucDich(o) });
      return;
    }
    const k = 1 - t / .5; if (k <= 0) return false;
    tinh.ve(p, LEN, 1.1, .14, k);      // kiếm cắm đất tan dần
  });
}

// ============================================================================ CHIÊU
/** ngữ cảnh một lần ra chiêu (Lan) */
function lan(ctx, i) {
  const ch = ctx.ch, tang = ctx.tang;
  // nhánh chỉ có hiệu lực từ Đại Thành (TienDoCongPhap.NhanhHieuLuc: Tang < TANG_CHON_NHANH ⇒ null)
  const nhanh = tang >= 3 ? ctx.nhanh : null;
  const td = ch.tang && ch.tang[tang - 1] || {}, nh = nhanh && ch.nhanh ? ch.nhanh.find(n => n.ma === nhanh) : null;
  const heSo = (td.he_so || 1) * (nh && nh.so_mod && nh.so_mod.he_so > 0 ? nh.so_mod.he_so : 1);
  const L = { nv: ctx.nv, dich: ctx.dich, i, tang, nhanh, heSo, ttTang: td.trang_thai || null, ctx, Nhanh: m => nhanh === m };
  L.h = huongNgang(L);
  return L;
}
function huongNgang(L) { if (L.dich) { const d = new V3().subVectors(L.dich.pos, L.nv.pos); d.y = 0; if (d.lengthSq() > 1e-6) return d.normalize(); } return L.nv.toi(); }
/** HuongNgam: ngực → ngực (ngang khi đứng đất) */
function huongNgam(L) { if (L.dich) { const d = new V3().subVectors(ngucDich(L.dich), nguc(L.nv)); if (L.nv.datDat) d.y = 0; if (d.lengthSq() > 1e-6) return d.normalize(); } return L.nv.toi(); }
const mui = L => L.nv.mui();
const chan = L => new V3(L.nv.pos.x, L.nv.pos.y + .06, L.nv.pos.z);
/** vệt chém theo màu thanh kiếm trong đoạn vung của clip (gần đúng hệ vệt vũ khí của game) */
const vetVung = (ctx, song) => vfx.vet(ctx.nv, { song: song || .16 });
/** dời người tung tới `den` trong tg giây (DiToi, ease) */
function diToi(nv, den, tg, e) { const tu = nv.pos.clone(); DK.lap((dt, tl) => { const u = DK.clamp(tl / tg, 0, 1), k = DK.ease(e || 'io', u); nv.pos.x = DK.lerp(tu.x, den.x, k); nv.pos.z = DK.lerp(tu.z, den.z, k); return u < 1; }); }
/** DiemLuot: điểm đến của cú lướt dài Ld — dừng trước mục tiêu khoảng hở `ho` */
function diemLuot(L, Ld, ho) {
  const nv = L.nv; let den = nv.pos.clone().addScaledVector(L.h, Ld);
  if (L.dich) { const a = new V3().subVectors(L.dich.pos, nv.pos); a.y = 0; const kc = a.length(), dung = BK_NGUOI + BK_DICH + ho; if (kc < Ld + dung) den = nv.pos.clone().addScaledVector(L.h, Math.max(0, kc - dung)); }
  return den;
}

// ------------------------------------------------------------------------- Z · THUỶ NGUYỆT KIẾM KHÍ
const TOC_Z = 24;
function thuyNguyet(ctx) {
  const L = lan(ctx, 0), nv = L.nv, h = L.h;
  const lienBa = L.Nhanh('lien_ba'), thuyTien = L.Nhanh('thuy_tien'), hoaCanh = L.tang >= 5;
  const tam = thuyTien ? 28 : lienBa ? 16 : 20;
  const a = new V3(nv.pos.x, .06, nv.pos.z).addScaledVector(h, .6);
  baoDai(a, a.clone().addScaledVector(h, tam), lienBa ? 5 : 2.2, .26, NUOC);
  ctx.phat('CHIEU_0', { moc: { xuat: () => vetVung(ctx) } });
  ctx.sau(.06, () => { quangNo(mui(L), .6, NUOC, .22); if (L.tang >= 2) tiaLua(mui(L), 8, TRANG_BANG, 3); });
  const nhat = (t, k) => ctx.sau(t, () => {
    const hh = huongNgam(L), tu = nguc(nv).addScaledVector(hh, .9);
    if (hoaCanh && !lienBa && !thuyTien) kiemBay(L, K_SONG, tu, hh, 2.6, TOC_Z * .9, 30, 40, 10, true, null, L.dich);   // Thiên Hà Đảo Quyển
    else if (lienBa) { for (let j = -2; j <= 2; j++) kiemBay(L, K_NUOC, tu, xoayY(hh, j * 12.5), .85, TOC_Z, tam, 40, 6, false, null, null); }
    else {
      const kb = kiemBay(L, L.tang >= 3 ? K_SONG_KEP : K_NUOC, tu, hh, thuyTien ? .8 : 1.1 * KichTang(L.tang), thuyTien ? 34 : TOC_Z, tam, 40, 8, thuyTien, null, null);
      if (L.tang >= 4) kb.khiTrung = (o, p) => vongNuoc(L, p, o);
    }
    quangNo(tu, .7, NUOC, .16); rung(.15 + k * .08);
  });
  if (thuyTien || hoaCanh) nhat(.4, 0); else { nhat(.28, 0); nhat(.52, 1); }
}
/** Viên Mãn: chỗ kiếm khí nước trúng nổ vòng nước 2,4 m — Ướt lan sang kẻ đứng gần */
function vongNuoc(L, p, bo) {
  songXung(p, 2.4, NUOC, .4, LEN, .14); tiaLua(p, 14, NUOC, 5);
  for (const o of DK.dsBuNhin) if (o !== bo && kcThan(o, p) <= 2.4 + BK_DICH) danh(L, o, { manh: 12, pha: 2, diem: ngucDich(o) });
}

// ------------------------------------------------------------------------- X · HÀN BĂNG KIẾM
const TOC_X = 30;
function hanBang(ctx) {
  const L = lan(ctx, 1), nv = L.nv, h = L.h;
  ctx.phat('CHIEU_3', { moc: { xuat: () => vetVung(ctx) } });
  if (L.Nhanh('bang_luan')) { bangLuan(L); return; }
  const truy = L.Nhanh('truy_han');
  const so = truy ? 2 : L.tang >= 3 ? 5 : 3;
  const manh = truy ? 30 : 90 / so, duoi = truy ? 6 : 1.6;
  const a = new V3(nv.pos.x, .06, nv.pos.z).addScaledVector(h, .8);
  baoDai(a, a.clone().addScaledVector(h, 22), 2, .35, BANG);
  const ds = [];
  // ngưng băng kiếm sau lưng (Đại Thành: xếp thành vòng cung rộng)
  ctx.sau(.08, () => {
    const phai = phaiCua(h);
    for (let k = 0; k < so; k++) {
      const u = so === 1 ? 0 : (k / (so - 1)) * 2 - 1;
      const lech = phai.clone().multiplyScalar(u * (L.tang >= 3 ? 1.9 : 1.2)).addScaledVector(LEN, 2 + (1 - u * u) * (L.tang >= 3 ? .8 : .45)).addScaledVector(h, -.5);
      const kb = kiemBay(L, K_BANG, nv.pos.clone().add(lech), h, .7, TOC_X, 24, manh, 6, false, null, L.dich);
      kb.cho = 1.1; kb.lechCho = lech; kb.duoi = duoi;
      if (truy) kb.khiTrung = (o) => { if (!coDong(o)) ganCham(o, GIAY_CHAM, TICH_BANG); };
      else if (L.tang >= 4) kb.khiTrung = (o, p) => { tiaLua(p, 16, TRANG_BANG, 6); thuocTinhBang(p, 1.3); };
      ds[k] = kb; quangNo(nv.pos.clone().add(lech), .5, BANG, .2);
    }
    rung(.12);
  });
  // phóng lần lượt: tia ngắm 0,15 s rồi bay
  for (let k = 0; k < so; k++) {
    const tP = .36 + k * (so > 3 ? .08 : .12);
    ctx.sau(tP - .15, () => { const kb = ds[k]; if (!kb || kb.het) return; const d = L.dich ? ngucDich(L.dich) : kb.pos.clone().addScaledVector(h, 12); vetThang(kb.pos.clone(), kb.pos.clone().lerp(d, .6), BANG, .03, .15); });
    ctx.sau(tP, () => { const kb = ds[k]; if (!kb || kb.het) return; const d = L.dich ? ngucDich(L.dich) : kb.pos.clone().addScaledVector(h, 20); kb.phong(d.sub(kb.pos)); tiaLua(kb.pos, 6, TRANG_BANG, 3); rung(.1); });
  }
  // Hoá Cảnh — Vạn Lăng Băng Tiễn: mưa băng tiễn quanh mục tiêu
  if (L.tang >= 5) for (let k = 0; k < 8; k++) ctx.sau(.7 + k * .07, () => {
    const tam = L.dich ? L.dich.pos.clone() : nv.pos.clone().addScaledVector(h, 10);
    kiemRoi(L, tam.add(new V3(RR(-3, 3), 0, RR(-3, 3))).setY(0), 1.4, 12, false, .3);
  });
}
/** nhánh Băng Luân: N băng kiếm xoay quanh thân 2,5 s, chém kẻ trong 2,8 m (mỗi kẻ một nhát / 0,5 s) */
function bangLuan(L) {
  baoVong(chan(L), 2.8, .25, BANG);
  L.ctx.sau(.25, () => {
    songXung(nguc(L.nv), 2.6, BANG, .3, LEN, .1); rung(.15);
    const so = L.tang >= 3 ? 5 : 3, song = 2.5, g = new T.Group(), ds = [], lanCuoi = new Map(); let tQuet = 0;
    for (let j = 0; j < so; j++) { const x = taoKiemBang(); g.add(x.o); ds.push(x); }
    vfx.them(g, song, (dt, u, t) => {
      const tam = nguc(L.nv), k = DK.clamp(t / .15, 0, 1) * DK.clamp((song - t) / .2, 0, 1);
      for (let j = 0; j < so; j++) {
        const gg = t * 7 + j * Math.PI * 2 / so, d = new V3(Math.cos(gg), 0, Math.sin(gg));
        ds[j].ve(tam.clone().addScaledVector(d, 1.8).addScaledVector(LEN, Math.sin(gg * 2) * .15), new V3().crossVectors(LEN, d), .9, k);
      }
      tQuet += dt; if (tQuet < .1) return; tQuet = 0;
      for (const o of DK.dsBuNhin) {
        if (kcThan(o, tam) > 2.8 + BK_DICH) continue;
        const lc = lanCuoi.get(o); if (lc != null && t - lc < .5) continue; lanCuoi.set(o, t);
        danh(L, o, { manh: 30, pha: 5, lui: .8, diem: ngucDich(o) }); tiaLua(ngucDich(o), 8, TRANG_BANG, 5);
      }
    });
  });
}

// ------------------------------------------------------------------------- C · TOÁI BĂNG TRẢM
function toaiBang(ctx) {
  const L = lan(ctx, 2), nv = L.nv, h = L.h;
  const phaBang = L.Nhanh('pha_bang'), hanTram = L.Nhanh('han_tram');
  const R = 5, GOC = 120;
  const den = diemLuot(L, 5, 1.2);
  baoQuat(new V3(den.x, .06, den.z), h, R + .6, GOC, .38, BANG);
  ctx.phat('CHIEU_1', { moc: { xuat: () => vetVung(ctx) } });
  ctx.sau(.06, () => { quangNo(mui(L), .7, BANG, .25); if (L.tang >= 2) tiaLua(mui(L), 10, TRANG_BANG, 3); });
  ctx.sau(.2, () => diToi(nv, den, .16, 'o'));
  ctx.sau(.4, () => {
    const tam = nguc(nv), cg = Math.cos(GOC * .5 * D); let voSo = 0;
    for (const o of DK.dsBuNhin) {
      const dx = o.pos.x - tam.x, dz = o.pos.z - tam.z, dh = Math.hypot(dx, dz);
      if (dh > R + BK_DICH || o.pos.y > tam.y + 2.4 || o.pos.y + 1.8 < tam.y - 2.4) continue;
      if (dh > BK_DICH + .3 && (dx * h.x + dz * h.z) / dh < cg) continue;
      const dongTruoc = coDong(o);
      const kq = danh(L, o, { manh: 95, pha: 30, len: 0, lui: 3, phaBang: true, diem: ngucDich(o), huong: new V3(dx, 0, dz) });
      if (kq.vo) { voSo++; noBangVun(L, o, phaBang ? 4.2 : 2.8, phaBang ? 60 : 40); }
      else if (kq.trung && hanTram && !dongTruoc) ganCham(o, GIAY_CHAM, .5);
    }
    // vệt chém nằm ngang (Tiểu Thành: thêm lớp)
    trangTinh(tam.clone().addScaledVector(h, 1.6), h, 3.2 * KichTang(L.tang), TRANG_BANG, .45, false);
    if (L.tang >= 2) trangTinh(tam.clone().addScaledVector(h, 1.8), h, 3.6 * KichTang(L.tang), BANG, .5, false, .15);
    tiaLua(tam.clone().addScaledVector(h, 2), L.tang >= 2 ? 22 : 10, TRANG_BANG, 7);
    rung(voSo > 0 ? .6 : .4);
    // Đại Thành: ba trụ băng mọc dọc đường kiếm rồi vỡ
    if (L.tang >= 3) { const phai = phaiCua(h); for (let k = 0; k < 3; k++) truBang(nv.pos.clone().addScaledVector(h, 1.6 + k * 1.4).addScaledVector(phai, (k - 1) * 1.2).setY(0), 1.6 + k * .3, .9, k * .05); }
  });
}
/** vỡ băng lan: băng vụn trúng kẻ đứng gần; Hoá Cảnh: kẻ đóng băng gần đó vỡ theo (tối đa 4) */
function noBangVun(L, goc, r, manh) {
  const p = ngucDich(goc); let soVo = 0;
  for (const o of DK.dsBuNhin) {
    if (o === goc || kcThan(o, p) > r + BK_DICH) continue;
    if (L.tang >= 5 && soVo < 4 && coDong(o)) { soVo++; danh(L, o, { manh: manh * 1.5, pha: 10, phaBang: true, diem: ngucDich(o) }); }
    else danh(L, o, { manh, pha: 6, diem: ngucDich(o) });
  }
  songXung(p, r, TRANG_BANG, .3, LEN, .1);
}
/** trụ băng mọc lên rồi vỡ */
function truBang(p, cao, song, tre) {
  const g = new T.Group(), a = taoTinhThe(), b = taoTinhThe(), c = taoTinhThe(); g.add(a.o, b.o, c.o); g.visible = false; let vo = false;
  vfx.them(g, tre + song + .05, (dt, u, t) => {
    const uu = t - tre; if (uu < 0) return; g.visible = true;
    if (uu >= song) { if (!vo) { vo = true; tiaLua(p.clone().setY(p.y + cao * .5), 14, TRANG_BANG, 6); gachVo(p, 5, 5); } g.visible = false; return; }
    const hh = cao * DK.clamp(uu / .12, 0, 1), k = DK.clamp((song - uu) / .2, 0, 1);
    a.ve(p, LEN, hh, .5, k); b.ve(p.clone().add(new V3(.3, 0, .15)), new V3(.35, 1, .1), hh * .6, .3, k); c.ve(p.clone().add(new V3(-.25, 0, -.2)), new V3(-.3, 1, -.2), hh * .5, .28, k);
  });
}

// ------------------------------------------------------------------------- V · HÀN VỤ KIẾM VỰC
const NHIP_SUONG = .55;
function hanVu(ctx) {
  const L = lan(ctx, 3), nv = L.nv, h = L.h;
  const hanVuc = L.Nhanh('han_vuc'), vuKiem = L.Nhanh('vu_kiem');
  const R = 5.5 * (L.tang >= 3 ? 1.25 : 1) * (hanVuc ? 1.4 : vuKiem ? .8 : 1);
  const song = 4 + (hanVuc ? 1.5 : 0);
  let p = L.dich && L.dich.pos.distanceTo(nv.pos) < 18 * 1.3 ? L.dich.pos.clone() : nv.pos.clone().addScaledVector(h, 6); p.y = 0;
  baoVong(p.clone().setY(.06), R, .4, BANG);
  ctx.phat('CHIEU_2', { moc: { xuat: () => vetVung(ctx) } });
  ctx.sau(.1, () => quangNo(mui(L), .6, BANG, .3));
  ctx.sau(.42, () => {
    songXung(p.clone().setY(.1), R, BANG, .5, LEN, .16);
    quangNo(p.clone().setY(.4), 1.4, TRANG_BANG, .3);
    vungSuong(L, p, R, song, vuKiem, L.tang >= 5);
    rung(.25);
  });
}
/** vùng sương lạnh: nhịp .55 s sát thương nhẹ (Băng ⇒ tích Chậm ⇒ đông). Vụ Ẩn Kiếm: mỗi nhịp một băng kiếm rơi. Hoá Cảnh: đi theo người tung, kéo vào tâm. */
function vungSuong(L, tam0, R, song, vuKiem, theo) {
  const tam = tam0.clone(), g = new T.Group(); let tNhip = 0, tHat = 0;
  const tru = []; if (L.tang >= 3) for (let j = 0; j < 10; j++) { const x = taoTinhThe(); g.add(x.o); tru.push(x); }
  const luc = []; if (L.tang >= 4) for (let j = 0; j < 6; j++) { const m = new T.Mesh(HOP, new T.MeshBasicMaterial({ color: BANG, transparent: true, opacity: .55, blending: T.AdditiveBlending, depthWrite: false })); g.add(m); luc.push(m); }
  const q = new T.Quaternion();
  vfx.them(g, song + .4, (dt, u, t) => {
    if (theo) tam.lerp(new V3(L.nv.pos.x, 0, L.nv.pos.z), DK.clamp(dt * 3, 0, 1));
    const k = DK.clamp(t / .3, 0, 1) * DK.clamp((song + .4 - t) / .5, 0, 1), con = t < song;
    // sương: hạt trắng lam trôi chậm trong đĩa
    tHat += dt;
    while (tHat >= .03 && con) {
      tHat -= .03; const gg = RR(0, 6.28), rr = Math.sqrt(Math.random()) * R;
      const pp = tam.clone().add(new V3(Math.cos(gg) * rr, RR(.1, L.tang >= 3 ? 1.6 : 1), Math.sin(gg) * rr));
      hatBay(pp, new V3(RR(-.4, .4), RR(.1, .5), RR(-.4, .4)), SUONG, RR(.35, .8) * .45, 1.4);   // cỡ ×.45: hạt sương game là quầng mềm, khối voxel to thì che người
    }
    // Đại Thành: vòng trụ băng ở viền; Viên Mãn: trận lục giác dưới đất
    if (tru.length) {
      const cao = 1.6 * DK.clamp(t / .35, 0, 1) * (L.tang >= 4 ? 1.3 : 1);
      for (let j = 0; j < 10; j++) { const gg = j * Math.PI * 2 / 10 + .2; tru[j].ve(tam.clone().add(new V3(Math.cos(gg) * R, .05, Math.sin(gg) * R)), new V3(-Math.cos(gg) * .25, 1, -Math.sin(gg) * .25), cao * (j % 2 === 0 ? 1 : .7), .32, k); }
    }
    for (let j = 0; j < luc.length; j++) {
      const g0 = j * Math.PI / 3 + t * .4, g1 = g0 + Math.PI / 3;
      const a = tam.clone().add(new V3(Math.cos(g0) * R * .8, .08, Math.sin(g0) * R * .8)), b = tam.clone().add(new V3(Math.cos(g1) * R * .8, .08, Math.sin(g1) * R * .8));
      const m = luc[j]; m.position.lerpVectors(a, b, .5); m.quaternion.copy(qNhin(new V3().subVectors(b, a), LEN, q)); m.scale.set(.08, .02, a.distanceTo(b)); m.material.opacity = .55 * k;
    }
    if (!con) return;
    tNhip += dt; if (tNhip < NHIP_SUONG) return; tNhip -= NHIP_SUONG;
    songXung(tam.clone().setY(.12), R, BANG, .4, LEN, .08);
    let gan = null, kcGan = 1e9;
    for (const o of DK.dsBuNhin) {
      const d = new V3().subVectors(o.pos, tam); d.y = 0;
      if (d.length() > R + BK_DICH) continue;
      danh(L, o, { manh: 11, pha: 3, diem: ngucDich(o) });
      if (theo) { const keo = d.clone().normalize().multiplyScalar(-.6); DK.lap((dt2, tl) => { const k = Math.exp(-tl * 8); o.pos.addScaledVector(keo, 8 * k * dt2); return tl < .5; }); }   // Hoá Cảnh: kéo nhẹ vào tâm (Huong(-d), lui .6)
      if (d.length() < kcGan) { kcGan = d.length(); gan = o; }
    }
    if (vuKiem && gan) kiemRoi(L, gan.pos.clone().setY(0), 1.2, 20, true, .22);
  });
}

// ------------------------------------------------------------------------- R · THÁI HUYỀN BĂNG PHONG
// 2026-11-11 (C#) — clip riêng th_chieu_4: tụ lực + lao 3 m + chém S1N, bỏ NAP/NAPX của CHIEU_4 web, về THU.
DK.clip('th_chieu_4', '0 THU; .2 TU_LUC io; .9 TU_LUC h; .96 S1N s; 1.45 S1N h; 2 THU io', '0 0 0; .9 0 0; .94 0 0; 1.06 0 3', 'niem .2, xuat .96, huy 1.7', { tron: .06 });
function bangPhong(ctx) {
  const L = lan(ctx, 4), nv = L.nv, h = L.h;
  const vanLy = L.Nhanh('van_ly'), nhatKiem = L.Nhanh('nhat_kiem');
  const R = 9 * (L.tang >= 3 ? 1.15 : 1) * (vanLy ? 1.35 : nhatKiem ? .8 : 1);
  baoVong(chan(L), R, .82, BANG);
  ctx.phat('th_chieu_4', { moc: { xuat: () => vetVung(ctx, .14) } });
  if (L.tang >= 4) vfx.troi(BANG, 3.4, L.tang >= 5 ? .5 : .35);      // trời ngả lam lạnh (VFXThamSoChay.TroiNhe)
  // tụ kiếm ý: bông tuyết xoáy về mũi kiếm (moiRieng tới .82)
  let tTuyet = 0;
  DK.lap((dt, t) => {
    if (t >= .82) return false;
    tTuyet += dt * 34;
    while (tTuyet >= 1) { tTuyet -= 1; const gg = t * 13, m = mui(L); const q = m.clone().add(new V3(Math.cos(gg) * 2.2, Math.sin(gg * .6) * .9 + .4, Math.sin(gg) * 2.2)); hatBay(q, new V3().subVectors(m, q).multiplyScalar(2.2), TRANG_BANG, .12, .4); }
  });
  [.25, .5, .72].forEach((t, k) => ctx.sau(t, () => quangNo(mui(L), .5 + k * .35, BANG, .28)));
  const dongBang = [];
  // .85 — cắm kiếm: sóng băng lan, đóng băng cả vùng
  ctx.sau(.85, () => {
    const tam = chan(L);
    for (let k = 0; k < 3; k++) songXung(tam.clone().setY(tam.y + .1 + k * .05), R * (.55 + k * .25), k === 2 ? TRANG_BANG : BANG, .5 + k * .12, LEN, .18);
    quangNo(tam.clone().setY(tam.y + .5), 2.2, TRANG_BANG, .35);
    rungGai(tam.clone().setY(0), R, L.tang, .72 + (L.tang >= 5 ? .5 : 0));
    const tamDanh = tam.clone().setY(tam.y + .8);
    for (const o of DK.dsBuNhin) {
      if (kcThan(o, tamDanh) > R + BK_DICH) continue;
      danh(L, o, { manh: 60, pha: 10, diem: ngucDich(o) });
      // tích đầy một lần ⇒ Đóng băng ngay (đang miễn thì chỉ Chậm)
      if (ganCham(o, GIAY_CHAM, 1)) DK.chuNoi('Đóng băng', o.diem('dau').add(new V3(0, .9, 0)), '#bfe9ff');
      if (coDong(o)) dongBang.push(o);
    }
    if (dongBang.length) longBang(dongBang, 1.1);
    rung(.55);
  });
  // 1.55 — một nhát chém vòng vỡ toàn bộ (sau cú lao 3 m của clip ⇒ tâm đã dời)
  ctx.sau(1.55, () => {
    const tam = nguc(nv); let vo = 0;
    for (const o of DK.dsBuNhin) {
      if (kcThan(o, tam) > R * 1.05 + BK_DICH) continue;
      const hh = new V3().subVectors(o.pos, nv.pos).setY(0);
      const kq = danh(L, o, { manh: 130, pha: 40, len: 2.5, lui: 4, phaBang: true, diem: ngucDich(o), huong: hh, giapVo: nhatKiem });
      if (kq.vo) vo++;
    }
    // vầng trăng băng quét 360°: 8 (Đại Thành 12) vệt chém tĩnh quanh thân + vòng trắng lớn
    const soVet = L.tang >= 3 ? 12 : 8, r = R * .55;
    for (let k = 0; k < soVet; k++) {
      const d = xoayY(h, k * 360 / soVet), tiep = new V3().crossVectors(LEN, d);
      trangTinh(tam.clone().addScaledVector(d, r), tiep, r * .75 * KichTang(L.tang), k % 2 === 0 ? TRANG_BANG : BANG, .55, false, .1);
    }
    songXung(tam, R * 1.1, TRANG_BANG, .5, LEN, .22);
    noLon(tam, 2.4 * KichTang(L.tang), BANG);
    tiaLua(tam, 40, TRANG_BANG, 12);
    gachVo(nv.pos.clone(), 18, 9);
    rung(vo > 0 ? 1.1 : .8);
  });
  // Hoá Cảnh — Băng Phong Vạn Lý: băng vụn mưa xuống lần hai
  if (L.tang >= 5) for (let k = 0; k < 10; k++) ctx.sau(1.75 + k * .05, () => { const gg = RR(0, 6.28), rr = RR(1.5, R); kiemRoi(L, nv.pos.clone().add(new V3(Math.cos(gg) * rr, 0, Math.sin(gg) * rr)).setY(0), 2, 30, true, .28); });
}
/** rừng gai băng lan từ tâm ra viền rồi đứng tới lúc chém (Đại Thành dày + cao hơn) */
function rungGai(tam, R, tang, song) {
  const so = tang >= 3 ? 34 : 20, g = new T.Group(), ds = [];
  for (let i = 0; i < so; i++) {
    const gg = RR(0, 6.28), rr = DK.lerp(1.2, R, Math.sqrt(Math.random()));
    const x = taoTinhThe(); g.add(x.o); x.o.visible = false;
    ds.push({ x, goc: tam.clone().add(new V3(Math.cos(gg) * rr, 0, Math.sin(gg) * rr)), cao: RR(.6, tang >= 3 ? 2.2 : 1.5) * (tang >= 4 ? 1.25 : 1) });
  }
  vfx.them(g, song + .12, (dt, u, t) => {
    const lanR = DK.clamp(t / .3, 0, 1) * R, k = DK.clamp((song + .12 - t) / .15, 0, 1);
    for (const s of ds) {
      const d = new V3().subVectors(s.goc, tam); d.y = 0; const kc = d.length();
      if (kc > lanR) { s.x.o.visible = false; continue; }
      const moc = DK.clamp((lanR - kc) / 1.2, 0, 1);
      s.x.ve(s.goc, (d.lengthSq() > 1e-4 ? d.normalize().multiplyScalar(.35) : new V3()).add(LEN), s.cao * moc, .28, k);
    }
  }, () => { for (let i = 0; i < ds.length; i += 2) tiaLua(ds[i].goc.clone().setY(ds[i].cao * .5), 6, TRANG_BANG, 6); });
}
/** lồng băng quanh các đích vừa bị đông, giữ tới lúc nhát chém (hoặc hết đông) */
function longBang(ds, song) {
  const g = new T.Group(), tinh = ds.map((o, i) => { const a = []; for (let j = 0; j < 5; j++) { const x = taoTinhThe(); g.add(x.o); a.push(x); } return a; });
  vfx.them(g, song, (dt, u, t) => {
    const k = DK.clamp(t / .1, 0, 1);
    ds.forEach((o, i) => {
      const dong = coDong(o);
      for (let j = 0; j < 5; j++) {
        if (!dong) { tinh[i][j].o.visible = false; continue; }
        const gg = j * Math.PI * 2 / 5 + i, rb = BK_DICH + .25;
        tinh[i][j].ve(o.pos.clone().add(new V3(Math.cos(gg) * rb, 0, Math.sin(gg) * rb)), new V3(-Math.cos(gg) * .2, 1, -Math.sin(gg) * .2), 1.8 * 1.05 * (j % 2 === 0 ? 1 : .75), .3, k);
      }
    });
  });
}

// ============================================================================ ĐĂNG KÝ
DK.dangKyBo(MA, {
  nguon: 'CongPhap/Bo/ThaiHuyen.cs (+ ChieuDaoThuong.cs KichBanVuKhiWeb, ChieuVe.cs, HeTrangThai.cs, KhacChe.cs, VFXThamSoThuocTinh.cs)',
  ghiChu: 'Khác biệt code ↔ JSON: (1) mốc đòn C# sớm hơn mốc "xuat" của clip web: Z bắn .28/.52 khi clip CHIEU_0 còn ngắm (xuat .73); X phóng .36+ (xuat .96); C chém .4 (xuat .83); V toả vùng .42 (xuat .89); R cắm kiếm .85 lúc còn TU_LUC, chém vòng 1.55 lúc đã về THU — kiếm khí/vùng ra trước nhát vung. ' +
    '(2) X Đại Thành: JSON nói "xoay một vòng sau lưng rồi mới phóng" — code chỉ xếp 5 kiếm cung rộng hơn, không xoay; Viên Mãn JSON "dài gấp đôi" — code ×1,4×KichTang(1,25)=×1,75. ' +
    '(3) Z tầng 1: JSON trang_thai rỗng nhưng vẫn Ướt 5 s do thuộc tính Thuỷ. (4) R: sóng băng tâm ở chỗ đứng, clip lao 3 m (.94–1.06) nên nhát chém vòng tâm đã dời 3 m. ' +
    '(5) JSON tầng 3 ghi "Vùng ×1,5" chung — code: Z/X/C ×1,12 kích thước, V ×1,25, R ×1,15. (6) Bộ phẩm Địa: người chơi trần Viên Mãn, Hoá Cảnh chỉ bot / khi phẩm cho phép. (7) Nhánh chỉ có hiệu lực từ Đại Thành (tầng < 3 bỏ qua nhánh như game). ' +
    'Gần đúng: tầng ≥ 2 game còn chồng lớp VFX tham số chung (VFXThamSo: kiem_khi/dai/tran/vong) — chưa dựng; hào quang trạng thái theo VFXThamSoThuocTinh dựng bằng hộp/hạt; vệt chém theo màu kiếm thêm ở mốc xuat; Hoá Cảnh V kéo vào tâm .6 m tự làm (DK.trung chỉ đẩy ra xa người tung).',
  tuThe: [],
  chieu: {
    th_thuy_nguyet: thuyNguyet,
    th_han_bang: hanBang,
    th_toai_bang: toaiBang,
    th_han_vu: hanVu,
    th_bang_phong: bangPhong,
  },
  /** tự kiểm: đặt trạng thái sẵn cho bù nhìn (vd &truoc=DK.BO.kiem_cp3.thu.dong(DK.dsBuNhin[0])) */
  thu: {
    dong: b => { const s = tt(b); s.dong = DK.now + 5; s.tich = 0; },
    uot: b => { tt(b).uot = DK.now + 8; },
    trangThai: b => b.trangThai.th,
  },
});
})();
