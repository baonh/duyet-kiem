"use strict";
// ============================================================================
// bo_van_kiem_nc.js — 2026-11-15 — BẢN NÂNG CẤP (đề xuất) bộ VẠN KIẾM QUY TÔNG (mã 'kiem_cp2').
//   Người dùng chê nhất bộ này: "kiếm phóng ra không ra kiếm" (bản game vẽ kiếm rơi là que hộp sáng).
//   Bản này: MỌI thanh kiếm là phi kiếm thật (vfx.phiKiem — lưỡi, chắn tay, chuôi, vệt), có ĐỘI HÌNH
//   (quạt sau lưng, vòng xoay quanh thân, mưa kiếm từ trận đồ trên trời, cự kiếm có chuôi/chắn tay rõ, kiếm cắm đất).
//   Động tác ngự kiếm: kiếm chỉ tay trái, vung tay điều kiếm, bay lên giữa không. Combo 6 nhát riêng (mỗi nhát kèm phi kiếm) + lộn né.
//   Một màu chủ đạo: VÀNG KIM. Vệt chém cận chiến theo màu thanh kiếm (ctx.mau). Tối đa ~60 phi kiếm cùng lúc (TRAN_KIEM).
//   Số sát thương / tầm / mốc lấy từ bản game (bo_van_kiem.js ← VanKiem.cs); chỗ đổi ghi ở yTuong + báo cáo.
// ============================================================================
(function () {
const DK = window.DK, T = DK.T, V3 = DK.V3, vfx = DK.vfx, dia = DK.dia, D = DK.D;
if (!DK.dangKyBoNC || !dia || !vfx.phiKiem) return;
const MA = 'kiem_cp2';
const VANG = new T.Color(1, .8, .36), KIM = new T.Color(1, .93, .7), TRANG = new T.Color(1, 1, 1);
const MAU_BUI = new T.Color(.5, .48, .45), TUA = 0xb3801f, THEP = 0xe9e3d2;
const UP = new V3(0, 1, 0), DOWN = new V3(0, -1, 0), FWD = new V3(0, 0, 1);
const RR = (a, b) => a + Math.random() * (b - a);
const c01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
const E = (e, u) => DK.ease(e, c01(u));
const lerp = DK.lerp;

const N_LIEN_CHAU = 'kiem_anh_lien_chau', N_TOA_VU = 'phan_quang_toa_vu', N_PHONG_THIEN = 'hong_vu_phong_thien', N_NHAT_TUYEN = 'lac_hong_nhat_tuyen',
      N_XUYEN_THACH = 'toai_kim_xuyen_thach', N_HO_KIEM = 'kim_cuong_ho_kiem', N_THIEN_LA = 'thien_la_kiem_vong', N_TU_KIEM = 'tru_tien_tu_kiem',
      N_NHAT_KICH = 'quy_tong_nhat_kich', N_TE_PHAT = 'van_kiem_te_phat';

// ================================================================ TƯ THẾ (tiền tố VKN_)
const TU_THE = [
  // thủ: kiếm cầm thấp bên phải, tay trái kiếm chỉ trước ngực
  'VKN_THU', 'tor:18,-18 head:-12,18 aR:-22,0,-24 fR:-28 w:150 aL:-58,0,-14 fL:-78 lR:-32,0,-8 sR:44 lL:22,0,8 sL:32 ao:8',
  // lấy đà: thân xoắn, hạ trọng tâm, tay trái kéo kiếm chỉ về vai phải
  'VKN_TU', 'tor:30,-40 head:-20,36 aR:-6,0,-52 fR:-40 w:140 aL:-84,0,-40 fL:-96 lR:-56,0,-10 sR:86 lL:34,0,10 sL:64 ao:22',
  // kiếm chỉ: tay trái phóng thẳng tới trước, kiếm kéo ra sau, chân trước chùng
  'VKN_CHI', 'tor:10,-32 head:-10,30 aR:-34,0,-56 fR:-16 w:160 aL:-94,0,-2 fL:-4 lR:-54,0,-8 sR:64 lL:36,0,8 sL:22 ao:26',
  // chỉ trời: kiếm thẳng lên trời, ưỡn ngực, tay trái kiếm chỉ trước mặt
  'VKN_TROI', 'tor:-16,8 head:-36,-4 aR:-178,0,-8 fR:-4 w:90 aL:-74,0,-22 fL:-98 lR:-30,0,-12 sR:36 lL:24,0,12 sL:30 ao:-6 toc:-10',
  // điều kiếm: vung kiếm từ trời bổ xuống chỉ vào vùng, tay trái mở ra sau
  'VKN_HA', 'tor:30,-22 head:-24,20 aR:-78,0,-10 fR:-4 w:96 aL:-24,0,64 fL:-18 lR:-64,0,-10 sR:78 lL:40,0,10 sL:28 ao:34',
  // lao đâm: kiếm duỗi thẳng tới, tay trái hất ra sau, chân trước gập sâu
  'VKN_DAM', 'tor:32,-40 head:-26,38 aR:-94,0,-4 fR:0 w:90 aL:-34,0,74 fL:-8 lR:-80,0,-8 sR:86 lL:54,0,8 sL:14 ao:42',
  // hộ kiếm: kiếm dựng chếch trước vai phải, tay trái kiếm chỉ trước mặt
  'VKN_HO', 'tor:14,-22 head:-10,20 aR:-64,0,-22 fR:-70 w:150 aL:-86,0,-30 fL:-92 lR:-36,0,-12 sR:52 lL:28,0,12 sL:40 ao:10',
  // phong trận: dang hai tay rộng, ngồi tấn thấp
  'VKN_DANG', 'tor:20,0 head:-18,0 aR:-84,0,-78 fR:-6 w:96 aL:-84,0,78 fL:-6 lR:-22,0,-28 sR:66 cR:-22 lL:-22,0,28 sL:66 cL:-22 ao:22',
  // thu trận: hai tay kéo về trước ngực, kiếm dựng
  'VKN_NAM', 'tor:26,-12 head:-22,12 aR:-58,0,-14 fR:-104 w:150 aL:-62,0,-22 fL:-112 lR:-44,0,-14 sR:74 lL:32,0,14 sL:52 ao:26',
  // quy tông (trên không): hai tay giơ chữ V lên trời, chân co
  'VKN_QUY', 'tor:-12,0 head:-34,0 aR:-160,0,-34 fR:-6 w:90 aL:-160,0,34 fL:-6 lR:-44,0,-6 sR:76 cR:30 lL:-12,0,6 sL:44 cL:30 ao:-14 toc:-22 cham:0',
  // giáng (trên không): giơ kiếm quá đầu lấy đà
  'VKN_GIANG_W', 'tor:-18,-10 head:-18,8 aR:-200,0,-14 fR:-40 w:90 aL:-150,0,22 fL:-30 lR:-52,0,-6 sR:82 cR:30 lL:-12,0,6 sL:62 cL:30 ao:-10 toc:-14 cham:0',
  // giáng (trên không): bổ kiếm xuống chỉ vào vùng
  'VKN_GIANG', 'tor:40,-24 head:-30,22 aR:-80,0,-8 fR:0 w:92 aL:-22,0,52 fL:-28 lR:-72,0,-6 sR:92 cR:20 lL:10,0,6 sL:62 cL:30 ao:40 cham:0',
];

// ================================================================ CLIP
const CLIP_NC = [
  ['vkn_pq', '0 VKN_THU · .1 VKN_TU o · .3 VKN_TU h · .38 VKN_CHI s · .62 VKN_CHI h · .85 VKN_THU io', '0 0 0; .36 0 0; .46 0 .35 o', { huy: .6 }],
  ['vkn_pq5', '0 VKN_THU · .1 VKN_TU o · .28 VKN_TROI s · .78 VKN_TROI h · .88 VKN_CHI s · 1.3 VKN_CHI h · 1.5 VKN_THU io', '0 0 0; .86 0 0; .98 0 .4 o', { huy: 1.15 }],
  ['vkn_kv', '0 VKN_THU · .1 VKN_TU o · .22 VKN_TROI s · .55 VKN_TROI h · .66 VKN_HA s · .95 VKN_HA h · 1.15 VKN_THU io', '0 0 0; .64 0 0; .74 0 .4 o', { huy: .9 }],
  ['vkn_pg', '0 VKN_THU · .1 KP_TU_LUC o · .3 KP_TU_LUC h · .36 VKN_DAM s · .74 VKN_DAM h · .95 VKN_THU io', '0 0 0; .34 0 -.15; .46 0 1.3 o', { huy: .75 }],
  ['vkn_ho', '0 VKN_THU · .1 VKN_TU o · .24 VKN_HO s · .55 VKN_HO h · .75 VKN_THU io', null, { huy: .5 }],
  ['vkn_kt', '0 VKN_THU · .1 VKN_TU o · .2 VKN_CHI s · .42 VKN_CHI h · .54 VKN_DANG s · 1.08 VKN_DANG h · 1.24 VKN_NAM o · 1.5 VKN_NAM h · 1.75 VKN_THU io', null, { huy: 1.05 }],
  ['vkn_qt', '0 VKN_THU · .12 VKN_TU o · .3 VKN_QUY s · 1.0 VKN_QUY h · 1.12 VKN_GIANG_W o · 1.22 VKN_GIANG_W h · 1.32 VKN_GIANG s · 1.7 VKN_GIANG h · 1.95 VKN_THU io', null, { huy: 1.6 }],
  ['vkn_qt5', '0 VKN_THU · .12 VKN_TU o · .3 VKN_QUY s · 1.0 VKN_QUY h · 1.12 VKN_GIANG_W o · 1.22 VKN_GIANG_W h · 1.32 VKN_GIANG s · 1.42 VKN_GIANG h · 1.56 VKN_GIANG_G s · 1.66 VKN_GIANG_G h · 1.72 VKN_GIANG_W o · 1.78 VKN_GIANG_W h · 1.84 VKN_GIANG s · 2.15 VKN_GIANG h · 2.4 VKN_THU io', null, { huy: 2.05 }],
  // combo 6 nhát (dựa trên tư thế chém của game W*/S*)
  ['vkn_d1', '0 VKN_THU · .08 W1 o · .12 W1 h · .18 S1 s · .3 S1b · .5 VKN_THU io', '0 0 0; .12 0 .1; .22 0 .55 o', 'vet0 .12, trung .16, kiem .2, huy .3'],
  ['vkn_d2', '0 S1b · .08 W2 o · .12 W2 h · .18 S2 s · .3 S2b · .52 VKN_THU io', '0 0 0; .2 0 .5', 'vet0 .12, trung .16, kiem .18, huy .29'],
  ['vkn_d3', '0 VKN_THU · .1 XG_W o · .14 XG_W h · .22 XG s · .4 XG h · .47 S1 s · .57 S1b · .78 VKN_THU io', '0 0 0; .45 0 .8', 'vet0 .16, trung .3, kiem .12, huy .52', { xoay: [.13, .45, 360] }],
  ['vkn_d4', '0 VKN_THU · .1 W3 o · .17 W3 h · .22 S3 s · .32 S3b · .4 S3b h · .64 VKN_THU io', '0 0 0; .17 0 -.1; .26 0 1.1', 'vet0 .19, trung .22, kiem .21, huy .35'],
  ['vkn_d5', '0 VKN_THU · .1 HW o · .15 HW h · .21 HAT s · .34 HAT h · .62 VKN_THU io', '0 0 0; .21 0 .45', 'vet0 .15, trung .19, kiem .17, huy .34'],
  ['vkn_d6', '0 VKN_THU · .14 W4 o · .22 W4 h · .29 S4 s · .47 S4 h · .86 VKN_THU io', '0 0 0; .22 0 .15; .3 0 .7', 'vet0 .23, trung .28, kiem .06, huy .47'],
  ['vkn_lon', '0 VKN_THU · .05 LON_LUOT o · .3 LON_LUOT h · .46 VKN_THU io', '0 0 0; .36 0 -3.4 o', null, { lon: [.03, .33, -360], tam: 1, tron: .04, than: 2 }],
];
let daDungClip = false;
function dungClip() {   // dựng khi cần (tư thế đã nạp qua tuThe lúc đăng ký)
  if (daDungClip) return; daDungClip = true;
  if (!DK.TT.VKN_GIANG_G) DK.guong('VKN_GIANG', 'VKN_GIANG_G');
  for (const [ten, khoa, mv, moc, ex] of CLIP_NC) DK.clip(ten, khoa, mv, moc, ex);
}

// ================================================================ tiện ích (chép từ bản game để giữ số)
const nguc = o => new V3(o.pos.x, o.pos.y + 1.25, o.pos.z);
const chan = nv => new V3(nv.pos.x, nv.pos.y + .06, nv.pos.z);
const xoay = doY => new V3(Math.sin(doY * D), 0, Math.cos(doY * D));
const benPhai = f => new V3(-f.z, 0, f.x).normalize();
function huongNgang(nv, dich) {
  if (dich) { const d = new V3().subVectors(dich.pos, nv.pos); d.y = 0; if (d.lengthSq() > 1e-6) return d.normalize(); }
  return nv.toi();
}
function diemVung(ctx, tam, xa) {
  xa = xa != null ? xa : 8; const nv = ctx.nv, d = ctx.dich;
  if (d && d.pos.distanceTo(nv.pos) <= tam + 2) return new V3(d.pos.x, 0, d.pos.z);
  return nv.pos.clone().addScaledVector(nv.toi(), Math.min(xa, tam)).setY(0);
}
function kcDoan(p, a, b) {
  const ab = new V3().subVectors(b, a), L2 = ab.lengthSq();
  const u = L2 > 1e-8 ? c01(new V3().subVectors(p, a).dot(ab) / L2) : 0;
  return a.clone().addScaledVector(ab, u).distanceTo(p);
}
function quayToi(vel, muon, maxRad, toc) {
  const a = vel.clone().normalize(), b = muon.clone().normalize(); const g = a.angleTo(b);
  if (g <= maxRad || g < 1e-5) return vel.copy(b).multiplyScalar(toc);
  let truc = new V3().crossVectors(a, b); if (truc.lengthSq() < 1e-8) truc.set(0, 1, 0); truc.normalize();
  return vel.copy(a.applyAxisAngle(truc, maxRad)).multiplyScalar(toc);
}
function slerpHuong(a, b, u) {
  const g = a.angleTo(b); if (g < 1e-5) return b.clone();
  let truc = new V3().crossVectors(a, b); if (truc.lengthSq() < 1e-8) truc.set(1, 0, 0); truc.normalize();
  return a.clone().applyAxisAngle(truc, g * u);
}
const HeK = t => t >= 5 ? 1.26 : t >= 4 ? 1.2 : t >= 3 ? 1.14 : 1;
const datY = p => { p.y = dia.cao(p.x, p.z); return p; };

// ---------------------------------------------------------------- phiên chiêu + trúng (như bản game)
const TEN_TT = { giap_vo: 'Giáp vỡ', troi: 'Trói', cham: 'Chậm', choang: 'Choáng', dong_bang: 'Đóng băng', doc: 'Độc' };
function phien(ctx, clip, opPhat) {
  dungClip();
  const t = ctx.tang, ch = ctx.ch;
  const n = t >= 3 ? (ctx.nhanh || null) : null;       // nhánh chỉ hiệu lực từ Đại Thành (như game)
  const nh = n && ch.nhanh ? ch.nhanh.find(x => x.ma === n) : null;
  const tg = ch.tang && ch.tang[t - 1];
  let hs = (tg && tg.he_so) || 1; if (nh && nh.so_mod && nh.so_mod.he_so > 0) hs *= nh.so_mod.he_so;
  let tt = tg && tg.trang_thai && tg.trang_thai.ma ? tg.trang_thai.ma : '';
  if (nh && nh.so_mod && nh.so_mod.trang_thai) tt = nh.so_mod.trang_thai;
  const S = { ctx, nv: ctx.nv, t, n, hs, tt: TEN_TT[tt] || tt || '', daTT: new Set(), luc: (s, fn) => DK.sau(s, fn) };
  if (clip) ctx.phat(clip, opPhat);
  return S;
}
const phienNhe = nv => ({ nv, t: 1, n: null, hs: 1, tt: '', daTT: new Set() });
function trungMot(S, b, op) {
  const do_ = DK.cheDoBuNhin === 'do' && b.la === 'bu_nhin' && !op.khongTheChan;
  const tt = S.tt && !S.daTT.has(b) ? S.tt : undefined; if (tt) S.daTT.add(b);
  DK.trung(b, { st: op.manh * S.hs, nguon: S.nv, day: op.lui || 0, hat: op.len || 0, mau: VANG, trangThai: do_ ? undefined : tt, khongDo: !!op.khongTheChan });
  return do_ ? 'do' : 'trung';
}
const Op = (manh, pha, len, lui) => ({ manh, pha, len: len || 0, lui: lui || 0 });
function vungCb(S, tam, r, op, cb, ds) {
  let n = 0;
  for (const b of DK.trongTron(tam, r)) { if (ds && ds.has(b)) continue; if (ds) ds.add(b); const kq = trungMot(S, b, op); n++; if (cb) cb(b, kq, nguc(b)); }
  return n;
}
function doanCb(S, a, b, rn, op, ds, cb) {
  let n = 0;
  for (const o of DK.trongDuong(a, b, rn * 2)) { if (ds && ds.has(o)) continue; if (ds) ds.add(o); const kq = trungMot(S, o, op); n++; if (cb) cb(o, kq, nguc(o)); }
  return n;
}

// ---------------------------------------------------------------- hiệu ứng nhỏ (voxel / quầng)
function quangNo(p, r, mau, song) { vfx.chop(p.clone(), { co: r * 2.2, mau: mau || VANG, song: song != null ? song : .3 }); }
function tiaLua(p, n, mau, toc) { vfx.hat(p.clone(), { so: Math.min(80, n), mau: mau || KIM, toc: toc != null ? toc : 8, co: .1, song: .32, trongLuc: 10, can: 2, sang: 1.6 }); }
function bui(p, n, r, toc) { vfx.hat(new V3(p.x, (p.y || 0) + .1, p.z), { so: Math.min(50, n), mau: MAU_BUI, toc: toc != null ? toc : 4, huong: new V3(0, .35, 0), loe: 2.5, co: .24, song: .8, trongLuc: -.2, can: 2.2, to: true, lech: (r != null ? r : 1.5) * .3 }); }
function songXung(p, r, mau, song, phap) { vfx.vong(p.clone(), { bk0: r * .1, bk1: r, mau: mau || VANG, song: song != null ? song : .45, day: .3, phap: phap || UP, op: .8 }); }
const tiaKhiTrung = (so, toc) => (o, kq, p) => { if (kq === 'trung') tiaLua(p, so, KIM, toc); };
const rung = (k, s) => DK.rung(Math.min(k, .5), s);
const baoVong = (p, r, tg) => vfx.vung(new V3(p.x, 0, p.z), { r, song: tg + .08, mau: VANG });
const baoDai = (a, b, rong, tg) => vfx.dai(a, b, { rong, song: tg + .08, mau: VANG });

// ================================================================ PHI KIẾM THẬT (giới hạn ~60 thanh cùng lúc)
const TRAN_KIEM = 60;
let soKiem = 0;
const GIA = { o: new T.Object3D(), kiem: { datSang() { } }, muiL: 1.1, gia: true, dat() { }, huy() { } };   // quá trần: vẫn chạy logic, không vẽ
DK.nghe('datLai', () => { soKiem = 0; });
function taoKiem(op) {
  if (soKiem >= TRAN_KIEM) return GIA;
  for (const key in op) if (op[key] === undefined) delete op[key];   // tránh ghi đè mặc định (tua: undefined ⇒ tua đỏ)
  const k = vfx.phiKiem(Object.assign({ dai: 1.1, mau: VANG, sang: 1.3, tua: false, kim: THEP, song: 30 }, op));
  soKiem++;
  const x = k.x, xo = x.xong; let xong = false;
  x.xong = () => { if (!xong) { xong = true; soKiem = Math.max(0, soKiem - 1); } if (xo) xo(); };
  return k;
}
DK.vkSoKiem = () => soKiem;   // để chụp kiểm (dbg)

/**
 * bay(S, o) — một phi kiếm có vòng đời đủ: chờ (neo theo đội hình, xoay mũi) → phóng (đuổi / thẳng) → trúng / chạm đất → cắm đất (ngập, rung, lún dần) hoặc tan.
 *   o: { pos | neo(t)→V3, huong0, huongCho(t)→V3, cho, hien, dich, duoi, quay, diem, toc, tam, r, op, xuyen, camSau (trúng xong cắm xuống sau lưng địch),
 *        cam (chạm đất thì cắm), giu, ngap, co, dai, kieu, tua, vet, sang, khiPhong(p,v), khiTrung(b,kq,p), khiDat(p,h), thang (bay thẳng theo mũi) }
 */
function bay(S, o) {
  const d = Object.assign({ toc: 30, quay: 9, tam: 30, r: .45, co: 1, dai: 1.1, cho: 0, hien: .12, giu: .6, ngap: .28 }, o);
  const k = taoKiem({ dai: d.dai, co: d.co, tua: d.tua, vet: d.vet !== false, kieu: d.kieu, sang: d.sang });
  const L = k.muiL;
  const pos = (d.neo ? d.neo(0) : d.pos).clone();
  const huong = (d.huong0 || FWD).clone().normalize();
  const vel = new V3(), truoc = new V3(), mui = new V3(), muiT = new V3(), goc = new V3(), lech = new V3();
  const nham = () => d.dich ? nguc(d.dich).sub(pos) : d.diem ? d.diem.clone().sub(pos) : huong.clone();
  let t = 0, pha = 0, con = d.tam, tKet = 0, sauTrung = null;
  const thu = new Set();
  k.o.scale.setScalar(.01); k.dat(pos, huong);
  function ket(lydo) {
    if (lydo === 'dat') {
      if (d.khiDat) d.khiDat(mui.clone(), huong.clone());
      if (d.cam) {
        pha = 3; tKet = t;
        if (huong.y > -.75) { huong.y = Math.min(huong.y, 0); const ng = Math.hypot(huong.x, huong.z) || 1; huong.x *= .6 / ng; huong.z *= .6 / ng; huong.y = -.8; huong.normalize(); }   // cắm phải dựng chếch, không nằm bẹp
        goc.copy(mui).addScaledVector(huong, -(.65 - d.ngap) * L);
        lech.set(huong.z, 0, -huong.x); if (lech.lengthSq() < 1e-4) lech.set(1, 0, 0); lech.normalize();
        k.kiem.datSang(3.2);
        return;
      }
      tiaLua(mui, 6, KIM, 4);
    } else if (lydo === 'gay') tiaLua(mui, 16, KIM, 7);
    pha = 2; tKet = t;
  }
  DK.lap(dt => {
    t += dt;
    if (pha === 0) {                                   // ---- chờ trong đội hình
      if (d.neo) pos.copy(d.neo(t));
      const muon = d.huongCho ? d.huongCho(t) : nham();
      if (muon.lengthSq() > 1e-6) huong.copy(slerpHuong(huong, muon.normalize(), Math.min(1, dt * (d.xoayCho || 12))));
      k.o.scale.setScalar(Math.max(.01, E('o', t / d.hien)));
      k.dat(pos, huong);
      if (t >= d.cho) {
        pha = 1; k.o.scale.setScalar(1);
        const f = d.thang ? huong.clone() : nham();
        vel.copy(f.lengthSq() > 1e-6 ? f.normalize() : huong).multiplyScalar(d.toc);
        if (d.khiPhong) d.khiPhong(pos.clone(), vel.clone());
      }
      return;
    }
    if (pha === 1) {                                   // ---- bay
      if (sauTrung) quayToi(vel, sauTrung.clone().sub(pos), 22 * dt, d.toc);
      else if (d.duoi && d.dich) quayToi(vel, nguc(d.dich).sub(pos), d.quay * dt, d.toc);
      truoc.copy(pos); muiT.copy(pos).addScaledVector(huong, L * .65);
      pos.addScaledVector(vel, dt); con -= d.toc * dt; huong.copy(vel).normalize();
      mui.copy(pos).addScaledVector(huong, L * .65);
      if (d.op) for (const b of DK.dsBuNhin) {
        if (thu.has(b)) continue;
        const p1 = b.pos.clone().add(new V3(0, .3, 0)), p2 = b.pos.clone().add(new V3(0, 1.55, 0)), gi = p1.clone().add(p2).multiplyScalar(.5);
        if (Math.min(kcDoan(p1, muiT, mui), kcDoan(p2, muiT, mui), kcDoan(gi, muiT, mui)) > d.r + .35) continue;
        thu.add(b);
        const kq = trungMot(S, b, d.op);
        quangNo(nguc(b), .8, VANG, .16);
        if (d.khiTrung) d.khiTrung(b, kq, nguc(b));
        if (kq === 'do') { k.dat(pos, huong); ket('gay'); return; }
        if (d.camSau) { const hn = huong.clone().setY(0); if (hn.lengthSq() < 1e-4) hn.set(0, 0, 1); sauTrung = b.pos.clone().addScaledVector(hn.normalize(), 3); sauTrung.y = -.8; con = 10; }
        else if (!d.xuyen) { k.dat(pos, huong); ket('trung'); return; }
      }
      const nen = dia.cao(mui.x, mui.z);
      if (mui.y <= nen + .02) { mui.y = nen; k.dat(pos, huong); ket('dat'); return; }
      if (con <= 0) { ket('tam'); return; }
      k.dat(pos, huong); return;
    }
    if (pha === 2) {                                   // ---- tan
      const u = (t - tKet) / .14; if (u >= 1) { k.huy(); return false; }
      k.o.scale.setScalar(Math.max(.01, 1 - u)); pos.addScaledVector(vel, dt * .3); k.dat(pos, huong); return;
    }
    // ---- cắm đất: rung chuôi, lún nhẹ (vệt tự co lại), cuối thì chìm xuống
    const tl = t - tKet;
    const run = tl < .2 ? Math.sin(tl * 95) * .03 * (1 - tl / .2) * L : 0;
    const chim = tl * .22 + (tl > d.giu ? E('i', (tl - d.giu) / .35) * L * .7 : 0);
    pos.copy(goc).addScaledVector(huong, chim).addScaledVector(lech, run);
    k.dat(pos, huong); k.kiem.datSang(tl < .15 ? 3.2 - tl / .15 * 2 : 1.2 * (1 - c01((tl - d.giu) / .35)));
    if (tl > d.giu + .35) { k.huy(); return false; }
  });
  return { k, pos, huong };
}

/** kiếm rơi từ trên xuống `den` (mưa kiếm): tạo đúng lúc rơi để đỡ trần kiếm */
function roi(S, o) {
  DK.sau(o.cho || 0, () => {
    const den = o.theo ? new V3(o.theo.pos.x + RR(-o.lech, o.lech), 0, o.theo.pos.z + RR(-o.lech, o.lech)) : o.den.clone();
    datY(den);
    let tu;
    if (o.tu) tu = o.tu.clone();
    else { const ng = (o.nghieng != null ? o.nghieng : 8) * D; const h = new V3(RR(-1, 1) * Math.tan(ng), -1, RR(-1, 1) * Math.tan(ng)).normalize(); tu = den.clone().addScaledVector(h, -(o.cao || 10)); }
    const h = den.clone().sub(tu).normalize();
    bay(S, {
      pos: tu, huong0: h, diem: den, toc: o.toc || 24, cho: o.hien || .06, hien: o.hien || .06, tam: tu.distanceTo(den) + 3, co: o.co || 1.4, dai: o.dai || 1.1, kieu: o.kieu, tua: o.tua,
      vet: o.vet != null ? o.vet : S.t >= 2, sang: o.sang, cam: o.cam !== false, giu: o.giu || .5, ngap: o.ngap != null ? o.ngap : .3,
      khiDat: (p, hh) => {
        if (o.op) vungCb(S, p.clone().add(new V3(0, .6, 0)), o.r || 1.3, o.op, o.khiTrung);
        if (o.nho !== false) { if (Math.random() < .4) bui(p, 3, .5, 2.5); if (Math.random() < .5) tiaLua(p.clone().add(new V3(0, .15, 0)), 4, KIM, 4); }
        if (o.khiCham) o.khiCham(p, hh);
      },
    });
  });
}

/** cự kiếm (mô hình kiếm thật cỡ lớn — chuôi, chắn tay, tua rõ) */
function cuKiem(L, o = {}) {
  const g = vfx.kiemThat({ dai: L, kieu: 'rong', mau: o.mau || VANG, sang: o.sang || 1.6, tua: o.tua === false ? false : TUA, kim: THEP, chan: 0xd4a640 });
  const goc = new T.Group(); goc.add(g);
  const x = vfx.them(goc, o.song || 5, () => { if (g.capTua) g.capTua(); }, () => { if (g.huyTua) g.huyTua(); });
  return {
    g, goc, x, L,
    dat(chuoi, h) { goc.position.copy(chuoi); goc.quaternion.setFromUnitVectors(FWD, h.clone().normalize()); },
    co(s) { goc.scale.setScalar(Math.max(.01, s)); },
    huy() { x.t = x.song; },
  };
}

// ================================================================ TRẬN ĐỒ (vòng + sao bát giác + phù văn — quad cộng sáng, port Unity dễ)
const HOP = new T.BoxGeometry(1, 1, 1); HOP.giu = true;
function tranDo(pos, r, o = {}) {
  const c = (o.mau || VANG).clone().multiplyScalar(o.sang || 1.6);
  const mat = new T.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false });
  const g = new T.Group(); g.position.copy(pos);
  const p = new T.Group(); p.rotation.x = -Math.PI / 2; g.add(p);
  const a = new T.Group(), b = new T.Group(); p.add(a); p.add(b);
  const m = geo => { const x = new T.Mesh(geo, mat); x.renderOrder = 3; return x; };
  a.add(m(new T.RingGeometry(r * .95, r, 96)));
  a.add(m(new T.RingGeometry(r * .84, r * .865, 96)));
  for (let i = 0; i < 16; i++) { const g0 = i / 16 * Math.PI * 2, q = m(new T.PlaneGeometry(r * .05, r * .05)); q.position.set(Math.cos(g0) * r * .9, Math.sin(g0) * r * .9, 0); q.rotation.z = g0 + Math.PI / 4; a.add(q); }
  const P = i => { const g0 = i / 8 * Math.PI * 2; return [Math.cos(g0) * r * .84, Math.sin(g0) * r * .84]; };
  for (let i = 0; i < 8; i++) {   // sao bát giác: nối đỉnh i → i+3
    const [x0, y0] = P(i), [x1, y1] = P(i + 3), L = Math.hypot(x1 - x0, y1 - y0);
    const q = m(new T.PlaneGeometry(L, Math.max(.02, r * .014))); q.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0); q.rotation.z = Math.atan2(y1 - y0, x1 - x0); b.add(q);
  }
  b.add(m(new T.RingGeometry(r * .44, r * .46, 64)));
  b.add(m(new T.RingGeometry(r * .13, r * .17, 32)));
  for (let i = 0; i < 8; i++) { const g0 = (i + .5) / 8 * Math.PI * 2, q = m(new T.PlaneGeometry(r * .27, Math.max(.015, r * .01))); q.position.set(Math.cos(g0) * r * .305, Math.sin(g0) * r * .305, 0); q.rotation.z = g0; b.add(q); }
  const song = o.song || 1.5, xv = (o.xoay != null ? o.xoay : 30) * D, op = o.op || .85;
  const x = vfx.them(g, song, (dt, u, t) => {
    const vao = E('o', t / .25), ra = c01((song - t) / .35);
    mat.opacity = op * Math.min(vao, ra) * (o.nhay ? .75 + .25 * Math.sin(t * 30) : 1);
    g.scale.setScalar(.35 + .65 * vao);
    a.rotation.z += xv * dt; b.rotation.z -= xv * 1.7 * dt;
  });
  x.mat = mat;
  return x;
}
/** sợi sáng thẳng (đường nối sao / lưới kiếm) — cập nhật bằng .dat(a, b) */
function soi(mau, op, song, rong) {
  const mat = new T.MeshBasicMaterial({ color: (mau || VANG).clone().multiplyScalar(1.7), transparent: true, opacity: op || .8, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false });
  const m = new T.Mesh(HOP, mat); m.visible = false;
  const x = vfx.them(m, song || 1);
  const w = rong || .05;
  x.dat = (a, b, k) => { const L = a.distanceTo(b); if (L < 1e-3) { m.visible = false; return; } m.visible = true; m.position.lerpVectors(a, b, .5); m.scale.set(w, w, L); m.lookAt(b); mat.opacity = (op || .8) * (k != null ? k : 1); };
  return x;
}
/** nhân vật bay lên giữa không rồi hạ xuống (treo = tắt trọng lực) */
function bayLen(nv, t0, t1, cao, t2, t3) {
  DK.lap((dt, tl) => {
    if (tl < t0) return;
    nv.treo = true; nv.datDat = false;
    const y = tl < t1 ? cao * E('o', (tl - t0) / (t1 - t0)) : tl < t2 ? cao + Math.sin((tl - t1) * 6) * .06 : cao * (1 - E('i', (tl - t2) / (t3 - t2)));
    nv.pos.y = Math.max(0, y);
    if (tl >= t3) { nv.treo = false; nv.pos.y = 0; nv.vy = 0; nv.datDat = true; bui(nv.pos, 10, 1.2, 3); dia.gio(nv.pos, 3, .6); return false; }
  });
}

