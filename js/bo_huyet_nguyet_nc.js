"use strict";
// ============================================================================
// bo_huyet_nguyet_nc.js — 2026-11-16 — BẢN NÂNG CẤP (đề xuất) HUYẾT NGUYỆT KIẾM ĐIỂN — LÀM LẠI.
//   Người dùng chê bản 2026-11-15 "chưa đẹp, chiêu chưa rõ": hiệu ứng nhỏ, mảnh, trời nhuộm đỏ cả màn, không có hình dấu ấn.
//   Nguyên tắc bản này:
//   · Mỗi chiêu MỘT HÌNH DẤU ẤN to, đọc được trong 0,2 s từ máy sau lưng:
//       Z ba trăng khuyết mực DÀY viền máu bay xa · X vệt mực xuyên qua + chữ X đỏ–đen in trên thân địch
//       C trăng DỌC khổng lồ bổ xuống, hố + nứt đỏ · V bảy thanh kiếm thật to xếp Bắc Đẩu rồi lần lượt giáng
//       R trăng máu lớn mọc phía trước, bạt kiếm phóng lưỡi liềm ngang khổng lồ xẻ rãnh đất.
//   · Trăng khuyết DỰNG MẶT về máy quay (mặt phẳng vuông góc hướng bay, nghiêng theo nhát chém) — bản cũ nằm ngang theo
//     hướng bay nên nhìn từ sau chỉ còn một nét mảnh.
//   · Nhịp 3 pha: báo (lấy đà + dấu hiệu nhỏ) → ra đòn (hình dấu ấn) → dư âm (đất, mảnh, tan). Ít phần tử, to, đậm.
//   · Màu: chỉ hiệu ứng có màu (mực đen + đỏ máu; vệt chém theo ctx.mau). Không nhuộm đỏ màn hình; chỉ làm TỐI trời
//     (tầng 4–5) và viền màn nhẹ ≤ .3 ở tầng 5.
//   · Tư thế: bỏ thế bổ hai tay thõng kiếm (N6_S/N7_S/C_BO) ⇒ thế bổ một tay, tay trái mở thăng bằng (HNC_BO_*).
//   2026-11-17 — vòng 2 (người dùng góp ý): bỏ MỌI nháy màn hình (vaCham, viền màn, đổi trời, chớp); bỏ trăng máu tròn;
//     bớt ánh trắng (vệt kiếm dịu, lõi nóng đỏ hồng); X ám sát lướt vòng cung xa hơn; V nghi thức kiếm trận nhiều pha;
//     C nhiều pha (đạp đất · lộn xoáy · treo · bổ); R nhiều pha + lưỡi liềm to dần theo tầng (Hoá Cảnh quét gần cả sân).
//   2026-11-17 — vòng 3: Phi Hồng làm lại (một trăng sinh theo mũi kiếm → tách → xẻ đất tách đôi); mọi kiếm khí/nét chém hiện
//     CÙNG CHIỀU vung kiếm (theo dõi mũi kiếm c.vMui); đòn hất làm đích bay lên, đòn bổ dồn xuống; Hoá Cảnh dùng dia.daiPha,
//     R (và C) bay tới núi, dia.sapNui đánh sập.
//   Phụ thuộc: tư thế HNN_* của bản game (bo_huyet_nguyet.js nạp trước) được sao sang HNC_*.
// ============================================================================
(function () {
const DK = window.DK, T = DK.T, V3 = DK.V3, vfx = DK.vfx, dia = DK.dia;
if (!DK.dangKyBoNC || !dia) return;
const D = DK.D, LEN = new V3(0, 1, 0), clamp = DK.clamp;
const rr = (a, b) => a + Math.random() * (b - a);
const sm = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
// màu cả bộ: đỏ máu (HDR khi nhân) + mực
const DO = new T.Color(1, .06, .12), DO_DAM = new T.Color(.42, .01, .04), MUC = new T.Color(.025, .012, .018), NONG = new T.Color(1, .28, .3);
const doS = k => DO.clone().multiplyScalar(k);
/** xoay hướng ngang v quanh trục đứng `deg` độ, dương = sang PHẢI */
function xoayY(v, deg) { const r = deg * D, c = Math.cos(r), s = Math.sin(r); return new V3(v.x * c - v.z * s, v.y, v.z * c + v.x * s); }
const ngucCua = b => new V3(b.pos.x, b.pos.y + 1.15, b.pos.z);

// ---------------------------------------------------------------- tư thế
for (const k in DK.TT) if (k.indexOf('HNN_') === 0 && !DK.TT['HNC_' + k.slice(4)]) DK.TT['HNC_' + k.slice(4)] = DK.TT[k];
const CK = ' lR:-66,0,-8 sR:104 cR:25 lL:-18,0,8 sL:96 cL:35';   // chân co trên không
const TU_THE = [
  // bổ MỘT TAY (thay thế bổ hai tay thõng kiếm): giữa đường, chạm, dư lực
  'HNC_BO_M', 'tor:24,8 head:-18,-6 aR:-128,0,6 fR:-12 w:84 aL:-30,0,58 fL:-40 lR:-60,0,-8 sR:82 lL:38,0,8 sL:50 ao:22',
  'HNC_BO_S', 'tor:52,14 head:-38,-10 aR:-66,0,20 fR:-4 w:96 aL:12,0,64 fL:-22 lR:-84,0,-10 sR:108 lL:50,0,10 sL:22 cL:24 ao:52 toc:34',
  'HNC_BO_G', 'tor:58,18 head:-42,-12 aR:-56,0,26 fR:-6 w:100 aL:16,0,68 fL:-18 lR:-88,0,-10 sR:112 lL:52,0,10 sL:20 cL:26 ao:58 toc:38',
  // nhảy (combo 7): nâng người bằng jy
  'HNC_N7_LEN',  'tor:-18,34 head:-30,-20 aR:-200,0,30 fR:-10 w:90 aL:-50,0,40 fL:-40 ao:-40 toc:-40 cham:0 jy:1.1' + CK,
  'HNC_N7_DINH', 'tor:-24,-6 head:12,6 aR:-196,0,-14 fR:-56 w:70 aL:-150,0,40 fL:-40 ao:-10 toc:-10 cham:0 jy:1.35' + CK,
  'HNC_N7_BO',   'tor:50,10 head:-40,-6 aR:-74,0,20 fR:-4 w:96 aL:10,0,62 fL:-24 lR:-40,0,-8 sR:40 lL:20,0,8 sL:30 ao:-30 toc:-40 cham:0 jy:.35',
  // bay cao (C, X Hoá Cảnh): độ cao do code điều khiển (treo) ⇒ jy 0
  'HNC_C_BAY_LEN',  'tor:-18,34 head:-30,-20 aR:-200,0,30 fR:-10 w:90 aL:-50,0,40 fL:-40 ao:-40 toc:-40 cham:0 jy:0' + CK,
  'HNC_C_BAY_DINH', 'tor:-26,-8 head:14,6 aR:-200,0,-12 fR:-50 w:70 aL:-140,0,46 fL:-30 ao:-10 toc:-10 cham:0 jy:0' + CK,
  'HNC_C_BAY_BO',   'tor:50,10 head:-40,-6 aR:-80,0,18 fR:-4 w:96 aL:10,0,62 fL:-24 lR:-40,0,-8 sR:40 lL:20,0,8 sL:30 ao:-30 toc:-40 cham:0 jy:0',
  // C: treo trên đỉnh — kiếm giương sau gáy một tay, tay trái chỉ xuống đích
  'HNC_C_TREO', 'tor:-22,12 head:14,-8 aR:-200,0,-24 fR:-70 w:70 aL:-70,0,24 fL:-8 ao:-10 toc:-10 cham:0 jy:0' + CK,
  // V: giơ kiếm lên trời triệu kiếm · chỉ kiếm về đích
  'HNC_V_TRIEU', 'tor:-10,-24 head:-30,18 aR:-180,0,-12 fR:-4 w:90 aL:-20,0,50 fL:-40 lR:-44,0,-10 sR:56 lL:30,0,10 sL:44 ao:12',
  // R: thu kiếm sát hông, người hạ thấp (bạt đao)
  'HNC_R_THU',   'tor:40,-46 head:-30,44 aR:-20,0,40 fR:-60 w:-150 aL:-40,0,-10 fL:-90 lR:-84,0,-12 sR:112 lL:56,0,12 sL:56 ao:30',
];

// ---------------------------------------------------------------- tiện ích clip
function Mv(k, ...a) { const s = []; for (let i = 0; i + 2 < a.length; i += 3) s.push(+a[i].toFixed(3) + ' ' + +(a[i + 1] * k).toFixed(3) + ' ' + +(a[i + 2] * k).toFixed(3) + ' o'); return s.join('; '); }
function Clip(ten, khoa, mv, ex, huy) { return DK.clip(ten, khoa, mv || null, huy != null ? { huy } : null, ex || null); }

// ================================================================ TRĂNG KHUYẾT DÀY (hình dấu ấn chung của bộ)
// Hình học: dải cung trong mặt phẳng cục bộ xy — dây cung theo +x, bụng trăng (mép cắt) theo +y, tâm hình ở gốc.
// Bề dày lớn nhất ở giữa, vuốt nhọn hai đầu; hai mũi trăng lùi về −z một đoạn `quet` (nhìn nghiêng vẫn có khối).
// Một dải = vùng [k0..k1] của bề dày (0 = mép cắt ngoài, 1 = mép trong; âm = ra ngoài mép, dùng cho quầng).
const _geo = {};
function geoDai(R, goc, day, quet, k0, k1) {
  const key = [R, goc, day, quet, k0, k1].map(x => (+x).toFixed(3)).join('_'); if (_geo[key]) return _geo[key];
  const n = 48, P = [], C = [], I = [], yOff = R * (1 + Math.cos(goc * D / 2)) / 2;
  for (let i = 0; i <= n; i++) {
    const s = i / n, a = (-goc / 2 + goc * s) * D, sn = Math.sin(Math.PI * s), p = Math.pow(sn, .6), z = -quet * (1 - sn);
    for (const k of [k0, k1]) { const r = R - day * Math.max(p, .015) * k; P.push(Math.sin(a) * r, Math.cos(a) * r - yOff, z); C.push(1, 1, 1, Math.min(1, Math.pow(sn, .5) * 1.5)); }
    if (i < n) { const b = i * 2; I.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
  }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('color', new T.Float32BufferAttribute(C, 4)); g.setIndex(I);
  g.giu = true; g.soChiSo = I.length; return (_geo[key] = g);
}
const matDai = (mau, cong, op) => new T.MeshBasicMaterial({ color: mau, vertexColors: true, transparent: true, opacity: op, depthWrite: false, side: T.DoubleSide, blending: cong ? T.AdditiveBlending : T.NormalBlending, toneMapped: !cong, fog: false });
/**
 * taoTrang({ R, goc, day, quet, mau, sang, muc }) → { g (Group thế giới), datMo(a), datLo(f 0..1 hiện dần từ một mũi), truc(daycung, bung), bay(h, roll, lean) }
 *   lớp: mực đặc · quầng máu · viền máu HDR (mép cắt) · chỉ lửa trắng hồng · chỉ máu mép trong
 */
function taoTrang(op = {}) {
  const R = op.R || 2, goc = op.goc || 150, day = op.day != null ? op.day : R * .38, quet = op.quet != null ? op.quet : R * .22;
  const mau = (op.mau || DO).clone(), sang = op.sang || 1;
  const g = new T.Group(); const L = [];
  const lop = (k0, k1, m, ro) => { const me = new T.Mesh(geoDai(R, goc, day, quet, k0, k1), m); me.renderOrder = ro; me.frustumCulled = false; g.add(me); L.push({ me, a0: m.opacity }); };
  // mực vẽ SAU các lớp sáng ⇒ thân trăng đen đặc, viền máu chỉ lộ ở mép cắt bên ngoài
  lop(-.4, .1, matDai(mau.clone().multiplyScalar(.7 * sang), true, .08), 5);
  lop(-.2, .12, matDai(mau.clone().multiplyScalar(1.8 * sang), true, 1), 6);
  lop(-.07, .05, matDai(NONG.clone().multiplyScalar(1.7 * sang), true, .8), 7);
  if (op.muc !== false) lop(.06, 1, matDai(MUC, false, .96), 8);
  lop(.94, 1.04, matDai(mau.clone().multiplyScalar(1.4 * sang), true, .45), 9);
  const t = {
    g, R, goc, day,
    datMo(a) { for (const l of L) l.me.material.opacity = l.a0 * a; },
    /** hiện dần theo chiều vung kiếm: nguoc = bắt đầu từ mũi +x (mặc định từ mũi −x) */
    datLo(f, nguoc) { for (const l of L) { const n = l.me.geometry.soChiSo / 6, k = Math.max(0, Math.round(n * clamp(f, 0, 1))); l.me.geometry.setDrawRange(nguoc ? (n - k) * 6 : 0, k * 6); } },
    /** trục dây cung (thế giới) — để so với hướng mũi kiếm */
    trucX() { return new V3(1, 0, 0).applyQuaternion(g.quaternion); },
    /** đặt hướng: dây cung theo `x`, bụng trăng (mép cắt) theo `y` (thế giới) */
    truc(x, y) { const X = x.clone().normalize(), Y = y.clone().addScaledVector(X, -y.dot(X)).normalize(), Z = new V3().crossVectors(X, Y); g.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(X, Y, Z)); },
    /** đặt theo hướng bay h: roll (độ) nghiêng theo nhát chém quanh h; lean (độ) ngả bụng trăng về phía trước (0 = dựng mặt về máy, 90 = nằm) */
    bay(h, roll, lean) {
      const f = h.clone().normalize(); let s = new V3().crossVectors(LEN, f); if (s.lengthSq() < 1e-4) s.set(1, 0, 0); s.normalize(); const u = new V3().crossVectors(f, s);
      const r = (roll || 0) * D, l = (lean || 0) * D;
      const x = s.clone().multiplyScalar(Math.cos(r)).addScaledVector(u, Math.sin(r)), b0 = s.clone().multiplyScalar(-Math.sin(r)).addScaledVector(u, Math.cos(r));
      t.truc(x, b0.multiplyScalar(Math.cos(l)).addScaledVector(f, Math.sin(l)));
    },
  };
  // drawRange dùng chung hình học (đã cache) ⇒ mỗi trăng nhân bản hình học riêng khi cần hiện dần
  if (op.loDan) for (const l of L) { const gg = l.me.geometry.clone(); gg.soChiSo = l.me.geometry.soChiSo; l.me.geometry = gg; }
  return t;
}
/** trăng đứng yên (nhát chém đọng, dấu bổ): hiện dần theo nhát (hien s), giữ, tan. op { pos, truc:[x,y] | bay:[h,roll,lean], song, hien, gian, chim (m/s lún xuống) } */
function trangDong(op) {
  const t = taoTrang(Object.assign({ loDan: !!op.hien }, op));
  t.g.position.copy(op.pos);
  if (op.truc) t.truc(op.truc[0], op.truc[1]); else t.bay(op.bay[0], op.bay[1], op.bay[2]);
  const song = op.song || .45, hien = op.hien || 0, mo = op.mo || 1, gian = op.gian != null ? op.gian : .12;
  if (hien) t.datLo(0, op.nguoc);
  return vfx.them(t.g, song, (dt, u, tt) => {
    if (hien) t.datLo(tt / hien, op.nguoc);
    t.g.scale.setScalar((hien ? 1 : .8 + .2 * Math.min(1, tt / .05)) * (1 + u * gian));
    if (op.chim) t.g.position.y -= op.chim * dt;
    t.datMo(mo * (1 - sm((u - .55) / .45)));
  });
}

// ================================================================ VỆT CHÉM DÀY (theo màu thanh kiếm) — kiếm khí kéo dài quá mũi
function mauKiem(c) { return c.ctx.mau ? c.ctx.mau.clone() : new T.Color(c.nv.vk ? c.nv.vk.mau_hex : '#ffffff'); }
/** vetChem(nv, ghi, { mau, k0, k1 (bội số chiều dài kiếm tính từ chuôi), tan }) — dải mực + viền màu kiếm HDR + chỉ sáng mép ngoài */
function vetChem(nv, ghi, op = {}) {
  const N = 40, mau = op.mau || new T.Color(1, 1, 1), k0 = op.k0 != null ? op.k0 : .35, k1 = op.k1 || 1.9, tan = op.tan || .26;
  const ds = [], ca = new V3(), mb = new V3(), g = new T.Group(), lop = [];
  const mk = (cc, cong, al, a, b) => {
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(new Float32Array(N * 6), 3)); geo.setAttribute('color', new T.BufferAttribute(new Float32Array(N * 8), 4));
    const I = []; for (let i = 0; i < N - 1; i++) { const k = i * 2; I.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } geo.setIndex(I);
    const m = new T.Mesh(geo, new T.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: T.DoubleSide, blending: cong ? T.AdditiveBlending : T.NormalBlending, toneMapped: !cong }));
    m.frustumCulled = false; m.renderOrder = cong ? 7 : 8; g.add(m); lop.push({ geo, cc, al, a, b });
  };
  // 2026-11-17 — giảm chói (người dùng chê ánh trắng): viền màu kiếm dịu, không pha trắng
  mk(mau.clone().multiplyScalar(1.0), true, .55, .8, 1);
  mk(mau.clone().multiplyScalar(1.2), true, .5, .95, 1.01);
  mk(MUC, false, .85, 0, .86);
  const _a = new V3(), _b = new V3();
  return vfx.them(g, ghi + tan + .05, (dt, u, t) => {
    if (t <= ghi + 1e-4) {
      nv.can(ca); nv.mui(mb); const d = mb.clone().sub(ca);
      const s = { a: ca.clone().addScaledVector(d, k0), b: ca.clone().addScaledVector(d, k1), t };
      // nội suy giữa hai mẫu để cung tròn trịa
      if (ds.length) { const p = ds[0]; for (let j = 1; j <= 2; j++) { const x = j / 3; ds.unshift({ a: p.a.clone().lerp(s.a, x), b: p.b.clone().lerp(s.b, x), t: p.t + (t - p.t) * x }); } }
      ds.unshift(s); while (ds.length > N) ds.pop();
    }
    const n = ds.length; if (n < 2) return;
    for (const L of lop) {
      const P = L.geo.attributes.position.array, C = L.geo.attributes.color.array;
      for (let i = 0; i < N; i++) {
        const s = ds[Math.min(i, n - 1)], tuoi = clamp(1 - (t - s.t) / tan, 0, 1), v = i / Math.max(1, n - 1);
        const al = i < n ? L.al * tuoi * Math.pow(Math.max(0, 1 - v), .7) : 0;
        _a.lerpVectors(s.a, s.b, L.a); _b.lerpVectors(s.a, s.b, L.b);
        P.set([_a.x, _a.y, _a.z, _b.x, _b.y, _b.z], i * 6);
        C.set([L.cc.r, L.cc.g, L.cc.b, al * .5, L.cc.r, L.cc.g, L.cc.b, al], i * 8);
      }
      L.geo.attributes.position.needsUpdate = L.geo.attributes.color.needsUpdate = true;
    }
  });
}

