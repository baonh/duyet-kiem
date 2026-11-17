"use strict";
// ============================================================================
// bo_huyet_nguyet.js — 2026-11-14 — HUYẾT NGUYỆT KIẾM ĐIỂN (bản SOULSLIKE đang chạy trong game) cho Phòng duyệt Kiếm.
//
// Nhánh code đang chạy (đã đọc C#): HuyetNguyetSoul.Bat = true (mặc định) ⇒ KiemPhapHuyetNguyet.ThiTu chuyển chiêu Z X C V R
//   sang HuyetNguyetSoul.Thi ⇒ kịch bản HuyetNguyetNhap.Chieu.* (HuyetNguyetNhapChieu.cs) trên bộ chạy HuyetNguyetNhapChay
//   (CD_CHIEU); đòn thường 7 nhát = HuyetNguyetSoulCombo (bảng combo kiếm chỉnh theo lịch nháp) + HuyetNguyetNhap.Combo.Nhat
//   (CD_COMBO: động tác + vệt). Bộ cũ KiemPhapHuyetNguyet (trăng 22 m/s, vút 8,5 m…) và thư mục HuyetNguyet/ (Luyện Kiếm Đài F8)
//   KHÔNG chạy khi cầm kiếm đánh thường ⇒ không dựng.
// Tầng: kịch bản soul KHÔNG rẽ theo tầng / nhánh. Tầng 2: CongPhapVuKhi.PhatVFXTang bỏ lớp VFX chung cho bộ này (tang < 3 ⇒ return).
//   Tầng ≥ 3: TuyetKyWeb.KhiRaChieuHN (vẫn gọi trong nhánh soul) chồng lớp "viết tay" (TuyetKyWebBo.cs HuyetNguyet + nhánh), tầng 4
//   chiêu R: VienMan, tầng 5 chiêu R: HoaCanh (Huyết Nguyệt Đương Không) — mốc của lớp này theo lịch BỘ CŨ (.21/.37/.53, .88…).
// Thời gian: mốc Hen / clip = giây MÔ PHỎNG (chép nguyên); tham số vệt / hạt / vết mực của Soul* là giây THẬT ⇒ × 0,75 khi đổi.
// ============================================================================
(function () {
const DK = window.DK, T = DK.T, V3 = DK.V3, vfx = DK.vfx;
const NHIP = 0.75;
const LEN = new V3(0, 1, 0);

// ---------------------------------------------------------------- tư thế (HuyetNguyetNhapDongTac.TT — chép nguyên chuỗi)
const CHAN_KHONG = ' lR:-66,0,-8 sR:104 cR:25 lL:-18,0,8 sL:96 cL:35';
const TU_THE = [
  'HNN_THU',   'tor:8,-6 head:-6,6 aR:-10,0,-16 fR:-16 hR:0,-10,-18 w:60 aL:-8,0,12 fL:-18 hL:-24,-15,8 lR:-18,0,-6 sR:28 lL:14,0,6 sL:24 ao:6',
  'HNN_N1_W',  'tor:16,-62,-8 head:-12,52 aR:-62,0,-86 fR:-30 w:80 aL:-55,0,30 fL:-80 lR:-40,0,-12 sR:66 lL:34,0,10 sL:58 ao:14',
  'HNN_N1_S',  'tor:34,55,8 head:-26,-44 aR:-62,0,52 fR:-6 w:92 aL:-10,0,46 fL:-40 lR:-66,0,-12 sR:88 lL:40,0,10 sL:30 ao:40 toc:20',
  'HNN_N1_G',  'tor:38,64,10 head:-28,-52 aR:-50,0,62 fR:-10 w:100 aL:-6,0,44 fL:-38 lR:-68,0,-12 sR:90 lL:42,0,10 sL:30 ao:46 toc:26',
  'HNN_N2_W',  'tor:42,52,14 head:-30,-40 aR:-4,0,48 fR:-30 w:110 aL:-6,0,36 fL:-56 lR:-64,0,-12 sR:94 lL:38,0,10 sL:46 ao:30',
  'HNN_N2_S',  'tor:-6,-66,-14 head:-14,48 aR:-162,0,-96 fR:-4 w:80 aL:-24,0,34 fL:-56 lR:-34,0,-10 sR:46 lL:34,0,10 sL:40 cL:20 ao:30 jy:.04',
  'HNN_N2_G',  'tor:-12,-72,-16 head:-10,54 aR:-172,0,-102 fR:-8 w:74 aL:-20,0,36 fL:-52 lR:-32,0,-10 sR:44 lL:34,0,10 sL:40 cL:20 ao:34 toc:20 jy:.04',
  'HNN_N3_W',  'tor:-6,-50,-10 head:-6,42 aR:-176,0,-40 fR:-52 w:70 aL:-60,0,30 fL:-80 lR:-36,0,-10 sR:54 lL:30,0,10 sL:50 ao:10',
  'HNN_N3_S',  'tor:50,48,12 head:-38,-38 aR:-40,0,40 fR:-4 w:96 aL:-4,0,40 fL:-36 lR:-76,0,-12 sR:102 lL:46,0,10 sL:30 ao:50 toc:30',
  'HNN_N3_G',  'tor:54,56,14 head:-40,-44 aR:-30,0,46 fR:-8 w:104 aL:0,0,42 fL:-34 lR:-78,0,-12 sR:104 lL:46,0,10 sL:30 ao:54 toc:34',
  'HNN_N4_W',  'tor:18,-46 head:-14,40 aR:32,0,-36 fR:-124 w:90 aL:-58,0,22 fL:-60 lR:-42,0,-8 sR:66 lL:34,0,8 sL:58 ao:12',
  'HNN_N4_S',  'tor:44,16 head:-38,-14 aR:-128,0,-4 fR:0 w:90 aL:36,0,30 fL:-20 lR:-90 sR:102 lL:60 sL:6 cL:30 ao:54',
  'HNN_N4_G',  'tor:46,18 head:-40,-16 aR:-132,0,-2 fR:0 w:90 aL:40,0,32 fL:-16 lR:-92 sR:104 lL:62 sL:6 cL:32 ao:58 toc:30',
  'HNN_N5_W',  'tor:32,46,6 head:-24,-36 aR:-58,0,44 fR:-64 w:150 aL:-28,0,14 fL:-64 lR:-58,0,-14 sR:90 lL:34,0,14 sL:66 ao:24',
  'HNN_N5_S',  'tor:24,0 head:-16,0 aR:-90,0,-96 fR:0 w:90 aL:-70,0,60 fL:-40 lR:-50,0,-14 sR:74 lL:40,0,14 sL:56 ao:52 toc:30',
  'HNN_N6_V',  'tor:4,-30,-6 head:-4,24 aR:-140,0,-50 fR:-84 w:62 aL:-60,0,30 fL:-72 lR:-40,0,-8 sR:56 lL:28,0,8 sL:44 ao:10',
  'HNN_N6_M',  'tor:30,0 head:-24,0 aR:-122,0,-8 fR:-22 w:88 aL:-122,0,8 fL:-22 lR:-58,0,-8 sR:78 lL:36,0,8 sL:54 ao:22',
  'HNN_N6_X',  'tor:46,0 head:-36,0 aR:-90,0,-8 fR:-12 w:90 aL:-90,0,8 fL:-12 lR:-70,0,-8 sR:94 lL:40,0,8 sL:62 ao:40',
  'HNN_N6_W',  'tor:-20,-8 head:10,6 aR:-190,0,-16 fR:-62 w:72 aL:-190,0,16 fL:-62 lR:-30,0,-8 sR:42 lL:24,0,8 sL:36 jy:.04',
  'HNN_N6_S',  'tor:64,0 head:-50,0 aR:-56,0,-6 fR:-6 w:90 aL:-56,0,6 fL:-6 lR:-82,0,-8 sR:110 lL:44,0,8 sL:70 ao:56',
  'HNN_N6_G',  'tor:68,0 head:-52,0 aR:-48,0,-6 fR:-4 w:96 aL:-48,0,6 fL:-4 lR:-84,0,-8 sR:112 lL:46,0,8 sL:72 ao:60 toc:30',
  'HNN_N7_W',  'tor:36,46,6 head:-26,-36 aR:-58,0,44 fR:-64 w:150 aL:-28,0,14 fL:-64 lR:-70,0,-14 sR:110 lL:38,0,14 sL:84 ao:24',
  'HNN_N7_J',  'tor:15,0 head:-12,0 aR:-90,0,-95 fR:0 w:90 aL:-70,0,60 fL:-40 ao:50 toc:40 cham:0 jy:.62' + CHAN_KHONG,
  'HNN_N7_T',  'tor:-16,-8 head:6,6 aR:-190,0,-16 fR:-34 w:90 aL:-190,0,16 fL:-34 ao:-20 toc:-20 cham:0 jy:.5' + CHAN_KHONG,
  'HNN_N7_S',  'tor:66,0 head:-50,0 aR:-56,0,-6 fR:-6 w:90 aL:-56,0,6 fL:-6 lR:-86,0,-8 sR:116 lL:46,0,8 sL:76 ao:60 toc:40',
  'HNN_Z_TU',  'tor:34,-58 head:-22,52 aR:26,0,-58 fR:-14 w:112 aL:-80,0,14 fL:-18 lR:-80,0,-8 sR:102 lL:42,0,10 sL:80 ao:22',
  'HNN_Z_S',   'tor:48,58,10 head:-38,-48 aR:-66,0,58 fR:0 w:90 aL:14,0,44 fL:-18 lR:-84,0,-10 sR:100 lL:60,0,10 sL:12 cL:30 ao:64 toc:40',
  'HNN_X_LAO', 'tor:66,-10 head:-50,10 aR:40,0,-30 fR:-10 w:120 aL:30,0,20 fL:-30 lR:-72 sR:84 lL:52 sL:62 ao:72 toc:60',
  'HNN_C_TU',  'tor:38,-44 head:-24,40 aR:12,0,-62 fR:-22 w:104 aL:-60,0,24 fL:-90 lR:-90,0,-6 sR:118 lL:18,0,6 sL:120 ao:24',
  'HNN_C_LEN', 'tor:-18,34 head:-30,-20 aR:-200,0,30 fR:-10 w:90 aL:-50,0,40 fL:-40 ao:-40 toc:-40 cham:0 jy:1.7' + CHAN_KHONG,
  'HNN_C_DINH','tor:-24,-6 head:12,6 aR:-196,0,-14 fR:-56 w:70 aL:-196,0,14 fL:-56 ao:-10 toc:-10 cham:0 jy:3.0' + CHAN_KHONG,
  'HNN_C_BO',  'tor:58,0 head:-46,0 aR:-60,0,-6 fR:-6 w:90 aL:-60,0,6 fL:-6 lR:-40,0,-8 sR:40 lL:20,0,8 sL:30 ao:-30 toc:-40 cham:0 jy:.7',
  'HNN_AN',    'tor:8,-24 head:-8,18 aR:-12,0,-30 fR:-30 w:150 aL:-74,0,6 fL:-126 lR:-36,0,-8 sR:52 lL:28,0,8 sL:44 ao:10',
  'HNN_CHI',   'tor:10,-28 head:-10,22 aR:-94,0,-8 fR:0 w:150 aL:-20,0,30 fL:-50 lR:-40,0,-7 sR:60 lL:30,0,7 sL:46 ao:12',
  'HNN_R_TU',  'tor:44,-38 head:-32,38 aR:-70,0,55 fR:-70 w:-160 aL:-40,0,10 fL:-80 lR:-82,0,-12 sR:110 lL:52,0,12 sL:52 ao:30',
  'HNN_R_S',   'tor:50,62,10 head:-40,-52 aR:-70,0,64 fR:0 w:90 aL:20,0,46 fL:-14 lR:-92,0,-10 sR:104 lL:66,0,10 sL:8 cL:34 ao:70 toc:50',
  'HNN_R_VAY', 'tor:30,10 head:-20,-6 aR:-30,0,-50 fR:-10 w:120 aL:-10,0,30 fL:-40 lR:-60,0,-10 sR:80 lL:40,0,10 sL:40 ao:30',
  'HNN_DO',    'tor:6,-32 head:-10,26 aR:-95,0,-8 fR:-60 w:80,70,0 aL:-85,0,30 fL:-85 lR:-62,0,-14 sR:94 lL:54,0,14 sL:44 ao:12',
  'HNN_DO_NAY','tor:-8,-30 head:-18,26 aR:-122,0,-20 fR:-42 w:90,70,0 aL:-112,0,30 fL:-60 lR:-64,0,-14 sR:104 lL:56,0,14 sL:54 ao:6',
  'HNN_GAT',   'tor:-8,-46 head:-8,34 aR:-150,0,-72 fR:-30 w:60,40,0 aL:-50,0,40 fL:-70 lR:-42,0,-10 sR:56 lL:40,0,10 sL:46 ao:12',
  'HNN_LON',   'tor:82 head:-24 aR:-62,0,-18 fR:-92 w:150 aL:-62,0,18 fL:-92 lR:-112 sR:142 lL:-100 sL:142 ao:70 cham:0 jy:-.42',
  'HNN_DAP',   'tor:36,-12 head:-24,10 aR:-10,0,-40 fR:-20 w:150 aL:-34,0,50 fL:-30 lR:-70,0,-12 sR:108 lL:18,0,12 sL:110 cL:20 ao:30',
];

// ---------------------------------------------------------------- tiện ích
/** DT.Mv(k, t phải tới …) — chuỗi mv nhân hệ số quãng k, ease 'o' */
function Mv(k, ...a) { const s = []; for (let i = 0; i + 2 < a.length; i += 3) s.push(+a[i].toFixed(3) + ' ' + +(a[i + 1] * k).toFixed(3) + ' ' + +(a[i + 2] * k).toFixed(3) + ' o'); return s.join('; '); }
/** DT.Clip — than 2, uu 9 (mặc định DK.clip); ex xoay / lon / tam; moc.huy = mốc nối */
function Clip(ten, khoa, mv, ex, huy) { return DK.clip(ten, khoa, mv || null, huy != null ? { huy } : null, ex || null); }
const rr = (a, b) => a + Math.random() * (b - a);
/** xoay hướng ngang v quanh trục đứng `deg` độ, dương = sang PHẢI (như Quaternion.AngleAxis(deg, up) của Unity) */
function xoayY(v, deg) { const r = deg * DK.D, c = Math.cos(r), s = Math.sin(r); return new V3(v.x * c - v.z * s, v.y, v.z * c + v.x * s); }
/** bên phải của hướng f (Cross(up, f) của Unity) */
const ben = f => new V3(-f.z, 0, f.x).normalize();
const ngucCua = b => new V3(b.pos.x, b.pos.y + 1.15, b.pos.z);

// màu (SoulThamSo + TuyetKyWeb) — Soul* đi theo màu thanh kiếm (ctx.mau); lớp tuyệt kỹ tầng ≥ 3 dùng màu CỐ ĐỊNH như C#
const MAU_MUC = new T.Color(0.02, 0.015, 0.018), MAU_SANG = new T.Color(0.95, 0.92, 0.92), MAU_BUI = new T.Color(0.32, 0.31, 0.31), MAU_TIA = new T.Color(1, 0.93, 0.82);
const TK_DO = new T.Color(1, .12, .2), TK_DO_DAM = new T.Color(.75, .02, .08), TK_TIM = new T.Color(.62, .3, 1);

// ================================================================ VỆT MỰC (SoulVetMuc — cung / thẳng / dải; thời gian GIÂY THẬT)
function moVet(o) {
  return Object.assign({ r0: 0, r1: 0, tgQuet: .1, tgSong: .16, tgTan: .14, doDai: .85, non: 0, xoan: 0, vanToc: null, camToc: 0, soSoi: 14, tiLeDo: .36, duoiMong: .22, hienNgay: false, hatKhiTan: true }, o);
}
const _a = new V3(), _b = new V3(), _o = new V3(), _i = new V3();
function laMau(arr, u, out) { const n = arr.length, f = DK.clamp(u, 0, 1) * (n - 1), i = Math.min(n - 2, Math.floor(f)); return out.lerpVectors(arr[i], arr[i + 1], f - i); }
/** dải tổng quát: ngoai[i] / trong[i] (thế giới). Lớp: mực (đặc, gần đen) + dải màu nhấn giữa + vạch sáng mảnh mép ngoài. */
function veDai(ngoai, trong, o, mau) {
  // 2026-11-14 — tích hợp: lớp vệt theo phẩm / mốc +N của vu_khi.js (game: HieuUngVuKhi bám vệt Soul)
  if (DK.VKH && DK.VKH.theoDoiDai) { try { DK.VKH.theoDoiDai(ngoai, trong, o); } catch (e) { DK.baoLoi(e); } }
  if (DK.VKH && DK.VKH.mauNhan && !mau) mau = DK.VKH.mauNhan();
  o = moVet(o);
  const n = ngoai.length; let daiCung = 0; for (let i = 1; i < n; i++) daiCung += ngoai[i].distanceTo(ngoai[i - 1]);
  const M = 40, g = new T.Group(), lop = [];
  const lopMoi = (c, op, a, b, cong) => {
    const geo = new T.BufferGeometry(); const P = new Float32Array(M * 6), C = new Float32Array(M * 8);
    geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setAttribute('color', new T.BufferAttribute(C, 4));
    const I = []; for (let i = 0; i < M - 1; i++) { const k = i * 2; I.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } geo.setIndex(I);
    const m = new T.Mesh(geo, new T.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: T.DoubleSide, blending: cong ? T.AdditiveBlending : T.NormalBlending }));
    m.frustumCulled = false; m.renderOrder = cong ? 8 : 6; g.add(m); lop.push({ geo, c, op, a, b });
  };
  const nhan = vfx.mau(mau);
  lopMoi(MAU_MUC, .9, 0, 1, false);                                                // lõi mực
  const d = DK.clamp(o.tiLeDo, .1, .95) * .62;
  lopMoi(nhan, .95, .5 - d, .5 + d, false);                                         // sợi màu nhấn (dồn giữa dải)
  lopMoi(MAU_SANG, .5, .05, .1, true);                                             // vạch sáng mảnh
  const off = new V3(), vt = o.vanToc ? o.vanToc.clone() : null;
  const tq = Math.max(.01, o.tgQuet), ts = Math.max(0, o.tgSong), tt = Math.max(.02, o.tgTan), dd = DK.clamp(o.doDai, .05, 1.5);
  let tR = 0, raHat = false;
  return vfx.them(g, (tq + ts + tt + .03) * NHIP, (dt) => {
    tR += dt / NHIP;                                                                // đồng hồ giây thật như Unity
    if (vt) { off.addScaledVector(vt, dt / NHIP); if (o.camToc > 0) vt.multiplyScalar(Math.exp(-o.camToc * dt / NHIP)); }
    let dau, duoi, tan = 0;
    if (o.hienNgay) { dau = 1; duoi = 0; if (tR > tq + ts) tan = (tR - tq - ts) / tt; }
    else if (tR < tq) { const x = tR / tq, e = 1 - Math.pow(1 - x, 4); dau = Math.max(.001, e); duoi = dau - dd; }
    else { dau = 1; const k = DK.clamp((tR - tq) / Math.max(.01, ts + tt), 0, 1); duoi = DK.lerp(1 - dd, 1 - dd * .35, k); if (tR > tq + ts) tan = (tR - tq - ts) / tt; }
    if (tan > 0 && o.hatKhiTan && !raHat) {
      raHat = true; const so = DK.clamp(Math.round(daiCung * 3), 4, 26);
      for (let k = 0; k < so; k++) { laMau(ngoai, rr(.25, 1), _a).add(off); no(_a.clone(), LEN, 1, .6, 2.2, 1, Math.random() < o.tiLeDo ? nhan : MAU_MUC, .055, .5, 14 * .35); }
    }
    const s0 = Math.max(0, duoi), s1 = dau, an = DK.clamp(1 - tan, 0, 1);
    for (const L of lop) {
      const P = L.geo.attributes.position.array, C = L.geo.attributes.color.array;
      for (let j = 0; j < M; j++) {
        const u = s0 + (s1 - s0) * j / (M - 1);
        laMau(ngoai, u, _o).add(off); laMau(trong, u, _i).add(off);
        const gg = DK.clamp((u - duoi) / Math.max(1e-3, dau - duoi), 0, 1), wk = DK.lerp(o.duoiMong, 1, gg);
        _i.sub(_o).multiplyScalar(wk);                                              // bề rộng thu ở đuôi (mép ngoài giữ)
        _a.copy(_o).addScaledVector(_i, L.a); _b.copy(_o).addScaledVector(_i, L.b);
        P[j * 6] = _a.x; P[j * 6 + 1] = _a.y; P[j * 6 + 2] = _a.z; P[j * 6 + 3] = _b.x; P[j * 6 + 4] = _b.y; P[j * 6 + 5] = _b.z;
        const al = s1 > s0 ? L.op * an * (.2 + .8 * gg) : 0;
        for (let q = 0; q < 2; q++) { const z = j * 8 + q * 4; C[z] = L.c.r; C[z + 1] = L.c.g; C[z + 2] = L.c.b; C[z + 3] = al; }
      }
      L.geo.attributes.position.needsUpdate = true; L.geo.attributes.color.needsUpdate = true;
    }
  });
}
/** SoulVetMuc.Cung — tâm/hướng/pháp tuyến THẾ GIỚI đã đổi; quay trong hệ CỤC BỘ (xem Ch.vetCB) */
/** SoulVetMuc.Thang: nét thẳng a → b rộng `rong` theo `ngang` */
function vetThang(a, b, ngang, rong, o, mau) {
  const ng = ngang.clone().normalize(), N = [], I = [];
  for (let i = 0; i < 16; i++) { const p = new V3().lerpVectors(a, b, i / 15); I.push(p.clone().addScaledVector(ng, -rong / 2)); N.push(p.clone().addScaledVector(ng, rong / 2)); }
  return veDai(N, I, o, mau);
}