// ================================================================ Z · KIẾM ẢNH PHÂN QUANG
const THAT_TINH = [[-1.3, .1], [-.75, .35], [-.2, .3], [.3, .45], [.75, .75], [1.35, .65], [1.25, 1.15]];   // gáo Bắc Đẩu (như game)
function PhanQuang(ctx) {
  const t0 = ctx.tang, nvx = t0 >= 3 ? ctx.nhanh : null;
  const thatTinh = t0 >= 5 && !nvx;
  const S = phien(ctx, thatTinh ? 'vkn_pq5' : 'vkn_pq'), nv = ctx.nv, t = S.t, n = S.n;
  let so = t >= 5 ? 7 : t >= 4 ? 5 : t >= 3 ? 3 : 1;
  if (n === N_LIEN_CHAU) so += 2;
  const manh = 62 * HeK(t) / so;
  const f = huongNgang(nv, ctx.dich), ben = benPhai(f);
  let dsDich = [];
  if (n === N_TOA_VU) {
    dsDich = DK.trongTron(ctx.dich ? ctx.dich.pos : nv.pos.clone().addScaledVector(f, 8), 10);
    if (ctx.dich) { dsDich = dsDich.filter(b => b !== ctx.dich); dsDich.unshift(ctx.dich); }
  }
  nv.ngam(nv.pos.clone().addScaledVector(f, 4));
  const op = Op(manh, 10);
  const tia = t >= 4 ? tiaKhiTrung(12, 6) : null;
  // Viên Mãn: phi kiếm xuyên qua địch rồi cắm phập xuống đất sau lưng — đất nứt, đá văng
  const khiDat = t >= 4 ? (p, h) => { dia.ho(p, .7, .18, { mau: VANG, chay: .4 }); dia.nut(p, { r: 1.6, nhanh: 5, mau: VANG, song: 2.2 }); dia.vun(p, { so: 10, luc: 3, len: 4, r: .3, huong: h.clone().setY(0) }); bui(p, 6, .6, 3); dia.gio(p, 2.5, .6); } : null;
  S.luc(.06, () => quangNo(nv.diem('lung').addScaledVector(f, -.3), .7, VANG, .3));

  if (thatTinh) {
    // ---- Hoá Cảnh — Thất Tinh: bảy thanh vút lên xếp chòm Bắc Đẩu trên đầu, sao nối sao, rồi lần lượt lao xuống
    const tamSao = nv.pos.clone().addScaledVector(f, 1.5).add(new V3(0, 4.4, 0));
    const sao = THAT_TINH.map(([x, y]) => tamSao.clone().addScaledVector(ben, -x * 2.1).add(new V3(0, (y - .6) * 2.1, 0)));
    S.luc(.1, () => {
      const goc0 = nv.diem('lung');
      for (let k = 0; k < 7; k++) {
        const p0 = goc0.clone().addScaledVector(ben, (k - 3) * .12), p1 = sao[k], ctl = p0.clone().lerp(p1, .5).add(new V3(0, 2.5, 0)).addScaledVector(f, -1.5);
        const cuoi = k === 6;
        bay(S, {
          neo: tt => { const u = E('o', (tt - k * .03) / .4); return p0.clone().multiplyScalar((1 - u) * (1 - u)).addScaledVector(ctl, 2 * u * (1 - u)).addScaledVector(p1, u * u); },
          huongCho: tt => tt < .38 ? UP.clone().addScaledVector(f, .3) : (ctx.dich ? nguc(ctx.dich).sub(p1) : f.clone().add(new V3(0, -.6, 0))),
          xoayCho: 7, hien: .1, cho: .82 + k * .075, dich: ctx.dich, duoi: !!ctx.dich, quay: 10, toc: 34, tam: 40, r: .5, co: cuoi ? 1.7 : 1.25, tua: TUA,
          diem: ctx.dich ? null : nv.pos.clone().addScaledVector(f, 9), op, camSau: true, cam: true, giu: cuoi ? 1.4 : 1, ngap: .35,
          khiTrung: tia,
          khiPhong: p => quangNo(p, .5, KIM, .12),
          khiDat: cuoi ? (p, h) => {
            dia.no(p, { muc: 2, r: 1.8, mau: VANG }); quangNo(p.clone().add(new V3(0, .6, 0)), 2.4, VANG, .35); songXung(p.clone().add(new V3(0, .15, 0)), 5, VANG, .5);
            vfx.vaCham({ kieu: 'chop', mau: VANG, song: .07 }); vfx.vienMan(VANG, 1, .4); rung(.4, .35);
          } : khiDat,
        });
      }
    });
    // đường nối sao + sao lấp lánh
    S.luc(.52, () => {
      for (let k = 0; k < 6; k++) { const s = soi(KIM, .75, .62, .045); vfx.them(null, .62, (dt, u, tt) => s.dat(sao[k], sao[k].clone().lerp(sao[k + 1], E('o', tt / .12)), 1 - c01((u - .7) / .3))); }
      for (let k = 0; k < 7; k++) DK.sau(k * .03, () => quangNo(sao[k], .55, KIM, .3));
    });
    S.luc(.3, () => vfx.troi(VANG, 1.8, .22));
    return;
  }

  // ---- quạt kiếm sau lưng: kiếm trồi lên từ sau lưng, xoè mũi ra như hào quang, rồi chỉ tay trái là phóng
  const rong = so > 1 ? Math.min(150, 34 * (so - 1)) : 0;
  const R = .55 + .08 * so;
  S.luc(.1, () => {
    for (let k = 0; k < so; k++) {
      const u = so > 1 ? k / (so - 1) - .5 : 0;
      const g = u * rong * D;
      const ra = () => nv.phai().multiplyScalar(Math.sin(g)).add(new V3(0, Math.cos(g), 0));   // hướng xoè (mặt phẳng lưng)
      const neo = tt => { const s = E('o', (tt - k * .03) / .22); return nv.pos.clone().addScaledVector(nv.toi(), -.5).add(new V3(0, 1.45, 0)).addScaledVector(ra(), .25 + R * s); };
      const dch = dsDich.length > 0 ? dsDich[k % dsDich.length] : ctx.dich;
      const tre = n === N_LIEN_CHAU ? k * .1 : k * .055;
      bay(S, {
        neo, huongCho: () => ra().addScaledVector(nv.toi(), .35),
        hien: .14, cho: .28 + tre, dich: dch || null, duoi: !!dch, quay: 9, toc: 30, tam: 34, r: .5, co: t >= 3 ? 1.2 : 1.1, tua: TUA,
        diem: dch ? null : nv.pos.clone().addScaledVector(f, 24).add(new V3(0, 1.2, 0)),
        vet: t >= 2, op, khiTrung: tia, camSau: t >= 4, cam: t >= 4, giu: .9, ngap: .35, khiDat,
        khiPhong: p => { quangNo(p, .45, KIM, .12); if (k === 0) rung(.12); },
      });
    }
  });
}

