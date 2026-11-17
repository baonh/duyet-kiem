"use strict";
// ============================================================================
// loi.js — 2026-11-14 — LÕI PHÒNG DUYỆT KIẾM (HTML, three.js r149).
// Mục tiêu: xem trước chuyển động + hiệu ứng của chiêu kiếm / pháp bảo kiếm GIỐNG game Unity trước khi sửa game.
//   · tư thế / clip: đúng hệ "web" mà Unity dùng (DongTacWebThuVien.cs) — 20 khớp × [x,y,z] độ (Euler XYZ three.js) + jy cham jx jz.
//   · thời gian clip = GIÂY MÔ PHỎNG; 1 s thật = 0,75 s mô phỏng (NHIP_GOC như game) × hệ số tốc độ xem.
//   · nhân vật khối Minecraft đúng khung xương web/Unity (nhan_vat.js: KICH / CHA), kiếm dựng từ hop của vu_khi.json.
// Hợp đồng cho các file bộ chiêu: xem HOP_DONG.md.
// ============================================================================
(function () {
const T = THREE, D = Math.PI / 180, V3 = T.Vector3;
const DK = window.DK = { T, D, V3, BO: {}, NHIP_GOC: 0.75 };
const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
DK.clamp = clamp;
DK.lerp = (a, b, t) => a + (b - a) * t;
DK.tien = (toc, dt) => 1 - Math.exp(-toc * dt);

// ---------------------------------------------------------------- ease (DongTacWebTV.Ease)
const MA_EASE = { l: 0, io: 1, o: 2, s: 3, i: 4, h: 5, oo: 6, sin: 7, bat: 8 };
function ease(ma, t) {
  switch (ma) {
    case 0: return t;
    case 2: { const u = 1 - t; return 1 - u * u * u; }
    case 3: return t >= 1 ? 1 : 1 - Math.pow(2, -12 * t);
    case 4: return t * t * t;
    case 5: return t < 1 ? 0 : 1;
    case 6: { const u = 1 - t; return 1 - u * u * u * u * u; }
    case 7: return .5 - .5 * Math.cos(Math.PI * t);
    case 8: { const c = 1.70158, u = t - 1; return 1 + (c + 1) * u * u * u + c * u * u; }
    default: if (t < .5) return 4 * t * t * t; { const u = -2 * t + 2; return 1 - u * u * u * .5; }
  }
}
DK.ease = (ten, t) => ease(typeof ten === 'number' ? ten : (MA_EASE[ten] != null ? MA_EASE[ten] : 1), clamp(t, 0, 1));

// ---------------------------------------------------------------- tư thế (64 số)
const KHOP = ['b', 'hip', 'tor', 'co', 'head', 'aR', 'fR', 'hR', 'w', 'aL', 'fL', 'hL', 'lR', 'sR', 'cR', 'lL', 'sL', 'cL', 'ao', 'toc'];
const KI = {}; KHOP.forEach((k, i) => KI[k] = i);
const JY = 60, CHAM = 61, JX = 62, JZ = 63;
const DUOI = ['lR', 'sR', 'cR', 'lL', 'sL', 'cL'].map(k => KI[k]);
DK.KHOP = KHOP; DK.KI = KI;
function ttMoi() { const p = new Float32Array(64); p[KI.w * 3] = 90; p[CHAM] = 1; return p; }
DK.ttMoi = ttMoi;
const TT = DK.TT = {};
for (const n in DL.TT) TT[n] = Float32Array.from(DL.TT[n]);
/** thêm tư thế từ chữ rút gọn: "tor:12,-16 head:-8,16 w:90,70,0 jy:.3 cham:0" (giống ThemTuThe của Unity) */
DK.tt = function (ten, moTa) {
  const p = ttMoi();
  for (const muc of String(moTa).trim().split(/\s+/)) {
    const h = muc.indexOf(':'); if (h <= 0) continue;
    const k = muc.slice(0, h), so = muc.slice(h + 1).split(',');
    if (k === 'jy') p[JY] = +so[0]; else if (k === 'cham') p[CHAM] = +so[0]; else if (k === 'jx') p[JX] = +so[0]; else if (k === 'jz') p[JZ] = +so[0];
    else { const j = KI[k]; if (j == null) { console.warn('[DK] khớp lạ', k, 'trong', ten); continue; } for (let a = 0; a < 3; a++) p[j * 3 + a] = a < so.length && so[a] !== '' ? +so[a] : 0; }
  }
  if (ten) TT[ten] = p; return p;
};
/** bảng nhiều tư thế: [ten, moTa, ten, moTa, …] */
DK.ttBang = function (ds) { for (let i = 0; i + 1 < ds.length; i += 2) DK.tt(ds[i], ds[i + 1]); };
const CHAN_KHONG = [-66, 0, -8, 104, 0, 0, 25, 0, 0, -18, 0, 8, 96, 0, 0, 35, 0, 0];
/** biến thể trên không (KhongHoa của Unity) — trả tên mới */
DK.khongHoa = function (ten) {
  const k = ten + '_K'; if (TT[k]) return k; const a = TT[ten]; if (!a) return ten;
  const p = Float32Array.from(a);
  for (let d = 0; d < 6; d++) { const j = DUOI[d]; for (let i = 0; i < 3; i++) p[j * 3 + i] = a[j * 3 + i] * .3 + CHAN_KHONG[d * 3 + i] * .7; }
  p[CHAM] = 0; p[JY] = 0; p[KI.tor * 3] += 6; p[KI.ao * 3] -= 12; p[KI.toc * 3] -= 10; TT[k] = p; return k;
};
/** soi gương trái ↔ phải (giữ w) */
const CAP = KHOP.map(k => KI[k.replace(/R$/, '#').replace(/L$/, 'R').replace('#', 'L')] != null ? KI[k.replace(/R$/, '#').replace(/L$/, 'R').replace('#', 'L')] : KI[k]);
DK.guong = function (ten, tenMoi) {
  const a = TT[ten]; const p = Float32Array.from(a);
  for (let j = 0; j < 20; j++) { if (j === KI.w) continue; const n = CAP[j]; p[j * 3] = a[n * 3]; p[j * 3 + 1] = -a[n * 3 + 1]; p[j * 3 + 2] = -a[n * 3 + 2]; }
  p[JX] = -a[JX]; TT[tenMoi] = p; return tenMoi;
};
function tron(a, b, t, o) { for (let i = 0; i < 64; i++) o[i] = a[i] + (b[i] - a[i]) * t; return o; }
DK.tron = tron;

// ---------------------------------------------------------------- clip
const CLIP = DK.CLIP = {};
function chuanClip(c) {
  c.kTT = c.kTen.map(n => { const p = TT[n]; if (!p) { console.warn('[DK] thiếu tư thế', n, 'clip', c.ten); return TT.THU; } return p; });
  c.dai = c.kT[c.kT.length - 1];
  c.huy = c.moc && c.moc.huy != null ? c.moc.huy : c.dai;
  return c;
}
for (const n in DL.CLIP) {
  const s = DL.CLIP[n];
  CLIP[n] = { ten: n, kT: s.k.map(x => x[0]), kTen: s.k.map(x => x[1]), kE: s.k.map(x => x[2]), mv: s.mv || null, moc: s.moc || {},
    xoay: s.xoay, lon: s.lon, lan: s.lan, tam: s.tam || 0, tron: s.tron, ra: s.ra, than: s.than || 0, uu: s.uu || 0, rung: s.rung || 0, chuan: false };
}
function layClip(c) { if (typeof c === 'string') { const x = CLIP[c]; if (!x) throw new Error('[DK] không có clip ' + c); c = x; } if (!c.chuan) { chuanClip(c); c.chuan = true; } return c; }
DK.layClip = layClip;
/** dựng clip từ chữ — y hệt ClipWeb.TuChu của Unity:
 *  khoa "0 THU; .09 W1 o; .13 W1 h" (· hoặc ; ngăn), mv "0 0 0; .22 0 .55 o" (t phải tới [ease]), moc "vet0 .13, trung .17"
 *  ex: { xoay:[a,b,độ…], lon, lan, tam, tron, ra, than: 0|1|2 } */
DK.clip = function (ten, khoa, mv, moc, ex) {
  const c = { ten, kT: [], kTen: [], kE: [], mv: null, moc: {}, tam: 0, than: 2, uu: 9, chuan: false };
  for (const s0 of String(khoa).replace(/·/g, ';').split(';')) {
    const p = s0.trim().split(/\s+/); if (p.length < 2) continue;
    c.kT.push(+p[0]); c.kTen.push(p[1]); c.kE.push(MA_EASE[p[2] || 'io'] != null ? MA_EASE[p[2] || 'io'] : 1);
  }
  if (mv) { c.mv = []; for (const s0 of String(mv).split(';')) { const p = s0.trim().split(/\s+/); if (p.length < 3) continue; c.mv.push(+p[0], +p[1], +p[2], MA_EASE[p[3] || 'o'] != null ? MA_EASE[p[3] || 'o'] : 2); } }
  if (moc) { if (typeof moc === 'string') { for (const s0 of moc.split(',')) { const p = s0.trim().split(/[\s:]+/); if (p.length >= 2) c.moc[p[0]] = +p[1]; } } else Object.assign(c.moc, moc); }
  if (ex) Object.assign(c, ex);
  if (ten) CLIP[ten] = c;
  return layClip(c);
};
function gocDai(ds, t) { let g = 0; for (let i = 0; i + 2 < ds.length; i += 3) g += ds[i + 2] * ease(1, clamp((t - ds[i]) / Math.max(1e-4, ds[i + 1] - ds[i]), 0, 1)); return g; }
const vong = g => ((g + 180) % 360 + 360) % 360 - 180;
function layMau(c, t, o) {
  const K = c.kT;
  if (t <= K[0]) o.set(c.kTT[0]);
  else {
    let xong = false;
    for (let i = 0; i < K.length - 1; i++) if (t < K[i + 1]) { tron(c.kTT[i], c.kTT[i + 1], ease(c.kE[i + 1], clamp((t - K[i]) / Math.max(1e-4, K[i + 1] - K[i]), 0, 1)), o); xong = true; break; }
    if (!xong) o.set(c.kTT[K.length - 1]);
  }
  const h = c.tam > 0 ? c.tam : .8;
  if (c.xoay) o[1] = vong(o[1] + gocDai(c.xoay, t));
  if (c.lon) { const g = gocDai(c.lon, t), r = g * D; o[0] = vong(o[0] + g); o[JY] += h * (1 - Math.cos(r)); o[JZ] -= h * Math.sin(r); }
  if (c.lan) { const g = gocDai(c.lan, t), r = g * D; o[2] = vong(o[2] + g); o[JY] += h * (1 - Math.cos(r)); o[JX] += h * Math.sin(r); }
  return o;
}
DK.layMau = layMau;
function mvTai(M, t, out) {
  if (t <= M[0]) { out[0] = M[1]; out[1] = M[2]; return out; }
  for (let i = 0; i + 4 < M.length; i += 4) if (t < M[i + 4]) {
    const u = ease(M[i + 7] < 0 ? 2 : M[i + 7], clamp((t - M[i]) / Math.max(1e-4, M[i + 4] - M[i]), 0, 1));
    out[0] = M[i + 1] + (M[i + 5] - M[i + 1]) * u; out[1] = M[i + 2] + (M[i + 6] - M[i + 2]) * u; return out;
  }
  const z = M.length - 4; out[0] = M[z + 1]; out[1] = M[z + 2]; return out;
}

// ---------------------------------------------------------------- cảnh
const PX = 1.8 / 32;
DK.PX = PX;
const canvas = document.getElementById('cv');
const renderer = new T.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: /anh=1/.test(location.search) });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
const scene = new T.Scene();
const MAU_TROI = new T.Color(0x8fa6bf);
scene.background = MAU_TROI.clone(); scene.fog = new T.Fog(scene.background.getHex(), 40, 140);
const cam = new T.PerspectiveCamera(55, 1, .05, 400);
const hemi = new T.HemisphereLight(0xcfe0ff, 0x4a4538, .55); scene.add(hemi);
const nang = new T.DirectionalLight(0xfff1dc, 1.6); nang.position.set(18, 30, 10); nang.castShadow = true;
nang.shadow.mapSize.set(2048, 2048); const sc = nang.shadow.camera; sc.left = sc.bottom = -22; sc.right = sc.top = 22; sc.near = 1; sc.far = 80; nang.shadow.bias = -.0004;
scene.add(nang); scene.add(nang.target);
DK.scene = scene; DK.cam = cam; DK.renderer = renderer; DK.nang = nang; DK.hemi = hemi;

