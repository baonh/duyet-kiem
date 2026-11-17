"use strict";
// ============================================================================
// vu_khi.js — 2026-11-14 — PHẦN NHÌN + KỸ NĂNG của VŨ KHÍ KIẾM theo PHẨM × CẤP +N (port từ Unity, đợt 18–19).
// Nguồn (chỉ đọc): VFX/VuKhi/HaoQuangVuKhi.cs · HieuUngVuKhi.cs · VetVuKhi.cs · HatVuKhi.cs · KhoDo/PhamCap.cs ·
//   ChienDau/KyNangVuKhi.cs · KyNangVuKhiBang.cs · KyNangVuKhiChay.cs · NhanVat/NhanVatKhoi.cs (DungVuKhi: quầng lưỡi) ·
//   VFX/Soul/SoulVetMuc.cs + Resources/Soul/SoulVetChem.shader (vệt mực nhiều sợi) · Resources/VuKhi/LinhVanVuKhi.shader ·
//   DieuKhien.cs (phím Khí Linh) · DuyetChieu/PhongDuyetVuKhi.cs.
// Đơn vị: số trong code Unity là GIÂY THẬT ⇒ ở đây chạy đồng hồ thật riêng (dtThat = dt mô phỏng / DK.NHIP_GOC).
// Hệ trục: web/HTML = Unity soi gương trục x ⇒ Quaternion.AngleAxis(a, n) của Unity = xoay −a quanh n ở đây; Vector3.Cross = −cross.
// ============================================================================
(function () {
const DK = window.DK, T = DK.T, V3 = DK.V3, D = DK.D, nc = DK.nc, vfx = DK.vfx, scene = DK.scene, R = DK.NHIP_GOC;
const clamp = DK.clamp, lerp = DK.lerp, c01 = x => clamp(x, 0, 1);
const ngau = (a, b) => a + Math.random() * (b - a);
const trongCau = () => { let v; do v = new V3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1); while (v.lengthSq() > 1); return v; };
const tren = () => { const v = trongCau(); return v.lengthSq() < 1e-6 ? new V3(0, 1, 0) : v.normalize(); };
const LEN = new V3(0, 1, 0);
/** Quaternion.AngleAxis(goc, truc) * v của Unity ⇒ hệ web (gương x) */
const aaU = (goc, truc, v) => v.clone().applyAxisAngle(truc.clone().normalize(), -goc * D);
/** Vector3.Cross(a, b) của Unity ⇒ hệ web */
const crossU = (a, b) => new V3().crossVectors(a, b).negate();
const hen = (giayThat, fn) => DK.sau(giayThat * R, fn);
const bao = e => { console.error(e); DK.baoLoi(e); };

// ---------------------------------------------------------------- PhamCap.cs
const PHAM_MA = ['pham', 'linh', 'bao', 'huyen', 'tien', 'than'];
const PHAM_TEN = ['Phàm Khí', 'Linh Khí', 'Bảo Khí', 'Huyền Khí', 'Tiên Khí', 'Thần Khí'];
const PHAM = 0, LINH = 1, BAO = 2, HUYEN = 3, TIEN = 4, THAN = 5;
const tuMa = ma => Math.max(0, PHAM_MA.indexOf(ma));
const MOC_1 = 5, MOC_KK = 7, MOC_2 = 10;                       // KyNangVuKhiBang.cs
const heSoPham = p => 1 + 0.08 * clamp(p, 0, 5);
const heSoNoiTai = p => 0.9 + 0.05 * clamp(p, 0, 5);

// ---------------------------------------------------------------- SoulThamSo.cs
const C = (r, g, b) => new T.Color(r, g, b);
const MAU_MUC = C(0.02, 0.015, 0.018), MAU_DO = C(0.78, 0.02, 0.05), MAU_SANG = C(0.95, 0.92, 0.92), MAU_TIA_LUA = C(1, 0.93, 0.82), MAU_BUI = C(0.32, 0.31, 0.31);
const SOUL = { SoSoi: 14, TiLeDo: 0.36, TiLeHo: 0.16, TiLeTrang: 0.08, DoXo: 0.55, DuoiMong: 0.22, CoO: 0.06, DoDaiDuoi: 0.85, SongVet: 0.16, TanVet: 0.14, CoHat: 0.07, TrongLucHat: 14 };
const VANG_KIM = C(1, 0.8, 0.34);

// ---------------------------------------------------------------- màu (HieuUngVuKhi.cs)
function hsv(c) { const mx = Math.max(c.r, c.g, c.b), mn = Math.min(c.r, c.g, c.b), d = mx - mn; let h = 0;
  if (d > 1e-6) { if (mx === c.r) h = ((c.g - c.b) / d) % 6; else if (mx === c.g) h = (c.b - c.r) / d + 2; else h = (c.r - c.g) / d + 4; h /= 6; if (h < 0) h += 1; }
  return { h, s: mx > 0 ? d / mx : 0, v: mx }; }
function tuHsv(h, s, v) { const i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  switch (((i % 6) + 6) % 6) { case 0: return C(v, t, p); case 1: return C(q, v, p); case 2: return C(p, v, t); case 3: return C(p, q, v); case 4: return C(t, p, v); default: return C(v, p, q); } }
/** MauNhan: giữ sắc, s × 1,12, kẹp độ sáng 0,45..0,9 */
function mauNhan(thanh) { const x = hsv(thanh); return tuHsv(x.h, c01(x.s * 1.12), clamp(x.v, 0.45, 0.9)); }
/** MauLopPham (đợt 19): Phàm/Linh = màu nhấn; Bảo +22 % · Huyền +34 % · Tiên +42 % sáng (Tiên ánh kim); Thần = vàng kim */
function mauLopPham(thanh, p) {
  const nhan = mauNhan(thanh);
  if (p >= THAN) return VANG_KIM.clone();
  if (p < BAO) return nhan;
  const k = p >= TIEN ? 0.42 : p >= HUYEN ? 0.34 : 0.22; const x = hsv(nhan);
  let c = tuHsv(x.h, c01(x.s * (1 - k * 0.55)), c01(x.v + (1 - x.v) * k + k * 0.15));
  if (p >= TIEN) c = c.lerp(C(1, 0.93, 0.74), 0.18);
  return c;
}
const NT_HOA = 1, NT_BANG = 2, NT_LOI = 3, NT_MOC = 4, NT_KIM = 5, TEN_NT = ['', 'Hoả', 'Băng', 'Lôi', 'Mộc', 'Kim'];
function nguyenTo(thanh) { const x = hsv(thanh); if (x.s < 0.22) return NT_KIM; const d = x.h * 360;
  if (d < 40 || d >= 330) return NT_HOA; if (d < 70) return NT_KIM; if (d < 160) return NT_MOC; if (d < 235) return NT_BANG; return NT_LOI; }

// ---------------------------------------------------------------- TrangBiVK của vũ khí đang cầm (HieuUngVuKhi.TuMa)
let tb = { coVuKhi: false };
function docTrangBi() {
  const vk = nc.vk; const cap = clamp((DK.chon && DK.chon.cap) | 0, 0, 10);
  if (!vk) { tb = { coVuKhi: false, nangCap: cap }; return; }
  const p = tuMa(vk.pham), thanh = new T.Color(vk.mau_hex || '#ffffff');
  const t = { coVuKhi: true, ma: vk.ma, vk, pham: p, nangCap: cap, mauLuoi: thanh };
  t.nhan = mauNhan(thanh); t.mauP = mauLopPham(thanh, p); t.nt = nguyenTo(thanh);
  // ApVetLoi
  const n = cap;
  t.c = { mauMuc: MAU_MUC.clone(), mauNhan: t.nhan.clone(), mauPham: t.mauP.clone(), mauSang: MAU_SANG.clone().lerp(t.nhan, 0.15), soSoi: SOUL.SoSoi,
    tiLeNhan: SOUL.TiLeDo, tiLeTrang: SOUL.TiLeTrang, heSoRong: 1, lopSang: 0 };
  if (n >= 3) { Object.assign(t.c, { heSoRong: 1.18, soSoi: SOUL.SoSoi + 4, lopSang: 1, tiLeTrang: 0.14, tiLeNhan: Math.min(0.5, SOUL.TiLeDo + 0.06) }); t.c.mauSang = MAU_SANG.clone().lerp(t.nhan, 0.4); }
  Object.assign(t.c, { vien: p >= BAO, hat: p >= TIEN ? 1 : p >= BAO ? 0.6 : 0, lopTre: p >= HUYEN, tiaVang: p >= TIEN, anhKhongLo: p >= THAN, hatNguyenTo: n >= 7, nguyenTo: t.nt });
  tb = t;
}
const coKhi = () => tb.coVuKhi && (tb.nangCap >= 5 || tb.pham >= HUYEN);
const coVan = () => tb.coVuKhi && tb.nangCap >= 10;
const coVong = () => tb.coVuKhi && tb.pham >= THAN;
const coVetTuDong = () => tb.coVuKhi && (tb.pham >= LINH || tb.nangCap >= 3);
/** bộ Soul của game tự vẽ vệt qua HieuUngVuKhi.ApVet (có lớp phẩm): trong 5 bộ HTML chỉ Huyết Nguyệt là bộ Soul */
const laSoul = () => (DK.chon && DK.chon.bo === 'huyet_nguyet') || !!(DK.VKH && DK.VKH.epSoul);

// ================================================================ HẠT VOXEL màu tự do (HatVuKhi.cs) — đồng hồ thật
const HAT = (function () {
  const MAX = 1600, geo = new T.BoxGeometry(1, 1, 1);
  { const n = geo.attributes.position.count, nor = geo.attributes.normal, col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const k = nor.getY(i) > .5 ? 1 : nor.getY(i) < -.5 ? .62 : Math.abs(nor.getX(i)) > .5 ? .84 : .74; col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = k; }
    geo.setAttribute('color', new T.BufferAttribute(col, 3)); }
  const mat = new T.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  const im = new T.InstancedMesh(geo, mat, MAX); im.instanceMatrix.setUsage(T.DynamicDrawUsage); im.frustumCulled = false; im.count = 0;
  im.instanceColor = new T.InstancedBufferAttribute(new Float32Array(MAX * 3), 3); scene.add(im);
  const ds = []; const m4 = new T.Matrix4(), q = new T.Quaternion(), s = new V3(), z = new V3(0, 0, 1), vv = new V3();
  return {
    them(p, v, co, mau, song, g, keo, can, sang) {
      if (ds.length >= MAX) ds.splice((Math.random() * ds.length) | 0, 1);
      const c = mau.clone().multiplyScalar(sang || 1); c.r = Math.min(c.r, 1.4); c.g = Math.min(c.g, 1.4); c.b = Math.min(c.b, 1.4); c.convertSRGBToLinear();
      ds.push({ p: p.clone(), v: v.clone(), co, c, song: Math.max(0.05, song), tuoi: 0, g: g != null ? g : 8, keo: keo || 0, can: can != null ? can : 1,
        q: new T.Quaternion().setFromEuler(new T.Euler(Math.random() * 6.3, Math.random() * 6.3, Math.random() * 6.3)), truc: tren(), quay: ngau(-420, 420) * D });
    },
    xoa() { ds.length = 0; im.count = 0; },
    buoc(d) {
      let n = 0;
      for (let i = ds.length - 1; i >= 0; i--) {
        const h = ds[i]; h.tuoi += d; if (h.tuoi >= h.song) { ds[i] = ds[ds.length - 1]; ds.pop(); continue; }
        h.v.y -= h.g * d; h.v.multiplyScalar(Math.exp(-h.can * d)); h.p.addScaledVector(h.v, d);
        h.q.premultiply(new T.Quaternion().setFromAxisAngle(h.truc, h.quay * d));
        const k = h.tuoi / h.song, co = h.co * (k < 0.7 ? 1 : k < 0.82 ? 0.7 : k < 0.92 ? 0.45 : 0.25);   // co 3 nấc kiểu ô vuông
        if (h.keo > 0 && h.v.lengthSq() > 0.01) { q.setFromUnitVectors(z, vv.copy(h.v).normalize()); s.set(co * .6, co * .6, co + h.v.length() * h.keo); m4.compose(h.p, q, s); }
        else { s.set(co, co, co); m4.compose(h.p, h.q, s); }
        im.setMatrixAt(n, m4); im.instanceColor.setXYZ(n, h.c.r, h.c.g, h.c.b); n++;
      }
      im.count = n; im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true;
    },
  };
})();
const hatThem = (p, v, co, mau, song, g = 8, keo = 0, can = 1, sang = 1) => HAT.them(p, v, co, mau, song, g, keo, can, sang);
/** HatVuKhi.No — chùm theo hướng (nón mở tan 0..1) */
function hatNo(p, huong, so, tMin, tMax, tan, mau, co, song, g = 8, keo = 0, sang = 1) {
  const h = huong.lengthSq() < 1e-6 ? LEN.clone() : huong.clone().normalize();
  for (let i = 0; i < so; i++) { const d = h.clone().lerp(tren(), tan * Math.random()).normalize();
    hatThem(p.clone().add(trongCau().multiplyScalar(co)), d.multiplyScalar(ngau(tMin, tMax)), co * ngau(0.6, 1.2), mau, song * ngau(0.7, 1.2), g, keo, 1, sang); }
}
/** HatVuKhi.NguyenTo (+7) */
function hatNguyenTo(nt, p, huong, mau, hs = 1) {
  const h = huong.clone();
  switch (nt) {
    case NT_HOA: hatThem(p, h.multiplyScalar(ngau(.3, 1)).add(new V3(0, ngau(.8, 1.8), 0)).add(trongCau().multiplyScalar(.4)), .035 * hs, mau.clone().lerp(C(1, .55, .15), .35), ngau(.45, .8), -2.2, 0, 1.6, 1.25); break;
    case NT_BANG: hatThem(p, h.multiplyScalar(ngau(.5, 1.4)).add(trongCau().multiplyScalar(.5)), .04 * hs, mau.clone().lerp(C(1, 1, 1), .45), ngau(.4, .7), 11, .035, .8, 1.1); break;
    case NT_LOI: hatThem(p, tren().multiplyScalar(ngau(5, 9)), .022 * hs, mau.clone().lerp(C(1, 1, 1), .35), ngau(.08, .16), 0, .022, 6, 1.35); break;
    case NT_MOC: hatThem(p, h.multiplyScalar(ngau(.2, .6)).add(new V3(ngau(-.4, .4), ngau(.1, .5), ngau(-.4, .4))), .04 * hs, mau, ngau(.7, 1.1), .8, 0, 1.2, 1); break;
    default: hatThem(p.clone().add(trongCau().multiplyScalar(.05)), trongCau().multiplyScalar(.25), .028 * hs, mau.clone().lerp(C(1, 1, 1), .5), ngau(.18, .32), 0, 0, 3, 1.4);
  }
}
/** SoulVoxel.Bui — bụi đá ô vuông */
function bui(pos, r, so) { for (let i = 0; i < so; i++) { const a = Math.random() * 6.283, x = Math.random() * r * .6; const p = pos.clone().add(new V3(Math.cos(a) * x, .05, Math.sin(a) * x));
  hatThem(p, new V3(Math.cos(a) * ngau(.6, 1.6), ngau(.8, 2), Math.sin(a) * ngau(.6, 1.6)), ngau(.06, .11), MAU_BUI, ngau(.5, .9), 3, 0, 2, 1); } }