// ================================================================ X · KIẾM VŨ LẠC HỒNG
function KiemVu(ctx) {
  const S = phien(ctx, 'vkn_kv'), nv = ctx.nv, t = S.t, n = S.n;
  const K = t >= 5 ? 1.3 : t >= 4 ? 1.2 : t >= 3 ? 1.1 : 1;
  const N = t >= 5 ? 40 : t >= 4 ? 30 : t >= 3 ? 20 : 10;
  const manh = 13 * K * 10 / N;
  const h = huongNgang(nv, ctx.dich), ben = benPhai(h);
  const H = 10, T0 = .45;
  // triệu kiếm: ba thanh vút từ mũi kiếm lên trời
  S.luc(.22, () => {
    quangNo(nv.mui(), .7, VANG, .25);
    for (let i = 0; i < 3; i++) bay(S, { pos: nv.mui().add(new V3(RR(-.2, .2), 0, RR(-.2, .2))), huong0: UP.clone().addScaledVector(h, .25).addScaledVector(ben, (i - 1) * .2), thang: true, toc: 44, tam: 11, cho: i * .04, hien: .04, vet: true });
  });
  if (t >= 4) { bayLen(nv, .18, .4, 1.3, .95, 1.2); S.luc(.3, () => vfx.troi(VANG, 2.2, .28)); }

  if (n === N_NHAT_TUYEN) {
    // ---- Lạc Hồng Nhất Tuyến: dải trận trên trời, mưa kiếm rơi thành một đường từ gần ra xa
    const a = chan(nv).addScaledVector(h, 1.5).setY(0), b = a.clone().addScaledVector(h, 16);
    baoDai(a, b, 3, .45);
    nv.ngam(b);
    S.luc(.3, () => { for (let i = 0; i < 4; i++) tranDo(new V3().lerpVectors(a, b, (i + .5) / 4).add(new V3(0, H, 0)), 2.2, { song: 1.5, xoay: 50 }); });
    let xaNhat = 0;
    for (let k = 0; k < N; k++) {
      const u = (k + .5) / N;
      const den = new V3().lerpVectors(a, b, u).addScaledVector(ben, RR(-1.1, 1.1)).setY(0);
      roi(S, { den, cao: H, toc: 26, cho: T0 + .05 + u * .6, r: 1.3, giu: .5, op: Op(manh, 3),
        khiCham: t >= 4 ? p => { const d = new V3().subVectors(p, a).dot(h); if (d > xaNhat) { const p0 = a.clone().addScaledVector(h, xaNhat), p1 = a.clone().addScaledVector(h, d); dia.ranh(p0, p1, .9, .32, { mau: VANG }); dia.cat(p0, p1, 1.4); xaNhat = d; } } : null });
    }
    // sửa lỗi bản game: Nhất Tuyến Viên Mãn vẫn có thanh kiếm lớn chốt cuối đường
    if (t >= 4) giangCuKiem(S, b, t, T0 + .8, 2.2);
    return;
  }

  const tam = diemVung(ctx, 16);
  const R = 4 * (t >= 3 ? 1.5 : 1) * (n === N_PHONG_THIEN ? 1.5 : 1);
  baoVong(tam, R, .45);
  nv.ngam(tam);
  const theo = ctx.dich && ctx.dich.pos.distanceTo(tam) < R + 2 ? ctx.dich : null;
  const thienHa = t >= 5 && !n;
  S.luc(.3, () => {
    const G = tam.clone().add(new V3(0, H, 0));
    tranDo(G, R * 1.05, { song: 1.75, xoay: thienHa ? 90 : 40, sang: 1.7 });
    quangNo(G, 2, VANG, .5);
    if (n === N_PHONG_THIEN) dia.gio(tam, R * 1.2, .8);
  });
  for (let k = 0; k < N; k++) {
    const cho = T0 + .05 + k / N * .7;
    if (thienHa) {
      // Thiên Hà Đảo Quyển: kiếm đổ xuống theo xoắn ốc từ rìa vào tâm, mỗi thanh lệch góc như dòng sông ngân xoáy
      const u = k / N, g = u * Math.PI * 4.2, r = R * (.95 - .85 * u);
      const den = tam.clone().add(new V3(Math.cos(g) * r, 0, Math.sin(g) * r));
      const tu = tam.clone().add(new V3(Math.cos(g + .9) * r * 1.05, H, Math.sin(g + .9) * r * 1.05));
      roi(S, { den, tu, toc: 24, cho, r: 1.3, giu: .55, op: Op(manh, 3) });
      continue;
    }
    const nham = theo != null && k % 5 < 3;
    let den;
    if (nham) den = theo.pos.clone().setY(0);
    else { const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * R; den = tam.clone().add(new V3(Math.cos(a) * r, 0, Math.sin(a) * r)); }
    roi(S, { den, theo: nham ? theo : null, lech: .9, cao: H, toc: 24, cho, r: 1.3, giu: .5, op: Op(manh, 3),
      khiCham: t >= 4 ? p => { if (Math.random() < .35) dia.chay(p, .7, { mau: VANG, manh: .4 }); } : null });
  }
  if (t >= 4) giangCuKiem(S, tam, t, T0 + .8, R, theo);
}
/** thanh kiếm lớn chốt giữa vùng (Viên Mãn) — hình kiếm thật cỡ lớn, cắm lại, đất nổ */
function giangCuKiem(S, tam, t, cho, R, theo) {
  const L = 4.2;
  DK.sau(cho - .3, () => {
    const den = theo ? theo.pos.clone().setY(0) : tam.clone(); datY(den);
    const ck = cuKiem(L, { song: 2.6 });
    const tren = den.clone().add(new V3(0, 10 + L, 0));
    let tt = 0, cham = false, tC = 0;
    DK.lap(dt => {
      tt += dt;
      if (!cham) {
        if (tt < .3) { ck.co(E('o', tt / .2)); ck.dat(tren.clone().add(new V3(Math.sin(tt * 70) * .03, 0, 0)), DOWN); return; }
        const u = E('i', (tt - .3) / .22);
        const chuoi = tren.clone().lerp(den.clone().add(new V3(0, L * .72, 0)), u); ck.dat(chuoi, DOWN);
        if (u >= 1) {
          cham = true; tC = tt;
          vungCb(S, den.clone().add(new V3(0, .6, 0)), 2.6, Op(30, 15, 2), tiaKhiTrung(10, 6));
          dia.no(den, { muc: t >= 5 ? 3 : 2, r: 2.2, mau: VANG });
          quangNo(den.clone().add(new V3(0, .8, 0)), 2.6, VANG, .35); songXung(den.clone().add(new V3(0, .15, 0)), 6, VANG, .55);
          vfx.den(den.clone().add(new V3(0, 2, 0)), { mau: VANG, manh: 6, xa: 14, song: .5 }); vfx.vienMan(VANG, 1.2, .4);
          if (t >= 5) vfx.vaCham({ kieu: 'chop', mau: VANG, song: .07 });
          rung(.4, .35);
        }
        return;
      }
      const tl = tt - tC; const run = tl < .25 ? Math.sin(tl * 80) * .06 * (1 - tl / .25) : 0;
      const chim = tl > 1.5 ? E('i', (tl - 1.5) / .5) * L * .8 : 0;
      ck.dat(den.clone().add(new V3(run, L * .72 - chim, 0)), DOWN);
      if (tl > 2) { ck.huy(); return false; }
    });
  });
}