// ================================================================ HẠT VOXEL (SoulVoxel — tốc m/s thật, sống giây thật)
/** SoulVoxel.No(p, huong, so, tocMin, tocMax, tan, mau, co, song, trongLuc) */
function no(p, huong, so, tMin, tMax, tan, mau, co, song, trongLuc) {
  const g = trongLuc == null || trongLuc < 0 ? 14 : trongLuc;
  vfx.hat(p, { so, mau, toc: (tMin + tMax) / 2 / NHIP, huong: huong.clone(), loe: tan * 1.6, co: co * 1.1, song: song * NHIP, trongLuc: g / (NHIP * NHIP), can: .8 / NHIP, to: true, lech: co * .5 });
}
/** SoulVoxel.Bui — bụi ô vuông bung vòng tròn bán kính r */
function bui(p, r, so) {
  for (let i = 0; i < so; i++) {
    const a = Math.random() * Math.PI * 2, d = new V3(Math.cos(a), 0, Math.sin(a));
    const pp = p.clone().addScaledVector(d, r * rr(.2, 1)); pp.y += .05;
    const v = d.clone().multiplyScalar(rr(1.5, 4.5)).add(new V3(0, rr(1.5, 5), 0));
    vfx.hat(pp, { so: 1, mau: Math.random() < .75 ? MAU_BUI : MAU_MUC, toc: v.length() / NHIP, huong: v, loe: 0, co: .07 * rr(.8, 1.8), song: rr(.6, 1.2) * NHIP, trongLuc: 14 / (NHIP * NHIP), can: .8 / NHIP, to: true });
  }
}

