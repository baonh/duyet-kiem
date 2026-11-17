"use strict";
// ============================================================================
// bo_thanh_lien_nc.js — 2026-11-15 — BẢN NÂNG CẤP (đề xuất) THANH LIÊN KIẾM CA ('kiem_cp1').
//   Người dùng chê bản game "đơn sơ, động tác đơn giản, viên mãn không tác động địa hình, kiếm phóng ra không ra kiếm".
//   Bản này: kiếm khí = KIẾM THẬT bọc hai cánh sen (vfx.phiKiem + cánh sen), động tác múa sen (xoay, bật, quỳ cắm kiếm, lướt),
//   Viên Mãn/Hoá Cảnh: sen nở trên đất (đất nhuộm xanh + nứt sáng hình cánh sen), rãnh kiếm khí, cỏ đứt theo đường kiếm,
//   kiếm trận cắm đất, sóng đất, cây rung/gãy. Một màu chủ đạo: xanh ngọc thanh liên; vệt chém theo màu thanh kiếm (ctx.mau).
//   Sửa lỗi bản game: Phược Địa / Tam Thiểm chỉ nhân hệ số nhánh MỘT lần; Toàn Vũ có xoay người thật; chữ chiêu + trời ở tầng 4–5 cho cả 5 chiêu (đúng JSON).
// ============================================================================
(function () {
const DK = window.DK, T = DK.T, V3 = DK.V3, vfx = DK.vfx, dia = DK.dia;
if (!DK.dangKyBoNC) return;
const D = Math.PI / 180, LEN = new V3(0, 1, 0);
const clamp = DK.clamp, cl01 = x => clamp(x, 0, 1);
const RR = (a, b) => a + Math.random() * (b - a);
const sm = x => { x = cl01(x); return x * x * (3 - 2 * x); };
const E = { l: u => u, o: u => { const v = 1 - cl01(u); return 1 - v * v * v; }, i: u => { u = cl01(u); return u * u * u; },
  io: u => { u = cl01(u); return u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; } };

// ---------------------------------------------------------------- màu (ThanhLienKiemCa.XANH / NGOC / RE) — một màu chủ đạo: xanh ngọc
const XANH = new T.Color(.36, .95, .7), NGOC = new T.Color(.62, 1, .86), RE = new T.Color(.2, .42, .16);
const NGOC_TRANG = new T.Color(.82, 1, .93);   // nhánh Thanh Tâm Liên: sen trắng ngọc
const TRANG = new T.Color(1, 1, 1);
const lerpC = (a, b, k) => a.clone().lerp(b, k);
const sang = (c, k) => c.clone().multiplyScalar(k);   // đẩy màu > 1 cho bloom

const N_TAN_DIEP = 'lien_hoa_tan_diep', N_TRUY_HON = 'bich_lac_truy_hon', N_THANH_TAM = 'thanh_tam_lien', N_TOAN_VU = 'lien_phong_toan_vu',
  N_PHUOC_DIA = 'van_can_phuoc_dia', N_THON_LINH = 'thanh_dang_thon_linh', N_TAM_THIEM = 'lien_anh_tam_thiem', N_KHAI_LIEN = 'nhat_kiem_khai_lien',
  N_HO_THE = 'lien_dai_ho_the', N_SAT_TRAN = 'thien_diep_sat_tran';

// ================================================================ TƯ THẾ (tiền tố TLN_) — dựng từ tư thế có sẵn + sửa khớp
const KI = DK.KI, JJ = { jy: 60, cham: 61, jx: 62, jz: 63 };
/** tư thế mới = bản sao `goc` rồi ghi đè các khớp trong `sua` (cú pháp như DK.tt) */
function ttTu(ten, goc, sua) {
  const p = Float32Array.from(DK.TT[goc] || DK.TT.THU);
  for (const muc of String(sua).trim().split(/\s+/)) {
    const h = muc.indexOf(':'); if (h <= 0) continue;
    const k = muc.slice(0, h), so = muc.slice(h + 1).split(',').map(x => x === '' ? 0 : +x);
    if (JJ[k] != null) { p[JJ[k]] = so[0]; continue; }
    const j = KI[k]; if (j == null) continue;
    for (let a = 0; a < 3; a++) p[j * 3 + a] = a < so.length ? so[a] : 0;
  }
  DK.TT[ten] = p; return ten;
}
// thủ thế: thân nghiêng, kiếm chếch sau hông phải, tay trái bắt kiếm quyết trước ngực (không thõng kiếm trước người)
ttTu('TLN_THU', 'KP_THU', 'tor:16,-22,0 head:-10,22,0 aR:-28,0,-34 fR:-28,0,0 w:146,0,0 aL:-62,0,34 fL:-96,0,0 lR:-34,0,-9 sR:48,0,0 lL:26,0,9 sL:38,0,0 ao:10,0,0');
// --- combo
ttTu('TLN_W1', 'W1', 'tor:10,-66,-12 head:-8,54,0 aR:-162,0,-64 fR:-30,0,0 lR:-40,0,-12 sR:62,0,0 lL:32,0,10 sL:54,0,0 ao:14,0,0');
ttTu('TLN_S1', 'S1', 'tor:44,48,8 head:-30,-36,0 aR:-38,0,48 lR:-72,0,-10 sR:90,0,0 lL:42,0,10 sL:26,0,0 ao:42,0,0');
ttTu('TLN_S1b', 'S1b', 'tor:46,54,10 head:-32,-40,0 lR:-72,0,-10 sR:92,0,0 lL:42,0,10 sL:26,0,0 ao:40,0,0');
ttTu('TLN_W2', 'W2', 'tor:30,64,12 head:-24,-48,0 aR:-8,0,62 fR:-40,0,0 lR:-62,0,-10 sR:86,0,0 lL:38,0,10 sL:34,0,0');
ttTu('TLN_S2', 'S2', 'tor:4,-64,-14 head:-12,48,0 aR:-150,0,-92 lR:-40,0,-12 sR:54,0,0 lL:34,0,10 sL:40,0,0 ao:28,0,0');
ttTu('TLN_S2b', 'S2b', 'tor:-4,-70,-16 head:-14,52,0');
// quét tròn thấp (xoay người cả vòng)
ttTu('TLN_W3', 'W2', 'tor:36,70,10 head:-26,-52,0 aR:-30,0,70 fR:-50,0,0 w:110,0,0 aL:-70,0,-20 fL:-40,0,0 lR:-74,0,-14 sR:110,0,0 lL:48,0,14 sL:70,0,0 jy:-.12 ao:30,0,0');
ttTu('TLN_S3', 'S2', 'tor:30,-40,-8 head:-22,30,0 aR:-86,0,-96 fR:-2,0,0 w:90,0,0 aL:-80,0,70 fL:-10,0,0 lR:-70,0,-16 sR:104,0,0 lL:46,0,16 sL:66,0,0 jy:-.12 ao:46,0,0');
// đâm (nhuỵ sen)
ttTu('TLN_W4', 'W3', 'tor:14,-46,0 head:-12,40,0 aR:30,0,-40 fR:-124,0,0 aL:-80,0,30 fL:-20,0,0 lR:-36,0,-8 sR:58,0,0 lL:34,0,8 sL:48,0,0');
ttTu('TLN_S4', 'S3b', 'tor:46,18,0 head:-38,-16,0 aR:-120,0,-4 fR:0,0,0 aL:40,0,36 fL:-16,0,0 lR:-92,0,0 sR:100,0,0 lL:60,0,0 sL:10,0,0 ao:56,0,0');
// bật nhảy xoay — chém giáng
ttTu('TLN_NHAY', 'W4J', 'tor:-16,-20,0 aR:-196,0,-24 fR:-26,0,0 aL:-120,0,50 fL:-40,0,0 jy:.7');
ttTu('TLN_GIANG', 'KDS', 'tor:66,6,0 head:-50,-4,0 aR:-50,0,-10 aL:-10,0,40 fL:-30,0,0 lR:-86,0,-10 sR:112,0,0 lL:46,0,10 sL:72,0,0 jy:-.18');
// kết combo: xoay lên, kiếm vút trời
ttTu('TLN_KET', 'KP_TRANG', 'tor:-18,20,0 head:-36,-14,0 aR:-184,0,-18 aL:-60,0,70 fL:-20,0,0 lR:-50,0,-10 sR:60,0,0 lL:20,0,10 sL:20,0,0 cL:30,0,0 jy:.15 ao:-10,0,0');
// lộn né
ttTu('TLN_LON', 'LON_LUOT', 'aR:-60,0,-40 w:150,0,0 aL:-62,0,30');
// --- Z: kiếm khí — rút ngang ra sau phải, quét ngang chéo vung ra
ttTu('TLN_ZW', 'W1', 'tor:12,-74,-6 head:-10,60,0 aR:-86,0,-84 fR:-42,0,0 w:96,0,0 aL:-92,0,40 fL:-8,0,0 lR:-46,0,-10 sR:72,0,0 lL:34,0,10 sL:54,0,0 ao:16,0,0');
ttTu('TLN_ZS', 'S1', 'tor:30,52,6 head:-22,-42,0 aR:-84,0,52 fR:-2,0,0 w:90,0,0 aL:6,0,34 fL:-30,0,0 lR:-68,0,-10 sR:88,0,0 lL:42,0,10 sL:26,0,0 ao:36,0,0');
ttTu('TLN_ZS2', 'TLN_ZS', 'tor:34,60,8 head:-24,-48,0 aR:-66,0,62 aL:16,0,30');
// --- X: chém dọc giáng (tầng 1–2 nhát cuối)
ttTu('TLN_XW', 'W4', 'tor:-16,-12,0 aR:-196,0,-18 lR:-40,0,-8 sR:56,0,0 lL:30,0,8 sL:40,0,0');
ttTu('TLN_XS', 'S4', 'tor:60,-4,0 aR:-60,0,-8 aL:-20,0,30 fL:-40,0,0 lR:-82,0,-8 sR:108,0,0 lL:44,0,8 sL:66,0,0');
// --- C: lật kiếm ngược tay, bật lên, quỳ một gối cắm kiếm, tay trái chưởng ra trước dẫn rễ
ttTu('TLN_CW', 'KP_THU', 'tor:-10,-30,0 head:-20,24,0 aR:-176,0,-30 fR:-20,0,0 w:-90,0,0 aL:-40,0,80 fL:-30,0,0 lR:-60,0,-8 sR:90,0,0 cR:20,0,0 lL:-10,0,8 sL:80,0,0 cL:30,0,0 jy:.45 cham:0 ao:-16,0,0');
ttTu('TLN_CS', 'KP_THU', 'tor:26,-26,0 head:-20,22,0 aR:-24,0,-30 fR:-30,0,0 w:-80,0,0 aL:-96,0,4 fL:-4,0,0 hL:0,0,0 lR:-92,0,-14 sR:96,0,0 lL:22,0,10 sL:120,0,0 cL:-20,0,0 jy:-.26 ao:40,0,0');
// --- V: thu thấp kéo kiếm sau, lao thân gần nằm ngang mũi kiếm dẫn đầu, trượt dừng vẩy kiếm
ttTu('TLN_VW', 'KP_HW', 'tor:46,-60,0 head:-30,50,0 aR:20,0,-58 fR:-12,0,0 w:116,0,0 aL:-90,0,24 fL:-10,0,0 lR:-80,0,-10 sR:100,0,0 lL:50,0,10 sL:44,0,0 jy:-.15 ao:40,0,0');
ttTu('TLN_VL', 'KP_THUAN', 'tor:72,-8,0 head:-56,8,0 aR:-100,0,-6 fR:0,0,0 w:90,0,0 aL:40,0,30 fL:-10,0,0 lR:-96,0,0 sR:104,0,0 lL:64,0,0 sL:20,0,0 jy:-.25 ao:76,0,0');
ttTu('TLN_VS', 'S2', 'tor:26,-56,-10 head:-20,46,0 aR:-96,0,-100 fR:-4,0,0 aL:-70,0,40 fL:-30,0,0 lR:-66,0,-20 sR:96,0,0 lL:52,0,14 sL:56,0,0 jy:-.1 ao:40,0,0');
DK.guong('TLN_VL', 'TLN_VLg'); DK.guong('TLN_VS', 'TLN_VSg');
// --- R: kiếm dựng trước mặt + kiếm quyết, bật lên giơ kiếm chỉ trời, giáng xuống chỉ trận
ttTu('TLN_RCHI', 'KP_CHI', 'tor:4,-10,0 head:-10,8,0 aR:-120,0,-14 fR:-60,0,0 w:150,0,0 aL:-100,0,40 fL:-70,0,0 lR:-30,0,-8 sR:40,0,0 lL:24,0,8 sL:30,0,0');
ttTu('TLN_RLEN', 'KP_TRANG', 'tor:-20,0,0 head:-44,0,0 aR:-188,0,-10 fR:0,0,0 aL:-150,0,60 fL:-30,0,0 lR:-70,0,-8 sR:110,0,0 cR:20,0,0 lL:-20,0,8 sL:100,0,0 cL:30,0,0 jy:.9 cham:0 ao:-20,0,0');
ttTu('TLN_RCAM', 'KDS', 'tor:56,-10,0 head:-40,8,0 aR:-70,0,-20 fR:-6,0,0 aL:-140,0,60 fL:-10,0,0 lR:-90,0,-12 sR:110,0,0 lL:40,0,12 sL:96,0,0 jy:-.3 ao:50,0,0');

// ================================================================ CLIP
DK.clip('tln_d1', '0 TLN_THU · .08 TLN_W1 o · .12 TLN_W1 h · .18 TLN_S1 s · .3 TLN_S1b io · .54 TLN_THU io', '0 0 0 o; .12 0 .05 o; .24 0 .6 o', { vet0: .12, trung: .17, huy: .3 });
DK.clip('tln_d2', '0 TLN_S1b · .07 TLN_W2 o · .11 TLN_W2 h · .18 TLN_S2 s · .3 TLN_S2b io · .56 TLN_THU io', '0 0 0 o; .22 .2 .5 o', { vet0: .11, trung: .16, huy: .3 });
DK.clip('tln_d3', '0 TLN_THU · .1 TLN_W3 o · .14 TLN_W3 h · .26 TLN_S3 l · .4 TLN_S3 s · .48 TLN_S3 h · .72 TLN_THU io', '0 0 0 o; .4 0 .7 o', { vet0: .13, trung: .22, huy: .48 }, { xoay: [.13, .4, -360] });
DK.clip('tln_d4', '0 TLN_THU · .1 TLN_W4 o · .16 TLN_W4 h · .22 TLN_S4 s · .38 TLN_S4 h · .64 TLN_THU io', '0 0 0 o; .16 0 -.1 o; .3 0 1.4 o', { vet0: .17, trung: .22, huy: .36 });
DK.clip('tln_d5', '0 TLN_THU · .1 TLN_W1 o · .2 TLN_NHAY io · .36 TLN_NHAY l · .46 TLN_GIANG s · .66 TLN_GIANG h · .94 TLN_THU io', '0 0 0 o; .46 0 1.1 o', { vet0: .36, trung: .46, huy: .64 }, { xoay: [.12, .42, -360] });
DK.clip('tln_d6', '0 TLN_THU · .1 TLN_W3 o · .14 TLN_W3 h · .28 TLN_S3 l · .42 TLN_S3 l · .58 TLN_KET s · .82 TLN_KET h · 1.12 TLN_THU io', '0 0 0 o; .5 0 .8 o', { vet0: .14, t1: .26, t2: .4, t3: .58, huy: .82 }, { xoay: [.14, .56, -720] });
DK.clip('tln_lon', '0 TLN_THU · .05 TLN_LON o · .32 TLN_LON h · .46 TLN_THU io', '0 0 0 o; .34 0 4.4 o', { huy: .4 }, { lon: [.03, .35, 360], tam: 1, than: 2 });
DK.clip('tln_lon_lui', '0 TLN_THU · .05 TLN_LON o · .32 TLN_LON h · .46 TLN_THU io', '0 0 0 o; .34 0 -3.8 o', { huy: .4 }, { lon: [.03, .35, -360], tam: 1, than: 2 });
DK.clip('tln_lon_phai', '0 TLN_THU · .05 TLN_LON o · .32 TLN_LON h · .46 TLN_THU io', '0 0 0 o; .34 3.6 0 o', { huy: .4 }, { lan: [.03, .35, -360], tam: 1, than: 2 });
DK.clip('tln_lon_trai', '0 TLN_THU · .05 TLN_LON o · .32 TLN_LON h · .46 TLN_THU io', '0 0 0 o; .34 -3.6 0 o', { huy: .4 }, { lan: [.03, .35, 360], tam: 1, than: 2 });
// chiêu
DK.clip('tln_z', '0 TLN_THU · .12 TLN_ZW o · .2 TLN_ZW h · .27 TLN_ZS s · .42 TLN_ZS2 io · .56 TLN_ZS2 h · .84 TLN_THU io', '0 0 0 o; .2 0 -.15 o; .32 0 .7 o', { huy: .6 });
DK.clip('tln_x', '0 TLN_THU · .08 TLN_W1 o · .16 TLN_S1 s · .28 TLN_S1b io · .34 TLN_W2 o · .44 TLN_S2 s · .56 TLN_S2b io · .62 TLN_XW o · .7 TLN_XS s · .86 TLN_XS h · 1.06 TLN_THU io',
  '0 0 0 o; .16 0 .5 o; .44 .3 .9 o; .7 .3 1.4 o', { huy: .8 });
DK.clip('tln_x_tron', '0 TLN_THU · .08 TLN_W1 o · .16 TLN_S1 s · .28 TLN_S1b io · .34 TLN_W2 o · .44 TLN_S2 s · .54 TLN_W3 io · .62 TLN_S3 l · .76 TLN_S3 s · .9 TLN_S3 h · 1.1 TLN_THU io',
  '0 0 0 o; .16 0 .5 o; .44 .3 .9 o; .76 .3 1.2 o', { huy: .82 }, { xoay: [.54, .78, -360] });
DK.clip('tln_x_vu', '0 TLN_THU · .08 TLN_W1 o · .16 TLN_S1 s · .28 TLN_S1b io · .34 TLN_W2 o · .44 TLN_S2 s · .54 TLN_W3 io · .62 TLN_S3 l · .76 TLN_S3 s · .82 TLN_W3 io · .92 TLN_KET l · 1.04 TLN_KET s · 1.18 TLN_KET h · 1.42 TLN_THU io',
  '0 0 0 o; .16 0 .5 o; .44 .3 .9 o; .76 .3 1.2 o; 1.04 .3 1.6 o', { huy: 1.1 }, { xoay: [.54, .78, -360, .82, 1.06, -720] });
DK.clip('tln_c', '0 TLN_THU · .14 TLN_CW o · .3 TLN_CW h · .38 TLN_CS s · .72 TLN_CS h · 1.0 TLN_THU io', '0 0 0 o; .3 0 .5 o', { huy: .8 }, { xoay: [.08, .32, -360] });
DK.clip('tln_v', '0 TLN_THU · .12 TLN_VW o · .2 TLN_VW h · .24 TLN_VL l · .46 TLN_VL h · .56 TLN_VS s · .7 TLN_VS h · .92 TLN_THU io', null, { huy: .72 });
DK.clip('tln_v_a', '0 TLN_VW · .04 TLN_VL l · .17 TLN_VL h · .22 TLN_VS s', null, { huy: .2 });
DK.clip('tln_v_b', '0 TLN_VS · .04 TLN_VLg l · .17 TLN_VLg h · .22 TLN_VSg s', null, { huy: .2 });
DK.clip('tln_v_c', '0 TLN_VSg · .04 TLN_VL l · .17 TLN_VL h · .24 TLN_VS s · .4 TLN_VS h · .62 TLN_THU io', null, { huy: .4 }, { xoay: [.18, .3, 180] });
DK.clip('tln_r', '0 TLN_THU · .15 TLN_RCHI o · .5 TLN_RCHI h · .64 TLN_RLEN io · .86 TLN_RLEN h · .98 TLN_RCAM s · 1.3 TLN_RCAM h · 1.55 TLN_THU io', null, { huy: 1.25 }, { xoay: [.56, .9, -360] });

// ================================================================ TIỆN ÍCH CHUNG
const ngang = v => { const h = v.clone(); h.y = 0; return h.lengthSq() > 1e-8 ? h.normalize() : new V3(0, 0, 1); };
const xoay = (h, g) => { const c = Math.cos(g * D), s = Math.sin(g * D); return new V3(h.x * c - h.z * s, h.y, h.z * c + h.x * s); };
const huongYaw = g => new V3(Math.sin(g * D), 0, Math.cos(g * D));
const nguc = nv => nv.pos.clone().add(new V3(0, 1.25, 0));
const datTai = p => { const q = p.clone(); q.y = dia ? dia.cao(q.x, q.z) : 0; return q; };
const huongNgang = (nv, d) => d ? ngang(new V3().subVectors(d.pos, nv.pos)) : nv.toi();
const rung = (k, s) => DK.rung(Math.min(k, .4), s);
const conSong = d => d && DK.dsBuNhin.indexOf(d) >= 0;
const quangNo = (p, r, mau, song = .3) => vfx.chop(p, { co: r * 1.6, mau, song });
const vongDat = (p, r, mau, song = .45, day = .12) => vfx.vong(datTai(p), { bk0: r * .1, bk1: r, song, mau, day, op: .7 });
const tiaLua = (p, n, mau, toc = 7) => vfx.hat(p, { so: n, mau, toc, co: .1, song: .4, trongLuc: 8, can: 2 });
const baoDai = (a, b, rong, tg, mau) => vfx.dai(a, b, { rong, song: tg + .08, mau });
const baoVong = (p, r, tg, mau) => vfx.vung(datTai(p), { r, song: tg + .08, mau });
/** cánh sen voxel rơi lả tả (khối dẹt màu chủ đạo) */
const laSen = (p, n, mau, r = 1, toc = 1.5) => vfx.hat(p, { so: n, mau, toc, huong: new V3(0, -.3, 0), loe: 1.4, co: .11, song: 1.2, trongLuc: 1.2, can: 1.5, lech: r });
/** chữ chiêu + trời (JSON vfx_tang: chu_chieu / doi_mau_troi ở tầng 4–5) — bản game chỉ làm cho R */
function tuyetKy(c, ten4, ten5) {
  if (c.t < 4) return;
  vfx.chu(c.t >= 5 ? ten5 : ten4, { mau: '#' + XANH.getHexString(), song: 1.5 });
  vfx.troi(XANH, 2.6, c.t >= 5 ? .3 : .12);
  vfx.vienMan(XANH, 1.6, c.t >= 5 ? .34 : .2);
}

// ================================================================ HÌNH: cánh sen (mảnh lưỡi mác có sống gờ) — lưới tự dựng, port Unity = mesh tĩnh
const _canhGeo = {};
/** cánh sen dài 1 (trục +z), rộng 1, gờ giữa nhô `cup`; scale ngoài để đổi cỡ */
function hinhCanh(cup = .18) {
  const k = cup.toFixed(2); if (_canhGeo[k]) return _canhGeo[k];
  const N = 10, P = [], I = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, w = .5 * Math.pow(Math.sin(Math.PI * Math.pow(t, .85)), .8) * (1 - .25 * t);
    const cong = Math.sin(Math.PI * t) * cup;          // lòng cánh hơi khum
    P.push(-w, cong * .4, t, 0, cong + .02 * Math.sin(Math.PI * t), t, w, cong * .4, t);
    if (i < N) { const a = i * 3, b = a + 3; I.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2); }
  }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals(); g.giu = true;
  return (_canhGeo[k] = g);
}
const HOP = new T.BoxGeometry(1, 1, 1); HOP.giu = true;