// sân đá ô vuông (voxel) + vòng sân + mốc khoảng cách
(function dungSan() {
  const N = 64, cv = document.createElement('canvas'); cv.width = cv.height = 512; const g = cv.getContext('2d');
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const v = 108 + ((x * 7 + y * 13) % 5) * 6 + Math.random() * 10; g.fillStyle = `rgb(${v},${v - 2},${v - 8})`; g.fillRect(x * 32, y * 32, 32, 32); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x * 32, y * 32, 32, 1.5); g.fillRect(x * 32, y * 32, 1.5, 32); }
  const tex = new T.CanvasTexture(cv); tex.wrapS = tex.wrapT = T.RepeatWrapping; tex.repeat.set(N / 4, N / 4); tex.magFilter = T.NearestFilter; tex.encoding = T.sRGBEncoding; tex.anisotropy = 8;
  const san = new T.Mesh(new T.PlaneGeometry(N * 2, N * 2), new T.MeshStandardMaterial({ map: tex, roughness: .95 }));
  san.rotation.x = -Math.PI / 2; san.receiveShadow = true; scene.add(san); DK.san = san; DK.texSan = tex;   // 2026-11-15 — lộ ra cho địa hình nâng cấp
  for (const r of [5, 10, 20]) {
    const m = new T.Mesh(new T.RingGeometry(r - .04, r + .04, 96), new T.MeshBasicMaterial({ color: 0x3a3a3a, transparent: true, opacity: .35 }));
    m.rotation.x = -Math.PI / 2; m.position.y = .01; scene.add(m);
  }
  // cột đá xa (để thấy hướng + tỉ lệ)
  const mat = new T.MeshStandardMaterial({ color: 0x8a8478, roughness: 1 });
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, h = 3 + (i % 3) * 2.5; const c = new T.Mesh(new T.BoxGeometry(2, h, 2), mat); c.position.set(Math.cos(a) * 34, h / 2, Math.sin(a) * 34); c.castShadow = c.receiveShadow = true; scene.add(c); (DK.cotDa = DK.cotDa || []).push(c); }
})();