// ================================================================ NÉT CHÉM ĐỌNG (dấu X trên thân địch, dấu trúng)
/** netChem(tam, huong (dọc nét), phap (pháp tuyến mặt phẳng, thường hướng về máy), { dai, rong, cong, mau, song, hien, tach }) */
function netChem(tam, huong, phap, op = {}) {
  const dai = op.dai || 2.4, rong = op.rong || .36, cong = op.cong != null ? op.cong : .18, n = 24, song = op.song || .7, hien = op.hien || .05;
  // 2026-11-17 — nét hiện dần CÙNG CHIỀU vung kiếm: op.vung (chuyển động mũi kiếm) chiếu lên mặt phẳng nét
  let d = huong.clone().normalize();
  if (op.vung) { const v = op.vung.clone(); v.addScaledVector(phap, -v.dot(phap)); if (v.lengthSq() > 1e-5) d = v.normalize(); }
  const nn = new V3().crossVectors(phap, d).normalize();   // nn: bề ngang nét (trong mặt phẳng)
  const g = new T.Group(); const L = [];
  const lop = (w, mau, cong2, al, ro) => {
    const P = [], C = [], I = [];
    for (let i = 0; i <= n; i++) {
      const s = i / n * 2 - 1, b = Math.pow(1 - s * s, .75), dong = cong * (1 - s * s);
      for (const sg of [-1, 1]) { const p = d.clone().multiplyScalar(s * dai / 2).addScaledVector(nn, dong + sg * w * rong * .5 * b); P.push(p.x, p.y, p.z); C.push(1, 1, 1, Math.min(1, b * 1.4)); }
      if (i < n) { const k = i * 2; I.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(P, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(C, 4)); geo.setIndex(I);
    const m = new T.Mesh(geo, matDai(mau, cong2, al)); m.renderOrder = ro; m.frustumCulled = false; g.add(m); L.push({ m, al, I: I.length });
  };
  const mau = (op.mau || DO).clone();
  lop(1.7, mau.clone().multiplyScalar(.8), true, .1, 9);
  lop(1, MUC, false, .96, 10);
  lop(.3, mau.clone().multiplyScalar(1.8), true, 1, 11);
  lop(.08, NONG.clone().multiplyScalar(1.7), true, .85, 12);
  g.position.copy(tam);
  const x = vfx.them(g, song, (dt, u, t) => {
    const lo = clamp(t / hien, 0, 1); for (const l of L) l.m.geometry.setDrawRange(0, Math.round(l.I / 6 * lo) * 6);
    const tan = sm((u - .6) / .4), k = 1 - tan;
    for (const l of L) l.m.material.opacity = l.al * k;
    if (op.tach && u > .55) g.position.copy(tam).addScaledVector(nn, op.tach * sm((u - .55) / .45));
  });
  x.g = g; x.ngang = nn; return x;
}

// ================================================================ HẠT, ẢNH MỰC, RẠN ĐỎ, TRĂNG MÁU, KIẾM THẬT
function bui(p, r, so) { for (let i = 0; i < so; i++) { const a = Math.random() * Math.PI * 2, d = new V3(Math.cos(a), 0, Math.sin(a)); const pp = p.clone().addScaledVector(d, r * rr(.2, 1)); pp.y = dia.cao(pp.x, pp.z) + .06; vfx.hat(pp, { so: 1, mau: Math.random() < .75 ? new T.Color(.32, .3, .29) : MUC, toc: rr(2, 5), huong: d.clone().add(new V3(0, rr(.4, 1.2), 0)), loe: .2, co: rr(.09, .17), song: rr(.5, 1), trongLuc: 16, can: 1.2, to: true }); } }
/** máu bắn: ít mà to (khối máu sáng + khối mực) */
function noMau(p, h, so, toc) { vfx.hat(p, { so, mau: doS(2), toc, huong: h, loe: .55, co: .11, song: .5, trongLuc: 12, can: 1.6 }); vfx.hat(p, { so: Math.ceil(so * .5), mau: MUC, toc: toc * .7, huong: h, loe: .7, co: .14, song: .6, trongLuc: 16, can: 1.4, to: true }); }

/** ảnh mực (bóng người đọng): bản chụp tư thế hiện tại, lõi mực + viền máu */
function anhMuc(nv, op = {}) {
  const g = new T.Group();
  const mat = new T.MeshBasicMaterial({ color: op.mau || new T.Color(.05, .01, .02), transparent: true, opacity: op.op != null ? op.op : .85, depthWrite: false });
  const vien = new T.MeshBasicMaterial({ color: doS(1.1), transparent: true, opacity: .12, blending: T.AdditiveBlending, depthWrite: false, side: T.BackSide, toneMapped: false });
  nv.root.updateMatrixWorld(true);
  nv.root.traverse(o => { if (o.isMesh && o.visible && o.geometry && !(o.material && o.material.blending === T.AdditiveBlending)) { o.geometry.giu = true; const m = new T.Mesh(o.geometry, mat); o.matrixWorld.decompose(m.position, m.quaternion, m.scale); g.add(m); if (op.vien) { const m2 = new T.Mesh(o.geometry, vien); m2.position.copy(m.position); m2.quaternion.copy(m.quaternion); m2.scale.copy(m.scale).multiplyScalar(1.12); g.add(m2); } } });
  g.datMo = a => { mat.opacity = (op.op != null ? op.op : .85) * a; vien.opacity = .12 * a; };
  return g;
}
function anhTuThe(nv, tt, pos, yaw, op) {
  const p0 = nv.pos.clone(), y0 = nv.yaw, t0 = Float32Array.from(nv.tuThe);
  if (DK.TT[tt]) nv.tuThe.set(DK.TT[tt]); nv.pos.copy(pos); nv.yaw = yaw; nv.apDung();
  const g = anhMuc(nv, op);
  nv.pos.copy(p0); nv.yaw = y0; nv.tuThe.set(t0); nv.apDung();
  return g;
}

/** rạn đỏ: rãnh xẻ đất + vạch máu sáng trong rãnh (dày, đọc được từ xa) */
function ranDo(a, b, op = {}) {
  a = a.clone().setY(0); b = b.clone().setY(0);
  dia.ranh(a, b, op.rong || .4, op.sau || .3, { mau: DO_DAM });
  const d = b.clone().sub(a); const L = d.length() || .01; d.divideScalar(L); const ng = new V3(-d.z, 0, d.x);
  const n = Math.max(4, Math.round(L / .5)), P = []; let pr = a.clone(), w0 = op.w || .14, wPr = w0;
  for (let i = 1; i <= n; i++) {
    const q = a.clone().addScaledVector(d, L * i / n).addScaledVector(ng, i < n ? rr(-.12, .12) : 0), w = w0 * (1 - i / n * .6);
    const y0 = dia.cao(pr.x, pr.z) + .03, y1 = dia.cao(q.x, q.z) + .03;
    P.push(pr.x + ng.x * wPr, y0, pr.z + ng.z * wPr, pr.x - ng.x * wPr, y0, pr.z - ng.z * wPr, q.x - ng.x * w, y1, q.z - ng.z * w,
      pr.x + ng.x * wPr, y0, pr.z + ng.z * wPr, q.x - ng.x * w, y1, q.z - ng.z * w, q.x + ng.x * w, y1, q.z + ng.z * w);
    pr = q; wPr = w;
  }
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(P, 3));
  const mat = new T.MeshBasicMaterial({ color: doS(2.6), transparent: true, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 });
  const m = new T.Mesh(geo, mat); m.renderOrder = 3;
  const song = op.song || 3, tre = op.tre || 0;
  return vfx.them(m, song + tre, (dt, u, t) => { mat.opacity = t < tre ? 0 : Math.min(1, (t - tre) / .1) * (1 - sm((t - tre - song * .4) / (song * .6))); });
}
function catVong(tam, r, rong) { const n = 14; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, b = (i + 1) / n * Math.PI * 2; dia.cat(new V3(tam.x + Math.cos(a) * r, 0, tam.z + Math.sin(a) * r), new V3(tam.x + Math.cos(b) * r, 0, tam.z + Math.sin(b) * r), rong || .5); } }

/** phi kiếm mực–máu (kiếm thật): thép tối, rãnh máu sáng, tua đỏ */
const KIEM_OP = { kieu: 'rong', kim: 0xb8b0b4, chuoi: 0x160a0c, chan: 0x6a1420, tua: 0x9a0c1c };
function kiemMau(co, song, vet) { return vfx.phiKiem(Object.assign({ dai: .95, co: co || 1, mau: DO.clone().multiplyScalar(.6), sang: .5, quang: false, kieu: 'rong', vet: vet !== false, song: song || 6 }, KIEM_OP)); }
/** đặt phi kiếm: mũi theo dir, MẶT LƯỠI quay về máy quay (không bị nhìn cạnh thành que) */
function datKiem(k, pos, dir) {
  const z = dir.clone().normalize(), v = DK.cam.position.clone().sub(pos); let y = v.addScaledVector(z, -v.dot(z)); if (y.lengthSq() < 1e-6) y = new V3(0, 1, 0); y.normalize();
  const x = new V3().crossVectors(y, z); k.o.position.copy(pos); k.o.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(x, y, z));
}

// ================================================================ BỘ CHẠY MỘT LẦN RA ĐÒN
function Ch(ctx) {
  const nv = ctx.nv, c = { ctx, nv, dich: ctx.dich, tang: ctx.tang || 1, nhanh: ctx.nhanh || null, t0: DK.now };
  c.T = () => DK.now - c.t0;
  c.hen = (t, fn) => DK.sau(Math.max(0, t - c.T()), () => { try { fn(); } catch (e) { console.error(e); DK.baoLoi(e); } });
  c.lap = fn => DK.lap((dt) => { try { return fn(c.T(), dt); } catch (e) { console.error(e); DK.baoLoi(e); return false; } });
  c.neo = () => { c.np = nv.pos.clone(); c.ny = nv.yaw; };
  c.neo();
  c.f = () => new V3(Math.sin(c.ny), 0, Math.cos(c.ny));
  c.r = () => new V3(-Math.cos(c.ny), 0, Math.sin(c.ny));
  c.LN = (x, y, z) => c.np.clone().addScaledVector(c.r(), x).addScaledVector(c.f(), z).add(new V3(0, y, 0));
  c.kc = () => c.dich ? Math.hypot(c.dich.pos.x - nv.pos.x, c.dich.pos.z - nv.pos.z) : 99;
  c.quay = (xa) => { if (c.dich && c.kc() < (xa || 40)) nv.ngam(c.dich.pos); c.neo(); };
  c.coDich = xa => !!c.dich && c.kc() <= (xa || 30);
  /** 2026-11-17 — đích cho trăng bay: mục tiêu đang khoá; không khoá thì bù nhìn gần nhất PHÍA TRƯỚC; không có ai ⇒ null (bay theo hướng mặt) */
  c.chonDich = (xa = 40) => {
    let d = DK.khoa && DK.khoa !== nv ? DK.khoa : null;
    if (d && Math.hypot(d.pos.x - nv.pos.x, d.pos.z - nv.pos.z) > xa) d = null;
    if (!d) { const f0 = nv.toi(); let bd = xa; for (const b of DK.dsBuNhin) { const v = new V3(b.pos.x - nv.pos.x, 0, b.pos.z - nv.pos.z), l = v.length(); if (l > .1 && l < bd && v.dot(f0) / l > .2) { bd = l; d = b; } } }
    c.dich = d; return d;
  };
  c.dichChan = xa => c.coDich(xa) ? c.dich.pos.clone().setY(0) : c.LN(0, 0, 6).setY(0);
  c.huongDich = () => { if (!c.dich) return nv.toi(); const d = new V3().subVectors(c.dich.pos, nv.pos); d.y = 0; return d.lengthSq() > 1e-4 ? d.normalize() : nv.toi(); };
  c.phat = (clip, tron, op) => DK.phat(nv, clip, Object.assign({ tron }, op || {}));
  c.mau = mauKiem(c);
  // 2026-11-17 — theo dõi mũi kiếm: hướng vung thật để kiếm khí/nét chém hiện cùng chiều nhát chém
  c._mui = []; DK.lap(() => { c._mui.unshift(nv.mui()); if (c._mui.length > 4) c._mui.length = 4; return DK.now - c.t0 < 5; });
  c.vMui = () => { const m = c._mui; if (m.length < 2) return nv.toi(); const v = m[0].clone().sub(m[Math.min(2, m.length - 1)]); return v.lengthSq() > 1e-6 ? v : nv.toi(); };
  /** vệt chém: vệt game (móc +N vũ khí) + kiếm khí dày kéo quá mũi theo màu thanh kiếm */
  c.vet = (song, op = {}) => { if (op.game) vfx.vet(nv, { kieu: 'muc', song, tan: op.tan || .26, rong: .9 }); return vetChem(nv, song, { mau: c.mau, k1: op.k1 || 1.9, tan: op.tan || .26 }); };
  c.an = b => { nv.root.visible = !b; if (nv.kiemThat && nv.kiemThat.tua) nv.kiemThat.tua.forEach(d => d.m.visible = !b); };
  const ch = ctx.ch; let st = ch ? ch.sat_thuong * (((ch.he_so_tang || [])[c.tang - 1]) || 1) : 0;
  c.nh = ch && c.nhanh && ch.nhanh ? ch.nhanh.find(x => x.ma === c.nhanh) : null; if (c.nh && c.nh.so_mod) st *= c.nh.so_mod.he_so || 1;
  c.st = st;
  c.tt = c.tang >= 2 && ch ? 'Ma nhiễm' : null;
  return c;
}
DK.nghe('datLai', () => { const nv = DK.nc; nv.root.visible = true; if (nv.kiemThat && nv.kiemThat.tua) nv.kiemThat.tua.forEach(d => d.m.visible = true); vfx.trong(nv, 1); nv._anHN = 0; nv.treo = false; });

