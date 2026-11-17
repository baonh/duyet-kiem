"use strict";
// ============================================================================
// 2026-11-15 — bo_thai_huyen_nc.js — BẢN NÂNG CẤP (đề xuất) THÁI HUYỀN KIẾM Ý (kiem_cp3, Thuỷ → Băng).
//   Người dùng chê bản game "đơn sơ, động tác đơn giản, viên mãn không tác động địa hình, kiếm phóng ra không ra kiếm".
//   Bản này: combo 6 nhát riêng (trầm, dứt khoát, để lại sương giá), lộn né để lại băng ảnh, 5 chiêu × 5 tầng + nhánh.
//   Địa hình: mặt đất đóng băng (tô màu + lớp gạch băng voxel tự dựng), gai băng trồi, cỏ đóng sương rồi vỡ,
//   kiếm băng thật (vfx.phiKiem) rơi như mưa, khối băng phong kẻ địch, trời đổi lạnh + cực quang ở chiêu cuối.
//   Sửa lỗi bản game: (1) đòn trúng ra sớm hơn nhát vung 0,3–0,6 s → clip riêng khớp đúng mốc C#;
//   (2) R tâm sóng lệch 3 m (clip lao 3 m) → cắm kiếm và chém vòng tại cùng một tâm; (3) X Đại Thành không xoay → kiếm xoay một vòng rồi mới phóng.
//   Luật trạng thái (Ướt / Chậm tích / Đóng băng / Vỡ băng / Giáp vỡ) chép theo bo_thai_huyen.js, lưu chung b.trangThai.th
//   ⇒ hào quang + giải đông của bản game vẫn chạy.
// ============================================================================
(function () {
const DK = window.DK; if (!DK || !DK.dangKyBoNC || !DK.dia) return;
const T = DK.T, V3 = DK.V3, vfx = DK.vfx, dia = DK.dia, D = DK.D;
const MA = 'kiem_cp3';

// ---------------------------------------------------------------- màu (một màu chủ đạo mỗi chiêu)
const NUOC = new T.Color(.3, .68, 1), BANG = new T.Color(.6, .87, 1), TRANG_BANG = new T.Color(.86, .96, 1);
const SUONG = new T.Color(.8, .9, 1), NUOC_DAM = new T.Color(.12, .45, .95);
const TROI_LANH = new T.Color(0x4d6f96), TROI_DEM = new T.Color(0x1d3150);
const HOP = new T.BoxGeometry(1, 1, 1); HOP.giu = true;
const HOP_DAY = new T.BoxGeometry(1, 1, 1).translate(0, .5, 0); HOP_DAY.giu = true;
const GAI = new T.ConeGeometry(.5, 1, 4, 1).translate(0, .5, 0); GAI.giu = true;
const giu = m => { m.giu = true; return m; };
const MAT_BANG = giu(new T.MeshStandardMaterial({ color: 0xcdeeff, roughness: .08, metalness: .2, transparent: true, opacity: .82, emissive: 0x3c7cb0, emissiveIntensity: .5, flatShading: true }));
const MAT_VIEN = giu(new T.MeshBasicMaterial({ color: BANG.clone().multiplyScalar(.55), transparent: true, opacity: .4, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }));
const MAT_DAT = giu(new T.MeshStandardMaterial({ color: 0xffffff, roughness: .05, metalness: .35, transparent: true, opacity: .62, emissive: 0x1d4a78, emissiveIntensity: .45, flatShading: true }));
const MAT_SUONG_CO = giu(new T.MeshBasicMaterial({ color: new T.Color(.85, .95, 1).multiplyScalar(1.3), toneMapped: false }));

// ---------------------------------------------------------------- tiện ích
const RR = (a, b) => a + Math.random() * (b - a);
const LEN = new V3(0, 1, 0);
const phaiCua = h => new V3(-h.z, 0, h.x);
const nguc = nv => new V3(nv.pos.x, nv.pos.y + 1.25, nv.pos.z);
const ngucDich = b => new V3(b.pos.x, b.pos.y + 1.25, b.pos.z);
const xoayY = (v, doDo) => { const a = doDo * D, c = Math.cos(a), s = Math.sin(a); return new V3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c); };
const datY = (p, y) => new V3(p.x, (y || 0) + dia.cao(p.x, p.z), p.z);
function kcThan(b, p) { const y = DK.clamp(p.y, b.pos.y + .2, b.pos.y + 1.7); return Math.hypot(p.x - b.pos.x, p.y - y, p.z - b.pos.z); }
function kcDoan(p, a, b) { const ab = new V3().subVectors(b, a), L2 = ab.lengthSq(); const u = L2 > 1e-8 ? DK.clamp(new V3().subVectors(p, a).dot(ab) / L2, 0, 1) : 0; return a.clone().addScaledVector(ab, u).distanceTo(p); }
const _m = new T.Matrix4(), _x = new V3(), _y = new V3(), _z = new V3();
function qNhin(f, up, out) {
  _z.copy(f).normalize(); _y.copy(up).addScaledVector(_z, -up.dot(_z)); if (_y.lengthSq() < 1e-8) _y.set(0, 0, 1).addScaledVector(_z, -_z.z); _y.normalize();
  _x.crossVectors(_y, _z); _m.makeBasis(_x, _y, _z); return (out || new T.Quaternion()).setFromRotationMatrix(_m);
}
const rung = (k, s) => DK.rung(k, s || .25);
const mauBao = c => new T.Color(c).multiplyScalar(.5);
const baoDai = (a, b, rong, tg, mau) => vfx.dai(a, b, { rong, song: tg + .08, mau: mauBao(mau) });
const baoVong = (p, r, tg, mau) => vfx.vung(p, { r, song: tg + .08, mau: mauBao(mau) });
function baoQuat(p, h, r, gocDo, tg, mau) {
  mau = mauBao(mau);
  const g = new T.Group(); g.position.set(p.x, .03, p.z); g.rotation.y = Math.atan2(h.x, h.z);
  const goc = gocDo * D, mk = (rr, op, cong) => { const m = new T.Mesh(new T.CircleGeometry(rr, 40, -Math.PI / 2 - goc / 2, goc), cong ? vfx.matCong(mau, op) : vfx.matThuong(mau, op)); m.rotation.x = -Math.PI / 2; g.add(m); return m; };
  mk(r, .16, false); const lap = mk(r, .4, true);
  return vfx.them(g, tg + .08, (dt, u, t) => { lap.scale.setScalar(DK.clamp(t / Math.max(.01, tg), .01, 1)); });
}
/** bụi voxel toả (hạt cộng sáng) */
const tia = (p, n, mau, toc = 6, co = .1, song = .4) => vfx.hat(p, { so: n, mau, toc, co, song, trongLuc: 9, can: 2 });
/** mảnh băng đặc (khối không cộng sáng, nảy trên đất) */
const manhBang = (p, n, toc = 6, co = .2) => vfx.hat(p, { so: n, mau: 0xa9d6f2, toc, huong: LEN, loe: .9, co, song: 1, trongLuc: 20, can: .4, to: true, lech: .3 });
const chop = (p, co, mau, song) => vfx.chop(p, { co, mau, song: song || .2 });

// ============================================================================ TRẠNG THÁI (chép luật bo_thai_huyen.js)
const GIAY_UOT = 5, GIAY_CHAM = 3, TICH_BANG = .34, GIAY_DONG_BANG = 1.5, MIEN_DONG_BANG = 3, GIAY_GIAP_VO = 4, BK_DICH = .35, BK_NGUOI = .4;
function tt(b) { return b.trangThai.th || (b.trangThai.th = { uot: 0, cham: 0, tich: 0, dong: 0, mien: 0, giapVo: 0 }); }
const coDong = b => { const s = b.trangThai.th; return !!s && s.dong > DK.now; };
const coUot = b => { const s = b.trangThai.th; return !!s && s.uot > DK.now; };
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
// bản game không nạp thì tự giảm tích + giải đông
if (!DK.BO[MA]) DK.moiKhung(dt => { for (const b of DK.dsBuNhin) { const s = b.trangThai && b.trangThai.th; if (!s) continue; s.tich = Math.max(0, s.tich - .25 * dt); if (s.dong > 0 && DK.now >= s.dong) { s.dong = 0; s.mien = DK.now + MIEN_DONG_BANG; if (b.hd) b.hd.tocDo = 1; } } });

// ---------------------------------------------------------------- khối băng phong kẻ bị đông (thay 6 tinh thể của bản game)
const KHOI = new Map();
function khoiBang(b) {
  if (KHOI.has(b) || !DK.NC) return;
  const g = new T.Group();
  const ds = [[0, 0, 0, 1.15, 2.15, 1.05, 0], [.5, 0, .3, .6, 1.2, .6, .5], [-.55, 0, -.2, .55, .95, .6, -.4], [.15, 1.6, -.1, .7, .85, .65, .7], [-.35, 1.2, .42, .5, 1, .5, .3], [.42, .9, -.42, .45, .8, .45, -.6]];
  for (const d of ds) {
    const m = new T.Mesh(HOP_DAY, MAT_BANG); m.position.set(d[0], d[1], d[2]); m.scale.set(d[3], d[4], d[5]); m.rotation.set(d[6] * .25, d[6], d[6] * .2); g.add(m);
    const v = new T.Mesh(HOP_DAY, MAT_VIEN); v.position.copy(m.position); v.scale.copy(m.scale).multiplyScalar(1.06); v.rotation.copy(m.rotation); g.add(v);
  }
  const x = vfx.them(g, 30, (dt, u, t) => {
    if (!coDong(b)) { KHOI.delete(b); tia(ngucDich(b), 10, TRANG_BANG, 2, .08, .6); return false; }
    g.position.copy(b.pos); g.rotation.y = b.yaw; g.scale.set(1, DK.ease('o', Math.min(1, t / .14)), 1);
  });
  KHOI.set(b, { x, g });
  manhBang(b.pos.clone().setY(.2), 6, 3, .14);
}
function voKhoi(b, p) {
  const k = KHOI.get(b); if (!k) return false;
  KHOI.delete(b); k.x.t = k.x.song;
  manhBang(p.clone().setY(p.y - .4), 18, 7, .18); tia(p, 22, TRANG_BANG, 9, .1, .45);
  return true;
}
DK.moiKhung(() => { for (const [b] of KHOI) if (b._thAura) { b._thAura.bang.visible = false; b._thAura.quang.material.opacity = 0; } });
DK.nghe('datLai', () => KHOI.clear());

// ============================================================================ ĐÒN TRÚNG
/** ngữ cảnh một lần ra chiêu */
function lan(ctx, i, thuoc) {
  const ch = ctx.ch, tang = ctx.tang || 1;
  const nhanh = tang >= 3 ? ctx.nhanh : null;          // nhánh chỉ hiệu lực từ Đại Thành (như game)
  const td = ch && ch.tang && ch.tang[tang - 1] || {}, nh = nhanh && ch && ch.nhanh ? ch.nhanh.find(n => n.ma === nhanh) : null;
  const heSo = (td.he_so || 1) * (nh && nh.so_mod && nh.so_mod.he_so > 0 ? nh.so_mod.he_so : 1);
  const L = { nv: ctx.nv, dich: ctx.dich, i, tang, nhanh, heSo, thuoc: thuoc || 'bang', ttTang: td.trang_thai || null, ctx, vc: 0, Nhanh: m => nhanh === m };
  L.h = huongNgang(L);
  return L;
}
function huongNgang(L) { if (L.dich) { const d = new V3().subVectors(L.dich.pos, L.nv.pos); d.y = 0; if (d.lengthSq() > 1e-6) return d.normalize(); } return L.nv.toi(); }
function huongNgam(L) { if (L.dich) { const d = new V3().subVectors(ngucDich(L.dich), nguc(L.nv)); if (L.nv.datDat) d.y = 0; if (d.lengthSq() > 1e-6) return d.normalize(); } return L.nv.toi(); }
/** khung va chạm — tối đa 2 lần / chiêu */
function vaCham(L, kieu, mau) { if (L.vc >= 2) return; L.vc++; vfx.vaCham({ kieu: kieu || 'dao', mau: mau || BANG }); }
/** một đòn trúng b. op: { manh, lui, len, phaBang, diem, tich, giapVo } → { trung, vo } */
function danh(L, b, op) {
  if (!b) return { trung: false, vo: false };
  const s = tt(b), dongBang = coDong(b), uot = coUot(b), thuy = L.thuoc === 'thuy';
  const nang = !!op.phaBang && dongBang;
  let st = (op.manh || 0) * L.heSo * (nang ? 2 : 1), nhan = null;
  if (nang) { s.dong = 0; s.mien = DK.now + MIEN_DONG_BANG; if (b.hd) b.hd.tocDo = 1; nhan = 'Vỡ băng ×2'; }
  if (s.giapVo > DK.now) st *= 1.2;
  let vuaDong = false;
  if (thuy) { gan(b, 'uot', GIAY_UOT, 1); nhan = nhan || 'Ướt'; }
  else vuaDong = ganCham(b, GIAY_CHAM, op.tich || TICH_BANG) || vuaDong;
  if (L.ttTang && L.ttTang.ma && L.ttTang.giay > 0) vuaDong = gan(b, L.ttTang.ma, L.ttTang.giay, L.ttTang.manh) || vuaDong;
  if (!nang && uot && !thuy && !coDong(b)) { vuaDong = ganCham(b, GIAY_CHAM, op.tich || TICH_BANG) || vuaDong; tia(op.diem || ngucDich(b), 8, TRANG_BANG, 3); }
  if (!nhan) nhan = vuaDong ? 'Đóng băng' : coDong(b) ? null : (!thuy ? 'Chậm ' + Math.round(tt(b).tich * 100) + '%' : null);
  if (op.giapVo) { gan(b, 'giap_vo', GIAY_GIAP_VO, .2); nhan = (nhan ? nhan + ' · ' : '') + 'Giáp vỡ'; }
  DK.trung(b, { st, nguon: L.nv, day: op.lui || 0, hat: op.len >= 3 ? op.len * .3 : 0, mau: thuy ? NUOC : BANG, trangThai: nhan || undefined });
  if (coDong(b)) { if (b.hd) b.hd.tocDo = 0; khoiBang(b); }
  if (nang) noVoBang(L, b, op.diem || ngucDich(b));
  return { trung: true, vo: nang };
}
/** VỠ BĂNG: khối băng nổ tung + khung va chạm; Viên Mãn: hoa sen gai băng */
function noVoBang(L, b, p) {
  voKhoi(b, p);
  chop(p, 3, TRANG_BANG, .25); vfx.vong(datY(p, .05), { bk0: .3, bk1: 3, mau: BANG, song: .4, day: .35 });
  vaCham(L, 'dao', BANG);
  if (L.tang >= 4) { const q = datY(b.pos); for (let k = 0; k < 7; k++) { const d = xoayY(new V3(0, 0, 1), k * 360 / 7 + RR(-8, 8)); gaiBang(q.clone().addScaledVector(d, .6), { huong: d.clone().multiplyScalar(.7).add(LEN), cao: RR(1.3, 1.9), rong: .38, song: .55, tre: k * .015 }); } dia.nut(q, { r: 2.4, nhanh: 7, mau: BANG, song: 2.5 }); }
  rung(.35);
}

// ============================================================================ KHỐI BĂNG / ĐẤT BĂNG
/** gai băng (khối tháp 4 cạnh) mọc từ p theo huong, đứng `song` rồi vỡ */
function gaiBang(p, op = {}) {
  const cao = op.cao || 1.2, rong = op.rong || .3, song = op.song || .8, tre = op.tre || 0;
  const g = new T.Group(); g.position.copy(p); g.visible = false;
  const m = new T.Mesh(op.hop ? HOP_DAY : GAI, MAT_BANG), v = new T.Mesh(op.hop ? HOP_DAY : GAI, MAT_VIEN); v.scale.setScalar(1.12); m.castShadow = true;
  const q = new T.Group(); q.add(m, v); g.add(q);
  const h = (op.huong || LEN).clone().normalize(); g.quaternion.setFromUnitVectors(LEN, h); q.rotation.y = RR(0, 3);
  let vo = false;
  return vfx.them(g, tre + song + .05, (dt, u, t) => {
    const uu = t - tre; if (uu < 0) return; g.visible = true;
    if (!g.moc) { g.moc = true; manhBang(p, 2, 2, .1); }
    const k = DK.ease('o', Math.min(1, uu / (op.moc || .09)));
    q.scale.set(rong * (.6 + .4 * k), cao * k, rong * (.6 + .4 * k));
    if (uu >= song - .02 && !vo) { vo = true; if (op.vo !== false) { const top = p.clone().addScaledVector(h, cao * .5); manhBang(top, Math.round(1 + cao * 1.5), 3 + cao, .07 + rong * .15); tia(top, 3, TRANG_BANG, 4, .07, .3); } }
  });
}
/** trụ băng (cụm 3 khối) */
function truBang(p, cao, song, tre) {
  gaiBang(p, { cao, rong: .55, song, tre, hop: true });
  gaiBang(p.clone().add(new V3(.32, 0, .2)), { huong: new V3(.35, 1, .1), cao: cao * .65, rong: .34, song, tre: tre + .03 });
  gaiBang(p.clone().add(new V3(-.28, 0, -.2)), { huong: new V3(-.3, 1, -.2), cao: cao * .5, rong: .3, song, tre: tre + .05 });
  gaiBang(p.clone().add(new V3(0, cao * .98, 0)), { cao: cao * .3, rong: .5, song, tre: tre + .06, vo: false });
}
/**
 * mặt đất đóng băng: tô màu đất (dia.chay "âm" ⇒ sáng + ngả lam) + lớp gạch băng voxel lan từ tâm.
 * op: { lan (s lan hết r), song, o (cỡ gạch), cao (dày), goc (độ — chỉ hình quạt), huong, co (cỏ đóng sương), bam () → tâm mới (đi theo) }
 * trả { vo() (vỡ băng: gạch văng, cỏ gãy), x }
 */
function bangDat(p0, r, op = {}) {
  const O = op.o || .6, lan = op.lan != null ? op.lan : .3, song = op.song || 4, cao = op.cao || .09;
  const tam = p0.clone(); tam.y = 0;
  const h = op.huong ? op.huong.clone().setY(0).normalize() : null, cg = op.goc ? Math.cos(op.goc * .5 * D) : -2;
  const ds = [];
  for (let x = -r; x <= r; x += O) for (let z = -r; z <= r; z += O) {
    const px = x + RR(-.12, .12), pz = z + RR(-.12, .12), d = Math.hypot(px, pz);
    if (d > r * RR(.88, 1)) continue;
    if (h && d > .5 && (px * h.x + pz * h.z) / d < cg) continue;
    ds.push({ x: px, z: pz, d, h: cao * RR(.4, 1.3) * (1 - d / r * .4), s: O * RR(.8, 1.02), ry: RR(-.25, .25) });
  }
  if (!ds.length) return { vo() { }, x: null };
  const im = new T.InstancedMesh(HOP, MAT_DAT, ds.length); im.instanceMatrix.setUsage(T.DynamicDrawUsage); im.frustumCulled = false; im.receiveShadow = true;
  const c = new T.Color();
  ds.forEach((s, i) => { c.copy(BANG).lerp(new T.Color(0x7fb8e6), RR(0, .8)); if (Math.random() < .2) c.lerp(TRANG_BANG, .7); im.setColorAt(i, c); });
  // cỏ đóng sương: kim băng đứng (gần đúng cỏ — cỏ thật của lõi không đổi màu được)
  let kim = null, dsK = [];
  if (op.co) {
    const n = Math.min(900, Math.round(r * r * 5));
    for (let i = 0; i < n; i++) { const a = RR(0, 6.28), d = Math.sqrt(Math.random()) * r; const x = Math.cos(a) * d, z = Math.sin(a) * d; if (h && d > .5 && (x * h.x + z * h.z) / d < cg) continue; const wx = tam.x + x, wz = tam.z + z, dg = Math.hypot(wx, wz); if (dg < 2.6 || dg > 24) continue; dsK.push({ x, z, d, h: RR(.16, .42), nx: RR(-.3, .3), nz: RR(-.3, .3) }); }
    if (dsK.length) { kim = new T.InstancedMesh(HOP_DAY, MAT_SUONG_CO, dsK.length); kim.frustumCulled = false; }
  }
  const g = new T.Group(); g.add(im); if (kim) g.add(kim);
  const q = new T.Quaternion(), e = new T.Euler(), sc = new V3(), pp = new V3();
  // tô màu đất: hệ số âm ⇒ đất sáng lên; "màu nghịch" cam bị trừ ⇒ ngả lam (dia.chay chỉ có làm tối + cộng màu)
  dia.chay(tam, r * 1.05, { mau: 0xff8a40, manh: -.28, giu: song + 1 });
  let tChay = 0, daVo = false, tVo = 0;
  const ve = (t) => {
    if (op.bam) { const b = op.bam(); tam.x = b.x; tam.z = b.z; }
    const R = lan > 0 ? Math.min(r + 1, t / lan * (r + 1)) : r + 1, ket = t > song ? DK.clamp((t - song) / .5, 0, 1) : 0;
    ds.forEach((s, i) => {
      const k = DK.clamp((R - s.d) / .9, 0, 1) * (1 - ket);
      const wx = tam.x + s.x, wz = tam.z + s.z, hh = Math.max(.001, s.h * k);
      pp.set(wx, dia.cao(wx, wz) + hh * .5 - .015, wz); q.setFromEuler(e.set(0, s.ry, 0)); sc.set(s.s * (k > 0 ? 1 : .001), hh, s.s * (k > 0 ? 1 : .001));
      im.setMatrixAt(i, _m.compose(pp, q, sc));
    });
    im.instanceMatrix.needsUpdate = true;
    if (kim) {
      dsK.forEach((s, i) => {
        const k = DK.clamp((R - s.d) / .9, 0, 1) * (1 - ket); const wx = tam.x + s.x, wz = tam.z + s.z;
        pp.set(wx, dia.cao(wx, wz), wz); q.setFromEuler(e.set(s.nx, 0, s.nz)); sc.set(.045 * (k > 0 ? 1 : 0), Math.max(.001, s.h * k), .045 * (k > 0 ? 1 : 0));
        kim.setMatrixAt(i, _m.compose(pp, q, sc));
      });
      kim.instanceMatrix.needsUpdate = true;
    }
  };
  ve(0);
  const x = vfx.them(g, song + .55, (dt, u, t) => {
    if (daVo) { tVo += dt; return tVo < .05; }
    if (op.bam) { tChay += dt; if (tChay > .35) { tChay = 0; dia.chay(tam, r, { mau: 0xff8a40, manh: -.3, giu: 1.5 }); } }
    ve(t);
  });
  return {
    x, tam,
    /** vỡ băng: gạch hoá mảnh văng, kim sương gãy, cỏ thật bị cắt */
    vo(manh = 1) {
      if (daVo) return; daVo = true; g.visible = false;
      for (let i = 0; i < ds.length; i += Math.max(1, Math.round(ds.length / 40))) { const s = ds[i]; manhBang(new V3(tam.x + s.x, .12, tam.z + s.z), 1, 4 + manh * 3 * (1 - s.d / r), .08 + s.s * .1); }
      for (let i = 0; i < ds.length; i += Math.max(1, Math.round(ds.length / 60))) { const s = ds[i]; tia(new V3(tam.x + s.x, .15, tam.z + s.z), 2, TRANG_BANG, 3 + manh * 2, .07, .4); }
      for (let i = 0; i < dsK.length; i += 6) { const s = dsK[i]; vfx.hat(new V3(tam.x + s.x, s.h * .6, tam.z + s.z), { so: 1, mau: SUONG, toc: 2.5, co: .06, song: .5, trongLuc: 8 }); }
      if (op.co) catCo(tam, r, h, cg);
    },
  };
}
/** cắt cỏ thật trong đĩa (hoặc quạt) — "cỏ đóng băng rồi vỡ" */
function catCo(tam, r, h, cg) {
  for (let z = -r; z <= r; z += .7) {
    const w = Math.sqrt(Math.max(0, r * r - z * z));
    if (!h) { dia.cat(new V3(tam.x - w, 0, tam.z + z), new V3(tam.x + w, 0, tam.z + z), .45); continue; }
    // quạt: cắt theo các tia
  }
  if (h) for (let a = -60; a <= 60; a += 8) { const d = xoayY(h, a); dia.cat(tam.clone().addScaledVector(d, .5), tam.clone().addScaledVector(d, r), .5); }
}
/** tuyết rơi trong vùng (khối voxel nhỏ, rơi chậm) */
function tuyet(tamFn, r, song, mat) {
  let tt0 = 0;
  DK.lap((dt, t) => {
    if (t > song) return false; tt0 += dt * mat;
    while (tt0 >= 1) { tt0 -= 1; const c = tamFn(), a = RR(0, 6.28), d = Math.sqrt(Math.random()) * r; vfx.hat(new V3(c.x + Math.cos(a) * d, RR(3.5, 6), c.z + Math.sin(a) * d), { so: 1, mau: SUONG.clone().multiplyScalar(.75), toc: .4, huong: new V3(RR(-.3, .3), -1, RR(-.3, .3)), loe: .2, co: RR(.05, .09), song: 2.2, trongLuc: .6, can: .2 }); }
  });
}
/** sương giá đọng theo mũi kiếm trong lúc vung (khối voxel nhỏ lơ lửng rồi rơi) */
function suongGia(nv, song, mat) {
  let a = 0; const p = new V3(), c = new V3();
  DK.lap((dt, t) => {
    if (t > song) return false; a += dt * mat;
    while (a >= 1) { a -= 1; nv.mui(p); nv.can(c); const q = c.lerp(p, RR(.45, 1)); vfx.hat(q, { so: 1, mau: SUONG.clone().multiplyScalar(.7), toc: .25, co: RR(.05, .09), song: RR(.7, 1.1), trongLuc: .9, can: 3 }); }
  });
}

// ============================================================================ HÌNH KIẾM THẬT
/** băng kiếm thật (phiKiem: lưỡi băng trong, chắn lam, không tua) */
function kiemBang(co, op = {}) {
  return vfx.phiKiem(Object.assign({ dai: 1.1, co: co || 1, mau: BANG, kim: 0xd9f4ff, chan: 0x9fd6ff, chuoi: 0x4f86b8, tua: false, sang: 1.4, song: 30 }, op));
}
/** thuỷ kiếm (kiếm hồn nước trong suốt) */
const kiemNuoc = (co, op = {}) => vfx.phiKiem(Object.assign({ dai: .95, co: co || 1, mau: NUOC, kieu: 'hon', sang: 1.4, song: 30 }, op));

// lưới trăng khuyết nằm ngang (trục +z = hướng bay) — mép ngoài đặc, mép trong mờ
function hinhTrang(W) {
  const N = 22, GOC = 80 * D, P = [], C = [], I = [];
  for (let k = 0; k <= N; k++) {
    const u = k / N, g = -GOC + 2 * GOC * u, dx = Math.sin(g), dz = Math.cos(g);
    const w = W * Math.pow(Math.max(0, Math.cos((u - .5) * Math.PI)), .8);
    P.push(dx, 0, dz, dx * (1 - w), 0, dz * (1 - w) - w * .25); C.push(1, 1, 1, 1, 1, 1, 1, .08);
    if (k < N) { const a = k * 2; I.push(a, a + 1, a + 3, a, a + 3, a + 2); }
  }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('color', new T.Float32BufferAttribute(C, 4)); g.setIndex(I); g.giu = true; return g;
}
const TRANG = hinhTrang(.36), TRANG_DAY = hinhTrang(.52);
function huongTrang(d, dung, nghieng, out) {
  const dd = d.clone(); if (dd.lengthSq() < 1e-6) dd.set(0, 0, 1); dd.normalize();
  let n = dung ? new V3().crossVectors(LEN, dd) : LEN.clone(); if (n.lengthSq() < 1e-4) n.set(1, 0, 0); n.normalize();
  if (nghieng) n.applyAxisAngle(dd, nghieng);
  return qNhin(dd, n, out);
}
/** trăng khuyết 2 lớp: thân màu (trộn thường) + lõi sáng (cộng, > 1 cho bloom) */
function taoTrang(mau, sang = 1.6, day) {
  const g = new T.Group(), c = new T.Color(mau), G = day ? TRANG_DAY : TRANG;
  // thân (trộn thường, giữ màu trên nền sáng) + viền sáng mép ngoài (cộng, > 1 cho bloom)
  const m1 = new T.Mesh(G, new T.MeshBasicMaterial({ color: c.clone().multiplyScalar(day ? .8 : 1), vertexColors: true, transparent: true, opacity: .8, depthWrite: false, side: T.DoubleSide }));
  const m2 = new T.Mesh(TRANG, new T.MeshBasicMaterial({ color: c.clone().lerp(new T.Color(1, 1, 1), .2).multiplyScalar(sang), vertexColors: true, transparent: true, opacity: .6, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false }));
  m2.scale.set(1.01, 1, 1.01); g.add(m1, m2); g.renderOrder = 7; m1.frustumCulled = m2.frustumCulled = false;
  return { o: g, ve(p, q, r, k) { g.position.copy(p); g.quaternion.copy(q); g.scale.setScalar(Math.max(.001, r)); m1.material.opacity = .8 * k; m2.material.opacity = .6 * k; g.visible = k > .003; } };
}
/** trăng đọng tại chỗ (vệt chém đọng) */
function trangTinh(p, d, r, mau, song = .5, dung = false, nghieng = 0, mong) {
  const tr = taoTrang(mau), q = huongTrang(d, dung, nghieng), p0 = p.clone();
  if (mong) tr.o.children[0].visible = false;   // mỏng: chỉ viền sáng cộng (chiêu diện rộng — không che người)
  tr.ve(p0, q, r * .4, 1);
  return vfx.them(tr.o, song, (dt, u) => tr.ve(p0, q, DK.lerp(r * .4, r, DK.ease('o', Math.min(1, u * 3))), 1 - u * u));
}

// ============================================================================ ĐẠN BAY (khung chung)
/**
 * bay(L, op) — đạn đi thẳng / đuổi, dò trúng theo đoạn thân bù nhìn.
 * op: { tu, huong, toc, tam, rn (bán kính trúng), xuyen, duoi (rad/s), dich, giu (true: chờ phong()), ve(kb, dt), trung(o, diem, kb), ket(kb, ly) , quaDat }
 */
function bay(L, op) {
  const h0 = op.huong.lengthSq() > 1e-6 ? op.huong.clone().normalize() : new V3(0, 0, 1);
  const kb = { pos: op.tu.clone(), truoc: op.tu.clone(), vel: h0.multiplyScalar(op.toc), conLai: op.tam, het: false, t: 0, daPhong: !op.giu, thu: [] };
  kb.phong = h => { if (kb.het) return; kb.daPhong = true; if (h && h.lengthSq() > 1e-6) kb.vel = h.clone().normalize().multiplyScalar(op.toc); };
  kb.ket = ly => { if (kb.het) return; kb.het = true; if (op.ket) op.ket(kb, ly); };
  kb.x = vfx.them(null, 30, dt => {
    kb.t += dt; if (kb.het) return false;
    if (!kb.daPhong) { if (op.ve) op.ve(kb, dt); return; }
    if (op.duoi && op.dich) {
      const muon = new V3().subVectors(ngucDich(op.dich), kb.pos);
      if (muon.lengthSq() > .04) { const v0 = kb.vel.clone().normalize(), v1 = muon.normalize(), goc = v0.angleTo(v1); if (goc > 1e-4) { const ax = new V3().crossVectors(v0, v1); if (ax.lengthSq() > 1e-10) kb.vel.applyAxisAngle(ax.normalize(), goc * Math.min(1, op.duoi * dt / goc)); } }
    }
    kb.truoc.copy(kb.pos); kb.pos.addScaledVector(kb.vel, dt); kb.conLai -= op.toc * dt;
    for (const o of DK.dsBuNhin) {
      if (kb.het || kb.thu.indexOf(o) >= 0) continue;
      const p1 = o.pos.clone().setY(o.pos.y + .3), p2 = o.pos.clone().setY(o.pos.y + 1.55), gi = p1.clone().lerp(p2, .5);
      if (Math.min(kcDoan(p1, kb.truoc, kb.pos), kcDoan(p2, kb.truoc, kb.pos), kcDoan(gi, kb.truoc, kb.pos)) > op.rn + BK_DICH) continue;
      kb.thu.push(o); if (op.trung) op.trung(o, ngucDich(o), kb);
      if (!op.xuyen) kb.ket('trung');
    }
    if (kb.het) return false;
    if (!op.quaDat && kb.pos.y < dia.cao(kb.pos.x, kb.pos.z) + .05) { kb.ket('dat'); return false; }
    if (kb.conLai <= 0) { kb.ket('het'); return false; }
    if (op.ve) op.ve(kb, dt);
  });
  return kb;
}
/** băng kiếm rơi từ trời cắm xuống p (rơi tRoi giây): trúng vùng r, kiếm cắm lại `cam` giây rồi vỡ */
function kiemRoi(L, p, op = {}) {
  const tRoi = op.tRoi || .3, r = op.r || 1.3, co = op.co || 1.1, cam = op.cam != null ? op.cam : .8;
  const lech = new V3(RR(-1.2, 1.2), 0, RR(-1.2, 1.2));
  const tren = p.clone().add(lech).setY(10 + RR(0, 2)), dat = datY(p, 0);
  const h = new V3().subVectors(dat, tren).normalize();
  const k = kiemBang(co, { song: tRoi + cam + 1, vet: false });
  const L2 = k.muiL * .65;   // gốc nhóm → mũi
  k.dat(tren, h);
  let t = 0, xong = false, tCam = 0;
  vfx.them(null, tRoi + cam + .5, dt => {
    t += dt;
    if (!xong) {
      const u = DK.clamp(t / tRoi, 0, 1); k.dat(new V3().lerpVectors(tren, dat.clone().addScaledVector(h, -L2 + .25), u * u), h);
      if (u < 1) return;
      xong = true;
      chop(dat.clone().setY(dat.y + .3), 1.6, TRANG_BANG, .18); tia(dat.clone().setY(.2), 10, TRANG_BANG, 5, .1, .35); manhBang(dat, 5, 4, .14);
      dia.vun(dat, { so: 6, luc: 2.5, len: 3, co: .12 }); dia.nut(dat, { r: 1.3, nhanh: 4, mau: BANG, song: 2 }); dia.chay(dat, 1, { mau: 0xff8a40, manh: -.4 });
      if (op.gai) for (let j = 0; j < 4; j++) { const d = xoayY(new V3(0, 0, 1), j * 90 + RR(0, 40)); gaiBang(dat.clone().addScaledVector(d, .45), { huong: d.clone().multiplyScalar(.6).add(LEN), cao: RR(.6, 1), rong: .26, song: cam }); }
      const tam = dat.clone().setY(dat.y + .8);
      for (const o of DK.dsBuNhin) if (kcThan(o, tam) <= r + BK_DICH) danh(L, o, { manh: op.manh || 12, phaBang: op.phaBang, diem: ngucDich(o) });
      if (op.khiCam) op.khiCam(dat);
      return;
    }
    tCam += dt;
    if (tCam >= cam) { k.huy(); manhBang(dat.clone().setY(.6), 8, 5, .14); tia(dat.clone().setY(.6), 8, TRANG_BANG, 4, .08, .3); return false; }
  });
  return k;
}

// ============================================================================ TƯ THẾ + CLIP RIÊNG (tiền tố TN_)
const TU_THE = [
  // thủ thế trầm: chân rộng, kiếm ngang hông chĩa tới, tay trái kiếm chỉ trước ngực
  'TN_THU', 'tor:14,-24,0 head:-10,22,0 aR:-34,0,-20 fR:-38,0,0 w:118,0,0 aL:-58,0,28 fL:-96,0,0 lR:-34,0,-12 sR:48,0,0 cR:-6,0,0 lL:24,0,12 sL:40,0,0 ao:8,0,0',
  // cắm kiếm một tay: lunge sâu, lưỡi đâm thẳng xuống đất trước chân, tay trái dang sau giữ thăng bằng
  'TN_CAM', 'tor:40,-18,0 head:-28,16,0 aR:-40,0,-14 fR:-14,0,0 w:36,0,0 aL:34,0,66 fL:-18,0,0 lR:-78,0,-12 sR:108,0,0 cR:-12,0,0 lL:46,0,14 sL:26,0,0 ao:44,0,0 toc:26,0,0',
  // trên không giơ kiếm chuẩn bị bổ xuống
  'TN_NHAY', 'tor:-12,-10,0 head:4,8,0 aR:-176,0,-14 fR:-30,0,0 w:90,0,0 aL:-30,0,72 fL:-30,0,0 lR:-72,0,-8 sR:112,0,0 cR:25,0,0 lL:-18,0,8 sL:96,0,0 cL:35,0,0 ao:-10,0,0 toc:-22,0,0 jy:.55 cham:0',
  // lướt thấp, kiếm kéo sau lưng phải
  'TN_LUOT', 'tor:34,-50,-6 head:-24,44,0 aR:-120,0,-72 fR:-18,0,0 w:80,0,0 aL:-36,0,44 fL:-60,0,0 lR:-72,0,-10 sR:92,0,0 lL:40,0,10 sL:52,0,0 ao:52,0,0 toc:34,0,0',
  // tụ lực ngửa người, kiếm giơ cao (tụ băng)
  'TN_TU', 'tor:-8,-12,0 head:-28,10,0 aR:-184,0,-8 fR:-6,0,0 w:90,0,0 aL:-40,0,58 fL:-90,0,0 lR:-36,0,-12 sR:50,0,0 lL:30,0,12 sL:40,0,0 ao:-8,0,0 toc:-10,0,0',
  // chỉ kiếm: tay phải duỗi thẳng chĩa mũi tới, tay trái kết ấn (phóng băng kiếm)
  'TN_CHI', 'tor:18,-30,0 head:-14,26,0 aR:-96,0,-6 fR:-2,0,0 w:90,0,0 aL:-70,0,30 fL:-100,0,0 lR:-50,0,-12 sR:70,0,0 lL:40,0,12 sL:24,0,0 cL:16,0,0 ao:24,0,0',
];
DK.ttBang(TU_THE);
const C_ = (ten, k, mv, moc, ex) => DK.clip(ten, k, mv, moc, Object.assign({ tron: .06, than: 0 }, ex || {}));
// đòn thường (6 nhát)
C_('TN_D1', '0 TN_THU; .08 W1 o; .12 W1 h; .19 S1N s; .34 S1N h; .62 TN_THU', '0 0 0; .1 0 0; .22 0 .6', 'v .11, t .16, huy .34');
C_('TN_D2', '0 S1N; .08 W2 o; .12 W2 h; .19 S2b s; .32 S2b h; .6 TN_THU', '0 0 0; .1 0 0; .2 0 .5', 'v .11, t .16, huy .32');
C_('TN_D3', '0 TN_THU; .1 TU_LUC2 o; .15 TU_LUC2 h; .21 TN_CHI s; .38 TN_CHI h; .66 TN_THU', '0 0 0; .14 0 -.1; .24 0 1.3', 'v .15, t .2, huy .38');
C_('TN_D4', '0 TN_THU; .1 XG_W o; .14 XG_W h; .24 XG s; .38 XG h; .46 S1 io; .72 TN_THU', '0 0 0; .4 0 .7', 'v .14, t .26, huy .46', { xoay: [.13, .4, 360] });
C_('TN_D5', '0 TN_THU; .12 W4 o; .18 W4 h; .25 S4 s; .44 S4 h; .74 TN_THU', '0 0 0; .16 0 -.1; .26 0 .9', 'v .17, t .24, huy .44');
C_('TN_D6', '0 TN_THU; .1 TU_LUC2 o; .16 TU_LUC2 h; .3 TN_NHAY o; .4 TN_NHAY h; .5 TN_CAM s; .84 TN_CAM h; 1.12 TN_THU', '0 0 0; .16 0 0; .5 0 1.6 io', 'v .4, t .5, huy .84');
// lộn né (tới / lùi / ngang theo phím)
C_('TN_LON_T', '0 TN_THU; .05 LON_LUOT o; .3 LON_LUOT h; .46 TN_THU', '0 0 0; .04 0 0; .34 0 3.8', 'huy .4', { lon: [.03, .33, 360], tam: 1, than: 2 });
C_('TN_LON_L', '0 TN_THU; .05 LUI_NHAY o; .24 LUI_NHAY h; .3 DAP o; .46 TN_THU', '0 0 0; .04 0 0; .3 0 -3.6', 'huy .4', { lon: [.04, .3, -360], tam: 1, than: 2 });
C_('TN_LON_P', '0 TN_THU; .05 LON_LUOT o; .3 LON_LUOT h; .46 TN_THU', '0 0 0; .04 0 0; .34 3.6 0', 'huy .4', { lan: [.03, .33, 360], tam: 1, than: 2 });
C_('TN_LON_TR', '0 TN_THU; .05 LON_LUOT o; .3 LON_LUOT h; .46 TN_THU', '0 0 0; .04 0 0; .34 -3.6 0', 'huy .4', { lan: [.03, .33, -360], tam: 1, than: 2 });
// Z: hai nhát vung thật khớp mốc bắn C# .28 / .52 (bản game: clip CHIEU_0 còn ngắm tới .73)
C_('TN_Z', '0 TN_THU; .14 W1 o; .23 W1 h; .3 S1N s; .4 S1N h; .45 W2 o; .48 W2 h; .55 S2b s; .7 S2b h; 1 TN_THU', '0 0 0; .22 0 0; .3 0 .5; .48 0 .5; .55 0 .9', 'v0 .23, v1 .48, huy .75');
C_('TN_Z1', '0 TN_THU; .16 TU_LUC2 o; .32 TU_LUC2 h; .41 TN_CHI s; .7 TN_CHI h; 1 TN_THU', '0 0 0; .32 0 -.2; .42 0 1', 'v0 .33, huy .75');
C_('TN_ZH', '0 TN_THU; .16 XG_W o; .3 XG_W h; .42 S1N s; .7 S1N h; 1.05 TN_THU', '0 0 0; .3 0 0; .42 0 .8', 'v0 .3, huy .8', { xoay: [.28, .44, 180] });
// X: giơ kiếm ngưng băng → chỉ kiếm phóng (Đại Thành: giữ lâu hơn cho kiếm xoay một vòng)
C_('TN_X', '0 TN_THU; .12 TN_TU o; .3 TN_TU h; .36 TN_CHI s; 1 TN_CHI h; 1.25 TN_THU', null, 'huy .75');
C_('TN_X3', '0 TN_THU; .12 TN_TU o; .58 TN_TU h; .64 TN_CHI s; 1.25 TN_CHI h; 1.5 TN_THU', null, 'huy 1');
// C: tụ thế → lướt thấp kéo kiếm → chém ngang 120° đúng mốc .4
C_('TN_C', '0 TN_THU; .1 TU_LUC2 o; .2 TU_LUC2 h; .3 TN_LUOT o; .35 TN_LUOT h; .42 S1N s; .62 S1N h; 1 TN_THU', null, 'v0 .34, huy .8', { xoay: [.34, .46, 30] });
// V: nhún nhảy → cắm kiếm đúng mốc .42
C_('TN_V', '0 TN_THU; .1 TU_LUC2 o; .2 TN_NHAY o; .32 TN_NHAY h; .42 TN_CAM s; .8 TN_CAM h; 1.1 TN_THU', '0 0 0; .1 0 0; .42 0 .8 io', 'v0 .32, huy .7');
// R: tụ (ngửa kiếm) → nhảy → cắm .85 → rút kiếm chém vòng tại chỗ 1.55 (bản game: lao 3 m làm lệch tâm)
C_('TN_R', '0 TN_THU; .2 TU_LUC o; .45 TN_TU o; .62 TN_TU h; .72 TN_NHAY o; .78 TN_NHAY h; .86 TN_CAM s; 1.3 TN_CAM h; 1.4 XG_W o; 1.46 XG_W h; 1.56 XG s; 1.78 XG h; 2.1 TN_THU', null, 'v0 .78, v1 1.46, huy 1.8', { xoay: [1.44, 1.7, 360] });
C_('TN_RN', '0 TN_THU; .2 TU_LUC o; .45 TN_TU o; .62 TN_TU h; .72 TN_NHAY o; .78 TN_NHAY h; .86 TN_CAM s; 1.3 TN_CAM h; 1.4 W4 o; 1.48 W4 h; 1.56 S4 s; 1.8 S4 h; 2.1 TN_THU', null, 'v0 .78, v1 1.48, huy 1.8');

// ============================================================================ ĐÒN THƯỜNG (6 nhát)
const vetKiem = (ctx, song) => vfx.vet(ctx.nv, { song: song || .12 });
function danhNon(L, r, goc, op) {
  let so = 0;
  for (const o of DK.trongNon(L.nv, r, goc)) { const kq = danh(L, o, Object.assign({ diem: ngucDich(o) }, op)); so++; if (!kq.vo) tia(ngucDich(o), 8, TRANG_BANG, 4, .08, .3); }
  return so;
}
function danhTron(L, tam, r, op) { let so = 0; for (const o of DK.dsBuNhin) { if (kcThan(o, tam) > r + BK_DICH) continue; danh(L, o, Object.assign({ diem: ngucDich(o) }, op)); so++; } return so; }
const COMBO = [
  // 1 · chém chéo phải→trái, sương giá đọng theo lưỡi
  { clip: 'TN_D1', vet: .12, fx(L) { danhNon(L, 2.7, 130, { manh: 36, lui: .35, tich: .12 }); } },
  // 2 · chém ngược trái→phải
  { clip: 'TN_D2', vet: .12, fx(L) { danhNon(L, 2.7, 130, { manh: 36, lui: .35, tich: .12 }); } },
  // 3 · đâm thẳng: ba gai băng trồi theo đường mũi kiếm
  { clip: 'TN_D3', vet: .1, fx(L) {
    const nv = L.nv, h = nv.toi(); danhNon(L, 3.4, 50, { manh: 40, lui: .6, tich: .15 });
    for (let k = 0; k < 3; k++) gaiBang(datY(nv.pos.clone().addScaledVector(h, 1.7 + k * .8)), { huong: h.clone().multiplyScalar(.9).add(LEN), cao: .55 + k * .25, rong: .24, song: .55, tre: k * .04 });
    tia(nv.mui(), 8, TRANG_BANG, 5, .08, .3);
  } },
  // 4 · xoay thấp 360°: vành băng mỏng trên đất, cỏ rạp
  { clip: 'TN_D4', vet: .2, fx(L) {
    const nv = L.nv; danhTron(L, nguc(nv), 2.8, { manh: 32, lui: .5, tich: .12 });
    bangDat(nv.pos, 2.4, { lan: .15, song: 2.2, cao: .05, o: .5 }); dia.gio(nv.pos, 3.5, .8);
  } },
  // 5 · bổ dọc: gai băng nứt theo đường bổ
  { clip: 'TN_D5', vet: .1, fx(L) {
    const nv = L.nv, h = nv.toi(); danhNon(L, 3, 70, { manh: 46, lui: .7, tich: .15 });
    const a = datY(nv.pos.clone().addScaledVector(h, 1.2)); dia.nut(a, { r: 2.2, nhanh: 3, mau: BANG, song: 2 });
    for (let k = 0; k < 4; k++) gaiBang(datY(nv.pos.clone().addScaledVector(h, 1.8 + k * .7).addScaledVector(phaiCua(h), RR(-.25, .25))), { huong: h.clone().multiplyScalar(.5).add(LEN), cao: .7 + k * .22, rong: .28, song: .6, tre: k * .035 });
    rung(.15);
  } },
  // 6 · chốt: bật nhảy cắm kiếm — đất đóng băng tròn 3 m, gai băng vòng, vỡ băng
  { clip: 'TN_D6', vet: .12, fx(L) {
    const nv = L.nv, p = datY(nv.pos.clone().addScaledVector(nv.toi(), .7));
    for (const o of DK.dsBuNhin) { if (kcThan(o, p.clone().setY(.8)) > 3 + BK_DICH) continue; danh(L, o, { manh: 70, lui: 1.2, len: 3, phaBang: true, tich: .34, diem: ngucDich(o) }); }
    const bd = bangDat(p, 3.1, { lan: .2, song: 1.6, co: true });
    for (let k = 0; k < 8; k++) { const d = xoayY(new V3(0, 0, 1), k * 45 + RR(-10, 10)); gaiBang(p.clone().addScaledVector(d, 2.2), { huong: d.clone().multiplyScalar(.5).add(LEN), cao: RR(.6, 1.1), rong: .3, song: .7, tre: .06 + k * .01 }); }
    DK.sau(1.6, () => bd.vo(.8));
    dia.song(p, { r: 4, toc: 12, cao: .18 }); dia.gio(p, 4, 1); chop(p.clone().setY(.3), 2.2, BANG, .2); rung(.35);
  } },
];
function danhThuong(ctx, i) {
  const c = COMBO[i % COMBO.length], L = lan(ctx, 1, 'bang'); L.heSo = 1; L.ttTang = null;
  ctx.phat(c.clip, { moc: { v: () => { vetKiem(ctx, c.vet); suongGia(ctx.nv, c.vet + .06, 70); }, t: () => c.fx(L) } });
}
/** lộn né: để lại băng ảnh + mảng sương tại chỗ cũ */
function lonNe(ctx) {
  const nv = ctx.nv, P = DK.phim || {};
  const clip = P.s || P.ArrowDown ? 'TN_LON_L' : P.d || P.ArrowRight ? 'TN_LON_P' : P.a || P.ArrowLeft ? 'TN_LON_TR' : 'TN_LON_T';
  const p0 = nv.pos.clone();
  vfx.anhSot(nv, { mau: BANG.clone().multiplyScalar(.8), op: .45, song: .7 });
  bangDat(p0, 1.1, { lan: .08, song: 1.6, cao: .05, o: .45 });
  tia(p0.clone().setY(.9), 14, SUONG.clone().multiplyScalar(.7), 2.5, .08, .6);
  ctx.phat(clip, { moc: {} });
  DK.sau(.16, () => vfx.anhSot(nv, { mau: BANG.clone().multiplyScalar(.6), op: .3, song: .5 }));
  DK.sau(.34, () => tia(nv.pos.clone().setY(.4), 8, SUONG.clone().multiplyScalar(.6), 2, .07, .5));
}

// ============================================================================ Z · THUỶ NGUYỆT KIẾM KHÍ (màu: nước lam)
const TOC_Z = 24;
/** một lưỡi kiếm khí nước: trăng khuyết bọc một thuỷ kiếm thật bay mũi tới */
function songNuoc(L, tu, hh, op) {
  const r = op.r, g = new T.Group(), tr = [taoTrang(NUOC_DAM, 1.5, true)], q = new T.Quaternion();
  if (op.ba) { tr.push(taoTrang(TRANG_BANG, 1.1), taoTrang(NUOC_DAM, 1.4, true)); }
  for (const x of tr) g.add(x.o);
  const kiem = kiemNuoc(op.co || 1.15, { song: 30 });
  let tHat = 0, tDat = 0, kTan = 1, tan = false;
  vfx.them(g, 30, dt => {
    if (tan) { kTan -= dt / .18; if (kTan <= 0) return false; }
    const p = kb.pos, vn = kb.vel.clone().normalize();
    tr[0].ve(p, huongTrang(vn, false, .1, q), r, kTan);
    if (op.ba) { tr[1].ve(p.clone().addScaledVector(LEN, .36).addScaledVector(vn, -.4), huongTrang(vn, false, -.12, q), r * .8, kTan * .8); tr[2].ve(p.clone().addScaledVector(LEN, -.32).addScaledVector(vn, -.6), huongTrang(vn, false, .22, q), r * .72, kTan * .7); }
  });
  const kb = bay(L, {
    tu, huong: hh, toc: op.toc || TOC_Z, tam: op.tam, rn: (op.rn || r) * .6, xuyen: op.xuyen,
    ve(kb, dt) {
      kiem.dat(kb.pos.clone().addScaledVector(kb.vel.clone().normalize(), r * .15), kb.vel);
      tHat += dt; if (tHat >= .04) { tHat = 0; const vn = kb.vel.clone().normalize(), ben = phaiCua(vn).normalize();
        for (const s of [-1, 1]) vfx.hat(kb.pos.clone().addScaledVector(ben, s * r * .75).addScaledVector(vn, .25), { so: 1, mau: NUOC.clone().multiplyScalar(1.1), toc: 1.2, huong: new V3(0, -1, 0).addScaledVector(vn, -.5), loe: .4, co: .08, song: .45, trongLuc: 9 });
        if (L.tang >= 2) vfx.hat(kb.pos.clone().addScaledVector(vn, -.6), { so: 1, mau: TRANG_BANG, toc: .6, co: .07, song: .5, trongLuc: 4 });
      }
      // Viên Mãn: nước rỏ ướt đất + cỏ rạp theo áp lực lưỡi sóng
      if (L.tang >= 4) { tDat += dt; if (tDat >= .08) { tDat = 0; const dd = datY(kb.pos); dia.chay(dd, .9, { mau: NUOC, manh: .22 }); dia.gio(dd, 1.8, .45); } }
    },
    trung(o, diem) {
      danh(L, o, { manh: 40, lui: 1.2, diem });
      chop(diem, 1.6, NUOC, .2); tia(diem, 14, NUOC, 6, .1, .4);
      if (L.tang >= 4) vongNuoc(L, diem, o);
      if (op.trung) op.trung(o, diem);
    },
    ket(kb2, ly) { tan = true; kiem.huy(); if (ly !== 'trung') tia(kb2.pos, 10, NUOC, 4, .09, .35); },
  });
  kiem.dat(tu, hh);
  return kb;
}
/** Viên Mãn: chỗ trúng nổ vòng nước 2,4 m — sóng đất, nước toé, Ướt lan */
function vongNuoc(L, p, bo) {
  const d = datY(p);
  vfx.vong(d.clone().setY(d.y + .05), { bk0: .3, bk1: 2.6, mau: NUOC, song: .45, day: .3 });
  vfx.hat(d.clone().setY(.3), { so: 26, mau: NUOC.clone().multiplyScalar(1.2), toc: 7, huong: LEN, loe: .7, co: .12, song: .8, trongLuc: 16 });
  dia.song(d, { r: 3.2, toc: 10, cao: .14 }); dia.chay(d, 2.4, { mau: NUOC, manh: .35 }); dia.gio(d, 3.4, 1.1);
  for (const o of DK.dsBuNhin) if (o !== bo && kcThan(o, p) <= 2.4 + BK_DICH) danh(L, o, { manh: 12, diem: ngucDich(o) });
}
/** dòng nước chảy dọc rãnh (dải phẳng lam bóng sát mặt đất; lõi: DK.san phẳng che lòng rãnh nên đặt nổi) */
const MAT_NUOC = giu(new T.MeshStandardMaterial({ color: 0x2f7fd8, roughness: .05, metalness: .3, transparent: true, opacity: .85, emissive: 0x0c3a7a, emissiveIntensity: .6 }));
function nuocDong(a, b, song) {
  const d = new V3().subVectors(b, a).setY(0), L = d.length(); if (L < .05) return;
  const mat = MAT_NUOC.clone(), m = new T.Mesh(HOP, mat); m.position.set((a.x + b.x) / 2, .02, (a.z + b.z) / 2); m.rotation.y = Math.atan2(d.x, d.z); m.scale.set(1.1, .02, L + .25);
  vfx.them(m, song, (dt, u) => { mat.opacity = .8 * (1 - u * u); m.scale.x = 1.1 * (1 - u * .5); });
}
/** Hoá Cảnh — Thiên Hà Đảo Quyển: dải sông bạc cuộn ngang, 5 thuỷ kiếm cưỡi sóng, xẻ rãnh nước dọc đường */
function thienHa(L, tu, hh) {
  const g = new T.Group(), tr = [], q = new T.Quaternion(), kiem = [];
  for (let j = 0; j < 7; j++) { const x = taoTrang(j % 2 ? TRANG_BANG : NUOC_DAM, j % 2 ? 1 : 1.5, !(j % 2)); g.add(x.o); tr.push(x); }
  for (let j = 0; j < 5; j++) kiem.push(kiemNuoc(1.3, { song: 30 }));
  let tan = false, kTan = 1, tRanh = 0, tTruoc = tu.clone();
  vfx.them(g, 30, dt => { if (tan) { kTan -= dt / .3; if (kTan <= 0) return false; } });
  const ve = kb => {
    const vn = kb.vel.clone().normalize(), ben = phaiCua(vn).normalize();
    for (let j = 0; j < 7; j++) { const s = Math.sin(kb.t * 9 - j * .9) * .6; const p = kb.pos.clone().addScaledVector(vn, -j * 1.05).addScaledVector(ben, s).addScaledVector(LEN, Math.cos(kb.t * 7 - j) * .18); tr[j].ve(p, huongTrang(vn, false, s * .3, q), 2.6 * (1 - j * .08), kTan * (1 - j * .1)); }
    for (let j = 0; j < 5; j++) { const s = (j - 2) * .9; kiem[j].dat(kb.pos.clone().addScaledVector(ben, s).addScaledVector(vn, .4 - Math.abs(j - 2) * .5).addScaledVector(LEN, Math.sin(kb.t * 8 + j) * .15), vn); }
  };
  const kb = bay(L, {
    tu, huong: hh, toc: TOC_Z * .9, tam: 30, rn: 2.2, xuyen: true, quaDat: true,
    ve(kb, dt) {
      ve(kb); tRanh += dt;
      if (tRanh >= .1) {
        tRanh = 0; const a = datY(tTruoc), b = datY(kb.pos); tTruoc = kb.pos.clone();
        dia.ranh(a, b, 1.6, .55, { mau: NUOC }); dia.cat(a, b, 2.6); dia.gio(b, 3.4, 1.3); dia.chay(b, 2.4, { mau: NUOC, manh: .45 }); dia.pha(b, 1.6); nuocDong(a, b, 3.2);
        vfx.hat(b.clone().setY(.3), { so: 8, mau: NUOC.clone().multiplyScalar(1.2), toc: 5, huong: LEN, loe: .8, co: .1, song: .7, trongLuc: 14 });
      }
    },
    trung(o, diem) { danh(L, o, { manh: 40, lui: 3, len: 3, diem }); chop(diem, 2.2, NUOC, .22); vongNuoc(L, diem, o); },
    ket() { tan = true; for (const k of kiem) k.huy(); },
  });
  ve(kb);
  return kb;
}
/** nhánh Thuỷ Tiễn: một mũi thuỷ kiếm lớn xoáy, vòng nước xoắn quanh thân */
function thuyTien(L, tu, hh) {
  const kiem = kiemNuoc(1.7, { song: 30 }), g = new T.Group(), vong = [];
  for (let j = 0; j < 3; j++) { const m = new T.Mesh(new T.TorusGeometry(.42 - j * .08, .035, 6, 20), new T.MeshBasicMaterial({ color: NUOC.clone().multiplyScalar(1.6), transparent: true, opacity: .7, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false })); g.add(m); vong.push(m); }
  let tan = false, kT = 1, tHat = 0;
  vfx.them(g, 30, dt => { if (tan) { kT -= dt / .15; if (kT <= 0) return false; for (const m of vong) m.material.opacity = .7 * kT; } });
  const kb = bay(L, {
    tu, huong: hh, toc: 34, tam: 28, rn: .8, xuyen: true,
    ve(kb, dt) {
      const vn = kb.vel.clone().normalize(); kiem.dat(kb.pos, vn); kiem.o.rotateZ(kb.t * 14);
      vong.forEach((m, j) => { m.position.copy(kb.pos).addScaledVector(vn, -.5 - j * .55); m.quaternion.setFromUnitVectors(new V3(0, 0, 1), vn); m.rotateZ(kb.t * 10 + j); });
      tHat += dt; if (tHat > .03) { tHat = 0; const a = kb.t * 30, ben = phaiCua(vn).normalize(); vfx.hat(kb.pos.clone().addScaledVector(vn, -.8).addScaledVector(ben, Math.cos(a) * .4).addScaledVector(LEN, Math.sin(a) * .4), { so: 1, mau: NUOC.clone().multiplyScalar(1.2), toc: .5, co: .08, song: .4, trongLuc: 6 }); }
    },
    trung(o, diem) { danh(L, o, { manh: 40, lui: 1.6, diem }); chop(diem, 1.8, NUOC, .2); tia(diem, 16, NUOC, 7, .1, .4); },
    ket() { tan = true; kiem.huy(); },
  });
  kiem.dat(tu, hh);
  return kb;
}
function thuyNguyet(ctx) {
  const L = lan(ctx, 0, 'thuy'), nv = L.nv, h = L.h;
  const lienBa = L.Nhanh('lien_ba'), tien = L.Nhanh('thuy_tien'), hoaCanh = L.tang >= 5 && !lienBa && !tien;
  const tam = tien ? 28 : lienBa ? 16 : 20;
  const a = new V3(nv.pos.x, .06, nv.pos.z).addScaledVector(h, .6);
  baoDai(a, a.clone().addScaledVector(h, tam), lienBa ? 5 : hoaCanh ? 5 : 2.2, .26, NUOC);
  const mot = tien || hoaCanh;
  ctx.phat(mot ? (hoaCanh ? 'TN_ZH' : 'TN_Z1') : 'TN_Z', { moc: { v0: () => vetKiem(ctx, .14), v1: () => vetKiem(ctx, .14) } });
  if (L.tang >= 4) { vfx.troi(TROI_LANH, 2.2, hoaCanh ? .45 : .3); vfx.vienMan(NUOC, 1.4, hoaCanh ? .5 : .3); }
  ctx.sau(.08, () => tia(nv.mui(), 8, NUOC, 3, .08, .35));
  const nhat = (t, k) => ctx.sau(t, () => {
    const hh = huongNgam(L), tu = nguc(nv).addScaledVector(hh, .9);
    if (hoaCanh) { thienHa(L, tu.setY(tu.y - .3), hh); vaCham(L, 'chop', NUOC); rung(.4); }
    else if (tien) thuyTien(L, tu, hh);
    else if (lienBa) { for (let j = -2; j <= 2; j++) songNuoc(L, tu, xoayY(hh, j * 12.5), { r: .85, co: .8, tam, xuyen: false }); }
    else songNuoc(L, tu, hh, { r: 1.45 * (L.tang >= 3 ? 1.12 : 1) * (L.tang >= 4 ? 1.1 : 1), rn: 1.1, co: 1.35, tam, ba: L.tang >= 3 });
    chop(tu, 1.2, NUOC, .16); rung(.12 + k * .06);
  });
  if (mot) nhat(.4, 1); else { nhat(.28, 0); nhat(.52, 1); }
}

// ============================================================================ X · HÀN BĂNG KIẾM (màu: băng lam nhạt)
const TOC_X = 30;
function hanBang(ctx) {
  const L = lan(ctx, 1, 'bang'), nv = L.nv, h = L.h;
  if (L.Nhanh('bang_luan')) { bangLuan(L, ctx); return; }
  const truy = L.Nhanh('truy_han'), xoay = L.tang >= 3 && !truy;
  const so = truy ? 2 : L.tang >= 3 ? 5 : 3, manh = truy ? 30 : 90 / so, duoi = truy ? 6 : 1.6;
  const co = (L.tang >= 4 ? 1.75 : L.tang >= 3 ? 1.25 : 1.1) * (truy ? 1.35 : 1);
  const a = new V3(nv.pos.x, .06, nv.pos.z).addScaledVector(h, .8);
  baoDai(a, a.clone().addScaledVector(h, 22), 2, .35, BANG);
  ctx.phat(xoay ? 'TN_X3' : 'TN_X', { moc: {} });
  if (L.tang >= 4) vfx.troi(TROI_LANH, 2.4, .3);
  const ds = [], tP0 = xoay ? .66 : .36, buoc = so > 3 ? .08 : .12;
  // chỗ đứng của kiếm k (sau lưng, vòng cung); tl = thời gian từ lúc ngưng — Đại Thành: cả vòng xoay 360° quanh người rồi mới về sau lưng
  const viTri = (k, tl) => {
    const u = so === 1 ? 0 : (k / (so - 1)) * 2 - 1, hh = huongNgang(L), ph = phaiCua(hh);
    const base = ph.clone().multiplyScalar(u * (so >= 5 ? 1.9 : 1.2)).addScaledVector(LEN, 2.05 + (1 - u * u) * .5).addScaledVector(hh, -.55);
    if (!xoay) return nv.pos.clone().add(base);
    const p = DK.clamp((tl - .06) / .46, 0, 1), goc = 360 * DK.ease('io', p);
    return nv.pos.clone().add(xoayY(base.clone().setY(0), goc).setY(base.y));
  };
  ctx.sau(.12, () => {
    for (let k = 0; k < so; k++) {
      const kiem = kiemBang(co), t0 = DK.now; kiem.o.scale.setScalar(.01);
      let tHat = 0, tTuyet = 0;
      const kb = bay(L, {
        tu: viTri(k, 0), huong: h, toc: TOC_X, tam: 24, rn: .45, giu: true, duoi, dich: L.dich,
        ve(kb, dt) {
          if (!kb.daPhong) {
            const tl = DK.now - t0, p = viTri(k, tl), ngam = L.dich ? new V3().subVectors(ngucDich(L.dich), p) : huongNgang(L);
            kb.pos.copy(p).addScaledVector(LEN, Math.sin(tl * 9 + k) * .05);
            // lúc xoay: mũi theo tiếp tuyến; cuối vòng mới quay mũi về đích
            let d = ngam.clone().normalize();
            if (xoay && tl < .55) { const r = new V3().subVectors(p, nv.pos).setY(0); const tiep = new V3().crossVectors(LEN, r).normalize(); d = tiep.lerp(d, DK.clamp((tl - .4) / .15, 0, 1)).normalize(); }
            kb.vel.copy(d).multiplyScalar(TOC_X);
            kiem.o.scale.setScalar(DK.ease('o', Math.min(1, tl / .16)));
            tTuyet += dt; if (tTuyet > .05) { tTuyet = 0; vfx.hat(kb.pos.clone().add(new V3(RR(-.3, .3), RR(-.3, .3), RR(-.3, .3))), { so: 1, mau: SUONG.clone().multiplyScalar(.7), toc: .3, co: .06, song: .5, trongLuc: .8 }); }
          }
          kiem.dat(kb.pos, kb.vel);
          if (kb.daPhong && L.tang >= 2) { tHat += dt; if (tHat > .03) { tHat = 0; vfx.hat(kb.pos.clone().addScaledVector(kb.vel.clone().normalize(), -.5 * co), { so: 1, mau: TRANG_BANG, toc: .4, co: .07, song: .7, trongLuc: 1.5 }); } }
        },
        trung(o, diem) {
          danh(L, o, { manh, lui: 1, diem, tich: truy ? TICH_BANG * 2 : TICH_BANG });
          chop(diem, 1.3, BANG, .2); tia(diem, 12, TRANG_BANG, 6, .09, .35);
          if (L.tang >= 4) {
            const q = datY(o.pos);
            for (let j = 0; j < 6; j++) { const d = xoayY(new V3(0, 0, 1), j * 60 + RR(-10, 10)); gaiBang(q.clone().addScaledVector(d, .55), { huong: d.clone().multiplyScalar(.6).add(LEN), cao: RR(.9, 1.4), rong: .3, song: .7, tre: j * .012 }); }
            bangDat(q, 1.8, { lan: .12, song: 2.2, o: .5 }); rung(.15);
          }
        },
        ket(kb2, ly) {
          kiem.huy();
          if (ly === 'dat') { const p = datY(kb2.pos); dia.camKiem(p, kb2.vel.clone().normalize(), { dai: .95, co, mau: BANG, kim: 0xd9f4ff, chan: 0x9fd6ff, chuoi: 0x4f86b8, tua: false, sang: 1.2, song: 1.6 }); bangDat(p, .9, { lan: .08, song: 1.5, o: .4, cao: .05 }); tia(p.clone().setY(.2), 8, TRANG_BANG, 3, .08, .3); }
        },
      });
      kb.kiem = kiem; ds[k] = kb;
      vfx.hat(viTri(k, 0), { so: 10, mau: SUONG.clone().multiplyScalar(.8), toc: 2, co: .07, song: .35, trongLuc: 0, can: 6 });
    }
    rung(.1);
  });
  for (let k = 0; k < so; k++) {
    const tP = tP0 + k * buoc;
    ctx.sau(tP - .15, () => { const kb = ds[k]; if (!kb || kb.het) return; const d = L.dich ? ngucDich(L.dich) : kb.pos.clone().addScaledVector(h, 12); vfx.tia(kb.pos.clone(), kb.pos.clone().lerp(d, .55), { rong: .05, mau: BANG.clone().multiplyScalar(.7), song: .15 }); });
    ctx.sau(tP, () => { const kb = ds[k]; if (!kb || kb.het) return; const d = L.dich ? ngucDich(L.dich) : kb.pos.clone().addScaledVector(h, 20); kb.phong(d.sub(kb.pos)); tia(kb.pos, 6, TRANG_BANG, 3, .08, .25); rung(.08); });
  }
  // Hoá Cảnh — Vạn Lăng Băng Tiễn: mưa băng kiếm thật quanh mục tiêu, cắm lại rồi vỡ cùng lúc
  if (L.tang >= 5) {
    ctx.sau(tP0 + so * buoc + .05, () => { vfx.troi(TROI_DEM, 2.2, .45); vfx.vienMan(BANG, 1.8, .45); });
    const tam0 = () => L.dich ? L.dich.pos.clone() : nv.pos.clone().addScaledVector(h, 10);
    const tRoi0 = tP0 + so * buoc + .15, nRoi = 12;
    for (let k = 0; k < nRoi; k++) ctx.sau(tRoi0 + k * .06, () => {
      const g = k * 137.5 * D, rr = 1 + (k / nRoi) * 3.2, c = tam0();
      kiemRoi(L, c.add(new V3(Math.cos(g) * rr, 0, Math.sin(g) * rr)).setY(0), { r: 1.4, manh: 12, tRoi: .28, cam: (nRoi - k) * .06 + .5, co: 1.25, gai: k % 3 === 0 });
    });
    ctx.sau(tRoi0 + nRoi * .06 + .78, () => { const c = tam0(); vaCham(L, 'dao', BANG); bangDat(c, 4.4, { lan: .12, song: 1.4, co: true }); dia.song(c, { r: 6, toc: 14, cao: .22 }); dia.gio(c, 6, 1.4); rung(.5); });
  }
}
/** nhánh Băng Luân: băng kiếm thật xoay quanh thân 2,5 s, chém kẻ trong 2,8 m (mỗi kẻ một nhát / 0,5 s) */
function bangLuan(L, ctx) {
  ctx.phat('TN_X', { moc: {} });
  baoVong(datY(L.nv.pos, .03), 2.8, .25, BANG);
  ctx.sau(.25, () => {
    vfx.vong(datY(L.nv.pos, .1), { bk0: .5, bk1: 2.8, mau: BANG, song: .35, day: .2 }); rung(.12);
    const so = L.tang >= 3 ? 5 : 3, song = 2.5, ds = [], lanCuoi = new Map(); let tQuet = 0, tDat = 0;
    for (let j = 0; j < so; j++) ds.push(kiemBang(1, { song: song + .1 }));
    vfx.them(null, song, (dt, u, t) => {
      const tam = nguc(L.nv), k = DK.clamp(t / .15, 0, 1) * DK.clamp((song - t) / .2, 0, 1);
      for (let j = 0; j < so; j++) {
        const gg = t * 6 + j * Math.PI * 2 / so, d = new V3(Math.cos(gg), 0, Math.sin(gg));
        ds[j].dat(tam.clone().addScaledVector(d, 1.8).addScaledVector(LEN, Math.sin(gg * 2) * .15 - .2), new V3().crossVectors(d, LEN));
        ds[j].o.scale.setScalar(Math.max(.01, k));
      }
      tDat += dt; if (tDat > .3) { tDat = 0; bangDat(L.nv.pos, 2.3, { lan: .05, song: .5, cao: .04, o: .55 }); dia.gio(L.nv.pos, 3, .5); }
      tQuet += dt; if (tQuet < .1) return; tQuet = 0;
      for (const o of DK.dsBuNhin) {
        if (kcThan(o, tam) > 2.8 + BK_DICH) continue;
        const lc = lanCuoi.get(o); if (lc != null && t - lc < .5) continue; lanCuoi.set(o, t);
        danh(L, o, { manh: 30, lui: .8, diem: ngucDich(o) }); tia(ngucDich(o), 8, TRANG_BANG, 5, .08, .3);
      }
    }, () => { for (const x of ds) { manhBang(x.o.position.clone(), 3, 3, .1); x.huy(); } });
  });
}

// ============================================================================ C · TOÁI BĂNG TRẢM (màu: trắng băng)
function diToi(nv, den, tg, e) { const tu = nv.pos.clone(); DK.lap((dt, tl) => { const u = DK.clamp(tl / tg, 0, 1), k = DK.ease(e || 'io', u); nv.pos.x = DK.lerp(tu.x, den.x, k); nv.pos.z = DK.lerp(tu.z, den.z, k); return u < 1; }); }
function diemLuot(L, Ld, ho) {
  const nv = L.nv; let den = nv.pos.clone().addScaledVector(L.h, Ld);
  if (L.dich) { const a = new V3().subVectors(L.dich.pos, nv.pos); a.y = 0; const kc = a.length(), dung = BK_NGUOI + BK_DICH + ho; if (kc < Ld + dung) den = nv.pos.clone().addScaledVector(L.h, Math.max(0, kc - dung)); }
  return den;
}
function noBangVun(L, goc, r, manh) {
  const p = ngucDich(goc); let soVo = 0;
  for (const o of DK.dsBuNhin) {
    if (o === goc || kcThan(o, p) > r + BK_DICH) continue;
    if (L.tang >= 5 && soVo < 4 && coDong(o)) { soVo++; const oo = o; DK.sau(.08 * soVo, () => { danh(L, oo, { manh: manh * 1.5, phaBang: true, diem: ngucDich(oo) }); vfx.tia(p, ngucDich(oo), { rong: .06, mau: TRANG_BANG, song: .12 }); }); }
    else danh(L, o, { manh, diem: ngucDich(o) });
  }
  vfx.vong(datY(p, .08), { bk0: .3, bk1: r, mau: TRANG_BANG, song: .35, day: .25 });
  manhBang(p, Math.round(r * 5), 6 + r, .2);
}
function toaiBang(ctx) {
  const L = lan(ctx, 2, 'bang'), nv = L.nv, h = L.h;
  const phaBang = L.Nhanh('pha_bang'), hanTram = L.Nhanh('han_tram');
  const R = 5, GOC = 120;
  const p0 = nv.pos.clone(), den = diemLuot(L, 5, 1.2);
  baoQuat(new V3(den.x, .06, den.z), h, R + .6, GOC, .38, TRANG_BANG);
  ctx.phat('TN_C', { moc: { v0: () => { vetKiem(ctx, .16); if (hanTram || L.tang >= 2) suongGia(nv, .24, 90); } } });
  if (L.tang >= 4) vfx.troi(TROI_LANH, 2, L.tang >= 5 ? .45 : .3);
  ctx.sau(.06, () => tia(nv.mui(), 10, TRANG_BANG, 3, .08, .35));
  ctx.sau(.2, () => {
    diToi(nv, den, .16, 'o'); vfx.anhSot(nv, { mau: TRANG_BANG.clone().multiplyScalar(.7), op: .35, song: .4 });
    // Tiểu Thành: đường lướt để lại vệt sương băng trên đất
    if (L.tang >= 2) { const n = Math.max(1, Math.round(p0.distanceTo(den) / 1.1)); for (let k = 0; k <= n; k++) { const q = p0.clone().lerp(den, k / n); DK.sau(k * .03, () => bangDat(q, .7, { lan: .05, song: 1.8, cao: .04, o: .4 })); } }
  });
  ctx.sau(.28, () => vfx.anhSot(nv, { mau: TRANG_BANG.clone().multiplyScalar(.5), op: .25, song: .3 }));
  ctx.sau(.4, () => {
    const tam = nguc(nv), cg = Math.cos(GOC * .5 * D), hh = h.clone(); let voSo = 0;
    for (const o of DK.dsBuNhin) {
      const dx = o.pos.x - tam.x, dz = o.pos.z - tam.z, dh = Math.hypot(dx, dz);
      if (dh > R + BK_DICH || o.pos.y > tam.y + 2.4 || o.pos.y + 1.8 < tam.y - 2.4) continue;
      if (dh > BK_DICH + .3 && (dx * hh.x + dz * hh.z) / dh < cg) continue;
      const dongTruoc = coDong(o);
      const kq = danh(L, o, { manh: 95, lui: 3, phaBang: true, diem: ngucDich(o) });
      if (kq.vo) { voSo++; noBangVun(L, o, phaBang ? 4.2 : 2.8, phaBang ? 60 : 40); }
      else if (kq.trung && hanTram && !dongTruoc) ganCham(o, GIAY_CHAM, .5);
    }
    // vệt chém ngang đọng (Tiểu Thành: thêm lớp)
    const K = L.tang >= 5 ? 1.5 : L.tang >= 4 ? 1.25 : L.tang >= 3 ? 1.12 : 1;
    trangTinh(tam.clone().addScaledVector(hh, 1.4), hh, 3.3 * K, TRANG_BANG, .45, false, -.08);
    if (L.tang >= 2) trangTinh(tam.clone().addScaledVector(hh, 1.6).setY(tam.y - .2), hh, 3.7 * K, BANG, .5, false, .12);
    tia(tam.clone().addScaledVector(hh, 2), L.tang >= 2 ? 22 : 12, TRANG_BANG, 7, .1, .4);
    if (L.tang >= 2) manhBang(tam.clone().addScaledVector(hh, 2), 8, 5, .14);
    rung(voSo > 0 ? .5 : .32);
    // Đại Thành: ba trụ băng voxel mọc dọc đường kiếm rồi vỡ
    const ph = phaiCua(hh);
    if (L.tang >= 3) for (let k = 0; k < 3; k++) truBang(datY(nv.pos.clone().addScaledVector(hh, 1.7 + k * 1.3).addScaledVector(ph, (k - 1) * 1.3)), 1.5 + k * .35, .85, k * .06);
    // Viên Mãn: mặt quạt 120° đóng băng, hàng gai băng nở theo vành quạt, nứt băng, cỏ quạt bị cắt
    if (L.tang >= 4) {
      const g0 = datY(nv.pos); const bd = bangDat(g0, R, { lan: .22, song: 1.2, huong: hh, goc: GOC, co: true });
      const nG = L.tang >= 5 ? 13 : 9;
      for (let k = 0; k < nG; k++) { const a = -GOC / 2 + GOC * k / (nG - 1), d = xoayY(hh, a); gaiBang(g0.clone().addScaledVector(d, R * RR(.78, .95)), { huong: d.clone().multiplyScalar(.55).add(LEN), cao: RR(1.1, 1.8) * (L.tang >= 5 ? 1.3 : 1), rong: .38, song: .9, tre: .1 + Math.abs(a) / 60 * .06 }); }
      dia.nut(g0.clone().addScaledVector(hh, 1.5), { r: R * .8, nhanh: 6, mau: BANG, song: 2.6 });
      DK.sau(1.15, () => { bd.vo(1); rung(.2); });
      dia.gio(g0, R + 1, 1.2);
    }
    // Hoá Cảnh: khung va chạm, cây / đèn đá trong quạt gãy đổ
    if (L.tang >= 5) { vaCham(L, voSo ? 'dao' : 'chop', TRANG_BANG); for (const kc of [3, 5.5]) dia.pha(datY(nv.pos.clone().addScaledVector(hh, kc)), 2.2); vfx.vienMan(BANG, 1.2, .4); }
  });
}

// ============================================================================ V · HÀN VỤ KIẾM VỰC (màu: sương trắng lam)
const NHIP_SUONG = .55;
function hanVu(ctx) {
  const L = lan(ctx, 3, 'bang'), nv = L.nv, h = L.h;
  const hanVuc = L.Nhanh('han_vuc'), vuKiem = L.Nhanh('vu_kiem');
  const R = 5.5 * (L.tang >= 3 ? 1.25 : 1) * (hanVuc ? 1.4 : vuKiem ? .8 : 1);
  const song = 4 + (hanVuc ? 1.5 : 0), theo = L.tang >= 5;
  let p = L.dich && L.dich.pos.distanceTo(nv.pos) < 18 * 1.3 ? L.dich.pos.clone() : nv.pos.clone().addScaledVector(h, 6); p.y = 0;
  if (theo) p = nv.pos.clone().addScaledVector(h, 1.2).setY(0);
  baoVong(p.clone().setY(.06), R, .4, BANG);
  ctx.phat('TN_V', { moc: { v0: () => vetKiem(ctx, .1) } });
  if (L.tang >= 4) vfx.troi(TROI_LANH, song + .5, L.tang >= 5 ? .5 : .38);
  // kiếm hồn băng khổng lồ rơi xuống tâm vùng, cắm cùng lúc người tung cắm kiếm (.42)
  const tren = p.clone().setY(13), kh = kiemBang(2.8, { song: song + 1, sang: .9, vet: false });
  const hx = new V3(0, -1, 0), muiL = kh.muiL * .65;
  kh.dat(tren, hx); kh.o.visible = false;
  let tK = 0;
  vfx.them(null, .5, dt => {
    tK += dt; if (tK < .2) return; kh.o.visible = true;
    const u = DK.clamp((tK - .2) / .22, 0, 1), c = theo ? nv.pos.clone().addScaledVector(h, 1.2).setY(0) : p;
    kh.dat(new V3().lerpVectors(tren, c.clone().setY(muiL - .5), u * u).setX(c.x).setZ(c.z), hx);
    if (u >= 1) return false;
  });
  ctx.sau(.42, () => {
    const c = theo ? nv.pos.clone().addScaledVector(h, 1.2).setY(0) : p;
    vfx.vong(c.clone().setY(.1), { bk0: .5, bk1: R, mau: BANG, song: .5, day: .3 });
    chop(c.clone().setY(.6), 3, TRANG_BANG, .25); manhBang(c, 10, 5, .16); dia.vun(c, { so: 10, luc: 3, len: 4, co: .14 }); dia.nut(c, { r: R * .6, nhanh: 6, mau: BANG, song: song });
    dia.gio(c, R + 1.5, 1.2); dia.song(c, { r: R, toc: 14, cao: .12 });
    // chỗ người tung cắm kiếm: mảng băng nhỏ quanh chân (không nối sang vùng)
    bangDat(datY(nv.pos.clone().addScaledVector(nv.toi(), .7)), 1, { lan: .06, song: 1.4, o: .4, cao: .05 });
    rung(.25);
    vungSuong(L, c, R, song, vuKiem, theo, kh);
  });
}
/** vùng sương lạnh: nhịp .55 s sát thương nhẹ. Đại Thành: vòng trụ băng viền; Viên Mãn: trận lục giác + đất băng + cỏ đóng sương; Hoá Cảnh: đi theo người tung, kéo vào tâm, sụp vỡ */
function vungSuong(L, tam0, R, song, vuKiem, theo, kh) {
  const tam = tam0.clone(), g = new T.Group(); let tNhip = 0, tHat = 0;
  const viTam = () => theo ? new V3(L.nv.pos.x, 0, L.nv.pos.z) : tam;
  const bd = L.tang >= 4 ? bangDat(tam, R, { lan: .5, song: song - .1, co: true, bam: theo ? () => tam : null }) : null;
  if (!bd) dia.chay(tam, R, { mau: 0xff8a40, manh: -.3, giu: song });
  if (L.tang >= 2) tuyet(() => tam, R, song, 26);
  // Đại Thành: vòng trụ băng viền (khối voxel đứng suốt vùng)
  const tru = [];
  if (L.tang >= 3) for (let j = 0; j < 10; j++) {
    const gg = j * Math.PI * 2 / 10 + .2, cao = (L.tang >= 4 ? 2.1 : 1.6) * (j % 2 ? .7 : 1);
    const m = new T.Group(); const a = new T.Mesh(GAI, MAT_BANG), v = new T.Mesh(GAI, MAT_VIEN); v.scale.setScalar(1.1); m.add(a, v); a.castShadow = true;
    m.userData = { gg, cao }; m.rotation.set(Math.sin(gg) * -.25, RR(0, 3), Math.cos(gg) * .25); g.add(m); tru.push(m);
  }
  // Viên Mãn: trận lục giác phát sáng dưới đất
  const luc = [];
  if (L.tang >= 4) for (let j = 0; j < 12; j++) { const m = new T.Mesh(HOP, new T.MeshBasicMaterial({ color: BANG.clone().multiplyScalar(1.5), transparent: true, opacity: .7, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false })); g.add(m); luc.push(m); }
  const q = new T.Quaternion();
  vfx.them(g, song + .45, (dt, u, t) => {
    if (theo) tam.lerp(viTam(), DK.clamp(dt * 3, 0, 1));
    if (kh && kh.o.visible && t < song) { kh.dat(tam.clone().setY(kh.muiL * .65 - .5), new V3(0, -1, 0)); }
    const k = DK.clamp(t / .3, 0, 1) * DK.clamp((song + .45 - t) / .45, 0, 1), con = t < song;
    // sương: khối trắng lam nhỏ trôi chậm trong đĩa (Đại Thành dày như mây)
    tHat += dt; const nhip = L.tang >= 3 ? .018 : .03;
    while (tHat >= nhip && con) {
      tHat -= nhip; const gg = RR(0, 6.28), rr = Math.sqrt(Math.random()) * R;
      vfx.hat(tam.clone().add(new V3(Math.cos(gg) * rr, RR(.1, L.tang >= 3 ? 1.5 : 1), Math.sin(gg) * rr)), { so: 1, mau: SUONG.clone().multiplyScalar(.28), toc: .3, co: RR(.18, .4), song: 1.4, trongLuc: -.15, can: 1, dat: false });
    }
    for (const m of tru) { const { gg, cao } = m.userData; m.position.set(tam.x + Math.cos(gg) * R, 0, tam.z + Math.sin(gg) * R); const kk = DK.ease('o', DK.clamp(t / .3, 0, 1)) * (con ? 1 : 0); m.scale.set(.6 * Math.max(.01, kk), cao * Math.max(.01, kk), .6 * Math.max(.01, kk)); }
    if (luc.length) {
      for (let j = 0; j < 6; j++) for (let s = 0; s < 2; s++) {
        const rr = R * (s ? .45 : .82), g0 = j * Math.PI / 3 + t * (s ? -.5 : .3), g1 = g0 + Math.PI / 3;
        const a = tam.clone().add(new V3(Math.cos(g0) * rr, .06, Math.sin(g0) * rr)), b = tam.clone().add(new V3(Math.cos(g1) * rr, .06, Math.sin(g1) * rr));
        const m = luc[j * 2 + s]; m.position.lerpVectors(a, b, .5); m.quaternion.copy(qNhin(new V3().subVectors(b, a), LEN, q)); m.scale.set(.09, .03, a.distanceTo(b)); m.material.opacity = .7 * k;
      }
    }
    if (!con) return;
    tNhip += dt; if (tNhip < NHIP_SUONG) return; tNhip -= NHIP_SUONG;
    vfx.vong(tam.clone().setY(.08), { bk0: R * .2, bk1: R, mau: BANG.clone().multiplyScalar(.6), song: .45, day: .15 });
    let gan = null, kcGan = 1e9;
    for (const o of DK.dsBuNhin) {
      const d = new V3().subVectors(o.pos, tam); d.y = 0; const l = d.length();
      if (l > R + BK_DICH) continue;
      danh(L, o, { manh: 11, diem: ngucDich(o) });
      if (theo && l > .3) { const keo = d.clone().normalize().multiplyScalar(-.6); DK.lap((dt2, tl) => { const kk = Math.exp(-tl * 8); o.pos.addScaledVector(keo, 8 * kk * dt2); return tl < .5; }); }
      if (l < kcGan) { kcGan = l; gan = o; }
    }
    if (vuKiem && gan) kiemRoi(L, gan.pos.clone().setY(0), { r: 1.2, manh: 20, phaBang: true, tRoi: .22, cam: .4, co: 1.2 });
  }, () => {
    // tan vùng: trụ băng vỡ, kiếm hồn tan, đất băng vỡ (Hoá Cảnh: sụp nổ + khung va chạm)
    if (kh) { tia(tam.clone().setY(1.5), 20, TRANG_BANG, 5, .1, .5); kh.huy(); }
    for (const m of tru) { manhBang(m.position.clone().setY(.6), 4, 4, .16); }
    if (bd) bd.vo(theo ? 1.4 : .9);
    if (theo) { vaCham(L, 'dao', BANG); chop(tam.clone().setY(.8), 4, TRANG_BANG, .3); dia.song(tam, { r: R + 2, toc: 16, cao: .25 }); dia.gio(tam, R + 3, 1.6); for (const o of DK.dsBuNhin) if (kcThan(o, tam.clone().setY(.8)) <= R + BK_DICH) danh(L, o, { manh: 30, phaBang: true, lui: 2, diem: ngucDich(o) }); rung(.45); }
  });
}

// ============================================================================ R · THÁI HUYỀN BĂNG PHONG (màu: băng lam)
/** cực quang: 3 dải lụa sáng uốn sóng trên trời phía trước (quad lưới, cộng sáng — Unity: mesh + shader unlit additive) */
function cucQuang(nv, song) {
  const g = new T.Group(), ds = [];
  const f = nv.toi();
  for (let j = 0; j < 3; j++) {
    const N = 48, geo = new T.PlaneGeometry(70, 10, N, 1), C = [];
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); const tren = y > 0; const c = j === 1 ? new T.Color(.45, 1, .85) : new T.Color(.45, .85, 1); const a = tren ? 0 : 1; C.push(c.r * a, c.g * a, c.b * a); }
    geo.setAttribute('color', new T.Float32BufferAttribute(C, 3));
    const m = new T.Mesh(geo, new T.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false, toneMapped: false }));
    m.position.copy(nv.pos).addScaledVector(f, 55 + j * 8).setY(26 + j * 5); m.rotation.y = Math.atan2(f.x, f.z); m.rotation.x = -.35;
    m.userData.x0 = Float32Array.from(pos.array); g.add(m); ds.push(m);
  }
  return vfx.them(g, song, (dt, u, t) => {
    const k = (u < .15 ? u / .15 : u > .75 ? (1 - u) / .25 : 1);
    ds.forEach((m, j) => {
      const P = m.geometry.attributes.position, x0 = m.userData.x0;
      for (let i = 0; i < P.count; i++) { const x = x0[i * 3]; P.array[i * 3 + 2] = Math.sin(x * .09 + t * 1.2 + j * 2) * 6 + Math.sin(x * .23 - t * .8) * 2; P.array[i * 3 + 1] = x0[i * 3 + 1] + Math.sin(x * .05 + t + j) * 2; }
      P.needsUpdate = true; m.material.opacity = .55 * k * (j === 1 ? 1 : .7);
    });
  });
}
/** vầng trăng băng khổng lồ quét vòng (vòng dẹt nở rộng, cộng sáng) */
function vangTrang(p, r, song) {
  const m = new T.Mesh(new T.RingGeometry(.9, 1, 72), new T.MeshBasicMaterial({ color: BANG.clone().multiplyScalar(1.6), transparent: true, opacity: .6, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false }));
  const m2 = new T.Mesh(new T.RingGeometry(.9, 1, 72), new T.MeshBasicMaterial({ color: BANG, transparent: true, opacity: .5, depthWrite: false, side: T.DoubleSide }));
  const g = new T.Group(); g.add(m, m2); g.position.copy(p); g.rotation.x = -Math.PI / 2;
  return vfx.them(g, song, (dt, u) => { const rr = DK.lerp(r * .25, r, DK.ease('o', Math.min(1, u * 2.2))); g.scale.set(rr, rr, 1); m.material.opacity = .6 * (1 - u * u); m2.material.opacity = .3 * (1 - u); });
}
function bangPhong(ctx) {
  const L = lan(ctx, 4, 'bang'), nv = L.nv, h = L.h;
  const vanLy = L.Nhanh('van_ly'), nhatKiem = L.Nhanh('nhat_kiem');
  const R = 9 * (L.tang >= 3 ? 1.15 : 1) * (vanLy ? 1.35 : nhatKiem ? .8 : 1);
  const tam = datY(nv.pos.clone().addScaledVector(h, .75));     // tâm = chỗ mũi kiếm cắm (cố định suốt chiêu)
  baoVong(tam.clone().setY(.03), R, .82, BANG);
  ctx.phat(nhatKiem ? 'TN_RN' : 'TN_R', { moc: { v0: () => vetKiem(ctx, .1), v1: () => vetKiem(ctx, .26) } });
  if (L.tang >= 4) { vfx.troi(L.tang >= 5 ? TROI_DEM : TROI_LANH, 3.8, L.tang >= 5 ? .72 : .55); cucQuang(nv, 3.8); vfx.chu('Thái Huyền Băng Phong', { mau: '#bfe9ff', song: 1.6 }); }
  else if (L.tang >= 2) vfx.troi(TROI_LANH, 2.6, .22);
  // tụ kiếm ý: bông tuyết xoáy về mũi kiếm
  let tTuyet = 0;
  DK.lap((dt, t) => {
    if (t >= .82) return false;
    tTuyet += dt * (L.tang >= 2 ? 50 : 32);
    while (tTuyet >= 1) { tTuyet -= 1; const gg = t * 13 + RR(0, 1), m = nv.mui(); const q = m.clone().add(new V3(Math.cos(gg) * 2.4, Math.sin(gg * .6) * .9 + .3, Math.sin(gg) * 2.4)); const v = new V3().subVectors(m, q); vfx.hat(q, { so: 1, mau: TRANG_BANG, toc: v.length() * 2.2, huong: v, loe: 0, co: .09, song: .42, trongLuc: 0, can: 0, dat: false }); }
  });
  [.25, .5, .72].forEach((t, k) => ctx.sau(t, () => chop(nv.mui(), 1 + k * .6, BANG, .28)));
  if (L.tang >= 2) tuyet(() => tam, R, 2.6, 30);
  const dongBang = []; let bd = null;
  const tChem = 1.56, songGai = tChem - .86;
  // .86 — cắm kiếm: băng phong lan ra từ mũi kiếm, rừng gai, cỏ đóng sương, kẻ trong vùng bị phong băng
  ctx.sau(.86, () => {
    vfx.vong(tam.clone().setY(tam.y + .1), { bk0: .5, bk1: R, mau: BANG, song: .5, day: .5 });
    vfx.vong(tam.clone().setY(tam.y + .14), { bk0: .3, bk1: R * .6, mau: TRANG_BANG, song: .4, day: .3 });
    chop(tam.clone().setY(.5), 3.4, TRANG_BANG, .3);
    dia.ho(tam, .9, .25, { mau: BANG, chay: .2 }); dia.nut(tam, { r: R * .7, nhanh: 10, mau: BANG, song: 3 });
    dia.song(tam, { r: R, toc: R / .35, cao: .22 }); dia.gio(tam, R + 1, 1.3); dia.vun(tam, { so: 16, luc: 4, len: 5, co: .14 });
    bd = bangDat(tam, R, { lan: .35, song: 5, co: true });
    // rừng gai: lan theo sóng (Đại Thành dày + cao hơn)
    const so = L.tang >= 3 ? 34 : 16;
    for (let i = 0; i < so; i++) {
      const gg = RR(0, 6.28), rr = DK.lerp(1.3, R * .95, Math.sqrt(Math.random())), d = new V3(Math.cos(gg), 0, Math.sin(gg));
      gaiBang(tam.clone().addScaledVector(d, rr).setY(0), { huong: d.clone().multiplyScalar(.35).add(LEN), cao: RR(.6, L.tang >= 3 ? 2.2 : 1.4) * (L.tang >= 4 ? 1.2 : 1), rong: RR(.28, .45), song: songGai - rr / R * .35 + .02, tre: rr / R * .35 });
    }
    const tamDanh = tam.clone().setY(tam.y + .8);
    for (const o of DK.dsBuNhin) {
      if (kcThan(o, tamDanh) > R + BK_DICH) continue;
      danh(L, o, { manh: 60, diem: ngucDich(o) });
      if (ganCham(o, GIAY_CHAM, 1)) DK.chuNoi('Đóng băng', o.diem('dau').add(new V3(0, .9, 0)), '#bfe9ff');
      if (coDong(o)) { dongBang.push(o); khoiBang(o); }
    }
    vfx.vienMan(BANG, 1.6, .45); rung(.5);
  });
  // 1.56 — rút kiếm chém (cùng tâm): vỡ toàn bộ
  ctx.sau(tChem, () => {
    let vo = 0;
    const tamC = nguc(nv);
    for (const o of DK.dsBuNhin) {
      if (nhatKiem) { const d = new V3().subVectors(o.pos, tam).setY(0); if (d.length() > R * 1.05 + BK_DICH) continue; }
      else if (kcThan(o, tam.clone().setY(1.2)) > R * 1.05 + BK_DICH) continue;
      const kq = danh(L, o, { manh: 130, len: 2.5, lui: 4, phaBang: true, diem: ngucDich(o), giapVo: nhatKiem });
      if (kq.vo) vo++;
    }
    vaCham(L, 'dao', BANG);
    if (bd) bd.vo(1.6);
    if (nhatKiem) {
      // Nhất Kiếm Toái Không: một nhát bổ dọc xẻ băng thành rãnh thẳng
      const a = datY(nv.pos.clone().addScaledVector(h, .8)), b = datY(nv.pos.clone().addScaledVector(h, R * 1.4));
      dia.ranh(a, b, .9, .5, { mau: BANG }); dia.cat(a, b, 1.5); dia.nut(b, { r: 3, nhanh: 6, mau: BANG, song: 2.5 });
      trangTinh(tamC.clone().addScaledVector(h, 2), h, 4, TRANG_BANG, .5, true);
      for (let k = 0; k < 7; k++) { const q = a.clone().lerp(b, (k + 1) / 8); gaiBang(q.clone().addScaledVector(phaiCua(h), (k % 2 ? 1 : -1) * .7), { huong: phaiCua(h).multiplyScalar(k % 2 ? .5 : -.5).add(LEN), cao: 1.2 + k * .1, rong: .4, song: .55, tre: k * .03 }); }
    } else {
      // vầng trăng băng quét 360°: vòng vệt chém tĩnh quanh thân + vầng trăng khổng lồ (Đại Thành)
      const soVet = L.tang >= 3 ? 10 : 8, r = R * .32;
      for (let k = 0; k < soVet; k++) { const d = xoayY(h, k * 360 / soVet), tiep = new V3().crossVectors(LEN, d); trangTinh(tamC.clone().addScaledVector(d, r), tiep, r * .7, k % 2 ? BANG : TRANG_BANG, .45, false, .1, true); }
      if (L.tang >= 3) vangTrang(tamC.clone().setY(1.1), R * 1.1, .6);
    }
    chop(tamC, 4, TRANG_BANG, .3); tia(tamC, 40, TRANG_BANG, 12, .12, .5);
    dia.song(tam, { r: R * 1.3, toc: 18, cao: .3 }); dia.gio(tam, R * 1.5, 2);
    if (L.tang >= 4) dia.pha(tam, Math.min(R, 9));
    rung(vo > 0 ? .9 : .7, .35);
  });
  // Hoá Cảnh — Băng Phong Vạn Lý: mưa băng kiếm thật lần hai, cắm kín vùng rồi cùng vỡ, cây cối quanh sân gãy
  if (L.tang >= 5) {
    const n = 14;
    for (let k = 0; k < n; k++) ctx.sau(1.78 + k * .045, () => { const gg = k * 137.5 * D, rr = DK.lerp(2, R * .9, Math.sqrt((k + .5) / n)); kiemRoi(L, tam.clone().add(new V3(Math.cos(gg) * rr, 0, Math.sin(gg) * rr)).setY(0), { r: 2, manh: 30, phaBang: true, tRoi: .26, cam: (n - k) * .045 + .45, co: 1.35, gai: k % 2 === 0 }); });
    ctx.sau(1.78 + n * .045 + .74, () => { vaCham(L, 'chop', BANG); dia.pha(tam, R * 1.7); dia.song(tam, { r: R * 1.6, toc: 20, cao: .35 }); dia.gio(tam, R * 2, 2.4); chop(tam.clone().setY(1), 5, TRANG_BANG, .3); rung(.6, .35); });
  }
}