// ---------------------------------------------------------------- đồng hồ + lịch (giây MÔ PHỎNG)
DK.now = 0; DK.tocDo = 1;
let viec = [];
/** gọi fn sau t giây mô phỏng */
DK.sau = (t, fn) => { viec.push({ t: DK.now + t, fn, lap: false }); };
/** gọi fn(dt, tLocal) mỗi khung tới khi trả false (hoặc quá song giây nếu có) */
DK.lap = (fn, song) => { viec.push({ t0: DK.now, fn, lap: true, song: song || 1e9 }); };
function chayViec(dt) {
  const ds = viec; viec = [];
  const giu = [];
  for (const v of ds) {
    try {
      if (!v.lap) { if (DK.now >= v.t) v.fn(); else giu.push(v); }
      else { const tl = DK.now - v.t0; if (tl > v.song || v.fn(dt, tl) === false) continue; giu.push(v); }
    } catch (e) { console.error(e); baoLoi(e); }
  }
  viec = giu.concat(viec);
}
function baoLoi(e) { const el = document.getElementById('loi'); if (el) { el.textContent = '⚠ ' + (e && e.message || e); el.hidden = false; } }
DK.baoLoi = baoLoi;

// ---------------------------------------------------------------- nhân vật khối
const KICH = {
  hip: [0, 12 * PX, 0], tor: [0, 4 * PX, 0], co: [0, 8 * PX, 0], head: [0, 0, 0],
  aR: [-6 * PX, 6 * PX, 0], aL: [6 * PX, 6 * PX, 0], fR: [0, -4 * PX, 0], fL: [0, -4 * PX, 0], hR: [0, -4 * PX, 0], hL: [0, -4 * PX, 0], w: [0, -1.3 * PX, 0],
  lR: [-2 * PX, 0, 0], lL: [2 * PX, 0, 0], sR: [0, -6 * PX, 0], sL: [0, -6 * PX, 0], cR: [0, -5 * PX, 0], cL: [0, -5 * PX, 0],
};
const CHA = { hip: 'than', tor: 'hip', co: 'tor', head: 'co', aR: 'tor', aL: 'tor', fR: 'aR', fL: 'aL', hR: 'fR', hL: 'fL', w: 'hR', lR: 'hip', lL: 'hip', sR: 'lR', sL: 'lL', cR: 'sR', cL: 'sL' };
const HIP_CU = .95;
const KIEU = {
  kiem_tu: { ao: 0xeeeae2, ao2: 0xcfc9be, vien: 0xa5121f, da: 0xe9c3a3, toc: 0x17131b, quan: 0x3b1218, giay: 0x1d1a20, lua: 0xc0182c },
  bu_nhin: { ao: 0x3a3f4a, ao2: 0x2a2e36, vien: 0x24d2f0, da: 0xcdae98, toc: 0x161c2a, quan: 0x23262f, giay: 0x0c0d11, lua: 0x1e56a8 },
};
// hộp có tô bóng nhẹ theo mặt (vertex color) — chất Minecraft gọn, không cần atlas
function hopMau(w, h, d, mau, mau2) {
  const g = new T.BoxGeometry(w * PX, h * PX, d * PX);
  const c1 = new T.Color(mau), c2 = new T.Color(mau2 != null ? mau2 : mau);
  const col = [], n = g.attributes.position.count, nor = g.attributes.normal;
  for (let i = 0; i < n; i++) { const ny = nor.getY(i), nx = nor.getX(i); const k = ny > .5 ? 1.08 : ny < -.5 ? .7 : Math.abs(nx) > .5 ? .88 : 1; const c = (i % 4 < 2 ? c1 : c2); col.push(c.r * k, c.g * k, c.b * k); }
  g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); return g;
}
const MAT_NV = new T.MeshStandardMaterial({ vertexColors: true, roughness: .85 });

