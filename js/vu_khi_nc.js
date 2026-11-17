"use strict";
// ============================================================================
// vu_khi_nc.js — 2026-11-15 — BẢN NÂNG CẤP (đề xuất) hiệu ứng VŨ KHÍ KIẾM theo PHẨM (Phàm…Thần Khí) × CẤP CƯỜNG HOÁ +0..+10.
//   Người dùng: "+10 cũng không có gì gọi là đặc sắc" ⇒ mỗi mốc nhìn khác hẳn khi ĐỨNG YÊN và khi CHÉM:
//     +0 sạch · +3 rãnh lưỡi sáng + tinh quang mũi + vệt dày có lõi sáng · +5 khí kiếm xoắn quanh lưỡi, hạt voxel bay theo nhát,
//     bước chân để ấn sáng · +7 hai kiếm ảnh (kiếm hồn) sau vai CHÉM THEO từng đòn, vòng ấn dưới chân, mạch sáng chạy dọc rãnh ·
//     +10 KHÍ LINH HIỆN THÂN: kiếm luân 8 kiếm hồn sau lưng, trời nhuốm màu kiếm, đòn nặng để vết nứt sáng / rãnh,
//     phím O (hoặc giữ K + J khi thanh đầy) = Vạn Kiếm Quy Tông bản mới: kiếm luân bay lên, 8 kiếm cắm vây quanh đích, cự kiếm giáng,
//     nổ đất + rãnh + khung va chạm.
//   Phẩm đổi CHẤT LIỆU kiếm (thép / chắn tay / ngọc / viền lưỡi) và hào quang nhẹ; màu chủ đạo luôn là MÀU THANH KIẾM.
// Cách gắn: chỉ bọc lúc chạy (không sửa file khác). Khi DK.NC bật: tắt phần nhìn của vu_khi.js (đặt tb.coVuKhi = false + ẩn
//   quầng cũ), bọc vfx.vet / DK.VKH.theoDoiDai / apTrung / mauNhan / tb / datKhiLinh / dem và DK.PB.moTaCap. Tắt DK.NC ⇒ trả bản cũ.
// Port Unity: mọi thứ là khối (Box/Octahedron), quad, dải lưới (ribbon), hạt voxel, decal ấn (CanvasTexture ⇒ texture), bloom.
// ============================================================================
(function () {
const DK = window.DK, T = DK.T, V3 = DK.V3, D = DK.D, vfx = DK.vfx, scene = DK.scene, nc = DK.nc, dia = DK.dia;
if (!DK.VKH || !vfx.kiemThat || !vfx.phiKiem) return;
const VKH = DK.VKH;
const clamp = DK.clamp, lerp = DK.lerp, c01 = x => clamp(x, 0, 1);
const ngau = (a, b) => a + Math.random() * (b - a);
const LEN = new V3(0, 1, 0);
const bao = e => { console.error(e); DK.baoLoi(e); };
const PHAM_MA = ['pham', 'linh', 'bao', 'huyen', 'tien', 'than'];
const PHAM_TEN = ['Phàm Khí', 'Linh Khí', 'Bảo Khí', 'Huyền Khí', 'Tiên Khí', 'Thần Khí'];
const PHAM = 0, LINH = 1, BAO = 2, HUYEN = 3, TIEN = 4, THAN = 5;
const heSoPham = p => 1 + 0.08 * clamp(p, 0, 5);          // như KyNangVuKhiBang.cs
const heSoNoiTai = p => 0.9 + 0.05 * clamp(p, 0, 5);

// ---------------------------------------------------------------- chất liệu theo phẩm (thép, pha màu thanh, kim loại, nhám, tự sáng, chắn tay, ngọc, quang)
const PH = [
  { thep: 0x9ea3aa, pha: 0, met: .55, rough: .55, emi: .03, chan: 0x55524c, ngoc: .35, quang: 0, mo: 'sắt mộc, không quang' },
  { thep: 0xd6dde6, pha: .08, met: .8, rough: .32, emi: .1, chan: 0x8d6a3a, ngoc: .9, quang: .07, mo: 'thép tinh, chắn đồng, quang mờ' },
  { thep: 0xe2ebf5, pha: .18, met: .92, rough: .16, emi: .18, chan: 0xc9d3df, ngoc: 1.4, quang: .14, mo: 'bạc ngọc, viền lưỡi lam' },
  { thep: 0xc7c9dc, pha: .32, met: .75, rough: .12, emi: .3, chan: 0x2e2840, ngoc: 1.7, quang: .2, mo: 'huyền thiết, viền tím, linh vụ quanh lưỡi' },
  { thep: 0xf6edd6, pha: .15, met: 1, rough: .14, emi: .3, chan: 0xffcc55, ngoc: 2.1, quang: .24, mo: 'ánh kim, chắn vàng, kim quang lấp lánh' },
  { thep: 0xfff2dc, pha: .3, met: .9, rough: .1, emi: .55, chan: 0x3a0c10, ngoc: 2.6, quang: .3, mo: 'lõi lưỡi rực, chắn huyết ngọc, viền huyết, vòng hư ảnh sau lưng' },
];

// ---------------------------------------------------------------- trạng thái
const S = {
  on: false, vk: null, p: 0, n: 0, mau: new T.Color(1, 1, 1), mauP: new T.Color(1, 1, 1), kt: null, khoa: '',
  gan: [],          // vật gắn lên kiếm cầm tay (con của kt)
  canh: [],         // vật trong cảnh (theo người chơi)
  ranh: null, matChan: [], ngoc: null, sao: null, xoan: null, mach: [], vien: null,
  anh: null,        // +7: 2 kiếm ảnh sau vai [{k, an}]
  banh: null,       // +10: kiếm luân { g, ds:[{k, an}], loi, goc, toc }
  vongAn: null, vom: null, haoThan: null,
  tAnh: -9, iAnh: 0, tVet: -9, tKhi: 0, tMot: 0, kl: { dang: false },
};
const bat = () => DK.NC && !!nc.vk && !!nc.kiemThat;
const hex = c => '#' + c.getHexString();

// ================================================================ TẮT phần nhìn của bản game khi NC (không sửa vu_khi.js)
let tatCuDangBat = false;
/** nhận diện quầng của vu_khi.js: hộp cộng sáng (quầng lưỡi) hoặc lưới shader linh văn (uKieu) */
const laVan = o => !!(o && o.material && o.material.uniforms && o.material.uniforms.uKieu);
function laCu(o) {
  if (o.userData.vkNC) return false;
  if (laVan(o)) return true;
  if (o.isGroup && o.children.length && o.children.every(laVan)) return true;
  return !!(o.isMesh && o.geometry && o.geometry.type === 'BoxGeometry' && o.material && o.material.isMeshBasicMaterial && o.material.blending === T.AdditiveBlending && o.material.opacity < .2);
}
function tatCu() {
  const t = VKH.tb && VKH.tb();
  // tb của vu_khi.js là object nội bộ (dựng lại khi đổi kiếm/cấp) ⇒ đặt coVuKhi = false mỗi khung khi NC: khí bám lưỡi, vệt tự động,
  // lớp trúng, kỹ năng +5/+7/+10, thanh Khí Linh cũ đều nghỉ. Tắt NC ⇒ trả true + bắn doiVuKhi để bản cũ dựng lại quầng.
  if (t && DK.NC && t.coVuKhi) { t.coVuKhi = false; t._ncTat = true; }
  if (!DK.NC && tatCuDangBat) { tatCuDangBat = false; if (t && t._ncTat) { t._ncTat = false; t.coVuKhi = !!nc.vk; } DK.suKien('doiVuKhi', { vk: nc.vk, cap: DK.chon && DK.chon.cap }); }
  if (DK.NC) tatCuDangBat = true;
  // quầng lưỡi / linh văn cũ là con của nc.kiem, vòng hư ảnh cũ là con của nc.gan.lung
  for (const c of nc.kiem.children) if (laCu(c)) c.visible = !DK.NC;
  for (const c of nc.gan.lung.children) if (laCu(c)) c.visible = !DK.NC;
}

// ================================================================ tiện ích hình
const _m4 = new T.Matrix4();
/** quaternion: trục +z → z, trục +x gần xGoi (bản lưỡi) */
function qBasis(z, xGoi, out) {
  const zz = z.clone().normalize(); let x = xGoi.clone().addScaledVector(zz, -xGoi.dot(zz));
  if (x.lengthSq() < 1e-6) x = Math.abs(zz.y) < .9 ? new V3(0, 1, 0).cross(zz) : new V3(1, 0, 0).cross(zz);
  x.normalize(); const y = new V3().crossVectors(zz, x);
  _m4.makeBasis(x, y, zz); return (out || new T.Quaternion()).setFromRotationMatrix(_m4);
}
const matCong = (c, op = 1) => new T.MeshBasicMaterial({ color: c, transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false });
function bo(o) { if (!o) return; if (o.parent) o.parent.remove(o); o.traverse(m => { if (m.geometry && !m.geometry.giu) m.geometry.dispose(); if (m.material && !m.material.giu) m.material.dispose(); }); if (o.huyTua) o.huyTua(); }

// ---------------------------------------------------------------- ẤN (decal tròn trên đất / vòng linh văn) — CanvasTexture ⇒ Unity: texture decal
const _texAn = {};
function texAn(kieu) {
  if (_texAn[kieu]) return _texAn[kieu];
  const N = 256, cv = document.createElement('canvas'); cv.width = cv.height = N; const g = cv.getContext('2d');
  g.translate(N / 2, N / 2); g.strokeStyle = g.fillStyle = '#fff';
  const vong = (r, w) => { g.lineWidth = w; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); };
  const P2 = Math.PI * 2;
  if (kieu === 'vanh') {   // vầng hư ảnh (Thần Khí): hai vòng mảnh + 12 chấm, không vạch ngắm
    vong(118, 7); vong(96, 2.5);
    for (let i = 0; i < 12; i++) { g.save(); g.rotate(i / 12 * P2); g.fillRect(-5, -110, 10, 10); g.restore(); }
  } else if (kieu === 'chan') {   // dấu chân: ô vuông bo nhẹ + vạch
    g.fillRect(-40, -110, 80, 220); g.globalCompositeOperation = 'destination-out'; g.fillRect(-26, -90, 52, 180); g.globalCompositeOperation = 'source-over'; g.fillRect(-8, -60, 16, 120);
  } else {
    vong(122, 5); vong(104, 2.5);
    for (let i = 0; i < 48; i++) { g.save(); g.rotate(i / 48 * P2); g.fillRect(-1.5, -121, 3, i % 4 === 0 ? 15 : 6); g.restore(); }
    for (let i = 0; i < 8; i++) {   // 8 kiếm văn hướng tâm
      g.save(); g.rotate(i / 8 * P2 + Math.PI / 8); g.beginPath(); g.moveTo(0, -99); g.lineTo(6, -82); g.lineTo(0, -52); g.lineTo(-6, -82); g.closePath(); g.fill(); g.fillRect(-10, -52, 20, 4); g.fillRect(-2, -50, 4, 8); g.restore();
    }
    vong(46, 3);
    if (kieu === 2) { for (let i = 0; i < 16; i++) { g.save(); g.rotate(i / 16 * P2); g.fillRect(-5, -40, 10, 10); g.restore(); } vong(24, 2.5); for (let i = 0; i < 4; i++) { g.save(); g.rotate(i / 4 * P2); g.fillRect(-2, -22, 4, 44); g.restore(); } }
  }
  const t = new T.CanvasTexture(cv); _texAn[kieu] = t; return t;
}
/** mặt phẳng ấn (chưa thêm vào cảnh): r bán kính, mau, mo */
function matAn(kieu, mau, mo) { const m = matCong(mau, mo); m.map = texAn(kieu); m.polygonOffset = true; m.polygonOffsetFactor = -3; return m; }
function meshAn(kieu, r, mau, mo) { const m = new T.Mesh(new T.PlaneGeometry(r * 2, r * 2), matAn(kieu, mau, mo)); m.renderOrder = 3; return m; }
/** ấn trên đất có tuổi thọ (vfx.them ⇒ Backspace dọn): pos, r, { mau, mo, song, quay (rad/s), no (nở từ), kieu } */
function anDat(pos, r, op = {}) {
  const m = meshAn(op.kieu || 1, 1, op.mau || S.mau.clone().multiplyScalar(1.5), op.mo != null ? op.mo : .8);
  const g = new T.Group(); g.add(m); m.rotation.x = -Math.PI / 2; g.position.set(pos.x, dia.cao(pos.x, pos.z) + .04, pos.z); g.rotation.y = Math.random() * 6;
  const mo = m.material.opacity, sg = op.song || .8, no = op.no != null ? op.no : .6, vao = op.vao || .12;
  return vfx.them(g, sg, (dt, u, t) => {
    const k = DK.ease('o', Math.min(1, t / Math.max(.01, vao))); g.scale.setScalar(r * (no + (1 - no) * k));
    g.rotation.y += (op.quay || .8) * dt; m.material.opacity = mo * Math.min(1, t / Math.max(.01, vao)) * (u > .6 ? (1 - u) / .4 : 1);
  });
}

// ================================================================ ĐỌC VŨ KHÍ + DỰNG PHẦN GẮN
function docVK() {
  const vk = nc.vk; S.vk = vk; S.n = clamp((DK.chon && DK.chon.cap) | 0, 0, 10);
  S.p = vk ? Math.max(0, PHAM_MA.indexOf(vk.pham)) : 0;
  S.mau = new T.Color(vk ? vk.mau_hex : '#ffffff'); S.mauP = new T.Color(DL.PHAM[S.p].mau);
}
function goHet() {
  for (const o of S.gan) bo(o); for (const o of S.canh) bo(o);
  S.gan = []; S.canh = []; S.ranh = null; S.sao = null; S.xoan = null; S.mach = []; S.vien = null; S.anh = null; S.banh = null; S.vongAn = null; S.vom = null; S.haoThan = null;
}
function dung() {
  goHet(); docVK(); S.kt = nc.kiemThat; S.on = bat();
  S.khoa = (S.vk ? S.vk.ma : '') + '|' + S.n + '|' + S.on + '|' + (S.kt ? S.kt.uuid : '');
  if (!S.on) return;
  const kt = S.kt, L = kt.muiL, w = L * .075, ph = PH[S.p], n = S.n, c = S.mau;
  // --- chất liệu theo phẩm
  const ml = kt.luoi.material;
  ml.color.setHex(ph.thep).lerp(c, ph.pha); ml.metalness = ph.met; ml.roughness = ph.rough; ml.emissive.copy(c);
  ml.emissiveIntensity = ph.emi + (n >= 10 ? .3 : n >= 7 ? .16 : n >= 5 ? .1 : n >= 3 ? .05 : 0); ml.needsUpdate = true;
  S.matChan = []; S.ngoc = null; S.ranh = null;
  kt.traverse(o => {
    if (!o.isMesh || o === kt.luoi) return; const m = o.material;
    if (m.isMeshStandardMaterial && Math.abs(m.metalness - .9) < 1e-3 && Math.abs(m.roughness - .3) < 1e-3 && S.matChan.indexOf(m) < 0) S.matChan.push(m);
    if (m.isMeshBasicMaterial && o.geometry.type === 'OctahedronGeometry') S.ngoc = o;
    if (m.isMeshBasicMaterial && o.geometry.type === 'BoxGeometry' && Math.abs(o.position.z - L * .4) < 1e-3) S.ranh = o;
  });
  for (const m of S.matChan) { m.color.setHex(ph.chan); m.emissive = new T.Color(S.p >= TIEN ? ph.chan : 0); m.emissiveIntensity = S.p >= TIEN ? .25 : 0; m.roughness = S.p >= BAO ? .22 : .5; }
  if (S.ngoc) S.ngoc.material.color.copy(c).multiplyScalar(ph.ngoc);
  if (kt.bao) { const q = ph.quang + (n >= 10 ? .14 : n >= 5 ? .07 : 0); kt.bao.visible = q > 0; kt.bao.material.opacity = q; }
  // --- viền lưỡi màu phẩm (Bảo+): hai dải mảnh bám mép lưỡi, cộng sáng
  if (S.p >= BAO) {
    const P = [], zs = [L * .05, L * .84, L], ks = [1, .78, 0], e = w * (S.p >= TIEN ? .2 : .14);
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) {
      const a0 = s * w * .5 * ks[i], a1 = s * w * .5 * ks[i + 1], b0 = a0 + s * e * (1 - i * .3), b1 = a1 + s * e * .2;
      P.push(a0, 0, zs[i], b0, 0, zs[i], b1, 0, zs[i + 1], a0, 0, zs[i], b1, 0, zs[i + 1], a1, 0, zs[i + 1]);
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3));
    const m = new T.Mesh(g, matCong(S.mauP.clone().multiplyScalar(1.3), S.p >= THAN ? .95 : .8)); m.renderOrder = 6; kt.add(m); S.gan.push(m); S.vien = m;
  }
  // --- +3 tinh quang mũi kiếm
  if (n >= 3) {
    const sp = new T.Sprite(new T.SpriteMaterial({ map: vfx.texTron, color: c.clone().multiplyScalar(1.6), blending: T.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }));
    sp.position.z = L * 1.01; sp.renderOrder = 8; kt.add(sp); S.gan.push(sp); S.sao = sp;
  }
  // --- +5 khí kiếm xoắn quanh lưỡi (khối voxel cộng sáng chạy dọc lưỡi theo xoắn ốc)
  if (n >= 5) {
    const soSoi = n >= 10 ? 3 : 2, moiSoi = n >= 10 ? 18 : 13;
    const im = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), matCong(c.clone().multiplyScalar(n >= 10 ? 1.9 : 1.5), .9), soSoi * moiSoi);
    im.frustumCulled = false; im.renderOrder = 7; kt.add(im); S.gan.push(im); S.xoan = { im, soSoi, moiSoi, L, w, t: 0 };
  }
  // --- +7 mạch sáng chạy dọc rãnh (+10: 2 mạch)
  if (n >= 7) for (let i = 0; i < (n >= 10 ? 2 : 1); i++) {
    const m = new T.Mesh(new T.BoxGeometry(w * .22, w * .32 * 1.25, L * .1), new T.MeshBasicMaterial({ color: c.clone().lerp(new T.Color(1, 1, 1), .5).multiplyScalar(3), toneMapped: false }));
    m.renderOrder = 7; kt.add(m); S.gan.push(m); S.mach.push({ m, pha: i * .5 });
  }
  // --- +7 vòng ấn dưới chân (+10 ấn kép, to hơn)
  if (n >= 7) {
    const g = new T.Group(); const r = n >= 10 ? 1.55 : 1.15;
    const a = meshAn(n >= 10 ? 2 : 1, r, c.clone().multiplyScalar(1.1), n >= 10 ? .38 : .3); a.rotation.x = -Math.PI / 2; g.add(a);
    let b = null; if (n >= 10) { b = meshAn(1, r * .62, c.clone().multiplyScalar(1.5), .4); b.rotation.x = -Math.PI / 2; b.position.y = .005; g.add(b); }
    scene.add(g); S.canh.push(g); S.vongAn = { g, a, b, mo: a.material.opacity, pos: nc.pos.clone() };
  }
  // --- +7 hai kiếm ảnh sau vai
  if (n >= 7 && n < 10) {
    S.anh = [];
    for (const s of [-1, 1]) { const k = honDiu(vfx.kiemThat({ kieu: 'hon', dai: .85, mau: c, sang: 1.4 })); scene.add(k); S.canh.push(k); S.anh.push({ k, s, an: false, mo: 1, pos: null }); }
  }
  // --- +10 KHÍ LINH: kiếm luân 8 kiếm hồn sau lưng + lõi ngọc + trời nhuốm màu
  if (n >= 10) {
    const g = new T.Group(); scene.add(g); S.canh.push(g);
    const loi = new T.Mesh(new T.OctahedronGeometry(.07), new T.MeshBasicMaterial({ color: c.clone().lerp(new T.Color(1, 1, 1), .4).multiplyScalar(2.4), toneMapped: false })); g.add(loi);
    const vg = meshAn(1, .3, c.clone().multiplyScalar(1.2), .5); g.add(vg);
    const ds = [];
    for (let i = 0; i < 8; i++) { const k = honDiu(vfx.kiemThat({ kieu: 'hon', dai: .56, mau: c, sang: 1.5 }), .75); scene.add(k); S.canh.push(k); ds.push({ k, an: false, mo: 1 }); }
    S.banh = { g, loi, vg, ds, goc: 0, toc: .55, tang: 0, an: false };
    // vòm trời: bán cầu cộng màu, đậm ở đỉnh, 0 ở chân trời (không lộ đường nối với sương) ⇒ Unity: skybox tint
    const geo = new T.SphereGeometry(150, 32, 16), pos = geo.attributes.position, col = new Float32Array(pos.count * 4);
    for (let i = 0; i < pos.count; i++) { const y = pos.getY(i) / 150, a = Math.pow(c01((y - .02) / .7), .8); col.set([1, 1, 1, a], i * 4); }
    geo.setAttribute('color', new T.BufferAttribute(col, 4));
    const vom = new T.Mesh(geo, new T.MeshBasicMaterial({ color: c.clone().multiplyScalar(.75), vertexColors: true, transparent: true, opacity: .3, side: T.BackSide, depthWrite: false, fog: false, toneMapped: false }));
    vom.renderOrder = -5; vom.frustumCulled = false; scene.add(vom); S.canh.push(vom); S.vom = vom;
  }
  // --- Thần Khí (dưới +10): vòng hư ảnh sau lưng
  if (S.p >= THAN && n < 10) {
    const m = meshAn('vanh', .36, S.mauP.clone().lerp(c, .4).multiplyScalar(1.1), .3); m.userData.vkNC = true; m.position.set(0, .78, -.42); nc.gan.lung.add(m); S.gan.push(m); S.haoThan = m;
  }
}