// ================================================================ C · KIM QUA PHÁ GIÁP
function PhaGiap(ctx) {
  const nhanh0 = ctx.tang >= 3 ? ctx.nhanh : null;
  if (nhanh0 === N_HO_KIEM) return HoKiem(ctx);
  const S = phien(ctx, 'vkn_pg'), nv = ctx.nv, t = S.t, n = S.n;
  const xuyen = n === N_XUYEN_THACH;
  const L = t >= 5 ? 15 : t >= 3 ? 12 : 9, rn = t >= 3 ? 1.5 : 1.1, pha = xuyen ? 36 : 18;
  const so = t >= 5 ? 7 : t >= 3 ? 5 : 3;
  const h = huongNgang(nv, ctx.dich);
  const a = chan(nv).addScaledVector(h, .6);
  baoDai(a, a.clone().addScaledVector(h, L), rn * 2, .32);
  nv.ngam(a.clone().addScaledVector(h, L));
  const T0 = .36, TD = .42;
  // nhân vật lao tới 1,3 m trong clip ⇒ gốc mũi khoan theo ngực lúc ra đòn
  const goc = () => nguc(nv).addScaledVector(h, .7);
  let gocDinh = null;
  const Dinh = tt => (gocDinh || goc()).clone().addScaledVector(h, L * E('o', (tt - T0) / TD));
  S.luc(T0, () => { gocDinh = goc(); });
  S.luc(.1, () => khoan(S, h, L, so, t, T0 - .1, TD, xuyen, () => gocDinh || goc()));
  const tia = tiaKhiTrung(8, 5);
  for (let k = 0; k < 3; k++) {
    const tk = T0 + .1 + k * .1;
    S.luc(tk, () => { const op = Op(22, pha); op.khongTheChan = xuyen; doanCb(S, gocDinh, Dinh(tk), rn, op, new Set(), tia); rung(.1); });
  }
  S.luc(T0 + TD + .02, () => {
    const dinh = Dinh(T0 + TD); const dat = datY(dinh.clone());
    const op = Op(40, xuyen ? 60 : 30, 0, 3); op.khongTheChan = xuyen;
    doanCb(S, gocDinh, dinh, rn, op, new Set(), tia);
    if (t >= 4) {
      vungCb(S, dinh, 2.2, Op(20, 10));
      dia.no(dat, { muc: t >= 5 ? 3 : 2, r: 1.8, mau: VANG });
      quangNo(dinh, 2.4, VANG, .35); songXung(dat.clone().add(new V3(0, .15, 0)), 5, VANG, .5);
      vfx.den(dinh, { mau: VANG, manh: 5, xa: 12, song: .4 });
      if (t >= 5) {
        // Phá Thiên Toản: gai đá trồi dọc đường khoan + khung va chạm
        for (let i = 1; i <= 5; i++) DK.sau(i * .045, () => dia.gai(datY(a.clone().addScaledVector(h, L * i / 6)), { so: 4, r: 1, cao: 1.5 + i * .15, song: 2.2 }));
        vfx.vaCham({ kieu: 'dao', mau: VANG, song: .07 }); vfx.vienMan(VANG, 1, .4);
      }
      rung(.4, .3);
    } else { quangNo(dinh, 1.4, VANG, .3); tiaLua(dinh, 18, KIM, 7); rung(.25); }
  });
}
/** mũi khoan: `so` phi kiếm thật xếp nón, mũi chụm, xoáy 900°/s; tụ quanh thân lúc lấy đà rồi khoan thẳng `L` m */
function khoan(S, h, L, so, tang, tTu, td, xuyen, goc) {
  const nv = S.nv, ben = benPhai(h), len = new V3().crossVectors(h, ben).normalize().negate();
  const co = (xuyen ? 1.3 : 1) * (tang >= 3 ? 1.15 : 1);
  const ks = []; for (let i = 0; i < so; i++) ks.push(taoKiem({ dai: 1.1, co, vet: true, tua: false, sang: 1.5 }));
  const Lk = ks[0].muiL;
  const lech = new V3(), p = new V3(), f = new V3(), tamTu = new V3();
  let t = 0, xq = 0, tGhi = 0, truocDat = null, nhip = 0;
  const vongX = [];
  if (tang >= 4) for (let j = 0; j < 2; j++) {   // vòng xoáy kim quang (cung hở để thấy quay)
    const m = new T.Mesh(new T.RingGeometry(.9, 1, 48, 1, 0, 4.3), new T.MeshBasicMaterial({ color: VANG.clone().multiplyScalar(1.3), transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false }));
    vongX.push(vfx.them(m, tTu + td + .4));
  }
  const quang = { v: new V3() };
  const sp = vfx.quang(quang.v, { co: 1.4, mau: VANG, op: .0, song: tTu + td + .35 });
  DK.lap(dt => {
    t += dt; xq += dt * (t < tTu ? 500 : 900);
    const ph = t < tTu ? 0 : t < tTu + td + .06 ? 1 : 2;
    if (ph === 0) {                    // tụ kiếm: vòng quanh trục h sau vai phải, thu nhỏ dần
      const s = E('o', t / .15);
      tamTu.copy(nguc(nv)).addScaledVector(ben, .35).addScaledVector(h, -.2);
      for (let i = 0; i < so; i++) {
        const g = (xq + i * 360 / so) * D;
        lech.copy(ben).applyAxisAngle(h, g);
        p.copy(tamTu).addScaledVector(lech, .75 * s); f.copy(h).addScaledVector(lech, .25).normalize();
        ks[i].o.scale.setScalar(Math.max(.01, s)); ks[i].dat(p, f);
      }
      return;
    }
    const u = E('o', (t - tTu) / td);
    const g0 = goc(), dinh = g0.clone().addScaledVector(h, L * u);
    if (ph === 1) {
      for (let i = 0; i < so; i++) {   // nón: mũi chụm ở đỉnh, chuôi toả ra
        const g = (xq + i * 360 / so) * D;
        lech.copy(ben).applyAxisAngle(h, g);
        const mui = dinh.clone().addScaledVector(lech, .08), chuoi = dinh.clone().addScaledVector(h, -Lk).addScaledVector(lech, .42 * co);
        f.subVectors(mui, chuoi).normalize();
        p.copy(mui).addScaledVector(f, -Lk * .65);
        ks[i].o.scale.setScalar(1); ks[i].dat(p, f);
      }
      quang.v.copy(dinh); sp.o.material.opacity = .7;
      // tia kim loại toé + cắt cỏ / xẻ rãnh dọc đường
      tGhi += dt;
      if (tGhi >= 1 / 40) {
        tGhi = 0;
        if (tang >= 2) tiaLua(dinh, 3, KIM, 6);
        const d0 = datY(dinh.clone());
        if (truocDat && d0.distanceTo(truocDat) > .4) {
          if (tang >= 3) dia.cat(truocDat, d0, 1);
          if (tang >= 4 || xuyen) { dia.ranh(truocDat, d0, xuyen ? 1.1 : .8, xuyen ? .45 : .32, { mau: VANG }); if (Math.random() < .6) dia.vun(d0, { so: 3, luc: 2, len: 3, co: .15, r: .3 }); }
          truocDat = d0;
        } else if (!truocDat) truocDat = d0;
        nhip++; if (tang >= 4 && nhip % 3 === 0) dia.gio(d0, 2.2, .5);
      }
      vongX.forEach((x, j) => {
        const m = x.o; m.position.copy(g0).lerp(dinh, .45 + j * .3); m.lookAt(m.position.clone().add(h));
        m.rotateZ((xq * (j ? -.7 : .5)) * D); m.scale.setScalar((.95 - j * .25) * co); m.material.opacity = .4;
      });
      return;
    }
    // vỡ mũi khoan: kiếm toả ra rồi tan
    const k = 1 - (t - tTu - td - .06) / .18;
    vongX.forEach(x => x.o.material.opacity = Math.max(0, k) * .5);
    sp.o.material.opacity = Math.max(0, k) * .7;
    if (k <= 0) { ks.forEach(x => x.huy()); return false; }
    for (let i = 0; i < so; i++) {
      const g = (xq * .2 + i * 360 / so) * D; lech.copy(ben).applyAxisAngle(h, g);
      p.copy(dinh).addScaledVector(lech, (1 - k) * 2.2); f.copy(h).addScaledVector(lech, 1 - k).normalize();
      ks[i].o.scale.setScalar(Math.max(.01, k)); ks[i].dat(p, f);
    }
  });
  void len;
}
/** Kim Cương Hộ Kiếm — kiếm xoay vòng quanh thân 3,5 s, cứ 0,4 s một thanh đâm ra kẻ áp sát */
function HoKiem(ctx) {
  const S = phien(ctx, 'vkn_ho'), nv = ctx.nv, t = S.t;
  const R = 2.6, dai = 3.5, op = Op(16, 6);
  const so = t >= 4 ? 7 : 5;            // game: Viên Mãn+ 7 thanh (JSON nói 5)
  baoVong(chan(nv), R, .2);
  S.luc(.2, () => {
    songXung(nguc(nv), R, VANG, .4);
    tranDo(chan(nv).add(new V3(0, .05, 0)), 1.9, { song: dai, xoay: 40, op: .55 });
    const ks = []; for (let i = 0; i < so; i++) ks.push(taoKiem({ dai: 1.1, co: 1.15, vet: true, tua: TUA, sang: 1.4 }));
    const dam = ks.map(() => ({ t: -1, dich: null }));
    let tt = 0, xq = 0, nhip = 0, iDam = 0;
    const p = new V3(), f = new V3();
    DK.lap(dt => {
      tt += dt; xq += dt * 320; nhip += dt;
      const k = Math.min(c01(tt / .2), c01((dai - tt) / .25));
      if (tt >= dai) { ks.forEach(x => x.huy()); return false; }
      const tam = nguc(nv);
      for (let i = 0; i < so; i++) {
        const a = xq + i * 360 / so, r = xoay(a);
        p.copy(tam).addScaledVector(r, 1.5 * Math.max(.2, k)).add(new V3(0, Math.sin(a * D * 2) * .3, 0));
        f.copy(xoay(a + 90)).add(new V3(0, -.12, 0)).normalize();
        const dd = dam[i];
        if (dd.t >= 0) {                // đâm ra rồi về
          dd.t += dt; const u = dd.t / .22; if (u >= 1) dd.t = -1;
          else { const toi = nguc(dd.dich); const s = Math.sin(Math.PI * u); f.lerp(toi.clone().sub(p).normalize(), Math.min(1, s * 2)).normalize(); p.lerp(toi.addScaledVector(f, -.6), s * .85); }
        }
        ks[i].o.scale.setScalar(Math.max(.01, k)); ks[i].dat(p, f);
      }
      if (nhip >= .4) {
        nhip = 0;
        const n0 = vungCb(S, tam, R, op, (b, kq, pp) => { if (kq === 'trung') tiaLua(pp, 6, KIM, 4); const dd = dam[iDam++ % so]; dd.t = 0; dd.dich = b; });
        if (n0 > 0) rung(.1);
        if (t >= 4) {   // Viên Mãn: vòng kiếm cắt cỏ, gió rạp quanh thân
          for (let j = 0; j < 8; j++) { const a0 = xoay(xq + j * 45).multiplyScalar(1.6).add(nv.pos), a1 = xoay(xq + j * 45 + 45).multiplyScalar(1.6).add(nv.pos); dia.cat(a0, a1, .5); }
          dia.gio(nv.pos, 3.2, .45);
        }
      }
    });
  });
}