class NhanVat {
  constructor(kieu, op = {}) {
    const S = KIEU[kieu] || KIEU.kiem_tu; this.S = S; this.kieu = kieu;
    this.pos = new V3(op.x || 0, 0, op.z || 0); this.yaw = op.yaw || 0; this.vel = new V3(); this.vy = 0; this.datDat = true;
    this.root = new T.Group(); this.root.rotation.order = 'YXZ';
    this.than = new T.Group(); this.root.add(this.than);
    const k = this.k = { than: this.than };
    for (const t in CHA) { const g = new T.Group(); g.position.fromArray(KICH[t]); k[t] = g; }
    for (const t in CHA) k[CHA[t]].add(k[t]);
    const mat = this.mat = MAT_NV.clone();
    const khoi = (cha, g, x, y, z) => { const m = new T.Mesh(g, mat); m.position.set(x * PX, y * PX, z * PX); m.castShadow = true; m.receiveShadow = true; cha.add(m); return m; };
    khoi(k.head, hopMau(8, 8, 8, S.da), 0, 4, 0);
    khoi(k.head, hopMau(8.6, 3, 8.6, S.toc), 0, 7.1, -.1);           // tóc đỉnh
    khoi(k.head, hopMau(8.6, 6, 2, S.toc), 0, 4.2, -3.6);            // tóc sau
    khoi(k.head, hopMau(3, 3, 3, S.toc), 0, 9.6, -3.2);              // búi
    khoi(k.head, hopMau(1.2, 1, .3, 0x1a1418), -1.8, 4.2, 4.05); khoi(k.head, hopMau(1.2, 1, .3, 0x1a1418), 1.8, 4.2, 4.05);   // mắt
    khoi(k.hip, hopMau(8.2, 4, 4.2, S.ao, S.ao2), 0, 2, 0);
    khoi(k.hip, hopMau(8.6, 1.2, 4.6, S.vien), 0, 3.6, 0);           // đai
    khoi(k.tor, hopMau(8.2, 8, 4.2, S.ao, S.ao2), 0, 4, 0);
    khoi(k.tor, hopMau(2, 8.2, 4.4, S.vien), 1.2, 4, 0);             // vạt chéo
    for (const s of ['R', 'L']) {
      khoi(k['a' + s], hopMau(4.2, 6, 4.2, S.ao, S.ao2), 0, -1, 0);
      khoi(k['f' + s], hopMau(4.1, 5, 4.1, S.ao2), 0, -1.5, 0);
      khoi(k['h' + s], hopMau(3.6, 2.5, 3.6, S.da), 0, -.75, 0);
      khoi(k['l' + s], hopMau(4, 6, 4, S.quan), 0, -3, 0);
      khoi(k['s' + s], hopMau(3.9, 6, 3.9, S.quan), 0, -2, 0);
      khoi(k['c' + s], hopMau(4, 1.5, 4.6, S.giay), 0, -.25, .3);
    }
    // vạt áo trước / sau (tấm treo ở hông, hất theo gợi ý 'ao')
    this.vat = [];
    for (const z of [2.3, -2.3]) { const g = new T.Group(); g.position.set(0, 0, z * PX); k.hip.add(g); const m = khoi(g, hopMau(7.6, 9, .6, S.ao2, S.ao), 0, -4.5, 0); this.vat.push({ g, sau: z < 0 }); }
    // dải lụa sau lưng (đuôi tóc)
    { const g = new T.Group(); g.position.set(0, 9.3 * PX, -4 * PX); k.head.add(g); khoi(g, hopMau(1.2, 8, .5, S.lua), 0, -4, 0); this.dai = g; }
    // điểm gắn
    const diem = (cha, x, y, z) => { const g = new T.Group(); g.position.set(x, y, z); cha.add(g); return g; };
    this.gan = { nguc: diem(k.tor, 0, 4.5 * PX, 2.4 * PX), lung: diem(k.tor, 0, 4.5 * PX, -2.4 * PX), dau: diem(k.head, 0, 4 * PX, 0), dinhDau: diem(k.head, 0, 8.6 * PX, 0),
      tayR: diem(k.hR, 0, -1.2 * PX, 0), tayL: diem(k.hL, 0, -1.2 * PX, 0), hong: diem(k.hip, 0, 2 * PX, 0), chanR: diem(k.cR, 0, -1 * PX, .5 * PX), chanL: diem(k.cL, 0, -1 * PX, .5 * PX) };
    this.thap = [];
    const thap = (cha, x, y, z) => this.thap.push(diem(cha, x * PX, y * PX, z * PX));
    for (const s of ['R', 'L']) { thap(k['c' + s], 0, -1, -2); thap(k['c' + s], 0, -1, 2); thap(k['s' + s], 0, 0, 2); thap(k['f' + s], 0, 0, 0); }
    thap(k.hip, 0, 0, -2); thap(k.head, 0, 8.5, 0); thap(k.tor, 0, 7, -2);
    // kiếm
    this.kiem = new T.Group(); k.w.add(this.kiem);
    this.canKiem = new T.Group(); this.muiKiem = new T.Group(); this.kiem.add(this.canKiem); this.kiem.add(this.muiKiem);
    this.daiKiem = 1;
    // trạng thái động tác
    this.tuThe = ttMoi(); this.nen = ttMoi(); this.tam = ttMoi(); this.tu = ttMoi();
    this.hd = null;                // hành động (clip) đang phát
    this.pha = 0; this.tKhong = 0; this.dangDo = false; this.anTay = 1;
    this.mau = 1000; this.mauMax = 1000; this.nhay = 0; this.trangThai = {};
    scene.add(this.root);
    this.apDung();
  }
  /** thế giới: điểm gắn → V3 */
  diem(ten, out) { out = out || new V3(); const g = this.gan[ten] || this.k[ten]; this.root.updateMatrixWorld(true); return g.getWorldPosition(out); }
  mui(out) { out = out || new V3(); this.root.updateMatrixWorld(true); return this.muiKiem.getWorldPosition(out); }
  can(out) { out = out || new V3(); this.root.updateMatrixWorld(true); return this.canKiem.getWorldPosition(out); }
  /** hướng tới (V3 đơn vị, mặt phẳng) và sang phải */
  toi(out) { return (out || new V3()).set(Math.sin(this.yaw), 0, Math.cos(this.yaw)); }
  phai(out) { return (out || new V3()).set(-Math.cos(this.yaw), 0, Math.sin(this.yaw)); }
  /** điểm cách thân: (phải, lên, tới) m → thế giới */
  quanh(p, l, t, out) { const f = this.toi(), r = this.phai(); return (out || new V3()).copy(this.pos).addScaledVector(r, p).addScaledVector(f, t).add(new V3(0, l, 0)); }
  ngam(viTri) { const d = new V3().subVectors(viTri, this.pos); if (d.x * d.x + d.z * d.z > 1e-6) this.yaw = Math.atan2(d.x, d.z); }
  apDung() {
    const c = this.tuThe, k = this.k;
    for (let j = 1; j < 18; j++) { const ten = KHOP[j]; const g = k[ten]; if (g) g.rotation.set(c[j * 3] * D, c[j * 3 + 1] * D, c[j * 3 + 2] * D); }
    this.than.rotation.set(c[0] * D, c[1] * D, c[2] * D);
    this.root.position.copy(this.pos); this.root.rotation.set(this.cui || 0, this.yaw, this.nghieng || 0);   // cui / nghieng (rad) — cưỡi / bay
    this.than.position.set(0, 0, 0); this.root.updateMatrixWorld(true);
    let thap = 1e9; const p = _p; for (const g of this.thap) { g.getWorldPosition(p); if (p.y < thap) thap = p.y; }
    const cham = clamp(c[CHAM], 0, 1);
    const lat = clamp((1 - Math.cos(c[0] * D) * Math.cos(c[2] * D)) * 1.5, 0, 1);
    this.than.position.set(c[JX], (this.pos.y - thap) * cham + c[JY] + (1 - cham) * lat * (HIP_CU - KICH.hip[1]), c[JZ]);
    // vạt áo / tóc theo gợi ý
    const ao = c[KI.ao * 3], toc = c[KI.toc * 3];
    for (const v of this.vat) v.g.rotation.x = (v.sau ? 1 : -1) * Math.max(0, ao) * D * .9 + (v.sau ? 0.05 : -0.05);
    if (this.dai) this.dai.rotation.x = -(.25 + Math.max(0, toc) * D);
    this.root.updateMatrixWorld(true);
  }
}
const _p = new V3();
DK.NhanVat = NhanVat;