// ================================================================ MỖI KHUNG: kiếm cầm tay
let tG = 0;
function capKiem(dt) {
  const n = S.n, c = S.mau, kt = S.kt, L = kt.muiL;
  // rãnh: +0 dịu, +3 sáng thở, +10 rực
  if (S.ranh) { const tho = .5 + .5 * Math.sin(tG * 3.2); const k = n >= 10 ? 2.9 + tho * .8 : n >= 7 ? 2.4 + tho * .6 : n >= 3 ? 1.9 + tho * .6 : .75; S.ranh.material.color.copy(c).multiplyScalar(k); }
  if (S.sao) { const k = (n >= 10 ? .34 : n >= 7 ? .24 : .15) * (.8 + .25 * Math.sin(tG * 5.3) + .1 * Math.sin(tG * 13)); S.sao.scale.setScalar(k); }
  if (S.vien) S.vien.material.opacity = (S.p >= THAN ? .95 : .8) * (.8 + .2 * Math.sin(tG * 2.4));
  if (S.xoan) {
    const x = S.xoan; x.t += dt; let i = 0;
    for (let s = 0; s < x.soSoi; s++) for (let j = 0; j < x.moiSoi; j++, i++) {
      const u = ((j / x.moiSoi) + x.t * .42) % 1, z = x.L * (.06 + .92 * u), a = u * Math.PI * 5 + x.t * 4 + s * Math.PI * 2 / x.soSoi;
      const r = x.w * (1.05 + .25 * Math.sin(u * 9 + x.t * 3)) * (1 - u * .45), co = x.w * .32 * Math.sin(Math.PI * u) * (n >= 10 ? 1.25 : 1);
      _m4.compose(new V3(Math.cos(a) * r, Math.sin(a) * r * .8, z), new T.Quaternion().setFromAxisAngle(new V3(0, 0, 1), a), new V3(co, co, co * 1.6)); x.im.setMatrixAt(i, _m4);
    }
    x.im.instanceMatrix.needsUpdate = true;
  }
  for (const m of S.mach) { const u = ((tG * 1.15 + m.pha) % 1.3) / 1.3; m.m.position.z = L * (.05 + u * .82); m.m.visible = u < .98; m.m.scale.z = .6 + Math.sin(Math.PI * u) * .7; }
  // hào quang theo phẩm (rất nhẹ): Huyền+ linh vụ, Tiên+ kim quang
  if (tG - S.tKhi > (S.p >= TIEN ? .12 : .2) && S.p >= HUYEN) {
    S.tKhi = tG; const pc = nc.can(), pm = nc.mui(), p = pc.lerp(pm, Math.random());
    vfx.hat(p, { so: 1, mau: S.p >= TIEN ? S.mauP.clone().lerp(new T.Color(1, 1, .9), .3) : S.mauP, toc: .3, huong: LEN, loe: .8, co: .025, song: .8, trongLuc: -.6, can: 2, sang: 1.3 });
  }
  // +5: khí kiếm bốc lên từ lưỡi (đứng yên cũng thấy)
  if (n >= 5) {
    S.tMot += dt * (n >= 10 ? 16 : 7);
    while (S.tMot >= 1) { S.tMot -= 1; const p = nc.can().lerp(nc.mui(), Math.sqrt(Math.random()));
      vfx.hat(p, { so: 1, mau: c, toc: .5, huong: LEN, loe: .6, co: ngau(.025, .045), song: ngau(.45, .8), trongLuc: -.8, can: 2.2, sang: 1.3 }); }
  }
}