/** đoá sen 3D: lop lớp × canh cánh. g.ve(tam, R, mo (độ: 0 khép dựng, 90 nằm), xo (độ), k, boCanh(l,i)) */
function taoSen(lop, canh, mau) {
  const g = new T.Group();
  const mA = new T.MeshStandardMaterial({ color: sang(mau, .42), emissive: mau, emissiveIntensity: .28, roughness: .45, transparent: true, opacity: .72, side: T.DoubleSide, depthWrite: false, flatShading: true });
  const mG = new T.MeshBasicMaterial({ color: sang(mau, .9), transparent: true, opacity: .16, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false });
  const mV = new T.MeshBasicMaterial({ color: sang(lerpC(mau, TRANG, .3), 1.25), transparent: true, opacity: .9, toneMapped: false });
  const geo = hinhCanh(.2), canhs = [];
  for (let l = 0; l < lop; l++) for (let i = 0; i < canh; i++) {
    const ngoai = new T.Group(), trong = new T.Group(); ngoai.add(trong); g.add(ngoai);
    const a = new T.Mesh(geo, mA), q = new T.Mesh(geo, mG), v = new T.Mesh(HOP, mV);
    q.position.y = -.01; trong.add(a); trong.add(q); trong.add(v);
    canhs.push({ l, i, ngoai, trong, a, q, v });
  }
  const nhuy = new T.Mesh(new T.OctahedronGeometry(1, 0), mV); g.add(nhuy);
  g.ve = (tam, R, mo, xo, k, boCanh) => {
    g.visible = k > .01; if (!g.visible) return;
    mA.opacity = .72 * k; mG.opacity = .16 * k; mV.opacity = .9 * k;
    for (const c of canhs) {
      const Lc = R * (1 - c.l * .2), W = Lc * .46, m = clamp(mo - c.l * 16, 0, 90), lech = c.l * (180 / canh);
      c.ngoai.visible = !(boCanh && boCanh(c.l, c.i)) && Lc > .01;
      c.ngoai.position.set(tam.x, tam.y + .04 + c.l * .07, tam.z);
      c.ngoai.rotation.y = (xo + lech + c.i * 360 / canh) * D;
      c.trong.rotation.x = -(90 - m) * D;
      c.a.scale.set(W, W * .9, Lc); c.q.scale.set(W * 1.18, W, Lc * 1.08);
      c.v.position.set(0, W * .2, Lc * .45); c.v.scale.set(.025, .025, Lc * .7);
    }
    nhuy.position.set(tam.x, tam.y + .12 + R * .06, tam.z); nhuy.rotation.y = xo * D; nhuy.scale.set(R * .13, R * .1, R * .13);
  };
  return g;
}
function mutCanh(goc, yawDo, mo, L) {
  const e = (90 - mo) * D; return goc.clone().addScaledVector(huongYaw(yawDo), Math.cos(e) * L * .8).add(new V3(0, Math.sin(e) * L * .8, 0));
}
/** sen nở nhanh rồi tan (chỉ hình): R, lop, song */
function senNo(tam, R, lop, mau, song = .9, canh = 6, kMax = 1) {
  const sen = taoSen(lop, canh, mau), xo = RR(0, 60);
  return vfx.them(sen, song, (dt, u, t) => {
    const no = E.o(cl01(t / .22)); const k = u < .7 ? 1 : 1 - (u - .7) / .3;
    sen.ve(tam, R * (.4 + .6 * no), 8 + 70 * no, xo + t * 30, cl01(t / .06) * k * kMax);
  });
}