// ---------------------------------------------------------------- dựng kiếm từ hop (vu_khi.json / phap_bao.json)
// trục px của dữ liệu: y = dọc lưỡi (mũi +y), x = bản lưỡi, z = dày; đơn vị DL.PX m/px. Gốc = tay cầm.
const _hopCache = {};
function hinhHop(ds, px) {
  const geos = [];
  for (const h of ds) {
    const g = new T.BoxGeometry(h.co[0] * px, h.co[1] * px, h.co[2] * px); g.translate(h.tam[0] * px, h.tam[1] * px, h.tam[2] * px);
    const c = new T.Color(h.mau); const n = g.attributes.position.count, col = new Float32Array(n * 3), nor = g.attributes.normal;
    for (let i = 0; i < n; i++) { const k = nor.getY(i) > .5 ? 1.1 : nor.getY(i) < -.5 ? .75 : Math.abs(nor.getX(i)) > .5 ? .9 : 1; col[i * 3] = c.r * k; col[i * 3 + 1] = c.g * k; col[i * 3 + 2] = c.b * k; }
    g.setAttribute('color', new T.BufferAttribute(col, 3)); geos.push(g.toNonIndexed ? g.toNonIndexed() : g);
  }
  // gộp
  let n = 0; for (const g of geos) n += g.attributes.position.count;
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = new Float32Array(n * 3); let o = 0;
  for (const g of geos) { P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); C.set(g.attributes.color.array, o * 3); o += g.attributes.position.count; }
  const G = new T.BufferGeometry(); G.setAttribute('position', new T.BufferAttribute(P, 3)); G.setAttribute('normal', new T.BufferAttribute(N, 3)); G.setAttribute('color', new T.BufferAttribute(C, 3));
  G.computeBoundingSphere(); return G;
}
/** mesh kiếm (y = dọc lưỡi) từ một mục vu_khi / phap_bao; op.sang (0..) = tự phát sáng theo màu */
DK.meshKiem = function (muc, op = {}) {
  const key = muc.ma; const G = _hopCache[key] || (_hopCache[key] = hinhHop(muc.hop, DL.PX));
  const mat = new T.MeshStandardMaterial({ vertexColors: true, roughness: .45, metalness: .35, emissive: new T.Color(muc.mau_hex || '#ffffff'), emissiveIntensity: op.sang || 0 });
  if (op.trong != null) { mat.transparent = true; mat.opacity = op.trong; mat.depthWrite = false; }
  const m = new T.Mesh(G, mat); m.castShadow = op.bong !== false; return m;
};
/** đổi kiếm cầm tay của nhân vật */
NhanVat.prototype.camKiem = function (muc) {
  if (this.kiemMesh) { this.kiem.remove(this.kiemMesh); this.kiemMesh.material.dispose(); }
  this.vk = muc; if (!muc) { this.kiemMesh = null; return; }
  const m = DK.meshKiem(muc, { sang: .12 }); m.rotation.x = Math.PI / 2;     // y dữ liệu → +z của khớp w (lưỡi nối cẳng tay khi w x = 90)
  this.kiem.add(m); this.kiemMesh = m;
  const muiY = (muc.mui ? muc.mui[1] : 20) * DL.PX;
  this.canKiem.position.set(0, 0, 3 * DL.PX); this.muiKiem.position.set(0, 0, muiY);
  this.daiKiem = muiY;
};

// ---------------------------------------------------------------- bộ phát động tác
/**
 * DK.phat(nv, clip, op) — phát một clip trên nhân vật (giống DongTacWeb.PhatClip).
 *   clip: tên trong DK.CLIP hoặc object từ DK.clip(...)
 *   op: { tocDo, tron, ra, khongMv, moc: { ten: fn }, khiMoc(ten), xong(), khoaDi (mặc định true), giu (giữ tư thế cuối tới khi phát cái khác) }
 * trả về hd { clip, t, dung() }
 */
DK.phat = function (nv, clip, op = {}) {
  const c = layClip(clip);
  if (nv.hd && nv.hd.op.huy) try { nv.hd.op.huy(); } catch (e) { }
  const hd = { clip: c, t: 0, op, mvTruoc: [0, 0], yaw0: nv.yaw, tron: op.tron != null ? op.tron : c.tron != null ? c.tron : .07, ra: op.ra != null ? op.ra : c.ra != null ? c.ra : .18,
    tocDo: op.tocDo || 1, daMoc: {}, khoaDi: op.khoaDi !== false, xong: false };
  nv.tu.set(nv.tuThe); hd.dung = () => { if (nv.hd === hd) { nv.hd = null; nv.tRa = 0; nv.tu.set(nv.tuThe); } };
  if (c.mv) mvTai(c.mv, 0, hd.mvTruoc);
  nv.hd = hd; return hd;
};
const _mv = [0, 0];
function buocDongTac(nv, dt) {
  // ---- lớp nền: thủ thế / đi / chạy / trên không ----
  const v = Math.hypot(nv.vel.x, nv.vel.z);
  const nen = nv.nen;
  if (!nv.datDat) {
    const ten = nv.vy > 2 ? 'LEN' : nv.vy > -2 ? 'DINH' : 'ROI'; nen.set(TT[ten]);
  } else if (v > .4) {
    const chay = v > 5.5; const vong4 = chay ? ['CHAY_A', 'CHAY_QA', 'CHAY_B', 'CHAY_QB'] : ['DI_A', 'DI_QA', 'DI_B', 'DI_QB'];
    nv.pha = (nv.pha + dt * v * (chay ? .55 : .75)) % 4;
    const i = Math.floor(nv.pha), u = nv.pha - i;
    tron(TT[vong4[i]], TT[vong4[(i + 1) % 4]], ease(7, u), nen);
    // tay cầm kiếm: giữ thế thủ
    const thu = TT[nv.theThu || 'THU'];
    for (const j of ['aR', 'fR', 'hR', 'w']) { const x = KI[j] * 3; for (let a = 0; a < 3; a++) nen[x + a] += (thu[x + a] - nen[x + a]) * .55; }
  } else {
    nen.set(TT[nv.theThu || 'THU']);
    const th = Math.sin(DK.now * 2.2 + (nv.id || 0)); nen[KI.tor * 3] += th * 1.2; nen[KI.head * 3] -= th * .8; nen[KI.aL * 3] += th * 1.5;
  }
  if (nv.dangDo && TT[nv.theDo || 'DO']) tron(nen, TT[nv.theDo || 'DO'], .9, nen);
  // ---- lớp clip ----
  const hd = nv.hd;
  if (hd) {
    hd.t += dt * hd.tocDo;
    const c = hd.clip;
    layMau(c, Math.min(hd.t, c.dai), nv.tam);
    const wv = hd.tron > 0 ? clamp(hd.t / hd.tron, 0, 1) : 1;
    tron(nv.tu, nv.tam, ease(1, wv), nv.tuThe);
    if (c.than === 1 && v > .4) for (const j of DUOI) for (let a = 0; a < 3; a++) nv.tuThe[j * 3 + a] = nen[j * 3 + a];
    // dời gốc
    if (c.mv && !hd.op.khongMv) {
      mvTai(c.mv, Math.min(hd.t, c.dai), _mv);
      const dr = _mv[0] - hd.mvTruoc[0], df = _mv[1] - hd.mvTruoc[1]; hd.mvTruoc[0] = _mv[0]; hd.mvTruoc[1] = _mv[1];
      const s = Math.sin(hd.yaw0), co = Math.cos(hd.yaw0);
      nv.pos.x += s * df - co * dr; nv.pos.z += co * df + s * dr;
    }
    // mốc
    for (const m in c.moc) if (!hd.daMoc[m] && hd.t >= c.moc[m]) {
      hd.daMoc[m] = true;
      try { if (hd.op.moc && hd.op.moc[m]) hd.op.moc[m](m); if (hd.op.khiMoc) hd.op.khiMoc(m); DK.suKien('moc', { nv, clip: c.ten, moc: m }); } catch (e) { console.error(e); baoLoi(e); }
    }
    if (hd.t >= c.dai && !hd.op.giu) {
      if (!hd.xong) { hd.xong = true; try { hd.op.xong && hd.op.xong(); } catch (e) { console.error(e); baoLoi(e); } }
      if (nv.hd === hd) { nv.hd = null; nv.tRa = 0; nv.tu.set(nv.tuThe); nv.raDai = hd.ra; }
    }
  } else {
    nv.tRa = (nv.tRa || 0) + dt; const ra = nv.raDai || .18;
    if (nv.tRa < ra) tron(nv.tu, nen, ease(1, nv.tRa / ra), nv.tuThe); else nv.tuThe.set(nen);
  }
}
DK.dangPhat = nv => !!(nv && nv.hd);