// ---------------------------------------------------------------- vị trí ổ kiếm ảnh (+7) / kiếm luân (+10)
const _v1 = new V3(), _v2 = new V3();
function oAnh(s) {   // +7: sau vai, mũi chếch lên ngoài
  const r = nc.phai(), f = nc.toi(), bob = Math.sin(tG * 2.1 + s) * .04;
  const pos = nc.pos.clone().addScaledVector(r, s * .44).addScaledVector(f, -.36).add(new V3(0, 1.32 + bob, 0));
  const dir = r.clone().multiplyScalar(s * .38).add(new V3(0, 1, 0)).addScaledVector(f, -.22).normalize();
  return { pos, dir, x: r };
}
function oBanh(i) {   // +10: vương miện 8 kiếm hồn nằm ngang trên đầu, mũi hướng ra ngoài chếch lên (không che thân khi nhìn sau lưng)
  const B = S.banh, r = nc.phai(), f = nc.toi(), tam = nc.pos.clone().addScaledVector(f, -.12).add(new V3(0, 2.08 + Math.sin(tG * 1.7) * .04, 0));
  const a = B.goc + i * Math.PI / 4, d = r.clone().multiplyScalar(Math.cos(a)).addScaledVector(f, Math.sin(a));
  const tt = r.clone().multiplyScalar(-Math.sin(a)).addScaledVector(f, Math.cos(a));
  return { pos: tam.clone().addScaledVector(d, .2), dir: d.clone().multiplyScalar(.96).add(new V3(0, .28, 0)).normalize(), x: tt, tam, f, d };
}
const honPk = pk => { if (pk && pk.kiem) honDiu(pk.kiem, 1.2); return pk; };
/** kiếm hồn dịu (không cháy trắng dưới bloom) */
function honDiu(k, k0 = 1) {
  k.luoi.material.color.copy(S.mau).multiplyScalar(.95 * k0); k.luoi.material.opacity = .5;
  if (k.bao) k.bao.material.opacity = .16 * k0;
  k.traverse(o => { if (o.isMesh && o !== k.luoi && o !== k.bao && o.material.isMeshBasicMaterial && !o.material.transparent) o.material.color.copy(S.mau).multiplyScalar(1.7 * k0); });
  return k;
}
function capCanh(dt) {
  const k = 1 - Math.exp(-14 * dt);
  if (S.anh) for (const a of S.anh) {
    const o = oAnh(a.s); if (!a.pos) a.pos = o.pos.clone(); a.pos.lerp(o.pos, k);
    a.k.position.copy(a.pos); qBasis(o.dir, o.x, a.k.quaternion);
    a.mo += ((a.an ? 0 : 1) - a.mo) * Math.min(1, dt * 10); a.k.visible = a.mo > .05; a.k.scale.setScalar(.4 + .6 * a.mo);
  }
  if (S.banh) {
    const B = S.banh; B.tang = Math.max(0, B.tang - dt * 1.5); B.goc += dt * (B.toc + B.tang * 7);
    let o = null;
    for (let i = 0; i < 8; i++) {
      const d = B.ds[i]; o = oBanh(i); d.mo += ((d.an || B.an ? 0 : 1) - d.mo) * Math.min(1, dt * 10);
      d.k.position.copy(o.pos); qBasis(o.dir, o.x, d.k.quaternion); d.k.visible = d.mo > .05; d.k.scale.setScalar(.3 + .7 * d.mo);
    }
    o = oBanh(0); B.g.position.copy(o.tam); qBasis(LEN, nc.phai(), B.g.quaternion); B.g.visible = !B.an;
    B.loi.rotation.z += dt * 2; B.vg.rotation.z -= dt * .9;
  }
  if (S.vongAn) {
    const V = S.vongAn; V.pos.lerp(nc.pos, 1 - Math.exp(-10 * dt));
    const y = dia.cao(V.pos.x, V.pos.z); V.g.position.set(V.pos.x, y + .035, V.pos.z); V.g.rotation.y += dt * .35;
    if (V.b) V.b.rotation.z -= dt * .9;
    const cao = Math.max(0, nc.pos.y - y), tho = .85 + .15 * Math.sin(tG * 2.6);
    V.a.material.opacity = V.mo * tho * c01(1 - cao / 2.5); if (V.b) V.b.material.opacity = .4 * tho * c01(1 - cao / 2.5);
  }
  if (S.vom) { S.vom.position.copy(DK.cam.position); S.vom.material.opacity = S.kl.dang ? .4 : .3 + .04 * Math.sin(tG * .8); }
  if (S.haoThan) S.haoThan.rotation.z += dt * .4;
}