// ================================================================ VẾT MỰC TRÊN ĐẤT (SoulVFX.MucDat — kieu 0 nứt toả, 1 vòng báo nở)
const _texMuc = {};
function texMuc(kieu, mau, bien) {
  const khoa = kieu + '_' + mau.getHexString() + '_' + bien; if (_texMuc[khoa]) return _texMuc[khoa];
  const N = 64, cv = document.createElement('canvas'); cv.width = cv.height = N; const g = cv.getContext('2d');
  const muc = 'rgb(6,4,5)', nh = '#' + mau.getHexString();
  const o = (x, y, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), 1, 1); };
  if (kieu === 1) {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const r = Math.hypot(x + .5 - N / 2, y + .5 - N / 2) / (N / 2);
      if (r > .86 && r < 1) o(x, y, Math.random() < .25 ? nh : muc);
      else if (r > .8 && r <= .86 && Math.random() < .6) o(x, y, nh);
      else if (r < .8 && Math.random() < .05 * r) o(x, y, muc);
    }
  } else {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const r = Math.hypot(x + .5 - N / 2, y + .5 - N / 2) / (N / 2); if (r < .2 + Math.random() * .08) o(x, y, Math.random() < .2 ? nh : muc); }
    const soNut = 7 + bien * 2;
    for (let k = 0; k < soNut; k++) {
      let a = k / soNut * Math.PI * 2 + rr(-.3, .3), x = N / 2, y = N / 2; const L = rr(.55, .98) * N / 2;
      for (let s = 0; s < L; s++) { a += rr(-.35, .35); x += Math.cos(a); y += Math.sin(a); const w = s < L * .5 ? 1 : 0; o(x, y, muc); if (w) o(x + 1, y, muc); if (s % 3 === 0 && s > 4) o(x, y + 1, nh); }
    }
  }
  const t = new T.CanvasTexture(cv); t.magFilter = T.NearestFilter; t.minFilter = T.NearestFilter; t.encoding = T.sRGBEncoding;
  return (_texMuc[khoa] = t);
}
let _lopDat = 0;
function mucDat(p, co, kieu, song, tan, noT, mau) {
  tan = tan == null ? .5 : tan; noT = noT == null ? .12 : noT;
  const m = new T.Mesh(new T.PlaneGeometry(co, co), new T.MeshBasicMaterial({ map: texMuc(kieu, vfx.mau(mau), Math.floor(Math.random() * 3)), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  m.rotation.set(-Math.PI / 2, 0, Math.random() * Math.PI * 2, 'YXZ'); m.rotation.order = 'YXZ'; m.rotation.y = Math.random() * Math.PI * 2;
  _lopDat = (_lopDat + 1) % 20; m.position.set(p.x, p.y + .015 + _lopDat * .0008, p.z); m.renderOrder = 2;
  let tR = 0;
  return vfx.them(m, (song + tan + .02) * NHIP, (dt) => {
    tR += dt / NHIP;
    let lon = kieu === 1 ? DK.clamp(tR / Math.max(.01, noT), 0, 1) : 1; lon = 1 - (1 - lon) * (1 - lon);
    m.scale.setScalar(Math.max(.01, lon));
    m.material.opacity = tR > song ? DK.clamp(1 - (tR - song) / tan, 0, 1) : 1;
  });
}

// ================================================================ CÚ TRÚNG (SoulVFX.Trung + DK.trung)
function trungFx(diem, huong, doNang, mau) {
  const h = huong.clone(); if (h.lengthSq() < 1e-6) h.set(0, 0, 1); h.normalize();
  const so = 10 + doNang * 10, c = vfx.mau(mau), sam = c.clone().multiplyScalar(.45);
  no(diem, h.clone().add(new V3(0, .25, 0)), so, 3, 7 + doNang * 2, .45, c, .07, .7);
  no(diem, h, Math.floor(so / 2), 2, 6, .6, MAU_MUC, .084, .6);
  no(diem, h.clone().negate().add(new V3(0, .3, 0)), 3 + doNang * 2, 1, 3, .8, sam, .056, .5);
  const nhin = new V3().subVectors(diem, DK.cam.position).normalize(); let ng = new V3().crossVectors(h, nhin); if (ng.lengthSq() < 1e-4) ng.set(0, 1, 0);
  const L = .9 + doNang * .45;
  vetThang(diem.clone().addScaledVector(h, -L / 2), diem.clone().addScaledVector(h, L / 2), ng, .12 + doNang * .05, { tgQuet: .035, tgSong: .05 + doNang * .03, tgTan: .1, soSoi: 6, hatKhiTan: false }, c);
  DK.rung(doNang <= 0 ? .12 : doNang === 1 ? .18 : .22, .25);
}
/** SoulVFX.TiaLua — tia lửa kim loại khi đỡ */
function tiaLua(diem, huongBat, doNang) {
  vfx.hat(diem, { so: 18 + doNang * 10, mau: MAU_TIA, toc: 9 / NHIP, huong: huongBat, loe: 1, co: .03, song: .32 * NHIP, trongLuc: 9 / (NHIP * NHIP), sang: 1.6 });
}

// ================================================================ BỘ CHẠY một lần ra đòn (HuyetNguyetNhapChay rút gọn)
function Ch(ctx) {
  const nv = ctx.nv, c = { nv, ctx, mau: ctx.mau, dich: ctx.dich, t0: DK.now, matDat: nv.pos.y, np: nv.pos.clone(), ny: nv.yaw };
  c.T = () => DK.now - c.t0;
  c.hen = (t, fn) => DK.sau(Math.max(0, t - c.T()), fn);
  c.moiKhung = (fn) => DK.lap((dt) => fn(c.T(), dt));
  c.neo = () => { c.np = nv.pos.clone(); c.ny = nv.yaw; };
  c.neoTheo = (h) => { c.np = nv.pos.clone(); c.ny = Math.atan2(h.x, h.z); };
  c.f = () => new V3(Math.sin(c.ny), 0, Math.cos(c.ny));
  c.r = () => new V3(-Math.cos(c.ny), 0, Math.sin(c.ny));
  /** điểm cục bộ theo neo (x phải, y lên, z tới) */
  c.LN = (x, y, z) => c.np.clone().addScaledVector(c.r(), x).addScaledVector(c.f(), z).add(new V3(0, y, 0));
  c.HN = (x, y, z) => new V3().addScaledVector(c.r(), x).addScaledVector(c.f(), z).add(new V3(0, y, 0));
  c.coDich = () => !!c.dich;
  c.dichChan = () => c.dich ? c.dich.pos.clone() : c.LN(0, 0, 2.4);
  c.dichNguc = () => c.dichChan().add(new V3(0, 1.15, 0));
  c.kcDich = () => c.dich ? Math.hypot(c.dich.pos.x - nv.pos.x, c.dich.pos.z - nv.pos.z) : 2.4;
  c.kcDichTuNeo = () => c.dich ? new V3().subVectors(c.dich.pos, c.np).dot(c.f()) : 2.4;
  c.huongDich = () => { if (!c.dich) return nv.toi(); const d = new V3().subVectors(c.dich.pos, nv.pos); d.y = 0; return d.lengthSq() > 1e-4 ? d.normalize() : nv.toi(); };
  c.quayVeDich = () => { if (c.dich) nv.ngam(c.dich.pos); c.neo(); };
  c.heSoMv = (quang, cach, toiThieu) => { if (!c.dich || quang <= 0) return 1; return DK.clamp(Math.max(0, c.kcDich() - (cach == null ? 1.4 : cach)) / quang, toiThieu || 0, 1); };
  c.phat = (clip, tron, op) => DK.phat(nv, clip, Object.assign({ tron }, op || {}));
  c.rung = (k) => DK.rung(k, .3);
  /** VetCB: tâm / hướng đầu / pháp tuyến theo hệ CỤC BỘ của neo (Unity x phải y lên z tới), quét `goc` độ quanh pháp tuyến */
  c.vetCB = (tam, d0, phap, goc, r0, r1, tgThuc, non, xoan, sua) => {
    const o = moVet({ r0, r1, tgQuet: tgThuc, non: non == null ? -.25 : non, xoan: xoan || 0 }); if (sua) sua(o);
    const P = phap.clone().normalize(); let h0 = d0.clone().addScaledVector(P, -d0.dot(P)); if (h0.lengthSq() < 1e-6) h0 = new V3().crossVectors(P, new V3(1, 0, 0)); h0.normalize();
    const n = DK.clamp(Math.ceil(Math.abs(goc) / 3.5), 12, 160), q = new T.Quaternion(), NG = [], TR = [];
    const rong = o.r1 - o.r0;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1); q.setFromAxisAngle(P, goc * u * DK.D); const d = h0.clone().applyQuaternion(q);
      const nang = P.clone().multiplyScalar(o.xoan * u);
      const ti = tam.clone().addScaledVector(d, o.r0).add(nang), ng = tam.clone().addScaledVector(d, o.r0 + rong).add(nang).addScaledVector(P, o.non);
      TR.push(c.LN(ti.x, ti.y, ti.z)); NG.push(c.LN(ng.x, ng.y, ng.z));
    }
    if (o.vanToc && o.vanToc.cucBo) { const v = o.vanToc; o.vanToc = c.HN(v.x, v.y, v.z); }
    return veDai(NG, TR, o, c.mau);
  };
  /** VetNgang: cung chém quanh tâm cục bộ, yaw bắt đầu (0 tới, 90 phải), quét `goc`, lăn mặt phẳng `lan` độ */
  c.vetNgang = (tam, yawDau, goc, lan, r0, r1, tg, non, xoan, sua) => {
    const R = new T.Quaternion().setFromAxisAngle(new V3(0, 0, 1), lan * DK.D);
    const phap = new V3(0, 1, 0).applyQuaternion(R);
    const d0 = new V3(0, 0, 1).applyQuaternion(new T.Quaternion().setFromAxisAngle(new V3(0, 1, 0), yawDau * DK.D)).applyQuaternion(R);
    return c.vetCB(tam, d0, phap, goc, r0, r1, tg, non == null ? -.25 : non, xoan, sua);
  };
  /** VetDoc: cung bổ dọc (mặt phẳng chứa hướng tới, lệch `lechYaw` để máy sau lưng thấy dải) */
  c.vetDoc = (tam, ngaSau, goc, lechYaw, r0, r1, tg, non, sua) => {
    const phap = new V3(1, 0, 0).applyQuaternion(new T.Quaternion().setFromAxisAngle(new V3(0, 1, 0), lechYaw * DK.D));
    const len = new V3(0, 1, 0).addScaledVector(phap, -phap.y).normalize();
    const d0 = len.applyQuaternion(new T.Quaternion().setFromAxisAngle(phap, -ngaSau * DK.D));
    return c.vetCB(tam, d0, phap, goc, r0, r1, tg, non == null ? .4 : non, 0, sua);
  };
  /** Combo.VetDat — nét mực khắc trên đất a → b */
  c.vetDat = (a, b, rong, tgQuet) => {
    a = a.clone(); b = b.clone(); a.y = b.y = c.matDat + .03;
    const d = new V3().subVectors(b, a); d.y = 0; const ng = ben(d.normalize());
    return vetThang(a, b, ng, rong, { tgQuet, doDai: 1, tgSong: .55, tgTan: .45, soSoi: 7, tiLeDo: .3, hatKhiTan: false, duoiMong: .35 }, c.mau);
  };
  c.mucDat = (p, co, kieu, song, tan, noT) => { const q = p.clone(); q.y = c.matDat; return mucDat(q, co, kieu, song, tan, noT, c.mau); };
  c.no = (p, huong, so, a, b, tan, mauMa, co, song, g) => no(p, huong, so, a, b, tan, mauMa === 'DO' ? c.mau : mauMa === 'MUC' ? MAU_MUC : mauMa === 'DO_SAM' ? c.mau.clone().multiplyScalar(.45) : mauMa, co, song, g);
  /** cú trúng có HÌNH (HinhDonHN): { quat:[tam,goc] | cau:[diem,r] | dai:[dai,nuaRong] , manh, vang, menh } */
  c.trung = (doNang, huong, hinh) => {
    let ds = [];
    if (hinh.cau) ds = DK.trongTron(hinh.cau[0], hinh.cau[1]).filter(b => Math.abs(b.pos.y + 1.1 - hinh.cau[0].y) < hinh.cau[1] + 1.3);
    else if (hinh.dai) ds = DK.trongDuong(c.np, c.np.clone().addScaledVector(c.f(), hinh.dai[0]), hinh.dai[1] * 2);
    else { const [tam, goc] = hinh.quat; ds = goc >= 360 ? DK.trongTron(nv.pos, tam) : DK.trongNon(nv, tam, goc); }
    for (const b of ds) {
      let h = huong.clone();
      if (hinh.cau || (hinh.quat && hinh.quat[1] >= 360)) { const r = new V3().subVectors(b.pos, hinh.cau ? hinh.cau[0] : nv.pos); r.y = 0; if (r.lengthSq() > 1e-4) h = r.normalize().add(new V3(0, .15, 0)); }
      const menh = hinh.menh && b.mau / b.mauMax < .25;
      if (menh) DK.chuNoi('ĐOẠN MỆNH', ngucCua(b).add(new V3(0, .8, 0)), '#ff1f33');
      DK.trung(b, { nguon: nv, st: menh ? 99999 : hinh.manh, day: hinh.vang ? Math.min(2.5, .4 + hinh.vang * .12) : .3, mau: c.mau });
      trungFx(ngucCua(b).add(new V3(rr(-.1, .1), rr(-.1, .1), rr(-.1, .1))), h, doNang, c.mau);
    }
    return ds.length;
  };
  c.an = (b) => { nv.root.visible = !b; };
  return c;
}
DK.nghe('datLai', () => { DK.nc.root.visible = true; vfx.trong(DK.nc, 1); });

// ================================================================ ĐÒN THƯỜNG 7 NHÁT (HuyetNguyetNhapCombo + HuyetNguyetSoulCombo)
const C_TG = [.66, .64, .68, .64, .72, .96, 1.22];
const C_HUY = [.38, .34, .36, .34, .46, .62, .92];
const C_TAM = [2.5, 2.5, 3.0, 3.4, 2.6, 2.9, 2.7];
const C_GOC = [150, 150, 120, 50, 360, 70, 140];
// cửa sổ trúng của DieuKhienChienDau (mốc đầu cửa sổ, manh, doNang, vang, goc riêng, tam riêng)
const C_CS = [
  [[.21, 58, 0]], [[.17, 58, 0]], [[.18, 72, 1]], [[.2, 88, 1]], [[.22, 34, 0], [.32, 34, 1, 1]], [[.33, 88, 2]],
  [[.27, 38, 0, 0, 360], [.44, 38, 0, 0, 360], [.66, 150, 3, 1, 140, 3.5]],
];
function danh(ctx, i) {
  const c = Ch(ctx);
  // mục tiêu như HuyetNguyetSoulCombo.ChonMucTieu: khoá trong 14 m, không thì gần nhất trong 9 m
  if (c.dich && !(DK.khoa === c.dich && c.kcDich() < 14) && c.kcDich() > 9) c.dich = null;
  NHAT[i](c);
  // sát thương: cửa sổ trúng của bảng combo kiếm đã chỉnh (lõi đánh), hình quạt TAM / GOC của nhát
  for (const w of C_CS[i]) c.hen(w[0], () => c.trung(w[2], c.HN(0, 0, 1), { quat: [w[5] || C_TAM[i], w[4] || C_GOC[i]], manh: w[1], vang: w[3] ? 9 : 0 }));
}
const NHAT = [
  // 1 ngang
  (c) => {
    c.quayVeDich(); const k = c.heSoMv(.66);
    c.phat(Clip('hn_c1', '0 HNN_N1_W · .2 HNN_N1_W h · .25 HNN_N1_S s · .38 HNN_N1_G o · .66 HNN_THU io', Mv(k, 0, 0, 0, .2, 0, -.06, .27, 0, .6), null, C_HUY[0]), .17);
    c.hen(.2, () => c.vetNgang(new V3(0, 1.1, .25), 125, -235, 10, .55, 1.95, .09));
  },
  // 2 chéo hất lên
  (c) => {
    c.quayVeDich(); const k = c.heSoMv(.5);
    c.phat(Clip('hn_c2', '0 HNN_N2_W · .16 HNN_N2_W h · .21 HNN_N2_S s · .34 HNN_N2_G o · .64 HNN_THU io', Mv(k, 0, 0, 0, .16, 0, 0, .23, 0, .5), null, C_HUY[1]), .14);
    c.hen(.16, () => c.vetNgang(new V3(0, 1.05, .2), -118, 228, 38, .5, 1.9, .09, -.15));
  },
  // 3 chéo bổ xuống
  (c) => {
    c.quayVeDich(); const k = c.heSoMv(.6);
    c.phat(Clip('hn_c3', '0 HNN_N3_W · .17 HNN_N3_W h · .22 HNN_N3_S s · .36 HNN_N3_G o · .68 HNN_THU io', Mv(k, 0, 0, 0, .17, 0, -.05, .24, 0, .55), null, C_HUY[2]), .15);
    c.hen(.17, () => c.vetNgang(new V3(0, 1.2, .2), 118, -222, 46, .5, 2.0, .09, -.1));
  },
  // 4 đâm
  (c) => {
    c.quayVeDich(); const k = c.heSoMv(1.25);
    c.phat(Clip('hn_c4', '0 HNN_N4_W · .16 HNN_N4_W h · .2 HNN_N4_S s · .34 HNN_N4_G o · .64 HNN_THU io', Mv(k, 0, 0, 0, .16, 0, -.15, .24, 0, 1.1), null, C_HUY[3]), .14);
    c.hen(.17, () => {
      vetThang(c.LN(.12, 1.25, .3), c.LN(.12, 1.25, 3.4), c.HN(.35, 1, 0), .42, { tgQuet: .08, doDai: 1, soSoi: 9, duoiMong: .3 }, c.mau);
      c.vetCB(new V3(.12, 1.25, 2.7), new V3(0, 1, 0), new V3(0, 0, 1), 360, .18, .62, .1, 0, 0, o => { o.soSoi = 7; o.doDai = 1; o.tiLeDo = .5; });
    });
    c.hen(.21, () => c.vetCB(new V3(.12, 1.25, 2.0), new V3(1, 0, 0), new V3(0, 0, 1), -360, .12, .4, .08, 0, 0, o => { o.soSoi = 5; o.doDai = 1; }));
  },
  // 5 xoay
  (c) => {
    c.quayVeDich(); const k = c.heSoMv(.8);
    c.phat(Clip('hn_c5', '0 HNN_N5_W · .14 HNN_N5_W h · .17 HNN_N5_S o · .38 HNN_N5_S h · .44 HNN_N1_G s · .72 HNN_THU io', Mv(k, 0, 0, 0, .15, 0, 0, .4, 0, .8), { xoay: [.15, .38, 360] }, C_HUY[4]), .14);
    c.hen(.15, () => c.vetNgang(new V3(0, 1.0, .45), 90, -385, 4, .5, 2.0, .3, -.3, .12, o => { o.doDai = .7; o.soSoi = 16; }));
  },
  // 6 bổ dọc (nặng)
  (c) => {
    c.quayVeDich(); const k = c.heSoMv(.7);
    c.phat(Clip('hn_c6', '0 HNN_N6_V · .12 HNN_N6_W io · .2 HNN_N6_W h · .29 HNN_N6_M sin · .36 HNN_N6_X l · .42 HNN_N6_S o · .56 HNN_N6_G o · .66 HNN_N6_G h · 1.0 HNN_THU io',
      Mv(k, 0, 0, 0, .22, 0, .1, .36, 0, .7), null, C_HUY[5]), .14);
    c.hen(.25, () => c.vetDoc(new V3(.1, 1.5, .35), 30, 168, 18, .5, 2.15, .08, .45));
    c.hen(.36, () => {
      const dat = c.LN(0, 0, 2.1); dat.y = c.matDat;
      c.mucDat(dat, 2.8, 0, .55, .5);
      c.vetDat(c.LN(0, 0, .8), c.LN(0, 0, 3.6), .32, .12);
      bui(dat, 1.2, 22);
    });
  },
  // 7 kết nhảy xoáy
  (c) => {
    c.quayVeDich(); const k = c.heSoMv(1.3);
    c.phat(Clip('hn_c7', '0 HNN_N7_W · .16 HNN_N7_W h · .24 HNN_N7_J o · .52 HNN_N7_J h · .6 HNN_N7_T io · .68 HNN_N7_S s · .92 HNN_N7_S h · 1.22 HNN_THU io',
      Mv(k, 0, 0, 0, .16, 0, 0, .56, 0, .9, .68, 0, 1.3), { xoay: [.18, .54, 720] }, C_HUY[6]), .15);
    c.hen(.16, () => bui(c.LN(0, 0, 0), .7, 10));
    c.hen(.19, () => c.vetNgang(new V3(0, 1.3, .4), 90, -375, 0, .5, 1.9, .24, -.3, .5, o => { o.doDai = .65; }));
    c.hen(.37, () => c.vetNgang(new V3(0, 1.8, .7), 90, -375, 0, .5, 1.9, .24, -.3, .4, o => { o.doDai = .65; }));
    c.hen(.6, () => c.vetDoc(new V3(.1, 1.9, 1.1), 25, 170, 18, .5, 2.5, .1, .5, o => { o.soSoi = 18; o.tiLeDo = .45; }));
    c.hen(.68, () => {
      const dat = c.LN(0, 0, 2.3); dat.y = c.matDat;
      c.mucDat(dat, 4.6, 0, .8, .6);
      for (let i = 0; i < 5; i++) { const a = -60 + i * 30 + rr(-8, 8); const h = xoayY(c.f(), a); c.vetDat(dat.clone().addScaledVector(h, .5), dat.clone().addScaledVector(h, rr(2.4, 3.6)), .22, .1); }
      bui(dat, 1.8, 40);
      c.no(dat, LEN, 24, 4, 9, .45, 'MUC', .1, 1);
    });
  },
];

// ================================================================ LỘN (HuyetNguyetSoulCombo.LonNe)
function lon(ctx) {
  const nv = ctx.nv, c = Ch(ctx), ph = DK.phim;
  let f = 0, r = 0; if (ph.w || ph.ArrowUp) f++; if (ph.s || ph.ArrowDown) f--; if (ph.d || ph.ArrowRight) r++; if (ph.a || ph.ArrowLeft) r--;
  let dir = nv.toi();
  if (f || r) { const fy = DK.may.yaw + Math.PI; dir = new V3(Math.sin(fy) * f - Math.cos(fy) * r, 0, Math.cos(fy) * f + Math.sin(fy) * r).normalize(); }
  c.neoTheo(dir);
  const toi = nv.toi().dot(dir) > .5;
  bui(c.LN(0, 0, 0), .45, 8);
  c.vetDat(c.LN(0, 0, .3), c.LN(0, 0, 2.6), .45, .3);
  if (toi) {
    nv.yaw = c.ny;
    c.phat(Clip('hn_lon', '0 HNN_THU · .05 HNN_LON o · .3 HNN_LON h · .36 HNN_DAP s · .5 HNN_DAP h · .72 HNN_THU io', '0 0 0 o; .33 0 3.0 o', { lon: [.03, .33, 360], tam: 1.0 }), .04);
  } else {
    // lướt lùi / ngang: clip lướt web của game (LUOT_*), quãng gần đúng 3 m theo hướng phím
    const tr = nv.phai().dot(dir), lu = nv.toi().dot(dir);
    const ten = lu < -.5 ? 'LUOT_LUI' : tr > 0 ? 'LUOT_PHAI' : 'LUOT_TRAI';
    const s = DL.CLIP[ten], loc = new V3(nv.phai().dot(dir), 0, nv.toi().dot(dir)).multiplyScalar(3);
    c.phat(Clip('hn_' + ten.toLowerCase(), s.k.map(x => x[0] + ' ' + x[1] + ' ' + (['l', 'io', 'o', 's', 'i', 'h', 'oo', 'sin', 'bat'][x[2]] || 'io')).join('; '), '0 0 0 o; .3 ' + loc.x.toFixed(2) + ' ' + loc.z.toFixed(2) + ' o'), .04);
  }
  c.hen(.36, () => { bui(nv.pos.clone(), .6, 12); DK.rung(.07, .25); });
}

// ================================================================ CHIÊU Z X C V R (HuyetNguyetNhapChieu.cs)
const TG = [1.04, 1.36, 1.45, 1.1, 2.15], HUY = [.62, 1.0, 1.05, .6, 1.25];
const TOC_TRANG = 16.5;   // m/s thật

function Z(c) {
  c.quayVeDich();
  const k = c.heSoMv(3.0, 1.6, .3);
  c.phat(Clip('hn_z', '0 HNN_Z_TU · .26 HNN_Z_TU h · .31 HNN_Z_S s · .38 HNN_N2_W o · .42 HNN_N2_S s · .5 HNN_N3_W o · .54 HNN_N3_S s · .74 HNN_N3_G o · 1.04 HNN_THU io',
    Mv(k, 0, 0, 0, .26, 0, -.1, .33, 0, 1.6, .44, 0, 2.4, .56, 0, 3.0), null, HUY[0]), .2);
  c.hen(.06, () => c.no(c.LN(.55, .7, -.5), LEN, 8, .4, 1.4, .8, 'DO', .05, .5, 1));
  c.hen(.26, () => { c.vetNgang(new V3(0, 1.1, .7), 125, -235, 10, .55, 1.95, .08); trangKhuyet(c, 8, 0, 1.6 * k); });
  c.hen(.38, () => { c.vetNgang(new V3(0, 1.05, 2.0), -118, 228, 38, .5, 1.9, .07, -.15); trangKhuyet(c, 36, 1, 2.4 * k); });
  c.hen(.5, () => { c.vetNgang(new V3(0, 1.2, 2.7), 118, -222, 46, .5, 2.0, .07, -.1); trangKhuyet(c, -34, 2, 3.0 * k); });
}
/** trăng khuyết mực bay thẳng 16,5 m/s thật; trúng (cầu 1,7 m) ở điểm đích lúc phóng */
function trangKhuyet(c, lan, thuTu, zNguoi) {
  const zTam = zNguoi - .7, r1 = 1.85;
  const quang = Math.max(0, c.kcDichTuNeo() - (zTam + r1)), bay = Math.max(.04, quang / TOC_TRANG);
  let dy = 0; const kcD = c.dich ? Math.max(1.2, c.kcDichTuNeo()) : zNguoi + 2.5;
  if (c.dich) dy = DK.clamp(c.dichNguc().y - (c.np.y + 1.15), -4, 4);
  const doc = DK.clamp(dy / Math.max(1, kcD - zTam), -.9, .9);
  const vt = new V3(0, doc, 1).multiplyScalar(TOC_TRANG); vt.cucBo = true;
  c.vetNgang(new V3(0, 1.15, zTam), -68, 136, lan, 1.3, r1, .01, 0, 0, o => { o.hienNgay = true; o.vanToc = vt; o.tgSong = bay + .22; o.tgTan = .16; o.doDai = 1; o.tiLeDo = .45; o.duoiMong = .45; o.soSoi = 11; });
  const diem = c.LN(0, 1.15, kcD).add(new V3(0, dy, 0)), huong = c.HN(0, 0, 1);
  c.hen(c.T() + bay * NHIP, () => c.trung(thuTu === 2 ? 1 : 0, huong, { cau: [diem, 1.7], manh: thuTu === 2 ? 95 : 65, vang: thuTu === 2 ? 6 : 0 }));
}

function X(c) {
  c.quayVeDich();
  const nv = c.nv, chanDich = c.dichChan(); chanDich.y = c.matDat;
  c.mucDat(chanDich, 3.4, 1, .6, .25, .14);
  const p0 = nv.pos.clone();
  c.phat(Clip('hn_x1', '0 HNN_THU · .18 HNN_X_LAO o · .3 HNN_X_LAO h', null, null, HUY[1]), .12);
  c.hen(.3, () => {
    c.an(true);
    const nguc = p0.clone().add(new V3(0, 1, 0));
    c.no(nguc, LEN, 28, 1.5, 4, 1, 'MUC', .09, .6, 3);
    c.no(nguc, LEN, 8, 1, 3, 1, 'DO', .07, .5, 3);
    const h = c.huongDich(), sau = chanDich.clone().addScaledVector(h, 1.7);
    vetThang(nguc, new V3(sau.x, nguc.y, sau.z), LEN, .55, { tgQuet: .07, doDai: 1, tgSong: .2, soSoi: 9, tiLeDo: .55 }, c.mau);
    c.rung(.12);
  });
  const T1 = .36;
  c.hen(T1, () => {
    // game: hiện sau CHỖ ĐỨNG ĐÃ KHOÁ lúc ra chiêu (đích lướt khỏi vòng ⇒ thuấn bộ hụt)
    let h = new V3().subVectors(chanDich, p0); h.y = 0; h = h.lengthSq() > 1e-4 ? h.normalize() : c.huongDich();
    const sau = chanDich.clone().addScaledVector(h, 1.7); sau.y = nv.pos.y;
    nv.pos.copy(sau); nv.yaw = Math.atan2(-h.x, -h.z); c.neo();
    c.an(false);
    c.no(c.LN(0, 1, 0), LEN, 16, 1, 3, 1, 'MUC', .08, .45, 2);
    c.phat(Clip('hn_x2', '0 HNN_X_LAO · .06 HNN_N5_W o · .1 HNN_N5_W h · .13 HNN_N5_S o · .52 HNN_N5_S h · .58 HNN_N1_S s · .7 HNN_N1_G o · 1.0 HNN_THU io', null, { xoay: [.11, .5, 720] }, HUY[1] - T1), .04);
  });
  c.hen(T1 + .11, () => c.vetNgang(new V3(0, 1.05, 0), 90, -375, 3, .5, 2.0, .27, -.3, .15, o => { o.doDai = .65; }));
  c.hen(T1 + .31, () => c.vetNgang(new V3(0, 1.35, 0), 90, -375, -3, .5, 2.0, .27, -.3, -.15, o => { o.doDai = .65; }));
  c.hen(T1 + .22, () => c.trung(0, c.HN(-1, 0, 0), { quat: [2.6, 360], manh: 45 }));
  c.hen(T1 + .42, () => c.trung(1, c.HN(-1, .2, 0), { quat: [2.6, 360], manh: 55 }));
  c.hen(T1 + .55, () => c.vetNgang(new V3(0, 1.1, .2), 125, -235, 12, .55, 2.1, .08));
  c.hen(T1 + .59, () => c.trung(2, c.HN(-1, 0, .3), { quat: [2.9, 160], manh: 80, vang: 9 }));
  c.hen(T1 + .64, () => {
    // ảnh sót nổ
    const p = p0.clone().add(new V3(0, 1, 0));
    c.no(p, LEN, 30, 3, 8, 1, 'DO', .08, .9);
    c.no(p, LEN, 20, 2, 6, 1, 'MUC', .1, .8);
    c.mucDat(p0, 2.2, 0, .6, .5);
    c.rung(.12);
    c.trung(0, LEN, { cau: [p, 1.8], manh: 30 });
  });
}

function Cc(c) {
  c.quayVeDich();
  const toi = DK.clamp(c.kcDich() - 1.3, 0, 9);
  const dat = c.dich ? c.dichChan() : c.LN(0, 0, toi + 1.25); dat.y = c.matDat;
  c.phat(Clip('hn_cc', '0 HNN_C_TU · .26 HNN_C_TU h · .42 HNN_C_LEN o · .6 HNN_C_DINH o · .72 HNN_C_DINH h · .78 HNN_C_BO s · .82 HNN_N7_S s · 1.12 HNN_N7_S h · 1.45 HNN_THU io',
    Mv(1, 0, 0, 0, .26, 0, 0, .62, 0, toi * .7, .82, 0, toi), { lon: [.3, .6, 360], tam: 1.0 }, HUY[2]), .2);
  c.hen(.08, () => c.no(c.LN(0, .05, 0), LEN, 12, 1, 2.5, .6, 'DO', .05, .5, 2));
  c.hen(.18, () => c.mucDat(c.LN(0, 0, 0), 1.6, 0, .5, .4));
  c.hen(.26, () => {
    bui(c.LN(0, 0, 0), .8, 16);
    c.rung(.12);
    vetThang(c.LN(0, .2, 0), c.LN(0, 3.4, toi * .45), c.HN(1, 0, 0), .3, { tgQuet: .22, doDai: .8, soSoi: 8, tiLeDo: .4 }, c.mau);
  });
  c.hen(.5, () => c.mucDat(dat, 6.5, 1, .42, .2, .16));
  c.hen(.74, () => c.vetDoc(new V3(.1, 1.9, toi + .2), 20, 165, 18, .6, 2.7, .09, .5, o => { o.soSoi = 18; o.tiLeDo = .5; }));
  c.hen(.82, () => {
    c.mucDat(dat, 5.2, 0, .9, .7);
    for (let i = 0; i < 6; i++) { const a = i * 60 + rr(-15, 15), h = xoayY(c.f(), a); c.vetDat(dat.clone().addScaledVector(h, .6), dat.clone().addScaledVector(h, rr(2.6, 4)), .24, .1); }
    bui(dat, 2, 44);
    c.no(dat, LEN, 30, 4, 10, .5, 'MUC', .1, 1.1);
    c.no(dat, LEN, 14, 3, 7, .6, 'DO', .08, .9);
    c.rung(.22);
    c.trung(3, c.HN(0, -1, .2), { cau: [dat.clone().add(new V3(0, .6, 0)), 3.1], manh: 200, vang: 6 });
  });
}

/** phi kiếm mực voxel (VeKiem): lưỡi đen thon 6 nấc + rãnh máu màu nhấn + chắn + chuôi */
function kiemMuc(mau) {
  const g = new T.Group(), nh = vfx.mau(mau), sam = nh.clone().multiplyScalar(.45);
  const mMuc = new T.MeshStandardMaterial({ color: MAU_MUC, roughness: .6 }), mDo = new T.MeshBasicMaterial({ color: nh }), mSam = new T.MeshBasicMaterial({ color: sam });
  const K = (y, z, sx, sy, sz, m) => { const b = new T.Mesh(new T.BoxGeometry(sx, sy, sz), m); b.position.set(0, y, z); g.add(b); };
  for (let i = 0; i < 6; i++) K(0, .04 + .15 * (i + .5), .026, DK.lerp(.11, .05, i / 5), .155, mMuc);
  K(0, .04 + .9 + .04, .024, .034, .08, mMuc); K(0, .04 + .9 + .1, .02, .014, .05, mMuc);
  K(0, .04 + .38, .034, .026, .66, mDo); K(0, 0, .07, .3, .07, mMuc); K(0, 0, .08, .08, .08, mDo); K(0, -.14, .05, .05, .22, mSam); K(0, -.28, .08, .08, .07, mMuc);
  return g;
}
function V(c) {
  c.quayVeDich();
  c.phat(Clip('hn_v', '0 HNN_THU · .2 HNN_AN o · .5 HNN_AN h · .56 HNN_CHI s · 1.1 HNN_CHI h · 1.4 HNN_THU io', null, null, HUY[3]), .15);
  const ds = [];
  for (let i = 0; i < 7; i++) {
    const a = DK.lerp(-80, 80, i / 6) * DK.D;
    ds.push({ cb: new V3(1.7 * Math.sin(a), 1.55 + .55 * Math.cos(a), -.35 - .45 * Math.cos(a)), tHien: .18 + i * .045, tPhong: .56 + i * .07, g: null });
  }
  c.hen(.2, () => c.no(c.LN(-.25, 1.3, .3), LEN, 10, .5, 1.5, 1, 'DO', .04, .4, 1));
  const goc = new T.Group(); vfx.them(goc, 4, () => { });
  c.moiKhung((t) => {
    let con = false;
    ds.forEach((k, i) => {
      if (k.xong) return; con = true; if (t < k.tHien) return;
      if (!k.g) { k.g = kiemMuc(c.mau); goc.add(k.g); }
      let pos, s; const dichP = c.dichNguc();
      if (!k.phong) {
        pos = c.LN(k.cb.x, k.cb.y, k.cb.z).add(new V3(0, Math.sin(t * 7 + i) * .04, 0));
        const a = DK.clamp((t - k.tHien) / .12, 0, 1); s = a < .34 ? .35 : a < .67 ? .7 : 1;
        if (!k.daHien) { k.daHien = true; c.no(pos, LEN, 7, .5, 1.6, 1, 'DO', .045, .35, 1); c.no(pos, LEN, 5, .5, 1.6, 1, 'MUC', .06, .35, 1); }
        k.g.position.copy(pos); k.g.lookAt(dichP);
        if (t >= k.tPhong) {
          k.phong = true; k.tu = pos.clone(); k.den = dichP.clone().add(new V3(rr(-1, 1), rr(-1, 1), rr(-1, 1)).multiplyScalar(.25)); k.tBay0 = t;
          k.dir = new V3().subVectors(k.den, k.tu).normalize();
          const bayThuc = Math.max(.05, k.tu.distanceTo(k.den) / 20); k.bay = bayThuc * NHIP;
          let ng = LEN.clone().addScaledVector(k.dir, -k.dir.y); if (ng.lengthSq() < 1e-4) ng = new V3(1, 0, 0);
          vetThang(k.tu, k.den, ng, .07, { tgQuet: bayThuc, doDai: .35, tgSong: .06, tgTan: .1, soSoi: 3, tiLeDo: .4, duoiMong: .15 }, c.mau);
        }
      } else {
        const x = DK.clamp((t - k.tBay0) / k.bay, 0, 1), e = 1 - Math.pow(1 - x, 4); s = 1;
        pos = new V3().lerpVectors(k.tu, k.den, e); k.g.position.copy(pos); k.g.lookAt(pos.clone().add(k.dir));
        if (x >= 1) {
          k.xong = true; goc.remove(k.g); const cuoi = i === ds.length - 1;
          c.trung(cuoi ? 2 : 0, k.dir, { cau: [k.den, .95], manh: cuoi ? 80 : 38, vang: cuoi ? 7 : 0 });
          return;
        }
      }
      k.g.scale.setScalar(s);
    });
    if (!con) goc.parent && goc.parent.remove(goc);
    return con;
  });
}

function R(c) {
  c.quayVeDich();
  const kc = c.kcDich(), toi = kc < 8 ? DK.clamp(kc + 1.8, 1, 8) : 2.5;
  c.phat(Clip('hn_r', '0 HNN_THU · .3 HNN_R_TU o · 1.0 HNN_R_TU h · 1.05 HNN_R_S s · 1.5 HNN_R_S h · 1.68 HNN_R_VAY s · 1.82 HNN_R_VAY h · 2.15 HNN_THU io',
    Mv(1, 0, 0, 0, 1.0, 0, 0, 1.07, 0, toi), null, HUY[4]), .2);
  // tụ lực: mực + màu nhấn hút về chuôi kiếm (2 hạt / khung game)
  let tich = 0;
  c.moiKhung((t, dt) => {
    if (t < .3) return true; if (t > .98) return false;
    tich += dt * 120 * NHIP; const chuoi = c.LN(-.35, .95, .35);
    for (; tich >= 1; tich -= 1) {
      const d = new V3(rr(-1, 1), rr(-1, 1), rr(-1, 1)).normalize(); if (d.y < -.2) d.y = -d.y;
      const tu = chuoi.clone().addScaledVector(d, rr(1.6, 2.6)), v = new V3().subVectors(chuoi, tu).divideScalar(.28);
      vfx.hat(tu, { so: 1, mau: Math.random() < .7 ? c.mau : MAU_MUC, toc: v.length() / NHIP, huong: v, loe: 0, co: .07 * rr(.6, 1.1), song: .28 * NHIP, trongLuc: 0, can: 0, to: true });
    }
    return true;
  });
  // trăng máu mọc sau lưng (cung lớn trong mặt phẳng nhìn từ máy quay)
  c.hen(.32, () => c.vetCB(new V3(0, 3.0, -1.6), new V3(-.8, -.6, 0), new V3(0, 0, 1), -220, 2.4, 3.2, .65, 0, 0, o => { o.tgSong = 1.1; o.tgTan = .35; o.tiLeDo = .85; o.soSoi = 18; o.doDai = 1.2; }));
  c.hen(.42, () => c.vetCB(new V3(0, 3.0, -1.65), new V3(-.8, -.6, 0), new V3(0, 0, 1), -220, 2.0, 2.25, .6, 0, 0, o => { o.tgSong = .95; o.tgTan = .3; o.tiLeDo = .3; o.soSoi = 6; o.doDai = 1.2; }));
  c.hen(.35, () => c.mucDat(c.LN(0, 0, 2.8), 7, 1, .75, .3, .3));
  c.hen(.4, () => c.mucDat(c.LN(0, 0, 0), 2.4, 0, .9, .5));
  // bạt kiếm
  c.hen(1.0, () => {
    c.vetNgang(new V3(0, 1.0, .8), 100, -200, 6, .8, 5.6, .07, -.6, 0, o => { o.soSoi = 22; o.tgSong = .3; o.tgTan = .25; o.tiLeDo = .45; });
    c.vetDat(c.LN(0, 0, .5), c.LN(0, 0, 26), .6, .9);
  });
  c.hen(1.02, () => c.vetNgang(new V3(0, 1.25, 1.4), 95, -190, -4, 3.6, 6.6, .08, -.5, 0, o => { o.soSoi = 16; o.tiLeDo = .7; o.tgSong = .25; }));
  c.hen(1.04, () => {
    const vt = new V3(0, 0, 30); vt.cucBo = true;
    c.vetNgang(new V3(0, 1.0, -2.5), -75, 150, 0, 3.4, 4.6, .01, -.3, 0, o => { o.hienNgay = true; o.vanToc = vt; o.tgSong = .85; o.tgTan = .2; o.camToc = .4; o.tiLeDo = .6; o.doDai = 1; o.duoiMong = .5; o.soSoi = 18; });
  });
  c.hen(1.05, () => {
    c.trung(3, c.HN(-1, 0, .3), { dai: [26, 2.4], manh: 260, vang: 14, menh: true });
    c.no(c.dichNguc(), c.HN(-.5, .4, 1), 40, 4, 12, .5, 'DO', .08, 1.0);
    c.mucDat(c.dichChan(), 3.2, 0, 1.2, .6);
    c.rung(.22);
  });
  // vẩy máu
  c.hen(1.68, () => {
    c.no(c.LN(1.0, 1.0, toi + .8), c.HN(.5, -1, .3), 16, 3, 6, .35, 'DO', .05, .8);
    c.mucDat(c.LN(1.4, 0, toi + 1.1), 1.2, 0, 1.2, .5);
    c.rung(.06);
  });
}

// ================================================================ TẦNG ≥ 3: TUYỆT KỸ VIẾT TAY (TuyetKyWebBo.cs / TuyetKyWebHoaCanh.cs)
//   màu CỐ ĐỊNH đỏ / đỏ sẫm / tím (không theo thanh kiếm) — như C#
/** ChieuVe.TrangTinh — trăng tĩnh (dung = dựng đứng, nghieng rad) */
function trangTinh(p, d, r, mau, song, dung, nghieng) { return vfx.cung(p, d.clone(), { bk: r * .78, day: r * .32, goc: 150, nghieng: (dung === false ? 0 : 90) + (nghieng || 0) * 57.3, mau, song: song || .6 }); }
const songXung = (p, r, mau, song) => vfx.vong(p, { bk0: .3, bk1: r, song, mau, day: .3 });
const quangNo = (p, r, mau, song) => vfx.chop(p, { co: r * 2, mau, song: song || .25 });
function noLon(p, r, mau) { vfx.chop(p, { co: r * 2.4, mau, song: .3 }); vfx.hat(p, { so: 16, mau, toc: 7, co: .12, song: .6 }); vfx.vong(p, { bk0: .2, bk1: r * 1.6, song: .35, mau }); }
const vongBao = (p, r, tg, mau) => vfx.vung(p, { r, song: tg + .08, mau });
function hopSang(co, mau, op) { const g = new T.Group(); g.add(new T.Mesh(new T.BoxGeometry(co[0], co[1], co[2]), vfx.matCong(mau, op == null ? .9 : op))); g.add(new T.Mesh(new T.BoxGeometry(co[0] * .42, co[1] * .55, co[2] * .85), vfx.matCong(0xffffff, .6))); return g; }
/** DanTK — đạn khí: TRANG (trăng) / KIEM (phi kiếm hộp đỏ); toc m/s mô phỏng (giây web), tam = quãng bay */
function danTK(c, d) {
  d = Object.assign({ kieu: 'TRANG', toc: 24, tam: 24, r: 1.2, co: 1, manh: 0, nghieng: 0, duoi: 0, xuyen: false, mau: TK_DO }, d);
  const pos = d.pos.clone(), vel = d.huong.clone().normalize().multiplyScalar(Math.max(1, d.toc)); let di = 0; const thu = new Set();
  let x, kiem = null;
  if (d.kieu === 'TRANG') x = vfx.cung(pos, vel, { bk: d.r * .78, day: d.r * .32, goc: 150, nghieng: 90 + d.nghieng * 57.3, mau: d.mau, song: d.tam / d.toc + .3, bay: 0 });
  else { kiem = hopSang([.12 * d.co, .035 * d.co, 1.3 * d.co], d.mau); x = vfx.them(kiem, d.tam / d.toc + .3); }
  const rn = d.kieu === 'KIEM' ? .45 : d.r * .55;
  DK.lap((dt) => {
    if (d.duoi > 0 && d.dich) { const muc = new V3().subVectors(ngucCua(d.dich), pos).normalize().multiplyScalar(d.toc); const a = vel.angleTo(muc), b = d.duoi * dt; if (a > 1e-4) vel.lerp(muc, Math.min(1, b / a)).setLength(d.toc); }
    pos.addScaledVector(vel, dt); di += d.toc * dt;
    const o = x.o; o.position.copy(pos);
    if (kiem) kiem.lookAt(pos.clone().add(vel)); else o.rotation.y = Math.atan2(vel.x, vel.z);
    if (d.manh > 0) for (const b of DK.dsBuNhin) {
      if (thu.has(b) || ngucCua(b).distanceTo(pos) > rn + .45) continue;
      thu.add(b); DK.trung(b, { nguon: c.nv, st: d.manh, day: .4, mau: d.mau }); quangNo(pos, Math.min(2, d.r * .8), d.mau, .25);
      if (!d.xuyen) { x.t = x.song; if (d.khiToi) d.khiToi(pos); return false; }
    }
    if (di >= d.tam || (!d.quaDat && pos.y < 0)) { x.t = Math.max(x.t, x.song - .15); if (d.khiToi) d.khiToi(pos); return false; }
  });
  return x;
}
function vungTK(c, tam, r, manh, hat) { for (const b of DK.trongTron(tam, r)) DK.trung(b, { nguon: c.nv, st: manh, day: .5, hat: hat || 0, mau: TK_DO }); }

/** phiên tuyệt kỹ (PhienTK): mốc theo giây web (= mô phỏng) từ lúc ra chiêu */
function phienTK(c, ci) {
  const ctx = c.ctx, nv = c.nv, tang = ctx.tang;
  if (tang < 3) return;   // Sơ Khuy / Tiểu Thành: giữ nguyên dáng gốc
  const p = { tang, nhanh: ctx.nhanh, K: tang >= 5 ? 1.3 : tang >= 4 ? 1.15 : 1, goc: nv.pos.clone(), f: c.huongDich().clone(), dich: c.dich };
  p.La = (m) => p.nhanh === m;
  p.Nguc = () => nv.diem('nguc');
  p.Chan = () => nv.pos.clone();
  p.Huong = () => c.huongDich();
  p.Ngam = () => { if (!p.dich) return nv.toi(); const d = new V3().subVectors(ngucCua(p.dich), p.Nguc()); if (nv.datDat) d.y = 0; return d.normalize(); };
  p.DiemDich = (xa, tamToiDa) => p.dich && p.dich.pos.distanceTo(nv.pos) <= (tamToiDa == null ? 99 : tamToiDa) ? p.dich.pos.clone() : nv.pos.clone().addScaledVector(nv.toi(), xa);
  const K = p.K, L = c.hen;
  switch (ci) {
    case 0:   // Z Tàn Nguyệt Phi Tinh — mốc nhát bộ CŨ .21 / .37 / .53 (+.01)
      [.21, .37, .53].forEach((t, kk) => L(t + .01, () => {
        const h = p.Ngam(), tu = p.Nguc().addScaledVector(h, .9);
        if (p.La('tan_tinh')) { for (const s of [-1, 1]) danTK(c, { pos: tu, huong: xoayY(h, s * 20), toc: 22, tam: 18, r: 1.1 * K, manh: 32, mau: TK_DO, nghieng: s * .35 }); }
        else if (p.La('truy_tinh')) { if (kk !== 1) danTK(c, { pos: tu.clone().add(new V3(0, .5, 0)), huong: h, dich: p.dich, toc: 20, tam: 28, r: 1.5 * K, duoi: 4.5, manh: 55, mau: TK_DO_DAM, nghieng: .2 }); }
        else for (const s of [-1, 1]) danTK(c, { pos: tu.clone().addScaledVector(h, -.5).add(new V3(0, s * .38, 0)), huong: h, toc: 22, tam: 22, r: 1.25 * K, manh: 14, mau: TK_DO_DAM, nghieng: s * .25 });
      }));
      break;
    case 1: {  // X Ảnh Bộ Hồi Phong (tím)
      const tam = p.DiemDich(6, 14);
      if (p.La('quy_anh_vo_tung')) {
        L(.31, () => {
          vfx.hat(p.goc.clone().add(new V3(0, 1.1, 0)), { so: 30, mau: TK_TIM, toc: 5, co: .1, song: .6 }); bui(p.goc, 1.4, 10);
          vfx.chop(p.goc.clone().add(new V3(0, 1.1, 0)), { co: 4.8, mau: new T.Color(.2, .05, .3), song: .4 });
          DK.chuNoi('Ẩn thân', nv.diem('dau').add(new V3(0, .6, 0)), '#c9a0ff');
          vfx.trong(nv, .28); L(.31 + 1.5, () => vfx.trong(nv, 1));
        });
      } else if (p.La('huyet_anh_phan_than')) {
        const g = new T.Group(); g.position.copy(tam).add(new V3(0, 1, 0));
        for (let k = 0; k < 2; k++) { const m = new T.Mesh(new T.BoxGeometry(.5, 1.7, .08), vfx.matCong(TK_TIM, .35)); m.rotation.y = k * Math.PI / 2; g.add(m); }
        L(.66, () => vfx.them(g, 1.15 - .66, (dt, u, t) => { g.rotation.y = t * 14; }));
        L(.98, () => {
          const cc = tam.clone().add(new V3(0, 1.1, 0));
          for (let k = 0; k < 4; k++) trangTinh(cc, xoayY(p.f, k * 90), 2.2 * K, TK_TIM, .3, false, 0);
          songXung(cc, 2.6 * K, TK_DO, .3); vungTK(c, cc, 2.6 * K, 50); DK.rung(.25, .3);
        });
      } else {
        L(.79, () => {
          const cc = p.goc.clone().add(new V3(0, 1.1, 0));
          for (let k = 0; k < 3; k++) trangTinh(cc.clone().addScaledVector(xoayY(p.f, k * 120), .6), xoayY(p.f, k * 120 + 30), 1.9 * K, TK_TIM, .35, true, (k - 1) * .9);
          vungTK(c, cc, 2.4 * K, 25);
        });
      }
      break;
    }
    case 2: {  // C Phi Hồng Lạc Nguyệt — tâm khoá ở .46
      L(.46, () => { p.tam = p.DiemDich(7); p.tam.y = 0; p.tam2 = p.Huong(); });
      if (p.La('nguyet_lac_tham_uyen')) {
        L(1.05, () => {
          const g = new T.Group(); const dia = new T.Mesh(new T.CircleGeometry(3.6 * K, 48), vfx.matThuong(TK_DO_DAM, .55)); dia.rotation.x = -Math.PI / 2; g.add(dia);
          const vien = new T.Mesh(new T.RingGeometry(3.6 * K - .12, 3.6 * K, 64), vfx.matCong(TK_DO, .8)); vien.rotation.x = -Math.PI / 2; vien.position.y = .01; g.add(vien);
          g.position.copy(p.tam).add(new V3(0, .06, 0));
          vfx.them(g, 2.25, (dt, u, t) => {
            const nh = .75 + .25 * Math.sin((1.05 + t) * 9); dia.material.opacity = .55 * nh * (1 - u * u); vien.material.opacity = .8 * (1 - u);
            if (Math.random() < .5) vfx.hat(p.tam.clone().add(new V3(rr(-3, 3) * K, .1, rr(-3, 3) * K)), { so: 1, mau: TK_DO, toc: rr(1.5, 3), huong: LEN, loe: 0, co: .14, song: .7, trongLuc: 0 });
          });
        });
        for (let k = 0; k < 6; k++) L(1.2 + k * .36, () => { for (const b of DK.trongTron(p.tam, 3.6 * K)) DK.trung(b, { nguon: nv, st: 9, khongPhanUng: true, trangThai: 'Ma nhiễm', mau: TK_DO }); });
      } else if (p.La('phi_hong_tam_lac')) {
        for (let j = 1; j <= 2; j++) L(1.02 + j * .18, () => {
          const q = p.tam.clone().addScaledVector(p.tam2, 3.2 * j * K);
          trangTinh(q.clone().add(new V3(0, 2.4, 0)), p.tam2, 2.6 * K, TK_DO, .3, true, 0);
          noLon(q.clone().add(new V3(0, .5, 0)), 1.8, TK_DO);
          songXung(q, 1.6 * K, TK_DO, .3);
          vungTK(c, q, 3 * K, 55, .4);
        });
      } else {
        L(1.02, () => {
          const g0 = rr(0, 120);
          for (let k = 0; k < 3; k++) {
            const d = xoayY(p.tam2, g0 + k * 120);
            vfx.tia(p.tam.clone().add(new V3(0, .1, 0)), p.tam.clone().addScaledVector(d, 5.5 * K).add(new V3(0, .1, 0)), { rong: .2, mau: TK_DO, song: 1.1 });
            for (let s = 1; s <= 3; s++) quangNo(p.tam.clone().addScaledVector(d, s * 1.6 * K).add(new V3(0, .2, 0)), .9, TK_DO_DAM, .4);
          }
        });
        L(1.32, () => { songXung(p.tam.clone().add(new V3(0, .15, 0)), 5.5 * K, TK_DO, .45); vungTK(c, p.tam, 5.5 * K, 25); });
      }
      break;
    }
    case 3:   // V Thiên Tinh Kiếm Trận
      if (p.La('bac_dau_that_tinh')) {
        L(.55, () => {
          const vong = new T.Mesh(new T.RingGeometry(3 * K - .1, 3 * K, 64), vfx.matCong(TK_DO, .7)); vong.rotation.x = -Math.PI / 2;
          const g = new T.Group(); g.add(vong); const kiem = []; for (let k = 0; k < 7; k++) { const h = hopSang([.12, .035, 1.3], TK_DO); g.add(h); kiem.push(h); }
          vfx.them(g, 3.6, (dt, u, t) => {
            g.position.set(nv.pos.x, .03, nv.pos.z);
            const tt = .55 + t;
            kiem.forEach((h, k) => {
              const a = k * Math.PI * 2 / 7 + tt * 3, o = new V3(Math.cos(a), .15 * Math.sin(tt * 4 + k), Math.sin(a)).multiplyScalar(2.6 * K);
              h.position.set(o.x, 1.2 + o.y, o.z); h.lookAt(g.position.clone().add(h.position).add(new V3(-Math.sin(a), 0, Math.cos(a))));
              h.visible = t < 3;
            });
          });
        });
        for (let k = 0; k < 10; k++) L(.7 + k * .3, () => vungTK(c, nv.pos, 3.2 * K, 14));
      } else if (p.La('luu_tinh_vu')) {
        L(.66, () => {
          p.tam = p.DiemDich(8, 30); p.tam.y = 0;
          vongBao(p.tam, 4 * K, .3, TK_DO);
          for (let k = 0; k < 14; k++) {
            const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 4 * K, dat = p.tam.clone().add(new V3(Math.cos(a) * r, 0, Math.sin(a) * r));
            const h = hopSang([.06, .02, .7], TK_DO); const tre = Math.random() * .9;
            vfx.them(h, 1.2, (dt, u, t) => { const x = DK.clamp((t - tre) / .3, 0, 1); h.visible = t >= tre; h.position.copy(dat).add(new V3(0, 9 * (1 - x) + .35, 0)); h.lookAt(dat.clone().add(new V3(0, -10, 0))); if (x >= 1 && !h.cham) { h.cham = true; quangNo(dat.clone().add(new V3(0, .2, 0)), .5, TK_DO, .2); } });
          }
        });
        for (let k = 0; k < 7; k++) L(.95 + k * .14, () => vungTK(c, p.tam, 4 * K, 16));
      } else {
        // bảy kiếm thêm xếp hình Bắc Đẩu sau lưng rồi lao (đuổi 2,4 rad/s, 26 m/s)
        const BD = [[-1.9, 2.0], [-1.1, 2.5], [-.35, 2.65], [.35, 2.4], [.55, 1.75], [1.45, 1.6], [1.65, 2.3]];
        const bacDau = (k) => { const h = p.Huong(); return p.Chan().add(new V3(0, BD[k][1], 0)).addScaledVector(ben(h), BD[k][0]).addScaledVector(h, -.9); };
        const ds = [];
        L(.3, () => { for (let k = 0; k < 7; k++) { const h = hopSang([.12, .035, 1.3], TK_DO, .85); ds.push(h); vfx.them(h, .62 + k * .08 - .3, (dt, u, t) => { const o = bacDau(k); h.position.copy(o); h.lookAt(p.dich ? ngucCua(p.dich) : o.clone().addScaledVector(p.Huong(), 10)); h.scale.setScalar(Math.min(1, t / .15) + .01); }); } });
        for (let k = 0; k < 7; k++) L(.62 + k * .08, () => { const o = bacDau(k), h = (p.dich ? ngucCua(p.dich) : o.clone().addScaledVector(p.Huong(), 10)).sub(o); danTK(c, { kieu: 'KIEM', pos: o, huong: h, dich: p.dich, toc: 26, tam: 32, duoi: 2.4, manh: 12, mau: TK_DO, co: K }); });
      }
      break;
    case 4:   // R Huyết Nguyệt Trảm — lưỡi liềm phóng ở .88 (mốc bộ CŨ — trước cú bạt kiếm soul 1,0–1,05)
      L(.88, () => {
        const h = p.Ngam(), b = ben(h), tu = p.Nguc().add(h);
        if (p.La('song_nguyet_giao_huy')) {
          const dich = p.dich ? ngucCua(p.dich) : tu.clone().addScaledVector(h, 18);
          for (const s of [-1, 1]) { const a = tu.clone().addScaledVector(b, s * 4.5); danTK(c, { pos: a, huong: new V3().subVectors(dich, a), toc: 34, tam: 90, r: 3.6 * K, manh: 80, xuyen: true, quaDat: true, mau: TK_DO, nghieng: s * .8 }); }
        } else if (p.La('huyet_nguyet_doat_menh')) {
          danTK(c, { pos: tu, huong: h, toc: 34, tam: 130, r: 2.4, mau: TK_DO.clone().lerp(new T.Color(1, 1, 1), .45), quaDat: true, xuyen: true });
        } else {
          for (const s of [-1, 1]) danTK(c, { pos: tu.clone().addScaledVector(b, s * 2.6).addScaledVector(h, -.6), huong: h, toc: 34, tam: 90, r: 3.2 * K, manh: 30, xuyen: true, quaDat: true, mau: TK_DO_DAM, nghieng: s * .5 });
        }
      });
      if (tang >= 5) hoaCanh(c, p); else if (tang >= 4) vienMan(c, p);
      break;
  }
}
/** MoTuyetKy — chữ chiêu + trời đổi màu (cảnh quay xoay/zoom + chậm thời gian của game BỎ theo quy tắc phòng duyệt) */
function moTuyetKy(c, p, ten, mauTroi, manhTroi, giayTroi, tPhong, hoaCanh) {
  c.hen(.03, () => { vfx.chu(ten, { mau: '#' + TK_DO.getHexString(), song: 1.6 }); vfx.troi(mauTroi, giayTroi, manhTroi); });
  c.hen(tPhong - .02, () => DK.rung(hoaCanh ? .55 : .4, .35));
}
function vienMan(c, p) {
  moTuyetKy(c, p, 'Huyết Nguyệt Trảm', TK_DO, .42, 2.6, .88, false);
  c.hen(.88, () => {
    for (let k = 0; k < 9; k++) trangTinh(p.Nguc().addScaledVector(xoayY(p.f, k * 40), 2.1), xoayY(p.f, k * 40), 1.4, TK_DO, .4, false, 0);
    vfx.chop(p.Nguc(), { co: 7, mau: TK_DO, song: .35 });
    vfx.vong(p.Chan(), { bk0: .3, bk1: 4, song: .45, mau: TK_DO });
    bui(p.Chan(), 2, 16);
  });
}
function hoaCanh(c, p) {
  moTuyetKy(c, p, 'Huyết Nguyệt Đương Không', TK_DO_DAM, .62, 4.2, .88, true);
  const R = 10, tam = p.DiemDich(14, 40); tam.y = 0;
  const trang = tam.clone().addScaledVector(p.f, 30).add(new V3(0, 18, 0)); const HET = 3.3;
  c.hen(.3, () => vongBao(tam, R, 1.9, TK_DO));
  // trăng máu thật mọc trên trời rồi lặn
  const g = new T.Group();
  const dia = new T.Mesh(new T.CircleGeometry(1, 48), new T.MeshBasicMaterial({ color: new T.Color(.62, .04, .08), transparent: true, depthWrite: false, side: T.DoubleSide, fog: false }));
  const qu = new T.Sprite(new T.SpriteMaterial({ map: vfx.texTron, color: TK_DO, blending: T.AdditiveBlending, transparent: true, depthWrite: false, fog: false }));
  g.add(qu); g.add(dia);
  vfx.them(g, HET, (dt, u, t) => {
    const ss = (a, b, x) => { const k = DK.clamp((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };
    const len = ss(0, .7, t), tat = 1 - ss(HET - .5, HET, t), a = len * tat, r = 9 * (.8 + .2 * len);
    g.position.copy(trang).add(new V3(0, -(1 - len) * 14, 0)); dia.lookAt(DK.cam.position); dia.scale.setScalar(r); dia.material.opacity = .95 * a;
    qu.scale.setScalar(r * 2.6 * 2); qu.material.opacity = .55 * a;
    if (Math.random() < .7) vfx.hat(tam.clone().add(new V3(rr(-R, R), rr(4, 9), rr(-R, R))), { so: 1, mau: TK_DO, toc: rr(2, 4), huong: new V3(0, -1, 0), loe: 0, co: rr(.12, .22), song: 1.2, trongLuc: 0, can: 0 });
  });
  // trăng trút 9 lưỡi liềm xuống vùng
  for (let k = 0; k < 9; k++) c.hen(.95 + k * (1.15 / 9), () => {
    const gg = rr(0, Math.PI * 2), r = Math.sqrt(Math.random()) * (R - 1.5), q = tam.clone().add(new V3(Math.cos(gg) * r, 0, Math.sin(gg) * r));
    const tu = trang.clone().add(new V3(rr(-4, 4), rr(-4, 4), rr(-4, 4)));
    danTK(c, { pos: tu, huong: new V3().subVectors(q, tu), toc: 70, tam: q.distanceTo(tu), r: 2.6, mau: TK_DO, quaDat: true, nghieng: rr(-1, 1),
      khiToi: () => { vungTK(c, q, 3.2, 45, .4); noLon(q.clone().add(new V3(0, .4, 0)), 1.5, TK_DO); trangTinh(q.clone().add(new V3(0, .3, 0)), xoayY(p.f, rr(0, 360)), 2.4, TK_DO_DAM, .5, false, 0); } });
  });
  // lưỡi liềm khổng lồ quét ngang cả vùng
  c.hen(2.35, () => {
    const cc = tam.clone().add(new V3(0, 1.2, 0));
    trangTinh(cc, p.f, R * 1.05, TK_DO, .7, false, 0); trangTinh(cc, p.f.clone().negate(), R * 1.05, TK_DO_DAM, .7, false, 0);
    vfx.vong(tam, { bk0: R * .5, bk1: R, day: 2.4, song: .55, mau: TK_DO });
    songXung(tam.clone().add(new V3(0, .15, 0)), R * 1.3, TK_DO, .5);
    for (const b of DK.trongTron(cc, R)) DK.trung(b, { nguon: c.nv, st: 120, day: 1.2, hat: .8, mau: TK_DO, trangThai: 'Ma nhiễm' });
    DK.rung(.55, .4);
  });
}

// ================================================================ ĐĂNG KÝ
function chieu(fn, ci) { return (ctx) => { const c = Ch(ctx); fn(c); phienTK(c, ci); }; }
DK.dangKyBo('huyet_nguyet', {
  nguon: 'CongPhap/HuyetNguyetSoul.cs (Bat = true) · DuyetChieu/HuyetNguyetNhapChieu.cs · HuyetNguyetNhapCombo.cs · HuyetNguyetNhapDongTac.cs · CongPhap/HuyetNguyetSoulCombo.cs · CongPhap/TuyetKyWeb*.cs (tầng ≥ 3)',
  ghiChu: 'Bản đang chạy: SOULSLIKE (HuyetNguyetSoul.Bat = true) — bộ cũ KiemPhapHuyetNguyet (trăng 22 m/s, vút 8,5 m, 7 kiếm xoay…) không còn chạy. ' +
    'Khác JSON: kịch bản soul KHÔNG rẽ tầng/nhánh; tầng 2 trong game không thêm gì (code bỏ lớp VFX chung cho bộ này khi tầng < 3) dù JSON tả "vệt sáng dày hơn, hạt huyết". ' +
    'Tầng ≥ 3 mới chồng lớp TuyetKyWeb (nhánh) — lớp này dùng màu CỐ ĐỊNH đỏ/tím (không theo thanh kiếm) và mốc của bộ CŨ: Z trăng thêm ở .22/.38/.54 (soul chém .26/.38/.5), R lưỡi liềm phóng .88 TRƯỚC cú bạt kiếm 1,0–1,05. ' +
    'Z: JSON "trăng bay thẳng" — soul 16,5 m/s thật, trúng ở điểm đích lúc phóng; nhánh Truy Tinh "chỉ hai nhát" nhưng soul vẫn chém đủ 3 trăng (chỉ thêm 2 trăng đuổi). C: JSON "vút lên cao" — soul nhảy ~3 m (jy 3.0), không còn 8,5 m. ' +
    'V: JSON "xoay quanh thân" — soul hiện quạt 7 kiếm sau lưng rồi phóng 20 m/s thật, không xoay. R: JSON "trời nhuộm đỏ" chỉ có ở tầng 4–5 (TuyetKyWeb). X tầng 3 mặc định dùng màu tím. ' +
    'Gần đúng: vệt mực (shader SoulVetChem) dựng bằng dải 3 lớp; vết mực đất bằng ảnh ô vuông; bỏ hit-stop, impact frame, đẩy FOV, cảnh quay + chậm thời gian tuyệt kỹ; lớp phẩm/mốc +N của HieuUngVuKhi trên vệt không dựng. ' +
    'Đòn nặng (nhát 6 của bộ) không có phím trong phòng duyệt. Lộn tới: game dời người bằng lướt của NguoiChoi — ở đây dùng mv 3 m của clip phòng duyệt; lướt lùi/ngang dùng LUOT_* + mv 3 m gần đúng.',
  tuThe: TU_THE,
  theThu: 'HNN_THU', theDo: 'HNN_DO',
  soNhat: 7, danh,
  lon,
  chieu: { tan_nguyet: chieu(Z, 0), anh_bo: chieu(X, 1), phi_hong: chieu(Cc, 2), thien_tinh: chieu(V, 3), huyet_nguyet: chieu(R, 4) },
});
})();