// ---------------------------------------------------------------- sự kiện đơn giản
const nghe = {};
DK.nghe = (ten, fn) => (nghe[ten] || (nghe[ten] = [])).push(fn);
DK.suKien = (ten, x) => { for (const f of nghe[ten] || []) f(x); };

// ---------------------------------------------------------------- nhân vật trong cảnh
const nc = DK.nc = new NhanVat('kiem_tu', { x: 0, z: 0 }); nc.id = 0; nc.la = 'nguoi';
DK.dsBuNhin = [];
function taoBuNhin(x, z) { const b = new NhanVat('bu_nhin', { x, z, yaw: Math.PI }); b.id = DK.dsBuNhin.length + 1; b.la = 'bu_nhin'; b.goc = new V3(x, 0, z); DK.dsBuNhin.push(b); b.camKiem(DL.VU_KHI[0]); return b; }
DK.datBuNhin = function (so) {
  for (const b of DK.dsBuNhin) { scene.remove(b.root); if (b.thanhMau) b.thanhMau.remove(); }
  DK.dsBuNhin = [];
  if (so === 1) taoBuNhin(0, 6);
  else for (let i = 0; i < so; i++) { const a = (i - (so - 1) / 2) * .45; taoBuNhin(Math.sin(a) * 7, Math.cos(a) * 7); }
};
DK.datBuNhin(1);
DK.cheDoBuNhin = 'dung';   // dung | vong | do (tự đỡ)
/** mục tiêu: đang khoá hoặc gần nhất phía trước */
DK.mucTieu = function () {
  if (DK.khoa && DK.dsBuNhin.indexOf(DK.khoa) >= 0) return DK.khoa;
  let tot = null, d0 = 1e9; for (const b of DK.dsBuNhin) { const d = b.pos.distanceTo(nc.pos); if (d < d0) { d0 = d; tot = b; } } return tot;
};

// ---------------------------------------------------------------- trúng đòn
const soNoi = [];
function chuNoi(text, pos, mau) {
  const el = document.createElement('div'); el.className = 'so_noi'; el.textContent = text; el.style.color = mau || '#fff'; document.body.appendChild(el);
  soNoi.push({ el, pos: pos.clone().add(new V3((Math.random() - .5) * .4, 0, 0)), t: 0 });
}
DK.chuNoi = chuNoi;
/**
 * DK.trung(dich, op) — một nhát trúng: op { st (sát thương), nguon (NhanVat), day (m đẩy lùi), hat (m hất lên), mau (css/hex), choang (s),
 *   trangThai: 'tro'|'cham'|'dong_bang'|'giap_vo'|'doc'|… (hiện chữ), khongPhanUng }
 */
DK.trung = function (dich, op = {}) {
  if (!dich) return;
  const st = Math.round(op.st != null ? op.st : 50);
  const nguon = op.nguon || nc;
  const chan = DK.cheDoBuNhin === 'do' && dich.la === 'bu_nhin' && !op.khongDo;
  dich.mau = Math.max(0, dich.mau - (chan ? st * .2 : st)); if (dich.mau <= 0) DK.sau(1.2, () => dich.mau = dich.mauMax);
  dich.nhay = 1;
  const p = dich.diem('dau'); p.y += .5;
  chuNoi(chan ? 'đỡ ' + Math.round(st * .2) : String(st), p, chan ? '#9cf' : (op.mau ? '#' + new T.Color(op.mau).getHexString() : '#ffe9b0'));
  if (op.trangThai) chuNoi(op.trangThai, p.clone().add(new V3(0, .35, 0)), '#ffd36b');
  if (op.khongPhanUng) return;
  const huong = new V3().subVectors(dich.pos, nguon.pos); huong.y = 0; if (huong.lengthSq() < 1e-6) huong.copy(nguon.toi()); huong.normalize();
  if (op.day) { const day = chan ? op.day * .3 : op.day; DK.lap((dt, tl) => { const k = Math.exp(-tl * 8); dich.pos.addScaledVector(huong, day * 8 * k * dt); return tl < .5; }); }
  if (op.hat && !chan) { dich.vy = Math.sqrt(2 * 20 * op.hat); dich.datDat = false; }
  if (dich.la === 'bu_nhin') {
    const c = chan ? 'DO_TRUNG' : op.st > 120 || op.hat ? 'TRUNG_NANG' : (Math.random() < .5 ? 'TRUNG_NHE' : 'TRUNG_NHE_2');
    if (CLIP[c]) DK.phat(dich, c, { khongMv: true });
  }
  DK.suKien('trung', { dich, op });
};
// ---- tìm đích theo hình (trả mảng bù nhìn) ----
DK.trongTron = (tam, r) => DK.dsBuNhin.filter(b => Math.hypot(b.pos.x - tam.x, b.pos.z - tam.z) <= r + .35);
DK.trongNon = (nv, r, gocDo) => DK.dsBuNhin.filter(b => { const d = new V3().subVectors(b.pos, nv.pos); d.y = 0; const l = d.length(); if (l > r + .35) return false; if (l < .5) return true; return nv.toi().angleTo(d.normalize()) <= gocDo * D / 2; });
DK.trongDuong = (a, b, rong) => DK.dsBuNhin.filter(x => { const ab = new V3().subVectors(b, a); ab.y = 0; const L = ab.length(); if (L < 1e-4) return false; ab.divideScalar(L); const ap = new V3().subVectors(x.pos, a); ap.y = 0; const t = ap.dot(ab); if (t < -.4 || t > L + .4) return false; return Math.abs(ap.x * ab.z - ap.z * ab.x) <= rong / 2 + .35; });