// ---------------------------------------------------------------- +5 bước chân để ấn sáng
let phaCu = 0, datCu = true;
function dauChan(ten) {
  const p = nc.diem(ten); const y = dia.cao(p.x, p.z);
  const m = new T.Mesh(new T.PlaneGeometry(.17, .3), matAn('chan', S.mau.clone().multiplyScalar(1.6), .85)); m.rotation.set(-Math.PI / 2, 0, 0); const g = new T.Group(); g.add(m); g.rotation.y = nc.yaw; g.position.set(p.x, y + .03, p.z);
  const sg = S.n >= 10 ? 2.2 : 1.5;
  vfx.them(g, sg, (dt, u) => { m.material.opacity = .85 * (1 - u) * (1 - u * .3); });
  vfx.hat(new V3(p.x, y + .05, p.z), { so: S.n >= 10 ? 4 : 2, mau: S.mau, toc: .8, huong: LEN, loe: .5, co: .035, song: .7, trongLuc: -.8, sang: 1.3 });
  if (S.n >= 10) anDat(p, .32, { song: 1.2, mo: .5, quay: 2, no: .3 });
}
function capBuoc() {
  if (S.n < 5) return;
  const v = Math.hypot(nc.vel.x, nc.vel.z), ph = Math.floor(nc.pha || 0);
  if (nc.datDat && v > .4 && ph !== phaCu && (ph === 0 || ph === 2)) {
    const r = nc.diem('chanR'), l = nc.diem('chanL'); dauChan(r.y < l.y ? 'chanR' : 'chanL');
  }
  if (nc.datDat && !datCu) { dauChan('chanR'); dauChan('chanL'); if (S.n >= 7) anDat(nc.pos, .9, { song: .7, mo: .7, quay: 3, no: .2 }); }
  phaCu = ph; datCu = nc.datDat;
}

// ================================================================ KHI CHÉM
/** kiếm ảnh chém theo nhát chém của người chơi (+7: 1 ảnh luân phiên; +10: 2 ảnh từ kiếm luân, nối đuôi) */
function chemAnh(lon) {
  if (!bat() || S.n < 7 || S.kl.dang || DK.now - S.tAnh < .1) return;
  S.tAnh = DK.now;
  const m0 = nc.mui(), c0 = nc.diem('nguc');
  DK.sau(.035, () => {
    if (!bat()) return;
    const m1 = nc.mui(); let d = m1.clone().sub(m0); const rel = m0.clone().sub(c0);
    if (d.lengthSq() < 1e-4) d = nc.phai().negate();
    let nn = new V3().crossVectors(rel, d); if (nn.lengthSq() < 1e-6) nn = LEN.clone(); nn.normalize();
    let u = rel.clone().projectOnPlane(nn); if (u.lengthSq() < 1e-6) u = nc.toi(); u.normalize();
    const w = new V3().crossVectors(nn, u); if (w.dot(d) < 0) w.negate();
    if (S.banh) {
      const i0 = (S.iAnh++ * 3) % 8; S.banh.tang = 1;
      oAnhBay({ banh: i0 }, u, w, 0, lon); DK.sau(.06, () => oAnhBay({ banh: (i0 + 4) % 8 }, u, w, 1, lon));
    } else if (S.anh) { const a = S.anh[S.iAnh++ % 2]; oAnhBay({ anh: a }, u, w, 0, lon); }
  });
}
function oAnhBay(slot, u, w, j, lon) {
  const ds = slot.anh || (S.banh && S.banh.ds[slot.banh]); if (!ds || ds.an) return;
  const R0 = .42 + j * .14, L = (S.banh ? 1.3 : 1.15) * (lon ? 1.25 : 1) + j * .12, g0 = -40 * D, g1 = 150 * D, T1 = .2, T2 = .26;
  const pk = vfx.phiKiem({ kieu: 'hon', dai: L, mau: S.mau, sang: 1.7, vet: false, song: T1 + T2 + .1 }); honDiu(pk.kiem, 1.15);
  ds.an = true;
  const p0 = new V3(), p1 = new V3();
  const gia = { vk: S.vk, can: o => o.copy(p0), mui: o => o.copy(p1) };   // "nhân vật giả" để dùng lại vfx.vet cho vệt quét của kiếm ảnh
  const vitri = (r, c) => { p0.copy(c).addScaledVector(r, R0); p1.copy(p0).addScaledVector(r, L); };
  const c0 = nc.diem('nguc'); vitri(u.clone().multiplyScalar(Math.cos(g0)).addScaledVector(w, Math.sin(g0)), c0);
  vfx.vet(gia, { song: T1, tan: .2, kieu: 'sang', mau: S.mau, rong: .7 }); if (vfx._vet && vfx._vet.lop[1]) { vfx._vet.lop[0].alpha = .42; vfx._vet.lop[1].alpha = .12; }   // lõi trắng nhạt ⇒ vệt kiếm ảnh giữ màu thanh
  let cuoi = null;
  DK.lap((dt, tl) => {
    if (!bat()) { pk.huy(); ds.an = false; return false; }
    const c = nc.diem('nguc');
    if (tl < T1) {
      const e = DK.ease('o', tl / T1), a = g0 + (g1 - g0) * e, r = u.clone().multiplyScalar(Math.cos(a)).addScaledVector(w, Math.sin(a));
      vitri(r, c); pk.dat(p0.clone().addScaledVector(r, L * .35), r); pk.kiem.scale.setScalar(Math.min(1, .3 + tl / .05));
      cuoi = { pos: pk.o.position.clone(), dir: r.clone() };
    } else {
      const k = DK.ease('io', (tl - T1) / T2), o = ds.k ? (slot.anh ? oAnh(ds.s) : oBanh(slot.banh)) : null;
      if (!o || !cuoi) return false;
      const dich = o.pos.clone().addScaledVector(o.dir, L * .2), dir = cuoi.dir.clone().lerp(o.dir, k).normalize();
      pk.dat(cuoi.pos.clone().lerp(dich, k), dir); pk.kiem.scale.setScalar(1 - .4 * k);
      if (tl >= T1 + T2) { pk.huy(); ds.an = false; return false; }
    }
  }, T1 + T2 + .1);
  DK.sau(T1 + T2 + .12, () => { ds.an = false; });
}
/** +5: hạt voxel bay theo mũi trong lúc vệt đang ghi */
function hatTheoVet(nv, ghi) {
  const n = S.n; let truoc = nv.mui();
  DK.lap((dt, tl) => {
    if (tl > ghi) return false;
    const m = nv.mui(), v = m.clone().sub(truoc); truoc = m;
    if (v.lengthSq() < 1e-6) return;
    const so = n >= 10 ? 3 : 2;
    vfx.hat(m, { so, mau: S.mau, toc: n >= 10 ? 3.2 : 2.2, huong: v.normalize(), loe: .7, co: .045, song: .45, trongLuc: 2, can: 2.5, sang: 1.4, lech: .06 });
  }, ghi + .05);
}