/** trúng: máu bắn to + một nét chém đọng trên thân; op { huong, nang 0..3, menh, tt, day, hat, hut, khongNet } */
function danhTrung(c, ds, st, op = {}) {
  for (const b of ds) {
    let s = st;
    if (c.nv._anHN && DK.now < c.nv._anHN) { s *= 1.5; c.nv._anHN = 0; vfx.trong(c.nv, 1); DK.chuNoi('Ám kích ×1,5', b.diem('dau').add(new V3(0, .9, 0)), '#ff8a9a'); }
    const menh = op.menh && b.mau / b.mauMax < op.menh;
    if (menh) { DK.chuNoi('ĐOẠN MỆNH', b.diem('dau').add(new V3(0, 1.1, 0)), '#ff1f33'); s = 99999; }
    let h = op.huong ? op.huong.clone() : new V3().subVectors(b.pos, c.nv.pos).setY(0); if (h.lengthSq() < 1e-5) h.copy(c.nv.toi()); h.normalize();
    DK.trung(b, { nguon: c.nv, st: Math.round(s), day: op.day != null ? op.day : .35, hat: op.hat || 0, mau: DO, trangThai: op.tt || undefined });
    const p = ngucCua(b), nang = op.nang || 0;
    noMau(p, h.clone().add(new V3(0, .35, 0)), 6 + nang * 4, 5 + nang * 1.5);
    if (!op.khongNet) {
      const phap = new V3().subVectors(DK.cam.position, p).normalize(), doc = new V3(rr(-1, 1), rr(-1, 1), 0); const d = new V3().crossVectors(phap, LEN).multiplyScalar(doc.x).add(LEN.clone().multiplyScalar(doc.y)).normalize();
      netChem(p.clone().addScaledVector(phap, .3), d, phap, { dai: 1.1 + nang * .35, rong: .2 + nang * .05, song: .3, hien: .03 });
    }
    if (op.hut) { const n = Math.round(s * op.hut); for (let k = 0; k < 8; k++) c.hen(c.T() + k * .03, () => { const tu = ngucCua(b), den = c.nv.diem('nguc'), v = den.clone().sub(tu); vfx.hat(tu, { so: 2, mau: doS(1.8), toc: v.length() / .35, huong: v, loe: .15, co: .09, song: .35, trongLuc: 0, can: 0 }); }); c.hen(c.T() + .35, () => DK.chuNoi('+' + n, c.nv.diem('dau').add(new V3(0, .7, 0)), '#ff7a8a')); }
    DK.rung(.1 + nang * .05, .22);
  }
  return ds.length;
}
const trungQuat = (c, r, goc, st, op) => danhTrung(c, goc >= 360 ? DK.trongTron(c.nv.pos, r) : DK.trongNon(c.nv, r, goc), st, op);

/**
 * phóng trăng bay: op { pos, huong, toc, tam, R, goc, day, roll, lean, st, xuyen, quaDat, dich, duoi, cat, ranh:[rong,sau], pha, gio,
 *   bong (số bóng đuổi), lon (to dần tới ×), mo, sang, nang, menh, tt, hut, khiToi(pos), khiTrung(b) }
 */
function phongTrang(c, op) {
  const toc = op.toc || 20, tam = op.tam || 20, roll = op.roll || 0, lean = op.lean || 0, mo = op.mo || 1;
  const nBong = op.bong != null ? op.bong : 2;
  const ds = []; for (let i = 0; i <= nBong; i++) ds.push(taoTrang({ R: op.R || 2, goc: op.goc, day: op.day, quet: op.quet != null ? op.quet : ((op.lean || 0) >= 60 ? 0 : undefined), sang: op.sang, mau: op.mau, loDan: !!op.vung }));
  let nguoc = false; const hien = op.hien || .08;
  const G = new T.Group(); ds.forEach(t => G.add(t.g));
  const pos = op.pos.clone(), vel = op.huong.clone().normalize().multiplyScalar(toc), thu = new Set(), lich = [];
  const R = op.R || 2, rHit = op.rHit || R * .95, lon = op.lon || 1.25;
  let di = 0, ket = -1, mocCat = pos.clone(), mocRanh = null, mocPha = -9;
  const ketThuc = (tt) => { if (ket >= 0) return; ket = tt; if (op.khiToi) op.khiToi(pos.clone()); };
  const datHinh = (tt) => {
    lich.unshift(pos.clone()); if (lich.length > 12) lich.pop();
    const h = vel.clone().normalize(), sc = (.55 + .45 * Math.min(1, tt / .07)) * (1 + (lon - 1) * Math.min(1, di / tam));
    ds.forEach((t, i) => {
      const p = lich[Math.min(lich.length - 1, i * 3)]; t.g.position.copy(p); t.bay(h, roll, lean); t.g.scale.setScalar(sc * (1 - i * .06));
      const tan = ket >= 0 ? Math.max(0, 1 - (tt - ket) / .18) : 1;
      t.datMo(mo * tan * (i ? .4 / i : 1) * (i && ket < 0 && lich.length < 4 ? 0 : 1));
      if (op.vung) t.datLo(tt / hien, nguoc);
    });
  };
  datHinh(0);
  if (op.vung) { nguoc = ds[0].trucX().dot(op.vung) < 0; ds.forEach(t => t.datLo(0, nguoc)); }
  return vfx.them(G, tam / toc + 1.5, (dt, u, tt) => {
    if (ket >= 0) { pos.addScaledVector(vel, dt * .3); datHinh(tt); ds.forEach(t => t.g.scale.multiplyScalar(1 + (tt - ket) * 1.5)); return tt - ket < .18; }
    if (op.dich && op.duoi) { const muc = ngucCua(op.dich).sub(pos); if (muc.lengthSq() > .5) { muc.normalize(); const v = vel.clone().normalize(), a = v.angleTo(muc); if (a > 1e-4) { v.lerp(muc, Math.min(1, op.duoi * dt / a)).normalize(); vel.copy(v.multiplyScalar(toc)); } } }
    pos.addScaledVector(vel, dt); di += toc * dt; datHinh(tt);
    const cao = dia.cao(pos.x, pos.z), yDat = pos.y - cao;
    if (op.cat && yDat < 2.2 && pos.distanceToSquared(mocCat) > .5) { dia.cat(mocCat, pos, R * .6); mocCat.copy(pos); }
    if (op.ranh && yDat < 2) { if (!mocRanh) mocRanh = pos.clone(); else if (pos.distanceToSquared(mocRanh) > 2.2) { ranDo(mocRanh, pos, { rong: op.ranh[0], sau: op.ranh[1], w: op.ranh[0] * .35, song: 3 }); mocRanh.copy(pos); } }
    if (op.pha && di - mocPha > 1.5) { mocPha = di; const g0 = pos.clone().setY(0); dia.pha(g0, op.pha); if (op.gio) dia.gio(g0, op.pha * 1.6, .8); }
    if (op.st) for (const b of DK.dsBuNhin) {
      if (thu.has(b)) continue; const n = ngucCua(b), dd = n.clone().sub(pos), h = vel.clone().normalize(), doc = dd.dot(h);
      if (Math.abs(doc) > 1 || dd.addScaledVector(h, -doc).length() > rHit) continue;
      thu.add(b); danhTrung(c, [b], op.st, { huong: vel.clone().setY(0), nang: op.nang || 0, menh: op.menh, tt: op.tt, day: op.dayLui, hat: op.hat || 0, hut: op.hut });
      if (op.khiTrung) op.khiTrung(b, pos.clone());
      if (!op.xuyen) { ketThuc(tt); return; }
    }
    if (di >= tam || (!op.quaDat && yDat < -.2)) ketThuc(tt);
  });
}

/** nhảy điều khiển độ cao (treo): A → B, đỉnh H ở tDinh, chạm đất ở t1 */
function boNhay(c, A, B, H, t0, tDinh, t1) {
  const nv = c.nv;
  c.lap((t) => {
    if (t < t0) return true;
    nv.treo = true; nv.datDat = false; nv.vy = 0;
    const x = clamp((t - t0) / (t1 - t0), 0, 1), xd = (tDinh - t0) / (t1 - t0);
    const h = x < xd ? H * (1 - Math.pow(1 - x / xd, 2.2)) : H * (1 - Math.pow((x - xd) / (1 - xd), 2.6));
    const s = sm(x);
    nv.pos.set(A.x + (B.x - A.x) * s, Math.max(0, h), A.z + (B.z - A.z) * s);
    if (x >= 1) { nv.pos.y = 0; nv.treo = false; nv.datDat = true; return false; }
    return true;
  });
}

// ================================================================ ĐÒN THƯỜNG 7 NHÁT — nhịp nặng kiểu Epic Fight
// mỗi nhát: k khoá, mv, ex, huy, vet [t, dài, k1], tr [[t, st, r, góc, nặng, đẩy, hất]]
const NHAT = [
  { // 1 chém chéo bổ xuống
    k: '0 HNC_N3_W · .2 HNC_N3_W h · .27 HNC_N3_S s · .42 HNC_N3_G o · .72 HNC_THU io', mv: [0, 0, 0, .2, 0, -.08, .3, 0, .7], huy: .42, vet: [.19, .12], tr: [[.26, 58, 2.6, 150, 0, .3]] },
  { // 2 chém ngược hất lên
    k: '0 HNC_N2_W · .17 HNC_N2_W h · .23 HNC_N2_S s · .38 HNC_N2_G o · .68 HNC_THU io', mv: [0, 0, 0, .17, 0, 0, .26, 0, .6], huy: .38, vet: [.16, .11], tr: [[.22, 58, 2.6, 150, 0, .15, 1.6]] },   // 2026-11-17 — hất: đích bay lên
  { // 3 xoay người một vòng chém ngang
    k: '0 HNC_N5_W · .15 HNC_N5_W h · .19 HNC_N5_S o · .44 HNC_N5_S h · .5 HNC_N1_G s · .8 HNC_THU io', mv: [0, 0, 0, .15, 0, 0, .44, 0, .9], ex: { xoay: [.15, .44, 360] }, huy: .5, vet: [.15, .3, 2.1], tr: [[.3, 72, 2.9, 360, 1, .4]] },
  { // 4 đâm lướt
    k: '0 HNC_N4_W · .2 HNC_N4_W h · .25 HNC_N4_S s · .42 HNC_N4_G o · .74 HNC_THU io', mv: [0, 0, 0, .2, 0, -.18, .29, 0, 1.6], huy: .42, vet: [.21, .08], tr: [[.26, 88, 3.6, 40, 1, .6]], dam: true },
  { // 5 chém ngang rồi xoay lưng chém vòng ngược
    k: '0 HNC_N1_W · .17 HNC_N1_W h · .22 HNC_N1_S s · .3 HNC_N1_G o · .34 HNC_N5_W io · .4 HNC_N5_S o · .6 HNC_N5_S h · .66 HNC_N1_G s · .92 HNC_THU io', mv: [0, 0, 0, .17, 0, 0, .3, 0, .5, .6, 0, 1.0], ex: { xoay: [.34, .6, 360] }, huy: .62, vet: [.16, .45, 2.1], tr: [[.22, 40, 2.6, 150, 0, .2], [.5, 48, 2.9, 360, 1, .4]] },
  { // 6 bổ dọc MỘT TAY (nặng) — dấu trăng bổ + nứt đất
    k: '0 HNC_N6_V · .12 HNC_N6_W io · .26 HNC_N6_W h · .34 HNC_BO_M sin · .4 HNC_BO_S s · .62 HNC_BO_G o · .74 HNC_BO_G h · 1.06 HNC_THU io', mv: [0, 0, 0, .24, 0, .1, .4, 0, .8], huy: .66, vet: [.3, .13, 2.2], tr: [[.4, 95, 2.9, 70, 2, .6]], bo: true },
  { // 7 nhảy lộn bổ xuống đất — trăng dọc, nứt, sóng đất, khung va chạm
    k: '0 HNC_N7_W · .2 HNC_N7_W h · .3 HNC_N7_LEN o · .5 HNC_N7_DINH o · .6 HNC_N7_DINH h · .66 HNC_N7_BO s · .7 HNC_BO_S s · .98 HNC_BO_G o · 1.3 HNC_THU io', mv: [0, 0, 0, .2, 0, 0, .62, 0, 1.2, .7, 0, 1.7], ex: { lon: [.3, .6, 360], tam: .9 }, huy: .95, vet: [.6, .12, 2.3], tr: [[.7, 150, 3.3, 360, 3, .4, 0]], nhay: true },   // đòn trên không bổ xuống: dồn lực xuống đất, không hất
];
function danh(ctx, i) {
  const c = Ch(ctx), n = NHAT[i], nv = c.nv;
  if (c.dich && c.kc() > 9 && DK.khoa !== c.dich) c.dich = null;
  c.quay(14);
  const k = c.dich ? clamp((c.kc() - 1.3) / Math.max(.5, n.mv[n.mv.length - 1]), .25, 1.15) : 1;
  c.phat(Clip('hnc_c' + (i + 1), n.k, Mv(k, ...n.mv), n.ex, n.huy), .14);
  c.hen(n.vet[0], () => c.vet(n.vet[1], { k1: n.vet[2] || 1.9, tan: n.bo || n.nhay ? .4 : .28, game: true }));
  for (const w of n.tr) c.hen(w[0], () => trungQuat(c, w[2], w[3], w[1], { nang: w[4], day: w[5], hat: w[6] || 0 }));
  if (n.dam) c.hen(.27, () => { const p = nv.mui(), f = nv.toi(); netChem(p.clone().addScaledVector(f, .9), f, LEN, { dai: 2.6, rong: .3, cong: 0, mau: c.mau, song: .3, hien: .04 }); vfx.vong(p, { bk0: .1, bk1: 1.1, day: .16, song: .22, mau: c.mau.clone().multiplyScalar(1.6), phap: f }); });
  if (n.bo) c.hen(.4, () => {
    const p = c.LN(0, 0, 2.0 * k + .3).setY(0);
    dia.nut(p, { r: 2.4, nhanh: 4, mau: DO, song: 2.2, rong: .16 }); ranDo(c.LN(0, 0, .9), c.LN(0, 0, 3.8 * Math.max(.6, k)), { rong: .26, sau: .18, w: .1, song: 1.8 });
    dia.vun(p, { so: 10, luc: 2.5, len: 4, r: .5 }); bui(p, 1, 10); DK.rung(.2, .25);
  });
  if (n.nhay) {
    c.hen(.2, () => { bui(nv.pos.clone(), .6, 8); dia.gio(nv.pos.clone(), 2, .5); });
    c.hen(.7, () => {
      const p = nv.quanh(0, 0, 1.3).setY(0);
      dia.nut(p, { r: 3.4, nhanh: 7, mau: DO, song: 3, rong: .2 }); dia.ho(p, 1.2, .26, { mau: DO_DAM }); dia.vun(p, { so: 22, luc: 4, len: 6, r: .7 });
      dia.song(p, { r: 4.5, toc: 14, cao: .22 }); dia.gio(p, 4.5, 1.1); bui(p, 1.6, 18);
      DK.rung(.32, .3);
    });
  }
}