// ---------------------------------------------------------------- điều khiển + máy quay (như Unity: WASD, Shift chạy, Space nhảy, chuột trái/J đánh, chuột phải/K đỡ, Tab khoá, Z X C V R chiêu, Q pháp bảo, F ngự kiếm)
const phim = {}; DK.phim = phim;
const may = DK.may = { yaw: Math.PI, pitch: .28, xa: 5.2, xaMuc: 5.2, che: 'sau', rung: 0, rungT: 0, tam: new V3() };
let keoChuot = null;
addEventListener('keydown', e => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA')) return;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; if (phim[k]) { if (k !== 'Tab') return; }
  phim[k] = true;
  if (k === 'Tab') { e.preventDefault(); DK.khoa = DK.khoa ? null : DK.mucTieu(); DK.suKien('khoa'); }
  else if (k === ' ') { e.preventDefault(); if (nc.datDat && !nc.dangCuoi) { nc.vy = 7.2; nc.datDat = false; } DK.suKien('phim', ' '); }
  else DK.suKien('phim', k);
});
addEventListener('keyup', e => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; phim[k] = false; DK.suKien('nhaPhim', k); });
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('mousedown', e => {
  if (document.pointerLockElement === canvas) { if (e.button === 0) DK.suKien('phim', 'j'); if (e.button === 2) phim.k = true; if (e.button === 1) { DK.khoa = DK.khoa ? null : DK.mucTieu(); } return; }
  keoChuot = { x: e.clientX, y: e.clientY, nut: e.button, keo: 0 };
  if (e.button === 2) phim.k = true;
});
addEventListener('mouseup', e => {
  if (e.button === 2) phim.k = false;
  if (keoChuot && keoChuot.nut === 0 && keoChuot.keo < 5 && document.pointerLockElement !== canvas) DK.suKien('phim', 'j');
  keoChuot = null;
});
addEventListener('mousemove', e => {
  if (document.pointerLockElement === canvas) { may.yaw -= e.movementX * .0032; may.pitch = clamp(may.pitch + e.movementY * .0026, -.5, 1.2); return; }
  if (!keoChuot) return; const dx = e.clientX - keoChuot.x, dy = e.clientY - keoChuot.y; keoChuot.keo += Math.abs(dx) + Math.abs(dy); keoChuot.x = e.clientX; keoChuot.y = e.clientY;
  if (keoChuot.nut === 0 || keoChuot.nut === 1) { may.yaw -= dx * .006; may.pitch = clamp(may.pitch + dy * .005, -.5, 1.2); }
});
canvas.addEventListener('dblclick', () => canvas.requestPointerLock && canvas.requestPointerLock());
canvas.addEventListener('wheel', e => { e.preventDefault(); may.xaMuc = clamp(may.xaMuc * (e.deltaY > 0 ? 1.12 : .89), 1.8, 40); }, { passive: false });
DK.rung = (m, song) => { may.rung = Math.max(may.rung, m); may.rungT = song || .3; };