// ================================================================ ĐỊA HÌNH: nứt sáng HÌNH CÁNH SEN (vẽ dần từ tâm ra)
/** nutSen(tam, R, { canh, lop, mau, song, rong, xo, toc }) — viền + gân từng cánh, bám mặt đất, cộng sáng */
function nutSen(tam, R, op = {}) {
  const canh = op.canh || 6, lop = op.lop || 1, c = sang(op.mau || XANH, 1.05), song = op.song || 3, rong = op.rong || .06, xo = op.xo != null ? op.xo : RR(0, 60);
  const ds = [];
  const doan = (x0, z0, x1, z1, w, k) => ds.push({ x0, z0, x1, z1, w, k, d: Math.hypot((x0 + x1) / 2 - tam.x, (z0 + z1) / 2 - tam.z) });
  for (let l = 0; l < lop; l++) {
    const Rl = R * (1 - l * .3), r0 = R * .12, rongK = l ? .8 : 1;
    for (let i = 0; i < canh; i++) {
      const a = (xo + l * 180 / canh + i * 360 / canh) * D, f = [Math.sin(a), Math.cos(a)], s = [f[1], -f[0]];
      const Wm = Rl * Math.tan(Math.PI / canh) * .62;
      let pl = null, pr = null, pc = null; const N = 9;
      for (let j = 0; j <= N; j++) {
        const t = j / N, r = r0 + (Rl - r0) * t, w = Wm * Math.pow(Math.sin(Math.PI * Math.pow(t, .8)), .75);
        const cx = tam.x + f[0] * r, cz = tam.z + f[1] * r;
        const L = [cx + s[0] * w, cz + s[1] * w], Rr = [cx - s[0] * w, cz - s[1] * w], C = [cx, cz];
        if (pl) { doan(pl[0], pl[1], L[0], L[1], rong * rongK, 1); doan(pr[0], pr[1], Rr[0], Rr[1], rong * rongK, 1); if (t < .85) doan(pc[0], pc[1], C[0], C[1], rong * .55 * rongK, .7); }
        pl = L; pr = Rr; pc = C;
      }
    }
  }
  ds.sort((a, b) => a.d - b.d);
  const P = [], Cc = [];
  for (const s of ds) {
    const dx = s.x1 - s.x0, dz = s.z1 - s.z0, l = Math.hypot(dx, dz) || 1, nx = -dz / l * s.w, nz = dx / l * s.w;
    const y0 = dia.cao(s.x0, s.z0) + .025, y1 = dia.cao(s.x1, s.z1) + .025;
    P.push(s.x0 + nx, y0, s.z0 + nz, s.x0 - nx, y0, s.z0 - nz, s.x1 - nx, y1, s.z1 - nz, s.x0 + nx, y0, s.z0 + nz, s.x1 - nx, y1, s.z1 - nz, s.x1 + nx, y1, s.z1 + nz);
    for (let i = 0; i < 6; i++) Cc.push(c.r * s.k, c.g * s.k, c.b * s.k);
  }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('color', new T.Float32BufferAttribute(Cc, 3));
  const mat = new T.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, side: T.DoubleSide });
  const m = new T.Mesh(g, mat); m.renderOrder = 2; m.frustumCulled = false;
  const tong = ds.length * 6, toc = op.toc || .3;
  g.setDrawRange(0, 0);
  return vfx.them(m, song, (dt, u, t) => {
    g.setDrawRange(0, Math.min(tong, Math.ceil(tong * sm(t / toc) / 6) * 6));
    mat.opacity = u > .55 ? 1 - sm((u - .55) / .45) : 1;
  });
}
/** sen nở trên đất: nhuộm xanh + nứt sáng hình cánh sen + vòng sóng (+ tuỳ chọn hoa 3D, gió rạp cỏ) */
function senDat(tam, R, op = {}) {
  const p = datTai(tam);
  dia.chay(p, R * 1.05, { mau: op.mau || XANH, manh: op.manh != null ? op.manh : .5 });
  const xo = RR(0, 60);
  nutSen(p, R, { canh: op.canh || 6, lop: op.lop || 1, mau: op.mau || XANH, song: op.song || 3, xo, rong: op.rong || (.035 + R * .012) });
  vongDat(p, R * 1.2, op.mau || XANH, .5, .1);
  if (op.hoa) senNo(p.clone().add(new V3(0, .03, 0)), op.hoa, op.lopHoa || 1, op.mauHoa || NGOC, op.songHoa || 1);
  if (op.gio) dia.gio(p, R * 1.6, op.gio);
}

// ================================================================ KIẾM SEN — kiếm thật (vfx.phiKiem) bọc hai cánh sen
/** kiemSen({ co, mau, canh (số cánh 0/2/3), sang, song }) → phiKiem có thêm cánh sen gắn dọc lưỡi */
function kiemSen(op = {}) {
  const co = op.co || 1.4, mau = op.mau || XANH;
  const pk = vfx.phiKiem({ dai: .95, co, mau, sang: op.sang != null ? op.sang : .7, tua: 0x2c8a60, song: op.song || 6, vet: op.vet });
  const k = pk.kiem, L = k.muiL, soC = op.canh != null ? op.canh : 2;
  const mA = new T.MeshBasicMaterial({ color: sang(mau, .75), transparent: true, opacity: .4, depthWrite: false, side: T.DoubleSide, toneMapped: false });
  const mG = new T.MeshBasicMaterial({ color: sang(mau, 1), transparent: true, opacity: .2, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false });
  const geo = hinhCanh(.28);
  for (let i = 0; i < soC; i++) {
    // hai cánh ôm hai mép lưỡi, cùng mặt phẳng lưỡi, xoè nhẹ ra ngoài (cánh thứ ba dựng trên sống kiếm)
    const s = i === 0 ? 1 : i === 1 ? -1 : 0;
    const quanh = new T.Group(); if (!s) quanh.rotation.z = 90 * D; k.add(quanh);
    const nghieng = new T.Group(); nghieng.position.set((s || 1) * L * .095, 0, L * .1); nghieng.rotation.y = (s || 1) * .16; quanh.add(nghieng);
    const m1 = new T.Mesh(geo, mA), m2 = new T.Mesh(geo, mG);
    m1.scale.set(L * .13, L * .08, L * .62); m2.scale.set(L * .17, L * .1, L * .68); nghieng.add(m1); nghieng.add(m2);
  }
  pk.datMo = kk => { mA.opacity = .4 * kk; mG.opacity = .2 * kk; };
  return pk;
}

// ================================================================ ĐÁNH TRÚNG (bù nhìn)
const TEN_TT = { troi: 'Trói', cham: 'Chậm', dong_bang: 'Đóng băng', giap_vo: 'Giáp vỡ', doc: 'Độc', thieu: 'Thiêu', choang: 'Choáng' };
/** phiên đánh: hệ số tầng × hệ số nhánh (MỘT lần) + trạng thái bảng tầng (nhánh ghi đè) */
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
function trungMot(c, d, op) {
  const chan = DK.cheDoBuNhin === 'do';
  DK.trung(d, { st: op.manh * c.hs, nguon: c.nv, day: op.lui || 0, hat: op.len || 0, mau: XANH, trangThai: c.tt || undefined });
  return !chan;
}
const diemThan = (o, p) => new V3(o.pos.x, clamp(p.y, o.pos.y + .2, o.pos.y + 1.7), o.pos.z);
function kcDoan(p, a, b) { const ab = new V3().subVectors(b, a), L2 = ab.lengthSq(); if (L2 < 1e-8) return p.distanceTo(a); const t = cl01(new V3().subVectors(p, a).dot(ab) / L2); return p.distanceTo(a.clone().addScaledVector(ab, t)); }
const BK = .35;
function vungCb(c, tam, r, op, cb, ds) {
  let so = 0;
  for (const o of DK.dsBuNhin.slice()) {
    if (ds && ds.indexOf(o) >= 0) continue;
    const p = diemThan(o, tam); if (p.distanceTo(tam) > r + BK) continue;
    if (ds) ds.push(o);
    const kq = trungMot(c, o, op); so++; if (cb) cb(o, kq, nguc(o));
  }
  return so;
}
function doanCb(c, a, b, rn, op, ds, cb) {
  let so = 0;
  for (const o of DK.dsBuNhin.slice()) {
    if (ds && ds.indexOf(o) >= 0) continue;
    const p1 = o.pos.clone().add(new V3(0, .35, 0)), p2 = o.pos.clone().add(new V3(0, 1.44, 0)), gi = p1.clone().add(p2).multiplyScalar(.5);
    if (Math.min(kcDoan(p1, a, b), kcDoan(p2, a, b), kcDoan(gi, a, b)) > rn + BK) continue;
    if (ds) ds.push(o);
    const diem = nguc(o), kq = trungMot(c, o, op);
    if (kq) quangNo(diem, .8, XANH, .2);
    so++; if (cb) cb(o, kq, diem);
  }
  return so;
}
function quatCb(c, tam, h, r, gocDo, op, cb) {
  const cg = Math.cos(gocDo * .5 * D); let so = 0;
  for (const o of DK.dsBuNhin.slice()) {
    const dx = o.pos.x - tam.x, dz = o.pos.z - tam.z, dh = Math.hypot(dx, dz);
    if (dh > r + BK) continue;
    if (dh > BK + .3 && (dx * h.x + dz * h.z) / dh < cg) continue;
    const diem = nguc(o), kq = trungMot(c, o, op);
    if (kq) quangNo(diem, .7, XANH, .16);
    so++; if (cb) cb(o, kq, diem);
  }
  return so;
}
const keThuQuanh = (p, r) => DK.dsBuNhin.filter(o => Math.hypot(o.pos.x - p.x, o.pos.z - p.z) <= r + BK);
function hoiMau(nv, tiLe, mau) {
  if (tiLe <= 0) return;
  const p = nguc(nv); quangNo(p, .8, mau, .35);
  vfx.hat(p, { so: 10, mau, toc: 1.6, huong: LEN, loe: .8, co: .1, song: .9, trongLuc: -1, lech: .5 });
  DK.chuNoi('+' + Math.round(1000 * tiLe), nv.diem('dau').add(new V3(0, .4, 0)), '#9effc8');
}
function hutMau(c, manh, tiLe, mau) {
  if (tiLe <= 0) return;
  quangNo(nguc(c.nv), .5, mau, .25);
  DK.chuNoi('+' + Math.round(manh * c.hs * tiLe), c.nv.diem('dau').add(new V3(0, .4, 0)), '#9effc8');
}
function diemVung(c, tam, xa = 8) {
  const nv = c.nv, d = c.dich;
  if (conSong(d) && Math.hypot(d.pos.x - nv.pos.x, d.pos.z - nv.pos.z) <= tam + 2) return datTai(d.pos);
  return datTai(nv.pos.clone().addScaledVector(nv.toi(), Math.min(xa, tam)));
}
function diToi(nv, den, tg, e = 'l', moiBuoc) {
  const tu = nv.pos.clone(), f = E[e] || E.l;
  DK.lap((dt, tl) => { const u = cl01(tl / Math.max(.01, tg)), k = f(u); nv.pos.x = tu.x + (den.x - tu.x) * k; nv.pos.z = tu.z + (den.z - tu.z) * k; if (moiBuoc) moiBuoc(u); return u < 1; });
}
function yaw(c, toi) {
  const nv = c.nv; nv.ngam(toi); c.yaw = nv.yaw;
  DK.lap(() => { if (!nv.hd || nv.hd !== c.hd) return false; nv.yaw = c.yaw; return true; });
}
const datYaw = (c, toi) => { const d = new V3().subVectors(toi, c.nv.pos); if (d.x * d.x + d.z * d.z > 1e-6) { c.yaw = Math.atan2(d.x, d.z); c.nv.yaw = c.yaw; } };
/** vệt chém theo mũi kiếm — màu THANH KIẾM */
const vetKiem = (ctx, song = .14, rong = .85) => vfx.vet(ctx.nv, { song, tan: song > .2 ? .14 : .2, mau: ctx.mau, kieu: 'sang', rong });