/** SoulVFX.MucDat — vết mực trên đất (kieu 1 = vòng, 0 = loang). co = đường kính (m), song = giây thật. Gần đúng (game dùng shader riêng). */
function mucDat(pos, co, kieu, song, mo = .75) {
  const r = co / 2, g = kieu === 1 ? new T.RingGeometry(r * .82, r, 48) : new T.CircleGeometry(r, 40);
  const m = new T.Mesh(g, new T.MeshBasicMaterial({ color: MAU_MUC, transparent: true, opacity: mo, depthWrite: false, side: T.DoubleSide }));
  m.rotation.x = -Math.PI / 2; m.position.set(pos.x, .025, pos.z); m.renderOrder = 5;
  vfx.them(m, Math.max(.15, song + .25) * R, (dt, u) => { const k = Math.min(1, u * 5); m.scale.setScalar(.35 + .65 * (1 - Math.pow(1 - k, 3))); m.material.opacity = mo * (u > .6 ? (1 - u) / .4 : 1); });
}

// ================================================================ VỆT MỰC NHIỀU SỢI (SoulVetMuc.cs + SoulVetChem.shader)
const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const FS_VET = `
uniform vec3 uMuc, uDo, uSang; uniform float uDau, uDuoi, uTan, uHat, uSoSoi, uTiLeDo, uTiLeHo, uTiLeTrang, uDoXo, uDuoiMong, uCoO, uDai, uRong, uMo;
varying vec2 vUv;
float B1(float n){ return fract(sin(n * 12.9898 + 4.1414) * 43758.5453); }
float B2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main(){
  float u = vUv.x, v = vUv.y; float dai = max(uDau - uDuoi, 1e-3);
  vec2 soO = max(vec2(uDai, uRong) / max(uCoO, 1e-3), vec2(1.0)); vec2 o = floor(vec2(u, v) * soO);
  float uq = (o.x + 0.5) / soO.x; float s = (u - uDuoi) / dai, sq = (uq - uDuoi) / dai;
  if (s < 0.0 || sq < 0.0) discard;
  float w = mix(uDuoiMong, 1.0, sqrt(clamp(sq, 0.0, 1.0)));
  float rang = (B1(o.x * 1.37 + uHat) - 0.5) * 0.16; float v0 = 1.0 - w + rang * w;
  if (v < v0) discard;
  float vb = clamp((v - v0) / max(1.0 - v0, 1e-3), 0.0, 1.0);
  if (u > uDau - (1.0 - vb) * 0.035 * dai) discard;
  float k = floor(vb * uSoSoi), fk = fract(vb * uSoSoi);
  float r1 = B1(k + uHat * 7.13), r2 = B1(k * 3.71 + uHat), r3 = B1(k * 9.17 + uHat * 2.3);
  if (r1 < uTiLeHo && k > 0.0) discard;
  if (fk < 0.1 && r1 < 0.6) discard;
  if (sq < r3 * uDoXo) discard;
  float kho = B2(o + uHat * 1.3); if (kho < (1.0 - sq) * 0.42 * uDoXo) discard;
  float hTan = B2(o * 1.71 + 3.1 + uHat); if (uTan > 0.0 && hTan * 0.7 + clamp(sq, 0.0, 1.0) * 0.3 < uTan) discard;
  float pDo = uTiLeDo * (1.35 - abs(vb - 0.5) * 1.6);
  vec3 c = r2 < pDo ? uDo : uMuc;
  float ganDau = clamp((s - 0.9) / 0.1, 0.0, 1.0); c = mix(c, uDo, ganDau * 0.75 * step(0.3, vb));
  if (r2 > 1.0 - uTiLeTrang && fk > 0.3 && fk < 0.62) c = uSang;
  if (vb > 0.94) c = uMuc;
  gl_FragColor = vec4(c, uMo);
}`;
function matVet(o) {
  return new T.ShaderMaterial({
    uniforms: { uMuc: { value: (o.mauMuc || MAU_MUC).clone() }, uDo: { value: (o.mauNhan || MAU_DO).clone() }, uSang: { value: (o.mauSang || MAU_SANG).clone() },
      uDau: { value: 1 }, uDuoi: { value: 0 }, uTan: { value: 0 }, uHat: { value: Math.random() * 97 }, uSoSoi: { value: o.soSoi || SOUL.SoSoi }, uTiLeDo: { value: o.tiLeDo != null ? o.tiLeDo : SOUL.TiLeDo },
      uTiLeHo: { value: o.tiLeHo != null ? o.tiLeHo : SOUL.TiLeHo }, uTiLeTrang: { value: o.tiLeTrang != null ? o.tiLeTrang : SOUL.TiLeTrang }, uDoXo: { value: o.doXo != null ? o.doXo : SOUL.DoXo },
      uDuoiMong: { value: o.duoiMong || SOUL.DuoiMong }, uCoO: { value: o.coO || SOUL.CoO }, uDai: { value: 1 }, uRong: { value: .3 }, uMo: { value: o.mo != null ? o.mo : 1 } },
    vertexShader: VS, fragmentShader: FS_VET, transparent: true, depthWrite: false, side: T.DoubleSide, toneMapped: false,
  });
}
/** tuỳ chọn mặc định (SoulVetMuc.MacDinh) — thời gian = giây thật */
const macDinh = (r0, r1, tgQuet) => ({ r0, r1, tgQuet: Math.max(0.01, tgQuet), tgSong: SOUL.SongVet, tgTan: SOUL.TanVet, doDai: SOUL.DoDaiDuoi, soSoi: SOUL.SoSoi, tiLeDo: SOUL.TiLeDo,
  doXo: SOUL.DoXo, duoiMong: SOUL.DuoiMong, mo: 1, non: 0, xoan: 0, vanToc: null, camToc: 0, hienNgay: false });