function buocNguoiChoi(dt) {
  // đỡ
  nc.dangDo = !!phim.k && !nc.hd && !nc.dangCuoi;
  const khoaDi = (nc.hd && nc.hd.khoaDi) || nc.dangDo;
  let vx = 0, vz = 0;
  if (!khoaDi && !nc.dangCuoi) {
    let f = 0, r = 0; if (phim.w || phim.ArrowUp) f++; if (phim.s || phim.ArrowDown) f--; if (phim.d || phim.ArrowRight) r++; if (phim.a || phim.ArrowLeft) r--;
    if (f || r) {
      const chay = phim.Shift, toc = (chay ? 7.5 : 4) / DK.NHIP_GOC;   // m/s thật → mô phỏng
      const fy = may.yaw + Math.PI;      // hướng máy nhìn
      const fx = Math.sin(fy), fz = Math.cos(fy), rx = -Math.cos(fy), rz = Math.sin(fy);
      let dx = fx * f + rx * r, dz = fz * f + rz * r; const l = Math.hypot(dx, dz); dx /= l; dz /= l;
      vx = dx * toc; vz = dz * toc;
      const muc = DK.khoa ? Math.atan2(DK.khoa.pos.x - nc.pos.x, DK.khoa.pos.z - nc.pos.z) : Math.atan2(dx, dz);
      nc.yaw += vong((muc - nc.yaw) / D) * D * DK.tien(12, dt);
    }
  }
  nc.vel.x += (vx - nc.vel.x) * DK.tien(14, dt); nc.vel.z += (vz - nc.vel.z) * DK.tien(14, dt);
  nc.pos.x += nc.vel.x * dt; nc.pos.z += nc.vel.z * dt;
  if (DK.khoa && nc.hd && nc.hd.t < .08 && !nc.hd.op.khongXoay) nc.ngam(DK.khoa.pos);
}
function buocTrongLuc(nv, dt) {
  if (nv.dangCuoi || nv.treo) return;
  if (!nv.datDat || nv.pos.y > 0) { nv.vy -= 20 * dt; nv.pos.y += nv.vy * dt; if (nv.pos.y <= 0) { nv.pos.y = 0; nv.vy = 0; nv.datDat = true; } else nv.datDat = false; }
}
function buocBuNhin(b, dt) {
  if (DK.cheDoBuNhin === 'vong' && !b.hd) {
    const a = Math.atan2(b.pos.x - nc.pos.x, b.pos.z - nc.pos.z) + dt * .35; const r = Math.max(4, Math.hypot(b.pos.x - nc.pos.x, b.pos.z - nc.pos.z));
    const nx = nc.pos.x + Math.sin(a) * r, nz = nc.pos.z + Math.cos(a) * r; b.vel.set((nx - b.pos.x) / dt, 0, (nz - b.pos.z) / dt); b.pos.x = nx; b.pos.z = nz;
  } else b.vel.set(0, 0, 0);
  if (!b.hd) b.ngam(nc.pos);
  b.dangDo = DK.cheDoBuNhin === 'do' && !b.hd;
  b.nhay = Math.max(0, b.nhay - dt * 5);
  b.mat.emissive.setRGB(b.nhay, b.nhay * .9, b.nhay * .8);
}
function buocMay(dt) {
  const tamNv = new V3(nc.pos.x, nc.pos.y + 1.45, nc.pos.z);
  may.xa += (may.xaMuc - may.xa) * DK.tien(8, dt);
  if (may.che === 'ngang') {
    // nhìn ngang từ bên phải nhân vật (cố định theo thế giới) — dễ đọc dáng đòn
    may.tam.lerp(tamNv, DK.tien(6, dt)); const x = may.xa * 1.3;
    cam.position.set(may.tam.x + x, may.tam.y + .2, may.tam.z + 1.2); cam.lookAt(may.tam.x, may.tam.y - .3, may.tam.z + 1.2);
  } else {
    if (DK.khoa && may.che === 'sau') {
      const muc = Math.atan2(nc.pos.x - DK.khoa.pos.x, nc.pos.z - DK.khoa.pos.z);
      may.yaw += vong((muc - may.yaw) / D) * D * DK.tien(4, dt);
    }
    may.tam.lerp(tamNv, DK.tien(10, dt));
    const cp = Math.cos(may.pitch), x = may.tam.x + Math.sin(may.yaw) * cp * may.xa, z = may.tam.z + Math.cos(may.yaw) * cp * may.xa, y = may.tam.y + Math.sin(may.pitch) * may.xa;
    // lệch vai phải
    const vai = .55; cam.position.set(x - Math.cos(may.yaw) * vai, Math.max(.3, y), z + Math.sin(may.yaw) * vai);
    const nhin = DK.khoa ? new V3().lerpVectors(may.tam, DK.khoa.pos.clone().setY(1.2), .35) : may.tam;
    cam.lookAt(nhin.x - Math.cos(may.yaw) * vai, nhin.y, nhin.z + Math.sin(may.yaw) * vai);
  }
  if (may.rungT > 0) { may.rungT -= dt; const m = may.rung * Math.max(0, may.rungT) * 3; cam.position.x += (Math.random() - .5) * m * .2; cam.position.y += (Math.random() - .5) * m * .2; } else may.rung = 0;
  nang.position.set(nc.pos.x + 18, 30, nc.pos.z + 10); nang.target.position.copy(nc.pos);
}

// ---------------------------------------------------------------- vòng lặp
const dsCapNhat = [];
/** đăng ký hàm chạy mỗi khung (dt mô phỏng) suốt đời trang (hệ thống, ví dụ hào quang vũ khí) */
DK.moiKhung = fn => dsCapNhat.push(fn);
DK.dung = false;
function buoc(dt) {
  DK.now += dt;
  buocNguoiChoi(dt);
  for (const nv of [nc].concat(DK.dsBuNhin)) {
    if (nv !== nc) buocBuNhin(nv, dt);
    buocTrongLuc(nv, dt);
    buocDongTac(nv, dt);
    nv.apDung();
  }
  chayViec(dt);
  for (const f of dsCapNhat) try { f(dt); } catch (e) { console.error(e); }
  DK.suKien('buoc', dt);
  buocMay(dt);
}
function capNhatChu() {
  const w = canvas.clientWidth, h = canvas.clientHeight, v = new V3();
  for (let i = soNoi.length - 1; i >= 0; i--) {
    const s = soNoi[i]; s.t += .016; s.pos.y += .012; v.copy(s.pos).project(cam);
    if (s.t > 1.1 || v.z > 1) { s.el.remove(); soNoi.splice(i, 1); continue; }
    s.el.style.transform = `translate(${(v.x * .5 + .5) * w}px,${(-v.y * .5 + .5) * h}px) translate(-50%,-50%) scale(${1 + Math.max(0, .25 - s.t) * 2})`; s.el.style.opacity = String(1 - Math.max(0, s.t - .7) / .4);
  }
  for (const b of DK.dsBuNhin) {
    if (!b.thanhMau) { b.thanhMau = document.createElement('div'); b.thanhMau.className = 'mau'; b.thanhMau.innerHTML = '<i></i>'; document.body.appendChild(b.thanhMau); }
    v.copy(b.pos); v.y += 2.25; v.project(cam);
    b.thanhMau.style.display = v.z > 1 ? 'none' : ''; b.thanhMau.style.transform = `translate(${(v.x * .5 + .5) * w}px,${(-v.y * .5 + .5) * h}px) translate(-50%,-50%)`;
    b.thanhMau.firstChild.style.width = (b.mau / b.mauMax * 100) + '%'; b.thanhMau.classList.toggle('khoa', DK.khoa === b);
  }
}
function coKhung() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (canvas.width !== Math.floor(w * renderer.getPixelRatio()) || canvas.height !== Math.floor(h * renderer.getPixelRatio())) { renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
}
let tTruoc = performance.now();
function khung() {
  requestAnimationFrame(khung);
  const t = performance.now(); let dtThat = Math.min(.05, (t - tTruoc) / 1000); tTruoc = t;
  if (!DK.dung) { const dt = dtThat * DK.NHIP_GOC * DK.tocDo; const n = Math.ceil(dt / (1 / 120)); for (let i = 0; i < n; i++) buoc(dt / n); }
  coKhung(); capNhatChu(); DK.ve();
}
/** chạy nhanh t giây mô phỏng (bước cố định) — dùng cho chụp ảnh tự kiểm */
DK.tua = function (t) { const n = Math.round(t * 120); for (let i = 0; i < n; i++) buoc(1 / 120); coKhung(); DK.ve(); };
/** đặt lại cảnh: dọn hiệu ứng, việc, vị trí */
DK.datLai = function () {
  viec = []; nc.hd = null; nc.pos.set(0, 0, 0); nc.yaw = 0; nc.vel.set(0, 0, 0); nc.dangCuoi = false; nc.treo = false;
  for (const b of DK.dsBuNhin) { b.hd = null; b.pos.copy(b.goc); b.mau = b.mauMax; b.trangThai = {}; }
  DK.suKien('datLai');
};
DK.batDau = function () { buoc(0); khung(); };
// 2026-11-15 — DK.ve: nang_cap.js thay bằng bloom + khung va chạm
DK.ve = () => renderer.render(scene, cam);
DK.chupAnh = function () { DK.ve(); return canvas.toDataURL('image/jpeg', .85); };
})();