// ================================================================ V · KIẾM TRẬN PHONG THIÊN
function KiemTran(ctx) {
  const S = phien(ctx, 'vkn_kt'), nv = ctx.nv, t = S.t, n = S.n;
  const tam = diemVung(ctx, 14);
  const R = 5 * (t >= 3 ? 1.3 : 1) * (n === N_THIEN_LA ? 1.3 : 1);
  baoVong(tam, R, .55);
  nv.ngam(tam);
  S.luc(.1, () => quangNo(nv.diem('lung'), .7, VANG, .3));
  S.luc(.2, () => tranKiem(S, tam, R, t, n === N_TU_KIEM, n === N_THIEN_LA));
}
function tranKiem(S, tam, R, tang, tuKiem, thienLa) {
  const nv = S.nv;
  const T_CAM = .42, T_RUT = 1.05, T_BAY = 1.25, T_NO = 1.42, T_HET = 1.75;
  const ds = [], vongCua = [];
  if (tuKiem) for (let i = 0; i < 4; i++) { ds.push(tam.clone().addScaledVector(xoay(45 + i * 90), R * .8)); vongCua.push(0); }
  else {
    const vong = tang >= 5 ? 3 : tang >= 3 ? 2 : 1, rv = [1, .6, .3];
    for (let v = 0; v < vong; v++) for (let i = 0; i < 8; i++) { ds.push(tam.clone().addScaledVector(xoay(i * 45 + v * 22.5), R * rv[v])); vongCua.push(v); }
  }
  const cam = ds.map(p => datY(p));
  const co = tuKiem ? 3.2 : tang >= 3 ? 1.5 : 1.4;
  const dinhTam = tam.clone().add(new V3(0, 1, 0));
  const tu = nv.diem('lung').addScaledVector(nv.toi(), -.3);
  const ks = cam.map(() => (tuKiem ? null : taoKiem({ dai: 1.2, co, vet: true, tua: false, sang: 1.4 })));
  const cus = tuKiem ? cam.map(() => cuKiem(1.2 * co, { song: T_HET + .2, sang: 1.5 })) : null;
  const L = 1.2 * co;
  const tre = cam.map((_, i) => (tuKiem ? i * .05 : i * .012));
  const ctl = cam.map((p, i) => tu.clone().lerp(p, .5).add(new V3(0, 6 + (vongCua[i] * .8), 0)));
  const p = new V3(), f = new V3(), tamK = new V3();
  // lưới Thiên La
  const luoi = thienLa ? cam.map(() => soi(KIM, .7, T_HET, .05)) : [];
  const luoiTam = thienLa ? cam.map(() => soi(KIM, .5, T_HET, .04)) : [];
  let t = 0, daCam = false, daNo = false;
  function datKiem(i, pChuoiGiua, h, s) {   // p = gốc nhóm kiếm (≈ 0,35 L từ chuôi)
    if (tuKiem) { const c = cus[i]; c.co(s); c.dat(pChuoiGiua.clone().addScaledVector(h, -.35 * L), h); }
    else { ks[i].o.scale.setScalar(Math.max(.01, s)); ks[i].dat(pChuoiGiua, h); }
  }
  DK.lap(dt => {
    t += dt;
    if (t >= T_HET) { ks.forEach(k => k && k.huy()); if (cus) cus.forEach(c => c.huy()); return false; }
    // ---- cắm xuống: trói mọi kẻ trong vòng, trận đồ sáng lên dưới đất
    if (!daCam && t >= T_CAM + tre[tre.length - 1]) {
      daCam = true;
      vungCb(S, tam.clone().add(new V3(0, .6, 0)), R, Op(45, 10));
      songXung(tam.clone().add(new V3(0, .15, 0)), R * 1.15, VANG, .5);
      tranDo(tam.clone().add(new V3(0, .06, 0)), R * 1.04, { song: T_NO - t + .35, xoay: 25, op: .7, sang: 1.5, nhay: tang >= 4 });
      for (let i = 0; i < cam.length; i += 2) { bui(cam[i], 4, .6, 2.5); if (tang >= 2) tiaLua(cam[i].clone().add(new V3(0, .3, 0)), 5, KIM, 4); }
      if (tang >= 4) {
        for (let i = 0; i < cam.length; i++) if (vongCua[i] === 0) vfx.cot(cam[i], { r: .22 * (tuKiem ? 2 : 1), cao: tang >= 5 ? 40 : 7, mau: VANG, song: T_RUT - t + .1, op: .45 });
        dia.nut(tam, { r: R * 1.05, nhanh: 8, mau: VANG, song: 2.6 });
      }
      if (tuKiem) for (const c of cam) { dia.ho(c, 1.1, .3, { mau: VANG }); dia.vun(c, { so: 12, luc: 3, len: 5 }); }
      rung(tuKiem ? .3 : .22);
    }
    for (let i = 0; i < cam.length; i++) {
      const ti = t - tre[i];
      if (ti < 0) { datKiem(i, tu, UP, .01); continue; }
      if (ti < T_CAM) {                 // vút lên khỏi lưng, vòng cung rồi cắm phập xuống điểm trận
        const u = E('i', ti / T_CAM), u2 = Math.min(1, u + .02);
        const B = s => tu.clone().multiplyScalar((1 - s) * (1 - s)).addScaledVector(ctl[i], 2 * s * (1 - s)).addScaledVector(cam[i], s * s);
        const mui = B(u); f.subVectors(B(u2), mui); if (f.lengthSq() < 1e-8) f.copy(DOWN); f.normalize();
        if (u > .85) f.lerp(DOWN, (u - .85) / .15).normalize();
        p.copy(mui).addScaledVector(f, -.65 * L);
        datKiem(i, p, f, E('o', ti / .1));
        continue;
      }
      if (t < T_RUT) {                  // đứng trận: ngập 30 % lưỡi, rung nhẹ
        const run = Math.sin(t * 40 + i) * .01;
        p.copy(cam[i]).add(new V3(run, (.65 - .3) * L, 0)); datKiem(i, p, DOWN, 1);
        continue;
      }
      if (t < T_BAY) {                  // rút lên, xoay mũi về tâm
        const u = E('o', (t - T_RUT) / (T_BAY - T_RUT));
        const len = cam[i].clone().add(new V3(0, 2.5 * u + .35 * L, 0));
        f.copy(slerpHuong(DOWN, dinhTam.clone().sub(len).normalize(), u));
        datKiem(i, len, f, 1);
        continue;
      }
      if (t < T_NO) {                   // hội tâm
        const u = E('i', (t - T_BAY) / (T_NO - T_BAY));
        const tu2 = cam[i].clone().add(new V3(0, 2.5 + .35 * L, 0));
        f.copy(dinhTam).sub(tu2).normalize();
        tamK.lerpVectors(tu2, dinhTam.clone().addScaledVector(f, -.65 * L), u);
        datKiem(i, tamK, f, 1);
        continue;
      }
      datKiem(i, dinhTam, DOWN, .01);
    }
    if (thienLa) for (let i = 0; i < cam.length; i++) {
      const on = t >= T_CAM + .05 && t < T_RUT ? 1 : 0;
      const j = vongCua[i] === vongCua[(i + 1) % cam.length] ? (i + 1) % cam.length : i - 7;
      luoi[i].dat(cam[i].clone().add(new V3(0, .8, 0)), cam[j].clone().add(new V3(0, .8, 0)), on);
      luoiTam[i].dat(cam[i].clone().add(new V3(0, .5, 0)), i % 2 === 0 ? tam.clone().add(new V3(0, .5, 0)) : cam[i].clone().add(new V3(0, .5, 0)), on);
    }
    // ---- hội tâm nổ
    if (!daNo && t >= T_NO) {
      daNo = true;
      const rN = tuKiem ? 3.6 : tang >= 3 ? 3.2 : 2.6;
      vungCb(S, dinhTam, rN, Op(60, 25, 1.5));
      quangNo(dinhTam, rN * .9, VANG, .4); quangNo(dinhTam, rN * .3, TRANG, .14); tiaLua(dinhTam, 30, KIM, 9);
      songXung(tam.clone().add(new V3(0, .15, 0)), rN * 2.2, VANG, .5);
      if (tang >= 4) {
        vungCb(S, tam.clone().add(new V3(0, .6, 0)), R * .8, Op(15, 5));
        dia.no(tam, { muc: tang >= 5 || tuKiem ? 3 : 2, r: tuKiem ? 2.8 : 2.4, mau: VANG });
        vfx.den(dinhTam, { mau: VANG, manh: 6, xa: 14, song: .5 });
        if (tang >= 5) { vfx.vaCham({ kieu: 'dao', mau: VANG, song: .07 }); vfx.vienMan(VANG, 1.2, .45); vfx.troi(VANG, 1.4, .3); }
        rung(.4, .35);
      } else { dia.ho(tam, 1.4, .25, { mau: VANG }); dia.vun(tam, { so: 14, luc: 3, len: 5 }); dia.gio(tam, 4, .7); rung(.28); }
      ks.forEach(k => k && k.huy()); if (cus) cus.forEach(c => c.huy());
      return false;
    }
  });
}