const dsVet = [];
/** SoulVetMuc.Dai — dải ngoai[i] / trong[i] (thế giới). Trả vệt v (v.c = cấu hình theo dõi của VetVuKhi nếu có). */
function vetDai(ngoai, trong, o) {
  const n = ngoai.length; if (n < 2 || trong.length !== n) return null;
  const goc = ngoai[0].clone();
  const P = new Float32Array(n * 6), UV = new Float32Array(n * 4), I = [];
  let dai = 0, rongTB = 0;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1), a = trong[i].clone().sub(goc), b = ngoai[i].clone().sub(goc);
    P.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6); UV.set([u, 0, u, 1], i * 4);
    if (i > 0) dai += ngoai[i].distanceTo(ngoai[i - 1]); rongTB += ngoai[i].distanceTo(trong[i]);
    if (i < n - 1) { const k = i * 2; I.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(P, 3)); g.setAttribute('uv', new T.BufferAttribute(UV, 2)); g.setIndex(I);
  const mat = matVet(o); const m = new T.Mesh(g, mat); m.position.copy(goc); m.frustumCulled = false; m.renderOrder = 12; scene.add(m);
  const v = { m, u: mat.uniforms, goc: m.position, ngoai: ngoai.map(p => p.clone().sub(goc)), trong: trong.map(p => p.clone().sub(goc)), daiCung: Math.max(.1, dai), rong: Math.max(.05, rongTB / n),
    t: 0, tgQuet: Math.max(.01, o.tgQuet), tgSong: Math.max(0, o.tgSong), tgTan: Math.max(.02, o.tgTan), doDai: clamp(o.doDai > 0 ? o.doDai : SOUL.DoDaiDuoi, .05, 1.5),
    hienNgay: !!o.hienNgay, vanToc: o.vanToc ? o.vanToc.clone() : null, camToc: o.camToc || 0, song: true, theo: null };
  v.u.uDai.value = v.daiCung; v.u.uRong.value = v.rong;
  datDauDuoi(v);
  dsVet.push(v); return v;
}
function datDauDuoi(v) {
  let dau, duoi, tan = 0; const tq = v.tgQuet, ts = v.tgSong;
  if (v.hienNgay) { dau = 1; duoi = 0; if (v.t > tq + ts) tan = (v.t - tq - ts) / v.tgTan; }
  else if (v.t < tq) { const x = v.t / tq, e = 1 - Math.pow(1 - x, 4); dau = Math.max(.001, e); duoi = dau - v.doDai; }
  else { dau = 1; const k = c01((v.t - tq) / Math.max(.01, ts + v.tgTan)); duoi = lerp(1 - v.doDai, 1 - v.doDai * .35, k); if (v.t > tq + ts) tan = (v.t - tq - ts) / v.tgTan; }
  v.u.uDau.value = dau; v.u.uDuoi.value = duoi; v.u.uTan.value = c01(tan); return tan;
}
function huyVet(v) { v.song = false; scene.remove(v.m); v.m.geometry.dispose(); v.m.material.dispose(); }
function buocVet(d) {
  for (let i = dsVet.length - 1; i >= 0; i--) {
    const v = dsVet[i]; v.t += d;
    if (v.vanToc) { v.goc.addScaledVector(v.vanToc, d); if (v.camToc > 0) v.vanToc.multiplyScalar(Math.exp(-v.camToc * d)); }
    const tan = datDauDuoi(v);
    if (v.theo) try { theoBuoc(v, d); } catch (e) { bao(e); v.theo = null; }
    if (tan >= 1) { huyVet(v); dsVet.splice(i, 1); }
  }
}
/** SoulVetMuc.Cung — cung quanh tam, bắt đầu từ huong0, quay `goc` độ quanh phap (AngleAxis Unity) */
function vetCungTho(tam, huong0, phap, goc, o) {
  phap = phap.lengthSq() > 1e-6 ? phap.clone().normalize() : LEN.clone();
  let h = huong0.clone().projectOnPlane(phap); if (h.lengthSq() < 1e-6) h = crossU(phap, new V3(1, 0, 0)); h.normalize();
  const r1 = o.r0 + (o.r1 - o.r0), n = clamp(Math.ceil(Math.abs(goc) / 3.5), 12, 160), ng = [], tr = [];
  for (let i = 0; i < n; i++) { const u = i / (n - 1), d = aaU(goc * u, phap, h), nang = phap.clone().multiplyScalar(o.xoan * u);
    tr.push(tam.clone().addScaledVector(d, o.r0).add(nang)); ng.push(tam.clone().addScaledVector(d, r1).add(nang).addScaledVector(phap, o.non)); }
  return vetDai(ng, tr, o);
}
/** SoulVetMuc.Thang — nét thẳng a → b, rộng `rong` theo `ngang` */
function vetThangTho(a, b, ngang, rong, o) {
  ngang = ngang.lengthSq() > 1e-6 ? ngang.clone().normalize() : LEN.clone(); const ng = [], tr = [];
  for (let i = 0; i < 16; i++) { const p = a.clone().lerp(b, i / 15); tr.push(p.clone().addScaledVector(ngang, -rong / 2)); ng.push(p.clone().addScaledVector(ngang, rong / 2)); }
  return vetDai(ng, tr, o);
}

// ---------------------------------------------------------------- VetVuKhi.cs: nhuộm + lớp phẩm / mốc cho vệt mực
const cfgCopy = c => Object.assign({}, c, { mauMuc: c.mauMuc.clone(), mauNhan: c.mauNhan.clone(), mauPham: c.mauPham.clone(), mauSang: c.mauSang.clone() });
function nhuom(v, c) { v.u.uDo.value.copy(c.mauNhan); v.u.uMuc.value.copy(c.mauMuc); v.u.uSang.value.copy(c.mauSang); v.u.uTiLeTrang.value = c.tiLeTrang; }
function theoDoi(v, c, coLop) {
  if (!v) return; nhuom(v, c);
  v.theo = { c, laLop: !coLop, treLop: coLop && c.lopTre ? .045 : -1, tichHat: 0, tichNT: 0, daTia: false, daTan: false };
  if (coLop) { if (c.vien) veVien(v, .012, .06, c.mauPham, 1); if (c.tiaVang) veVien(v, -.42, -.36, c.mauPham, .85); }
}
/** dải mảnh theo mép ngoài: a, b = phần bề rộng tính từ mép ngoài (âm = vào trong, nhân bề rộng) */
function veVien(v, a, b, mau, mo) {
  const n = v.ngoai.length; if (n < 2) return; const ng = [], tr = [];
  for (let i = 0; i < n; i++) { let d = v.ngoai[i].clone().sub(v.trong[i]); let r = d.length(); if (r < 1e-4) { d = LEN.clone(); r = .3; } else d.divideScalar(r);
    const da = a < 0 ? a * r : a, db = b < 0 ? b * r : b; tr.push(v.goc.clone().add(v.ngoai[i]).addScaledVector(d, da)); ng.push(v.goc.clone().add(v.ngoai[i]).addScaledVector(d, db)); }
  const o = macDinh(0, 0, v.tgQuet); Object.assign(o, { tgSong: v.tgSong * .85, tgTan: v.tgTan, doDai: v.doDai, soSoi: 3, tiLeDo: .9, doXo: .35, duoiMong: .6, mo, vanToc: v.vanToc, camToc: v.camToc, hienNgay: v.hienNgay });
  const x = vetDai(ng, tr, o); if (!x) return;
  const c = cfgCopy(v.theo.c); c.mauNhan = mau.clone(); c.mauMuc = MAU_MUC.clone().lerp(mau, .35); c.mauSang = mau.clone().lerp(C(1, 1, 1), .5); c.tiLeTrang = .25;
  theoDoi(x, c, false);
}
function lopTre(v) {
  const n = v.ngoai.length; if (n < 2 || !v.song) return; const ng = [], tr = [];
  for (let i = 0; i < n; i++) { const d = v.ngoai[i].clone().sub(v.trong[i]); tr.push(v.goc.clone().add(v.trong[i]).addScaledVector(d, .5)); ng.push(v.goc.clone().add(v.ngoai[i]).addScaledVector(d, .12)); }
  const o = macDinh(0, 0, v.tgQuet * 1.1); Object.assign(o, { tgSong: v.tgSong * .8, tgTan: v.tgTan, doDai: v.doDai * .8, soSoi: 7, tiLeDo: .55, doXo: .7, duoiMong: .3, mo: .75, vanToc: v.vanToc, camToc: v.camToc });
  const x = vetDai(ng, tr, o); if (!x) return;
  const c = cfgCopy(v.theo.c); c.mauNhan = c.mauPham.clone(); c.tiLeTrang = .04; theoDoi(x, c, false);
}
function tia(v) {
  const n = v.ngoai.length; if (n < 2) return; const so = (ngau(3, 6)) | 0, c0 = v.theo.c;
  for (let k = 0; k < so; k++) {
    const i = (ngau(n / 4, n)) | 0, p = v.goc.clone().add(v.ngoai[i]);
    let d = v.ngoai[i].clone().sub(v.trong[i]).normalize(); if (d.lengthSq() < .5) d = LEN.clone();
    d = d.add(trongCau().multiplyScalar(.25)).normalize();
    const dai = ngau(.45, .9), nhin = p.clone().sub(DK.cam.position).normalize(), ngang = crossU(d, nhin);
    const o = macDinh(0, 0, .05); Object.assign(o, { tgSong: .06, tgTan: .1, soSoi: 2, tiLeDo: 1, doXo: .2, duoiMong: .25 });
    const x = vetThangTho(p, p.clone().addScaledVector(d, dai), ngang, .035, o); if (!x) continue;
    const c = cfgCopy(c0); c.mauNhan = c0.mauPham.clone(); c.mauMuc = MAU_MUC.clone().lerp(c0.mauPham, .5); c.tiLeTrang = 0; theoDoi(x, c, false);
  }
}
function raHat(v) {
  const n = v.ngoai.length; if (n < 2) return; const c = v.theo.c;
  const so = clamp(Math.round(v.daiCung * 3), 3, 26);
  for (let k = 0; k < so; k++) {
    const u = ngau(.25, 1), i = Math.min(n - 2, Math.floor(u * (n - 1)));
    const p = v.goc.clone().add(v.ngoai[i].clone().lerp(v.ngoai[i + 1], Math.random())), tt = v.ngoai[i + 1].clone().sub(v.ngoai[i]).normalize();
    const vel = tt.multiplyScalar(ngau(.6, 2.2)).add(trongCau().multiplyScalar(.6)); if (v.vanToc) vel.addScaledVector(v.vanToc, .4);
    const nhan = Math.random() < Math.max(.3, c.tiLeNhan);
    hatThem(p, vel, SOUL.CoHat * ngau(.5, 1), nhan ? c.mauNhan : c.mauMuc, ngau(.35, .7), SOUL.TrongLucHat * .35, 0, 1.5);
    if (c.hatNguyenTo && k % 3 === 0) hatNguyenTo(c.nguyenTo, p, v.ngoai[i + 1].clone().sub(v.ngoai[i]).normalize(), c.mauNhan);
  }
}
/** VetVuKhi.CapNhat cho một vệt đang theo */
function theoBuoc(v, d) {
  const th = v.theo; if (th.laLop) return; const c = th.c;
  if (th.treLop > 0) { th.treLop -= d; if (th.treLop <= 0) { th.treLop = -1; lopTre(v); } }
  const n = v.ngoai.length; if (n < 2) return;
  const dangQuet = !v.hienNgay && v.t < v.tgQuet;
  if (dangQuet && (c.hat > 0 || c.hatNguyenTo)) {
    const x = v.t / v.tgQuet, e = 1 - Math.pow(1 - x, 4), k = clamp(Math.round(e * (n - 1)), 1, n - 1);
    const p = v.goc.clone().add(v.ngoai[k]), tt = v.ngoai[k].clone().sub(v.ngoai[k - 1]).normalize(), ra = v.ngoai[k].clone().sub(v.trong[k]).normalize();
    const pt = v.goc.clone().add(v.trong[k]);
    th.tichHat += d * c.hat * 70;
    while (th.tichHat >= 1) { th.tichHat -= 1; const muc = Math.random() < .3;
      hatThem(pt.clone().lerp(p, ngau(.55, 1)), tt.clone().multiplyScalar(ngau(.8, 2.4)).addScaledVector(ra, ngau(.2, 1.2)).add(trongCau().multiplyScalar(.5)), SOUL.CoHat * ngau(.45, .8), muc ? c.mauMuc : c.mauNhan, ngau(.3, .55), 6, 0, 1.4); }
    if (c.hatNguyenTo) { th.tichNT += d * 45; while (th.tichNT >= 1) { th.tichNT -= 1; hatNguyenTo(c.nguyenTo, pt.clone().lerp(p, ngau(.4, 1)), tt, c.mauNhan); } }
  }
  if (!th.daTia && c.tiaVang && v.t >= v.tgQuet) { th.daTia = true; tia(v); }
  if (!th.daTan && v.t > v.tgQuet + v.tgSong) { th.daTan = true; raHat(v); }
}