// ================================================================ LỘN NÉ — ảnh mực đọng lại chỗ cũ
function lon(ctx) {
  const nv = ctx.nv, c = Ch(ctx), ph = DK.phim;
  let f = 0, r = 0; if (ph.w || ph.ArrowUp) f++; if (ph.s || ph.ArrowDown) f--; if (ph.d || ph.ArrowRight) r++; if (ph.a || ph.ArrowLeft) r--;
  let dir = nv.toi();
  if (f || r) { const fy = DK.may.yaw + Math.PI; dir = new V3(Math.sin(fy) * f - Math.cos(fy) * r, 0, Math.cos(fy) * f + Math.sin(fy) * r).normalize(); }
  const g = anhMuc(nv, { op: .6 }); vfx.them(g, .45, (dt, u) => g.datMo(1 - u));
  bui(nv.pos.clone(), .5, 8); dia.gio(nv.pos.clone(), 1.6, .5);
  if (nv.toi().dot(dir) > .5) {
    nv.yaw = Math.atan2(dir.x, dir.z); c.neo();
    c.phat(Clip('hnc_lon', '0 HNC_THU · .05 HNC_LON o · .3 HNC_LON h · .36 HNC_DAP s · .5 HNC_DAP h · .72 HNC_THU io', '0 0 0 o; .33 0 3.2 o', { lon: [.03, .33, 360], tam: 1.0 }), .04);
  } else {
    const tr = nv.phai().dot(dir), lu = nv.toi().dot(dir);
    const ten = lu < -.5 ? 'LUOT_LUI' : tr > 0 ? 'LUOT_PHAI' : 'LUOT_TRAI';
    const s = DL.CLIP[ten], loc = new V3(nv.phai().dot(dir), 0, nv.toi().dot(dir)).multiplyScalar(3.2);
    c.phat(Clip('hnc_' + ten.toLowerCase(), s.k.map(x => x[0] + ' ' + x[1] + ' ' + (['l', 'io', 'o', 's', 'i', 'h', 'oo', 'sin', 'bat'][x[2]] || 'io')).join('; '), '0 0 0 o; .3 ' + loc.x.toFixed(2) + ' ' + loc.z.toFixed(2) + ' o'), .04);
  }
  c.hen(.36, () => { bui(nv.pos.clone(), .6, 10); DK.rung(.07, .25); });
}

// ================================================================ Z — TÀN NGUYỆT PHI TINH
// Dấu ấn: ba trăng khuyết mực dày viền máu, dựng mặt về máy, nghiêng theo ba nhát (ngang · hất · bổ chéo), bay xa.
function Z(c) {
  c.chonDich(); c.quay(); const nv = c.nv, tg = c.tang, truy = c.nhanh === 'truy_tinh', tan = c.nhanh === 'tan_tinh', liet = tg >= 5;
  const k = c.dich ? clamp((c.kc() - 2.8) / 2.4, .2, 1) : 1;
  let khoa = truy
    ? '0 HNC_Z_TU · .22 HNC_Z_TU h · .26 HNC_N2_W io · .32 HNC_N2_S s · .42 HNC_N3_W io · .5 HNC_N3_W h · .56 HNC_N3_S s · .68 HNC_N3_G o · 1.0 HNC_THU io'
    : '0 HNC_Z_TU · .22 HNC_Z_TU h · .26 HNC_N1_W io · .32 HNC_N1_S s · .4 HNC_N2_W io · .48 HNC_N2_S s · .55 HNC_N3_W io · .62 HNC_N3_W h · .68 HNC_N3_S s · .8 HNC_N3_G o · 1.12 HNC_THU io';
  if (liet) khoa = khoa.replace(/ · [.\d]+ HNC_THU io$/, '') + ' · .92 HNC_N7_W io · 1.02 HNC_N7_W h · 1.1 HNC_N7_LEN o · 1.22 HNC_N5_S s · 1.46 HNC_N5_S h · 1.8 HNC_THU io';
  c.phat(Clip('hnc_z' + (truy ? 't' : '') + (liet ? '5' : ''), khoa, Mv(k, 0, 0, 0, .22, 0, -.12, .3, 0, 1.4, .46, 0, 2.0, .6, 0, 2.4), liet ? { xoay: [1.04, 1.22, 360] } : null, liet ? 1.32 : .7), .2);
  // báo: lấy đà — mực rỉ dưới chân, kiếm loé
  c.hen(.04, () => bui(nv.pos.clone(), .5, 6));
  if (liet) c.hen(.03, () => vfx.chu('Tàn Nguyệt Liên Thiên', { mau: '#ff3046', song: 1.4 }));
  // [thời điểm, roll (độ, nghiêng theo nhát), lean, hệ số cỡ]
  // 2026-11-17 — người dùng: trăng phải đi hình khuyết tới đối thủ ⇒ lean 70 (gần 90, ngả 20° cho máy sau lưng thấy mặt): lưng cong (mép cắt) hướng tới, hai mũi chĩa về người chém; roll = góc nhát chém
  const nhat = truy ? [[.32, -35, 70, 1.1, .7], [.56, 50, 70, 1.25, 0]] : [[.32, 6, 70, 1, 0], [.48, -38, 70, 1, .8], [.68, 52, 70, 1.3, 0]];   // [t, roll, lean, cỡ, hất]
  const K = tg >= 4 ? 1.2 : tg >= 2 ? 1.1 : 1;
  nhat.forEach(([t, roll, lean, co, hat], i) => {
    const cuoi = i === nhat.length - 1;
    c.hen(t - .05, () => c.vet(.1, { k1: 1.8 }));
    c.hen(t, () => {
      let h = c.huongDich(); if (c.coDich(30)) { const dy = clamp(c.dich.pos.y - nv.pos.y, -3, 3); h = h.clone().setY(dy / Math.max(2, c.kc())).normalize(); }
      const base = { pos: nv.quanh(0, 1.25, 1.1), huong: h, toc: 14, tam: 20, R: 2.2 * co * K, day: .9 * co * K, roll, lean, st: c.st * (cuoi ? 1.3 : 1), nang: cuoi ? 1 : 0, tt: c.tt, bong: tg >= 2 ? 2 : 1, cat: tg >= 2, xuyen: true, vung: c.vMui(), hat };
      // 2026-11-17 — người dùng bỏ trăng chữ thập: nhát chốt T3+ chỉ MỘT trăng, to và mạnh hơn theo tầng
      if (cuoi && tg >= 3 && !tan) { const kc3 = [1.2, 1.3, 1.4][tg - 3]; Object.assign(base, { R: base.R * kc3, day: base.day * kc3, st: c.st * (1.3 + .2 * (tg - 2)), nang: 2, bong: base.bong + 1, sang: 1.15, lon: 1.35 }); }
      if (tg >= 3) base.khiToi = p => { noMau(p, LEN, 8, 3); vfx.vong(p.clone().setY(dia.cao(p.x, p.z) + .05), { bk0: .3, bk1: 1.8, day: .3, song: .3, mau: doS(1.3) }); };
      if (tg >= 4) {
        base.pos.y = .95; base.huong.y = 0; base.ranh = [.36, .28]; base.pha = 1.4; base.gio = true;
        if (cuoi) { base.ranh = [.5, .4]; }
        base.khiToi = p => { const q = p.clone().setY(0); dia.nut(q, { r: 2, nhanh: 5, mau: DO, song: 2, rong: .16 }); dia.vun(q, { so: 10, luc: 2.5, len: 4 }); noMau(p, LEN, 8, 3); };
      }
      if (truy) Object.assign(base, { dich: c.dich, duoi: 3, toc: 16, tam: 26, pos: nv.quanh(0, 1.5, 1) });
      if (tan) for (const s of [-24, 0, 24]) phongTrang(c, Object.assign({}, base, { huong: xoayY(base.huong, s), R: base.R * .7, day: base.day * .75, tam: base.tam * .8, bong: 0, roll: roll + s * .8 }));
      else phongTrang(c, base);
      DK.rung(.08 + (cuoi ? .06 : 0), .2);
    });
  });
  // Hoá Cảnh: nhảy xoáy, một trăng mực khổng lồ quét cả hành lang
  if (liet) {
    c.hen(1.08, () => { bui(nv.pos.clone(), .8, 10); dia.gio(nv.pos.clone(), 3, .8); });
    c.hen(1.16, () => c.vet(.12, { k1: 2.4, tan: .4 }));
    c.hen(1.22, () => {
      const h = c.huongDich().clone();
      DK.rung(.35, .35);
      phongTrang(c, { vung: c.vMui(), pos: nv.quanh(0, 1.5, 1.4), huong: h, toc: 18, tam: 30, R: 4.6, goc: 160, day: 1.7, roll: 4, lean: 72, quet: 0, st: c.st * 2, nang: 3, xuyen: true, quaDat: true, rHit: 4.4, tt: c.tt, cat: true, pha: 2.8, gio: true, ranh: [.8, .5], bong: 3, lon: 1.15 });
    });
  }
}

// ================================================================ HÌNH PHỤ (vòng 2, 2026-11-17)
/** vệt mực loang sát đất a → b (đường lướt nhìn rõ từ máy sau lưng), viền máu mảnh ở giữa */
function vetDat(a, b, w, song) {
  const d = b.clone().sub(a).setY(0), L = d.length() || .01; d.normalize(); const n = new V3(-d.z, 0, d.x), N = 12, g = new T.Group();
  const lop = (k, mau, cong, al, ro) => {
    const P = [], C = [], I = [];
    for (let i = 0; i <= N; i++) { const s = i / N, p = a.clone().addScaledVector(d, L * s), ww = w * k * (.35 + .65 * Math.sin(Math.PI * s)), y = dia.cao(p.x, p.z) + .05 + (cong ? .01 : 0); for (const sg of [-1, 1]) { P.push(p.x + n.x * ww * sg, y, p.z + n.z * ww * sg); C.push(1, 1, 1, 1); } if (i < N) { const q = i * 2; I.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); } }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(P, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(C, 4)); geo.setIndex(I);
    const m = new T.Mesh(geo, matDai(mau, cong, al)); m.renderOrder = ro; g.add(m); return m;
  };
  const m0 = lop(1, MUC, false, .88, 3), m1 = lop(.16, doS(1.3), true, .8, 4);
  return vfx.them(g, song || 1.4, (dt, u) => { const k = 1 - sm((u - .45) / .55); m0.material.opacity = .88 * k; m1.material.opacity = .8 * k; });
}
/** đường kẻ sáng đỏ phẳng trên đất (trận đồ) */
function netDat(g, a, b, rong, mat) { const L = a.distanceTo(b) || .01; const m = new T.Mesh(new T.BoxGeometry(rong, .02, L), mat); m.position.lerpVectors(a, b, .5); m.lookAt(b); g.add(m); return m; }
/** khe hư không dựng đứng (kiếm được rút ra từ đây): lõi mực, viền máu, luôn quay về máy */
function kheHuKhong(pos, cao, song) {
  const g = new T.Group();
  const vien = new T.Mesh(new T.PlaneGeometry(.42, cao), new T.MeshBasicMaterial({ color: doS(1.4), transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false, side: T.DoubleSide }));
  const loi = new T.Mesh(new T.PlaneGeometry(.18, cao * .94), new T.MeshBasicMaterial({ color: MUC, transparent: true, depthWrite: false, side: T.DoubleSide })); loi.position.z = .01; loi.renderOrder = 9; vien.renderOrder = 8;
  g.add(vien); g.add(loi); g.position.copy(pos);
  return vfx.them(g, song, (dt, u) => { g.lookAt(DK.cam.position.x, pos.y, DK.cam.position.z); const k = u < .2 ? u / .2 : 1 - sm((u - .55) / .45); g.scale.set(Math.max(.01, k), .6 + .4 * Math.min(1, u * 5), 1); });
}
/** rãnh đỏ mở dần dọc a → b với tốc độ toc (m/s), bắt đầu sau tre */
function ranDan(c, a, b, op = {}) {
  const L = a.distanceTo(b), n = Math.max(1, Math.round(L / 3)), toc = op.toc || 30, tre = op.tre || 0;
  for (let i = 0; i < n; i++) { const p = a.clone().lerp(b, i / n), q = a.clone().lerp(b, (i + 1) / n); c.hen(c.T() + tre + L * i / n / toc, () => { ranDo(p, q, op); if (op.cat) dia.cat(p, q, op.cat); if (op.pha && i % 2 === 0) dia.pha(q, op.pha); }); }
}

