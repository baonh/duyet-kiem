"use strict";
// ============================================================================
// bo_anh_sat_nc.js — 2026-11-15 — BẢN NÂNG CẤP (đề xuất) của ẢNH SÁT QUYẾT (mã 'anh_sat').
//   Bản game: js/bo_anh_sat.js (port AnhSat.cs). File này KHÔNG sửa bản game — dựng lại động tác + hiệu ứng để người dùng duyệt.
//   Phong cách: sát thủ cầm kiếm NGƯỢC TAY, trọng tâm thấp; ra đòn bằng lướt bóng, hiện sau lưng, đâm ngược, nhảy chém từ trên.
//   Màu: tím U Minh (bóng tối) là chủ đạo; Độc Châm / Yên Vụ là lục độc. Vệt chém = màu thanh kiếm (ctx.mau), kiểu 'muc' (lõi mực).
//   Địa hình: bóng tối loang trên đất (dia.chay tím đen), vết chém xẻ đất (dia.ranh + dia.cat), độc làm cỏ héo (dia.chay úa + gió rạp),
//   U Minh viên mãn: vùng tối nuốt sân + nhiều phân thân + khung va chạm.
//   Sửa lỗi bản game: X đâm ra 0,22 s trước thế đâm (nay thế đâm và nhát đâm trùng khung); lớp VFX tầng nổ TẠI MỤC TIÊU làm lộ ẩn thân
//   (nay hiệu ứng tầng của chiêu ẩn đặt quanh chính người tung / dọc đường lướt); V luôn LUOT_TRAI (nay lách phải / trái đúng clip).
// ============================================================================
(function () {
const DK = window.DK; if (!DK || !DK.dangKyBoNC) return;
const T = DK.T, V3 = DK.V3, vfx = DK.vfx, dia = DK.dia, D = DK.D, nc = DK.nc;
const MA = 'anh_sat';
const NHIP = DK.NHIP_GOC || .75;
const THAT = g => g * NHIP;                     // giây thật của game → giây mô phỏng
const RR = (a, b) => a + Math.random() * (b - a);
const V = (x, y, z) => new V3(x, y, z);
const UP = V(0, 1, 0);

// ---------------------------------------------------------------- màu (Unity sRGB → tuyến tính)
const SRGB = (r, g, b) => new T.Color(r, g, b).convertSRGBToLinear();
const TIM = SRGB(.6, .42, 1), TIM_TOI = SRGB(.22, .08, .4), DEN_TIM = SRGB(.07, .02, .12);
const TIM_SANG = TIM.clone().multiplyScalar(2.4);          // HDR — bloom toả
const LUC = SRGB(.45, 1, .55), DOC = SRGB(.62, .9, .32), LUC_SANG = LUC.clone().multiplyScalar(2.2);
const DAT_TOI = new T.Color(.55, .12, 1.3);                 // nhuộm đất bóng tối (dia.chay cộng m·a·.25 ở lõi)
const DAT_DOC = new T.Color(.7, 1.3, .05);                  // đất / cỏ úa vì độc
const LAVENDER = SRGB(.82, .78, 1);
const KHOI = SRGB(.17, .07, .27);                          // khói bóng tối (khối đặc)

// ---------------------------------------------------------------- hình học
const nguc = o => o.pos.clone().add(V(0, 1.25, 0));
const phaiCua = h => V(-h.z, 0, h.x).normalize();          // giống NhanVat.phai (mặt +z ⇒ phải là −x)
const xoayY = (h, g) => { const r = phaiCua(h), c = Math.cos(g * D), s = Math.sin(g * D); return V(h.x * c + r.x * s, 0, h.z * c + r.z * s); };
const matCua = d => V(Math.sin(d.yaw), 0, Math.cos(d.yaw));
const ngang = v => { const h = v.clone(); h.y = 0; return h.lengthSq() > 1e-8 ? h.normalize() : nc.toi(); };
const quanhDich = (d, huong, kc) => { const p = d.pos.clone().addScaledVector(huong, kc); p.y = 0; return p; };
const sauLung = (d, kc) => quanhDich(d, matCua(d).negate(), kc);
function oSauLung(d, tu) { const v = tu.clone().sub(d.pos); v.y = 0; if (v.lengthSq() < 1e-4) return true; return matCua(d).dot(v.normalize()) < -.34; }
const quayMat = (nv, h) => { if (h.x * h.x + h.z * h.z > 1e-8) nv.yaw = Math.atan2(h.x, h.z); };
function dichToi(nv, p) { nv.pos.set(p.x, p.y, p.z); nv.vel.set(0, 0, 0); }
const conSong = d => d && DK.dsBuNhin.indexOf(d) >= 0;
const BK = .35;

// ============================================================================
// TƯ THẾ (tiền tố ASN_) — cầm kiếm NGƯỢC TAY (w ≈ −80: lưỡi chạy dọc cẳng tay về phía khuỷu), thân thấp, chân rộng
// ============================================================================
const TU_THE = [
  // thủ thế sát thủ: khom, tay phải cầm ngược giấu kiếm sau cẳng tay, tay trái che trước
  'ASN_THU', 'tor:22,-24,0 head:-14,22,0 aR:-24,0,-34 fR:-70,0,0 w:-150,0,0 aL:-60,0,22 fL:-62,0,0 lR:-44,0,-12 sR:64,0,0 lL:22,0,12 sL:50,0,0 ao:14',
  // nhát 1: chém chéo thuận tay
  'ASN_W1', 'tor:10,-52,-8 head:-8,46,0 aR:-142,0,-52 fR:-40,0,0 w:80,0,0 aL:-46,0,30 fL:-80,0,0 lR:-30,0,-12 sR:46,0,0 lL:28,0,12 sL:46,0,0 ao:12',
  'ASN_S1', 'tor:44,42,8 head:-32,-32,0 aR:-40,0,42 fR:-6,0,0 w:90,0,0 aL:-6,0,50 fL:-36,0,0 lR:-70,0,-10 sR:86,0,0 lL:38,0,10 sL:24,0,0 ao:42',
  // nhát 2: quét ngược tay (tay vắt qua ngực rồi xé ra phải)
  'ASN_W2', 'tor:16,50,0 head:-12,-42,0 aR:-84,0,46 fR:-96,0,0 w:-150,0,0 aL:-30,0,52 fL:-30,0,0 lR:-50,0,-8 sR:64,0,0 lL:26,0,14 sL:46,0,0 ao:16',
  'ASN_S2', 'tor:30,-56,-6 head:-20,50,0 aR:-88,0,-74 fR:-8,0,0 w:-150,0,0 aL:-46,0,20 fL:-70,0,0 lR:-64,0,-14 sR:78,0,0 lL:34,0,10 sL:30,0,0 ao:36',
  // lướt thấp (kiếm kéo sau)
  'ASN_LAO', 'b:16,0,0 tor:42,-10,0 head:-38,10,0 aR:34,0,-22 fR:-30,0,0 w:-150,0,0 aL:-64,0,20 fL:-40,0,0 lR:-72,0,-6 sR:92,0,0 lL:30,0,8 sL:60,0,0 ao:60 toc:50',
  // đâm thẳng dứt khoát (thuận tay)
  'ASN_DAM', 'tor:32,18,0 head:-26,-14,0 aR:-92,0,0 fR:-2,0,0 w:90,0,0 aL:30,0,34 fL:-20,0,0 lR:-86,0,-6 sR:86,0,0 lL:50,0,8 sL:22,0,0 ao:48',
  // xoay thấp: lấy đà / quét (tay duỗi ngang, lưỡi song song mặt đất ngang gối)
  'ASN_THAP_W', 'tor:30,42,0 head:-24,-32,0 aR:-70,0,42 fR:-30,0,0 w:90,0,0 aL:-40,0,40 fL:-50,0,0 lR:-82,0,-20 sR:118,0,0 lL:-10,0,30 sL:108,0,0 ao:30',
  'ASN_THAP', 'tor:36,-10,-14 head:-26,10,10 aR:-84,0,-82 fR:0,0,0 w:90,0,0 aL:-30,0,62 fL:-30,0,0 lR:-94,0,-26 sR:128,0,0 lL:-6,0,42 sL:122,0,0 ao:46',
  // đâm ngược ra sau lưng (quay lưng về địch, tay phải thúc ra sau, đầu ngoái lại)
  'ASN_SAU', 'tor:24,-38,0 head:-14,-36,0 aR:46,0,-12 fR:-16,0,0 w:130,0,0 aL:-70,0,24 fL:-56,0,0 lR:-56,0,-10 sR:76,0,0 lL:32,0,10 sL:54,0,0 ao:24',
  // nhảy: thu gối, kiếm giơ cao / chém từ trên xuống đất
  'ASN_NHAY', 'tor:24,-10,0 head:-18,10,0 aR:-172,0,-18 fR:-34,0,0 w:90,0,0 aL:-40,0,54 fL:-40,0,0 lR:-92,0,-8 sR:122,0,0 lL:-48,0,8 sL:112,0,0 ao:20 toc:40 cham:0',
  'ASN_CHEM_DAT', 'tor:58,4,0 head:-46,-4,0 aR:-56,0,-8 fR:-4,0,0 w:104,0,0 aL:34,0,44 fL:-20,0,0 lR:-98,0,-14 sR:122,0,0 lL:22,0,20 sL:112,0,0 ao:54',
  // lộn bóng (thu tròn)
  'ASN_CUI', 'tor:72,0,0 head:-30,0,0 aR:-60,0,-20 fR:-92,0,0 w:-150,0,0 aL:-60,0,20 fL:-92,0,0 lR:-112,0,0 sR:140,0,0 lL:-102,0,0 sL:140,0,0 ao:64 toc:40',
  // Z: kết ấn trước mặt (tay trái dựng hai ngón, kiếm ngược dựng sau cẳng tay) → cúi xoáy chìm vào bóng
  'ASN_Z_AN', 'tor:8,-14,0 head:-6,12,0 aR:-56,0,-14 fR:-96,0,0 w:-150,0,0 aL:-84,0,-34 fL:-118,0,0 lR:-34,0,-12 sR:48,0,0 lL:22,0,12 sL:42,0,0 ao:8',
  'ASN_Z_CUI', 'tor:54,24,0 head:-32,-12,0 aR:-26,0,36 fR:-92,0,0 w:-150,0,0 aL:-36,0,-12 fL:-104,0,0 lR:-104,0,-22 sR:132,0,0 lL:-22,0,32 sL:124,0,0 ao:54 toc:30',
  // C: vặn người, tay trái kẹp kim kéo ngang ngực → phẩy tay ném
  'ASN_C_W', 'tor:16,-62,-6 head:-10,56,0 aR:-20,0,-30 fR:-60,0,0 w:-150,0,0 aL:-88,0,-72 fL:-112,0,0 lR:-40,0,-10 sR:56,0,0 lL:24,0,12 sL:44,0,0 ao:12',
  'ASN_C_NEM', 'tor:30,42,4 head:-20,-36,0 aR:-8,0,-42 fR:-50,0,0 w:-150,0,0 aL:-96,0,12 fL:-4,0,0 lR:-68,0,-10 sR:82,0,0 lL:36,0,10 sL:26,0,0 ao:36',
  'ASN_C_W2', 'tor:-8,-70,-10 head:4,60,0 aR:-20,0,-30 fR:-60,0,0 w:-150,0,0 aL:-150,0,-40 fL:-60,0,0 lR:-20,0,-14 sR:40,0,0 lL:34,0,14 sL:60,0,0 ao:6',
  // X: lấy đà cúi, hiện sau lưng (kéo kiếm ngang hông), đâm xuyên, vẩy kiếm; Đoạn Hầu: cứa ngang cổ
  'ASN_X_DA', 'tor:48,-22,0 head:-38,22,0 aR:22,0,-30 fR:-40,0,0 w:-150,0,0 aL:-52,0,30 fL:-60,0,0 lR:-82,0,-14 sR:112,0,0 lL:10,0,14 sL:92,0,0 ao:40',
  'ASN_X_HIEN', 'tor:26,-36,0 head:-22,32,0 aR:18,0,-16 fR:-100,0,0 w:90,0,0 aL:-62,0,30 fL:-50,0,0 lR:-62,0,-12 sR:82,0,0 lL:30,0,12 sL:56,0,0 ao:30',
  'ASN_X_DAM', 'tor:36,22,0 head:-30,-18,0 aR:-90,0,0 fR:0,0,0 w:90,0,0 aL:32,0,32 fL:-20,0,0 lR:-88,0,-6 sR:88,0,0 lL:52,0,8 sL:20,0,0 ao:52',
  'ASN_X_VAY', 'tor:14,-30,0 head:-10,26,0 aR:-30,0,-62 fR:-10,0,0 w:60,0,0 aL:-40,0,24 fL:-70,0,0 lR:-36,0,-12 sR:50,0,0 lL:24,0,12 sL:44,0,0 ao:14',
  'ASN_X_CUA', 'tor:20,-52,0 head:-14,46,0 aR:-100,0,-62 fR:-6,0,0 w:90,0,0 aL:-40,0,20 fL:-70,0,0 lR:-62,0,-14 sR:76,0,0 lL:34,0,10 sL:30,0,0 ao:30',
  // V: lộn nghiêng (tay dang)
  'ASN_V', 'tor:4,0,0 head:-6,0,0 aR:-10,0,-150 fR:-10,0,0 w:90,0,0 aL:-10,0,150 fL:-10,0,0 lR:-10,0,-34 sR:20,0,0 lL:-10,0,34 sL:20,0,0 ao:30 toc:40 cham:0',
];

// ============================================================================
// CLIP — khoá "t TƯ_THẾ ease", mv "t phải tới [ease]"
// ============================================================================
function dungClip() {
  // bù nhìn tự quay mặt về người chơi ⇒ khoá hướng bằng clip đứng yên (để đâm lưng có nghĩa)
  DK.clip('ASN_GIU', '0 THU; .9 THU', null, null, { tron: .01, than: 0 });
  // ---- combo 6 nhát
  DK.clip('ASN_D1', '0 ASN_THU; .07 ASN_W1 o; .1 ASN_W1 h; .17 ASN_S1 s; .3 ASN_S1 h; .48 ASN_THU', '0 0 0; .17 0 .55 o', 'vet0 .1, trung .15, huy .28', { tron: .05, than: 0 });
  DK.clip('ASN_D2', '0 ASN_THU; .06 ASN_W2 o; .09 ASN_W2 h; .17 ASN_S2 s; .3 ASN_S2 h; .46 ASN_THU', '0 0 0; .17 0 .45 o', 'vet0 .09, trung .14, huy .27', { tron: .05, than: 0 });
  DK.clip('ASN_D3', '0 ASN_THU; .05 ASN_LAO o; .1 ASN_LAO h; .15 ASN_DAM s; .32 ASN_DAM h; .52 ASN_THU', '0 0 0; .05 0 .2; .15 0 2.6 o; .5 0 2.8', 'luot .05, trung .15, huy .32', { tron: .04, than: 0 });
  DK.clip('ASN_D4', '0 ASN_THU; .06 ASN_THAP_W o; .1 ASN_THAP; .36 ASN_THAP h; .56 ASN_THU', '0 0 0; .3 0 .5 o', 'vet0 .08, trung .2, huy .4', { tron: .04, than: 0, xoay: [.08, .34, 360] });
  DK.clip('ASN_D5', '0 ASN_THU; .05 ASN_LAO o; .1 ASN_LAO h; .16 ASN_SAU s; .38 ASN_SAU h; .58 ASN_THU', null, 'luot .07, vet0 .12, trung .16, huy .38', { tron: .04, than: 0 });
  DK.clip('ASN_D5K', '0 ASN_THU; .05 ASN_LAO o; .1 ASN_LAO h; .16 ASN_SAU s; .38 ASN_SAU h; .58 ASN_THU', '0 0 0; .1 0 2.6 o', 'luot .05, vet0 .12, trung .16, huy .38', { tron: .04, than: 0 });
  DK.clip('ASN_D6', '0 ASN_THU; .06 ASN_X_DA o; .12 ASN_NHAY o; .34 ASN_NHAY; .5 ASN_CHEM_DAT s; .66 ASN_CHEM_DAT h; .88 ASN_THU', '0 0 0; .1 0 0; .5 0 1.8 io',
    'nhay .1, vet0 .4, trung .52, huy .7', { tron: .05, than: 0, lon: [.14, .4, 360], tam: .9 });
  // ---- lộn né thành bóng
  DK.clip('ASN_LON', '0 ASN_THU; .05 ASN_CUI o; .3 ASN_CUI; .42 ASN_THU o', '0 0 0; .34 0 4.4 o', 'tan .04, hien .3, huy .36', { tron: .03, than: 0, lon: [.06, .32, 360], tam: .6 });
  // ---- Z Ẩn Ảnh
  DK.clip('ASN_Z', '0 ASN_THU; .1 ASN_Z_AN o; .2 ASN_Z_AN h; .32 ASN_Z_CUI o; .5 ASN_Z_CUI h; .72 ASN_THU', null, 'khoi .2, an .32, huy .56', { tron: .05, than: 0, xoay: [.2, .5, 360] });
  // ---- X Bối Thứ: thế đâm tới ĐÚNG lúc nhát đâm (.2) — sửa lệch 0,6 s của bản game
  DK.clip('ASN_X', '0 ASN_THU; .08 ASN_X_DA o; .1 ASN_X_HIEN h; .2 ASN_X_DAM s; .38 ASN_X_DAM h; .54 ASN_X_VAY io; .8 ASN_THU', null, 'tan .08, hien .1, vet0 .12, dam .2, rut .44, huy .52', { tron: .05, than: 0 });
  DK.clip('ASN_X_HAU', '0 ASN_THU; .08 ASN_X_DA o; .1 ASN_W2 h; .2 ASN_X_CUA s; .38 ASN_X_CUA h; .54 ASN_X_VAY io; .8 ASN_THU', null, 'tan .08, hien .1, vet0 .13, dam .2, rut .44, huy .52', { tron: .05, than: 0 });
  DK.clip('ASN_X_BONG', '0 ASN_X_HIEN; .1 ASN_X_DAM s; .3 ASN_X_DAM h; .5 ASN_X_VAY', null, null, { tron: .01, than: 0 });
  // ---- C Độc Châm
  DK.clip('ASN_C', '0 ASN_THU; .08 ASN_C_W o; .11 ASN_C_W h; .17 ASN_C_NEM s; .38 ASN_C_NEM h; .6 ASN_THU', '0 0 0; .17 0 .3 o', 'nem .16, huy .4', { tron: .05, than: 0 });
  DK.clip('ASN_C_VAN', '0 ASN_THU; .06 ASN_C_W o; .22 ASN_C_NEM; .42 ASN_C_NEM h; .62 ASN_THU', null, 'nem .21, huy .44', { tron: .05, than: 0, xoay: [.06, .24, 360] });
  DK.clip('ASN_C_COT', '0 ASN_THU; .12 ASN_C_W2 o; .17 ASN_C_W2 h; .23 ASN_C_NEM s; .45 ASN_C_NEM h; .68 ASN_THU', '0 0 0; .12 0 -.3; .23 0 .5 o', 'nem .22, huy .48', { tron: .05, than: 0 });
  // ---- V Ảo Ảnh: lộn nghiêng đúng phía (lan âm = lộn sang phải)
  DK.clip('ASN_V_P', '0 ASN_THU; .05 ASN_V o; .28 ASN_V; .38 ASN_THAP_W o; .6 ASN_THU', '0 0 0; .32 3 0 o', 'tach .04, an .1, huy .42', { tron: .03, than: 0, lan: [.05, .32, -360], tam: .9 });
  DK.clip('ASN_V_T', '0 ASN_THU; .05 ASN_V o; .28 ASN_V; .38 ASN_THAP_W o; .6 ASN_THU', '0 0 0; .32 -3 0 o', 'tach .04, an .1, huy .42', { tron: .03, than: 0, lan: [.05, .32, 360], tam: .9 });
  // ---- R U Minh
  DK.clip('ASN_R0', '0 ASN_THU; .08 ASN_Z_CUI o; .2 ASN_Z_CUI h', null, 'chim .1', { tron: .05, than: 0 });
  DK.clip('ASN_RS1', '0 ASN_W1; .05 ASN_S1 s; .22 ASN_S1 h', null, null, { tron: .01, than: 0 });
  DK.clip('ASN_RS2', '0 ASN_W2; .05 ASN_S2 s; .22 ASN_S2 h', null, null, { tron: .01, than: 0 });
  DK.clip('ASN_RS3', '0 ASN_X_HIEN; .05 ASN_DAM s; .22 ASN_DAM h', null, null, { tron: .01, than: 0 });
  DK.clip('ASN_RS4', '0 ASN_THAP_W; .1 ASN_THAP; .22 ASN_THAP h', null, null, { tron: .01, than: 0, xoay: [0, .14, 300] });
  DK.clip('ASN_R_CHOT', '0 ASN_NHAY; .12 ASN_CHEM_DAT s; .4 ASN_CHEM_DAT h; .7 ASN_THU', null, null, { tron: .02, than: 0, lon: [0, .12, 200], tam: .9 });
}

// ============================================================================
// TIỆN ÍCH HIỆU ỨNG (khối / quad / hạt voxel — port Unity được)
// ============================================================================
const camPos = () => DK.cam.position;
/** vật liệu viền kiểu vỏ lộn ngược (inverted hull — Unity làm bằng Cull Front): chỉ hiện quanh hình bóng */
const matVien = (mau, op) => new T.MeshBasicMaterial({ color: vfx.mau(mau), transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false, side: T.BackSide });
/** quầng tròn hướng máy (tối = pha thường, sáng = cộng) */
function quang(p, r, mau, song = .35, op = null) {
  const c = vfx.mau(mau), toi = c.r + c.g + c.b < 1;
  const a0 = op != null ? op : (toi ? .6 : .7);
  const sp = new T.Sprite(new T.SpriteMaterial({ map: vfx.texTron, color: c, blending: toi ? T.NormalBlending : T.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: toi }));
  sp.position.copy(p); sp.renderOrder = 8;
  return vfx.them(sp, song, (dt, u) => { const k = r * (.4 + 1.3 * DK.ease('o', u)); sp.scale.set(k * 1.4, k * 1.4, 1); sp.material.opacity = a0 * (1 - u * u); });
}
/** vòng nở sát đất, pha thường (vòng tối nhìn được trên nền sáng lẫn tối) */
function vongDat(p, bk0, bk1, mau, song = .5, op = .7, day = .35) {
  const m = new T.Mesh(new T.RingGeometry(Math.max(.05, 1 - day / Math.max(bk1, .4)), 1, 56), vfx.matThuong(mau, op));
  m.rotation.x = -Math.PI / 2; m.position.copy(p); m.position.y = (dia ? dia.cao(p.x, p.z) : 0) + .05; m.renderOrder = 5;
  return vfx.them(m, song, (dt, u) => { const k = Math.max(.01, bk0 + (bk1 - bk0) * DK.ease('o', u)); m.scale.set(k, k, k); m.material.opacity = op * (1 - u * u); });
}
/** vạch thẳng a→b (quad mềm quay mặt về máy quanh trục) */
function vach(a, b, mau, day = .08, song = .35, cong = true) {
  const d = b.clone().sub(a), L = d.length(); if (L < 1e-4) return null;
  const mat = cong ? vfx.matCong(mau, 1) : vfx.matThuong(mau, 1); mat.map = vfx.texTron; mat.toneMapped = !cong;
  const m = new T.Mesh(new T.PlaneGeometry(1, 1), mat); m.renderOrder = 7;
  const mid = a.clone().add(b).multiplyScalar(.5), y = d.clone().divideScalar(L), z = new V3(), x = new V3(), M = new T.Matrix4();
  m.position.copy(mid); m.scale.set(day * 3, L * 1.12, 1);
  const dat = () => { z.copy(camPos()).sub(mid); z.addScaledVector(y, -z.dot(y)); if (z.lengthSq() < 1e-6) z.set(0, 1, 0); z.normalize(); x.crossVectors(y, z).normalize(); M.makeBasis(x, y, z); m.quaternion.setFromRotationMatrix(M); };
  dat();
  return vfx.them(m, song, (dt, u) => { dat(); m.material.opacity = (1 - u) * (1 - u); m.scale.x = day * 3 * (1 - u * .6); });
}
/** khói bóng tối: khối voxel tím đen đặc bốc lên + tia tím sáng nhỏ */
function khoi(p, r = 1, k = 1) {
  const n = Math.round((8 + r * 7) * k);
  vfx.hat(p.clone().add(V(0, .45, 0)), { so: n, mau: KHOI, to: true, toc: 1.2 + r, co: .16 + r * .04, song: .75, trongLuc: -2.4, can: 4, lech: r * .35, dat: false });
  vfx.hat(p.clone().add(V(0, .9, 0)), { so: Math.round((5 + r * 4) * k), mau: TIM_SANG, toc: 1.8 + r, co: .06, song: .5, trongLuc: -1.5, can: 3, lech: r * .3, dat: false });
  quang(p.clone().add(V(0, .9, 0)), Math.max(.5, r * .7), TIM_TOI, .35);
}
/** vùng tối phủ đất (quad mềm mép nằm sát đất, pha thường) — nở ra trong `no` giây, giữ, rồi tan */
function vungToi(p, r, song = 2, op = .7, mau = DEN_TIM, no = .5) {
  const mat = new T.MeshBasicMaterial({ map: vfx.texTron, color: vfx.mau(mau), transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 });
  const m = new T.Mesh(new T.PlaneGeometry(2, 2), mat); m.rotation.x = -Math.PI / 2; m.position.set(p.x, .05, p.z); m.renderOrder = 3;
  return vfx.them(m, song, (dt, u, t) => {
    const k = Math.max(.02, r * 1.25 * DK.ease('o', Math.min(1, t / no))); m.scale.set(k, k, 1);
    mat.opacity = op * Math.min(1, t / (no * .5)) * (u > .75 ? (1 - u) / .25 : 1);
  });
}
/** bóng tối loang trên đất */
const loang = (p, r, manh = .6, giu) => { if (!dia) return; dia.chay(p, r, { mau: DAT_TOI, manh, giu }); if (manh > .5) dia.chay(p, r * .8, { mau: DAT_TOI, manh: manh * .6, giu }); };
/** vệt bóng dọc đường lướt a→b */
function vetBong(a, b, r = .6, manh = .5) {
  const L = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(1, Math.ceil(L / .55));
  for (let i = 0; i <= n; i++) {
    const p = a.clone().lerp(b, i / n);
    loang(p, r * (.75 + .25 * Math.sin(i * 1.7)), manh);
    if (i % 2 === 0) vfx.hat(p.clone().add(V(0, .15, 0)), { so: 2, mau: DEN_TIM, to: true, toc: .8, co: .16, song: .55, trongLuc: -1.5, can: 4, dat: false, lech: .2 });
  }
}
/** vết chém xẻ đất ngắn (rãnh mảnh viền tím + cỏ đứt) */
function chemDat(a, b, rong = .22, sau = .14) {
  if (!dia) return;
  dia.ranh(a, b, rong, sau, { mau: TIM });
  dia.cat(a, b, rong * 2.6);
  const m = a.clone().lerp(b, .5); dia.vun(m, { so: 6, luc: 2, len: 3, co: .12, r: .4 });
}
/** độ trong suốt an toàn (giữ độ đục gốc của từng vật liệu — vfx.trong cũ làm bao kiếm quang sáng gắt sau khi hiện lại) */
function trongNv(nv, a) {
  nv.root.traverse(o => {
    if (!o.isMesh || !o.material) return; const m = o.material, u = m.userData;
    if (u.op0 == null) { u.op0 = m.opacity; u.tr0 = m.transparent; u.dw0 = m.depthWrite; }
    if (a >= .99) { m.opacity = u.op0; m.transparent = u.tr0; m.depthWrite = u.dw0; }
    else { m.transparent = true; m.opacity = u.op0 * a; m.depthWrite = false; }
  });
}
/** ảnh sót TỐI (phân thân bóng): lõi tím đen pha thường + viền tím cộng sáng; troi = vận tốc trôi */
function anhToi(nv, song = .6, op = .6, troi = null, vien = .35) {
  const g = new T.Group();
  const mat = new T.MeshBasicMaterial({ color: DEN_TIM, transparent: true, opacity: op, depthWrite: true });   // ghi độ sâu ⇒ viền chỉ lộ quanh hình bóng
  const matV = matVien(TIM, vien);
  nv.root.updateMatrixWorld(true);
  nv.root.traverse(o => {
    if (!o.isMesh || !o.visible || !o.material || o.material.blending === T.AdditiveBlending) return;
    o.geometry.giu = true;
    const m = new T.Mesh(o.geometry, mat); m.renderOrder = 6; o.matrixWorld.decompose(m.position, m.quaternion, m.scale); g.add(m);
    if (vien > 0) { const v = new T.Mesh(o.geometry, matV); v.position.copy(m.position); v.quaternion.copy(m.quaternion); v.scale.copy(m.scale).multiplyScalar(1.12); v.renderOrder = 7; g.add(v); }
  });
  return vfx.them(g, song, (dt, u) => { mat.opacity = op * (1 - u); matV.opacity = vien * (1 - u); if (troi) g.position.addScaledVector(troi, dt); });
}

// ============================================================================
// ẨN THÂN (bản nâng cấp): thân như kính tím + vũng bóng dưới chân + gợn bóng mỗi .3 s; đòn trực tiếp làm lộ (trừ lúc giữ ẩn)
// ============================================================================
const AN = { het: -1, giu: -1, k: 1, ap: 1, mo: null, tGon: 0, nhanh: null };
const dangAn = () => DK.now < AN.het;
const dangGiu = () => DK.now < AN.giu;
const datAn = g => { AN.het = Math.max(AN.het, DK.now + g); };
const giuAn = g => { AN.giu = Math.max(AN.giu, DK.now + g); };
const thoiAn = () => { AN.het = -1; AN.giu = -1; };
/** hiện thoáng (đòn trong bóng tối): độ đục a trong t giây */
const loe = (a, t) => { AN.mo = { a, het: DK.now + t }; };
// vũng bóng dưới chân lúc ẩn
const vung = new T.Mesh(new T.CircleGeometry(.9, 32), new T.MeshBasicMaterial({ map: vfx.texTron, color: DEN_TIM, transparent: true, opacity: 0, depthWrite: false }));
vung.rotation.x = -Math.PI / 2; vung.renderOrder = 4; DK.scene.add(vung);
DK.moiKhung(dt => {
  const an = dangAn();
  let muc = an ? (AN.nhanh === 'u_anh' ? .14 : .22) : 1;
  if (AN.mo) { if (DK.now < AN.mo.het) muc = Math.min(muc, AN.mo.a); else AN.mo = null; }
  AN.k += (muc - AN.k) * Math.min(1, dt * (muc > AN.k ? 30 : 16));
  if (Math.abs(AN.k - AN.ap) > .008 || (muc === 1 && AN.ap !== 1 && Math.abs(AN.k - 1) < .01)) {
    AN.ap = Math.abs(AN.k - 1) < .01 ? 1 : AN.k; trongNv(nc, AN.ap);
    const e = 1 - AN.ap; if (nc.mat && nc.mat.emissive) nc.mat.emissive.setRGB(.22 * e, .08 * e, .42 * e);
  }
  const kv = an ? 1 : 0; vung.material.opacity += (kv * (AN.nhanh === 'u_anh' ? .8 : .6) - vung.material.opacity) * Math.min(1, dt * 8);
  vung.visible = vung.material.opacity > .01;
  if (vung.visible) { vung.position.set(nc.pos.x, (dia ? dia.cao(nc.pos.x, nc.pos.z) : 0) + .03, nc.pos.z); const s = 1 + .08 * Math.sin(DK.now * 7); vung.scale.set(s, s, 1); }
  if (an && DK.now - AN.tGon > .3) { AN.tGon = DK.now; anhToi(nc, .45, .16, null, .15); }
});
DK.nghe('trung', x => {
  if (!x || !x.op || x.op.nguon !== nc || x.dich === nc || x.op.asDoc) return;
  if (dangAn() && !dangGiu()) { thoiAn(); quang(nguc(nc), .8, TIM, .3); }
});
const heSoBongToi = nh => !dangAn() ? 1 : (AN.nhanh === 'u_anh' ? 1.6 : 1.3);

// ---------------------------------------------------------------- hệ số tầng + trạng thái (giống CongPhapVuKhi của game)
const TEN_TT = { giap_vo: 'Giáp vỡ', cham: 'Chậm', choang: 'Choáng', an_than: 'Ẩn', doc: 'Độc' };
const boDL = () => DL.CONG_PHAP.find(b => b.ma === MA);
function thongTin(ch, tang, nh) {
  const td = ch.tang[Math.min(tang, ch.tang.length) - 1] || {}; const n = nh ? ch.nhanh.find(x => x.ma === nh) : null;
  let k = td.he_so > 0 ? td.he_so : 1; if (n && n.so_mod && n.so_mod.he_so > 0) k *= n.so_mod.he_so;
  let tt = td.trang_thai && td.trang_thai.ma && td.trang_thai.giay > 0 && !td.trang_thai.ban_than ? td.trang_thai.ma : null;
  if (n && n.so_mod && n.so_mod.trang_thai) tt = n.so_mod.trang_thai;
  return { heSo: k, tt: tt ? (TEN_TT[tt] || tt) : null };
}
/** bắt đầu chiêu: nhánh chỉ hiệu lực từ Đại Thành (như game) */
function batDau(ctx) {
  const nh = ctx.tang >= 3 ? ctx.nhanh : null; const t = thongTin(ctx.ch, ctx.tang, nh);
  return { nh, heSo: t.heSo, tt: t.tt, st: ctx.ch.sat_thuong || 0 };
}
function danh(d, st, op = {}) {
  if (!d) return;
  DK.trung(d, { nguon: nc, st, mau: op.mau || TIM, day: op.lui || 0, hat: op.len || 0, trangThai: op.tt || undefined, asDoc: op.asDoc, khongPhanUng: op.khongPhanUng });
}
// bù nhìn khoá hướng (không tự quay về người chơi) để đâm lưng có nghĩa
const giuHuong = d => { if (d && !d.hd) DK.phat(d, 'ASN_GIU', { khongMv: true }); };

// ============================================================================
// PHÂN THÂN BÓNG — nhân vật khối thật (cùng khung xương), vật liệu tím đen + viền tím; diễn được clip
// ============================================================================
function taoPhanThan(pos, yaw, op = {}) {
  const b = new DK.NhanVat('kiem_tu', { x: pos.x, z: pos.z, yaw });
  b.la = 'bu_nhin';                       // camNC: không treo tua kiếm, không bao quang
  b.camKiem(nc.vk);
  const m = b.mat; m.vertexColors = false; m.color = (op.mau || DEN_TIM).clone(); m.emissive = (op.phat || TIM_TOI).clone(); m.emissiveIntensity = .45;
  m.transparent = true; m.opacity = 0; m.depthWrite = true; m.needsUpdate = true;
  const matV = matVien(op.vien || TIM, 0);
  const ds = []; b.root.traverse(o => { if (o.isMesh && o.material === m) ds.push(o); });
  for (const o of ds) { const v = new T.Mesh(o.geometry, matV); v.scale.setScalar(1.14); v.renderOrder = 7; o.add(v); }
  b.matV = matV; b.vienOp = op.vienOp != null ? op.vienOp : .55;
  b.tuThe.set(DK.TT[op.tt || 'ASN_THU']); b.apDung();
  b.datK = k => { m.opacity = .9 * k; matV.opacity = b.vienOp * k; b.root.visible = k > .01; if (b.kiemThat) b.kiemThat.traverse(o => { if (o.material) { o.material.transparent = true; o.material.opacity = k; } }); };
  b.datK(0);
  b.clip = null; b.tClip = 0;
  b.dien = (ten) => { b.clip = DK.layClip(ten); b.tClip = 0; };
  b.buoc = dt => { if (b.clip) { b.tClip += dt; DK.layMau(b.clip, Math.min(b.tClip, b.clip.dai), b.tuThe); } b.apDung(); };
  b.xoa = () => { DK.scene.remove(b.root); };
  return b;
}

// ============================================================================
// ĐÒN THƯỜNG — 6 nhát: chém chéo · quét ngược tay · lướt đâm · xoay thấp · lướt ra sau lưng đâm ngược · nhảy chém từ trên
// ============================================================================
function vetKiem(ctx, song = .1, tan = .2) { return vfx.vet(nc, { song, tan, kieu: 'muc', mau: ctx.mau }); }
function trungNon(ctx, r, goc, st, op = {}) {
  const ds = DK.trongNon(nc, r, goc);
  for (const d of ds) {
    danh(d, st, Object.assign({ mau: ctx.mau }, op));
    const nd = nguc(d);
    vfx.hat(nd, { so: 8, mau: ctx.mau.clone().multiplyScalar(2), toc: 5, co: .05, song: .3, huong: ngang(d.pos.clone().sub(nc.pos)), loe: .6, dat: false });
  }
  return ds;
}
function danhCombo(ctx, i) {
  const ST = 40;
  if (i === 0) ctx.phat('ASN_D1', { moc: { vet0: () => vetKiem(ctx), trung: () => trungNon(ctx, 2.7, 130, ST, { lui: .25 }) } });
  else if (i === 1) ctx.phat('ASN_D2', { moc: { vet0: () => vetKiem(ctx), trung: () => trungNon(ctx, 2.7, 140, ST, { lui: .25 }) } });
  else if (i === 2) {
    let a = null;
    ctx.phat('ASN_D3', { moc: {
      luot: () => { a = nc.pos.clone(); anhToi(nc, .4, .45); khoi(nc.pos, .5, .6); },
      trung: () => {
        vetKiem(ctx, .08, .18);
        if (a) vetBong(a, nc.pos, .45, .45);
        const ds = DK.trongDuong(a || nc.pos, nc.quanh(0, 0, 1.6), 1.6).concat(DK.trongNon(nc, 2.6, 60));
        for (const d of new Set(ds)) { danh(d, ST * 1.2, { mau: ctx.mau, lui: .5 }); vfx.hat(nguc(d), { so: 12, mau: ctx.mau.clone().multiplyScalar(2), toc: 6, co: .05, song: .3, huong: nc.toi(), loe: .3, dat: false }); }
      } } });
  } else if (i === 3) {
    ctx.phat('ASN_D4', { moc: {
      vet0: () => vfx.vet(nc, { song: .26, tan: .22, kieu: 'muc', mau: ctx.mau }),
      trung: () => {
        for (const d of DK.trongTron(nc.pos, 2.8)) { danh(d, ST, { mau: ctx.mau, lui: .3 }); }
        // cỏ quanh vòng quét bị cắt sát gối
        if (dia) { const c = nc.pos; for (let k = 0; k < 10; k++) { const a1 = k / 10 * Math.PI * 2, a2 = (k + 1) / 10 * Math.PI * 2; dia.cat(V(c.x + Math.cos(a1) * 1.9, 0, c.z + Math.sin(a1) * 1.9), V(c.x + Math.cos(a2) * 1.9, 0, c.z + Math.sin(a2) * 1.9), .5); } }
      } } });
  } else if (i === 4) {
    const d = ctx.dich && ctx.dich.pos.distanceTo(nc.pos) < 6 ? ctx.dich : null;
    if (d) {
      ctx.phat('ASN_D5', { moc: {
        luot: () => {
          const a = nc.pos.clone(), h = ngang(d.pos.clone().sub(a));
          const den = d.pos.clone().addScaledVector(h, 1.15); den.y = 0;
          anhToi(nc, .45, .55); khoi(a, .6, .7);
          vetBong(a, den, .5, .5);
          dichToi(nc, den); quayMat(nc, h);           // quay lưng về địch
          khoi(den, .5, .6);
          giuHuong(d);
        },
        vet0: () => vetKiem(ctx, .06, .2),
        trung: () => {
          const lung = oSauLung(d, nc.pos);
          danh(d, ST * (lung ? 1.8 : 1.2), { mau: ctx.mau, lui: -.3 });
          const nd = nguc(d); vfx.hat(nd, { so: 14, mau: ctx.mau.clone().multiplyScalar(2), toc: 6, co: .05, song: .3, huong: nc.toi().negate(), loe: .4, dat: false });
          quang(nd, .5, TIM, .2);
          DK.rung(.1);
        } } });
    } else {
      ctx.phat('ASN_D5K', { moc: { luot: () => { anhToi(nc, .4, .5); khoi(nc.pos, .5, .6); }, vet0: () => vetKiem(ctx, .06, .2), trung: () => trungNon(ctx, 2.2, 360, ST) } });
    }
  } else {
    ctx.phat('ASN_D6', { moc: {
      nhay: () => { nc.vy = 4.6; nc.datDat = false; },
      vet0: () => vfx.vet(nc, { song: .14, tan: .22, kieu: 'muc', mau: ctx.mau }),
      trung: () => {
        const h = nc.toi(), p = nc.quanh(0, 0, 1.3);
        for (const d of DK.trongTron(p, 1.9)) danh(d, ST * 1.6, { mau: ctx.mau, lui: .6 });
        chemDat(nc.quanh(0, 0, .5), nc.quanh(0, 0, 2.8), .2, .16);
        vfx.hat(p.clone().add(V(0, .1, 0)), { so: 14, mau: ctx.mau.clone().multiplyScalar(2), toc: 4, co: .06, song: .35, huong: UP, loe: .7 });
        loang(p, 1, .4);
        DK.rung(.16);
        void h;
      } } });
  }
}

// ---------------------------------------------------------------- lộn né: tan thành bóng, lộn tới, hiện lại
function lonNe(ctx) {
  const a = nc.pos.clone();
  ctx.phat('ASN_LON', { moc: {
    tan: () => { anhToi(nc, .55, .65); khoi(a, .7, .8); loe(.12, .26); },
    hien: () => { vetBong(a, nc.pos, .45, .45); khoi(nc.pos, .45, .5); quang(nguc(nc), .6, TIM, .2); },
  } });
}

// ============================================================================
// Z · ẨN ẢNH
// ============================================================================
function anAnh(ctx) {
  const b = batDau(ctx), tang = ctx.tang, nh = b.nh;
  let giay = 2.6 + .4 * (tang - 1); if (tang >= 5) giay *= 1.5;
  if (nh === 'u_anh') giay *= 1.5; else if (nh === 'yen_vu') giay *= .7;
  const p = nc.pos.clone();
  const docVu = nh === 'yen_vu';
  ctx.phat('ASN_Z', { moc: {
    khoi: () => {
      khoi(p, 1.3, 1.2);
      loang(p, 1.6, .7);
      if (docVu) { vfx.hat(p.clone().add(V(0, .5, 0)), { so: 26, mau: SRGB(.18, .32, .08), to: true, toc: 3.5, co: .26, song: 1.1, trongLuc: -1.2, can: 3, lech: .8, dat: false }); }
      if (tang >= 2) { vongDat(p, .4, tang >= 3 ? 4 : 2.6, docVu ? SRGB(.2, .4, .1) : TIM_TOI, .55, .75, .5); dia && dia.gio(p, tang >= 3 ? 4.5 : 3, .6); }
      if (tang >= 4) {
        // Viên Mãn: Vực Ảnh — bóng tối loang ra 6 m trong .6 s, trời ngả tím đen, cỏ rạp
        const r = tang >= 5 ? 7.5 : 6;
        vungToi(p, r, THAT(giay) * .7, docVu ? .45 : .62, docVu ? SRGB(.12, .2, .03) : DEN_TIM, .5);
        for (let k = 1; k <= 4; k++) DK.sau(k * .12, () => { loang(p, r * k / 4, .45, 9); vongDat(p, r * k / 4 - .6, r * k / 4, docVu ? SRGB(.18, .3, .06) : DEN_TIM, .35, .5, .6); });
        if (!docVu) vfx.troi(SRGB(.08, .03, .14), THAT(giay) * .8, .5);
        vfx.vienMan(docVu ? LUC : TIM_TOI, 1.2, .45);
        dia && dia.gio(p, r + 2, 1.1);
        // lửa u minh bốc thành cột mảnh quanh vành
        for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; const q = p.clone().add(V(Math.cos(a) * r * .8, .1, Math.sin(a) * r * .8)); DK.sau(.1 + k * .02, () => vfx.hat(q, { so: 3, mau: docVu ? LUC_SANG : TIM_SANG, toc: 2.6, huong: UP, loe: .15, co: .07, song: .9, trongLuc: -1, can: 1.5, dat: false })); }
      }
    },
    an: () => {
      AN.nhanh = nh; datAn(THAT(giay));
      quang(nguc(nc), .9, TIM, .25);
      if (tang >= 5) {
        // Hoá Cảnh: ba phân thân bóng toả ra rồi tan; sóng đất nhẹ; khung va chạm mực
        vfx.vaCham({ kieu: 'dao', mau: TIM, song: .06 });
        dia && dia.song(p, { r: 7, toc: 16, cao: .16, rong: 1 });
        for (let k = 0; k < 3; k++) { const h = xoayY(nc.toi(), 120 * k + 60); anhToi(nc, .9, .55, h.multiplyScalar(4.5), .4); }
      }
      if (tang < 3 && !docVu) return;
      const r = docVu ? 5 : tang >= 5 ? 6 : 4;
      for (const o of DK.trongTron(p, r - .35)) {
        DK.chuNoi(tang >= 5 ? 'Chậm · Choáng' : (docVu ? 'Chậm · Mất dấu' : 'Chậm'), o.diem('dau').add(V(0, .8, 0)), docVu ? '#b4ff8a' : '#c9a8ff');
        if (docVu) docNgam(o, 3, 4);
      }
      if (docVu) {
        // Yên Vụ: khói độc làm cỏ héo úa (đất ngả vàng lục), cỏ rũ
        for (let k = 1; k <= 3; k++) DK.sau(k * .1, () => dia && dia.chay(p, r * k / 3, { mau: DAT_DOC, manh: .32, giu: 8 }));
        for (let k = 0; k < 18; k++) vfx.hat(p.clone().add(V(RR(-r, r) * .7, RR(.2, 1.4), RR(-r, r) * .7)), { so: 1, mau: k & 1 ? SRGB(.2, .38, .1) : LUC_SANG, to: !(k & 1), toc: .6, huong: UP, loe: .8, co: k & 1 ? .3 : .06, song: RR(1, 1.8), trongLuc: -.4, can: 1, dat: false });
        dia && dia.gio(p, r, .5);
      }
    },
  } });
}

// ============================================================================
// X · BỐI THỨ — tan vào bóng, vệt bóng xẻ đất tới sau lưng, hiện ra, đâm xuyên (thế đâm trùng nhát đâm), vẩy kiếm
// ============================================================================
function boiThu(ctx) {
  const b = batDau(ctx), tang = ctx.tang, nh = b.nh;
  const d = ctx.dich && ctx.dich.pos.distanceTo(nc.pos) <= 14.5 ? ctx.dich : null;
  const goc0 = nc.pos.clone(), hs = heSoBongToi();
  const MANH = b.st * b.heSo * (nh === 'doan_hau' ? 1.2 : 1);
  const clip = nh === 'doan_hau' ? 'ASN_X_HAU' : 'ASN_X';
  if (d) giuHuong(d);
  const kc = BK + BK + .45;
  let den = d ? sauLung(d, kc) : goc0.clone().addScaledVector(nc.toi(), 6);
  if (d) quang(den.clone().add(UP), .6, TIM_TOI, .25);           // báo trước: khói loé sau lưng (game: 0,15 s trước nhát)
  ctx.phat(clip, { moc: {
    tan: () => { anhToi(nc, .5, .6); khoi(goc0, 1, .9); loe(.1, .05); },
    hien: () => {
      if (d) den = sauLung(d, kc);
      vetBong(goc0, den, tang >= 2 ? .65 : .45, tang >= 2 ? .6 : .45);
      dichToi(nc, den); if (d) nc.ngam(d.pos);
      AN.mo = null; AN.k = Math.max(AN.k, .75);              // hiện ra dứt khoát
      khoi(den, .7, .7);
    },
    vet0: () => vfx.vet(nc, { song: .1, tan: .24, kieu: 'muc', mau: ctx.mau }),
    dam: () => {
      const h = d ? ngang(d.pos.clone().sub(nc.pos)) : nc.toi();
      if (!d) { for (const o of DK.trongNon(nc, 2.6, 70)) danh(o, MANH * hs, { lui: .4, mau: ctx.mau }); vach(nguc(nc).addScaledVector(h, .4), nguc(nc).addScaledVector(h, 2.6), TIM_SANG, .06, .25); return; }
      const lung = oSauLung(d, nc.pos);
      const st = MANH * (lung ? (tang >= 5 ? 3 : 2.5) : 1) * hs;
      danh(d, st, { lui: .45, mau: ctx.mau, tt: nh === 'doan_hau' ? 'Choáng' : b.tt });
      const nd = nguc(d);
      if (nh === 'doan_hau') {
        // cứa ngang yết hầu: vạch ngang ở cổ
        const ng = phaiCua(h), co = nd.clone().add(V(0, .3, 0));
        vach(co.clone().addScaledVector(ng, -.9), co.clone().addScaledVector(ng, .9), TIM_SANG, .05, .3);
      } else {
        // đâm xuyên: tia mảnh xuyên ngực ra trước + tia lửa tím phun theo hướng đâm
        vach(nd.clone().addScaledVector(h, -.5), nd.clone().addScaledVector(h, 1.8), TIM_SANG, .05, .28);
        vfx.hat(nd.clone().addScaledVector(h, .3), { so: 18, mau: TIM_SANG, toc: 7, co: .05, song: .32, huong: h, loe: .25, dat: false, trongLuc: 3 });
      }
      quang(nd, .55, TIM, .18);
      DK.rung(.14);
      if (tang >= 2) loang(d.pos, 1.3, .55);
      if (tang >= 4) {
        // Viên Mãn: kiếm hồn xuyên thấu bay ra trước, xẻ rãnh dọc đất rồi cắm xuống
        kiemXuyen(nd.clone().addScaledVector(h, .4), h, tang >= 5 ? 10 : 7, MANH * .5 * hs, d);
        dia && dia.nut(d.pos, { r: tang >= 5 ? 3 : 2, nhanh: tang >= 5 ? 8 : 5, mau: TIM, song: 3, rong: .07 });
      }
      if (tang >= 5) { vfx.vaCham({ kieu: 'dao', mau: TIM, song: .07 }); vfx.vienMan(TIM_TOI, 1, .4); }
    },
    rut: () => {
      vfx.hat(nc.mui(), { so: 6, mau: TIM, toc: 3, co: .05, song: .35, huong: nc.phai(), loe: .5 });   // vẩy kiếm
      if (nh === 'anh_hoan') {
        anhToi(nc, .5, .6); khoi(nc.pos, .8, .8);
        vetBong(nc.pos.clone(), goc0, .4, .4);
        dichToi(nc, goc0); khoi(goc0, .8, .8); AN.nhanh = null; datAn(THAT(1.5));
      }
    },
  } });
  // Đại Thành: Song Ảnh — phân thân đâm từ phía trước (40 %); Hoá Cảnh thêm phân thân thứ ba từ bên hông
  if (d && tang >= 3) {
    ctx.sau(.2, () => bongDam(d, matCua(d), MANH * .4 * hs, ctx));
    if (tang >= 5) ctx.sau(.28, () => bongDam(d, phaiCua(matCua(d)), MANH * .4 * hs, ctx));
  }
}
/** phân thân hiện ra cạnh địch và đâm (dùng clip ASN_X_BONG trên nhân vật bóng) */
function bongDam(d, phia, manh, ctx) {
  if (!conSong(d)) return;
  const p = quanhDich(d, phia, BK + 1.15); const h = ngang(d.pos.clone().sub(p));
  const bo = taoPhanThan(p, Math.atan2(h.x, h.z), { tt: 'ASN_X_HIEN' }); bo.dien('ASN_X_BONG');
  khoi(p, .5, .5);
  let daDam = false;
  vfx.them(null, .75, (dt, u, t) => {
    bo.buoc(dt); bo.datK(Math.min(1, t / .06) * (u > .6 ? (1 - u) / .4 : 1));
    if (!daDam && t >= .1) {
      daDam = true; danh(d, manh, { mau: ctx.mau });
      const nd = nguc(d); vach(p.clone().add(V(0, 1.2, 0)), nd.clone().addScaledVector(h, .8), TIM, .05, .25);
      vfx.hat(nd, { so: 10, mau: TIM_SANG, toc: 5, co: .05, song: .3, huong: h, loe: .4, dat: false });
    }
  }, () => { bo.xoa(); quang(p.clone().add(UP), .5, TIM_TOI, .25); });
}
/** kiếm hồn (phiKiem 'hon') bay sát đất xẻ rãnh, cắm xuống cuối đường */
function kiemXuyen(tu, h, dai, manh, boQua) {
  const pk = vfx.phiKiem({ dai: 1.05, co: 1.35, kieu: 'hon', mau: TIM, sang: 2.2, song: 1.2 });
  const toc = 30; let di = 0; const p0 = tu.clone(); let truoc = V(p0.x, 0, p0.z); const thu = [boQua];
  pk.dat(p0, h);
  DK.lap((dt, tl) => {
    di = Math.min(dai, di + toc * dt);
    const u = di / dai, y = 1.25 * (1 - u) + .15 * u;
    const p = p0.clone().addScaledVector(h, di); p.y = y;
    const huong = h.clone(); huong.y = -1.1 / dai; pk.dat(p, huong.normalize());
    const dat = V(p.x, 0, p.z);
    if (dia && dat.distanceTo(truoc) > .5) { dia.ranh(truoc, dat, .22 + .12 * u, .12 + .2 * u, { mau: TIM }); dia.cat(truoc, dat, .7); truoc = dat; }
    for (const o of DK.trongDuong(p0, p, 1.4)) if (thu.indexOf(o) < 0) { thu.push(o); danh(o, manh, { lui: .5 }); }
    if (u >= 1) {
      pk.huy();
      if (dia) { dia.camKiem(dat.clone().add(V(0, .05, 0)), V(h.x * .5, -1, h.z * .5), { kieu: 'hon', mau: TIM, co: 1.35, dai: 1.05, sang: 2, song: 3.5 }); dia.vun(dat, { so: 12, luc: 3, len: 4, r: .4 }); dia.nut(dat, { r: 1.6, nhanh: 5, mau: TIM, song: 2.6 }); }
      quang(dat.clone().add(V(0, .5, 0)), .7, TIM, .25); DK.rung(.1);
      return false;
    }
  });
}

// ============================================================================
// C · ĐỘC CHÂM — phi châm = kiếm mảnh thật (phiKiem 'manh', màu lục); độc ngấm, sương độc, kim trượt cắm đất (Viên Mãn)
// ============================================================================
function docCham(ctx) {
  const b = batDau(ctx), tang = ctx.tang, nh = b.nh;
  let so = tang >= 3 ? 5 : 3, quat = tang >= 3 ? 26 : 18, manh = b.st * b.heSo, dps = 8, r = .3, co = 1, xuyen = false;
  if (nh === 'van_doc') { so = tang >= 5 ? 9 : 7; quat = 60; manh *= .6; }
  else if (nh === 'thuc_cot') { so = 1; quat = 0; xuyen = true; dps *= 2; r = .5; co = 2.2; }
  const hs = heSoBongToi();
  if (dangAn()) giuAn(.9);                                    // ném không làm lộ hình
  const dich = ctx.dich;
  const clip = nh === 'van_doc' ? 'ASN_C_VAN' : nh === 'thuc_cot' ? 'ASN_C_COT' : 'ASN_C';
  ctx.phat(clip, { moc: { nem: () => {
    const h = dich ? ngang(nguc(dich).sub(nguc(nc))) : nc.toi();
    const tu = nc.diem('tayL').addScaledVector(h, .2);
    for (let k = 0; k < so; k++) {
      const g = so <= 1 ? 0 : -quat * .5 + quat * k / (so - 1);
      kimDoc(tu, xoayY(h, g), { manh: manh * hs, dps, r, co, xuyen, duoi: tang >= 5 ? dich : null, suong: tang >= 3, tang, nh });
    }
    vfx.hat(tu, { so: 8, mau: LUC_SANG, toc: 3, co: .045, song: .25, huong: h, loe: .5, dat: false });
    if (nh === 'thuc_cot') DK.rung(.1);
  } } });
}
/** kim độc: bay thẳng 40 m/s, tầm 22 m; Hoá Cảnh đuổi mục tiêu; Viên Mãn: kim trượt chúc xuống cắm đất, đất quanh úa độc */
function kimDoc(tu, huong, o) {
  const pos = tu.clone(), vel = huong.clone().normalize().multiplyScalar(o.xuyen ? 32 : 40); let conLai = 22;
  const pk = vfx.phiKiem({ dai: .55 * o.co, kieu: 'manh', mau: LUC, kim: 0x9ccfa0, tua: false, sang: 2, song: 2 });
  pk.dat(pos, vel); const thu = [];
  let troiXuong = false, truocDat = null;
  DK.lap(dt => {
    if (o.duoi && conSong(o.duoi) && !troiXuong) {
      const muon = nguc(o.duoi).sub(pos).normalize(), v0 = vel.clone().normalize();
      const goc = v0.angleTo(muon), buoc = Math.min(goc, 6 * dt);
      if (goc > 1e-4) { const truc = new V3().crossVectors(v0, muon); if (truc.lengthSq() < 1e-10) truc.set(0, 1, 0); vel.applyAxisAngle(truc.normalize(), buoc); }
    }
    if (troiXuong) vel.y -= 60 * dt;
    const truoc = pos.clone(); pos.addScaledVector(vel, dt); conLai -= vel.length() * dt;
    // rãnh độc dọc đường kim lớn (Thực Cốt): áp lực xé cỏ, đất úa
    if (o.nh === 'thuc_cot' && dia) { const dd = V(pos.x, 0, pos.z); if (!truocDat) truocDat = V(tu.x, 0, tu.z); if (dd.distanceTo(truocDat) > .8) { dia.ranh(truocDat, dd, .2, .06, { mau: LUC }); dia.cat(truocDat, dd, .6); dia.chay(dd, .7, { mau: DAT_DOC, manh: .35 }); truocDat = dd; } }
    let het = false;
    for (const d of DK.dsBuNhin) {
      if (het || thu.indexOf(d) >= 0) continue;
      const giua = d.pos.clone().add(V(0, 1, 0));
      const ab = pos.clone().sub(truoc), L2 = ab.lengthSq(); const t = L2 > 1e-9 ? DK.clamp(giua.clone().sub(truoc).dot(ab) / L2, 0, 1) : 0;
      const gan = truoc.clone().addScaledVector(ab, t); const dx = Math.hypot(gan.x - giua.x, gan.z - giua.z), dy = Math.abs(gan.y - giua.y);
      if (dx > o.r + BK || dy > .85) continue;
      thu.push(d);
      danh(d, o.manh, { mau: LUC, tt: o.nh === 'thuc_cot' ? 'Giáp vỡ' : 'Độc' });
      docNgam(d, o.dps, 5);
      const nd = nguc(d); quang(nd, .45 * Math.sqrt(o.co), LUC, .18);
      vfx.hat(nd, { so: 10, mau: LUC_SANG, toc: 3.5, co: .05, song: .35, huong: vel.clone().normalize(), loe: .7, dat: false });
      if (o.suong) suongDoc(d.pos.clone(), o.dps, thu, o.tang);
      if (!o.xuyen) het = true;
    }
    if (het) { pk.huy(); return false; }
    if (pos.y <= (dia ? dia.cao(pos.x, pos.z) : 0) + .02) {
      pk.huy();
      if (o.tang >= 4 && dia) {
        dia.camKiem(V(pos.x, .02, pos.z), vel.clone().normalize(), { dai: .55 * o.co, kieu: 'manh', mau: LUC, tua: false, sang: 1.6, song: 4 });
        dia.chay(V(pos.x, 0, pos.z), 1.1, { mau: DAT_DOC, manh: .7 });
        vfx.hat(V(pos.x, .1, pos.z), { so: 5, mau: LUC_SANG, toc: 1, huong: UP, loe: .5, co: .05, song: .8, trongLuc: -1, dat: false });
      }
      return false;
    }
    if (conLai <= 0) { if (o.tang >= 4 && !troiXuong) troiXuong = true; else if (o.tang < 4) { pk.huy(); return false; } }
    pk.dat(pos, vel);
    if (Math.random() < .3) vfx.hat(pos, { so: 1, mau: LUC_SANG, toc: .3, co: .04 * o.co, song: .3, trongLuc: 0, dat: false });
  }, 3);
}
/** sương độc 2 m (Đại Thành+); Viên Mãn: độc thấm loang mặt đất, cỏ úa rũ */
function suongDoc(tam, dps, thu, tang) {
  quang(tam.clone().add(V(0, .8, 0)), 1.3, SRGB(.2, .36, .1), .55, .55);
  for (let k = 0; k < 8; k++) vfx.hat(tam.clone().add(V(RR(-1.4, 1.4), RR(.2, 1.3), RR(-1.4, 1.4))), { so: 1, mau: k & 1 ? SRGB(.22, .4, .1) : LUC_SANG, to: !(k & 1), toc: .5, huong: UP, loe: .9, co: k & 1 ? .26 : .06, song: RR(.8, 1.3), trongLuc: -.6, can: 1, dat: false });
  if (dia) {
    if (tang >= 4) {
      // Viên Mãn: độc thấm loang — đất úa vàng lục, vũng độc, bọt độc sủi, cỏ rũ
      const R = tang >= 5 ? 3.4 : 2.6;
      for (let k = 1; k <= 3; k++) DK.sau(k * .12, () => dia.chay(tam, R * k / 3, { mau: DAT_DOC, manh: .5 }));
      vungToi(tam, R, 3, .5, SRGB(.2, .34, .02), .6);
      for (let k = 0; k < 10; k++) DK.sau(k * .18, () => vfx.hat(tam.clone().add(V(RR(-R, R) * .6, .05, RR(-R, R) * .6)), { so: 2, mau: LUC_SANG, toc: .8, huong: UP, loe: .3, co: .07, song: .7, trongLuc: -.5, dat: false }));
      dia.gio(tam, R + 1, .5);
    } else dia.chay(tam, 1.6, { mau: DAT_DOC, manh: .55 });
  }
  for (const o of DK.dsBuNhin) { if (thu.indexOf(o) >= 0 || o.pos.distanceTo(tam) > 2) continue; docNgam(o, dps * .5, 4); }
}
/** độc ngấm: đốt mỗi .5 s, cộng dồn ≤ 3 lớp; Hoá Cảnh đủ 3 lớp ⇒ nổ độc 3 m */
const dsDoc = [];
function docNgam(dich, dps, giay) {
  if (!dich || dps <= 0) return;
  const S = DK.chon, ch = boDL().chieu[2], tang = S ? Math.min(S.tang, 5) : 1;
  dps *= thongTin(ch, tang, tang >= 3 && S.nhanh ? S.nhanh.doc_cham : null).heSo;
  for (const d of dsDoc) {
    if (d.dich !== dich) continue;
    d.lop = Math.min(3, d.lop + 1); d.dps = Math.max(d.dps, dps); d.tHet = DK.now + giay;
    if (d.lop >= 3 && tang >= 5) noDoc(d);
    return;
  }
  dsDoc.push({ dich, dps, tHet: DK.now + giay, nhip: 0, lop: 1 });
}
function noDoc(d) {
  d.lop = 1;
  const tam = d.dich.pos.clone();
  vfx.vaCham({ kieu: 'chop', mau: LUC, song: .05 });
  quang(tam.clone().add(UP), 2, LUC, .4); quang(tam.clone().add(UP), 1, LUC_SANG, .2);
  vfx.hat(tam.clone().add(UP), { so: 40, mau: LUC_SANG, toc: 8, co: .07, song: .45, trongLuc: 6 });
  vongDat(tam, .3, 3.4, SRGB(.2, .4, .08), .5, .8, .5);
  if (dia) { dia.chay(tam, 4, { mau: DAT_DOC, manh: .6 }); dia.nut(tam, { r: 3, nhanh: 7, mau: LUC, song: 3 }); dia.gio(tam, 4.5, 1); }
  DK.rung(.2);
  for (const o of DK.trongTron(tam, 3 - .35)) DK.trung(o, { nguon: nc, st: 40, mau: DOC, khongPhanUng: true, asDoc: true });
}
DK.moiKhung(dt => {
  for (let i = dsDoc.length - 1; i >= 0; i--) {
    const d = dsDoc[i];
    if (!conSong(d.dich) || DK.now >= d.tHet) { dsDoc.splice(i, 1); continue; }
    d.nhip += dt;
    while (d.nhip >= .5) {
      d.nhip -= .5;
      DK.trung(d.dich, { nguon: nc, st: d.dps * d.lop * .5, mau: DOC, khongPhanUng: true, asDoc: true });
      const nd = nguc(d.dich);
      for (let k = 0; k < d.lop; k++) vfx.hat(nd.clone().add(V(RR(-.25, .25), RR(-.4, .3), RR(-.25, .25))), { so: 1, mau: k & 1 ? TIM : LUC_SANG, toc: .6, huong: UP, loe: .3, co: .07, song: .7, trongLuc: -1, dat: false });
    }
  }
});

// ============================================================================
// V · ẢO ẢNH PHÂN THÂN — lộn nghiêng đúng phía, để lại phân thân bóng (nhân vật khối thật) hút đòn rồi nổ
// ============================================================================
const dsBong = [];
function aoAnh(ctx) {
  const b = batDau(ctx), tang = ctx.tang, nh = b.nh;
  const goc0 = nc.pos.clone(), h = ctx.dich ? ngang(ctx.dich.pos.clone().sub(nc.pos)) : nc.toi();
  quayMat(nc, h);
  const ben = phaiCua(h), phia = Math.random() < .5 ? 1 : -1;     // +1 = lách PHẢI (clip ASN_V_P), −1 = TRÁI (ASN_V_T)
  const song = nh === 'kinh_hoa' ? 8 : 4;
  const no = nh !== 'kinh_hoa', lao = nh === 'anh_bao';
  const rNo = 3 * (tang >= 3 ? 1.25 : 1) * (lao ? 1.2 : 1);
  const manhNo = b.st * b.heSo * (lao ? 2 : 1);
  ctx.phat(phia > 0 ? 'ASN_V_P' : 'ASN_V_T', { moc: {
    tach: () => {
      const yaw = Math.atan2(h.x, h.z), dsP = [goc0];
      if (tang >= 3) dsP.push(goc0.clone().addScaledVector(ben, -phia * 1.8));
      if (tang >= 5) { dsP.push(goc0.clone().addScaledVector(h, 1.8)); dsP.push(goc0.clone().addScaledVector(h, -1.8)); }
      const nhom = [];
      for (const p of dsP) nhom.push(taoBong(p, yaw, { song, no, lao, rNo, manhNo, dam: tang >= 5, tang, kinh: nh === 'kinh_hoa', ctx }));
      for (const x of nhom) x.nhom = nhom;
      khoi(goc0, 1.1, 1);
      if (tang >= 2) loang(goc0, 1.4, .55);
    },
    an: () => { AN.nhanh = null; datAn(THAT(1.5)); },
  } });
}
function ganNhat(p, r) { let tot = null, kc = r; for (const o of DK.dsBuNhin) { const d = Math.hypot(o.pos.x - p.x, o.pos.z - p.z); if (d <= kc) { kc = d; tot = o; } } return tot; }
function taoBong(p, yaw, o) {
  const pt = taoPhanThan(p, yaw, { tt: 'ASN_THU', vien: o.kinh ? LAVENDER : TIM, vienOp: o.kinh ? .8 : .55, mau: o.kinh ? SRGB(.2, .16, .32) : DEN_TIM, phat: o.kinh ? SRGB(.3, .26, .55) : TIM_TOI });
  const b = Object.assign({ pt, pos: p.clone(), tSinh: DK.now, tHet: DK.now + (o.lao ? 1.2 : o.song), tDam: DK.now, chet: false, id: Math.random() * 100 }, o);
  dsBong.push(b);
  vfx.them(null, (o.lao ? 1.2 : o.song) + .2, dt => capBong(b, dt), () => { if (!b.chet) ketBong(b, false); pt.xoa(); });
  return b;
}
function capBong(b, dt) {
  if (b.chet) return false;
  const now = DK.now, pt = b.pt;
  if (b.lao && now - b.tSinh > .3) {
    const d = ganNhat(b.pos, 14);
    if (d) { const v = d.pos.clone().sub(b.pos); v.y = 0; const L = v.length(); if (L > 1) { const hh = v.divideScalar(L); b.pos.addScaledVector(hh, Math.min(L - .9, 9 * dt)); pt.yaw = Math.atan2(hh.x, hh.z); if (!pt.clip || pt.clip.ten !== 'ASN_D3') pt.tuThe.set(DK.TT.ASN_LAO); if (Math.random() < .3) loang(b.pos, .5, .3); } }
  }
  // Hoá Cảnh: mỗi 1 s phân thân tự đâm kẻ gần trong 2,5 m; kéo kẻ địch dần vào tâm cụm bóng
  if (b.dam) {
    if (now - b.tDam > 1) {
      const d = ganNhat(b.pos, 2.5 + BK);
      if (d) {
        b.tDam = now; const hh = ngang(d.pos.clone().sub(b.pos)); pt.yaw = Math.atan2(hh.x, hh.z); pt.dien('ASN_X_BONG');
        DK.sau(.1, () => { if (b.chet) return; danh(d, 15); vach(b.pos.clone().add(V(0, 1.2, 0)), nguc(d), TIM, .05, .2); });
      } else b.tDam = now - .7;
    }
    if (b.nhom && b.nhom[0] === b) {
      const tam = new V3(); for (const x of b.nhom) tam.add(x.pos); tam.divideScalar(b.nhom.length);
      for (const d of DK.trongTron(tam, 7)) { const v = tam.clone().sub(d.pos); v.y = 0; const L = v.length(); if (L > 1) d.pos.addScaledVector(v.divideScalar(L), 1.4 * dt); }
      if (Math.random() < .15) vfx.hat(tam.clone().add(V(RR(-4, 4), .2, RR(-4, 4))), { so: 1, mau: TIM_SANG, toc: 3, huong: V(0, .2, 0), co: .05, song: .6, trongLuc: 0, dat: false });
    }
  }
  if (now >= b.tHet) { ketBong(b, true); return false; }
  const k = DK.clamp((now - b.tSinh) / .12, 0, 1) * DK.clamp((b.tHet - now) / .3, 0, 1);
  const nhay = .82 + .18 * Math.sin(now / NHIP * 23 + b.id);
  pt.pos.copy(b.pos);
  if (!pt.clip) { const th = Math.sin(now * 2.2 + b.id); pt.tuThe.set(b.lao ? DK.TT.ASN_LAO : DK.TT.ASN_THU); pt.tuThe[DK.KI.tor * 3] += th * 1.5; }
  pt.buoc(dt); if (pt.clip && pt.tClip > pt.clip.dai) pt.clip = null;
  pt.datK(k * nhay);
}
function ketBong(b, coNo) {
  if (b.chet) return; b.chet = true;
  const i = dsBong.indexOf(b); if (i >= 0) dsBong.splice(i, 1);
  b.pt.datK(0);
  const p = b.pos.clone(), tam = p.clone().add(V(0, .9, 0));
  if (coNo && b.no) {
    for (const o of DK.trongTron(tam, b.rNo - .35)) danh(o, b.manhNo, { lui: 1.2 });
    quang(tam, b.rNo * .55, DEN_TIM, .45, .75); quang(tam, b.rNo * .25, TIM_SANG, .2);
    vongDat(p, .3, b.rNo, TIM_TOI, .5, .75, .45);
    vfx.hat(tam, { so: 26, mau: TIM_SANG, toc: 7, co: .06, song: .4, trongLuc: 6 });
    vfx.hat(tam, { so: 16, mau: DEN_TIM, to: true, toc: 4, co: .24, song: .7, trongLuc: -1, can: 3, dat: false });
    loang(p, b.rNo * .6, .6);
    DK.rung(.12);
    if (b.tang >= 4 && dia) {
      // Viên Mãn: nổ bóng khoét hố nông, nứt tím, cỏ rạp
      dia.ho(p, 1.3, .32, { mau: TIM, chay: .7 });
      dia.nut(p, { r: b.rNo, nhanh: 6, mau: TIM, song: 3 });
      dia.vun(p, { so: 16, luc: 4, len: 5, r: .5 });
      dia.gio(p, b.rNo + 1.5, 1);
    }
    // Hoá Cảnh: bóng cuối cùng nổ ⇒ đại nổ ở tâm cụm (địa chấn, phá cây đèn gần), khung va chạm
    if (b.dam && b.nhom && b.nhom.every(x => x.chet)) {
      const t = new V3(); for (const x of b.nhom) t.add(x.pos); t.divideScalar(b.nhom.length);
      DK.sau(.12, () => {
        vfx.vaCham({ kieu: 'dao', mau: TIM, song: .07 }); vfx.vienMan(TIM_TOI, 1, .5);
        dia && dia.no(t, { muc: 2, r: 1.8, mau: TIM });
        loang(t, 5, .6);
        quang(t.clone().add(UP), 3, DEN_TIM, .55, .8);
        for (const o of DK.trongTron(t, 4.5)) danh(o, b.manhNo, { lui: 1.6, len: .6 });
      });
    }
  } else if (b.kinh) {
    // Kính Hoa: vỡ như gương — mảnh sáng lavender rơi
    vfx.hat(tam, { so: 24, mau: LAVENDER.clone().multiplyScalar(1.6), toc: 3, co: .08, song: .7, trongLuc: 8 });
    quang(tam, .7, LAVENDER, .3);
  } else quang(tam, .7, TIM_TOI, .3);
}

// ============================================================================
// R · U MINH TUYỆT SÁT — chìm vào bóng; Viên Mãn: vùng tối nuốt sân; chuỗi nhát từ mọi phía để lại phân thân; nhát chốt nhảy chém từ trên
// ============================================================================
let dsPhanThanR = [];
function uMinh(ctx) {
  const b = batDau(ctx), tang = ctx.tang, nh = b.nh;
  let soNhat = 6, toiDa = 6, manh = b.st * b.heSo, r = 16;
  if (nh === 'tuyet_anh') { soNhat += 2; manh *= 1.15; }
  else if (nh === 'u_vuc') { soNhat += 4; toiDa = 10; r *= 1.25; manh *= .8; }
  if (tang >= 5) soNhat = Math.max(soNhat + 3, 9);
  manh *= heSoBongToi();
  let ds = [];
  if (nh === 'tuyet_anh' && ctx.dich) ds.push(ctx.dich);
  else {
    const p0 = nc.pos.clone();
    ds = DK.dsBuNhin.filter(o => o.pos.distanceTo(p0) <= r).sort((a, c) => a.pos.distanceTo(p0) - c.pos.distanceTo(p0));
    if (ctx.dich && ds.indexOf(ctx.dich) >= 0) { ds.splice(ds.indexOf(ctx.dich), 1); ds.unshift(ctx.dich); }
    if (ds.length > toiDa) ds.length = toiDa;
  }
  const nhip = Math.min(.2, 1.5 / Math.max(1, soNhat));
  const t0 = .3, tCuoi = t0 + soNhat * nhip + .06;
  const p0 = nc.pos.clone();
  dsPhanThanR = [];
  // pha 1: chìm vào bóng
  ctx.phat('ASN_R0', { moc: { chim: () => {
    khoi(p0, 1.5, 1.2); loang(p0, 2, .7);
    AN.nhanh = null; datAn(tCuoi + 1); giuAn(tCuoi + .9); loe(0, tCuoi - .05);
    if (tang >= 4) {
      // Viên Mãn: vùng tối nuốt cả sân (loang dần 16 m), trời tím đen, viền màn
      const R = tang >= 5 ? 20 : 16;
      vungToi(p0, R, tCuoi + 2.2, tang >= 5 ? .8 : .7, DEN_TIM, .45);
      for (let k = 1; k <= 5; k++) DK.sau(k * .07, () => { loang(p0, R * k / 5, .4, 9); vongDat(p0, R * k / 5 - 1, R * k / 5, DEN_TIM, .3, .55, 1.2); });
      vfx.troi(SRGB(.05, .015, .1), tCuoi + 1.8, tang >= 5 ? .8 : .6);
      vfx.vienMan(TIM_TOI, tCuoi + 1.2, .5);
      vfx.chu(tang >= 5 ? 'U Minh Quỷ Vực' : 'U Minh Tuyệt Sát', { mau: '#996bff', song: 1.4 });
      dia && dia.gio(p0, R, .9);
      DK.rung(.16);
    } else if (tang >= 2) loang(p0, 4, .45);
  } } });
  if (!ds.length) {
    ctx.sau(t0, () => {
      const h = nc.toi(); loe(.6, .2); ctx.phat('ASN_RS4');
      for (const o of DK.trongNon(nc, 5, 120)) danh(o, manh * 2, { mau: ctx.mau });
      for (let k = 0; k < 3; k++) vach(nguc(nc).addScaledVector(h, 2.4).add(V(0, RR(-.4, .4), 0)).addScaledVector(phaiCua(h), -1.6), nguc(nc).addScaledVector(h, 2.4).addScaledVector(phaiCua(h), 1.6), TIM_SANG, .06, .35);
    });
    ctx.sau(t0 + .5, () => ketThucUMinh());
    return;
  }
  for (let k = 0; k < soNhat; k++) { const idx = k; ctx.sau(t0 + k * nhip, () => nhatUMinh(ctx, ds, idx, manh, tang, nhip)); }
  ctx.sau(tCuoi, () => nhatChot(ctx, ds, manh, tang, nh));
  ctx.sau(tCuoi + .55, () => ketThucUMinh());
}
const dichThu = (ds, k) => { for (let j = 0; j < ds.length; j++) { const o = ds[(k + j) % ds.length]; if (conSong(o)) return o; } return null; };
let cuoiR = null;
const CLIP_R = ['ASN_RS1', 'ASN_RS2', 'ASN_RS3', 'ASN_RS4'];
function nhatUMinh(ctx, ds, k, manh, tang, nhip) {
  const d = dichThu(ds, k); if (!d) return;
  cuoiR = d;
  const huong = xoayY(V(0, 0, 1), k * 137.5);
  const p = quanhDich(d, huong, BK + BK + .65);
  const nd = nguc(d);
  quang(nd, .45, TIM_TOI, .12);                       // vệt tím loé sát thân trước nhát (cách khắc chế của game)
  dichToi(nc, p);
  const h = ngang(d.pos.clone().sub(p)); quayMat(nc, h);
  ctx.phat(CLIP_R[k % 4]);
  loe(.62, Math.min(.16, nhip * .9));                 // hiện thoáng như kính tím lúc chém
  vfx.vet(nc, { song: .06, tan: .2, kieu: 'muc', mau: ctx.mau });
  DK.sau(.05, () => {
    danh(d, manh, { lui: .25, mau: ctx.mau });
    vfx.hat(nd, { so: 8, mau: TIM_SANG, toc: 6, co: .05, song: .3, huong: h, loe: .5, dat: false });
    // phân thân ở lại vị trí chém (Đại Thành+ ở lâu hơn) ⇒ nhiều phân thân cùng lúc quanh mục tiêu
    const x = anhToi(nc, tang >= 3 ? 1.6 : .7, .62, null, .4); dsPhanThanR.push({ x, p: p.clone().add(V(0, 1.2, 0)) });
    if (tang >= 4) { const ng = phaiCua(h); chemDat(d.pos.clone().addScaledVector(ng, -1).addScaledVector(h, -.4), d.pos.clone().addScaledVector(ng, 1).addScaledVector(h, .6), .16, .1); }
    DK.rung(.05);
  });
}
function nhatChot(ctx, ds, manh, tang, nh) {
  const d = conSong(cuoiR) ? cuoiR : dichThu(ds, 0); if (!d) return;
  const sau = sauLung(d, BK + BK + .5); const h = ngang(d.pos.clone().sub(sau));
  // hiện ra TRÊN CAO sau lưng, lộn nửa vòng rồi bổ thẳng xuống
  nc.treo = true; dichToi(nc, sau.clone().add(V(0, 3.2, 0))); quayMat(nc, h);
  khoi(nc.pos.clone().add(V(0, -.6, 0)), .9, .8);
  loe(1, .8); AN.het = DK.now + .02;
  ctx.phat('ASN_R_CHOT');
  vfx.vet(nc, { song: .14, tan: .25, kieu: 'muc', mau: ctx.mau });
  const y0 = nc.pos.y;
  DK.lap((dt, tl) => { const u = Math.min(1, tl / .12); nc.pos.y = y0 * (1 - u * u); if (u >= 1) { nc.pos.y = 0; nc.treo = false; nc.vy = 0; nc.datDat = true; return false; } });
  DK.sau(.12, () => {
    const st = manh * 1.5;
    const rr = nh === 'u_vuc' ? 5 : 4;
    if (tang >= 3 || nh === 'u_vuc') for (const o of DK.trongTron(d.pos, rr)) danh(o, st, { lui: .9, mau: ctx.mau }); else danh(d, st, { lui: .9, mau: ctx.mau });
    const nd = nguc(d);
    vach(nd.clone().add(V(0, 1.4, 0)), d.pos.clone().addScaledVector(h, .4), TIM_SANG, .09, .45);
    quang(nd, 1.2, DEN_TIM, .45, .75); quang(nd, .6, TIM_SANG, .2);
    vfx.hat(d.pos.clone().add(V(0, .2, 0)), { so: 24, mau: TIM_SANG, toc: 6, co: .06, song: .4, huong: UP, loe: .8 });
    loang(d.pos, tang >= 3 ? 2.6 : 1.4, .6);
    DK.rung(tang >= 4 ? .3 : .16);
    if (tang >= 3) vongDat(d.pos, .3, rr, TIM_TOI, .5, .7, .5);
    if (tang >= 4 && dia) {
      // Viên Mãn: đất nổ, hai vết chém chéo xẻ đất hình chữ X dưới chân mục tiêu
      dia.no(d.pos, { muc: tang >= 5 ? 3 : 2, r: tang >= 5 ? 2.2 : 1.6, mau: TIM });
      const ng = phaiCua(h);
      for (const s of [1, -1]) { const a = d.pos.clone().addScaledVector(h, -2.6).addScaledVector(ng, -2.6 * s), c = d.pos.clone().addScaledVector(h, 2.6).addScaledVector(ng, 2.6 * s); dia.ranh(a, c, .3, .3, { mau: TIM }); dia.cat(a, c, .8); }
      vfx.vaCham({ kieu: 'dao', mau: TIM, song: .07 });
    }
    if (tang >= 5) {
      // Hoá Cảnh: mọi phân thân còn lại cùng chém vào tâm + vết rạch xé ngang trời + khung va chạm thứ hai
      for (const x of dsPhanThanR) if (x.x.t < x.x.song) vach(x.p, nd, TIM_SANG, .05, .3);
      DK.sau(.14, () => {
        const ng = phaiCua(h), tren = d.pos.clone().add(V(0, 5.5, 0)).addScaledVector(h, 4);
        vach(tren.clone().addScaledVector(ng, -30).add(V(0, 2.2, 0)), tren.clone().addScaledVector(ng, 30).add(V(0, -2.2, 0)), DEN_TIM, .55, 1.4, false);
        vach(tren.clone().addScaledVector(ng, -28).add(V(0, 2.1, 0)), tren.clone().addScaledVector(ng, 28).add(V(0, -2.1, 0)), TIM_SANG, .12, 1.2);
        vfx.vaCham({ kieu: 'chop', mau: TIM, song: .05 });
        for (const o of DK.trongTron(d.pos, 6)) danh(o, manh * .5, { mau: ctx.mau });
      });
    }
  });
}
function ketThucUMinh() { thoiAn(); AN.mo = null; nc.treo = false; quang(nguc(nc), .7, TIM, .25); }

// ---------------------------------------------------------------- đặt lại
DK.nghe('datLai', () => {
  const daAn = AN.ap !== 1; AN.het = AN.giu = -1; AN.mo = null; AN.k = 1; AN.ap = 1; AN.nhanh = null; nc.treo = false;
  if (daAn) { trongNv(nc, 1); if (nc.mat && nc.mat.emissive) nc.mat.emissive.setRGB(0, 0, 0); }   // chỉ trả lại khi chính bản này đã làm trong
  vung.material.opacity = 0; vung.visible = false;
  dsDoc.length = 0; for (const b of dsBong) { b.chet = true; } dsBong.length = 0; dsPhanThanR = []; cuoiR = null;
});

DK.ttBang(TU_THE);
dungClip();
DK.dangKyBoNC(MA, {
  yTuong: 'Sát thủ cầm kiếm ngược tay, trọng tâm thấp: ra đòn bằng tan vào bóng – lướt – hiện sau lưng – đâm ngược – nhảy chém từ trên. Tím U Minh chủ đạo (Độc Châm lục độc), vệt chém mực viền màu kiếm. ' +
    'Tầng 1 sạch; Tiểu/Đại Thành thêm vệt bóng loang trên đất, phân thân bóng thật (nhân vật khối) cùng đâm; Viên Mãn: bóng tối loang nuốt đất, kiếm hồn xẻ rãnh, kim cắm đất làm cỏ héo, nổ bóng khoét hố; Hoá Cảnh: khung va chạm mực, vùng tối nuốt sân, phân thân đồng loạt chém, vết rạch xé trời.',
  moTaChieu: {
    an_anh: 'Kết ấn trước mặt rồi cúi xoáy 360° chìm vào khói bóng (khối voxel tím đen). T1 vũng bóng dưới chân; T2 vòng khói 2,6 m, cỏ rạp; T3 vòng u minh 4 m (chậm); Viên Mãn: bóng tối loang 6 m trên đất, trời tím đen, lửa u minh quanh vành; Hoá Cảnh: khung va chạm mực, sóng đất, 3 phân thân toả ra. Yên Vụ: khói độc lục, đất/cỏ úa vàng. Ẩn: thân kính tím + vũng bóng theo chân, gợn bóng mỗi .3 s.',
    boi_thu: 'Cúi lấy đà → tan bóng, vệt bóng loang dọc đất tới sau lưng → hiện ra kéo kiếm ngang hông → đâm xuyên ĐÚNG khung thế đâm (sửa lệch của game) → vẩy kiếm. T3 phân thân đâm từ trước; Viên Mãn: kiếm hồn xuyên ngực bay ra xẻ rãnh đất rồi cắm xuống, nứt tím dưới chân; Hoá Cảnh: thêm phân thân bên hông + khung va chạm. Đoạn Hầu: cứa ngang cổ; Ảnh Hoàn: lướt bóng về chỗ cũ.',
    doc_cham: 'Vặn người kẹp kim ngang ngực → phẩy tay trái. Kim là phi châm hình kiếm mảnh (lục) có vệt. T3 5 kim + sương độc 2 m (đất úa); Viên Mãn: kim trượt chúc xuống cắm đất, độc loang làm cỏ héo quanh mục tiêu; Hoá Cảnh: kim đuổi, đủ 3 lớp nổ độc (khung chớp lục, nứt lục). Vạn Độc: xoay 360° ném quạt 60°; Thực Cốt: kéo tay ra sau ném một kim lớn xẻ rãnh độc dọc đường.',
    ao_anh: 'Lộn nghiêng (cartwheel) đúng phía lách — phải/trái có clip riêng (game luôn LUOT_TRAI). Phân thân bóng là nhân vật khối thật tím đen viền tím, thở/nhấp nháy. Nổ: khói tối + vòng + loang; Viên Mãn: khoét hố nông, nứt tím, cỏ rạp; Hoá Cảnh: 4 phân thân tự đâm, kéo địch vào tâm, bóng cuối nổ thành địa chấn + khung va chạm. Kính Hoa: viền gương lavender vỡ vụn; Ảnh Bạo: phân thân lao đi.',
    u_minh: 'Cúi chìm vào bóng → mỗi nhát hiện thoáng (kính tím) từ một phía với 4 thế khác nhau (chém chéo / quét ngược / đâm / xoay thấp), để lại phân thân tối ở chỗ chém → nhát chốt hiện trên cao sau lưng, lộn nửa vòng bổ thẳng xuống. Viên Mãn: vùng tối loang nuốt sân, trời tím đen, mỗi nhát xẻ đất, nhát chốt nổ đất + vết chém chữ X + khung va chạm; Hoá Cảnh: mọi phân thân cùng chém, vết rạch xé trời, khung va chạm thứ hai.',
  },
  theThu: 'ASN_THU', theDo: 'DO',
  soNhat: 6, danh: danhCombo, lon: lonNe,
  chieu: { an_anh: anAnh, boi_thu: boiThu, doc_cham: docCham, ao_anh: aoAnh, u_minh: uMinh },
});
DK.anhSatNC = { AN, dsBong, dsDoc, taoPhanThan };
})();