// ================================================================ ĐẠN: KIẾM SEN BAY
/**
 * bay(c, { pos, vel, toc, tam, r, co, mau, canh, duoi, dich, quay, cho, diemCho, diemDich, xuyen, quaDat, op,
 *   khiTrung(o, kq, diem), khiHet(pos, vel), catCo (m bề rộng cắt cỏ khi bay sát đất), senMoi (m: cứ mỗi đoạn nở sen nhỏ trên đất),
 *   ha (m: hạ dần xuống độ cao này), camDat (cắm đất khi chạm), lan (độ/s xoay quanh trục bay) })
 */
function bay(c, o) {
  const p = Object.assign({ toc: 26, tam: 22, r: .55, co: 1.5, cho: 0, quay: 6, mau: XANH, canh: 2, duoi: false, xuyen: false, quaDat: false, lan: 0 }, o);
  let pos = p.pos.clone(), vel = p.vel ? p.vel.clone() : new V3(0, 0, p.toc);
  const goc = pos.clone(); let conLai = p.tam, t = 0, het = false, tHet = 0, daPhong = false, quang = 0, moc = p.senMoi || 0, cuon = 0;
  const thu = [];
  const pk = kiemSen({ co: p.co, mau: p.mau, canh: p.canh, song: 60, sang: p.sang });
  const nhamToi = () => {
    if (conSong(p.dich)) return new V3().subVectors(nguc(p.dich), pos);
    if (p.diemDich) return new V3().subVectors(p.diemDich, pos);
    return vel.clone();
  };
  const xoayToi = (muon, maxRad) => {
    const a = vel.clone().normalize(), b = muon.clone().normalize(), g = a.angleTo(b);
    if (g <= maxRad || g < 1e-5) { vel.copy(b).multiplyScalar(p.toc); return; }
    const q = new T.Quaternion().setFromUnitVectors(a, b), q2 = new T.Quaternion().slerp(q, maxRad / g);
    vel.copy(a.applyQuaternion(q2)).multiplyScalar(p.toc);
  };
  const ve = (k) => {
    const f = vel.lengthSq() > 1e-6 ? vel.clone().normalize() : new V3(0, 0, 1);
    pk.dat(pos, f); pk.o.rotateZ((p.roll != null ? p.roll : 90) * D + cuon); pk.o.scale.setScalar(Math.max(.01, k)); pk.datMo(Math.min(1, k));
  };
  const ket = q => {
    if (het) return; het = true; tHet = t;
    if (p.khiHet) try { p.khiHet(q.clone(), vel.clone()); } catch (e) { console.error(e); DK.baoLoi(e); }
  };
  ve(.01);
  vfx.them(null, 60, dt => {
    if (het) {
      t += dt; const k = 1 - (t - tHet) / .16;
      if (k <= 0 || p.camDat) { pk.huy(); return false; }
      ve(k); return true;
    }
    t += dt; cuon += (p.lan || 0) * D * dt;
    if (t < p.cho) {
      if (p.diemCho) pos.lerpVectors(goc, p.diemCho, E.o(t / Math.max(.01, p.cho)));
      const f = nhamToi(); if (f.lengthSq() > 1e-6) xoayToi(f, 10 * dt);
      ve(cl01(t / .12)); return true;
    }
    if (!daPhong) {
      daPhong = true;
      if (p.cho > 0) { const f = nhamToi(); if (f.lengthSq() > 1e-6) vel.copy(f.normalize().multiplyScalar(p.toc)); }
      quangNo(pos, .45, p.mau, .12);
    }
    if (p.duoi && conSong(p.dich)) { const muon = new V3().subVectors(nguc(p.dich), pos); if (muon.lengthSq() > 1e-4) xoayToi(muon, p.quay * dt); }
    if (p.ha != null) { const y0 = dia.cao(pos.x, pos.z) + p.ha; if (pos.y > y0) { vel.y = 0; pos.y += (y0 - pos.y) * Math.min(1, dt * 5); } }
    const truoc = pos.clone(); pos.addScaledVector(vel, dt); const buoc = p.toc * dt; conLai -= buoc; quang += buoc;
    // cỏ đứt theo đường kiếm + sen nở dọc đường
    if (p.catCo && pos.y - dia.cao(pos.x, pos.z) < 1.4) { dia.cat(truoc, pos, p.catCo); if (Math.random() < .5) dia.gio(pos, 1.6, .5); }
    if (moc > 0 && quang >= moc) { quang -= moc; const q = datTai(pos); senDat(q, p.senR || .9, { canh: 5, song: 2.6, manh: .45, hoa: p.senHoa || 0, songHoa: .8 }); }
    for (const o2 of DK.dsBuNhin.slice()) {
      if (het || thu.indexOf(o2) >= 0) continue;
      const p1 = o2.pos.clone().add(new V3(0, .3, 0)), p2 = o2.pos.clone().add(new V3(0, 1.53, 0)), gi = p1.clone().add(p2).multiplyScalar(.5);
      if (Math.min(kcDoan(p1, truoc, pos), kcDoan(p2, truoc, pos), kcDoan(gi, truoc, pos)) > p.r + BK) continue;
      thu.push(o2);
      const diem = nguc(o2);
      if (trungMot(c, o2, p.op)) {
        quangNo(diem, clamp(p.r * 1.6, .7, 2), p.mau, .2); laSen(diem, 6, NGOC, .4, 2.5);
        if (p.khiTrung) try { p.khiTrung(o2, true, diem); } catch (e) { console.error(e); DK.baoLoi(e); }
        if (!p.xuyen) ket(pos);
      } else { tiaLua(pos, 18, p.mau, 7); p.khiHet = null; ket(pos); }
    }
    if (het) { ve(1); return true; }
    const nen = dia.cao(pos.x, pos.z);
    if (!p.quaDat && pos.y < nen + .05) { pos.y = nen + .05; ve(1); ket(pos); return true; }
    if (conLai <= 0) { ve(1); ket(pos); return true; }
    ve(1); return true;
  });
  return pk;
}
/** kiếm cắm đất (kiếm trận): kiếm thật cắm nghiêng + vụn đất + nứt cánh sen nhỏ */
function camDat(pos, huong, co, song = 2.6) {
  const p = datTai(pos);
  const k = dia.camKiem(p.clone().add(new V3(0, .35 * co, 0)), huong, { mau: XANH, co, song, sang: 1.6, tua: 0x2c8a60 });
  quangNo(p.clone().add(new V3(0, .3, 0)), .8, XANH, .2);
  dia.chay(p, .7, { mau: XANH, manh: .5 });
  return k;
}

// ================================================================ RỄ NGỌC (KiemTuThanhVan.ReCay) + cày đất
function reCay(c, o) {
  const p = Object.assign({ tLon: .45, giu: 1.2, rn: 1, day: .32, mau: XANH, mauRe: RE, cay: true }, o);
  const n = clamp(Math.ceil(p.a.distanceTo(p.b) / .55), 4, 40);
  const diem = []; for (let i = 0; i <= n; i++) diem.push(datTai(new V3().lerpVectors(p.a, p.b, i / n)).add(new V3(0, .08, 0)));
  const ds = p.ds || [], pha = RR(0, 6.28);
  const g = new T.Group();
  const matRe = new T.MeshStandardMaterial({ color: p.mauRe, roughness: .8, emissive: p.mau, emissiveIntensity: .12, transparent: true, opacity: 1, flatShading: true });
  const matSang = new T.MeshBasicMaterial({ color: sang(p.mau, 1.8), transparent: true, opacity: .8, toneMapped: false }), matLa = vfx.matCong(sang(p.mau, 1.2), .6);
  const dot = [];
  for (let i = 0; i < n; i++) {
    const re = new T.Mesh(HOP, matRe), s = new T.Mesh(HOP, matSang); re.castShadow = true; g.add(re); g.add(s);
    const la = i % 2 === 1 && p.la ? new T.Mesh(hinhCanh(.2), matLa) : null; if (la) g.add(la);
    dot.push({ re, s, la });
  }
  const dau = new T.Mesh(new T.OctahedronGeometry(1, 0), vfx.matCong(sang(p.mau, 2), .9)); g.add(dau);
  let t = 0, daLon = 0;
  vfx.them(g, 30, dt => {
    t += dt;
    const u = cl01(t / Math.max(.05, p.tLon)), den = u * n;
    if (den > daLon) {
      const i0 = Math.floor(daLon), i1 = Math.min(n, Math.ceil(den));
      if (i1 > i0 && p.op && p.op.manh > 0) doanCb(c, diem[i0].clone().add(new V3(0, .5, 0)), diem[i1].clone().add(new V3(0, .5, 0)), p.rn, p.op, ds, p.khiTrung);
      for (let i = Math.floor(daLon) + 1; i <= i1; i++) {
        if (p.cay) { dia.nang(diem[i], .55, .14 + p.day * .25); if (i % 2 === 0) dia.vun(diem[i], { so: 3, luc: 2, len: 3.5, co: .14, r: .3 }); }
        if (i % 3 === 0) dia.cat(diem[Math.max(0, i - 3)], diem[i], .6);
      }
      daLon = den;
      if (u >= 1 && !p.daCay) { p.daCay = true; if (p.ranh) dia.ranh(p.a, p.b, .4, .16, { mau: XANH }); }
    }
    const tat = t > p.tLon + p.giu ? 1 - (t - p.tLon - p.giu) / .4 : 1;
    if (tat <= 0) return false;
    const chim = (1 - tat) * .5, m = Math.min(n, Math.ceil(den));
    matRe.opacity = tat; matSang.opacity = .8 * tat; matLa.opacity = .6 * tat; matRe.transparent = tat < 1;
    for (let i = 0; i < n; i++) {
      const D0 = dot[i]; const hien = i < m; D0.re.visible = D0.s.visible = hien; if (D0.la) D0.la.visible = hien; if (!hien) continue;
      const p0 = diem[i], p1 = diem[i + 1], dir = new V3().subVectors(p1, p0), ben = new V3().crossVectors(LEN, dir).normalize();
      const s = Math.sin(i * .9 + pha) * .18, k = 1 - i / n * .5, moc = cl01((den - i) * 1.5);
      const gg = p0.clone().add(p1).multiplyScalar(.5).addScaledVector(ben, s).add(new V3(0, Math.abs(Math.sin(i * 1.7 + pha)) * .14 * moc - chim, 0));
      const d = p.day * k * (.4 + .6 * moc), L = dir.length();
      D0.re.position.copy(gg); D0.re.lookAt(gg.clone().add(dir).add(new V3(0, Math.sin(i * 2.1 + pha) * .2, 0))); D0.re.scale.set(d, d * .85, L * 1.25);
      D0.s.position.copy(gg).add(new V3(0, d * .38, 0)); D0.s.quaternion.copy(D0.re.quaternion); D0.s.scale.set(d * .22, d * .18, L * 1.1);
      if (D0.la) { D0.la.position.copy(gg).add(new V3(0, d * .4, 0)).addScaledVector(ben, d * .5 * (i % 4 === 1 ? 1 : -1)); D0.la.lookAt(D0.la.position.clone().addScaledVector(ben, i % 4 === 1 ? 1 : -1).add(new V3(0, .9, 0))); D0.la.scale.setScalar(d * 1.8 * moc); }
    }
    dau.visible = u < 1; if (dau.visible) { dau.position.copy(diem[Math.min(m, n)]).add(new V3(0, .2, 0)); dau.scale.setScalar(p.day * .9); dau.rotation.y = t * 8; }
    return true;
  });
}
/** gai ngọc trồi (KiemTuThanhVan.GaiNo) — gai = khối thoi ngọc; bui: true ⇒ thêm lá sen (bụi cây sáng Hoá Cảnh) */
function gaiNgoc(c, o) {
  const p = Object.assign({ R: 1.6, tNo: .25, cao: 1.6, so: 7, mau: XANH }, o);
  const xo = RR(0, 360), g = new T.Group();
  const matG = new T.MeshStandardMaterial({ color: lerpC(p.mau, TRANG, .2), emissive: p.mau, emissiveIntensity: .7, roughness: .25, metalness: .2, transparent: true, opacity: .92, flatShading: true });
  const matL = vfx.matCong(sang(p.mau, 1.3), .55);
  const gai = [];
  for (let i = 0; i < p.so; i++) {
    const a = xo + i * 360 / p.so + RR(-12, 12), ra = huongYaw(a);
    const goc = datTai(p.tam.clone().addScaledVector(ra, p.R * (.25 + .3 * (i % 2)))), f = new V3(0, 1.4, 0).addScaledVector(ra, .55 + RR(-.15, .15)).normalize();
    const m = new T.Mesh(new T.OctahedronGeometry(1, 0), matG); m.castShadow = true; g.add(m);
    const la = p.bui ? new T.Mesh(hinhCanh(.3), matL) : null; if (la) g.add(la);
    gai.push({ goc, f, m, la, dai: i % 2 === 0 ? 1 : .7, ra });
  }
  let t = 0, daNo = false;
  dia.nang(p.tam, p.R * .8, .16);
  vfx.them(g, 10, dt => {
    t += dt; const u = cl01(t / Math.max(.05, p.tNo));
    if (!daNo && u >= 1) {
      daNo = true;
      if (p.op && p.op.manh > 0) vungCb(c, p.tam.clone().add(new V3(0, .6, 0)), p.R, p.op);
      quangNo(p.tam.clone().add(new V3(0, .6, 0)), p.R * .6, p.mau, .22);
      dia.vun(p.tam, { so: 10, luc: 3, len: 4, r: p.R * .5, co: .16 });
    }
    const k = t < p.tNo + (p.giu || .45) ? 1 : 1 - (t - p.tNo - (p.giu || .45)) / .3; if (k <= 0) return false;
    const h = p.cao * E.o(u); matG.opacity = .92 * k; matL.opacity = .55 * k;
    for (const G of gai) {
      const Li = h * G.dai; G.m.visible = Li >= .05; if (!G.m.visible) continue;
      G.m.position.copy(G.goc).addScaledVector(G.f, Li * .5); G.m.quaternion.setFromUnitVectors(LEN, G.f); G.m.scale.set(.13 + Li * .05, Li * .5, .13 + Li * .05);
      if (G.la) { G.la.position.copy(G.goc).addScaledVector(G.f, Li * .9); G.la.lookAt(G.la.position.clone().add(G.ra).add(new V3(0, .6, 0))); G.la.scale.setScalar(Li * .45); }
    }
    return true;
  });
}