// ---------------------------------------------------------------- bọc vfx.vet (đòn chém của MỌI bộ NC dùng hàm này)
const vetTruoc = vfx.vet;
vfx.vet = function (nv, op = {}) {
  if (nv !== nc || !bat()) return vetTruoc.call(vfx, nv, op);
  const n = S.n, o2 = Object.assign({}, op);
  if (n >= 3) o2.rong = Math.min(1, (op.rong != null ? op.rong : .85) * (n >= 10 ? 1.3 : n >= 7 ? 1.22 : 1.15));
  const x = vetTruoc.call(vfx, nv, o2);
  const ghi = op.song != null ? op.song : .14;
  S.tVet = DK.now;
  try {
    if (n >= 3 && op.kieu !== 'sang') {   // lõi sáng mảnh sát mũi (màu thanh, lõi trắng nhạt) — không trùm nhân vật
      vetTruoc.call(vfx, nv, { song: ghi, tan: (op.tan != null ? op.tan : .22) * .7, kieu: 'sang', mau: op.mau != null ? op.mau : S.mau, rong: n >= 10 ? .34 : n >= 7 ? .28 : .22 });
      const L = vfx._vet && vfx._vet.lop; if (L && L[0]) { L[0].alpha = n >= 7 ? .6 : .5; if (L[1]) L[1].alpha = .3; }
    }
    if (n >= 5) hatTheoVet(nv, ghi);
    if (n >= 7) chemAnh(ghi > .18);
  } catch (e) { bao(e); }
  return x;
};
// mốc clip "vet*" của bộ không gọi vfx.vet (tự vẽ vệt) ⇒ vẫn cho kiếm ảnh + hạt
DK.nghe('moc', e => {
  try {
    if (!e || e.nv !== nc || !bat() || !/^vet/.test(e.moc) || DK.now - S.tVet < .05) return;
    if (S.n >= 5) hatTheoVet(nc, .12); if (S.n >= 7) chemAnh(false);
  } catch (er) { bao(er); }
});

// ---------------------------------------------------------------- lớp TRÚNG (thay ApTrung khi NC)
let tApTay = -9, pApTay = new V3();
function chuThap(diem, huong, co, mau) {   // chớp chữ thập mảnh (2 quad cộng sáng) quay về máy
  const g = new T.Group(); g.position.copy(diem); g.quaternion.copy(DK.cam.quaternion); g.rotateZ(Math.random() * 3);
  const mt = matCong(mau.clone().multiplyScalar(2), 1);
  for (let i = 0; i < 2; i++) { const m = new T.Mesh(new T.PlaneGeometry(co, co * .06), mt); m.rotation.z = i * Math.PI / 2 + (i ? .25 : 0); g.add(m); }
  vfx.them(g, .14, (dt, u) => { g.scale.set(.4 + u * .9, 1 - u * .6, 1); mt.opacity = 1 - u * u; });
}
let tApCuoi = -9;
function apTrungNC(diem, huong, nang) {
  if (DK.now - tApCuoi < .07 && nang < 3) return; tApCuoi = DK.now;   // nhiều cú trúng dồn ⇒ không chồng lớp
  const n = S.n, p = S.p, c = S.mau, nn = clamp(Math.round(nang), 0, 3);
  huong = huong && huong.lengthSq() > 1e-6 ? huong.clone().normalize() : nc.toi();
  vfx.hat(diem, { so: 5 + nn * 3, mau: c, toc: 4.5 + nn, huong: huong.clone().add(new V3(0, .2, 0)), loe: .6, co: .055, song: .35, trongLuc: 8, sang: 1.4 });
  if (n >= 3) chuThap(diem, huong, .55 + nn * .15, c);
  if (n >= 5) vfx.vong(diem, { bk0: .1, bk1: .6 + nn * .15, song: .18, mau: c, day: .05, op: .55, phap: DK.cam.position.clone().sub(diem) });
  if (n >= 7) anDat(diem, .55 + nn * .15, { song: .55, mo: .75, quay: 4, no: .3, vao: .06 });
  if (n >= 10) {
    const m = meshAn(2, .32 + nn * .1, c.clone().multiplyScalar(1.3), .6); const g = new T.Group(); g.add(m); g.position.copy(diem); g.quaternion.copy(DK.cam.quaternion);
    vfx.them(g, .3, (dt, u) => { g.scale.setScalar(.6 + DK.ease('o', u) * .8); m.rotation.z += dt * 5; m.material.opacity = .6 * (1 - u * u); });
    if (nn >= 2) { const q = new V3(diem.x, 0, diem.z); dia.nut(q, { r: 1.2 + nn * .35, nhanh: 3 + nn, mau: c, song: 2.2, rong: .06 }); dia.vun(q, { so: 6 + nn * 3, luc: 2.5, len: 3.5, co: .14, r: .4 }); }
  }
  if (p >= TIEN && nn >= 1) for (let i = 0; i < 4; i++) { const d = new V3(ngau(-1, 1), ngau(-.3, 1), ngau(-1, 1)).normalize(); vfx.tia(diem.clone().addScaledVector(d, .12), diem.clone().addScaledVector(d, ngau(.5, .8)), { rong: .025, mau: S.mauP.clone().lerp(new T.Color(1, 1, .9), .4), song: .1 }); }
  if (p >= THAN) vfx.hat(diem, { so: 4 + nn * 2, mau: S.mauP.clone().multiplyScalar(.6), toc: 3, huong: huong.clone().negate().add(new V3(0, .5, 0)), loe: .8, co: .07, song: .5, trongLuc: 10, to: true });
}