// ---------------------------------------------------------------- KyNangVuKhiChay.VetChem / VetThang (HieuUngVuKhi.Cung / Thang)
function apTuyChon(o, c) { if (c.lopSang > 0) { o.soSoi = (o.soSoi > 0 ? o.soSoi : SOUL.SoSoi) + 4; o.tiLeDo = Math.min(1, o.tiLeDo + .06); } if (c.heSoRong > 1.001) o.r1 = o.r0 + (o.r1 - o.r0) * c.heSoRong; }
function vetChem(tam, huong, phap, r0, r1, goc, tgQuet, non = 0, vanToc = null, tgSong = -1) {
  if (!tb.coVuKhi) return null;
  phap = phap.lengthSq() < 1e-6 ? LEN.clone() : phap.clone().normalize();
  let h = huong.clone().projectOnPlane(phap); if (h.lengthSq() < 1e-6) h = crossU(phap, new V3(1, 0, 0));
  const dau = aaU(-goc * .5, phap, h.normalize());
  const o = macDinh(r0, r1, tgQuet); o.non = non; o.vanToc = vanToc; if (tgSong >= 0) o.tgSong = tgSong; o.tiLeDo = Math.max(o.tiLeDo, .42);
  const c = cfgCopy(tb.c); apTuyChon(o, c);
  const v = vetCungTho(tam, dau, phap, goc, o); theoDoi(v, c, true); danhDauSoul(); return v;
}
function vetThang(a, b, rong, tgQuet = .06, vanToc = null, tgSong = -1) {
  if (!tb.coVuKhi) return null;
  const nhin = a.clone().add(b).multiplyScalar(.5).sub(DK.cam.position).normalize();
  let ngang = crossU(b.clone().sub(a), nhin); if (ngang.lengthSq() < 1e-6) ngang = LEN.clone();
  const o = macDinh(0, 0, tgQuet); o.vanToc = vanToc; o.soSoi = 10; o.tiLeDo = .45; if (tgSong >= 0) o.tgSong = tgSong;
  const c = cfgCopy(tb.c); apTuyChon(o, c); rong *= Math.max(1, c.heSoRong);
  const v = vetThangTho(a, b, ngang, rong, o); theoDoi(v, c, true); danhDauSoul(); return v;
}

// ================================================================ HIỆU ỨNG TRÚNG THÊM (VetVuKhi.Trung = HieuUngVuKhi.ApTrung)
const FS_VAN = `
uniform vec3 uMau, uMuc; uniform float uKieu, uMo, uSang, uTienDo, uHat, uSoKyTu, uT;
varying vec2 vUv;
float B2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float KyTu(float id, vec2 c){ float h = B2(vec2(id * 1.7 + c.x * 3.1, c.y * 5.3 + id)); float ng = c.x == 1.0 ? 0.35 : 0.58; return step(ng, h); }
void main(){
  float t = uT; vec3 mau = uMau * uSang;
  if (uKieu < 0.5) {
    float x = vUv.x, y = vUv.y;
    if (abs(x - 0.5) > 0.36) discard;
    float ky = y * uSoKyTu - t * 0.35; float id = floor(ky), fy = fract(ky);
    vec2 o = vec2(floor((x - 0.14) / 0.72 * 3.0), floor(fy * 6.0));
    if (o.x < 0.0 || o.x > 2.0 || o.y > 4.0) discard;
    if (KyTu(id + uHat, o) < 0.5) discard;
    float mach = fract(y * 0.8 - t * 0.9);
    float sang = 0.55 + 0.45 * smoothstep(0.75, 1.0, mach) + 0.15 * sin(t * 2.3);
    float mo = uMo * clamp(min(y, 1.0 - y) * 8.0, 0.0, 1.0);
    gl_FragColor = vec4(mau * sang, mo * 0.9); return;
  }
  vec2 p = vUv * 2.0 - 1.0; float r = length(p); float a = atan(p.y, p.x);
  if (uKieu < 1.5) {
    float aq = a + t * 0.25;
    float vong = step(abs(r - 0.86), 0.025);
    float seg = fract(aq / 6.2831853 * 12.0);
    float vach = step(abs(seg - 0.5), 0.035) * step(0.6, r) * step(r, 0.98) * step(0.5, fract(floor(aq / 6.2831853 * 12.0) * 0.5 + 0.25));
    float muiVach = step(abs(seg - 0.5), 0.075 * clamp((r - 0.9) / 0.08, 0.0, 1.0)) * step(0.9, r) * step(r, 0.99);
    float aq2 = a - t * 0.4;
    float o = floor(aq2 / 6.2831853 * 48.0), ov = floor((r - 0.56) / 0.04);
    float van = step(0.5, B2(vec2(o, ov + uHat))) * step(0.56, r) * step(r, 0.68) * step(0.15, fract(aq2 / 6.2831853 * 48.0));
    float vongTrong = step(abs(r - 0.52), 0.012);
    float muc = max(vong, max(vach, vongTrong));
    if (muc + van + muiVach < 0.5) discard;
    vec3 c = muc > 0.5 ? uMuc : mau; if (muiVach > 0.5) c = mau;
    float tho = 0.85 + 0.15 * sin(t * 1.7);
    gl_FragColor = vec4(c, uMo * (muc > 0.5 ? 0.75 : 0.85 * tho)); return;
  }
  float k = uTienDo;
  float o2 = floor((a + 3.14159) / 6.2831853 * 32.0);
  float h = B2(vec2(o2, uHat));
  float band = step(abs(r - 0.8), 0.07); float vongNgoai = step(abs(r - 0.94), 0.02);
  float con = step(k * 0.9, h);
  float ky2 = step(0.42, B2(vec2(o2 * 3.0 + floor((r - 0.73) / 0.035), uHat + 9.0)));
  float hien = (band * ky2 + vongNgoai) * con;
  if (hien < 0.5) discard;
  gl_FragColor = vec4(vongNgoai > 0.5 ? uMuc : mau, uMo);
}`;
let tR = 0, dtGan = 1 / 120;   // đồng hồ thật (cho shader linh văn)
function matVan(kieu, mau, mo, sang) {
  return new T.ShaderMaterial({ uniforms: { uMau: { value: mau.clone() }, uMuc: { value: MAU_MUC.clone() }, uKieu: { value: kieu }, uMo: { value: mo }, uSang: { value: sang }, uTienDo: { value: 0 },
    uHat: { value: Math.random() * 40 }, uSoKyTu: { value: 9 }, uT: { value: 0 } }, vertexShader: VS, fragmentShader: FS_VAN, transparent: true, depthWrite: false, side: T.DoubleSide, toneMapped: false });
}
/** ChopLinhVan.Them — vòng linh văn nở co0 → co1 trong `song` giây thật, quay mặt về máy */
function chopLinhVan(p, co0, co1, song, mau, kieu = 2) {
  const mat = matVan(kieu, mau, 1, 1.25); const m = new T.Mesh(new T.PlaneGeometry(1, 1), mat); m.position.copy(p); m.renderOrder = 13;
  vfx.them(m, song * R, (dt, u) => { const e = 1 - (1 - u) * (1 - u); m.scale.setScalar(lerp(co0, co1, e)); m.quaternion.copy(DK.cam.quaternion); mat.uniforms.uMo.value = 1 - u * u; mat.uniforms.uTienDo.value = u; mat.uniforms.uT.value = tR; });
}
function apTrung(diem, huong, nang) {
  if (!tb.coVuKhi) return;
  huong = huong.lengthSq() < 1e-6 ? new V3(0, 0, 1) : huong.clone().normalize();
  const p = tb.pham, n = tb.nangCap, nhan = tb.nhan, mauP = tb.mauP, nn = clamp(Math.round(nang), 0, 3), c = tb.c;
  hatNo(diem, huong.clone().add(new V3(0, .2, 0)), 5 + nn * 3, 2.5, 6 + nn, .5, nhan, SOUL.CoHat * .8, .45, 9);
  const nhin = diem.clone().sub(DK.cam.position).normalize();
  let ngang = crossU(huong, nhin); if (ngang.lengthSq() < 1e-4) ngang = LEN.clone(); ngang.normalize();
  if (p >= BAO) {   // vòng hạt màu thanh nở vuông góc hướng chém
    const so = 8 + nn * 2; let a = crossU(huong, LEN); if (a.lengthSq() < 1e-4) a = new V3(1, 0, 0); a.normalize(); const b = crossU(huong, a);
    for (let i = 0; i < so; i++) { const g = i / so * Math.PI * 2, d = a.clone().multiplyScalar(Math.cos(g)).addScaledVector(b, Math.sin(g));
      hatThem(diem.clone().addScaledVector(d, .08), d.clone().multiplyScalar(ngau(3.5, 5)).addScaledVector(huong, .8), .04, i % 3 === 0 ? mauP : nhan, .28, 0, 0, 5); }
  }
  if (p >= HUYEN && nang >= .5) {   // nét mực chéo màu phẩm
    const cheo = ngang.clone().addScaledVector(huong, .6).normalize(), dai = .8 + nn * .35;
    const o = macDinh(0, 0, .03); Object.assign(o, { tgSong: .06 + nn * .02, tgTan: .1, soSoi: 5, doXo: .3, tiLeDo: .6 });
    const v = vetThangTho(diem.clone().addScaledVector(cheo, -dai / 2), diem.clone().addScaledVector(cheo, dai / 2), crossU(cheo, nhin), .09 + nn * .03, o);
    if (v) { const c2 = cfgCopy(c); c2.mauNhan = mauP.clone(); theoDoi(v, c2, false); }
  }
  if (p >= TIEN && nang >= 1) {     // 4 tia mảnh màu phẩm
    for (let i = 0; i < 4; i++) { const g = (i / 4 + ngau(-.06, .06)) * Math.PI * 2; const d = ngang.clone().multiplyScalar(Math.cos(g)).addScaledVector(crossU(nhin, ngang), Math.sin(g)).normalize();
      const o = macDinh(0, 0, .04); Object.assign(o, { tgSong: .05, tgTan: .08, soSoi: 2, tiLeDo: 1, doXo: .2 });
      const v = vetThangTho(diem.clone().addScaledVector(d, .15), diem.clone().addScaledVector(d, ngau(.6, .95)), crossU(d, nhin), .03, o);
      if (v) { const c2 = cfgCopy(c); c2.mauNhan = mauP.clone(); c2.mauMuc = MAU_MUC.clone().lerp(mauP, .5); theoDoi(v, c2, false); } }
  }
  if (p >= THAN) {
    hatNo(diem, huong.clone().negate().add(new V3(0, .4, 0)), 6 + nn * 3, 1.5, 4, .8, MAU_MUC, SOUL.CoHat * 1.3, .6, 10);
    hatNo(diem, huong, 4 + nn * 2, 4, 8, .35, mauP, SOUL.CoHat, .4, 6, .02, 1.2);
  }
  if (n >= 10) {   // Khí Linh: vòng linh văn chớp + mảnh khí xoáy
    chopLinhVan(diem, .5, 1.3 + nn * .25, .3, nhan, 2);
    let a = crossU(nhin, LEN); if (a.lengthSq() < 1e-4) a = new V3(1, 0, 0); a.normalize(); const b = crossU(nhin, a);
    for (let i = 0; i < 10; i++) { const g = i / 10 * Math.PI * 2, d = a.clone().multiplyScalar(Math.cos(g)).addScaledVector(b, Math.sin(g)), tiep = crossU(nhin, d);
      hatThem(diem.clone().addScaledVector(d, .25), d.clone().multiplyScalar(2.2).addScaledVector(tiep, 3.2), .035, nhan, .35, 0, .02, 4, 1.25); }
    if (c.hatNguyenTo) for (let i = 0; i < 6; i++) hatNguyenTo(c.nguyenTo, diem, huong, nhan, 1.2);
  }
}

