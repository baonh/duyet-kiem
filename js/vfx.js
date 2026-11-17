"use strict";
// ============================================================================
// vfx.js — 2026-11-14 — THƯ VIỆN HIỆU ỨNG dùng chung cho các bộ chiêu (DK.vfx.*). Mọi thời gian = giây mô phỏng.
// Nguyên tắc người dùng đã chốt: chiêu SẠCH, RÕ, mỗi chiêu MỘT màu chủ đạo; vệt chém theo MÀU THANH KIẾM; hạt là khối voxel.
// ============================================================================
(function () {
const DK = window.DK, T = DK.T, V3 = DK.V3, D = DK.D, scene = DK.scene, clamp = DK.clamp;
const vfx = DK.vfx = {};
const song = [];   // vật đang sống: { o, t, song, cap(dt, u), xong() }
function them(o, thoi, cap, xong) { if (o) scene.add(o); const x = { o, t: 0, song: thoi, cap, xong }; song.push(x); return x; }
vfx.them = them;
const mau = c => c instanceof T.Color ? c.clone() : new T.Color(c != null ? c : 0xffffff);
vfx.mau = mau;
function huy(x) { if (x.o) { scene.remove(x.o); x.o.traverse(m => { if (m.geometry && !m.geometry.giu) m.geometry.dispose(); if (m.material) { if (!m.material.giu) m.material.dispose(); } }); } if (x.xong) x.xong(); }
DK.moiKhung(dt => {
  for (let i = song.length - 1; i >= 0; i--) {
    const x = song[i]; x.t += dt; const u = x.t / x.song;
    if (u >= 1) { huy(x); song.splice(i, 1); continue; }
    if (x.cap) try { if (x.cap(dt, u, x.t) === false) { huy(x); song.splice(i, 1); } } catch (e) { console.error(e); DK.baoLoi(e); huy(x); song.splice(i, 1); }
  }
  hat.buoc(dt);
});
DK.nghe('datLai', () => { for (const x of song) huy(x); song.length = 0; hat.xoa(); vfx.troi(null); });
const matCong = (c, op = 1) => new T.MeshBasicMaterial({ color: mau(c), transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
const matThuong = (c, op = 1) => new T.MeshBasicMaterial({ color: mau(c), transparent: true, opacity: op, depthWrite: false, side: T.DoubleSide });
vfx.matCong = matCong; vfx.matThuong = matThuong;

// ---------------------------------------------------------------- VỆT CHÉM theo mũi kiếm
/**
 * vfx.vet(nv, { song: thời gian ghi (s), tan: thời gian tan (s, mặc định .22), mau (mặc định màu thanh kiếm), kieu: 'muc'|'sang', rong (0..1 phần lưỡi, mặc định .85), day: số sợi (muc) })
 *   'muc' = vệt mực soulslike: lõi tối + viền màu thanh kiếm; 'sang' = vệt sáng cộng (kiếm khí).
 */
vfx.vet = function (nv, op = {}) {
  const N = 40, ghi = op.song != null ? op.song : .14, tan = op.tan != null ? op.tan : .22, c = mau(op.mau != null ? op.mau : (nv.vk ? nv.vk.mau_hex : 0xffffff));
  const kieu = op.kieu || 'muc', rong = op.rong != null ? op.rong : .85;
  const mau_ = [];  // mẫu: { a (phía chuôi), b (mũi), t }
  const lop = [];
  // dải N mẫu × 2 đỉnh; màu đỉnh RGBA (alpha theo tuổi mẫu + mờ dần về phía chuôi)
  const taoLop = (cc, cong, alpha, rongK) => {
    const g = new T.BufferGeometry(); const P = new Float32Array(N * 2 * 3), C = new Float32Array(N * 2 * 4);
    g.setAttribute('position', new T.BufferAttribute(P, 3)); g.setAttribute('color', new T.BufferAttribute(C, 4));
    const I = []; for (let i = 0; i < N - 1; i++) { const a = i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } g.setIndex(I);
    const mat = new T.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: T.DoubleSide, blending: cong ? T.AdditiveBlending : T.NormalBlending });
    const m = new T.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = cong ? 7 : 6; lop.push({ m, g, cc, alpha, rongK }); return m;
  };
  const g = new T.Group();
  if (kieu === 'muc') {
    g.add(taoLop(new T.Color(0x0a0608), false, .8, 1));                // lõi mực
    g.add(taoLop(c.clone().multiplyScalar(1.5), true, 1, .34));       // viền màu thanh kiếm (phần mũi)
  } else {
    g.add(taoLop(c.clone().multiplyScalar(1.3), true, .85, 1));
    g.add(taoLop(new T.Color(1, 1, 1), true, .55, .25));
  }
  const ca = new V3(), mb = new V3(), tmp = new V3(); vfx._vet = { lop, mau_ };
  return them(g, ghi + tan + .05, (dt, u, t) => {
    if (t <= ghi) { nv.can(ca); nv.mui(mb); mau_.unshift({ a: new V3().lerpVectors(mb, ca, rong), b: mb.clone(), t }); if (mau_.length > N) mau_.pop(); }
    if (!mau_.length) return;
    for (const L of lop) {
      const P = L.g.attributes.position.array, C = L.g.attributes.color.array;
      for (let i = 0; i < N; i++) {
        const s = mau_[Math.min(i, mau_.length - 1)];
        const k = i < mau_.length ? DK.clamp(1 - (t - s.t) / tan, 0, 1) * (1 - i / mau_.length) * L.alpha : 0;
        const a = L.rongK < 1 ? tmp.lerpVectors(s.b, s.a, L.rongK) : s.a;
        P[i * 6] = a.x; P[i * 6 + 1] = a.y; P[i * 6 + 2] = a.z; P[i * 6 + 3] = s.b.x; P[i * 6 + 4] = s.b.y; P[i * 6 + 5] = s.b.z;
        C[i * 8] = L.cc.r; C[i * 8 + 1] = L.cc.g; C[i * 8 + 2] = L.cc.b; C[i * 8 + 3] = k * .15;          // phía chuôi mờ
        C[i * 8 + 4] = L.cc.r; C[i * 8 + 5] = L.cc.g; C[i * 8 + 6] = L.cc.b; C[i * 8 + 7] = k;            // phía mũi đậm
      }
      L.g.attributes.position.needsUpdate = true; L.g.attributes.color.needsUpdate = true;
    }
  });
};

// ---------------------------------------------------------------- HẠT voxel (một InstancedMesh)
const hat = (function () {
  const MAX = 3000, geo = new T.BoxGeometry(1, 1, 1);
  const mat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: T.AdditiveBlending, depthWrite: false, vertexColors: false });
  const matTo = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: true });
  const im = new T.InstancedMesh(geo, mat, MAX); im.instanceMatrix.setUsage(T.DynamicDrawUsage); im.frustumCulled = false; im.count = 0; scene.add(im);
  const imT = new T.InstancedMesh(geo, matTo, MAX); imT.instanceMatrix.setUsage(T.DynamicDrawUsage); imT.frustumCulled = false; imT.count = 0; imT.castShadow = true; scene.add(imT);
  im.instanceColor = new T.InstancedBufferAttribute(new Float32Array(MAX * 3), 3); imT.instanceColor = new T.InstancedBufferAttribute(new Float32Array(MAX * 3), 3);
  const ds = []; const m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), s = new V3();
  return {
    them(p) { if (ds.length < MAX * 2) ds.push(p); },
    xoa() { ds.length = 0; },
    buoc(dt) {
      let n = 0, nT = 0;
      for (let i = ds.length - 1; i >= 0; i--) {
        const p = ds[i]; p.t += dt; if (p.t >= p.song) { ds.splice(i, 1); continue; }
        p.v.y -= p.g * dt; p.v.multiplyScalar(Math.exp(-p.can * dt)); p.pos.addScaledVector(p.v, dt);
        if (p.dat && p.pos.y < p.co / 2) { p.pos.y = p.co / 2; p.v.y *= -.3; p.v.x *= .6; p.v.z *= .6; }
        const u = p.t / p.song, k = p.to ? 1 : (1 - u) * (1 - u * .3), co = p.co * (p.to ? (u > .75 ? (1 - u) / .25 : 1) : (1 - u * .6));
        e.set(p.r.x + p.t * p.w, p.r.y + p.t * p.w * .7, 0); q.setFromEuler(e); s.set(co, co, co); m4.compose(p.pos, q, s);
        if (p.to) { if (nT < MAX) { imT.setMatrixAt(nT, m4); imT.instanceColor.setXYZ(nT, p.c.r, p.c.g, p.c.b); nT++; } }
        else if (n < MAX) { im.setMatrixAt(n, m4); im.instanceColor.setXYZ(n, p.c.r * k, p.c.g * k, p.c.b * k); n++; }
      }
      im.count = n; imT.count = nT; im.instanceMatrix.needsUpdate = imT.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = imT.instanceColor.needsUpdate = true;
    },
  };
})();
/**
 * vfx.hat(pos, { so, mau, toc (m/s), huong (V3, mặc định toả cầu), loe (0..1 độ toả quanh huong), co (m), song (s), trongLuc, can (cản), dat (nảy trên đất), to (khối đặc không cộng sáng — đá vụn), lech (m bán kính xuất phát) })
 */