// ================================================================ ĐÒN THƯỜNG — 6 nhát "Thanh Liên Kiếm Vũ"
//   1 chéo xuống · 2 hất ngược · 3 xoay người quét tròn thấp · 4 đâm nhuỵ (kiếm sen ngắn) · 5 bật xoay chém giáng · 6 xoay hai vòng vút kiếm lên trời, sen nở dưới chân
function danh(ctx, i) {
  const nv = ctx.nv, h = huongNgang(nv, ctx.dich);
  if (ctx.dich && ctx.dich.pos.distanceTo(nv.pos) < 8) nv.ngam(ctx.dich.pos);
  const mangLa = p => laSen(p, 3, NGOC, .3, 1.8);
  const non = (r, g, st, op = {}) => DK.trongNon(nv, r, g).forEach(d => { ctx.trung(d, Object.assign({ st, day: .4, mau: XANH }, op)); mangLa(nguc(d)); });
  if (i === 0) ctx.phat('tln_d1', { moc: { vet0: () => vetKiem(ctx, .14), trung: () => non(2.7, 130, 34) } });
  else if (i === 1) ctx.phat('tln_d2', { moc: { vet0: () => vetKiem(ctx, .15), trung: () => non(2.7, 130, 36) } });
  else if (i === 2) ctx.phat('tln_d3', { moc: { vet0: () => vetKiem(ctx, .3, .4), trung: () => { DK.trongTron(nv.pos, 3).forEach(d => { ctx.trung(d, { st: 40, day: .8, mau: XANH }); mangLa(nguc(d)); }); dia.gio(nv.pos, 3.5, .6); laSen(nguc(nv), 8, NGOC, 1.2, 2); } } });
  else if (i === 3) ctx.phat('tln_d4', { moc: { vet0: () => vetKiem(ctx, .12), trung: () => {
    non(3.2, 50, 44, { day: .9 });
    // nhuỵ kiếm: một kiếm sen ngắn đâm thẳng 6 m
    const c = { nv, hs: 1, tt: null };
    const tu = nguc(nv).addScaledVector(h, .9);
    bay(c, { pos: tu, vel: h.clone().multiplyScalar(30), toc: 30, tam: 6, co: 1, r: .4, canh: 2, xuyen: true, op: { manh: 22 } });
  } } });
  else if (i === 4) ctx.phat('tln_d5', { moc: { vet0: () => vetKiem(ctx, .12), trung: () => {
    non(3, 100, 52, { day: .6 });
    const p = datTai(nv.pos.clone().addScaledVector(nv.toi(), 1.4));
    nutSen(p, 1.3, { canh: 5, song: 1.8, rong: .04 }); dia.chay(p, 1.2, { mau: XANH, manh: .35 }); dia.vun(p, { so: 8, luc: 2, len: 3, co: .12 }); rung(.12);
  } } });
  else ctx.phat('tln_d6', { moc: {
    vet0: () => vetKiem(ctx, .46, .4),
    t1: () => DK.trongTron(nv.pos, 3.2).forEach(d => ctx.trung(d, { st: 30, day: .3, mau: XANH })),
    t2: () => DK.trongTron(nv.pos, 3.2).forEach(d => ctx.trung(d, { st: 30, day: .3, mau: XANH })),
    t3: () => {
      DK.trongTron(nv.pos, 3.6).forEach(d => { ctx.trung(d, { st: 64, hat: 1.4, day: 1, mau: XANH }); mangLa(nguc(d)); });
      const p = datTai(nv.pos);
      senDat(p, 2.4, { song: 2.4, hoa: 1.6, gio: .9 }); rung(.18);
      // sáu kiếm sen nhỏ bung ra như cánh sen
      const c = { nv, hs: 1, tt: null }, y0 = nv.yaw / D;
      for (let k = 0; k < 6; k++) { const r = huongYaw(y0 + k * 60); bay(c, { pos: p.clone().add(new V3(0, .9, 0)).addScaledVector(r, .6), vel: r.clone().multiplyScalar(18), toc: 18, tam: 4.2, co: .8, r: .4, xuyen: true, op: { manh: 14 }, catCo: .5 }); }
    } } });
}
/** lộn né: Shift (+W/S/A/D chọn hướng) — để lại cánh sen + ảnh sót */
function lon(ctx) {
  const nv = ctx.nv, P = DK.phim || {};
  const clip = P.s ? 'tln_lon_lui' : P.a ? 'tln_lon_trai' : P.d ? 'tln_lon_phai' : 'tln_lon';
  laSen(nguc(nv), 8, NGOC, .5, 2.4); vfx.anhSot(nv, { mau: XANH, op: .3, song: .35 });
  ctx.phat(clip, { moc: { huy: () => {} } });
  DK.sau(.16, () => vfx.anhSot(nv, { mau: XANH, op: .22, song: .3 }));
  DK.sau(.34, () => { laSen(nguc(nv), 5, NGOC, .4, 1.5); dia.gio(nv.pos, 2, .4); });
}

// ================================================================ Z · Thanh Liên Kiếm Khí
//   T1 một kiếm sen · T2 dày, kéo lá sen, trói nhẹ · T3 ba kiếm 20° · T4 kiếm hạ sát đất: sen nở dọc đường, cỏ đứt, cuối đường sen lớn
//   T5 Ngũ Diệp Liên Ca: năm kiếm 28°, rãnh kiếm khí xẻ đất, mỗi kiếm để lại đoá sen · Tán Diệp năm kiếm 50° · Truy Hồn một kiếm lớn lượn đuổi
function kiemKhi(ctx) {
  const c = taoPhien(ctx), nv = c.nv, t = c.t, n = c.n;
  const h = huongNgang(nv, c.dich);
  const tanDiep = n === N_TAN_DIEP, truyHon = n === N_TRUY_HON, tam = tanDiep ? 17.6 : 22;
  const a = datTai(nv.pos).addScaledVector(h, .6);
  baoDai(a, a.clone().addScaledVector(h, tam), tanDiep ? 7 : t >= 3 ? 4 : 2.4, .27, XANH);
  c.hd = ctx.phat('tln_z'); yaw(c, a.clone().addScaledVector(h, 5));
  tuyetKy(c, 'Thanh Liên Kiếm Khí', 'Ngũ Diệp Liên Ca');
  // tụ khí: cánh sen voxel hút về mũi kiếm
  DK.sau(.04, () => { const m = nv.mui(); vfx.hat(m, { so: 10, mau: XANH, toc: -3, co: .07, song: .2, trongLuc: 0, lech: .9 }); quangNo(m, .5, XANH, .2); });
  DK.sau(.2, () => vetKiem(ctx, .16));
  DK.sau(.27, () => {
    const tu = nguc(nv).addScaledVector(h, .9);
    let so, goc, frac, co = 1.7;
    if (truyHon) { so = 1; goc = 0; frac = 1; co = 2.5; }
    else if (tanDiep) { so = 5; goc = 50; frac = .3; co = 1.3; }
    else if (t >= 5) { so = 5; goc = 28; frac = .28; }
    else if (t >= 3) { so = 3; goc = 20; frac = .42; }
    else { so = 1; goc = 0; frac = 1; }
    if (t >= 2) co *= 1.1;
    if (t >= 4) co *= 1.12;
    const vm = t >= 4 && !tanDiep;
    for (let k = 0; k < so; k++) {
      const g = so > 1 ? -goc * .5 + goc * k / (so - 1) : 0, dir = xoay(h, g);
      bay(c, {
        dich: c.dich, duoi: truyHon && !!c.dich, quay: 4, pos: tu.clone().addScaledVector(dir, .2), vel: dir.clone().multiplyScalar(truyHon ? 20 : 26), toc: truyHon ? 20 : 26, tam,
        r: co * .36, co, canh: truyHon ? 3 : 2, xuyen: !truyHon, op: { manh: 60 * frac },
        ha: vm ? .75 : null, catCo: vm ? .7 : 0, senMoi: vm ? (t >= 5 ? 2.8 : 3.4) : 0, senR: t >= 5 ? 1.1 : .9, senHoa: t >= 5 ? .7 : .5,
        khiTrung: t >= 2 ? (o => { gaiNgoc(c, { tam: datTai(o.pos), R: .7, tNo: .15, cao: .7, so: 5, giu: .5 }); if (truyHon) senDat(o.pos, 1.6, { song: 2.4, hoa: 1.2 }); }) : null,
        khiHet: vm ? ((q) => { senDat(q, t >= 5 ? 2.2 : 1.8, { song: 3, hoa: t >= 5 ? 1.6 : 1.3, lopHoa: t >= 5 ? 2 : 1, gio: .8 }); rung(.12); }) : null,
      });
    }
    if (t >= 2) laSen(tu, 8, NGOC, .4, 3);
    if (t >= 5) {   // rãnh kiếm khí giữa xẻ đất theo đường kiếm chính
      DK.sau(.15, () => dia.ranh(a.clone().addScaledVector(h, 1.5), a.clone().addScaledVector(h, tam * .85), .45, .22, { mau: XANH }));
      vfx.vaCham({ kieu: 'chop', mau: XANH, song: .06 });
    }
    rung(t >= 4 ? .2 : .14);
  });
}