// ================================================================ HÀO QUANG KHI CẦM (HaoQuangVuKhi.cs + quầng lưỡi NhanVatKhoi.DungVuKhi)
const HQ = { meshCu: null, quang: null, van: null, vong: null, tichKhi: 0, tichSoi: 0, hinh: null };
/** đo lưỡi từ hop: bề rộng / dày (m) theo khối dài nhất */
function doLuoi(vk) {
  let rong = 1.5, day = .45, dai = 0;
  for (const h of vk.hop || []) if (h.co[1] > dai && h.tam[1] > 3) { dai = h.co[1]; rong = h.co[0]; day = h.co[2]; }
  return { rong: rong * DL.PX, day: day * DL.PX, z0: 3 * DL.PX, z1: (vk.mui ? vk.mui[1] : 20) * DL.PX };
}
function dungHaoQuang() {
  for (const k of ['quang', 'van']) if (HQ[k]) { nc.kiem.remove(HQ[k]); HQ[k].traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); HQ[k] = null; }
  if (HQ.vong) { HQ.vong.parent.remove(HQ.vong); HQ.vong.material.dispose(); HQ.vong.geometry.dispose(); HQ.vong = null; }
  if (!tb.coVuKhi) return;
  const L = HQ.hinh = doLuoi(tb.vk), N = Math.min(10, tb.nangCap), p = tb.pham, dai = L.z1 - L.z0;
  // phát sáng lưỡi gốc (NhanVatKhoi: phatLuoiNen = .15 + kPham·max(màu) + kCap) — lõi mặc định .12 ≈ game .15 ⇒ × .8
  const kPham = p === THAN ? .22 : p === TIEN ? .18 : p === HUYEN ? .14 : p === BAO ? .1 : 0, kCap = N >= 4 ? .03 + .01 * (N - 4) : 0;
  const ml = tb.mauLuoi, phat = .15 + kPham * Math.max(ml.r, ml.g, ml.b) + kCap;
  if (nc.kiemMesh) nc.kiemMesh.material.emissiveIntensity = phat * .8;
  // quầng lưỡi "Sang" (cộng sáng rất mờ): alpha sangNen theo +N / phẩm, to hơn ở +10, màu = màu phẩm từ +7 (còn lại màu thanh)
  //   2026-11-14 — game lấy pham từ hình vat_pham.json; kiếm vu_khi.json không có hình ở đó ⇒ ở đây dùng phẩm của vu_khi.json
  const sangNen = N >= 10 ? .13 : N >= 7 ? .11 : p === TIEN ? .1 : p === BAO ? .09 : .08;
  const mauSang = N >= 7 ? new T.Color(DL.PHAM[p].mau) : ml.clone();
  const sc = N >= 10 ? [2.9, 1.8, 1.03] : [2.4, 1.5, 1.02];
  const q = new T.Mesh(new T.BoxGeometry(L.rong * sc[0], L.day * sc[1], dai * sc[2]), new T.MeshBasicMaterial({ color: mauSang, transparent: true, opacity: sangNen, blending: T.AdditiveBlending, depthWrite: false }));
  q.position.z = L.z0 + dai / 2; q.renderOrder = 4; nc.kiem.add(q); HQ.quang = q;
  // linh văn hai mặt lưỡi (+10)
  if (coVan()) {
    const g = new T.Group(); HQ.van = g; nc.kiem.add(g);
    const mat = matVan(0, tb.nhan, 1, 1.25); mat.uniforms.uSoKyTu.value = clamp(Math.round(dai / .11), 5, 16);
    for (const s of [1, -1]) { const m = new T.Mesh(new T.PlaneGeometry(1, 1), mat); m.rotation.x = Math.PI / 2; m.scale.set(L.rong * .9 * 1.6, dai * .92, 1);
      m.position.set(0, s * (L.day * .5 + .004), L.z0 + dai / 2); m.renderOrder = 14; g.add(m); }
  }
  // vòng hư ảnh sau lưng (Thần Khí)
  if (coVong()) {
    const m = new T.Mesh(new T.PlaneGeometry(1, 1), matVan(1, tb.mauP, .6, 1.1)); m.position.set(0, .12, -.32); m.scale.setScalar(1.55); m.renderOrder = 3;
    nc.gan.lung.add(m); HQ.vong = m;
  }
}
/** khí bám lưỡi: hạt voxel màu thanh + sợi mực bốc lên (giây thật) */
function khiBamLuoi(pc, pm, d) {
  const t = tb, muc = (t.nangCap >= 10 ? 26 : t.nangCap >= 7 ? 18 : 12) + Math.max(0, t.pham - BAO) * 4;
  HQ.tichKhi += d * muc; HQ.tichSoi += d * muc * .35;
  while (HQ.tichKhi >= 1) { HQ.tichKhi -= 1;
    const p = pc.clone().lerp(pm, Math.sqrt(Math.random())).add(trongCau().multiplyScalar(.03)), phamMau = t.pham >= THAN && Math.random() < .25;
    hatThem(p, LEN.clone().multiplyScalar(ngau(.25, .7)).add(trongCau().multiplyScalar(.18)), ngau(.022, .042), phamMau ? t.mauP : t.nhan, ngau(.45, .85), -.6, 0, 2.2, t.nangCap >= 10 ? 1.2 : 1);
    if (t.nangCap >= 7 && Math.random() < .2) hatNguyenTo(t.nt, p, LEN.clone().multiplyScalar(.3), t.nhan, .8); }
  while (HQ.tichSoi >= 1) { HQ.tichSoi -= 1;
    const p = pc.clone().lerp(pm, ngau(.15, 1));
    hatThem(p, LEN.clone().multiplyScalar(ngau(.5, .9)).add(trongCau().multiplyScalar(.1)), .03, MAU_MUC, ngau(.4, .65), -.4, .09, 1.5); }
}

// ---------------------------------------------------------------- DẢI ĐỘNG (vệt phẩm tự động / lớp bám vệt lõi) — lưới dựng lại mỗi khung
function taoDaiDong(N, o) {
  const P = new Float32Array(N * 6), UV = new Float32Array(N * 4), I = [];
  for (let i = 0; i < N - 1; i++) { const k = i * 2; I.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(P, 3)); g.setAttribute('uv', new T.BufferAttribute(UV, 2)); g.setIndex(I);
  const mat = matVet(o); const m = new T.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 12; m.visible = false; scene.add(m);
  return { m, u: mat.uniforms, N,
    /** tr[], ng[] cũ → mới (uv.x 0 = cũ nhất) */
    dat(tr, ng) {
      const n = Math.min(tr.length, N); if (n < 2) { m.visible = false; return; }
      let dai = 0, rong = 0;
      for (let i = 0; i < N; i++) { const j = Math.min(i, n - 1), a = tr[j], b = ng[j], u = i < n ? i / (n - 1) : 1;
        P.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6); UV.set([u, 0, u, 1], i * 4);
        if (i > 0 && i < n) dai += b.distanceTo(ng[i - 1]); if (i < n) rong += a.distanceTo(b); }
      g.attributes.position.needsUpdate = true; g.attributes.uv.needsUpdate = true;
      this.u.uDai.value = Math.max(.1, dai); this.u.uRong.value = Math.max(.05, rong / n); m.visible = true;
    },
    huy() { scene.remove(m); g.dispose(); mat.dispose(); },
  };
}
// vệt phẩm tự động (bộ không phải Soul): dải mực MẢNH sát mũi (62 % → 104 % lưỡi) khi mũi vung ≥ 5,5 m/s so với gốc
const AUTO = { mG: [], mM: [], mT: [], daiDong: null, muiTruoc: new V3(), gocTruoc: new V3(), coTruoc: false, tVungCuoi: -9, soulDen: -9 };
function danhDauSoul() { AUTO.soulDen = tR + .8; }
function vetTuDong(pc, pm, d) {
  const tat = !coVetTuDong() || tR < AUTO.soulDen || d <= 0;
  let vung = false;
  if (AUTO.coTruoc && d > 0) { const vMui = pm.clone().sub(AUTO.muiTruoc).divideScalar(d).sub(nc.pos.clone().sub(AUTO.gocTruoc).divideScalar(d)); vung = vMui.lengthSq() > 5.5 * 5.5; }
  AUTO.muiTruoc.copy(pm); AUTO.gocTruoc.copy(nc.pos); AUTO.coTruoc = true;
  const A = AUTO;
  if (tat) { A.mG.length = A.mM.length = A.mT.length = 0; if (A.daiDong) A.daiDong.m.visible = false; return; }
  while (A.mT.length && tR - A.mT[0] > .16) { A.mG.shift(); A.mM.shift(); A.mT.shift(); }
  if (vung) {
    if (tR - A.tVungCuoi > .16 && A.daiDong) A.daiDong.u.uHat.value = Math.random() * 90;
    A.tVungCuoi = tR;
    if (A.mT.length >= 24) { A.mG.shift(); A.mM.shift(); A.mT.shift(); }
    A.mG.push(pc.clone()); A.mM.push(pm.clone()); A.mT.push(tR);
  }
  const n = A.mT.length;
  if (n < 2) { if (A.daiDong) A.daiDong.m.visible = false; return; }
  const c = tb.c;
  if (!A.daiDong) A.daiDong = taoDaiDong(24, { soSoi: 5, tiLeDo: .55, tiLeHo: .2, doXo: .45, duoiMong: .2, coO: SOUL.CoO * .7, mo: .9 });
  const dd = A.daiDong, tr = [], ng = [];
  for (let i = 0; i < n; i++) { const dv = A.mM[i].clone().sub(A.mG[i]); tr.push(A.mG[i].clone().addScaledVector(dv, .62)); ng.push(A.mG[i].clone().addScaledVector(dv, 1.04)); }
  dd.dat(tr, ng);
  dd.u.uSoSoi.value = tb.nangCap >= 3 ? 7 : 5; dd.u.uTiLeTrang.value = c.tiLeTrang; dd.u.uTan.value = c01((tR - A.tVungCuoi - .03) / .12);
  dd.u.uDo.value.copy(c.mauNhan); dd.u.uMuc.value.copy(c.mauMuc); dd.u.uSang.value.copy(c.mauSang);
  // Bảo+: rắc hạt màu thanh ở mũi khi đang vung (xác suất mỗi khung 60 fps của game ⇒ quy theo d)
  if (c.hat > 0 && tR - A.tVungCuoi < .02) {
    const k = d * 60, tt = A.mM[n - 1].clone().sub(A.mM[n - 2]).normalize();
    if (Math.random() < c.hat * .6 * k) hatThem(A.mM[n - 1], tt.clone().multiplyScalar(1.5).add(trongCau().multiplyScalar(.5)), .035, c.mauNhan, .4, 6, 0, 1.4);
    if (c.hatNguyenTo && Math.random() < .5 * k) hatNguyenTo(c.nguyenTo, A.mM[n - 1], tt, c.mauNhan);
  }
}