// ================================================================ KỸ NĂNG VŨ KHÍ (bản nâng cấp — cùng số với KyNangVuKhiBang.cs: +5 40 %, +7 60 % · 9 m · 20 m/s, +10 450 %)
const KL = { v: 0, demTrung: 0, tbSat: -1, maVK: null, dangPhat: false, dem: { trung: 0, ket: 0, noiTai: 0, kiemKhi: 0, khiLinh: 0 } };
function danhPhu(dich, st, huong, nang, op = {}) {
  if (!dich || st <= 0) return;
  KL.dangPhat = true;
  try { DK.trung(dich, Object.assign({ st, nguon: nc, mau: hex(S.mau), vkPhu: true, vkNC: true }, op)); } finally { KL.dangPhat = false; }
  try { apTrungNC(dich.diem('nguc'), huong, nang); } catch (e) { bao(e); }
}
/** +5 Kiếm Tâm Thông Minh: kiếm hồn hiện trên đầu đích, chém chéo xuyên ngực */
function noiTai(dich, st) {
  const tam = dich.diem('nguc'), r = nc.phai(), h = dich.pos.clone().sub(nc.pos).setY(0).normalize(), s = Math.random() < .5 ? 1 : -1;
  const a = tam.clone().addScaledVector(r, -1.1 * s).add(new V3(0, 1.3, 0)).addScaledVector(h, -.2), b = tam.clone().addScaledVector(r, 1.1 * s).add(new V3(0, -.8, 0)).addScaledVector(h, .2);
  const pk = vfx.phiKiem({ kieu: 'hon', dai: 1.1, mau: S.mau, sang: 1.8, vet: true, song: .6 }); honDiu(pk.kiem, 1.2);
  const dir = b.clone().sub(a).normalize(); let daDanh = false;
  pk.dat(a, dir);
  DK.lap((dt, tl) => {
    const k = DK.ease('o', Math.min(1, tl / .14)); pk.dat(a.clone().lerp(b, k), dir); pk.kiem.scale.setScalar(tl > .3 ? Math.max(.01, 1 - (tl - .3) / .2) : 1);
    if (!daDanh && tl > .06) { daDanh = true; danhPhu(dich, st, dir, 1); }
    if (tl > .5) { pk.huy(); return false; }
  }, .6);
}
/** một phi kiếm bay thẳng (kiếm khí +7 / Thần ×3) */
function phongKiem(h, tam, toc, st) {
  h = h.clone().setY(0).normalize();
  const goc = nc.quanh(0, 1.05, .5), pk = vfx.phiKiem({ dai: 1.05, co: 1.25, mau: S.mau, sang: 1.6, vet: true, song: tam / toc + .3 });
  const daTrung = []; let di = 0, truoc = goc.clone();
  pk.dat(goc, h);
  vfx.cung(goc.clone().addScaledVector(h, .4), h, { bk: .7, goc: 120, mau: S.mau.clone().multiplyScalar(1.3), song: .16, day: .22 });
  DK.lap((dt, tl) => {
    const buoc = Math.min(tam - di, toc * dt); di += buoc;
    const p = goc.clone().addScaledVector(h, di); pk.dat(p, h);
    const dat = new V3(p.x, 0, p.z), dTruoc = new V3(truoc.x, 0, truoc.z); dia.cat(dTruoc, dat, .45); dia.gio(dat, 1.2, .5);
    if (S.n >= 10) dia.ranh(dTruoc, dat, .22, .14, { mau: S.mau, giu: 4 });
    truoc = p;
    for (const x of DK.dsBuNhin) { if (daTrung.indexOf(x) >= 0) continue; const q = x.pos.clone().add(new V3(0, 1, 0)); if (q.distanceTo(p) > 1.05) continue; daTrung.push(x); danhPhu(x, st, h, 2, { day: .5 }); }
    if (di >= tam - 1e-3) { vfx.hat(p, { so: 10, mau: S.mau, toc: 3, co: .05, song: .4, sang: 1.3 }); pk.huy(); return false; }
  }, tam / toc + .5);
}
function kiemKhi(dich, st) {
  let h = dich ? dich.pos.clone().sub(nc.pos) : nc.toi(); h.setY(0); h = h.lengthSq() > 1e-4 ? h.normalize() : nc.toi();
  if (S.p >= THAN) { for (let k = -1; k <= 1; k++) phongKiem(h.clone().applyAxisAngle(LEN, 20 * k * D), 9, 20, st); }
  else phongKiem(h, 9, 20, st);
}
/** mỗi đòn THƯỜNG trúng (như KyNangVuKhi.KhiTrungDon) */
function khiTrungDon(dich, st, ket) {
  if (KL.maVK !== S.vk.ma) { KL.maVK = S.vk.ma; KL.v = 0; KL.demTrung = 0; }
  st = Math.max(0, st); KL.tbSat = KL.tbSat < 0 ? st : lerp(KL.tbSat, st, .2);
  const p = S.p, n = S.n; KL.demTrung++; KL.dem.trung++; if (ket) KL.dem.ket++;
  if (n >= 5 && dich && KL.demTrung % 4 === 0) { KL.dem.noiTai++; noiTai(dich, st * .40 * heSoNoiTai(p)); }
  if (n >= 7 && ket) { KL.dem.kiemKhi++; kiemKhi(dich, st * .60 * heSoPham(p)); }
  if (p >= THAN && ket && n < 7) { const h = dich ? dich.pos.clone().sub(nc.pos) : nc.toi(); phongKiem(h, 9 * .8, 20, st * .3 * heSoPham(p)); }
  if (n >= 10) KL.v = Math.min(1, KL.v + (ket ? .12 : .06) * (1 + .05 * p));
  // +10: đòn kết xẻ rãnh sáng trước mặt
  if (n >= 10 && ket && dich) { const a = nc.quanh(0, 0, .7), b = dich.pos.clone().addScaledVector(nc.toi(), 1.2); dia.ranh(a, b, .3, .22, { mau: S.mau }); dia.cat(a, b, .6); }
}

// ---------------------------------------------------------------- đòn thường / đòn kết (như vu_khi.js, nhưng bọc cả bộ NC)
const DON = { t: -9, ket: false, tChieu: -9, hdCu: null };
const tungGoc = DK.tungChieu;
DK.tungChieu = function () { DON.tChieu = DK.now; return tungGoc.apply(this, arguments); };
function bocDanh() {
  for (const BANG of [DK.BO, DK.BO_NC || {}]) for (const ma in BANG) {
    const b = BANG[ma]; if (!b || !b.danh || b.danh._vkNC) continue;
    const goc = b.danh; b.danh = function (ctx, i) { DON.t = DK.now; DON.ket = i === (b.soNhat || 7) - 1; return goc.apply(this, arguments); }; b.danh._vkNC = true;
  }
}
DK.nghe('buoc', () => {
  if (nc.hd !== DON.hdCu) { DON.hdCu = nc.hd; const m = nc.hd && /^DANH_(\d)$/.exec(nc.hd.clip.ten);
    if (m && DK.now - DON.tChieu > .02) { const b = DK.boDung ? DK.boDung(DK.chon.bo) : DK.BO[DK.chon.bo]; if (!(b && b.danh)) { DON.t = DK.now; DON.ket = +m[1] === 7; } } }
});
DK.nghe('trung', e => {
  try {
    if (!bat()) return;
    const op = e.op || {}; if (op.vkPhu || op.vkNC || KL.dangPhat) return;
    if (op.nguon && op.nguon !== nc) return; if (!e.dich || e.dich === nc) return;
    const laDon = DON.t > DON.tChieu && DK.now - DON.t < 1.0, ket = laDon && DON.ket;
    const diem = e.dich.diem('nguc');
    const soul = DK.chon && DK.chon.bo === 'huyet_nguyet';   // bộ Soul: lớp trúng cho mọi cú; bộ khác chỉ đòn thường (chiêu giữ màu bộ)
    if ((laDon || soul) && !(DK.now - tApTay < .03 && pApTay.distanceTo(diem) < 1)) apTrungNC(diem, e.dich.pos.clone().sub(nc.pos), ket ? 3 : (op.hat || op.st > 120 ? 2 : 1));
    if (laDon) khiTrungDon(e.dich, op.st != null ? op.st : 50, ket);
  } catch (er) { bao(er); }
});

// ================================================================ +10 KHÍ LINH — VẠN KIẾM QUY TÔNG (bản nâng cấp)
DK.ttBang([
  'VKN_TU',  'tor:34,-58 head:-22,52 aR:26,0,-58 fR:-14 w:112 aL:-80,0,14 fL:-18 lR:-80,0,-8 sR:102 lL:42,0,10 sL:80 ao:22',
  'VKN_GIO', 'tor:-12,-18 head:-30,14 aR:-198,0,-8 fR:-4 w:90 aL:-84,0,46 fL:-64 lR:-58,0,-16 sR:80 lL:42,0,14 sL:46 ao:16 toc:12',
  'VKN_CHI', 'tor:22,-34 head:-14,30 aR:-96,0,-6 fR:0 w:90 aL:-24,0,52 fL:-36 lR:-74,0,-12 sR:100 lL:44,0,12 sL:52 ao:30 toc:16',
  'VKN_BW',  'tor:-6,-50,-10 head:-6,42 aR:-176,0,-40 fR:-52 w:70 aL:-60,0,30 fL:-80 lR:-40,0,-10 sR:60 lL:34,0,10 sL:54 ao:10',
  'VKN_BO',  'tor:50,62,10 head:-40,-52 aR:-70,0,64 fR:0 w:90 aL:20,0,46 fL:-14 lR:-92,0,-10 sR:104 lL:66,0,10 sL:8 cL:34 ao:70 toc:50',
]);
DK.clip('VKN_QUY_TONG', '0 THU; .14 VKN_TU o; .46 VKN_GIO o; .92 VKN_GIO; 1.06 VKN_CHI o; 1.3 VKN_CHI; 1.4 VKN_BW o; 1.52 VKN_BO o; 1.9 VKN_BO; 2.25 THU s',
  '0 0 0; 1.4 0 0; 1.56 0 .7 o', { vet0: 1.4, huy: 2.0 }, { xoay: [.14, .46, 360], tron: .06 });