// ================================================================ X — ẢNH BỘ HỒI PHONG (ám sát)
// Dấu ấn: tan thành mực → chuỗi ẢNH MỰC lướt vòng cung quanh địch (vệt mực trên đất, tầm tới 14 m) → hiện chếch sau lưng →
//   đâm xuyên lưng, hai nhát cứa in CHỮ X đỏ–đen, địch khựng → X bung máu–mực → vẩy kiếm, thu thế. KHÔNG nháy màn hình.
/** vệt mực lướt dựng đứng (giữa hai bước ảnh) */
function vetMuc(a, b, op = {}) {
  const cao = op.cao || 1.7, n = 12, d = b.clone().sub(a).setY(0), L = d.length() || .01; d.normalize();
  const P = [], C = [], I = [];
  for (let i = 0; i <= n; i++) { const s = i / n, p = a.clone().addScaledVector(d, L * s), w = .35 + .65 * Math.sin(Math.PI * s); P.push(p.x, cao * .5 * (1 - w), p.z, p.x, cao * .5 * (1 + w), p.z); C.push(1, 1, 1, 1, 1, 1, 1, 1); if (i < n) { const k = i * 2; I.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(P, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(C, 4)); geo.setIndex(I);
  const m = new T.Mesh(geo, matDai(MUC, false, .85)); m.renderOrder = 9; m.frustumCulled = false;
  const song = op.song || .35;
  return vfx.them(m, song, (dt, u) => { m.material.opacity = .85 * (1 - u); m.scale.y = 1 - .6 * u; });
}
function X(c) {
  c.quay(); const nv = c.nv, tg = c.tang, nh = c.nhanh;
  const coDich = c.coDich(14), chanDich = coDich ? c.dich.pos.clone().setY(0) : c.LN(0, 0, 12).setY(0), p0 = nv.pos.clone();
  let h = new V3().subVectors(chanDich, p0).setY(0); h = h.lengthSq() > 1e-4 ? h.normalize() : c.huongDich();
  const ben = new V3(-h.z, 0, h.x);
  const vong = (goc, r) => chanDich.clone().addScaledVector(h, -Math.cos(goc * D) * r).addScaledVector(ben, Math.sin(goc * D) * r);
  // đường lướt: tiến chéo rồi vòng cung ra sau lưng địch
  const diem = [p0.clone(), p0.clone().lerp(vong(35, 3.6), .55).addScaledVector(ben, 1.2), vong(45, 3.4), vong(80, 3.2), vong(112, 3)];
  if (tg >= 2) diem.splice(2, 0, p0.clone().lerp(vong(40, 3.5), .82).addScaledVector(ben, -.6));
  const dest = vong(118, 1.9);   // chếch sau lưng — máy sau lưng vẫn thấy cả địch lẫn người
  diem.push(dest);
  const tam = chanDich.clone().add(new V3(0, 1.15, 0)), phap = h.clone().negate(), ngang = new V3().crossVectors(LEN, phap).normalize();
  const coX = tg >= 4 ? 1.25 : tg >= 2 ? 1.1 : 1, BUOC = .065, t0 = .24, tA = t0 + (diem.length - 1) * BUOC;
  // pha 1 — báo: hạ thấp, mực rỉ dưới chân, vòng mực dưới chân địch
  c.phat(Clip('hnc_x1', '0 HNC_THU · .14 HNC_X_LAO o · .24 HNC_X_LAO h', null, null, 1), .12);
  c.hen(.04, () => { vfx.vung(chanDich, { r: 1.4, song: tA, mau: DO_DAM }); dia.chay(p0, 1, { mau: MUC, manh: .7 }); vfx.hat(nv.pos.clone().add(new V3(0, .2, 0)), { so: 8, mau: MUC, toc: 1.5, huong: LEN, loe: .6, co: .14, song: .4, trongLuc: -2, to: true, lech: .4 }); });
  if (tg >= 5) c.hen(.03, () => vfx.chu('Vô Ảnh Hồi Phong', { mau: '#ff3046', song: 1.4 }));
  // pha 2 — biến mất: ảnh mực đọng chỗ cũ vỡ thành khối mực
  c.hen(t0, () => {
    const a = anhMuc(nv, { op: .9 }); vfx.them(a, .4, (dt, u) => a.datMo(1 - u));
    c.an(true); vfx.hat(p0.clone().add(new V3(0, 1, 0)), { so: 14, mau: MUC, toc: 3, co: .16, song: .55, trongLuc: -2, can: 2, to: true, lech: .35 });
    bui(p0, .8, 8); DK.rung(.1, .2);
  });
  // pha 3 — các bước ảnh: thân vô hình lướt theo chuỗi điểm, mỗi điểm đọng một ảnh mực, vệt mực loang dưới đất
  for (let k = 1; k < diem.length; k++) c.hen(t0 + k * BUOC, () => {
    const a = diem[k - 1], b = diem[k], cuoi = k === diem.length - 1;
    nv.pos.copy(b);
    vetDat(a, b, .55, 1.6); vetMuc(a, b, { song: .3 }); dia.cat(a, b, .6);
    if (!cuoi) {
      const ke = diem[k + 1], d = ke.clone().sub(b);
      const g = anhTuThe(nv, k % 2 ? 'HNC_X_LAO' : 'HNC_N4_S', b, Math.atan2(d.x, d.z), { op: .85 });
      vfx.them(g, .55, (dt, u) => g.datMo(u < .3 ? 1 : 1 - (u - .3) / .7));
      vfx.hat(b.clone().add(new V3(0, .9, 0)), { so: 5, mau: MUC, toc: 1.5, co: .15, song: .5, trongLuc: -1, to: true, lech: .3 });
      bui(b, .5, 4);
    }
  });
  if (tg >= 5) X5Bong(c, chanDich, h, tam, phap, ngang, tA);
  // pha 4 — hiện ra chếch sau lưng địch: đâm xuyên, cứa hai nhát, vẩy kiếm, thu
  const ket = tg >= 5
    ? ' · .62 HNC_N6_W io · .74 HNC_N6_W h · .8 HNC_BO_M sin · .84 HNC_BO_S s · 1.0 HNC_BO_G o · 1.1 HNC_R_VAY s · 1.24 HNC_R_VAY h · 1.55 HNC_THU io'
    : ' · .7 HNC_R_VAY s · .86 HNC_R_VAY h · 1.15 HNC_THU io';
  c.hen(tA, () => {
    nv.pos.copy(dest); nv.ngam(chanDich); c.neo(); c.an(false);
    vfx.hat(c.LN(0, 1, 0), { so: 12, mau: MUC, toc: 3.5, co: .15, song: .5, trongLuc: 0, can: 3, to: true, lech: .3 });
    c.phat(Clip('hnc_x2' + (tg >= 5 ? '5' : ''), '0 HNC_N4_W · .05 HNC_N4_W h · .09 HNC_N4_S s · .2 HNC_N4_G o · .26 HNC_N3_W io · .32 HNC_N3_S s · .4 HNC_N2_W io · .46 HNC_N2_S s · .6 HNC_N2_G o' + ket, null, null, .6), .03);
  });
  // đâm xuyên: nét thẳng xuyên qua thân, máu–mực phụt ra phía trước địch
  c.hen(tA + .1, () => {
    const d = chanDich.clone().sub(dest).setY(0).normalize();
    const cv = DK.cam.position.clone().sub(tam); cv.addScaledVector(d, -cv.dot(d)).normalize();
    netChem(tam.clone().addScaledVector(d, .3), d, cv, { dai: 3.4, rong: .24, cong: 0, song: .9, hien: .04 });
    noMau(tam.clone().addScaledVector(d, .5), d.clone().add(new V3(0, .25, 0)), 14, 7);
    danhTrung(c, DK.trongTron(chanDich, 1.6), c.st * .5, { nang: 1, day: 0, tt: c.tt, khongNet: true, huong: d });
    DK.rung(.14, .2);
  });
  const dai = 3.1 * coX, rong = .5 * coX;
  const ve = (goc, t, st) => c.hen(t, () => {
    const d = ngang.clone().multiplyScalar(Math.cos(goc * D)).addScaledVector(LEN, Math.sin(goc * D));
    netChem(tam.clone().addScaledVector(phap, .45), d, phap, { dai, rong, cong: .2, song: tA + .95 - t, hien: .06, tach: .35, vung: c.vMui() });
    noMau(tam, phap.clone().add(LEN.clone().multiplyScalar(.4)), 6, 4);
    danhTrung(c, DK.trongTron(chanDich, 1.6), st, { nang: 1, day: 0, tt: c.tt, khongNet: true });
  });
  c.hen(tA + .28, () => c.vet(.08, { k1: 1.7 }));
  c.hen(tA + .42, () => c.vet(.08, { k1: 1.7 }));
  ve(-48, tA + .32, c.st * .5);   // "\"
  ve(48, tA + .46, c.st * .6);    // "/"
  if (tg >= 3) ve(0, tA + .56, c.st * .4);   // tầng 3: nét ngang ⇒ ✳
  // địch khựng: máu nhỏ giọt từ vết X
  c.lap((t) => { if (t < tA + .34) return true; if (t > tA + .7) return false; if (Math.random() < .5) vfx.hat(tam.clone().add(new V3(rr(-.5, .5), rr(-.6, .4), rr(-.2, .2))).addScaledVector(phap, .4), { so: 1, mau: doS(1.5), toc: .4, huong: new V3(0, -1, 0), loe: .1, co: rr(.07, .11), song: .5, trongLuc: 9 }); return true; });
  // X bung: máu–mực toả, địch bị hất
  c.hen(tA + .68, () => {
    noMau(tam, phap.clone().add(LEN.clone().multiplyScalar(.5)), 16 + tg * 2, 6.5);
    vfx.hat(tam, { so: 12 + tg * 2, mau: MUC, toc: 5, co: .18, song: .7, trongLuc: 10, to: true });
    vfx.vong(tam.clone().addScaledVector(phap, .5), { bk0: .3, bk1: 2.4 * coX, day: .4, song: .3, mau: doS(1.1), phap });
    danhTrung(c, DK.trongTron(chanDich, 1.9), c.st * .9, { nang: 2, day: .9, hat: .25, tt: c.tt, khongNet: true, huong: h });
    DK.rung(.2, .25);
    if (tg >= 4) {
      for (const s of [-1, 1]) { const dd = xoayY(h, 45 * s); ranDo(chanDich.clone().addScaledVector(dd, -2.8), chanDich.clone().addScaledVector(dd, 2.8), { rong: .38, sau: .3, w: .14, song: 3 }); }
      dia.nut(chanDich, { r: 3.2, nhanh: 6, mau: DO, song: 2.6, rong: .16 }); catVong(chanDich, 2.6, .6); dia.gio(chanDich, 4.5, 1.1); dia.vun(chanDich, { so: 14, luc: 3, len: 4, r: .6 }); dia.chay(chanDich, 2.2, { mau: MUC, manh: .7 });
    }
  });
  // vẩy kiếm: chuỗi giọt máu văng thành vệt cong trên đất
  c.hen(tA + .74, () => {
    const p = nv.mui(); vfx.hat(p, { so: 12, mau: doS(1.5), toc: 5.5, huong: nv.phai().add(new V3(0, -.4, 0)).addScaledVector(nv.toi(), .3), loe: .3, co: .1, song: .7, trongLuc: 14 });
    for (let i = 0; i < 4; i++) { const q = nv.quanh(1.1 + i * .45, 0, .5 - i * .25).setY(0); dia.chay(q, .3 + i * .05, { mau: DO, manh: .7 }); }
  });
  // nhánh
  if (nh === 'huyet_anh_phan_than') c.hen(tA + .8, () => {
    // ảnh mực đọng ở bước cuối lao tới cứa thêm một nét dọc
    const tu = diem[diem.length - 2]; vetDat(tu, chanDich, .5, 1); vetMuc(tu, chanDich, { song: .3 });
    netChem(tam.clone().addScaledVector(phap, .5), new V3(0, -1, 0), phap, { dai, rong, song: .5, hien: .05 });
    danhTrung(c, DK.trongTron(chanDich, 1.8), c.st * .9, { nang: 1, tt: c.tt, khongNet: true });
  });
  if (nh === 'quy_anh_vo_tung') c.hen(tA + 1.0, () => {
    vfx.trong(nv, .25); nv._anHN = DK.now + 1.5; DK.chuNoi('Ẩn thân', nv.diem('dau').add(new V3(0, .6, 0)), '#ff8a9a');
    c.lap(() => { if (Math.random() < .4) vfx.hat(nv.pos.clone().add(new V3(rr(-.4, .4), rr(.2, 1.6), rr(-.4, .4))), { so: 1, mau: MUC, toc: .8, huong: LEN, loe: .3, co: rr(.1, .16), song: .8, trongLuc: -1, can: 1, to: true }); return DK.now < nv._anHN; });
    c.hen(tA + 2.5, () => { if (nv._anHN) { nv._anHN = 0; vfx.trong(nv, 1); } });
  });
  // Hoá Cảnh: nhát bổ dọc kết liễu (sau X bung) — nét dọc khổng lồ + hố + X rạn đỏ trên đất
  if (tg >= 5) {
    c.hen(tA + .82, () => c.vet(.1, { k1: 2.2, tan: .35 }));
    c.hen(tA + .86, () => {
      netChem(tam.clone().addScaledVector(phap, .6), new V3(0, -1, 0), phap, { dai: 5, rong: .75, cong: 0, song: .8, hien: .05 });   // bổ dọc: hiện từ trên xuống
      dia.daiPha(chanDich, { r: 12, mau: DO, huong: h });
      for (const s of [-1, 1]) { const dd = xoayY(h, 45 * s); ranDo(chanDich.clone().addScaledVector(dd, -4), chanDich.clone().addScaledVector(dd, 4), { rong: .5, sau: .38, w: .17, song: 3.2 }); }
      dia.pha(chanDich, 5.5); noMau(tam, LEN, 18, 7);
      danhTrung(c, DK.trongTron(chanDich, 3.6), c.st * 1.6, { nang: 3, hat: .6, day: 1, tt: c.tt, khongNet: true });
      DK.rung(.35, .3);
    });
  }
}
/** X Hoá Cảnh: ba ảnh mực hiện quanh địch chém trước khi thân thật tới (sao sáu cánh) */
function X5Bong(c, chanDich, h, tam, phap, ngang, tA) {
  const nv = c.nv;
  c.hen(tA - .12, () => {
    [0, 120, 240].forEach((a, j) => {
      const d = xoayY(h.clone().negate(), a + 60), pos = chanDich.clone().addScaledVector(d, 1.8);
      const g = anhTuThe(nv, ['HNC_N3_S', 'HNC_N2_S', 'HNC_N1_S'][j], pos, Math.atan2(-d.x, -d.z), { op: .9 });
      vfx.them(g, .7, (dt, u, t) => g.datMo(u < .7 ? Math.min(1, t / .05) : (1 - u) / .3));
    });
    catVong(chanDich, 2.4, .6); dia.gio(chanDich, 4, 1);
  });
  [[-70, .0], [70, .06], [0, .12]].forEach(([goc, t]) => c.hen(tA - .08 + t, () => {
    const d = ngang.clone().multiplyScalar(Math.cos(goc * D)).addScaledVector(LEN, Math.sin(goc * D));
    netChem(tam.clone().addScaledVector(phap, .4), d, phap, { dai: 3.6, rong: .45, cong: .15, song: 1.1, hien: .05, tach: .3 });
    danhTrung(c, DK.trongTron(chanDich, 2), c.st * .4, { nang: 1, day: 0, tt: c.tt, khongNet: true });
  }));
}

// ================================================================ C — PHI HỒNG LẠC NGUYỆT (vòng 3, 2026-11-17 — làm lại)
// Người dùng: "chém không hiệu ứng, tự nhiên có 2 trăng khuyết" ⇒ chỉ MỘT trăng duy nhất:
//   lấy đà (mực tụ chân) → đạp đất bật → xoáy trên không → treo trên đỉnh → BỔ: trăng sinh ra ĐÚNG theo đường mũi kiếm, từ trên
//   xuống, như vệt chém dày lớn dần → trăng tách khỏi kiếm, lao xuống đất → chạm đất: nhát xẻ dọc theo hướng bổ, đất tách đôi,
//   đá hai bên lật lên. Tầng 2–4 đổi cách ra đòn (xoáy 2 vòng · lướt tới rồi bật · xẻ dài phá vật), không thêm hình phụ.
//   Tầng 5: đại phá vùng + đường xẻ chạy tới chân núi, xẻ núi sập một mảng.
/** trăng bổ dọc tĩnh (dùng cho nhánh Tam Lạc): dây cung đứng, hiện dần từ trên xuống */
function trangBo(c, dat, op) {
  const f = op.f, s = new V3().crossVectors(f, LEN).normalize();
  const R = op.R, goc = 150, chord = 2 * R * Math.sin(goc * D / 2);
  const bung = s.clone().multiplyScalar(Math.cos(38 * D)).addScaledVector(f, Math.sin(38 * D));
  const pos = dat.clone().add(new V3(0, chord / 2 + .1 - R * .1, 0)).addScaledVector(bung, -R * .15);
  return trangDong({ pos, truc: [LEN.clone().negate(), bung], R, goc, day: op.day, quet: R * .12, song: op.song || .6, hien: .08, gian: .05, chim: op.chim || 0, sang: op.sang || 1 });
}
/** bay điều khiển: lên (t0→t1, đỉnh H) · treo (t1→t2, nổi nhẹ) · rơi (t2→t3) ; ngang A → B trong t0→t2 */
function bayTreo(c, A, B, H, t0, t1, t2, t3) {
  const nv = c.nv;
  c.lap((t) => {
    if (t < t0) return true;
    nv.treo = true; nv.datDat = false; nv.vy = 0;
    let y;
    if (t < t1) y = H * (1 - Math.pow(1 - (t - t0) / (t1 - t0), 2.4));
    else if (t < t2) y = H + .25 * Math.sin((t - t1) / (t2 - t1) * Math.PI * .5);
    else y = (H + .25) * (1 - Math.pow(clamp((t - t2) / (t3 - t2), 0, 1), 2));
    const s = sm(clamp((t - t0) / (t2 - t0), 0, 1));
    nv.pos.set(A.x + (B.x - A.x) * s, Math.max(0, y), A.z + (B.z - A.z) * s);
    if (t >= t3) { nv.pos.y = 0; nv.treo = false; nv.datDat = true; return false; }
    return true;
  });
}
/** đường xẻ dọc a → b chạy dần (toc m/s): rãnh đỏ sâu, đất hai bên gồ lên, đá hai bên lật ra ngoài */
function xeDat(c, a, b, op = {}) {
  const d = b.clone().sub(a).setY(0), L = d.length(); if (L < .5) return; d.normalize(); const s = new V3(-d.z, 0, d.x);
  const toc = op.toc || 26, rong = op.rong || .9, cao = op.cao || .55, tang = op.tang != null ? op.tang : 2;
  ranDan(c, a, b, { rong, sau: op.sau || .7, w: rong * .32, song: 3.6, toc, cat: 1, pha: op.pha || 0 });
  let buoc = 0;
  for (let x = 0; x < L; x += 1.6) {
    const p = a.clone().addScaledVector(d, x), coTang = tang && (buoc++ % 2 === 0);
    c.hen(c.T() + x / toc, () => {
      for (const sg of [-1, 1]) {
        dia.nang(p.clone().addScaledVector(s, sg * (rong + .9)), .9 + rong * .3, cao * (.8 + Math.random() * .4));
        if (coTang) dia.tang(p.clone().addScaledVector(s, sg * (rong + .6)).add(new V3(0, .3, 0)), { so: tang, luc: 3, len: 4.5, co: .4 + rong * .15, huong: s.clone().multiplyScalar(sg), mau: 0x6e665c });
      }
      dia.vun(p, { so: 5, luc: 2, len: 4, r: .4 });
      danhTrung(c, DK.trongTron(p, rong + 1), c.st * .12, { nang: 0, day: 0, khongNet: true });
    });
  }
}
function Cc(c) {
  c.chonDich(); c.quay(); const nv = c.nv, tg = c.tang, nh = c.nhanh;
  if (nh === 'phi_hong_tam_lac') return C3(c);
  const p0 = nv.pos.clone(), f = c.f(), s = c.r();
  const dat = c.dichChan(16);
  const luot = tg >= 3;                                   // T3+: lướt tới rồi mới bật (đổi cách ra đòn)
  const A = luot ? p0.clone().addScaledVector(f, Math.min(3, Math.max(0, p0.distanceTo(dat) - 3.5))) : p0.clone();
  const dung = dat.clone().addScaledVector(f, -2.4);
  const H = [4.2, 5.2, 5.2, 5.6, 6.4][tg - 1], xoayDo = tg >= 2 ? 720 : 360;
  const RT = [2.6, 2.8, 3, 3.3, 3.8][tg - 1], LX = [7, 8.5, 10, 13, 16][tg - 1];
  const tB = .8, tTach = .87, tCham = .96;               // bổ · trăng tách · trăng chạm đất
  c.phat(Clip('hnc_cc' + tg, '0 HNC_C_TU · .22 HNC_C_TU h · .3 HNC_C_BAY_LEN o · .52 HNC_C_BAY_DINH o · .62 HNC_C_TREO o · .76 HNC_C_TREO h · .8 HNC_BO_M sin · .86 HNC_C_BAY_BO s · 1.0 HNC_BO_S s · 1.18 HNC_BO_G o · 1.32 HNC_BO_G h · 1.7 HNC_THU io',
    luot ? '0 0 0 o; .22 0 ' + A.distanceTo(p0).toFixed(2) + ' o' : null, { lon: [.26, .58, 360], xoay: [.26, .58, xoayDo], tam: .9 }, 1.2), .2);
  bayTreo(c, A, dung, H, .24, .56, .86, 1.0);
  if (tg >= 5) c.hen(.03, () => vfx.chu('Huyết Hồng Trụy Nguyệt', { mau: '#ff3046', song: 1.4 }));
  // pha 1 — lấy đà: mực tụ về chân
  c.hen(.04, () => { for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, q = p0.clone().add(new V3(Math.cos(a) * 1.6, .1, Math.sin(a) * 1.6)); vfx.hat(q, { so: 1, mau: MUC, toc: 4, huong: p0.clone().sub(q).setY(0), loe: .1, co: .16, song: .35, trongLuc: 0, can: 1, to: true }); } });
  if (luot) c.hen(.1, () => { vetDat(p0, A, .5, 1.2); bui(p0, .6, 6); });
  // pha 2 — đạp đất bật
  c.hen(.24, () => { dia.ho(A, 1, .16, { mau: MUC }); dia.nut(A, { r: 1.8, nhanh: 5, mau: DO, song: 1.8, rong: .14 }); dia.vun(A, { so: 10, luc: 2.5, len: 5, r: .5 }); bui(A, 1, 12); vfx.vong(A, { bk0: .3, bk1: 2.4, day: .35, song: .3, mau: DO_DAM }); dia.gio(A, 3, .9); DK.rung(.14, .2); });
  c.hen(.32, () => vfx.dai(dat.clone().addScaledVector(f, -1.2), dat.clone().addScaledVector(f, LX), { rong: 2.2, song: .62, mau: DO_DAM }));   // báo: đường sẽ xẻ
  // pha 3 — xoáy trên không: vệt mực xoắn theo thân
  c.hen(.3, () => vetChem(nv, .26, { mau: MUC.clone().addScalar(.15), k0: .1, k1: 1.2, tan: .25 }));
  // pha 4 — BỔ: trăng sinh ra theo đường mũi kiếm (từ trên-sau xuống dưới-trước), lớn dần như vệt chém dày
  c.hen(tB - .02, () => c.vet(.08, { k1: 1.5, tan: .25 }));
  // 2026-11-17 — người dùng: trăng phải đi hình khuyết tới đối thủ, không tùm lum ⇒ trăng DỌC, mặt phẳng cố định chứa hướng bay,
  //   lưng cong (mép cắt) hướng tới đích, mũi chĩa về người; sinh theo nhát bổ (hiện từ trên xuống) → bay thẳng, nhanh dần tới đích
  //   → cắm xuống, cày dọc đúng đường bay (rãnh xẻ); T5 cày tiếp tới chân núi.
  const goc5 = dat.clone().add(new V3(0, .6, 0)), cham5 = tg >= 5 && dia.chamNui ? dia.chamNui(goc5, f) : null;
  const dCay = LX + (cham5 ? dat.clone().addScaledVector(f, LX).distanceTo(cham5.clone().setY(0)) : 0);
  c.hen(tB, () => {
    const t = taoTrang({ R: RT, goc: 160, day: RT * .42, quet: 0, sang: 1, loDan: true });
    t.bay(f, 55, 90);                                   // dây cung dựng (ngả 35° quanh hướng bay để máy sau lưng thấy mặt trăng), bụng hướng tới
    const nguoc = t.trucX().y > 0;                      // hiện từ mũi TRÊN xuống, cùng chiều nhát bổ
    const C0 = nv.pos.clone().add(new V3(0, 1.2, 0)).addScaledVector(f, RT * .5);
    const den = dat.clone().addScaledVector(f, -.3).add(new V3(0, RT * .72, 0));   // tâm trăng khi tới đích: mũi dưới chạm đất
    const T0 = c.T(), thoi = (tCham - tB) + dCay / 26 + .25;
    vfx.them(t.g, thoi, (dt, u, tt) => {
      const tA = T0 + tt; let p;
      if (tA < tTach) p = C0;                                                                       // dính theo nhát bổ
      else if (tA < tCham) { const k = (tA - tTach) / (tCham - tTach); p = C0.clone().lerp(den, k * (.4 + .6 * k)); }   // bay thẳng, nhanh dần
      else { const x = Math.min(dCay, (tA - tCham) * 26); p = den.clone().addScaledVector(f, x).add(new V3(0, -RT * .42 * sm((tA - tCham) / .12), 0)); }   // cắm xuống, cày dọc đường bay
      t.g.position.copy(p);
      t.datLo((tA - tB) / .07, nguoc);
      t.g.scale.setScalar(.75 + .25 * sm((tA - tB) / .07));
      t.datMo(1 - sm((tA - (tCham + dCay / 26 - .05)) / .2));
    });
    c.hen(tTach, () => vfx.hat(C0.clone(), { so: 10, mau: MUC, toc: 4, huong: den.clone().sub(C0), loe: .3, co: .16, song: .45, trongLuc: 6, to: true }));
  });
  // pha 5 — chạm đất: xẻ dọc theo hướng bổ, đất tách đôi, đá hai bên lật lên
  c.hen(tCham, () => {
    const g = dat;
    danhTrung(c, DK.trongTron(g, 2.6), c.st, { nang: 3, day: .25, hat: 0, tt: c.tt, huong: f, khongNet: true });   // đòn bổ: dồn xuống, không hất
    DK.rung(.3 + tg * .04, .3);
    dia.ho(g, 1.3, .45 + tg * .05, { mau: DO_DAM });
    dia.nut(g, { r: 3 + tg * .4, nhanh: 6, mau: DO, song: 3, rong: .2 });
    dia.tang(g.clone().add(new V3(0, .3, 0)), { so: 2, luc: 3, len: 6, co: .6, mau: 0x6e665c });
    dia.vun(g, { so: 18 + tg * 4, luc: 4, len: 6, r: .6 });
    bui(g, 1.8, 18); dia.gio(g, 4 + tg, 1);
    vfx.vong(g, { bk0: .4, bk1: 3.4, day: .45, song: .35, mau: DO_DAM });
    noMau(g.clone().add(new V3(0, .5, 0)), LEN, 10 + tg * 2, 6);
    xeDat(c, g.clone().addScaledVector(f, -1.4), g.clone().addScaledVector(f, LX), { rong: .7 + tg * .1, sau: .6 + tg * .08, cao: .45 + tg * .08, tang: tg >= 3 ? 2 : 1, toc: 26, pha: tg >= 4 ? 2.2 : 0 });
    if (tg >= 4) c.hen(tCham + LX / 26, () => { const e = g.clone().addScaledVector(f, LX); dia.gai(e, { so: 5, r: 1.4, cao: 1.6, mau: 0x3a2e30 }); dia.tang(e, { so: 4, luc: 4, len: 6, co: .9, huong: f }); });
    // Hoá Cảnh: đại phá vùng + đường xẻ chạy thẳng tới chân núi, xẻ núi sập một mảng
    if (tg >= 5) {
      dia.daiPha(g.clone().addScaledVector(f, 2), { r: 15, mau: DO, huong: f, sau: 1.4 });
      const cham = cham5;
      if (cham) {
        const tu = g.clone().addScaledVector(f, LX), den = cham.clone().setY(0);
        c.hen(tCham + LX / 26, () => xeDat(c, tu, den, { rong: 1.1, sau: .8, cao: .6, tang: 2, toc: 26, pha: 3 }));   // trăng cày tiếp tới chân núi
        c.hen(tCham + dCay / 26, () => { dia.sapNui(cham, { r: 13, manh: 1, huong: f }); dia.tang(cham, { so: 12, luc: 6, len: 9, co: 1.4, huong: f }); });
      }
    }
    // nhánh Nguyệt Lạc Thâm Uyên: vũng máu đọng 3 s, rút máu dần
    if (nh === 'nguyet_lac_tham_uyen') {
      const RR = 3.6 * (tg >= 4 ? 1.2 : 1);
      const vung = new T.Mesh(new T.CircleGeometry(RR, 56), new T.MeshBasicMaterial({ color: new T.Color(.3, .005, .03), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }));
      const vien = new T.Mesh(new T.RingGeometry(RR - .14, RR, 64), new T.MeshBasicMaterial({ color: doS(1.6), transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false }));
      const gv = new T.Group(); vung.rotation.x = vien.rotation.x = -Math.PI / 2; vien.position.y = .01; gv.add(vung); gv.add(vien); gv.position.copy(g).setY(.03); gv.renderOrder = 2;
      vfx.them(gv, 3.2, (dt, u, t) => { const k = Math.min(1, t / .2) * (1 - sm((u - .85) / .15)); vung.material.opacity = .7 * k * (.85 + .15 * Math.sin(t * 9)); vien.material.opacity = .9 * k; if (Math.random() < .35) { const a = rr(0, 6.3), q = Math.sqrt(Math.random()) * RR; vfx.hat(g.clone().add(new V3(Math.cos(a) * q, .05, Math.sin(a) * q)), { so: 1, mau: Math.random() < .7 ? doS(1.4) : MUC, toc: rr(.8, 2), huong: LEN, loe: .1, co: rr(.1, .16), song: .7, trongLuc: 1, to: Math.random() < .3 }); } });
      for (let k = 0; k < 8; k++) c.hen(1.05 + k * .36, () => danhTrung(c, DK.trongTron(g, RR), c.st * .08, { nang: 0, day: 0, tt: 'Ma nhiễm', khongNet: true }));
    }
  });
  // tiếp đất sau lưng vết xẻ
  c.hen(1.0, () => { bui(nv.pos.clone(), .8, 8); DK.rung(.1, .15); });
}
/** nhánh Phi Hồng Tam Lạc: bổ liền ba lần nối nhau tiến lên — mỗi lần MỘT trăng dọc hiện từ trên xuống, xẻ đất ngắn */
function C3(c) {
  const nv = c.nv, tg = c.tang, f = c.f(), p0 = nv.pos.clone();
  const khoa = ['0 HNC_C_TU', '.2 HNC_C_TU h'], L = .5, diem = [];
  for (let k = 0; k < 3; k++) {
    const t0 = .2 + k * L;
    khoa.push((t0 + .1).toFixed(2) + ' HNC_C_BAY_LEN o', (t0 + .22).toFixed(2) + ' HNC_C_TREO o', (t0 + .3).toFixed(2) + ' HNC_BO_M sin', (t0 + .34).toFixed(2) + ' HNC_BO_S s', (t0 + .46).toFixed(2) + ' HNC_BO_G h');
    diem.push(p0.clone().addScaledVector(f, 3 + k * 3.4));
  }
  khoa.push((.2 + 3 * L + .3).toFixed(2) + ' HNC_THU io');
  c.phat(Clip('hnc_c3', khoa.join(' · '), null, null, 1.5), .2);
  let tu = p0;
  diem.forEach((d, k) => {
    const t0 = .2 + k * L, r = 2.6 * (1 - k * .1) * (tg >= 4 ? 1.15 : 1), R = 2.6 - k * .3;
    boNhay(c, tu.clone(), d.clone().addScaledVector(f, -1.3), 2.6 - k * .3, t0, t0 + .2, t0 + .34); tu = d.clone().addScaledVector(f, -1.3);
    c.hen(t0 + .26, () => c.vet(.08, { k1: 1.5 }));
    c.hen(t0 + .28, () => trangBo(c, d, { f, R, day: R * .4, song: .42, chim: 2 }));
    c.hen(t0 + .34, () => {
      danhTrung(c, DK.trongTron(d, r), c.st, { nang: 2, day: .2, tt: c.tt, huong: f, khongNet: true });
      dia.nut(d, { r: r, nhanh: 5, mau: DO, song: 2.4, rong: .18 }); dia.vun(d, { so: 12, luc: 3.5, len: 5, r: .5 }); bui(d, 1.4, 10);
      xeDat(c, d.clone().addScaledVector(f, -.6), d.clone().addScaledVector(f, 2.4 + tg * .4), { rong: .5 + tg * .06, sau: .4, cao: .35, tang: 1, toc: 22 });
      if (tg >= 4) dia.pha(d, r * .9);
      if (k === 2 && tg >= 5) dia.daiPha(d, { r: 12, mau: DO, huong: f });
      DK.rung(.2 + k * .06, .25);
    });
  });
}

// ================================================================ V — THIÊN TINH KIẾM TRẬN (nghi thức kiếm trận)
// Pha: kết ấn (trận đồ dưới chân + trận đồ Bắc Đẩu vẽ dần trên đất quanh đích) → giơ kiếm: bảy KHE HƯ KHÔNG mở trên trời,
//   kiếm thật to được rút ra, xoay một vòng, treo thành Bắc Đẩu (nét sao nối) → kiếm chỉ: cả trận lượn xoắn thành vòng xoay
//   trên đích → giáng có nhịp, cắm đúng bảy sao trên đất → kết trận: rạn đỏ nối bảy kiếm + vòng trận, kiếm khí vọt lên, đất nổ.
const BD = [[-3.0, 3.75], [-3.15, 2.85], [-1.85, 2.7], [-1.6, 3.5], [-.3, 3.8], [1.05, 4.05], [2.5, 3.7]];
const BD_NOI = [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]];
function V(c) {
  c.quay(); const nv = c.nv, tg = c.tang, nh = c.nhanh;
  if (nh === 'bac_dau_that_tinh') return VBacDau(c);
  const mua = nh === 'luu_tinh_vu';
  const tam = c.dichChan(30), f = c.f(), s = c.r(), co = tg >= 3 ? 2.7 : 2.4, RV = tg >= 4 ? 4.8 : 4.2;
  const lenH = tg >= 5 ? 3.3 : 2.75;
  c.phat(Clip('hnc_v', '0 HNC_THU · .12 HNC_AN o · .42 HNC_AN h · .52 HNC_V_TRIEU o · 1.0 HNC_V_TRIEU h · 1.1 HNC_N2_W io · 1.22 HNC_V_TRIEU sin · 1.5 HNC_CHI s · ' + (lenH - .3).toFixed(2) + ' HNC_CHI h · ' + lenH.toFixed(2) + ' HNC_THU io', null, { xoay: [1.1, 1.4, 360] }, 1.2), .15);
  if (tg >= 5) c.hen(.03, () => vfx.chu('Thiên Tinh Đảo Huyền', { mau: '#ff3046', song: 1.6 }));
  // điểm sao: trên trời (Bắc Đẩu dựng đứng, xa trước mặt) và trên đất (Bắc Đẩu nằm quanh đích)
  const trenTroi = BD.map(([x, y]) => c.LN(x * 1.25, y - .2, 6.5));
  const duoiDat = BD.map(([x, y]) => tam.clone().addScaledVector(s, (x + .3) * 1.0).addScaledVector(f, (y - 3.4) * 2.3));
  // ---- trận đồ dưới đất
  const matD = new T.MeshBasicMaterial({ color: doS(1.5), transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false });
  const tran = new T.Group(); const yD = p => new V3(p.x, dia.cao(p.x, p.z) + .05, p.z);
  if (!mua) {
    for (const [a, b] of BD_NOI) netDat(tran, yD(duoiDat[a]), yD(duoiDat[b]), .1, matD);
    for (const p of duoiDat) { const m = new T.Mesh(new T.RingGeometry(.32, .46, 24), matD); m.rotation.x = -Math.PI / 2; m.position.copy(yD(p)); tran.add(m); }
  }
  const v1 = new T.Mesh(new T.RingGeometry(RV - .12, RV, 96), matD), v2 = new T.Mesh(new T.RingGeometry(RV * .82 - .05, RV * .82, 96), matD);
  [v1, v2].forEach(v => { v.rotation.x = -Math.PI / 2; v.position.copy(yD(tam)); tran.add(v); });
  // vạch chia trên vòng (hình trận đồ)
  for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2, d = new V3(Math.cos(a), 0, Math.sin(a)); netDat(tran, yD(tam.clone().addScaledVector(d, RV * .82)), yD(tam.clone().addScaledVector(d, RV * (i % 4 ? .9 : 1))), .07, matD); }
  const tHetTran = lenH + 1.8;
  c.hen(.12, () => vfx.them(tran, tHetTran, (dt, u, t) => { const k = sm(t / .7) * (1 - sm((t - (tHetTran - .8)) / .8)); matD.opacity = .85 * k; v2.rotation.z = t * .5; }));
  // ấn dưới chân người
  c.hen(.1, () => { const m = new T.Mesh(new T.RingGeometry(1.1, 1.22, 48), matD.clone()); m.rotation.x = -Math.PI / 2; m.position.copy(yD(nv.pos)); vfx.them(m, 1.2, (dt, u) => { m.material.opacity = .9 * (1 - u); m.scale.setScalar(1 + u * .6); }); });
  // ---- nét sao trên trời
  const matL = new T.MeshBasicMaterial({ color: doS(1.4), transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false, fog: false });
  const troi = new T.Group();
  if (!mua) for (const [a, b] of BD_NOI) { const p = trenTroi[a], q = trenTroi[b], L = p.distanceTo(q); const l = new T.Mesh(new T.BoxGeometry(.07, .07, L), matL); l.position.lerpVectors(p, q, .5); l.lookAt(q); troi.add(l); }
  c.hen(.95, () => vfx.them(troi, .75, (dt, u) => { matL.opacity = .8 * Math.min(1, u * 5) * (1 - sm((u - .6) / .4)); }));
  // ---- kiếm
  const dsK = BD.map((b, i) => ({ i, sao: trenTroi[i], dat: mua ? tam.clone().add(new V3(rr(-4, 4), 0, rr(-4, 4))) : duoiDat[i], co: co * (i === 6 ? 1.12 : 1) }));
  if (mua) for (let i = 0; i < 7; i++) dsK.push({ i: i + 7, sao: trenTroi[i].clone().add(new V3(0, 1, 1.5)), dat: tam.clone().add(new V3(rr(-4.5, 4.5), 0, rr(-4.5, 4.5))), co: co * .8 });
  const n = dsK.length, tKhe = .55, tXep = 1.25, tLuon = 1.5, tGiang = 1.95, nhip = n > 7 ? .07 : .11;
  dsK.forEach((k, j) => { k.tHien = tKhe + j * .06; k.tGiang = tGiang + j * nhip; c.hen(k.tHien - .06, () => kheHuKhong(k.sao.clone().add(new V3(0, -.2, 0)), co * .95 + .6, .7)); });
  const datPos = [];
  c.lap((t) => {
    let con = false;
    for (const k of dsK) {
      if (k.xong) continue; con = true; if (t < k.tHien) continue;
      if (!k.kiem) { k.kiem = kiemMau(k.co, 8, false); k.pXep = k.sao.clone(); k.pVong = k.sao.clone(); }
      const L = k.kiem.muiL;
      if (t < tXep) {
        // rút từ khe: trượt xuống khỏi khe, xoay một vòng quanh thân kiếm
        const x = sm((t - k.tHien) / .3), pos = k.sao.clone().add(new V3(0, L * .55 * (1 - x) - L * .25 * x, 0));
        k.kiem.o.scale.setScalar(.3 + .7 * x);
        datKiem(k.kiem, pos, new V3(0, -1, 0)); k.kiem.o.rotateZ(x * Math.PI * 2);
        k.pXep = pos.clone();
      } else if (t < k.tGiang) {
        // lượn xoắn: rời Bắc Đẩu, vào vòng xoay trên đích (cao 4,6 m), mũi chúc xuống, vòng quay + nhấp nhô
        const x = sm((t - tXep) / (tLuon - tXep + .25)), a = k.i / n * Math.PI * 2 + (t - tXep) * 2.6;
        const vong = tam.clone().add(new V3(Math.cos(a) * 3.2, 2.9 + Math.sin(t * 6 + k.i) * .3, Math.sin(a) * 3.2));
        const mid = k.pXep.clone().lerp(vong, x).add(new V3(0, Math.sin(x * Math.PI) * 1.2, 0));
        const huong = new V3(0, -1, 0).lerp(vong.clone().sub(tam).setY(0).normalize().multiplyScalar(-.35).add(new V3(0, -1, 0)), x).normalize();
        datKiem(k.kiem, mid, huong); k.pVong = mid.clone();
      } else {
        if (!k.A) { k.A = k.pVong.clone(); k.t0 = t; }
        const x = clamp((t - k.t0) / .16, 0, 1), C = k.dat.clone().add(new V3(0, L * .3, 0)), d = C.clone().sub(k.A).normalize();
        datKiem(k.kiem, k.A.clone().lerp(C, x * x), d);
        if (x >= 1) { k.xong = true; k.kiem.huy(); camRoi(c, k.dat, d, k.i === 6, k.co); datPos.push(k.dat.clone()); }
      }
    }
    return con;
  });
  // ---- kết trận: rạn đỏ nối bảy kiếm + vòng trận, kiếm khí đỏ vọt lên, đất nổ
  const tKet = tGiang + n * nhip + .3;
  c.hen(tKet, () => {
    if (!mua) BD_NOI.forEach(([a, b], j) => ranDo(duoiDat[a], duoiDat[b], { rong: .34, sau: .26, w: .13, song: 3, tre: j * .03 }));
    if (tg >= 2) for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, b = (i + 1) / 16 * Math.PI * 2; ranDo(tam.clone().add(new V3(Math.cos(a) * RV, 0, Math.sin(a) * RV)), tam.clone().add(new V3(Math.cos(b) * RV, 0, Math.sin(b) * RV)), { rong: .3, sau: .22, w: .1, song: 2.8, tre: .1 + i * .015 }); }
  });
  c.hen(tKet + .25, () => {
    const phapCam = p => DK.cam.position.clone().sub(p).setY(0).normalize();
    for (const p of datPos) { const q = p.clone().add(new V3(0, 1.8, 0)); netChem(q, LEN.clone(), phapCam(q), { dai: 3.6, rong: .32, cong: 0, song: .5, hien: .08 }); dia.vun(p, { so: 6, luc: 3, len: 5, r: .3 }); }
    danhTrung(c, DK.trongTron(tam, RV), c.st * (tg >= 4 ? 1.6 : 1.2), { nang: 2, tt: c.tt });
    dia.no(tam, { muc: tg >= 4 ? 2 : 1, r: 1.8, mau: DO }); dia.gio(tam, RV + 3, 1.2); bui(tam, RV, 26);
    if (tg >= 4) { dia.pha(tam, RV + 2); dia.song(tam, { r: RV + 4, toc: 14, cao: .25 }); }
    DK.rung(.3, .3);
  });
  // Hoá Cảnh: thanh kiếm khổng lồ rút từ khe lớn trên trời, giáng giữa trận
  if (tg >= 5) {
    const A = tam.clone().add(new V3(0, 9.5, 0)).addScaledVector(f, 2.5);
    c.hen(tKet + .1, () => kheHuKhong(A.clone().add(new V3(0, .5, 0)), 6.5, .9));
    c.hen(tKet + .6, () => {
      const C = tam.clone(), k = kiemMau(5.4, 2, true); const t0 = c.T();
      vfx.vung(C, { r: 4, song: .3, mau: DO });
      c.lap((t) => { const x = clamp((t - t0) / .3, 0, 1); datKiem(k, A.clone().lerp(C.clone().add(new V3(0, 1.8, 0)), x * x), C.clone().sub(A)); if (x >= 1) {
        k.huy(); dia.daiPha(C, { r: 17, mau: DO, huong: f, sau: 1.5 });
        danhTrung(c, DK.trongTron(C, 5), c.st * 4, { nang: 3, hat: .6, day: 1, tt: c.tt });
        dia.camKiem(C.clone().add(new V3(0, 1.6, 0)), new V3(0, -1, 0), Object.assign({ mau: DO, co: 5, sang: .8, song: 4 }, KIEM_OP));
        DK.rung(.45, .35); return false; } return true; });
    });
  }
}
/** kiếm giáng cắm đất: nứt + vụn + kiếm cắm lại; lon = thanh chốt */
function camRoi(c, C, d, lon, co) {
  const tg = c.tang, g = C.clone().setY(dia.cao(C.x, C.z));
  danhTrung(c, DK.trongTron(g, lon ? 2.4 : 1.6), c.st * (lon ? 1.4 : .7), { nang: lon ? 2 : 0, tt: c.tt, huong: d.clone().setY(0) });
  dia.nut(g, { r: lon ? 2.8 : 1.6, nhanh: lon ? 7 : 4, mau: DO, song: 3, rong: lon ? .2 : .14 }); dia.vun(g, { so: lon ? 14 : 7, luc: 3, len: 4.5, r: .3 }); bui(g, .8, lon ? 12 : 6);
  vfx.vong(g.clone().add(new V3(0, .05, 0)), { bk0: .3, bk1: lon ? 3.2 : 1.8, day: .35, song: .32, mau: doS(1.1) });
  if (lon) { dia.ho(g, 1.1, .3, { mau: DO_DAM }); DK.rung(.22, .25); } else DK.rung(.08, .15);
  const dg = d.clone().normalize(); if (dg.y > -.6) { dg.y = -.85; dg.normalize(); }
  dia.camKiem(g.clone().add(new V3(0, (co || 2.4) * .95 * .42, 0)).addScaledVector(dg, -.1), dg, Object.assign({ mau: DO, co: co || 2.4, sang: .8, song: 3.6 + rr(0, .4) }, KIEM_OP));
}
/** nhánh Bắc Đẩu Thất Tinh: bảy kiếm to quay quanh thân 4 s, chém ai lại gần */
function VBacDau(c) {
  const nv = c.nv, tg = c.tang, R = 2.4 * (tg >= 4 ? 1.2 : 1), so = 7;
  c.phat(Clip('hnc_vbd', '0 HNC_THU · .12 HNC_AN o · .32 HNC_AN h · .4 HNC_V_TRIEU o · .6 HNC_V_TRIEU h · .8 HNC_THU io', null, null, .65), .15);
  const ds = []; let tHit = .7;
  const mR = new T.MeshBasicMaterial({ color: doS(1.5), transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false });
  const ban = new T.Group(); const v1 = new T.Mesh(new T.RingGeometry(R - .12, R, 72), mR); v1.rotation.x = -Math.PI / 2; ban.add(v1);
  c.hen(.35, () => vfx.them(ban, 4.4, (dt, u, t) => { ban.position.set(nv.pos.x, dia.cao(nv.pos.x, nv.pos.z) + .03, nv.pos.z); mR.opacity = Math.min(1, t / .3) * (1 - sm((u - .9) / .1)) * .8; }));
  for (let i = 0; i < so; i++) c.hen(.25 + i * .04, () => { const k = kiemMau(1.6, 4.6); ds.push({ k, i, t0: c.T(), tu: nv.mui() }); });
  c.lap((t) => {
    if (t > 4.6) { for (const d of ds) if (!d.het) { d.het = true; d.k.huy(); vfx.hat(d.k.o.position.clone(), { so: 6, mau: doS(1.4), toc: 2.5, co: .1, song: .4 }); } return false; }
    for (const d of ds) {
      const a = d.i / so * Math.PI * 2 + t * 2.4;
      const muc = nv.pos.clone().add(new V3(Math.cos(a) * R, 1.2 + .15 * Math.sin(t * 4 + d.i), Math.sin(a) * R));
      const x = sm((t - d.t0) / .25), pos = d.tu.clone().lerp(muc, x);
      datKiem(d.k, pos, new V3(-Math.sin(a), 0, Math.cos(a)).add(new V3(0, -.1, 0)));
    }
    if (t > tHit) {
      tHit += .3;
      const trong = DK.trongTron(nv.pos, R + .5);
      if (trong.length) { danhTrung(c, trong, c.st * (tg >= 2 ? 1 : .8), { nang: 0, day: .5, tt: c.tt }); if (tg >= 4) dia.gio(nv.pos.clone(), R + 1.5, .5); }
      if (tg >= 2) catVong(nv.pos, R, .4);
    }
    return true;
  });
}