// ---------------------------------------------------------------- BỌC DK.vfx.vet (bộ Soul — HieuUngVuKhi.ApVet): màu nhấn + lớp phẩm / mốc
//   Lõi vẽ vệt bám mũi kiếm (mẫu mau_); ở đây thêm các lớp của VetVuKhi bám theo đúng các mẫu đó.
const dsBam = [];
const vetLoi = vfx.vet;
vfx.vet = function (nv, op = {}) {
  if (nv !== nc || !tb.coVuKhi || !laSoul()) return vetLoi.call(vfx, nv, op);
  const c = cfgCopy(tb.c), op2 = Object.assign({}, op);
  if (op.mau == null) op2.mau = c.mauNhan.clone();                                     // màu nhấn = MauNhan(màu thanh)
  if (c.heSoRong > 1.001) op2.rong = Math.min(1, (op.rong != null ? op.rong : .85) * c.heSoRong);   // +3: dày hơn 18 %
  const x = vetLoi.call(vfx, nv, op2); const st = vfx._vet;
  danhDauSoul();
  if (st && st.mau_) {
    const ghi = op.song != null ? op.song : .14, tan = op.tan != null ? op.tan : .22;
    const b = { mau: st.mau_, t0: DK.now, ghi, tan, c, lop: [], tichHat: 0, tichNT: 0, daTia: false, daTan: false, ketThuc: ghi + tan + .05, anh: null, donKet: donKetGanDay() };
    const lop = (a, bb, mau, mo, tre, o, rel) => b.lop.push({ a, b: bb, tre, rel: !!rel, d: taoDaiDong(40, Object.assign({ soSoi: 3, tiLeDo: .9, doXo: .35, duoiMong: .6, mo, mauNhan: mau, mauMuc: MAU_MUC.clone().lerp(mau, .35), mauSang: mau.clone().lerp(C(1, 1, 1), .5), tiLeTrang: .25 }, o || {})) });
    if (c.lopSang > 0) lop(-.3, -.24, c.mauSang, .8, 0, { soSoi: 2, tiLeDo: 1 });          // +3: lớp vạch sáng màu thanh (gần đúng: lõi không có sợi trắng)
    if (c.vien) lop(.012, .06, c.mauPham, 1, 0);                                            // Bảo+: viền mảnh sát mép ngoài
    if (c.tiaVang) lop(-.42, -.36, c.mauPham, .85, 0);                                     // Tiên+: vạch ánh giữa dải
    if (c.lopTre) lop(-.5, .12, c.mauPham, .75, .045 * R, { soSoi: 7, tiLeDo: .55, doXo: .7, duoiMong: .3, mauMuc: c.mauMuc, mauSang: c.mauSang, tiLeTrang: .04 }, true);   // Huyền+: lớp trễ 45 ms
    if (c.anhKhongLo && b.donKet) b.anh = taoAnhKhongLo();
    dsBam.push(b);
  }
  return x;
};
function relPt(s, k, rel) { const d = s.b.clone().sub(s.a); const r = d.length() || .3; d.divideScalar(r); return s.b.clone().addScaledVector(d, k < 0 || rel ? k * r : k); }
function buocBam() {
  for (let i = dsBam.length - 1; i >= 0; i--) {
    const b = dsBam[i], tl = DK.now - b.t0, ds = b.mau, c = b.c;
    if (tl > b.ketThuc || !ds) { for (const L of b.lop) L.d.huy(); if (b.anh) b.anh.huy(); dsBam.splice(i, 1); continue; }
    for (const L of b.lop) {
      const tr = [], ng = [];
      for (let j = ds.length - 1; j >= 0; j--) { const s = ds[j]; if (s.t > tl - L.tre) continue; tr.push(relPt(s, L.a, L.rel)); ng.push(relPt(s, L.b, L.rel)); }
      L.d.dat(tr, ng); L.d.u.uTan.value = c01((tl - b.ghi) / b.tan);
    }
    const n = ds.length;
    if (n >= 2 && tl <= b.ghi) {   // đang quét: hạt màu thanh (Bảo+) + hạt nguyên tố (+7) theo đầu vệt
      const s0 = ds[0], s1 = ds[1], tt = s0.b.clone().sub(s1.b), ra = s0.b.clone().sub(s0.a).normalize(), d = dtGan / R;
      if (tt.lengthSq() > 1e-8) tt.normalize();
      b.tichHat += d * c.hat * 70;
      while (b.tichHat >= 1) { b.tichHat -= 1; const muc = Math.random() < .3;
        hatThem(s0.a.clone().lerp(s0.b, ngau(.55, 1)), tt.clone().multiplyScalar(ngau(.8, 2.4)).addScaledVector(ra, ngau(.2, 1.2)).add(trongCau().multiplyScalar(.5)), SOUL.CoHat * ngau(.45, .8), muc ? c.mauMuc : c.mauNhan, ngau(.3, .55), 6, 0, 1.4); }
      if (c.hatNguyenTo) { b.tichNT += d * 45; while (b.tichNT >= 1) { b.tichNT -= 1; hatNguyenTo(c.nguyenTo, s0.a.clone().lerp(s0.b, ngau(.4, 1)), tt, c.mauNhan); } }
      if (b.anh) b.anh.dat(s0, tt);
    }
    if (b.anh) b.anh.mo(tl / b.ketThuc);
    if (!b.daTia && c.tiaVang && tl > b.ghi && n >= 2) { b.daTia = true; tiaTuMau(b); }
    if (!b.daTan && tl > b.ghi + b.tan * .4 && n >= 2) { b.daTan = true; raHatTuMau(b); }
  }
}
// tia (Tiên+) / hạt tan theo mép ngoài của vệt lõi
function tiaTuMau(b) {
  const ds = b.mau, n = ds.length, c = b.c, so = (ngau(3, 6)) | 0;
  for (let k = 0; k < so; k++) {
    const s = ds[(Math.random() * n * .75) | 0]; const p = s.b.clone(); let d = s.b.clone().sub(s.a).normalize(); d.add(trongCau().multiplyScalar(.25)).normalize();
    const nhin = p.clone().sub(DK.cam.position).normalize(), o = macDinh(0, 0, .05); Object.assign(o, { tgSong: .06, tgTan: .1, soSoi: 2, tiLeDo: 1, doXo: .2, duoiMong: .25 });
    const x = vetThangTho(p, p.clone().addScaledVector(d, ngau(.45, .9)), crossU(d, nhin), .035, o);
    if (x) { const c2 = cfgCopy(c); c2.mauNhan = c.mauPham.clone(); c2.mauMuc = MAU_MUC.clone().lerp(c.mauPham, .5); c2.tiLeTrang = 0; theoDoi(x, c2, false); }
  }
}
function raHatTuMau(b) {
  const ds = b.mau, n = ds.length, c = b.c; let dai = 0; for (let i = 1; i < n; i++) dai += ds[i].b.distanceTo(ds[i - 1].b);
  const so = clamp(Math.round(dai * 3), 3, 26);
  for (let k = 0; k < so; k++) {
    const i = Math.min(n - 2, (Math.random() * (n - 1) * .75) | 0), p = ds[i].b.clone().lerp(ds[i + 1].b, Math.random()), tt = ds[i].b.clone().sub(ds[i + 1].b).normalize();
    hatThem(p, tt.clone().multiplyScalar(ngau(.6, 2.2)).add(trongCau().multiplyScalar(.6)), SOUL.CoHat * ngau(.5, 1), Math.random() < Math.max(.3, c.tiLeNhan) ? c.mauNhan : c.mauMuc, ngau(.35, .7), SOUL.TrongLucHat * .35, 0, 1.5);
    if (c.hatNguyenTo && k % 3 === 0) hatNguyenTo(c.nguyenTo, p, tt, c.mauNhan);
  }
}
/** Thần Khí + nhát kết: ẢNH VŨ KHÍ KHỔNG LỒ mờ quét theo đầu vệt (VetVuKhi.AnhKhongLo — shader AnhVuKhi gần đúng bằng vật liệu cộng sáng) */
function taoAnhKhongLo() {
  const vk = tb.vk, L = doLuoi(vk), g = new T.Group(), m = DK.meshKiem(vk, { bong: false });
  m.material = new T.MeshBasicMaterial({ color: tb.mauP, transparent: true, opacity: .42, blending: T.AdditiveBlending, depthWrite: false });
  m.rotation.x = Math.PI / 2; g.add(m); g.renderOrder = 11; g.visible = false; scene.add(g);
  const mx = new T.Matrix4();
  return {
    dat(s, tt) {   // s = mẫu vệt (a gốc dải, b mũi); lưỡi khổng lồ: gốc lùi 15 %, mũi vượt mép 20 %, bản lưỡi theo tiếp tuyến
      const d = s.b.clone().sub(s.a), r = d.length(); if (r < .05) return; d.divideScalar(r);
      let x = tt.clone().projectOnPlane(d); if (x.lengthSq() < 1e-6) x = crossU(d, LEN); x.normalize(); const y = new V3().crossVectors(d, x);
      mx.makeBasis(x, y, d); g.quaternion.setFromRotationMatrix(mx); g.scale.setScalar(r * 1.35 / Math.max(.2, L.z1));
      g.position.copy(s.a).addScaledVector(d, -r * .15); g.visible = true;
    },
    mo(u) { m.material.opacity = .42 * (u > .55 ? Math.max(0, 1 - (u - .55) / .45) : 1); },
    huy() { scene.remove(g); m.material.dispose(); },
  };
}