// ================================================================ X · Liên Hoa Tam Điệp
//   ba nhát (chéo · hất · giáng); T3+ nhát ba xoay người quét tròn, sen hai lớp quanh thân; T4 sen ba lớp + đất nhuộm, nứt cánh sen, cỏ rạp
//   T5 Bách Diệp Liên Hoa: trăm cánh sen xoay quanh thân rồi bung ra cắt cỏ thành tia · Thanh Tâm: sen trắng ngọc hồi ×2,5 · Toàn Vũ: nhát 4 xoay hai vòng
const TRANG_GEO = (() => {
  const N = 20, GOC = 80 * D, P = [], C = [], I = [];
  for (let k = 0; k <= N; k++) {
    const u = k / N, g = -GOC + 2 * GOC * u, dx = Math.sin(g), dz = Math.cos(g);
    const w = .3 * Math.pow(Math.max(0, Math.cos((u - .5) * Math.PI)), .8);
    P.push(dx, 0, dz, dx * (1 - w), 0, dz * (1 - w) - w * .25);
    C.push(1, 1, 1, 1, 1, 1, 1, .1);
    if (k < N) { const a = k * 2; I.push(a, a + 1, a + 3, a, a + 3, a + 2); }
  }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('color', new T.Float32BufferAttribute(C, 4)); g.setIndex(I);
  g.giu = true; return g;
})();
/** trăng kiếm khí đọng lại (nghiêng `ngh` rad quanh hướng chém) */
function trangTinh(p, d, r, mau, song = .32, ngh = 0) {
  const g = new T.Group();
  const a = new T.Mesh(TRANG_GEO, new T.MeshBasicMaterial({ color: sang(mau, 1.3), vertexColors: true, transparent: true, opacity: .75, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false }));
  const b = new T.Mesh(TRANG_GEO, new T.MeshBasicMaterial({ color: sang(TRANG, 1.4), vertexColors: true, transparent: true, opacity: .3, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false }));
  b.scale.set(.97, 1, .97); g.add(a); g.add(b);
  const f = ngang(d), n = LEN.clone().applyAxisAngle(f, ngh);
  const x = new V3().crossVectors(n, f).normalize(); const m = new T.Matrix4().makeBasis(x, n, f);
  g.quaternion.setFromRotationMatrix(m); g.position.copy(p);
  return vfx.them(g, song, (dt, u) => { const s = r * (.35 + .65 * E.o(Math.min(1, u * 3))); g.scale.setScalar(s); a.material.opacity = .75 * (1 - u * u); b.material.opacity = .5 * (1 - u); });
}
/** vòng cánh sen xoay quanh thân (Bách Diệp / lốc Toàn Vũ): trả { bung(tốc) } */
function locCanh(nv, so, mau, op = {}) {
  const g = new T.Group(), geo = hinhCanh(.25);
  const mA = new T.MeshBasicMaterial({ color: sang(mau, .85), transparent: true, opacity: .6, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false });
  const ds = [];
  for (let i = 0; i < so; i++) { const m = new T.Mesh(geo, mA); g.add(m); ds.push({ m, a: RR(0, 6.28), r: RR(op.r0 || 1, op.r1 || 2.2), y: RR(.2, op.cao || 2.2), w: RR(4, 7) * (op.chieu || -1), co: RR(.18, .3), v: null }); }
  let bung = false, t = 0;
  const x = vfx.them(g, op.song || 2, (dt, u) => {
    t += dt; const k = u > .85 ? (1 - u) / .15 : cl01(t / .2);
    mA.opacity = .6 * k;
    for (const d of ds) {
      if (!bung) {
        d.a += d.w * dt; d.y += dt * (op.len || .3);
        const p = new V3(nv.pos.x + Math.cos(d.a) * d.r, nv.pos.y + d.y, nv.pos.z + Math.sin(d.a) * d.r);
        d.m.position.copy(p); d.m.lookAt(p.clone().add(new V3(-Math.sin(d.a), .25, Math.cos(d.a)).multiplyScalar(Math.sign(d.w))));
      } else { d.m.position.addScaledVector(d.v, dt); d.v.multiplyScalar(Math.exp(-1.6 * dt)); d.v.y -= 2 * dt; d.m.lookAt(d.m.position.clone().add(d.v)); }
      d.m.scale.set(d.co * .6, d.co * .5, d.co * 1.6);
    }
  });
  return {
    x, bung(toc) {
      bung = true; x.t = Math.max(x.t, x.song * .45);
      for (const d of ds) { const r = new V3(Math.cos(d.a), 0, Math.sin(d.a)); d.v = r.multiplyScalar(toc * RR(.7, 1.2)).add(new V3(0, RR(-1, 2), 0)); }
    },
    ds,
  };
}
function tamDiep(ctx) {
  const c = taoPhien(ctx), nv = c.nv, t = c.t, n = c.n;
  const h = huongNgang(nv, c.dich), R = 4.6;
  const thanhTam = n === N_THANH_TAM, toanVu = n === N_TOAN_VU, tron = t >= 3;
  const mauSen = thanhTam ? NGOC_TRANG : NGOC;
  if (tron) baoVong(nv.pos, R * 1.1, .7, XANH); else vfx.vung(datTai(nv.pos).addScaledVector(h, 2.3), { r: 2.4, song: .24, mau: XANH });
  c.hd = ctx.phat(toanVu ? 'tln_x_vu' : tron ? 'tln_x_tron' : 'tln_x'); yaw(c, nv.pos.clone().addScaledVector(h, 5));
  tuyetKy(c, 'Liên Hoa Tam Điệp', 'Bách Diệp Liên Hoa');
  const lopSen = t >= 5 ? 4 : t >= 4 ? 3 : t >= 3 ? 2 : 1;
  const hoi = .015 * (thanhTam ? 2.5 : 1) * (t >= 4 ? 1.4 : 1);
  let bach = null;
  if (t >= 5) bach = locCanh(nv, 100, mauSen, { song: 2.2, r0: .9, r1: 2.4, cao: 1.6, len: .4 });
  function chem(k) {
    const hh = huongNgang(nv, c.dich), tam = nguc(nv);
    const cuoi = k === 2, quet = cuoi && tron, manh = cuoi ? 34 : 24;
    let dem = 0;
    const cb = (o, kq, p) => { if (!kq) return; dem++; if (thanhTam) hutMau(c, manh, .08, mauSen); if (t >= 2) laSen(p, 5, mauSen, .4, 2.2); };
    if (quet) vungCb(c, tam, R * 1.1, { manh, pha: 9, len: 0, lui: 1.5 }, cb);
    else quatCb(c, nv.pos, hh, R, 110, { manh, pha: 8 }, cb);
    const ngh = k === 0 ? .55 : k === 1 ? -.5 : cuoi && !quet ? Math.PI / 2 : 0;
    if (quet) { if (t < 4) for (let j = 0; j < 2; j++) trangTinh(tam.clone().add(new V3(0, -.3, 0)), xoay(hh, j * 180), 3, XANH, .3, 0); }
    else trangTinh(tam.clone().addScaledVector(hh, cuoi ? 1.2 : .9), hh, cuoi ? 2.6 : 2.3, XANH, .3, ngh);
    if (t >= 2) laSen(tam.clone().addScaledVector(hh, 1.6), 6, mauSen, 1, 1.4);
    rung(cuoi ? .2 : .1);
    if (!cuoi) return;
    const tamSen = quet ? datTai(nv.pos) : datTai(nv.pos.clone().addScaledVector(hh, 2.3));
    senNo(tamSen.clone().add(new V3(0, .03, 0)), quet ? 3.1 : 2.4, Math.min(lopSen, 3), mauSen, 1.1, 6, quet ? .6 : 1);
    if (!quet) { dia.chay(tamSen, 1.6, { mau: XANH, manh: .3 }); }
    if (t >= 3) vongDat(tamSen, R * 1.25, XANH, .45, .12);
    if (t >= 4) { senDat(tamSen, t >= 5 ? 5.2 : 4.4, { lop: t >= 5 ? 3 : 2, song: 3.4, gio: 1.2, mau: thanhTam ? NGOC_TRANG : XANH }); dia.song(tamSen, { r: 6, toc: 12, cao: .14 }); }
    if (bach) {
      bach.bung(14); vfx.vaCham({ kieu: 'chop', mau: XANH, song: .06 });
      // cánh sen bung ra cắt cỏ thành tia + sóng đất
      for (let j = 0; j < 16; j++) { const r = huongYaw(j * 22.5 + RR(-6, 6)); dia.cat(tamSen.clone().addScaledVector(r, 1.5), tamSen.clone().addScaledVector(r, 9), .35); }
      dia.song(tamSen, { r: 9, toc: 14, cao: .22 }); rung(.3, .4);
    }
    if (dem > 0) hoiMau(nv, hoi * Math.min(3, dem), mauSen);
  }
  DK.sau(.16, () => { vetKiem(ctx, .13); }); DK.sau(.17, () => chem(0));
  DK.sau(.4, () => { vetKiem(ctx, .13); }); DK.sau(.44, () => chem(1));
  if (tron) { DK.sau(.56, () => vetKiem(ctx, .24, .4)); DK.sau(.76, () => chem(2)); }
  else { DK.sau(.64, () => vetKiem(ctx, .12)); DK.sau(.7, () => chem(2)); }
  if (toanVu) {   // nhát 4: xoay người hai vòng bay lên (clip có xoay thật), lốc cánh sen cuốn quanh thân
    DK.sau(.8, () => { const l = locCanh(nv, 36, mauSen, { song: .9, r0: 1.2, r1: 2.6, cao: 1, len: 2.2, chieu: -1 }); DK.sau(.3, () => l.bung(9)); vetKiem(ctx, .26, .4); });
    DK.sau(1.04, () => {
      const tam = nguc(nv);
      vungCb(c, tam, 4.5, { manh: 30, pha: 8, len: .8, lui: 2.5 });
      vongDat(nv.pos, 4.8, XANH, .4, .14); dia.gio(nv.pos, 6, 1.1);
      for (let j = 0; j < 12; j++) { const r = huongYaw(j * 30); dia.cat(datTai(nv.pos).addScaledVector(r, 1), datTai(nv.pos).addScaledVector(r, 4.5), .3); }
      rung(.2);
    });
  }
}