// ================================================================ R — HUYẾT NGUYỆT TRẢM
// Pha: lùi nửa bước thu kiếm → hạ thấp tụ lực (xoáy mực–máu quanh thân, vòng đỏ co về, dải báo) → BẠT KIẾM IAI lướt tới,
//   lưỡi liềm ngang khổng lồ mực–máu → xoay người chém nối, lưỡi thứ hai chéo → vẩy máu, tra kiếm.
//   Cỡ tăng rõ theo tầng: T1 rộng ~9 m · T4 ~14 m + xẻ đất dài · T5 ~19 m, năm rãnh song song, phá cả sân. Không trăng, không nháy.
function R(c) {
  c.chonDich(); c.quay(); const nv = c.nv, tg = c.tang, nh = c.nhanh, f = c.f(), np = c.np.clone(), sP = c.r();
  const giao = nh === 'song_nguyet_giao_huy', doat = nh === 'huyet_nguyet_doat_menh';
  const K = [1, 1.15, 1.3, 1.6, 2.15][tg - 1], RM = 4.4 * K, TAM = [36, 38, 40, 46, 52][tg - 1];
  const kc = c.kc(), toi = c.dich && kc < 8 ? clamp(kc - 2.2, .8, 5) : 3;
  // 2026-11-17 — lưỡi bay thẳng tới đích, qua đích thêm 8 m rồi tan (không đích: bay hết tầm)
  const DAI = c.dich && kc < 40 ? clamp(kc - toi + 8, 12, TAM) : TAM;
  c.phat(Clip('hnc_r', '0 HNC_THU · .16 HNC_R_TU o · .3 HNC_R_TU h · .42 HNC_R_THU o · 1.0 HNC_R_THU h · 1.05 HNC_R_S s · 1.3 HNC_R_S h · 1.36 HNC_N5_W io · 1.42 HNC_N5_S o · 1.62 HNC_N5_S h · 1.68 HNC_N1_G s · 1.92 HNC_R_VAY s · 2.08 HNC_R_VAY h · 2.45 HNC_THU io',
    Mv(1, 0, 0, 0, .16, 0, -.45, 1.0, 0, -.45, 1.08, 0, toi, 1.62, 0, toi + .7), { xoay: [1.36, 1.62, 360] }, 1.5), .2);
  if (tg >= 5) c.hen(.03, () => vfx.chu('Huyết Nguyệt Đương Không', { mau: '#ff3046', song: 1.6 }));
  // pha 1 — lùi nửa bước: bụi, mực rỉ dưới chân
  c.hen(.18, () => { bui(nv.pos.clone(), .8, 8); dia.chay(nv.pos.clone(), 1.2, { mau: MUC, manh: .6 }); });
  // pha 2 — tụ lực: xoáy mực–máu quanh thân, vòng đỏ co về, dải báo rộng theo cỡ lưỡi
  c.hen(.4, () => { vfx.dai(np, np.clone().addScaledVector(f, DAI + toi), { rong: RM * 1.6, song: .62, mau: DO_DAM }); vfx.vong(nv.pos.clone(), { bk0: 3.6 * Math.sqrt(K), bk1: .6, day: .3, song: .58, mau: DO_DAM }); });
  c.lap((t) => {
    if (t < .42) return true; if (t > 1.0) return false;
    const tamT = nv.pos.clone(), so = tg >= 3 ? 3 : 2;
    for (let i = 0; i < so; i++) { const a = rr(0, Math.PI * 2), r = rr(2, 3.2) * Math.sqrt(K), p = tamT.clone().add(new V3(Math.cos(a) * r, rr(.2, 1.6), Math.sin(a) * r)); const tiep = new V3(-Math.sin(a), 0, Math.cos(a)), vao = tamT.clone().add(new V3(0, 1, 0)).sub(p).normalize(); vfx.hat(p, { so: 1, mau: Math.random() < .55 ? MUC : doS(1.4), toc: 6, huong: tiep.multiplyScalar(1.2).add(vao), loe: .05, co: rr(.1, .17), song: .32, trongLuc: 0, can: 0, to: Math.random() < .5 }); }
    if (tg >= 3 && Math.random() < .12) dia.nut(tamT, { r: 1.4, nhanh: 3, mau: DO, song: 1.2, rong: .1 });
    if (tg >= 4 && Math.random() < .25) dia.gio(tamT, 3, .3);
    return true;
  });
  // pha 3 — bạt kiếm iai: lưỡi liềm ngang khổng lồ
  c.hen(1.0, () => c.vet(.06, { k1: 1.6, tan: .3 }));
  c.hen(1.0, () => { const g = anhMuc(nv, { op: .5 }); vfx.them(g, .3, (dt, u) => g.datMo(1 - u)); bui(nv.pos.clone(), 1.2, 14); dia.gio(nv.pos.clone(), 3 * K, 1); });
  c.hen(1.04, () => {
    DK.rung(.25 + tg * .04, .35);
    if (!giao) danhTrung(c, DK.trongDuong(np, np.clone().addScaledVector(f, DAI + toi), RM * 1.6), c.st, { nang: 3, day: 1.2, menh: doat ? .35 : .25, tt: c.tt, hut: doat ? .15 : 0, huong: f });
  });
  const goc = () => c.LN(0, tg >= 4 ? .95 : 1.15, toi + .8);
  c.hen(1.07, () => {
    const g0 = goc();
    const base = { pos: g0, huong: f.clone(), toc: 26 + tg * 2, tam: DAI, R: RM, goc: 158, day: 1.9 * K, roll: -6, lean: 72, quet: 0, xuyen: true, quaDat: true, cat: true, sang: 1, bong: tg >= 2 ? 3 : 2, lon: 1.2 };
    if (tg >= 2) base.ranh = [.4 + tg * .1, .25 + tg * .07];
    if (tg >= 4) Object.assign(base, { pha: RM * .7, gio: true });
    if (doat) Object.assign(base, { R: RM * .8, day: .55 * K, toc: 34 });
    base.vung = c.vMui();   // lưỡi hiện dần cùng chiều bạt kiếm
    // Hoá Cảnh: lưỡi bay thẳng tới chân núi, xẻ núi sập một mảng; đại phá vùng trước mặt
    if (tg >= 5) {
      dia.daiPha(np.clone().addScaledVector(f, 10), { r: 16, mau: DO, huong: f, sau: 1.5 });
      const cham = dia.chamNui ? dia.chamNui(g0, f) : null;
      if (cham) Object.assign(base, { tam: g0.distanceTo(cham) + 1, khiToi: p => { dia.sapNui(cham, { r: 14, manh: 1, huong: f }); dia.tang(cham, { so: 14, luc: 6, len: 8, co: 1.4, huong: f }); DK.rung(.4, .8); } });
    }
    if (giao) {
      const dich = c.coDich(30) ? ngucCua(c.dich) : c.LN(0, 1.1, 14);
      // hai lưỡi bay SONG SONG cùng hướng tới đích (trên–dưới ngực), không bắt chéo
      const h2 = dich.clone().sub(g0).setY(0).normalize();
      for (const s of [-1, 1]) phongTrang(c, Object.assign({}, base, { pos: g0.clone().add(new V3(0, s * .45, 0)), huong: h2, R: RM * .7, day: base.day * .7, st: c.st, nang: 3, tt: c.tt, menh: .25, ranh: null, pha: 0, khiToi: null }));
    } else {
      phongTrang(c, base);   // 2026-11-17 — bỏ hai cánh phụ (không thêm hình phụ)
    }
    // tầng 4+: rãnh song song xẻ dài theo lưỡi (T5 năm rãnh, quét gần cả sân)
    if (tg >= 4) {
      const lech = tg >= 5 ? [-.75, -.38, 0, .38, .75] : [-.45, 0, .45];
      lech.forEach((l, j) => { const a = np.clone().addScaledVector(sP, l * RM).addScaledVector(f, toi + 1.5), b = a.clone().addScaledVector(f, DAI * (l ? .8 : 1)); ranDan(c, a, b, { rong: l ? .5 : .8, sau: l ? .35 : .55, w: l ? .16 : .24, song: 3.4, toc: base.toc, tre: j * .02, pha: l ? RM * .3 : 0 }); });
    }
  });
  // pha 4 — xoay người chém nối: lưỡi thứ hai chéo hất lên
  c.hen(1.5, () => c.vet(.1, { k1: 1.8, tan: .3 }));
  c.hen(1.56, () => {
    phongTrang(c, { vung: c.vMui(), hat: .7, pos: goc().add(new V3(0, .4, 0)), huong: f.clone(), toc: 24, tam: DAI * .8, R: RM * .72, goc: 150, day: 1.3 * K, roll: 32, lean: 72, quet: 0, xuyen: true, quaDat: true, cat: true, st: c.st * .4, nang: 1, tt: c.tt, bong: 2, sang: .9, pha: tg >= 4 ? RM * .4 : 0 });
    DK.rung(.15, .2);
  });
  // Hoá Cảnh: lưỡi thứ ba DỌC bổ từ trên đầu xuống — nhắm đỉnh núi nếu đang hướng về núi (sập cả ngọn), không thì bổ xuống đích
  if (tg >= 5) c.hen(1.85, () => {
    const N = dia.NUI, veNui = N && new V3().subVectors(N.tam, np).setY(0).normalize().dot(f) > .8;
    const dich = veNui ? N.tam.clone().add(new V3(0, 15, -5)) : (c.coDich(30) ? c.dich.pos.clone().setY(1) : c.LN(0, 1, 12));
    const A = nv.quanh(0, 7, 1.5), hh = dich.clone().sub(A);
    c.hen(1.8, () => c.vet(.1, { k1: 2, tan: .3 }));
    phongTrang(c, { pos: A, huong: hh, toc: veNui ? 55 : 40, tam: hh.length(), R: 7, goc: 160, day: 2.6, roll: 90, lean: 90, sang: 1, quaDat: true, bong: 3, lon: 1.3, vung: new V3(0, -1, 0),
      khiToi: () => {
        DK.rung(.5, 1);
        if (veNui) { dia.sapNui(N.tam, { r: 24, manh: 1, huong: f }); dia.tang(N.tam.clone().add(new V3(0, 10, -8)), { so: 20, luc: 7, len: 6, co: 1.6, huong: f.clone().negate() }); }
        else { const g = dich.clone().setY(0); dia.daiPha(g, { r: 14, mau: DO, huong: f }); danhTrung(c, DK.trongTron(g, 7), c.st * .8, { nang: 3, day: .4, tt: 'Ma nhiễm', menh: .25 }); }
      } });
  });
  // pha 5 — vẩy máu, tra kiếm
  c.hen(1.94, () => {
    const p = nv.mui(); vfx.hat(p, { so: 12, mau: doS(1.5), toc: 6, huong: nv.phai().add(new V3(0, -.6, 0)).addScaledVector(nv.toi(), .3), loe: .35, co: .1, song: .7, trongLuc: 14 });
    for (let i = 0; i < 5; i++) { const q = nv.quanh(1.2 + i * .5, 0, .6 - i * .3).setY(0); dia.chay(q, .3 + i * .06, { mau: DO, manh: .7 }); }
  });
  c.hen(2.3, () => DK.rung(.05, .15));
}