// ================================================================ KỸ NĂNG VŨ KHÍ (KyNangVuKhi*.cs — hàng "kiem")
const KIEM = { ten1: 'Kiếm Tâm Thông Minh', moiN: 4, heSo1: .40, tenKK: 'Tàn Nguyệt Kiếm Khí', heSoKK: .60, tamKK: 9, rongKK: 1.6, tocKK: 20, ten2: 'Vạn Kiếm Quy Tông', heSo2: 4.5, tenThan: 'Tru Tiên Kiếm Trận' };
const KL = { demTrung: 0, khiLinh: 0, tbSat: -1, maVK: null, dangPhat: false, dem: { trung: 0, ket: 0, noiTai: 0, kiemKhi: 0, khiLinh: 0 } };
const MAU_HEX = c => '#' + c.getHexString();
const tamTrung = d => d.diem('nguc');
/** một đòn phụ: DK.trung + hình trúng (doNang −1 = mảnh mực + tia nhỏ, không khựng) + lớp phẩm ApTrung */
function danh(dich, st, huong, doNang, dayLui = 0) {
  if (!dich || st <= 0) return;
  const h = huong.clone().setY(0); if (h.lengthSq() < 1e-6) h.subVectors(dich.pos, nc.pos).setY(0); h.normalize();
  const diem = tamTrung(dich);
  KL.dangPhat = true;
  try { DK.trung(dich, { st, nguon: nc, day: dayLui ? dayLui * .4 : 0, mau: MAU_HEX(tb.nhan), vkPhu: true }); } finally { KL.dangPhat = false; }
  if (doNang >= 0) {   // SoulVFX.Trung (mực + máu + rung) — gần đúng
    hatNo(diem, h.clone().add(new V3(0, .25, 0)), 10 + doNang * 4, 2.5, 7, .55, MAU_MUC, SOUL.CoHat, .55, 9);
    hatNo(diem, h, 5 + doNang * 3, 2, 6, .5, MAU_DO, SOUL.CoHat * .8, .45, 12);
    DK.rung([.12, .12, .18, .22][clamp(doNang, 0, 3)], .25);
  } else {
    hatNo(diem, h.clone().add(new V3(0, .2, 0)), 8, 2.5, 6, .5, MAU_MUC, SOUL.CoHat, .55);
    hatNo(diem, h, 4, 2, 5, .6, MAU_TIA_LUA, SOUL.CoHat * .6, .35, 8, 0, 1.6);
  }
  try { apTrung(diem, h, Math.max(0, doNang)); } catch (e) { bao(e); }
}
function mucTieu(xa) {
  let ds = DK.trongNon(nc, xa, 140); if (!ds.length) ds = DK.trongNon(nc, xa * .6, 360);
  let tot = null, d0 = 1e9; for (const b of ds) { const d = b.pos.distanceTo(nc.pos); if (d < d0) { d0 = d; tot = b; } } return tot;
}
// ---- +5 nội tại: một nhát kiếm khí chéo cắt qua mục tiêu
function noiTai(dich, st) {
  const h = dich.pos.clone().sub(nc.pos).setY(0); if (h.lengthSq() < 1e-4) h.copy(nc.toi()); h.normalize();
  const tam = tamTrung(dich);
  vetChem(tam.clone().addScaledVector(h, -.3), h, aaU(-40, h, LEN), .5, 1.4, 140, .07);
  danh(dich, st, h, -1);
}
// ---- luồng khí bay (KyNangVuKhiChay.Phong, kiểu TRĂNG KHUYẾT)
const dsBay = [];
function phong(goc, h, tam, rong, toc, st) {
  h = h.clone().setY(0); if (h.lengthSq() < 1e-6) h.set(0, 0, 1); h.normalize();
  const b = { p: goc.clone().addScaledVector(h, .6), h, toc, conLai: tam, rong, st, daTrung: [], soTrung: 0 };
  const song = tam / Math.max(1, toc), v0 = h.clone().multiplyScalar(toc), tamVet = b.p.clone().add(new V3(0, 1, 0));
  b.vet = vetChem(tamVet.clone().addScaledVector(h, -.5), h, aaU(12, h, LEN), rong * .25, rong * .55, 120, .05, .15, v0, song);
  dsBay.push(b);
}
function buocBay(d) {
  for (let i = dsBay.length - 1; i >= 0; i--) {
    const b = dsBay[i], buoc = Math.min(b.conLai, b.toc * d); b.p.addScaledVector(b.h, buoc); b.conLai -= buoc;
    const tam = b.p.clone().add(new V3(0, .9, 0)), r = b.rong * .5 + .3;
    for (const x of DK.dsBuNhin) { if (b.daTrung.indexOf(x) >= 0) continue; const q = x.pos.clone().add(new V3(0, .9, 0)); if (q.distanceTo(tam) > r + .35) continue;
      b.daTrung.push(x); danh(x, b.st, b.h, b.soTrung === 0 ? 1 : -1, 1.2); b.soTrung++; }
    if (b.conLai <= 1e-3) { if (b.vet && b.vet.song && b.vet.t < b.vet.tgQuet + b.vet.tgSong) b.vet.t = b.vet.tgQuet + b.vet.tgSong;   // TanNgay
      hatNo(tam, b.h, 8, 1.5, 4, .7, MAU_MUC, SOUL.CoHat, .5); dsBay.splice(i, 1); }
  }
}
// ---- +7 kiếm khí đòn kết (Thần Khí: tách 3 lưỡi lệch 20°)
function kiemKhi(dich, st) {
  let h = dich ? dich.pos.clone().sub(nc.pos) : nc.toi(); h.setY(0); h = h.lengthSq() > 1e-4 ? h.normalize() : nc.toi();
  if (tb.pham >= THAN) { for (let k = -1; k <= 1; k++) phong(nc.pos, aaU(20 * k, LEN, h), KIEM.tamKK, KIEM.rongKK, KIEM.tocKK, st); return; }
  phong(nc.pos, h, KIEM.tamKK, KIEM.rongKK, KIEM.tocKK, st);
}
/** KyNangVuKhi.KhiTrungDon — mỗi đòn THƯỜNG trúng */
function khiTrungDon(dich, st, donKet) {
  if (KL.dangPhat || !tb.coVuKhi) return;
  if (KL.maVK !== tb.ma) { KL.maVK = tb.ma; KL.khiLinh = 0; KL.demTrung = 0; }
  st = Math.max(0, st); KL.tbSat = KL.tbSat < 0 ? st : lerp(KL.tbSat, st, .2);
  const p = tb.pham, n = tb.nangCap; KL.demTrung++;
  KL.dem.trung++; if (donKet) KL.dem.ket++;
  if (n >= MOC_1 && dich && KL.demTrung % KIEM.moiN === 0) KL.dem.noiTai++, noiTai(dich, st * KIEM.heSo1 * heSoNoiTai(p));
  if (n >= MOC_KK && donKet) KL.dem.kiemKhi++, kiemKhi(dich, st * KIEM.heSoKK * heSoPham(p));
  // Thần Khí đặc hữu (kiếm — Tru Tiên Kiếm Trận): dưới +7, đòn kết phóng 1 lưỡi nhỏ 30 %
  if (p >= THAN && donKet && n < MOC_KK) { const h = dich ? dich.pos.clone().sub(nc.pos) : nc.toi(); phong(nc.pos, h, KIEM.tamKK * .8, KIEM.rongKK * .8, KIEM.tocKK, st * .3 * heSoPham(p)); }
  if (n >= MOC_2) KL.khiLinh = Math.min(1, KL.khiLinh + (donKet ? .12 : .06) * (1 + .05 * p));
}
const khiLinhDay = () => tb.coVuKhi && tb.nangCap >= MOC_2 && KL.maVK === tb.ma && KL.khiLinh >= .999;
/** +10 Vạn Kiếm Quy Tông — 6 kiếm khí xoay quanh 0,6 s rồi lần lượt lao vào mục tiêu (mỗi cái 1/6 tổng). Game không phát động tác riêng. */
function kichKhiLinh() {
  if (!tb.coVuKhi || tb.nangCap < MOC_2) return false;
  const tong = (KL.tbSat > 0 ? KL.tbSat : 16) * KIEM.heSo2 * heSoPham(tb.pham);
  KL.khiLinh = 0; KL.dem.khiLinh++;
  mucDat(nc.pos, 3.2, 1, .4, .7); bui(nc.pos, 1.4, 12); DK.rung(.12, .25);
  const SO = 6;
  for (let i = 0; i < SO; i++) {
    const k = i;
    if (k < 3) hen(.08 * k, () => vetChem(nc.pos.clone().add(new V3(0, .6 + .35 * k, 0)), nc.toi(), LEN, 1.0, 1.45, 330, .22, .1));
    hen(.6 + .09 * k, () => {
      const d = mucTieu(12), a = 60 * k * D;
      const tu = nc.pos.clone().add(new V3(-Math.cos(a) * 1.2, 1.4 + .25 * (k % 2), Math.sin(a) * 1.2));   // (cos, y, sin) của Unity, gương x
      if (!d) { vetThang(tu, tu.clone().addScaledVector(nc.toi(), 6), .22, .05); return; }
      const den = tamTrung(d); vetThang(tu, den, .24, .05);
      danh(d, tong / SO, den.clone().sub(tu), k === SO - 1 ? 3 : -1, k === SO - 1 ? 2 : 0);
    });
  }
  return true;
}