const khiLinhDay = () => bat() && S.n >= 10 && KL.maVK === S.vk.ma && KL.v >= .999;
function mucTieuXa(xa) { let tot = null, d0 = 1e9; for (const b of DK.dsBuNhin) { const d = b.pos.distanceTo(nc.pos); if (d < d0 && d <= xa) { d0 = d; tot = b; } } return DK.khoa && DK.khoa.pos.distanceTo(nc.pos) <= xa ? DK.khoa : tot; }
function hienTen(t) { const e = document.querySelector('#ten_chieu'); if (!e) return; e.textContent = t; e.classList.remove('hien'); void e.offsetWidth; e.classList.add('hien'); }
function kichKhiLinh() {
  if (!bat() || S.n < 10 || S.kl.dang) return false;
  KL.maVK = S.vk.ma; KL.v = 0; KL.dem.khiLinh++;
  const c = S.mau, tong = (KL.tbSat > 0 ? KL.tbSat : 16) * 4.5 * heSoPham(S.p);
  const dich = mucTieuXa(14); if (dich) nc.ngam(dich.pos);
  const tamD = dich ? dich.pos.clone().setY(0) : nc.quanh(0, 0, 7).setY(0);
  S.kl.dang = true; hienTen('[O] Khí Linh · Vạn Kiếm Quy Tông');
  DK.phat(nc, 'VKN_QUY_TONG', { moc: { vet0: () => vfx.vet(nc, { song: .14, tan: .3 }) }, xong: () => { S.kl.dang = false; } });
  DK.sau(2.3, () => { S.kl.dang = false; });
  // pha 1 — tụ khí: ấn lớn dưới chân, cỏ rạp, trời tối nhuốm màu kiếm, viền màn
  vfx.vienMan(c, 2.4, .18); vfx.troi(c.clone().multiplyScalar(.07), 2.6, .42); DK.rung(.08, .2);
  anDat(nc.pos, 3.2, { kieu: 2, song: 2.3, mo: .24, quay: .9, no: .2, vao: .35, mau: c.clone().multiplyScalar(1) });
  dia.gio(nc.pos, 6, 1.1);
  // kiếm luân rời lưng: 8 phi kiếm hồn bay lên đỉnh đầu, quay thành vòng nằm ngang
  const B = S.banh; if (B) B.an = true;
  const ds = [];
  for (let i = 0; i < 8; i++) {
    const o = B ? oBanh(i) : { pos: nc.quanh(0, 1.5, -.5), dir: LEN.clone() };
    const pk = vfx.phiKiem({ kieu: 'hon', dai: .9, co: 1.3, mau: c, sang: 1.9, vet: true, song: 1.6 }); honDiu(pk.kiem, 1.2);
    pk.dat(o.pos, o.dir); ds.push({ pk, p0: o.pos.clone(), d0: o.dir.clone(), i, bay: false, xong: false });
  }
  const TAM_TREN = new V3(0, 3.5, 0); let goc = 0;
  const viTriVong = (i, k) => {   // k 0..1: vương miện trên đầu → vòng lớn cao 3,5 m, kiếm xoay dần thành tiếp tuyến (đuổi nhau)
    const r = nc.phai(), f = nc.toi(), R = lerp(.2, 2.1, DK.ease('o', k));
    const tam = nc.pos.clone().addScaledVector(f, -.12 * (1 - k)).add(new V3(0, lerp(2.08, 3.5, DK.ease('o', k)), 0));
    const a = goc + i * Math.PI / 4, d = r.clone().multiplyScalar(Math.cos(a)).addScaledVector(f, Math.sin(a));
    const tt = r.clone().multiplyScalar(-Math.sin(a)).addScaledVector(f, Math.cos(a));
    return { pos: tam.addScaledVector(d, R), dir: d.clone().multiplyScalar(.96).add(new V3(0, .28 * (1 - k), 0)).lerp(tt, k * .85).normalize() };
  };
  const cam = [];
  DK.lap((dt, tl) => {
    goc += dt * lerp(1, 9, c01(tl / .9));
    for (const s of ds) {
      if (s.xong) continue;
      const tBay = .92 + s.i * .05;
      if (tl < tBay) { const k = c01(tl / .8), o = viTriVong(s.i, k); s.pk.dat(o.pos, o.dir); s.p0.copy(o.pos); s.d0.copy(o.dir); continue; }
      // pha 2 — lần lượt vút cong lên rồi cắm xuống thành vòng vây quanh đích
      if (!s.bay) { s.bay = true; s.a = s.p0.clone(); const g = s.i * Math.PI / 4 + .3; s.b = tamD.clone().add(new V3(Math.cos(g) * 2.4, .5, Math.sin(g) * 2.4)); s.cc = s.a.clone().lerp(s.b, .4).add(new V3(0, 3.2, 0)); s.t0 = tl; }
      const u = c01((tl - s.t0) / .3), e = DK.ease('i', u) * .6 + u * .4, v = 1 - e;
      const p = s.a.clone().multiplyScalar(v * v).addScaledVector(s.cc, 2 * v * e).addScaledVector(s.b, e * e);
      const tan = s.cc.clone().sub(s.a).multiplyScalar(2 * v).addScaledVector(s.b.clone().sub(s.cc), 2 * e);
      s.pk.dat(p, tan.lengthSq() > 1e-6 ? tan : new V3(0, -1, 0));
      if (u >= 1) {
        s.xong = true; s.pk.huy();
        const huong = tamD.clone().sub(s.b).setY(0).normalize().multiplyScalar(.35).add(new V3(0, -1, 0)).normalize();
        cam.push({ k: honPk(dia.camKiem(s.b.clone(), huong, { kieu: 'hon', dai: .9, co: 1.3, mau: c, sang: 1.8, song: 2.4 })), p: s.b.clone().setY(0) });
        const q = s.b.clone().setY(0);
        dia.nut(q, { r: 1, nhanh: 3, mau: c, song: 2.6, rong: .05 }); dia.vun(q, { so: 6, luc: 2, len: 3, co: .12, r: .3 });
        vfx.hat(q.clone().setY(.2), { so: 8, mau: c, toc: 3, huong: LEN, loe: .7, co: .05, song: .4, sang: 1.4 });
        DK.rung(.05, .1);
        if (dich && dich.pos.distanceTo(tamD) < 3.4) { KL.dangPhat = true; try { DK.trung(dich, { st: tong * .04, nguon: nc, mau: hex(c), vkPhu: true, vkNC: true, trangThai: s.i === 0 ? 'Trói' : undefined, khongPhanUng: s.i > 0 }); } finally { KL.dangPhat = false; } }
      }
    }
    if (tl > 1.6) return false;
  }, 1.7);
  // pha 3 — cự kiếm hồn hiện trên đích (1.06), giáng xuống (1.47 → 1.55)
  DK.sau(1.06, () => {
    if (!bat()) return;
    const L = 4.2, cu = vfx.phiKiem({ kieu: 'kiem', dai: 1, co: L, mau: c, sang: 1.0, vet: true, song: 1.9, tua: S.p >= TIEN ? 0xffcc55 : true });   // cự kiếm THẬT (thép + rãnh sáng) để đọc ra hình kiếm
    const xuong = new V3(0, -1, 0), yT = .65 * L - .9;
    anDat(tamD, 2.7, { kieu: 1, song: 1.4, mo: .5, quay: -1.4, no: .4, vao: .3 });
    DK.lap((dt, tl) => {
      let y;
      if (tl < .41) { y = lerp(6.4, 4.6, DK.ease('o', tl / .41)); cu.kiem.scale.setScalar(Math.min(1, .2 + tl / .25)); }
      else if (tl < .49) y = lerp(4.6, yT, DK.ease('i', (tl - .41) / .08));
      else y = yT - Math.max(0, tl - .9) * 1.6;
      cu.dat(new V3(tamD.x, y, tamD.z), xuong);
      if (tl > .9) cu.kiem.scale.setScalar(Math.max(.01, 1 - (tl - .9) / .5));
      if (tl > 1.4) { cu.huy(); return false; }
    }, 1.5);
  });
  // va chạm (1.55): khung va chạm, nổ đất cấp 3, rãnh xẻ từ chân tới đích, 8 kiếm cắm nổ thành cột sáng
  DK.sau(1.55, () => {
    if (!bat()) return;
    vfx.vaCham({ kieu: 'dao', mau: c, song: .08 });
    dia.no(tamD, { muc: 3, r: 2.3, mau: c });
    const a = nc.quanh(0, 0, 1.1); dia.ranh(a, tamD, .55, .42, { mau: c }); dia.cat(a, tamD, .9);
    vfx.vong(tamD, { bk0: .5, bk1: 7.5, song: .55, mau: c.clone().multiplyScalar(1.1), day: .35, op: .7 });
    vfx.cot(tamD, { r: .35, cao: 7, mau: c.clone().multiplyScalar(.9), song: .35, op: .55 });
    vfx.den(tamD.clone().setY(1.5), { mau: c, manh: 7, xa: 16, song: .6 });
    DK.rung(.42, .5);
    for (const x of cam) { vfx.cot(x.p, { r: .12, cao: 3.6, mau: c.clone().multiplyScalar(.9), song: .4, op: .6 }); vfx.hat(x.p.clone().setY(.5), { so: 6, mau: c, toc: 4, huong: LEN, loe: .5, co: .05, song: .45, sang: 1.4 }); if (x.k) x.k.huy(); }
    KL.dangPhat = true;
    try { for (const d of DK.trongTron(tamD, 3.4)) { DK.trung(d, { st: tong * .68, nguon: nc, mau: hex(c), hat: 1.2, vkPhu: true, vkNC: true }); apTrungNC(d.diem('nguc'), d.pos.clone().sub(nc.pos), 3); } } finally { KL.dangPhat = false; }
  });
  DK.sau(2.0, () => { if (S.banh) S.banh.an = false; });
  return true;
}
// phím: O = kích (HTML; game: giữ K + J khi thanh đầy)
DK.nghe('phim', k => {
  try {
    if (!bat()) return;
    if (k === 'o' && S.n >= 10) kichKhiLinh();
    else if (k === 'j' && DK.phim.k && khiLinhDay()) { if (nc.hd && nc.hd.t < .02) nc.hd.dung(); nc.choDanh = false; kichKhiLinh(); }
  } catch (e) { bao(e); }
});
// vu_khi.js (đã tắt) vẫn báo "Khí Linh mở ở +10" khi bấm O ⇒ nuốt câu đó lúc +10 bản nâng cấp
const chuGoc = vfx.chu;
vfx.chu = function (text) { if (text === 'Khí Linh mở ở +10' && bat() && S.n >= 10) return; return chuGoc.apply(this, arguments); };