// ================================================================ ĐĂNG KÝ
function chieu(fn) { return (ctx) => { const c = Ch(ctx); fn(c); }; }
DK.dangKyBoNC('huyet_nguyet', {
  yTuong: 'Sát thủ soulslike, nhịp nặng kiểu Epic Fight, mỗi chiêu một hình dấu ấn to: Z ba trăng khuyết mực dày viền máu · X lướt ảnh mực vòng sau lưng, đâm xuyên + chữ X đỏ–đen · C trăng dọc khổng lồ bổ xuống · V nghi thức Bắc Đẩu kiếm trận · R lưỡi liềm ngang khổng lồ xẻ đất. ' +
    'Chỉ mực đen + đỏ máu (vệt chém theo màu thanh kiếm, dịu). KHÔNG nháy màn hình, không đổi trời: lực đòn thể hiện bằng địa hình, hạt, rung nhẹ. Tầng 1 đã đủ hình; 2–3 thêm pha/biến thể; 4 Viên Mãn tác động địa hình; 5 Hoá Cảnh phá cảnh.',
  moTaChieu: {
    tan_nguyet: 'Lấy đà, lướt tới ba nhát (ngang · hất · bổ chéo), mỗi nhát phóng một trăng khuyết mực dày viền máu, dựng mặt nghiêng theo nhát, bay xa 20 m. T2 to hơn, bóng đuổi, cắt cỏ · T3 nhát chốt MỘT trăng to ×1,2 mạnh hơn (T4 ×1,3, T5 ×1,4) · T4 trăng sà đất xẻ rãnh đỏ, cây trên đường đổ · T5 thêm nhảy xoáy phóng một trăng khổng lồ quét cả hành lang. Tán Tinh: quạt 3 trăng/nhát · Truy Tinh: 2 nhát, trăng đuổi.',
    anh_bo: 'Ám sát, tầm 14 m: hạ thấp → tan thành mực → chuỗi ẢNH MỰC lướt vòng cung ra sau lưng địch (vệt mực loang trên đất) → hiện chếch sau lưng, ĐÂM XUYÊN (máu–mực phụt ra trước), hai nhát cứa in CHỮ X đỏ–đen, địch khựng rỉ máu → X bung máu–mực, địch bị hất → vẩy kiếm, vệt máu trên đất, thu thế. T2 thêm một bước ảnh, X to hơn · T3 thêm nét ngang ⇒ ✳ · T4 dấu X in xuống đất, nứt, cỏ đứt vòng · T5 ba ảnh mực chém trước, nhát bổ dọc kết liễu: đại phá vùng + X rạn đỏ. Phân Thân: ảnh mực lao tới thêm nét dọc · Quỷ Ảnh: ẩn thân 1,5 s, đòn kế ×1,5.',
    phi_hong: 'MỘT trăng duy nhất. Mực tụ chân (lấy đà) → đạp đất bật (lún, nứt) → xoáy trên không → treo trên đỉnh → BỔ: trăng sinh ra theo đường mũi kiếm từ trên xuống, lớn dần như vệt chém dày → tách khỏi kiếm bay thẳng tới đích (lưng cong hướng tới) → cắm xuống, cày dọc đúng đường bay: đường XẺ DỌC chạy theo hướng bổ, đất tách đôi, đá hai bên lật lên. T2 xoáy hai vòng, xẻ 8,5 m · T3 lướt tới rồi mới bật, đá lật nhiều hơn · T4 xẻ 13 m, phá vật dọc đường, cuối đường gai đá · T5 đại phá vùng, đường xẻ chạy tới chân núi, xẻ núi sập một mảng. Thâm Uyên: vũng máu 3 s rút máu · Tam Lạc: ba cú bổ nối nhau, mỗi cú một trăng + xẻ ngắn.',
    thien_tinh: 'Nghi thức kiếm trận: KẾT ẤN — ấn dưới chân, trận đồ Bắc Đẩu + hai vòng vạch chia vẽ dần trên đất quanh đích → GIƠ KIẾM — bảy khe hư không mở trên trời, bảy kiếm thật to được rút ra, xoay một vòng, treo thành Bắc Đẩu (nét sao nối) → KIẾM CHỈ — cả trận lượn xoắn thành vòng xoay trên đích → giáng có nhịp, cắm đúng bảy sao trên đất → KẾT TRẬN: rạn đỏ nối bảy kiếm, kiếm khí đỏ vọt lên, đất nổ. T2 thêm vòng rạn quanh trận · T3 kiếm to hơn · T4 trận rộng, nổ cấp 2, cây đổ, sóng đất · T5 khe lớn mở, kiếm khổng lồ giáng giữa trận, đại phá cả vùng. Bắc Đẩu: 7 kiếm quay quanh thân 4 s · Lưu Tinh Vũ: 14 kiếm, giáng ngẫu nhiên.',
    huyet_nguyet: 'Lùi nửa bước thu kiếm → hạ thấp TỤ LỰC (xoáy mực–máu quanh thân, vòng đỏ co về, dải báo rộng theo cỡ lưỡi) → BẠT KIẾM IAI lướt tới, LƯỠI LIỀM NGANG khổng lồ mực–máu (lưng cong hướng tới, bay thẳng tới đích ngang ngực, qua đích 8 m) → xoay người chém nối, lưỡi thứ hai chéo → vẩy máu, tra kiếm. Cỡ tăng theo tầng: T1 rộng ~9 m · T2 xẻ rãnh · T3 lưỡi dày hơn · T4 ~14 m, ba rãnh dài, cây/đèn đổ · T5 ~19 m, đại phá vùng trước mặt, năm rãnh song song, lưỡi bay tới chân núi xẻ sập một mảng, rồi lưỡi dọc khổng lồ bổ xuống đỉnh — SẬP CẢ NGỌN NÚI. Song Nguyệt: hai lưỡi bay song song (trên–dưới) cùng tới đích · Đoạt Mệnh: lưỡi mảnh, Đoạn Mệnh 35 %, hút 15 % máu.',
  },
  tuThe: TU_THE,
  theThu: 'HNC_THU', theDo: 'HNC_DO',
  soNhat: 7, danh, lon,
  chieu: { tan_nguyet: chieu(Z), anh_bo: chieu(X), phi_hong: chieu(Cc), thien_tinh: chieu(V), huyet_nguyet: chieu(R) },
});
})();