// ================================================================ C · Bích Mộc Triền Căn
//   lật kiếm ngược, bật xoay, quỳ một gối cắm kiếm xuống đất — rễ ngọc cày đất lao đi (gồ đất, vụn, cỏ đứt)
//   T3 ba rễ · T4 Kinh Cức: gai ngọc nổ + rãnh rễ + nứt sen tại chỗ cắm · T5 Vạn Mộc Triều Nguyên: năm rễ, gai nở thành bụi cây sáng
function trienCan(ctx) {
  const c = taoPhien(ctx), nv = c.nv, t = c.t, n = c.n;
  const h = huongNgang(nv, c.dich);
  c.hd = ctx.phat('tln_c'); yaw(c, nv.pos.clone().addScaledVector(h, 4));
  tuyetKy(c, 'Kinh Cức', 'Vạn Mộc Triều Nguyên');
  DK.sau(.1, () => { dia.gio(nv.pos, 2.2, .5); laSen(nguc(nv), 5, NGOC, .5, 1.5); });
  let a = null;
  DK.sau(.38, () => {
    // kiếm cắm đất: nứt cánh sen + vụn + rung
    const cam = datTai(nv.pos.clone().addScaledVector(nv.phai(), .45).addScaledVector(h, .55));
    a = datTai(nv.pos).addScaledVector(h, .9);
    quangNo(cam.clone().add(new V3(0, .2, 0)), 1, XANH, .25);
    dia.vun(cam, { so: 12, luc: 3, len: 4, co: .15, r: .3 });
    nutSen(cam, t >= 4 ? 2.4 : 1.4, { canh: 6, lop: t >= 4 ? 2 : 1, song: 2.4 }); dia.chay(cam, t >= 4 ? 2.2 : 1.2, { mau: XANH, manh: .45 });
    dia.ho(cam, .6, .12, { mau: XANH, chay: .4 });
    rung(t >= 4 ? .24 : .16);
    if (t >= 5) vfx.vaCham({ kieu: 'chop', mau: XANH, song: .06 });
  });
  const cb = (o, kq) => {
    if (!kq) return;
    if (n === N_THON_LINH) { hutMau(c, 70, .25, NGOC); vfx.hat(nguc(o), { so: 10, mau: NGOC, toc: 1.5, huong: LEN, loe: .5, co: .09, song: .9, trongLuc: -2 }); }
    if (t >= 4) gaiNgoc(c, { tam: datTai(o.pos), R: 1.6, tNo: .25, cao: t >= 5 ? 2.3 : 1.7, so: t >= 5 ? 9 : 7, op: { manh: 21, pha: 6, len: 1.5 }, mau: NGOC, bui: t >= 5, giu: t >= 5 ? 1.2 : .45 });
    if (t >= 4) { nutSen(datTai(o.pos), 1.8, { canh: 6, song: 2.4 }); dia.chay(o.pos, 1.6, { mau: XANH, manh: .4 }); }
    if (t >= 5) { dia.gai(datTai(o.pos), { so: 6, r: 2.2, cao: 1.3, mau: 0x3f7a5a }); dia.pha(o.pos, 2); }
  };
  if (n === N_PHUOC_DIA) {   // vòng rễ 5 m mọc vào tâm (sát thương 70 × hệ số tầng × 0,8 — chỉ MỘT lần)
    const tam = diemVung(c, 14), Rv = 5;
    baoVong(tam, Rv, .42, XANH);
    DK.sau(.42, () => {
      const ds = [], soRe = t >= 4 ? 12 : 10;
      for (let k = 0; k < soRe; k++) {
        const r = huongYaw(k * 360 / soRe + RR(-8, 8));
        reCay(c, { a: tam.clone().addScaledVector(r, Rv), b: tam.clone().addScaledVector(r, .4), tLon: .32, giu: 1.6, rn: 1.1, day: .26, la: t >= 2, op: { manh: 70, pha: 10 }, khiTrung: cb, ds, ranh: t >= 4 });
      }
      DK.sau(.32, () => { senDat(tam, 2.4, { song: 2.6, hoa: 1.4, lopHoa: t >= 4 ? 2 : 1 }); if (t >= 4) dia.song(tam, { r: 6, toc: 10, cao: .15 }); });
      vongDat(tam, Rv * 1.2, XANH, .5, .14);
    });
    return;
  }
  const L = 13;
  const a0 = datTai(nv.pos).addScaledVector(h, .9);
  baoDai(a0, a0.clone().addScaledVector(h, L), 2.2, .42, XANH);
  if (t >= 3) for (const g of t >= 5 ? [18, -18, 36, -36] : [18, -18]) baoDai(a0, a0.clone().addScaledVector(xoay(h, g), L * .85), 1.6, .42, XANH);
  DK.sau(.42, () => {
    const giu = n === N_THON_LINH ? .9 : 1.3 + t * .15, aa = a || a0;
    reCay(c, { a: aa, b: aa.clone().addScaledVector(h, L), tLon: .45, giu, rn: 1, day: t >= 2 ? .4 : .32, la: t >= 2, op: { manh: 70, pha: 12 }, khiTrung: cb, ranh: t >= 4 });
    if (t < 3) return;
    for (const g of t >= 5 ? [18, -18, 36, -36] : [18, -18]) reCay(c, { a: aa, b: aa.clone().addScaledVector(xoay(h, g), L * .85), tLon: .42, giu, rn: .9, day: .3, la: true, op: { manh: 70 * .4, pha: 6 }, khiTrung: cb, ranh: t >= 4 });
  });
}

// ================================================================ V · Thanh Liên Phá Không
//   thu thấp → lao thân như mũi kiếm → trượt dừng vẩy kiếm; đường lướt hoá thành KIẾM QUANG (một thanh kiếm hồn dài bằng đường lướt), cỏ đứt
//   T3 ba đoá sen · T4 rãnh kiếm xẻ đất + dải đất nhuộm xanh + sen nổ lớn · T5 Nhất Bộ Nhất Liên: năm đoá nổ liền, sóng đất
//   Tam Thiểm: ba chớp chữ Z, mỗi chớp một clip riêng · Khai Liên: 16 m, sen lớn cuối đường hất tung
function kiemQuang(a, b, rong, song = .5) {
  const d = new V3().subVectors(b, a), L = d.length(); if (L < .3) return;
  const f = d.clone().normalize(), dai = 1.9 * (rong / .38), n = Math.max(2, Math.round(L / (dai * .85)));
  for (let i = 0; i < n; i++) {
    const k = vfx.kiemThat({ dai, rong: dai * .15, mau: sang(XANH, .5), kieu: 'hon', sang: .2, quang: false });
    const g = new T.Group(); g.add(k); g.position.copy(a).addScaledVector(f, (i + .5) / n * L - dai * .5); g.quaternion.setFromUnitVectors(new V3(0, 0, 1), f);
    // bản lưỡi nằm ngang: máy quay sau-trên (góc chơi chính) thấy rõ dáng kiếm
    const ms = []; k.traverse(m => { if (m.material) { m.material.transparent = true; ms.push([m.material, m.material.opacity]); } });
    const tre = (1 - i / n) * song * .45;
    vfx.them(g, song, (dt, u, t) => { const v = cl01((t - tre) / Math.max(.05, song - tre)); g.scale.set(1 - v * .5, 1 - v * .5, 1 + v * .1); for (const [m, o] of ms) m.opacity = o * (1 - v) * (1 - v); });
  }
}
function phaKhong(ctx) {
  const c = taoPhien(ctx), nv = c.nv, t = c.t, n = c.n;
  const h = huongNgang(nv, c.dich), chan = datTai(nv.pos);
  const rSen = t >= 4 ? 2.3 : 1.8;
  const cbSen = (o, kq) => { if (!kq) return; const tamO = datTai(o.pos); DK.sau(.4, () => { vungCb(c, tamO.clone().add(new V3(0, .7, 0)), rSen, { manh: 30, pha: 6 }); senDat(tamO, rSen, { song: 2.4, hoa: rSen * .8, lopHoa: t >= 4 ? 2 : 1, manh: .4 }); quangNo(tamO.clone().add(new V3(0, .5, 0)), rSen * .7, NGOC, .25); }); };
  tuyetKy(c, 'Thanh Liên Phá Không', 'Nhất Bộ Nhất Liên');
  const anh = (k) => { for (let i = 0; i < k; i++) DK.sau(i * .05, () => vfx.anhSot(nv, { mau: XANH, op: .28, song: .3 })); };
  if (n === N_TAM_THIEM) {   // mỗi chớp 85 × 0,45 × hệ số (tầng × nhánh 0,75 — MỘT lần)
    const d = [xoay(h, 32), xoay(h, -32), h];
    const diemDau = chan.clone().addScaledVector(d[0], 5), diemHai = diemDau.clone().addScaledVector(d[1], 5);
    baoDai(chan, diemDau, 2.2, .18, XANH); baoDai(diemDau, diemHai, 2.2, .36, XANH); baoDai(diemHai, diemHai.clone().addScaledVector(d[2], 5), 2.2, .58, XANH);
    const clips = ['tln_v_a', 'tln_v_b', 'tln_v_c'];
    for (let k = 0; k < 3; k++) {
      let p0 = null, c0 = null;
      DK.sau(.12 + k * .22, () => {
        const hd = conSong(c.dich) && k === 2 ? huongNgang(nv, c.dich) : d[k];
        c.hd = ctx.phat(clips[k]); if (k === 0) yaw(c, nv.pos.clone().addScaledVector(hd, 5)); datYaw(c, nv.pos.clone().addScaledVector(hd, 5));
        p0 = nguc(nv); c0 = datTai(nv.pos); anh(3);
        diToi(nv, nv.pos.clone().addScaledVector(hd, 5), .15, 'o');
      });
      DK.sau(.12 + k * .22 + .16, () => {
        const p1 = nguc(nv);
        doanCb(c, p0, p1, 1.2, { manh: 85 * .45, pha: 12 }, [], cbSen);
        kiemQuang(p0, p1, .3, .45); dia.cat(c0, datTai(nv.pos), .6);
        if (t >= 4) dia.ranh(c0, datTai(nv.pos), .35, .14, { mau: XANH });
        quangNo(p1, .7, XANH, .2); rung(.12);
        if (k === 2 && t >= 4) { senDat(nv.pos, 2.4, { song: 2.6, hoa: 1.6, gio: .8 }); }
      });
    }
    return;
  }
  const khaiLien = n === N_KHAI_LIEN, L = khaiLien ? 16 : 11;
  baoDai(chan, chan.clone().addScaledVector(h, L), khaiLien ? 3 : 2.4, .2, XANH);
  c.hd = ctx.phat('tln_v'); yaw(c, chan.clone().addScaledVector(h, L));
  let dau = null, chan0 = null;
  DK.sau(.06, () => { quangNo(nv.mui(), .5, XANH, .2); dia.gio(nv.pos, 2, .5); dia.vun(nv.pos, { so: 6, luc: 1.5, len: 2, co: .1 }); });
  DK.sau(.22, () => {
    dau = nguc(nv); chan0 = datTai(nv.pos); anh(5);
    diToi(nv, nv.pos.clone().addScaledVector(h, L), khaiLien ? .3 : .24, 'o', u => { if (t >= 2 && Math.random() < .5) laSen(nguc(nv), 1, NGOC, .3, 1); });
  });
  DK.sau(khaiLien ? .54 : .47, () => {
    const cuoi = nguc(nv), chan1 = datTai(nv.pos);
    doanCb(c, dau, cuoi, 1.3, { manh: 85, pha: 20, len: 0, lui: 2 }, c.daTrung, cbSen);
    kiemQuang(dau, cuoi, t >= 2 ? .5 : .38, .55);
    dia.cat(chan0, chan1, .8); dia.gio(chan1, 2.5, .7);
    quangNo(cuoi, 1, XANH, .25); rung(.2);
    if (t >= 4) {   // rãnh kiếm khí + dải đất nhuộm xanh dọc đường lướt
      dia.ranh(chan0.clone().addScaledVector(h, .8), chan1, .5, .24, { mau: XANH });
      const so = Math.round(L / 2); for (let k = 0; k <= so; k++) dia.chay(new V3().lerpVectors(chan0, chan1, k / so), 1.3, { mau: XANH, manh: .35 });
    }
    if (t >= 3) {   // Liên Hoa Lộ: sen nở dọc đường (T5 năm đoá nổ liền)
      const so = t >= 5 ? 5 : 3;
      for (let k = 0; k < so; k++) {
        const tamS = datTai(new V3().lerpVectors(chan0, chan1, (k + .5) / so)), tre = .25 + k * (t >= 5 ? .08 : .1);
        DK.sau(tre, () => {
          vungCb(c, tamS.clone().add(new V3(0, .7, 0)), t >= 4 ? 2.8 : 2.2, { manh: 26, pha: 6 });
          senDat(tamS, t >= 4 ? 2.6 : 1.8, { song: 2.8, hoa: t >= 4 ? 2 : 1.5, lopHoa: t >= 4 ? 2 : 1, manh: t >= 4 ? .5 : .3 });
          quangNo(tamS.clone().add(new V3(0, .6, 0)), 1.2, NGOC, .25);
          if (t >= 5) { dia.song(tamS, { r: 4, toc: 12, cao: .14 }); dia.vun(tamS, { so: 10, luc: 3, len: 4, co: .14 }); rung(.12); }
        });
      }
      if (t >= 5) DK.sau(.25 + 4 * .08, () => { vfx.vaCham({ kieu: 'chop', mau: XANH, song: .06 }); rung(.3); });
    }
    if (khaiLien) DK.sau(.1, () => {
      vungCb(c, chan1.clone().add(new V3(0, .7, 0)), 3.2, { manh: 50, pha: 15, len: 3, lui: 2 });
      senDat(chan1, 3.2, { song: 3, hoa: 2.6, lopHoa: 2, gio: 1.2, lop: t >= 4 ? 2 : 1 }); dia.song(chan1, { r: 6, toc: 12, cao: .18 }); rung(.26);
    });
  });
}