// ---------------------------------------------------------------- thanh Khí Linh (DOM — chỉ bản nâng cấp)
const thanh = document.createElement('div');
thanh.style.cssText = 'position:fixed;left:50%;bottom:58px;transform:translateX(-50%);display:none;align-items:center;gap:8px;font:bold 12px sans-serif;color:#ddd;text-shadow:0 0 3px #000;pointer-events:none;z-index:5';
thanh.innerHTML = '<div style="width:150px;height:9px;background:rgba(8,6,8,.85);outline:1px solid #888;position:relative;transform:skewX(-18deg)"><i style="position:absolute;left:0;top:0;bottom:0;width:0"></i></div><span></span>';
document.body.appendChild(thanh);
function veThanh() {
  const co = bat() && S.n >= 10; thanh.style.display = co ? 'flex' : 'none'; if (!co) return;
  const v = KL.maVK === S.vk.ma ? KL.v : 0, day = v >= .999;
  thanh.firstChild.style.outlineColor = DL.PHAM[S.p].mau;
  const i = thanh.querySelector('i'); i.style.width = (v * 100) + '%'; i.style.background = hex(S.mau); i.style.boxShadow = day ? '0 0 8px ' + hex(S.mau) : 'none'; i.style.opacity = day ? String(.75 + .25 * Math.sin(tG * 9)) : '.9';
  thanh.lastChild.textContent = day ? '✦ KHÍ LINH · giữ K + J (hoặc O)' : '✦ Khí Linh · O = kích thử';
  thanh.lastChild.style.color = day ? hex(S.mau.clone().lerp(new T.Color(1, 1, 1), .5)) : '#d9d9d9';
}

// ================================================================ BỌC API DK.VKH / DK.PB.moTaCap (NC ⇒ bản này, tắt ⇒ bản game)
const G = { theoDoiDai: VKH.theoDoiDai, apTrung: VKH.apTrung, mauNhan: VKH.mauNhan, tb: VKH.tb, datKhiLinh: VKH.datKhiLinh, dem: VKH.dem, moTaCap: DK.PB.moTaCap };
VKH.tb = function () { const t = G.tb(); return DK.NC && t && t._ncTat ? Object.assign({}, t, { coVuKhi: true, ncCap: S.n }) : t; };
VKH.mauNhan = function () { return bat() ? S.mau.clone() : G.mauNhan(); };
VKH.apTrung = function (diem, huong, nang) { if (!bat()) return G.apTrung(diem, huong, nang); try { tApTay = DK.now; pApTay.copy(diem); apTrungNC(diem, huong, nang || 0); } catch (e) { bao(e); } };
VKH.datKhiLinh = function (x) { if (!bat()) return G.datKhiLinh(x); KL.maVK = S.vk.ma; KL.v = c01(x); };
VKH.dem = function () { return bat() ? Object.assign({ thanh: +KL.v.toFixed(2), nc: true }, KL.dem) : G.dem(); };
/** dải do bộ tự vẽ (vd. Huyết Nguyệt): thêm lõi sáng (+3), hạt (+5), kiếm ảnh (+7) bám đúng dải đó. Thời gian o.* = giây thật. */
VKH.theoDoiDai = function (ngoai, trong, o) {
  if (!bat()) return G.theoDoiDai(ngoai, trong, o);
  if (!ngoai || ngoai.length < 2 || !trong || trong.length !== ngoai.length) return false;
  S.tVet = DK.now; const n = S.n, R = DK.NHIP_GOC, tq = ((o && o.tgQuet) || .1) * R, ts = ((o && o.tgSong != null ? o.tgSong : .16) + (o && o.tgTan != null ? o.tgTan : .14)) * R;
  if (n >= 3) {
    const N = ngoai.length, P = new Float32Array(N * 6), C = new Float32Array(N * 8), I = [];
    for (let i = 0; i < N; i++) { const a = trong[i].clone().lerp(ngoai[i], n >= 7 ? .55 : .66), b = ngoai[i]; P.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6); if (i < N - 1) { const k = i * 2; I.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(P, 3)); g.setAttribute('color', new T.BufferAttribute(C, 4)); g.setIndex(I);
    const m = new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending, toneMapped: false })); m.frustumCulled = false; m.renderOrder = 13;
    const cc = S.mau.clone().multiplyScalar(1.5);
    vfx.them(m, tq + ts, (dt, u, t) => {
      const dau = c01(t / tq), tan = c01((t - tq) / ts);
      for (let i = 0; i < N; i++) { const s = i / (N - 1), k = s <= dau ? (1 - tan) * (.35 + .65 * s / Math.max(.01, dau)) : 0; C.set([cc.r, cc.g, cc.b, k * .25, cc.r, cc.g, cc.b, k], i * 8); }
      g.attributes.color.needsUpdate = true;
    });
  }
  if (n >= 5) { const N = ngoai.length; for (let k = 0; k < (n >= 10 ? 14 : 8); k++) { const i = Math.min(N - 2, (Math.random() * (N - 1)) | 0); DK.sau(tq * i / N, () => vfx.hat(ngoai[i], { so: 1, mau: S.mau, toc: 2, huong: ngoai[i + 1].clone().sub(ngoai[i]), loe: .7, co: .045, song: .45, trongLuc: 2, sang: 1.4 })); } }
  if (n >= 7) chemAnh(false);
  return true;
};
const MO_CAP = [
  [3, 'Khai Phong — rãnh lưỡi sáng thở, tinh quang ở mũi; vệt chém dày hơn + lõi sáng; trúng nở chữ thập'],
  [5, 'Khí Kiếm Quấn Lưỡi — khí voxel xoắn quanh lưỡi, khí bốc lên; hạt bay theo nhát; bước chân để ấn sáng; Kiếm Tâm Thông Minh: đòn trúng thứ 4 có kiếm hồn chém xuyên (40 %)'],
  [7, 'Kiếm Ảnh Hộ Thân — 2 kiếm hồn sau vai chém theo từng đòn, vòng ấn dưới chân, mạch sáng chạy dọc rãnh; Tàn Nguyệt Kiếm Khí: đòn kết phóng phi kiếm 9 m cắt cỏ (60 %)'],
  [10, 'KHÍ LINH HIỆN THÂN — vương miện kiếm luân 8 kiếm hồn trên đầu, ấn kép, trời nhuốm màu kiếm; đòn nặng để vết nứt sáng, đòn kết xẻ rãnh; O / giữ K + J khi thanh đầy: Vạn Kiếm Quy Tông (450 %): kiếm luân bay lên, 8 kiếm cắm vây đích, cự kiếm 4 m giáng — nổ đất, rãnh, khung va chạm'],
];
DK.PB.moTaCap = function (cap) {
  if (!DK.NC) return G.moTaCap ? G.moTaCap(cap) : '';
  const vk = nc.vk || DL.VU_KHI.find(v => v.ma === (DK.chon && DK.chon.vk)) || DL.VU_KHI[0];
  const p = Math.max(0, PHAM_MA.indexOf(vk.pham));
  const ds = ['✦ Nâng cấp · ' + PHAM_TEN[p] + ': ' + PH[p].mo + (p >= THAN ? ' (đòn kết dưới +7 phóng 1 phi kiếm 30 %; +7 ×3 lưỡi)' : '')];
  for (const [m, s] of MO_CAP) ds.push((cap >= m ? '● +' : '○ +') + m + ' ' + s + (cap >= m ? '' : ' (chưa)'));
  return ds.join(' · ');
};

// ================================================================ VÒNG KHUNG
DK.moiKhung(dt => {
  try {
    tG += dt;
    tatCu();
    const b = bat(), khoa = (nc.vk ? nc.vk.ma : '') + '|' + (DK.chon ? DK.chon.cap | 0 : 0) + '|' + b + '|' + (nc.kiemThat ? nc.kiemThat.uuid : '');
    if (khoa !== S.khoa) dung();
    if (S.on) { capKiem(dt); capCanh(dt); capBuoc(); }
    veThanh();
  } catch (e) { bao(e); }
});
DK.nghe('datLai', () => {
  S.kl.dang = false; S.tAnh = -9;
  if (S.anh) for (const a of S.anh) a.an = false;
  if (S.banh) { S.banh.an = false; for (const d of S.banh.ds) d.an = false; }
});
DK.nghe('doiBan', () => { S.khoa = ''; });
DK.nghe('doiVuKhi', () => { S.khoa = ''; });
bocDanh(); window.addEventListener('load', bocDanh); DK.nghe('phim', bocDanh);
// tự kiểm / người tích hợp: DK.VKH_NC.thu('kiemKhi'|'noiTai'|'chemAnh'|'khiLinh')
DK.VKH_NC = { S, KL, bat, kichKhiLinh, thu(ten) { const d = DK.mucTieu(); if (ten === 'kiemKhi') kiemKhi(d, 60); else if (ten === 'noiTai' && d) noiTai(d, 40); else if (ten === 'chemAnh') chemAnh(false); else if (ten === 'khiLinh') kichKhiLinh(); } };
})();