// ================================================================ R · VẠN KIẾM QUY TÔNG (tuyệt kỹ)
function QuyTong(ctx) {
  const t0 = ctx.tang, nh0 = t0 >= 3 ? ctx.nhanh : null;
  const baKiem = t0 >= 5 && nh0 !== N_TE_PHAT && nh0 !== N_NHAT_KICH;
  const S = phien(ctx, baKiem ? 'vkn_qt5' : 'vkn_qt'), nv = ctx.nv, t = S.t, n = S.n;
  const nhatKich = n === N_NHAT_KICH, tePhat = n === N_TE_PHAT;
  const tam = diemVung(ctx, 18);
  const R = 6 * (t >= 5 ? 1.7 : t >= 4 ? 1.5 : t >= 3 ? 1.25 : 1) * (nhatKich ? .7 : tePhat ? 1.5 : 1);
  baoVong(tam, R, 1.4);
  nv.ngam(tam);
  S.luc(.08, () => { quangNo(nv.mui().add(new V3(0, .4, 0)), 1, VANG, .4); bui(nv.pos, 10, 1.4, 3); dia.gio(nv.pos, 4, .6); });
  bayLen(nv, .25, .7, t >= 3 ? 2.4 : 1.4, 1.55 + (baKiem ? .5 : 0), 1.85 + (baKiem ? .5 : 0));
  if (t >= 4) S.luc(.2, () => { vfx.chu(t >= 5 ? 'Vạn Kiếm Triều Tông' : 'Vạn Kiếm Quy Tông · Nhất Kiếm Định Càn Khôn', { mau: '#' + VANG.getHexString(), song: 1.6 }); vfx.troi(VANG, 3.4, t >= 5 ? .5 : .4); vfx.vienMan(VANG, 3, .35); });
  S.luc(.1, () => quyTongDan(S, tam, R, t, nhatKich, tePhat, baKiem));
}
function quyTongDan(S, tam, R, tang, nhatKich, tePhat, baKiem) {
  const nv = S.nv;
  const T_TU = .85, T_HOP = .2, T_ROI = .17;     // mốc tính từ lúc gọi (= .1 s sau khi ra chiêu)
  let Lcu = (tang >= 4 ? 14 : tang >= 3 ? 10 : 7) * (nhatKich ? 1.3 : 1);
  if (nhatKich && tang >= 5) Lcu *= 1.15;        // Nhất Kích Hoá Cảnh: một thanh duy nhất, to hơn nữa (sửa: bản game vẫn ra 3 thanh)
  const G = tam.clone().add(new V3(0, Math.max(11, Lcu + 5), 0));   // game: 16 m cố định — hạ theo cỡ kiếm để mũi cự kiếm luôn lơ lửng ~5 m, nhìn thấy cả thanh
  const so = tang >= 5 ? 80 : tang >= 4 ? 60 : tang >= 3 ? 36 : tang >= 2 ? 18 : 12;
  const soThat = Math.min(so, 42);                 // kiếm thật vẽ được (trần ~60); phần dư = tia vàng
  const goc0 = nv.pos.clone();
  const ben = benPhai(huongNgang(nv, null));
  // ---- vạn kiếm: trồi lên từ đất quanh thân, xoáy ốc lên điểm tụ
  const anh = [];
  for (let k = 0; k < soThat; k++) {
    const a0 = RR(0, Math.PI * 2), r0 = RR(1.6, tang >= 4 ? 9 : 5.5);
    anh.push({ a0, r0, t0: .05 + k / soThat * .5, k: null, quay: RR(.85, 1.15), vet: k % 4 === 0 });   // 1/4 số kiếm kéo vệt (vệt dài quá thì thành que)
  }
  const chinh = tang >= 3 && !nhatKich && !tePhat ? .9 : 1;
  let giang;
  if (baKiem) giang = [
    { lech: ben.clone().multiplyScalar(R * .45), tRoi: 1.3, co: .7, frac: .3 },
    { lech: ben.clone().multiplyScalar(-R * .45), tRoi: 1.55, co: .7, frac: .3 },
    { lech: new V3(), tRoi: 1.82, co: 1.15, frac: chinh },
  ];
  else giang = [{ lech: new V3(), tRoi: 1.3, co: 1, frac: nhatKich && tang >= 5 ? 1.6 : chinh }];
  for (const g of giang) { g.cham = false; g.tCham = 0; g.ck = null; }
  const tHet = giang[giang.length - 1].tRoi + T_ROI + 2;
  const ds = new Set();
  const p = new V3(), q = new V3(), f = new V3();
  const viTri = (a, s) => {   // s 0..1 dọc đường xoắn: tâm trượt từ người thi triển sang vùng ngắm, bán kính thu dần, cao dần
    const e = E('io', s), c = goc0.clone().lerp(tam, E('io', s * 1.1));
    const r = lerp(a.r0, 1.3, E('i', s)), g = a.a0 + s * Math.PI * 3 * a.quay;
    return c.add(new V3(Math.cos(g) * r, lerp(-.6, G.y - 1.5, e) + Math.sin(s * 9 + a.a0) * .3, Math.sin(g) * r));
  };
  let t = 0, tHat = 0, daTu = false, vongTroi = null;

  function cham(dat, frac, co, L) {
    const op = Op(190 * frac, 55, 3, 4); op.khongTheChan = nhatKich;
    const r = R * Math.min(1, co);
    vungCb(S, dat.clone().add(new V3(0, .8, 0)), r, op, tiaKhiTrung(10, 6), ds);
    const muc = tang >= 4 || nhatKich ? 3 : 2;
    dia.no(dat, { muc, r: Math.max(2, r * .45), mau: VANG });
    if (tang >= 4 || nhatKich) { dia.ho(dat, r * .55, .7, { mau: VANG, vanh: .35 }); dia.nut(dat, { r: r * 1.5, nhanh: 12, mau: VANG, song: 4 }); dia.pha(dat, r * 1.1); }
    quangNo(dat.clone().add(new V3(0, 1, 0)), Math.max(3, r * .5), VANG, .4); quangNo(dat.clone().add(new V3(0, .6, 0)), 1.6, TRANG, .14);
    songXung(dat.clone().add(new V3(0, .15, 0)), r * 1.6, VANG, .6); tiaLua(dat.clone().add(new V3(0, .5, 0)), 40, KIM, 11);
    bui(dat, tang >= 4 ? 40 : 24, r * .6, 6);
    vfx.den(dat.clone().add(new V3(0, 3, 0)), { mau: VANG, manh: 8, xa: 22, song: .6 });
    if (co >= 1 && (tang >= 4 || nhatKich)) vfx.vaCham({ kieu: tang >= 5 || nhatKich ? 'dao' : 'chop', mau: VANG, song: .07 });
    rung(tang >= 4 ? .5 : .35, .45);
    ds.clear();
    // Đại Thành+: vòng kiếm dư rơi quanh chỗ giáng (Nhất Kích / Tề Phát không có)
    if (tang >= 3 && !nhatKich && !tePhat && co >= 1) {
      const N = tang >= 4 ? 24 : 8;
      for (let i = 0; i < N; i++) {
        const r2 = xoay(i * 360 / N + RR(-10, 10)).multiplyScalar(R * RR(.5, 1));
        roi(S, { den: dat.clone().add(r2).setY(0), cao: 10, toc: 26, cho: .08 + i / N * .55, r: 1.4, giu: .55, op: Op(12, 4) });
      }
    }
  }
  function voThanhMua(ck, viTriKiem) {   // Vạn Kiếm Tề Phát: cự kiếm vỡ trên không thành mưa kiếm
    quangNo(viTriKiem, 4, VANG, .4); tiaLua(viTriKiem, 50, KIM, 12); songXung(viTriKiem, 10, VANG, .5, DOWN);
    ck.huy();
    const N = 30, manh = 190 / 12;
    const dsK = DK.trongTron(tam, R);
    for (let i = 0; i < N; i++) {
      const theo = dsK.length > 0 && i % 5 < 2 ? dsK[i % dsK.length] : null;
      let den;
      if (theo) den = theo.pos.clone().setY(0);
      else { const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * R; den = tam.clone().add(new V3(Math.cos(a) * r, 0, Math.sin(a) * r)); }
      const tu = viTriKiem.clone().add(new V3(RR(-2, 2), RR(-3, 3), RR(-2, 2)));
      roi(S, { den, theo, lech: 1, tu, toc: 28, cho: i / N * .5, r: 1.4, giu: .5, op: Op(manh, 6), co: 1.1 });
    }
    rung(.3);
  }

  DK.lap(dt => {
    t += dt;
    if (t >= tHet) return false;
    // ---- vạn kiếm trồi lên, xoáy lên trời
    if (!daTu) {
      for (const a of anh) {
        if (t < a.t0) continue;
        if (!a.k) { a.k = taoKiem({ dai: 1.1, co: 1.5, vet: a.vet, tua: false, sang: 1.6 }); if (Math.random() < .3) dia.vun(viTri(a, 0).setY(0), { so: 3, luc: 1.5, len: 3, co: .12 }); }
        const s = c01((t - a.t0) / (T_TU - a.t0));
        p.copy(viTri(a, s)); q.copy(viTri(a, Math.min(1, s + .02))); f.subVectors(q, p);
        if (f.lengthSq() < 1e-8) f.copy(UP); f.normalize();
        if (s < .12) f.lerp(UP, 1 - s / .12).normalize();          // trồi thẳng lên khỏi đất
        a.k.o.scale.setScalar(Math.max(.01, E('o', (t - a.t0) / .1))); a.k.dat(p, f);
      }
      tHat += dt;
      if (so > soThat && t > .3 && tHat >= 1 / 30) { tHat = 0; const g = Math.random() * Math.PI * 2, r = RR(1.5, 4), c = G.clone().add(new V3(Math.cos(g) * r, RR(-4, -1), Math.sin(g) * r)); vfx.hat(c, { so: 2, mau: KIM, toc: 6, huong: G.clone().sub(c), loe: .1, co: .12, song: .3, trongLuc: 0, sang: 1.6 }); }
      if (t >= T_TU) {
        daTu = true;
        for (const a of anh) if (a.k) a.k.huy();
        quangNo(G, 3.2, VANG, .5); quangNo(G, 1.2, TRANG, .2); songXung(G, 7, KIM, .5, UP);
        vongTroi = tranDo(G.clone().add(new V3(0, -1.5, 0)), Math.max(4, Lcu * .45), { song: giang[giang.length - 1].tRoi - t + .3, xoay: 60, sang: 1.8, op: .8 });
      }
    }
    // ---- cự kiếm: hiện ở điểm tụ, rung, rồi giáng
    for (let i = 0; i < giang.length; i++) {
      const g = giang[i];
      const hien = i === 0 ? T_TU : g.tRoi - .35;
      if (t < hien) continue;
      const L = Lcu * g.co;
      const dat = datY(tam.clone().add(g.lech));
      const tren = G.clone().add(g.lech).add(new V3(0, L * .15, 0));      // chuôi
      if (!g.ck) { g.ck = cuKiem(L, { song: tHet - t + .2, sang: 1.7 }); if (i > 0) { quangNo(tren.clone().add(new V3(0, -L * .5, 0)), 2.5, VANG, .4); } }
      const ck = g.ck;
      if (tePhat && i === 0 && t >= g.tRoi) {
        if (!g.cham) { g.cham = true; voThanhMua(ck, tren.clone().add(new V3(0, -L * .5, 0))); }
        continue;
      }
      if (!g.cham) {
        let chuoi;
        const k = E('o', (t - hien) / T_HOP);
        if (t < g.tRoi) { chuoi = tren.clone().add(new V3(Math.sin(t * 60) * .04, 0, Math.cos(t * 53) * .04)); ck.co(lerp(.3, 1, k)); }
        else {
          const u = E('i', (t - g.tRoi) / T_ROI);
          chuoi = tren.clone().lerp(dat.clone().add(new V3(0, L * .75, 0)), u); ck.co(1);
          if (u >= 1) { g.cham = true; g.tCham = t; cham(dat, g.frac, g.co, L); if (tang >= 4) vfx.cot(dat, { r: 1.2, cao: 30, mau: KIM, song: .5, op: .5 }); }
        }
        ck.dat(chuoi, DOWN);
      } else {
        // cắm ngập 1/4 lưỡi, chuôi rung, rồi lún dần xuống đất
        const tl = t - g.tCham;
        const run = tl < .3 ? Math.sin(tl * 70) * .1 * (1 - tl / .3) : 0;
        const chim = tl > 1.4 ? E('i', (tl - 1.4) / .55) * L * .78 : 0;
        ck.dat(dat.clone().add(new V3(run, L * .75 - chim, 0)), DOWN);
        if (tl > 1.95) { ck.huy(); }
      }
    }
  });
  void vongTroi;
}