// ================================================================ R · Thanh Liên Kiếm Trận (tuyệt kỹ)
//   kiếm dựng trước mặt bắt quyết → bật xoay giơ kiếm chỉ trời → giáng xuống chỉ trận
//   sen nở dưới đất (đất nhuộm, nứt cánh sen) → rễ/gai trói → cánh sen hoá KIẾM THẬT đâm vào tâm → sen khép nổ ngọc quang
//   T3 hai lớp 12 kiếm · T4 Thiên Diệp Quy Nguyên: kiếm bay lên trời rồi giáng thành mưa kiếm, CẮM ĐẤT thành kiếm trận, sóng đất, cây rung
//   T5 Nhất Hoa Nhất Thế Giới: bốn lớp phủ đất, hai đợt kiếm, nổ lớn đổ cây/đèn đá · Hộ Thể: sen dưới chân mình · Sát Trận: thêm 6 kiếm, bỏ hồi máu
function kiemTran(ctx) {
  const c = taoPhien(ctx), nv = c.nv, t = c.t, n = c.n;
  const hoThe = n === N_HO_THE, satTran = n === N_SAT_TRAN;
  const tam = hoThe ? datTai(nv.pos) : diemVung(c, 16);
  const lop = t >= 5 ? 4 : t >= 4 ? 3 : t >= 3 ? 2 : 1;
  const R = 5 * (t >= 5 ? 1.9 : t >= 4 ? 1.7 : t >= 3 ? 1.5 : t >= 2 ? 1.1 : 1) * (hoThe ? .8 : 1);
  baoVong(tam, R, .5, XANH);
  c.hd = ctx.phat('tln_r'); yaw(c, hoThe ? nv.pos.clone().addScaledVector(nv.toi(), 5) : tam);
  DK.sau(.15, () => { const m = nv.mui(); quangNo(m, .8, XANH, .35); vfx.hat(m, { so: 14, mau: XANH, toc: -3.5, co: .07, song: .25, trongLuc: 0, lech: 1 }); });
  if (t >= 4) DK.sau(.3, () => tuyetKy(c, 'Thanh Liên Kiếm Trận · Thiên Diệp Quy Nguyên', 'Nhất Hoa Nhất Thế Giới'));
  DK.sau(.66, () => { dia.gio(nv.pos, 2.5, .6); laSen(nguc(nv), 8, NGOC, .6, 2); });
  DK.sau(.98, () => { dia.vun(nv.pos.clone().addScaledVector(nv.toi(), .6), { so: 8, luc: 2, len: 3, co: .12 }); rung(.12); });
  DK.sau(.12, () => tranSen(c, tam, R, lop, t, satTran, hoThe));
}
function tranSen(c, tam, R, lop, tang, satTran, hoThe) {
  const canh = 6, daBay = []; for (let l = 0; l < lop; l++) daBay.push(new Array(canh).fill(false));
  const vm = tang >= 4, tBay = .78, tKhep = vm ? 1.85 : 1.3, tNo = tKhep + .2, tHet = tNo + .5;
  let xo = RR(0, 60), t = 0, tHoi = 0, daTroi = false, daBay1 = false, daBay2 = false, daNo = false;
  const boCanh = (l, i) => daBay[l][i] && !daNo;
  const sen = taoSen(lop, canh, NGOC);
  const nv = c.nv;
  // sen nở trên đất ngay từ đầu: nhuộm + nứt sáng hình cánh sen
  dia.chay(tam, R * (vm ? 1 : .7), { mau: XANH, manh: vm ? .55 : .35 });
  nutSen(tam, R * (vm ? 1.05 : .8), { canh: 6, lop: Math.min(lop, 3), song: tHet + 1.2, toc: .5, rong: .05 + R * .006 });
  vongDat(tam, R * 1.2, XANH, .6, .14);
  const camDs = [];
  function phong1(mut, yawDo, stt, manh, dich) {
    const ra = huongYaw(yawDo), d = dich.length ? dich[stt % dich.length] : null;
    const co = vm ? 1.5 : 1.25 + (tang >= 3 ? .1 : 0);
    const pk = { dich: d, duoi: !!d, quay: 9, pos: mut.clone().add(new V3(0, .3, 0)), toc: 30, tam: R * 3 + 14, r: .55, co, mau: XANH, op: { manh, pha: 6 }, cho: .1 + stt * .025 };
    if (vm) { pk.diemCho = tam.clone().addScaledVector(ra, R * (.35 + .25 * (stt % 3) / 2)).add(new V3(0, 8 + (stt % 3) * 1.2, 0)); pk.cho = .42 + stt * .018; pk.toc = 34; }
    else pk.diemCho = mut.clone().add(new V3(0, 1.6, 0)).addScaledVector(ra, .4);
    // đích đất: kiếm cắm thành vòng kiếm trận
    const datCam = tam.clone().addScaledVector(ra, R * (vm ? .3 + .45 * ((stt * 7) % 5) / 4 : .15 * (stt % 3)));
    if (!d) { pk.diemDich = datCam.clone(); pk.tam = 40; }
    else if (vm) {
      // Viên Mãn: mưa kiếm xuyên qua địch rồi CẮM ĐẤT quanh chân nó (kiếm trận), không dừng giữa không
      const lech = huongYaw(yawDo * 2.3).multiplyScalar(stt % 2 ? RR(.2, .5) : RR(.9, 1.8));
      pk.diemDich = datTai(d.pos).add(lech); pk.dich = null; pk.duoi = false; pk.xuyen = true; pk.tam = 40;
    }
    pk.vel = new V3().subVectors(pk.dich ? nguc(pk.dich) : pk.diemDich, pk.pos).normalize().multiplyScalar(pk.toc);
    pk.camDat = true; pk.quaDat = false;
    pk.khiHet = (q, v) => {
      if (q.y - dia.cao(q.x, q.z) > .5) return;   // trúng người giữa không: không cắm
      const huong = v.clone().normalize(); if (huong.y > -.3) huong.y = -.6; huong.normalize();
      if (vm || camDs.length < 8) camDs.push(camDat(q, huong, co * .95, (tNo - t) + 1.6 + RR(0, .3)));
      else { quangNo(q, .6, XANH, .15); dia.vun(q, { so: 4, luc: 2, len: 3, co: .1 }); }
      if (vm) dia.nut(q, { r: .9, nhanh: 3, mau: XANH, song: 1.6, rong: .04 });
    };
    bay(c, pk);
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
    rung(.18);
  }
  vfx.them(sen, 30, dt => {
    t += dt; xo += dt * 14;
    const uNo = E.o(cl01(t / tBay));
    const mo = t < tKhep ? 5 + 67 * uNo : 72 + (0 - 72) * cl01((t - tKhep) / (tNo - tKhep));
    const co = t < tKhep ? .35 + .65 * uNo : 1 + (.55 - 1) * cl01((t - tKhep) / (tNo - tKhep));
    const k = t > tNo ? cl01(1 - (t - tNo) / (tHet - tNo)) : cl01(t / .12);
    if (k <= 0) return false;
    sen.ve(tam, R * .62 * co, mo, xo, k * (daNo ? .5 : 1), boCanh);
    if (!daNo && Math.random() < (tang >= 2 ? .5 : .3)) { const r = huongYaw(RR(0, 360)).multiplyScalar(R * RR(.85, 1)); laSen(tam.clone().add(r).add(new V3(0, 2.5, 0)), 1, NGOC, .3, .6); }
    if (!daTroi && t >= .38) {   // rễ / gai ngọc trói
      daTroi = true;
      vungCb(c, tam.clone().add(new V3(0, .6, 0)), R, { manh: 10, pha: 4 });
      const so = 6 + lop * 2;
      for (let i = 0; i < so; i++) { const r = huongYaw(i * 360 / so + xo); gaiNgoc(c, { tam: tam.clone().addScaledVector(r, R * RR(.55, .95)), R: .8, tNo: .2, cao: 1.1, so: 5, mau: XANH, giu: .6 }); }
      if (vm) dia.song(tam, { r: R * 1.2, toc: 10, cao: .12 });
      rung(.16);
    }
    if (hoThe && t < tNo && Math.hypot(nv.pos.x - tam.x, nv.pos.z - tam.z) < R) { tHoi += dt; if (tHoi >= .3) { tHoi = 0; hoiMau(nv, .008, NGOC); } }
    if (!daBay1 && t >= tBay) { daBay1 = true; banCanh(1); }
    if (tang >= 5 && !daBay2 && t >= tBay + .5) { daBay2 = true; banCanh(.5); }
    if (!daNo && t >= tNo) {
      daNo = true;
      const p = tam.clone().add(new V3(0, .8, 0)), K = tang >= 3 ? 1.1 : 1;
      vungCb(c, p, R * .75, { manh: 40 * K, pha: 12, len: 2, lui: 1.5 });
      quangNo(p, tang >= 4 ? 2.4 : 1.8, NGOC, .35); quangNo(p, .8, TRANG, .12);
      vongDat(tam, R * 1.4, XANH, .55, .16);
      vfx.hat(p, { so: tang >= 4 ? 50 : 26, mau: NGOC, toc: 8, co: .12, song: .6, trongLuc: 6 });
      senNo(tam.clone().add(new V3(0, .03, 0)), R * .7, Math.min(lop, 2), NGOC, .9);
      if (vm) {
        dia.song(tam, { r: R * 1.8, toc: 14, cao: tang >= 5 ? .3 : .2 });
        dia.gio(tam, R * 2.2, tang >= 5 ? 2 : 1.3);
        dia.ho(tam, R * .3, tang >= 5 ? .4 : .25, { mau: XANH, chay: .5 });
        vfx.vaCham({ kieu: tang >= 5 ? 'dao' : 'chop', mau: XANH, song: tang >= 5 ? .08 : .06 });
        if (tang >= 5) dia.pha(tam, R * 1.1);
        rung(tang >= 5 ? .4 : .32, .45);
      } else rung(.22);
      if (!satTran) hoiMau(nv, Math.min((tang >= 4 ? .08 : .04) * (hoThe ? 3 : 1), .24), NGOC);
    }
    return true;
  });
}

// ================================================================ ĐĂNG KÝ
DK.dangKyBoNC('kiem_cp1', {
  yTuong: 'Kiếm múa như sen nở: xoay người, bật xoay, quỳ cắm kiếm, lao thân thành kiếm quang. Kiếm khí là KIẾM THẬT bọc hai cánh sen xanh ngọc. ' +
    'Viên Mãn/Hoá Cảnh: sen nở trên đất (đất nhuộm xanh + nứt sáng hình cánh sen), rãnh kiếm khí xẻ đất, cỏ đứt theo đường kiếm, rễ cày gồ đất, kiếm trận cắm đất, sóng đất, cây rung/gãy. ' +
    'Đòn thường riêng 6 nhát + lộn né 4 hướng. Sửa: Phược Địa/Tam Thiểm nhân hệ số nhánh một lần; Toàn Vũ xoay thật; chữ chiêu + trời ở tầng 4–5 mọi chiêu.',
  moTaChieu: {
    tl_kiem_khi: 'Rút ngang, quét vung — kiếm sen thật bay ngực. T2 lá sen + gai trói; T3 ba kiếm; T4 kiếm hạ sát đất: cỏ đứt, cứ ~3 m nở một đoá sen trên đất, cuối đường sen lớn; T5 năm kiếm + rãnh kiếm khí xẻ đất. Truy Hồn: kiếm lớn ba cánh lượn đuổi.',
    tl_tam_diep: 'Chéo · hất · giáng (T3+: nhát ba xoay người quét tròn). T4 sen ba lớp, đất nhuộm, nứt cánh sen, sóng đất, cỏ rạp; T5 trăm cánh sen xoay quanh thân rồi bung cắt cỏ thành tia. Toàn Vũ: nhát 4 xoay hai vòng bay lên, lốc cánh sen.',
    tl_trien_can: 'Lật kiếm ngược, bật xoay, quỳ một gối cắm kiếm — rễ ngọc cày đất (gồ, vụn, cỏ đứt). T4 gai ngọc + rãnh rễ + nứt sen; T5 năm rễ, gai nở thành bụi cây sáng, gai đá trồi, cây gần đó gãy.',
    tl_pha_khong: 'Thu thấp → lao thân như mũi kiếm → trượt dừng vẩy kiếm; đường lướt hoá một thanh kiếm quang dài, cỏ đứt. T3 ba đoá sen; T4 rãnh kiếm + dải đất xanh; T5 năm đoá nổ liền, sóng đất. Tam Thiểm: ba chớp ba dáng riêng.',
    tl_kiem_tran: 'Dựng kiếm bắt quyết → bật xoay chỉ trời → giáng chỉ trận. Sen nở trên đất, gai trói, cánh sen hoá kiếm thật đâm tâm. T4 kiếm bay lên trời giáng thành mưa kiếm CẮM ĐẤT thành kiếm trận, sóng đất; T5 hai đợt, nổ lớn đổ cây/đèn đá.',
  },
  tuThe: [],
  theThu: 'TLN_THU',
  soNhat: 6, danh, lon,
  chieu: { tl_kiem_khi: kiemKhi, tl_tam_diep: tamDiep, tl_trien_can: trienCan, tl_pha_khong: phaKhong, tl_kiem_tran: kiemTran },
});
})();