// ---------------------------------------------------------------- nhận diện đòn thường / đòn kết (game: KhiTrungDon chỉ cho đòn THƯỜNG; đòn kết = nhát cuối combo)
const DON = { t: -9, ket: false, tChieu: -9, hdCu: null };
const donKetGanDay = () => DON.ket && DK.now - DON.t < .6 && DON.t > DON.tChieu;
const tungChieuGoc = DK.tungChieu;
DK.tungChieu = function (ma) { DON.tChieu = DK.now; return tungChieuGoc.apply(this, arguments); };
function bocDanh() {   // bộ có combo riêng: bọc danh(ctx, i) để biết nhát i / soNhat
  for (const ma in DK.BO) { const bo = DK.BO[ma]; if (!bo || !bo.danh || bo.danh._vkh) continue;
    const goc = bo.danh; bo.danh = function (ctx, i) { DON.t = DK.now; DON.ket = i === (bo.soNhat || 7) - 1; return goc.apply(this, arguments); }; bo.danh._vkh = true; }
}
DK.nghe('buoc', () => {   // combo web chung DANH_1..7: nhát 7 = đòn kết
  if (nc.hd !== DON.hdCu) { DON.hdCu = nc.hd; const m = nc.hd && /^DANH_(\d)$/.exec(nc.hd.clip.ten);
    if (m && DK.now - DON.tChieu > .02) { const bo = DK.BO[DK.chon.bo]; if (!(bo && bo.danh)) { DON.t = DK.now; DON.ket = +m[1] === 7; } } }
});
DK.nghe('trung', e => {
  try {
    const op = e.op || {}; if (op.vkPhu || KL.dangPhat) return;
    if (op.nguon && op.nguon !== nc) return; if (!e.dich || e.dich === nc || !tb.coVuKhi) return;
    const laDon = DON.t > DON.tChieu && DK.now - DON.t < 1.0;
    const ket = laDon && DON.ket;
    if (laSoul()) apTrung(tamTrung(e.dich), e.dich.pos.clone().sub(nc.pos), ket ? 3 : (op.hat || op.st > 120 ? 2 : 1));   // bộ Soul: ApTrung mọi cú trúng
    if (laDon) khiTrungDon(e.dich, op.st != null ? op.st : 50, ket);
  } catch (er) { bao(er); }
});
// phím: giữ K (đỡ) + J khi thanh Khí Linh ĐẦY = kích (DieuKhien.cs). O = kích thử ngay (chỉ HTML — game không có phím này).
DK.nghe('phim', k => {
  try {
    if (k === 'j' && DK.phim.k && khiLinhDay()) { if (nc.hd && nc.hd.t < .02) nc.hd.dung(); nc.choDanh = false; kichKhiLinh(); }
    else if (k === 'o') { if (tb.coVuKhi && tb.nangCap >= MOC_2) { KL.maVK = tb.ma; kichKhiLinh(); } else vfx.chu('Khí Linh mở ở +10', { mau: '#ffd36b', song: 1 }); }
  } catch (e) { bao(e); }
});

// ---------------------------------------------------------------- thanh Khí Linh (KyNangVuKhiChay.VeGiaoDien — gần đúng bằng DOM)
const thanh = document.createElement('div');
thanh.style.cssText = 'position:fixed;left:50%;bottom:58px;transform:translateX(-50%);display:none;align-items:center;gap:8px;font:bold 12px sans-serif;color:#ddd;text-shadow:0 0 3px #000;pointer-events:none;z-index:5';
thanh.innerHTML = '<div style="width:84px;height:10px;background:rgba(8,6,8,.88);outline:1px solid #888;position:relative"><i style="position:absolute;left:0;top:0;bottom:0;width:0"></i>'
  + '<b style="position:absolute;left:25%;top:0;bottom:0;width:1px;background:rgba(0,0,0,.6)"></b><b style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:rgba(0,0,0,.6)"></b><b style="position:absolute;left:75%;top:0;bottom:0;width:1px;background:rgba(0,0,0,.6)"></b></div><span>Khí Linh</span>';
document.body.appendChild(thanh);
function veThanh() {
  const co = tb.coVuKhi && tb.nangCap >= MOC_2; thanh.style.display = co ? 'flex' : 'none'; if (!co) return;
  const v = KL.maVK === tb.ma ? KL.khiLinh : 0, day = v >= .999, m = tb.nhan;
  thanh.firstChild.style.outlineColor = DL.PHAM[tb.pham].mau;
  const i = thanh.querySelector('i'); i.style.width = (v * 100) + '%'; i.style.background = MAU_HEX(m); i.style.opacity = day ? String(.75 + .25 * Math.sin(tR * 9)) : '.85';
  thanh.lastChild.textContent = day ? 'KHÍ LINH · giữ K (chuột phải) + J' : 'Khí Linh · O = kích thử';
  thanh.lastChild.style.color = day ? MAU_HEX(m.clone().lerp(C(1, 1, 1), .5)) : '#d9d9d9';
}

// ================================================================ MỖI KHUNG
const _pc = new V3(), _pm = new V3();
let vkCu = null, capCu = -1, meshCu = null;
DK.moiKhung(dt => {
  try {
    const d = dt / R; tR += d; dtGan = dt;
    if (nc.vk !== vkCu || (DK.chon && DK.chon.cap) !== capCu || nc.kiemMesh !== meshCu) {
      vkCu = nc.vk; capCu = DK.chon && DK.chon.cap; meshCu = nc.kiemMesh; docTrangBi(); dungHaoQuang();
    }
    HAT.buoc(d); buocVet(d); buocBay(d); buocBam();
    if (HQ.van) HQ.van.children[0].material.uniforms.uT.value = tR;
    if (HQ.vong) HQ.vong.material.uniforms.uT.value = tR;
    if (tb.coVuKhi && nc.kiemMesh) {
      nc.can(_pc); nc.mui(_pm);
      if (coKhi() && d > 0) khiBamLuoi(_pc, _pm, d);
      if (!laSoul()) vetTuDong(_pc, _pm, d); else if (AUTO.daiDong) AUTO.daiDong.m.visible = false;
    }
    veThanh();
  } catch (e) { bao(e); }
});
DK.nghe('datLai', () => {
  HAT.xoa(); for (const v of dsVet) huyVet(v); dsVet.length = 0; dsBay.length = 0;
  for (const b of dsBam) { for (const L of b.lop) L.d.huy(); if (b.anh) b.anh.huy(); } dsBam.length = 0;
  AUTO.mG.length = AUTO.mM.length = AUTO.mT.length = 0; if (AUTO.daiDong) AUTO.daiDong.m.visible = false;
});
DK.nghe('doiVuKhi', () => { vkCu = null; });
bocDanh(); window.addEventListener('load', bocDanh);   // bo_*.js nạp trước file này ⇒ bọc ngay (bản chụp tự kiểm chạy trong 'load' của ui.js)
DK.nghe('phim', bocDanh);

// ================================================================ API cho bộ tự vẽ vệt Soul (vd. bo_huyet_nguyet.js veDai) — HieuUngVuKhi.ApVet/TheoDoi
//   DK.VKH.theoDoiDai(ngoai[], trong[], o)  — o như SoulVetMuc.TuyChon (tgQuet, tgSong, tgTan, doDai, vanToc, camToc, hienNgay; giây THẬT):
//      thêm mọi lớp phẩm / mốc (viền, vạch ánh, lớp trễ, hạt đầu vệt, tia, hạt tan màu thanh, +7 nguyên tố) bám đúng dải đó.
//      Dải gốc do bộ tự vẽ (chỉ nên đổi màu nhấn sang DK.VKH.mauNhan()). Trả false nếu không có vũ khí.
//   DK.VKH.mauNhan() — THREE.Color màu nhấn (MauNhan của màu thanh) · DK.VKH.apTrung(diem, huong, nang 0..3) — lớp trúng theo phẩm / +10
//   DK.VKH.tb() — trạng thái vũ khí (pham 0..5, nangCap, nhan, mauP, nt) · epSoul = true: coi bộ hiện tại là bộ Soul (tự kiểm)
DK.VKH = {
  epSoul: false,
  tb: () => tb,
  /** KyNangVuKhi.DatKhiLinh (kiểm lỗi): đặt thanh Khí Linh 0..1 */
  datKhiLinh: x => { if (tb.coVuKhi) { KL.maVK = tb.ma; KL.khiLinh = c01(x); } },
  dem: () => Object.assign({ thanh: +KL.khiLinh.toFixed(2) }, KL.dem),
  mauNhan: () => (tb.coVuKhi ? tb.nhan : MAU_DO).clone(),
  apTrung: (diem, huong, nang) => { try { apTrung(diem, huong, nang || 0); } catch (e) { bao(e); } },
  theoDoiDai(ngoai, trong, o) {
    if (!tb.coVuKhi || !ngoai || ngoai.length < 2) return false;
    const o2 = Object.assign(macDinh(0, 0, (o && o.tgQuet) || .1), o || {}); o2.mo = 0;
    const v = vetDai(ngoai, trong, o2); if (!v) return false; v.m.visible = false;
    theoDoi(v, cfgCopy(tb.c), true); danhDauSoul(); return true;
  },
};

// ================================================================ mô tả mốc cấp (ui.js hiện dưới thanh trượt)
DK.PB.moTaCap = function (cap) {
  const vk = nc.vk || DL.VU_KHI.find(v => v.ma === (DK.chon && DK.chon.vk)) || DL.VU_KHI[0];
  const p = tuMa(vk.pham), nt = TEN_NT[nguyenTo(new T.Color(vk.mau_hex))];
  const ds = [];
  // lớp vệt theo phẩm (luôn có, không cần +N)
  const lop = ['mực + màu thanh']; if (p >= BAO) lop.push('viền + hạt'); if (p >= HUYEN) lop.push('lớp trễ, khí bám lưỡi'); if (p >= TIEN) lop.push('tia ánh kim'); if (p >= THAN) lop.push('ảnh kiếm khổng lồ (nhát kết), vòng hư ảnh sau lưng, Tru Tiên Kiếm Trận');
  ds.push(PHAM_TEN[p] + ': ' + lop.join(', '));
  const moc = (n, s) => ds.push((cap >= n ? '● +' : '○ +') + n + ' ' + s + (cap >= n ? '' : ' (chưa)'));
  moc(3, 'vệt dày +18 %, +4 sợi, vạch sáng' + (p < LINH ? ', vệt phẩm tự động' : ''));
  moc(5, (p < HUYEN ? 'khí bám lưỡi; ' : '') + KIEM.ten1 + ': đòn trúng thứ 4 thêm 1 nhát kiếm khí ' + Math.round(KIEM.heSo1 * heSoNoiTai(p) * 100) + '%');
  moc(7, 'hạt nguyên tố ' + nt + ', quầng lưỡi màu phẩm; ' + KIEM.tenKK + ': đòn kết phóng trăng khuyết 9 m ' + Math.round(KIEM.heSoKK * heSoPham(p) * 100) + '%' + (p >= THAN ? ' ×3 lưỡi' : ''));
  moc(10, 'linh văn dọc lưỡi, trúng nở vòng linh văn; ' + KIEM.ten2 + ' ' + Math.round(KIEM.heSo2 * heSoPham(p) * 100) + '% — giữ K + J khi thanh đầy, O = kích thử');
  return ds.join(' · ');
};
})();