// ============================================================================ ĐĂNG KÝ
DK.dangKyBoNC(MA, {
  yTuong: 'Kiếm pháp trầm và dứt khoát: chân rộng, hạ trọng tâm, mỗi nhát đi tới cuối rồi để lại sương giá đọng theo lưỡi. Một màu mỗi chiêu: Z lam nước, X băng lam, C trắng băng, V sương, R băng lam. ' +
    'Mọi kiếm bay là kiếm thật (thuỷ kiếm trong lòng sóng nước, băng kiếm có chuôi và chắn). Lên tầng thì đổi hình hẳn. Viên Mãn đóng băng mặt đất bằng gạch băng voxel, cỏ phủ sương rồi vỡ, gai băng trồi lên, trời ngả lạnh. Hoá Cảnh có mưa băng kiếm, đất băng vỡ tung, khung va chạm và cây đổ. ' +
    'Sửa 3 lỗi của bản game: đòn trúng giờ khớp đúng nhát vung, R cắm kiếm và chém vòng cùng một tâm, X Đại Thành xoay một vòng rồi mới phóng.',
  moTaChieu: {
    th_thuy_nguyet: 'Hai nhát chém chéo thật (mốc .28/.52 khớp vung), mỗi nhát thả trăng nước bọc một thuỷ kiếm. T2: bọt nước. T3: ba lớp sóng. T4 Viên Mãn: nước rỏ ướt đất dọc đường, cỏ rạp, chỗ trúng nổ vòng nước và sóng đất, trời lạnh. T5: một nhát quét xoay tung dải sông bạc 7 lớp, 5 thuỷ kiếm cưỡi sóng, xẻ rãnh nước 30 m, cắt cỏ, phá đèn và cây trên đường, có khung va chạm. Nhánh Liên Ba: 5 thuỷ kiếm nhỏ toả quạt. Nhánh Thuỷ Tiễn: một thuỷ kiếm lớn xoáy, có vòng nước xoắn.',
    th_han_bang: 'Giơ kiếm ngưng băng kiếm thật sau lưng (mọc từ sương), chỉ kiếm phóng lần lượt, mỗi thanh có tia ngắm 0,15 s rồi đuổi. Trượt thì cắm xuống đất kèm mảng băng. T2: vệt tuyết. T3: 5 thanh xoay trọn một vòng quanh người rồi mới phóng (sửa lỗi bản game không xoay). T4: kiếm dài ×1,75, trúng thì nở 6 gai băng và đất đóng băng. T5: trời tối, 12 băng kiếm rơi xoáy ốc cắm quanh mục tiêu rồi vỡ cùng lúc, có khung va chạm. Nhánh Băng Luân: kiếm thật xoay quanh thân, đất dưới chân phủ băng. Nhánh Truy Hàn: 2 thanh lớn đuổi gắt.',
    th_toai_bang: 'Thu thế, lướt thấp kéo kiếm sau lưng (để băng ảnh), rồi chém ngang 120° có xoay hông, trúng đúng mốc .4. Đích đóng băng thì khối băng nổ, có khung va chạm. T2: vệt sương băng trên đường lướt, vệt chém 2 lớp, mảnh băng văng. T3: ba trụ băng voxel mọc dọc đường kiếm rồi vỡ. T4: cả mặt quạt đóng băng, hàng gai băng nở theo vành quạt, nứt băng, cỏ trong quạt gãy. T5: vỡ băng dây chuyền, cây và đèn đá trong quạt gãy đổ.',
    th_han_vu: 'Nhún nhảy rồi cắm kiếm một tay (mốc .42). Cùng lúc một kiếm hồn băng khổng lồ rơi từ trời cắm vào tâm vùng; vùng không nối về người. T1: sương lạnh và đất ngả trắng. T2: tuyết rơi. T3: vòng 10 trụ băng ở viền, sương dày như mây. T4: trận lục giác phát sáng xoay, đất lát gạch băng, cỏ đóng sương, hết giờ thì băng vỡ và cỏ gãy. T5: vùng đi theo người, kéo địch vào tâm, cuối cùng sụp nổ có khung va chạm. Nhánh Vụ Ẩn Kiếm: mỗi nhịp một băng kiếm thật rơi chém kẻ gần tâm.',
    th_bang_phong: 'Ngửa người tụ tuyết vào mũi kiếm, bật nhảy rồi cắm kiếm (.86). Băng phong lan 9 m thành đất băng voxel, rừng gai, cỏ đóng sương, kẻ địch bị phong trong khối băng. Đến 1,56 rút kiếm chém xoay 360° tại cùng tâm: mọi thứ vỡ, có khung va chạm. T2: tuyết cuốn. T3: rừng gai dày và cao, vầng trăng băng khổng lồ. T4: trời tối lam, cực quang, chữ chiêu, đèn đá trong vùng vỡ. T5: 14 băng kiếm thật mưa xuống cắm kín vùng rồi vỡ lần hai, cây quanh sân gãy đổ. Nhánh Nhất Kiếm: bổ dọc xẻ rãnh băng, phá giáp.',
  },
  tuThe: [],
  theThu: 'TN_THU',
  soNhat: COMBO.length,
  danh: danhThuong,
  lon: lonNe,
  chieu: {
    th_thuy_nguyet: thuyNguyet,
    th_han_bang: hanBang,
    th_toai_bang: toaiBang,
    th_han_vu: hanVu,
    th_bang_phong: bangPhong,
  },
});
})();