// ================================================================ COMBO ĐÒN THƯỜNG (6 nhát, mỗi nhát kèm phi kiếm)
function kiemVai(S, nv, dich, phia, o) {
  const neo = () => nv.pos.clone().addScaledVector(nv.phai(), .5 * phia).addScaledVector(nv.toi(), -.35).add(new V3(0, 1.8, 0));
  return bay(S, Object.assign({
    neo, huongCho: () => nv.toi().add(new V3(0, .3, 0)).addScaledVector(nv.phai(), .3 * phia), dich, duoi: !!dich,
    diem: dich ? null : nv.quanh(0, 1.2, 14), toc: 32, cho: .06, hien: .05, tam: 22, op: Op(12, 3), vet: true, co: 1, khiTrung: tiaKhiTrung(6, 4),
    khiPhong: p => quangNo(p, .35, KIM, .1),
  }, o));
}
const COMBO = [
  { clip: 'vkn_d1', st: 40, kiem: (S, nv, d) => kiemVai(S, nv, d, 1) },
  { clip: 'vkn_d2', st: 40, kiem: (S, nv, d) => kiemVai(S, nv, d, -1) },
  { clip: 'vkn_d3', st: 45, tam: 3, non: 360, kiem: (S, nv, d) => {        // xoay người: hai thanh bay vòng quanh thân một lượt rồi phóng
    for (const s of [0, 1]) bay(S, {
      neo: tt => { const g = (s * 180 + tt * 900) * D; return nv.pos.clone().add(new V3(Math.sin(g) * 1.3, 1.2, Math.cos(g) * 1.3)); },
      huongCho: tt => { const g = (s * 180 + tt * 900 + 90) * D; return new V3(Math.sin(g), 0, Math.cos(g)); }, xoayCho: 30,
      dich: d, duoi: !!d, diem: d ? null : nv.quanh(0, 1.2, 14), cho: .36 + s * .05, hien: .08, toc: 32, tam: 22, op: Op(12, 3), vet: true, khiTrung: tiaKhiTrung(6, 4),
    });
  } },
  { clip: 'vkn_d4', st: 45, tam: 3.2, non: 70, kiem: (S, nv, d) => {        // đâm: một thanh vút qua vai theo đường đâm, xuyên thẳng
    const f = d ? nguc(d).sub(nv.diem('nguc')).normalize() : nv.toi();
    bay(S, { pos: nv.diem('nguc').addScaledVector(nv.phai(), .3).add(new V3(0, .35, 0)), huong0: f, thang: true, cho: .01, hien: .03, toc: 42, tam: 12, xuyen: true, op: Op(14, 5), vet: true, co: 1.1, khiTrung: tiaKhiTrung(8, 5) });
  } },
  { clip: 'vkn_d5', st: 50, hat: 1.2, kiem: (S, nv, d) => {                  // hất: hai thanh từ đất đâm vọt lên dưới chân địch
    const c = d ? d.pos.clone() : nv.quanh(0, 0, 2.6);
    for (const s of [-1, 1]) {
      const p0 = c.clone().addScaledVector(nv.phai(), .45 * s); p0.y = -.9;
      bay(S, { pos: p0, huong0: new V3(-.15 * s, 1, 0).normalize(), thang: true, cho: .02, hien: .02, toc: 24, tam: 4, op: Op(12, 4, 1), vet: true, co: 1.05, xuyen: true, khiTrung: tiaKhiTrung(6, 4) });
      DK.sau(.03, () => { dia.vun(c.clone().addScaledVector(nv.phai(), .45 * s).setY(0), { so: 5, luc: 2, len: 5, co: .14 }); });
    }
  } },
  { clip: 'vkn_d6', st: 70, tam: 3, non: 120, day: .8, kiem: (S, nv, d) => { // bổ: ba thanh hiện trên đầu địch, rơi cùng nhát bổ, cắm đất
    const c = d ? d.pos.clone().setY(0) : nv.quanh(0, 0, 2.8).setY(0), f = nv.toi(), b = nv.phai();
    for (let i = 0; i < 3; i++) {
      const g = (i * 120 + 90) * D, den = c.clone().addScaledVector(b, Math.cos(g) * .7).addScaledVector(f, Math.sin(g) * .7);
      const tu = den.clone().add(new V3(0, 5.5, 0)).addScaledVector(f, -.6);
      bay(S, { pos: tu, huong0: den.clone().sub(tu), diem: den, cho: .22 + i * .015, hien: .1, toc: 28, tam: 9, cam: true, giu: .55, ngap: .35, vet: true, co: 1.1,
        khiDat: i === 0 ? p => { vungCb(S, p.clone().add(new V3(0, .6, 0)), 1.6, Op(14, 6)); dia.nut(c, { r: 1.8, nhanh: 6, mau: VANG, song: 1.8 }); dia.vun(c, { so: 8, luc: 2.5, len: 4 }); bui(c, 6, .8, 3); rung(.18); } : null });
    }
  } },
];
function danh(ctx, i) {
  dungClip();
  const nv = ctx.nv, C = COMBO[i % COMBO.length];
  const dich = ctx.dich && ctx.dich.pos.distanceTo(nv.pos) < 22 ? ctx.dich : null;
  const S = phienNhe(nv);
  ctx.phat(C.clip, { moc: {
    vet0: () => vfx.vet(nv, { song: i === 2 ? .3 : .12, kieu: 'muc' }),
    trung: () => DK.trongNon(nv, C.tam || 2.7, C.non || 150).forEach(d => ctx.trung(d, { st: C.st, day: C.day || .3, hat: C.hat || 0, mau: ctx.mau })),
    kiem: () => C.kiem(S, nv, dich),
  } });
}
function lon(ctx) {
  dungClip();
  const nv = ctx.nv, S = phienNhe(nv);
  const dich = ctx.dich && ctx.dich.pos.distanceTo(nv.pos) < 22 ? ctx.dich : null;
  vfx.anhSot(nv, { mau: VANG, op: .28, song: .35 });
  const p0 = nv.pos.clone(), f = nv.toi(), b = nv.phai();
  ctx.phat('vkn_lon');
  // lộn ngược ra sau, để lại hai phi kiếm canh chỗ cũ — tiếp đất thì chúng phóng vào địch
  for (const s of [-1, 1]) bay(S, { pos: p0.clone().addScaledVector(b, .55 * s).add(new V3(0, 1.3, 0)), huong0: f.clone().add(new V3(0, .2, 0)), dich, duoi: !!dich, diem: dich ? null : p0.clone().addScaledVector(f, 12).add(new V3(0, 1.2, 0)), cho: .32 + (s > 0 ? .05 : 0), hien: .1, toc: 30, tam: 20, op: Op(10, 2), vet: true, khiTrung: tiaKhiTrung(5, 4) });
  DK.sau(.36, () => bui(nv.pos, 5, .8, 2.5));
}