vfx.hat = function (pos, op = {}) {
  const so = op.so || 12, c = mau(op.mau != null ? op.mau : 0xffffff), toc = op.toc != null ? op.toc : 4, co = op.co || .08, sg = op.song || .6;
  for (let i = 0; i < so; i++) {
    let v = new V3(Math.random() - .5, Math.random() - .5, Math.random() - .5).normalize();
    if (op.huong) { const h = op.huong.clone().normalize(); v = h.add(v.multiplyScalar(op.loe != null ? op.loe : .5)).normalize(); }
    v.multiplyScalar(toc * (.5 + Math.random() * .7));
    const p0 = pos.clone(); if (op.lech) p0.add(new V3(Math.random() - .5, Math.random() - .5, Math.random() - .5).multiplyScalar(op.lech * 2));
    hat.them({ pos: p0, v, c: c.clone().multiplyScalar(op.sang || 1), co: co * (.6 + Math.random() * .8), song: sg * (.6 + Math.random() * .6), t: 0, g: op.trongLuc != null ? op.trongLuc : 6, can: op.can != null ? op.can : 2, dat: op.dat !== false, to: !!op.to, r: new V3(Math.random() * 6, Math.random() * 6, 0), w: (Math.random() - .5) * 12 });
  }
};

// ---------------------------------------------------------------- VÒNG SÓNG / VÙNG BÁO / CỘT SÁNG / CHỚP
/** vòng nở trên đất (hoặc theo pháp tuyến op.phap) : { bk0, bk1, song, mau, day (m), cao, op (độ đục) } */
vfx.vong = function (pos, op = {}) {
  const bk0 = op.bk0 != null ? op.bk0 : .3, bk1 = op.bk1 != null ? op.bk1 : 4, sg = op.song || .45, day = op.day || .25;
  const m = new T.Mesh(new T.RingGeometry(1 - day / Math.max(bk1, .5), 1, 64), matCong(op.mau != null ? op.mau : 0xffffff, op.op != null ? op.op : .9));
  m.position.copy(pos); m.position.y += op.cao != null ? op.cao : .04;
  if (op.phap) m.quaternion.setFromUnitVectors(new V3(0, 0, 1), op.phap.clone().normalize()); else m.rotation.x = -Math.PI / 2;
  const a0 = m.material.opacity;
  return them(m, sg, (dt, u) => { const e = 1 - Math.pow(1 - u, 3); const r = bk0 + (bk1 - bk0) * e; m.scale.set(r, r, r); m.material.opacity = a0 * (1 - u); });
};
/** đĩa báo trên đất (telegraph): { r, song, mau, op, vien } — nhấp nháy viền, nền mờ */
vfx.vung = function (pos, op = {}) {
  const r = op.r || 3, sg = op.song || .5, g = new T.Group();
  const nen = new T.Mesh(new T.CircleGeometry(r, 64), matThuong(op.mau != null ? op.mau : 0xffcc55, .18)); nen.rotation.x = -Math.PI / 2; g.add(nen);
  const vien = new T.Mesh(new T.RingGeometry(r - .08, r, 64), matCong(op.mau != null ? op.mau : 0xffcc55, .9)); vien.rotation.x = -Math.PI / 2; g.add(vien);
  const tien = new T.Mesh(new T.CircleGeometry(r, 64), matCong(op.mau != null ? op.mau : 0xffcc55, .25)); tien.rotation.x = -Math.PI / 2; tien.position.y = .005; g.add(tien);
  g.position.copy(pos); g.position.y = (pos.y || 0) + .03;
  return them(g, sg, (dt, u) => { tien.scale.setScalar(Math.max(.001, u)); vien.material.opacity = .5 + .4 * Math.sin(u * 40); if (op.bam) g.position.set(op.bam.pos.x, .03, op.bam.pos.z); });
};
/** dải báo hình chữ nhật từ a tới b, rộng `rong` */
vfx.dai = function (a, b, op = {}) {
  const rong = op.rong || 1.2, sg = op.song || .4, d = new V3().subVectors(b, a); d.y = 0; const L = d.length();
  const g = new T.Group(); const m = new T.Mesh(new T.PlaneGeometry(rong, L), matThuong(op.mau != null ? op.mau : 0xffcc55, .22)); m.rotation.x = -Math.PI / 2; m.position.z = L / 2; g.add(m);
  const t = new T.Mesh(new T.PlaneGeometry(rong, L), matCong(op.mau != null ? op.mau : 0xffcc55, .3)); t.rotation.x = -Math.PI / 2; g.add(t);
  g.position.set(a.x, .03, a.z); g.rotation.y = Math.atan2(d.x, d.z);
  return them(g, sg, (dt, u) => { t.scale.set(1, Math.max(.001, u), 1); t.position.z = L * u / 2; });
};
/** cột sáng đứng: { r, cao, mau, song, op } */
vfx.cot = function (pos, op = {}) {
  const r = op.r || .6, cao = op.cao || 8, sg = op.song || .6;
  const m = new T.Mesh(new T.CylinderGeometry(r, r * 1.15, cao, 24, 1, true), matCong(op.mau != null ? op.mau : 0xffffff, op.op != null ? op.op : .7));
  m.position.copy(pos); m.position.y += cao / 2; const a0 = m.material.opacity;
  return them(m, sg, (dt, u) => { const k = u < .15 ? u / .15 : 1; m.scale.set(k * (1 - u * .5) + .01, 1, k * (1 - u * .5) + .01); m.material.opacity = a0 * (1 - u); });
};
/** chớp sáng (quầng tròn quay về máy quay): { co, mau, song } */
const texTron = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c); })();
vfx.texTron = texTron;
vfx.chop = function (pos, op = {}) {
  const sp = new T.Sprite(new T.SpriteMaterial({ map: texTron, color: mau(op.mau != null ? op.mau : 0xffffff), blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
  sp.position.copy(pos); const co = op.co || 1.5; sp.renderOrder = 8;
  return them(sp, op.song || .18, (dt, u) => { const s = co * (.6 + u * .8); sp.scale.set(s, s, 1); sp.material.opacity = 1 - u; });
};
/** quầng bám theo vật (đèn sáng mềm): trả x để chỉnh x.o.scale */
vfx.quang = function (bam, op = {}) {
  const sp = new T.Sprite(new T.SpriteMaterial({ map: texTron, color: mau(op.mau != null ? op.mau : 0xffffff), blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: op.op != null ? op.op : .6 }));
  const co = op.co || 1; sp.scale.set(co, co, 1);
  return them(sp, op.song || 1, (dt, u) => { if (bam.getWorldPosition) bam.getWorldPosition(sp.position); else sp.position.copy(bam); if (op.tat) sp.material.opacity = (op.op != null ? op.op : .6) * (1 - u); });
};

// ---------------------------------------------------------------- KIẾM KHÍ hình trăng lưỡi liềm (cung chém)
/**
 * vfx.cung(pos, huong (V3 tới), { bk (bán kính m), goc (độ mở), nghieng (độ quanh trục tới: 0 ngang, 90 dọc), mau, song, bay (m/s — bay theo huong), day (m), cao })
 *   trả x (x.o = Group) — bay thẳng nếu có op.bay
 */
vfx.cung = function (pos, huong, op = {}) {
  const bk = op.bk || 2, goc = (op.goc || 120) * D, sg = op.song || .35, day = op.day || .45;
  const shape = new T.Shape(); const n = 32;
  for (let i = 0; i <= n; i++) { const a = -goc / 2 + goc * i / n; const w = Math.sin(Math.PI * i / n); shape.lineTo(Math.cos(a) * (bk + day * w), Math.sin(a) * (bk + day * w)); }
  for (let i = n; i >= 0; i--) { const a = -goc / 2 + goc * i / n; shape.lineTo(Math.cos(a) * bk, Math.sin(a) * bk); }
  const geo = new T.ShapeGeometry(shape);
  // tr (vị trí + hướng tới) → lop (nghiêng quanh trục tới) → g (co giãn) → xoayY (−90°: +x → +z) → nam (−90° quanh x: nằm ngang)
  const h = huong.clone().setY(0); if (h.lengthSq() < 1e-6) h.set(0, 0, 1); h.normalize();
  const tr = new T.Group(); tr.position.copy(pos); tr.rotation.y = Math.atan2(h.x, h.z);
  const lop = new T.Group(); lop.rotation.z = (op.nghieng || 0) * D; tr.add(lop);
  const g = new T.Group(); lop.add(g);
  const xoayY = new T.Group(); xoayY.rotation.y = -Math.PI / 2; g.add(xoayY);
  const nam = new T.Group(); nam.rotation.x = -Math.PI / 2; xoayY.add(nam);
  const m1 = new T.Mesh(geo, matCong(op.mau != null ? op.mau : 0xffffff, .9)); nam.add(m1);
  const m2 = new T.Mesh(geo, matCong(0xffffff, .55)); m2.scale.set(.985, .985, 1); m2.position.z = .01; nam.add(m2);
  const a1 = m1.material.opacity, a2 = m2.material.opacity;
  return them(tr, sg, (dt, u) => {
    if (op.bay) tr.position.addScaledVector(h, op.bay * dt);
    const k = op.bay ? 1 : (.6 + .4 * Math.min(1, u * 4));
    g.scale.set(k, k, k); m1.material.opacity = a1 * (1 - u * u); m2.material.opacity = a2 * (1 - u);
    if (op.cap) op.cap(tr.position, u);
  });
};

// ---------------------------------------------------------------- KIẾM BAY (phi kiếm từ dữ liệu hop)
/**
 * vfx.kiem(muc (vu_khi / phap_bao — mặc định thanh đang cầm), { co (hệ số to), sang (phát sáng), mau (vệt), vet (true = kéo vệt sáng), song })
 *   trả { o (Group, trục +z = mũi), dat(pos, huong), x } — tự huỷ sau song; caller di chuyển bằng DK.lap.
 */
vfx.kiem = function (muc, op = {}) {
  muc = muc || DK.nc.vk || DL.VU_KHI[0];
  const g = new T.Group(); const m = DK.meshKiem(muc, { sang: op.sang != null ? op.sang : .9, bong: op.bong }); m.rotation.x = Math.PI / 2; m.scale.setScalar(op.co || 1); g.add(m);
  const c = mau(op.mau != null ? op.mau : muc.mau_hex);
  if (op.quang !== false) { const sp = new T.Sprite(new T.SpriteMaterial({ map: texTron, color: c, blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: .55 })); sp.scale.setScalar(1.1 * (op.co || 1)); sp.position.z = .5 * (op.co || 1); g.add(sp); }
  let vet = null;
  const muiL = (muc.mui ? muc.mui[1] : 20) * DL.PX * (op.co || 1);
  if (op.vet !== false) {
    const N = 18, P = new Float32Array(N * 2 * 3), A = new Float32Array(N * 2 * 4), geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setAttribute('color', new T.BufferAttribute(A, 4));
    const I = []; for (let i = 0; i < N - 1; i++) { const a = i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } geo.setIndex(I);
    const mat = new T.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending });
    const cv = c.clone().multiplyScalar(1.3);
    vet = { m: new T.Mesh(geo, mat), ds: [], N }; vet.m.frustumCulled = false; scene.add(vet.m);
  }
  const x = them(g, op.song || 3, () => {
    if (!vet) return; const a = new V3(), b = new V3(); g.updateMatrixWorld(true);
    a.set(0, 0, 0).applyMatrix4(g.matrixWorld); b.set(0, 0, muiL * .9).applyMatrix4(g.matrixWorld);
    vet.ds.unshift([a.clone(), b.clone()]); if (vet.ds.length > vet.N) vet.ds.pop();
    const P = vet.m.geometry.attributes.position.array, A = vet.m.geometry.attributes.color.array;
    for (let i = 0; i < vet.N; i++) { const s = vet.ds[Math.min(i, vet.ds.length - 1)]; const mid = new V3().lerpVectors(s[0], s[1], .5); const w = .5 * (1 - i / vet.N); const p0 = new V3().lerpVectors(mid, s[0], w * 2), p1 = new V3().lerpVectors(mid, s[1], w * 2);
      P.set([p0.x, p0.y, p0.z, p1.x, p1.y, p1.z], i * 6); const k = (1 - i / vet.N) * .8; A.set([cv.r, cv.g, cv.b, k, cv.r, cv.g, cv.b, k], i * 8); }
    vet.m.geometry.attributes.position.needsUpdate = vet.m.geometry.attributes.color.needsUpdate = true;
  }, () => { if (vet) { scene.remove(vet.m); vet.m.geometry.dispose(); vet.m.material.dispose(); } });
  return {
    o: g, x, muiL,
    /** đặt vị trí + hướng mũi */
    dat(pos, huong) { g.position.copy(pos); if (huong && huong.lengthSq() > 1e-8) { const h = huong.clone().normalize(); g.quaternion.setFromUnitVectors(new V3(0, 0, 1), h); } },
    huy() { x.t = x.song; },
  };
};

// ---------------------------------------------------------------- ẢNH SÓT (bóng mờ tư thế nhân vật)
vfx.anhSot = function (nv, op = {}) {
  const g = new T.Group(); const c = mau(op.mau != null ? op.mau : 0x9a5aff);
  const mat = new T.MeshBasicMaterial({ color: c, transparent: true, opacity: op.op != null ? op.op : .35, blending: T.AdditiveBlending, depthWrite: false });
  nv.root.updateMatrixWorld(true);
  nv.root.traverse(o => { if (o.isMesh && o.visible) { const m = new T.Mesh(o.geometry, mat); m.geometry.giu = true; o.matrixWorld.decompose(m.position, m.quaternion, m.scale); g.add(m); } });
  const a0 = mat.opacity;
  return them(g, op.song || .4, (dt, u) => { mat.opacity = a0 * (1 - u); });
};
/** độ trong suốt của nhân vật (ẩn thân): 1 = đặc */
vfx.trong = function (nv, a) {
  nv.root.traverse(o => { if (o.isMesh && o.material) { o.material.transparent = a < .99; o.material.opacity = a; o.material.depthWrite = a > .6; } });
};

// ---------------------------------------------------------------- CHỮ CHIÊU giữa màn + TRỜI đổi màu
vfx.chu = function (text, op = {}) {
  const el = document.createElement('div'); el.className = 'chu_chieu'; el.textContent = text; el.style.color = op.mau || '#fff'; document.body.appendChild(el);
  const sg = op.song || 1.4; them(null, sg, (dt, u) => { el.style.opacity = String(u < .15 ? u / .15 : 1 - Math.max(0, u - .7) / .3); el.style.transform = `translate(-50%,-50%) scale(${1.15 - .15 * Math.min(1, u * 5)})`; }, () => el.remove());
};
const troi0 = DK.scene.background.clone(), suong0 = DK.scene.fog.color.clone();
let troiX = null;
vfx.datTroiGoc = () => { troi0.copy(DK.scene.background); suong0.copy(DK.scene.fog.color); hemi0 = DK.hemi.intensity; };
let hemi0 = DK.hemi.intensity;
/** đổi màu trời tạm thời (mau, song, k độ đậm 0..1); null = trả về */
vfx.troi = function (c, sg, k) {
  if (troiX) { troiX.t = troiX.song; troiX = null; }
  if (c == null) { DK.scene.background.copy(troi0); DK.scene.fog.color.copy(suong0); return; }
  const m = mau(c), kk = k != null ? k : .6;
  troiX = them(null, sg || 1.5, (dt, u) => { const w = (u < .2 ? u / .2 : u > .75 ? (1 - u) / .25 : 1) * kk; DK.scene.background.copy(troi0).lerp(m, w); DK.scene.fog.color.copy(suong0).lerp(m, w); DK.hemi.intensity = hemi0 * (1 - w * .5); },
    () => { DK.scene.background.copy(troi0); DK.scene.fog.color.copy(suong0); DK.hemi.intensity = hemi0; });
};
/** đèn điểm tạm (chiếu sáng cảnh khi nổ) */
vfx.den = function (pos, op = {}) {
  const l = new T.PointLight(mau(op.mau != null ? op.mau : 0xffffff), op.manh || 3, op.xa || 8, 2); l.position.copy(pos);
  return them(l, op.song || .3, (dt, u) => { l.intensity = (op.manh || 3) * (1 - u); });
};
/** khối hộp đơn (đá, cột) có tuổi thọ: { co [x,y,z], mau, song, cong (cộng sáng) } */
vfx.hop = function (pos, op = {}) {
  const co = op.co || [1, 1, 1]; const m = new T.Mesh(new T.BoxGeometry(co[0], co[1], co[2]), op.cong ? matCong(op.mau, op.op != null ? op.op : .8) : new T.MeshStandardMaterial({ color: mau(op.mau != null ? op.mau : 0x888888), roughness: .9, transparent: true }));
  m.position.copy(pos); m.castShadow = !op.cong; if (op.quay) m.rotation.copy(op.quay);
  return them(m, op.song || 1, op.cap ? (dt, u, t) => op.cap(m, u, t) : (dt, u) => { if (!op.cong && u > .8) m.material.opacity = (1 - u) / .2; else if (op.cong) m.material.opacity = (op.op != null ? op.op : .8) * (1 - u); });
};
/** tia / đường sáng giữa hai điểm (sấm, dây trói): { rong, mau, song, zigzag (m) } */
vfx.tia = function (a, b, op = {}) {
  const pts = [], n = op.zigzag ? 10 : 1;
  for (let i = 0; i <= n; i++) { const p = new V3().lerpVectors(a, b, i / n); if (op.zigzag && i > 0 && i < n) p.add(new V3(Math.random() - .5, Math.random() - .5, Math.random() - .5).multiplyScalar(op.zigzag)); pts.push(p); }
  const g = new T.Group(); const rong = op.rong || .08;
  for (let i = 0; i < pts.length - 1; i++) { const p = pts[i], q = pts[i + 1], L = p.distanceTo(q); const m = new T.Mesh(new T.BoxGeometry(rong, rong, L), matCong(op.mau != null ? op.mau : 0xffffff, .95)); m.position.lerpVectors(p, q, .5); m.lookAt(q); g.add(m); }
  return them(g, op.song || .15, (dt, u) => g.children.forEach(m => m.material.opacity = .95 * (1 - u)));
};
})();