// ================================================================ ĐĂNG KÝ
DK.dangKyBoNC(MA, {
  nguon: 'đề xuất (chưa có trong game) — dựa VanKiem.cs / bo_van_kiem.js',
  yTuong: 'Ngự kiếm vàng kim: MỌI thanh là phi kiếm thật (lưỡi, chắn tay, chuôi, vệt), bay theo ĐỘI HÌNH — quạt sau lưng, vòng quanh thân, mưa kiếm từ trận đồ trên trời, '
    + 'cự kiếm có chuôi/chắn tay/tua rõ; chạm đất thì CẮM lại (rung chuôi, lún dần). Động tác: kiếm chỉ tay trái, vung kiếm điều kiếm, bay lên không ở chiêu lớn. '
    + 'Tầng 1 sạch → 2–3 thêm vệt/pha → Viên Mãn tác động đất (nứt, hố, rãnh, cỏ đứt, cây đổ) → Hoá Cảnh có khung va chạm. Combo 6 nhát riêng, mỗi nhát kèm 1–2 phi kiếm; lộn né để lại 2 kiếm phản kích. '
    + 'Trần ~60 phi kiếm cùng lúc (R Viên Mãn/Hoá Cảnh vẽ 42 kiếm thật, phần dư thành tia vàng). '
    + 'Sửa so với game: Nhất Tuyến Viên Mãn vẫn có kiếm chốt; Nhất Kích Hoá Cảnh chỉ một cự kiếm (×1,5, sát thương ×1,6 = tổng ba thanh); V Hoá Cảnh cột sáng 40 m chạm trời. '
    + 'Đổi số: mốc C trễ hơn ~0,18 s (thêm pha tụ kiếm); V cắm ở .62 s (game .3 s) nên vòng báo .55 s; X mưa bắt đầu .5 s (game .35); combo ST 40/40/45/45/50/70 + phi kiếm 12–14.',
  moTaChieu: {
    vk_phan_quang: 'Thân xoắn lấy đà, kiếm chỉ tay trái phóng ra. Kiếm trồi từ sau lưng xoè quạt như hào quang rồi đuổi địch. T1 1 thanh · T2 vệt kim + Giáp vỡ · T3 3 thanh quạt · '
      + 'T4 5 thanh, xuyên qua địch rồi cắm phập xuống đất sau lưng (nứt, hố nhỏ, đá văng) · T5 bảy thanh vút lên xếp chòm Bắc Đẩu, sao nối sao, lần lượt lao xuống, thanh cuối nổ đất + khung va chạm. Liên Châu: nối đuôi một đích; Toả Vũ: mỗi thanh một đích.',
    vk_kiem_vu: 'Kiếm chỉ trời triệu ba thanh vút lên; trận đồ vàng mở trên trời; vung kiếm bổ xuống là mưa kiếm thật trút xuống, cắm đầy đất. T1 10 thanh · T2 vệt + Giáp vỡ · T3 20 thanh vùng ×1,5 · '
      + 'T4 bay lên giữa không, 30 thanh, cự kiếm chốt giữa vùng nổ đất (hố, nứt, sóng đất), trời ửng vàng · T5 Thiên Hà: 40 thanh xoáy ốc từ rìa vào tâm + khung va chạm. Nhất Tuyến: dải trận, mưa từ gần ra xa, Viên Mãn xẻ rãnh và vẫn có kiếm chốt.',
    vk_pha_giap: 'Xoắn thân tụ kiếm thành vòng sau vai, rồi lao đâm: các thanh chụm thành mũi khoan nón xoáy 900°/s. T1 3 thanh · T2 toé tia kim · T3 5 thanh 12 m, cắt cỏ · '
      + 'T4 xẻ rãnh dọc đường + vòng xoáy kim quang, cuối nổ hố · T5 7 thanh 15 m, gai đá trồi dọc rãnh + khung va chạm. Xuyên Thạch: kiếm to, rãnh sâu, không đỡ được. Hộ Kiếm: 5 (VM 7) thanh xoay quanh thân trên trận đồ, thanh nào gần địch thì đâm ra rồi về.',
    vk_kiem_tran: 'Kiếm chỉ, rồi dang hai tay phong trận: các thanh vút từ lưng thành vòng cung, cắm phập quanh vùng, trận đồ bát giác sáng dưới đất (trói); thu tay là kiếm rút lên hội tâm nổ. '
      + 'T1 8 thanh · T2 toé tia · T3 16 thanh 2 vòng · T4 cột kim quang mỗi kiếm, đất nứt theo trận, nổ thành hố · T5 24 thanh 3 vòng, cột sáng chạm trời, khung va chạm, trời vàng. Thiên La: lưới sáng giữa kiếm; Tứ Kiếm: 4 cự kiếm cắm bốn phương.',
    vk_quy_tong: 'Tuyệt kỹ: bay lên giữa không, hai tay giơ trời — vạn kiếm trồi từ đất quanh thân, xoáy ốc lên trời, quy về một thành CỰ KIẾM (chuôi, chắn tay, tua rõ) dưới trận đồ; vung kiếm bổ xuống là cự kiếm giáng, cắm ngập đất. '
      + 'T1 12 kiếm, cự kiếm 7 m · T2 18 · T3 36, cự kiếm 10 m + vòng kiếm dư · T4 60, trời vàng, 14 m, hố lớn + nứt + sóng đất + cây đổ + khung va chạm · T5 ba cự kiếm giáng liền (tay trái chém thanh giữa). Nhất Kích: một thanh nặng hơn, không đỡ được, cả Hoá Cảnh cũng chỉ một; Tề Phát: cự kiếm vỡ trên không thành mưa kiếm.',
  },
  tuThe: TU_THE,
  theThu: 'VKN_THU',
  soNhat: COMBO.length,
  danh,
  lon,
  chieu: { vk_phan_quang: PhanQuang, vk_kiem_vu: KiemVu, vk_pha_giap: PhaGiap, vk_kiem_tran: KiemTran, vk_quy_tong: QuyTong },
});
})();
