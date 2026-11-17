"use strict";
// ============================================================================
// bo_anh_sat.js — 2026-11-14 — ẢNH SÁT QUYẾT (mã 'anh_sat', sát thủ, kiếm) cho Phòng duyệt Kiếm.
// Port từ game Unity (nguồn sự thật, chỉ đọc):
//   Assets/Game/CongPhap/Bo/AnhSat.cs (AnhSatQuyet + BongGia), CongPhap/AnThanNguoiChoi.cs (ẩn thân người chơi),
//   CongPhap/ChieuVe.cs (QuangNo / SongXung / NoLon / VetThang / TiaLua / HatBay), CongPhap/ChieuChung.cs (Nguc, HuongNgam…),
//   CongPhap/CongPhapVuKhi.cs (GanChieuNguoiChoi: hệ số tầng; ThuanThucVaTrangThai: trạng thái tầng; PhatVFXTang: lớp VFX chung tầng ≥ 2),
//   VFX/VFXThamSo*.cs (lớp VFX tham số chung — làm gần đúng).
// Clip: C# phát clip web có sẵn (NIEM_0, CHIEU_1, XUAT_2, LUOT_TRAI, CHIEU_3) ở tốc độ gốc; lịch c.Luc(t) chạy độc lập theo giây web.
// Thời gian: số trong c.Luc / song = giây mô phỏng (web). AnThanNguoiChoi.An / GiuAn / TroiNhe nhận GIÂY THẬT ⇒ × 0,75.
// ============================================================================
(function () {
const DK = window.DK, T = DK.T, V3 = DK.V3, vfx = DK.vfx, D = DK.D;
const NHIP = DK.NHIP_GOC || .75;
const THAT = g => g * NHIP;                     // giây thật (Time.time) → giây mô phỏng
const nc = DK.nc;
const MA = 'anh_sat';
// màu Unity (sRGB) → tuyến tính cho renderer sRGB của lõi (không đổi thì tím tối hoá tím nhạt)
const SRGB = (r, g, b) => new T.Color(r, g, b).convertSRGBToLinear();
const TIM = SRGB(.6, .42, 1), TIM_TOI = SRGB(.22, .08, .4), LUC = SRGB(.45, 1, .55), DOC = SRGB(.62, .9, .32);
const TRANG = new T.Color(1, 1, 1);
const RR = (a, b) => a + Math.random() * (b - a);
const UP = new V3(0, 1, 0);

// ---------------------------------------------------------------- tiện ích hình học (Unity → three)
// ChieuDanh.Nguc: ViTri + up × 1,25 (người tung và bù nhìn cao 1,8 đều ra 1,25)
const nguc = o => o.pos.clone().add(new V3(0, 1.25, 0));
// "phải" theo nghĩa của Vector3.Cross(up, h) trong Unity (three: mặt +z thì phải là −x — như NhanVat.phai)
const phaiCua = h => new V3(-h.z, 0, h.x).normalize();
// Quaternion.AngleAxis(g, up) * h — quay h về phía "phải" g độ
const xoayY = (h, g) => { const r = phaiCua(h), c = Math.cos(g * D), s = Math.sin(g * D); return new V3(h.x * c + r.x * s, 0, h.z * c + r.z * s); };
const matCua = d => new V3(Math.sin(d.yaw), 0, Math.cos(d.yaw));               // IThucTheChienDau.HuongMat
const ngang = v => { const h = v.clone(); h.y = 0; return h.lengthSq() > 1e-8 ? h.normalize() : nc.toi(); };
const quanhDich = (d, huong, kc) => { const p = d.pos.clone().addScaledVector(huong, kc); p.y = d.pos.y; return p; };
const sauLung = (d, kc) => quanhDich(d, matCua(d).negate(), kc);
function oSauLung(d, tu) { const v = tu.clone().sub(d.pos); v.y = 0; if (v.lengthSq() < 1e-4) return true; return matCua(d).dot(v.normalize()) < -.34; }
function kcDoan(p, a, b) { const ab = b.clone().sub(a), L2 = ab.lengthSq(); if (L2 < 1e-10) return p.distanceTo(a); const t = DK.clamp(p.clone().sub(a).dot(ab) / L2, 0, 1); return p.distanceTo(a.clone().addScaledVector(ab, t)); }
const BK = .35;                                   // BanKinh người chơi / bù nhìn (gần đúng CharacterController)
const quayMat = (nv, h) => { if (h.x * h.x + h.z * h.z > 1e-8) nv.yaw = Math.atan2(h.x, h.z); };
function dichToi(nv, p) { nv.pos.set(p.x, p.y, p.z); nv.vel.set(0, 0, 0); }   // DichToi: dịch tức thời

// bù nhìn tự quay mặt về người chơi mỗi khung (lõi) ⇒ khoá hướng bằng một clip đứng yên lúc ra chiêu (quái thật quay chậm)
DK.clip('AS_GIU', '0 THU; .7 THU', null, null, { tron: .01, than: 0 });
const giuHuong = d => { if (d && !d.hd) DK.phat(d, 'AS_GIU', { khongMv: true }); };

// ---------------------------------------------------------------- ChieuVe (bản HTML gần đúng, cộng sáng như game)
const camPos = () => DK.cam.position;
// 2026-11-14 — game vẽ cộng sáng trên nền tối; cảnh duyệt sáng ban ngày ⇒ cộng sáng tím thành trắng, tím tối thành vô hình.
//   Vòng / vạch dùng pha trộn thường (giữ đúng sắc tím), quầng màu tối pha trộn thường (khói tối thật).
const matVach = (mau, op) => vfx.matThuong(mau, op);
/** QuangNo(p, r, mau, song): quầng tròn hướng máy, bán kính r·0,32 → r·1,76 (ease o), độ đục 0,7·(1−u²) */
function quangNo(p, r, mau, song = .35) {
  const c = vfx.mau(mau), toi = c.r + c.g + c.b < 1;
  const sp = new T.Sprite(new T.SpriteMaterial({ map: vfx.texTron, color: c, blending: toi ? T.NormalBlending : T.AdditiveBlending, depthWrite: false, transparent: true }));
  sp.position.copy(p); sp.renderOrder = 8;
  const r0 = r * .32, r1 = r * 1.76;
  return vfx.them(sp, song, (dt, u) => { const k = r0 + (r1 - r0) * DK.ease('o', u); sp.scale.set(k * 1.4, k * 1.4, 1); sp.material.opacity = (toi ? .55 : .7) * (1 - u * u); });
}
/** SongXung(p, r, mau, song, phap): vòng nở r·0,096 → r·0,8; không có pháp tuyến ⇒ quay về máy quay (như game) */
function songXung(p, r, mau, song = .45, phap = null, day = .12) {
  const r1 = r * .8, r0 = r * .096;
  const m = new T.Mesh(new T.RingGeometry(Math.max(.05, 1 - day / Math.max(r1, .3)), 1, 48), matVach(mau, .6));
  m.position.copy(p); m.renderOrder = 7;
  return vfx.them(m, song, (dt, u) => {
    const k = Math.max(.001, r0 + (r1 - r0) * DK.ease('o', u)); m.scale.set(k, k, k); m.material.opacity = .6 * (1 - u * u);
    if (phap) m.quaternion.setFromUnitVectors(new V3(0, 0, 1), phap.clone().normalize()); else m.lookAt(camPos());
  });
}
/** VetThang(a, b, mau, day, song): dải sáng a→b, rộng day·3, quay mặt về máy quanh trục, độ đục 1−u */
function vetThang(a, b, mau, day = .08, song = .4) {
  const d = b.clone().sub(a), L = d.length(); if (L < 1e-4) return null;
  const mat = matVach(mau, 1); mat.map = vfx.texTron;   // quad mềm mép (game: ô O_DAI của atlas)
  const m = new T.Mesh(new T.PlaneGeometry(1, 1), mat); m.renderOrder = 7;
  const mid = a.clone().add(b).multiplyScalar(.5), y = d.clone().divideScalar(L), z = new V3(), x = new V3(), M = new T.Matrix4();
  m.position.copy(mid); m.scale.set(day * 3, L * 1.15, 1);
  const dat = () => { z.copy(camPos()).sub(mid); z.addScaledVector(y, -z.dot(y)); if (z.lengthSq() < 1e-6) z.set(0, 1, 0); z.normalize(); x.crossVectors(y, z).normalize(); M.makeBasis(x, y, z); m.quaternion.setFromRotationMatrix(M); };
  dat();
  return vfx.them(m, song, (dt, u) => { dat(); m.material.opacity = 1 - u; });
}
/** VetCheo: vệt chém chéo qua p (ngang ngẫu nhiên + lên 0,4..1) */
function vetCheo(p, h, dai, mau, day = .07, song = .3) {
  const ben = phaiCua(h.lengthSq() > 1e-6 ? h : nc.toi());
  const a = ben.multiplyScalar(RR(-1, 1)).add(new V3(0, RR(.4, 1), 0)).normalize().multiplyScalar(dai * .5);
  return vetThang(p.clone().add(a), p.clone().sub(a), mau, day, song);
}
// ChieuVe.HatBay: co của game là cỡ quầng mềm ⇒ khối voxel lấy ~0,3 cỡ đó để không che người
const hatBay = (p, v, mau, co, song) => vfx.hat(p, { so: 1, huong: v.clone(), loe: 0, toc: Math.max(.01, v.length()), mau, co: co * .3, song, trongLuc: 0, can: 2, dat: false });
const tiaLua = (p, n, mau, toc = 9) => vfx.hat(p, { so: Math.min(120, n), toc, mau, co: .11, song: .32, trongLuc: 10, can: 2 });
function noLon(p, r, mau) {
  quangNo(p, r * .6, mau, .35); quangNo(p, r * .22, TRANG, .14);
  songXung(p, r * 1.3, mau, .45);
  tiaLua(p, Math.round(16 + r * 6), mau, 6 + r * 2);
  DK.rung(.3 + r * .14);
}
/** Khoi: khói u minh — quầng tối + vòng sóng + hạt tím / tím tối bay lên */
function khoi(chan, r) {
  quangNo(chan.clone().add(new V3(0, 1, 0)), Math.max(.5, r * .6), TIM_TOI, .35);
  songXung(chan.clone().add(new V3(0, .06, 0)), r, TIM, .45);
  const n = DK.clamp(Math.round(r * 5), 4, 18);
  for (let k = 0; k < n; k++) {
    const o = new V3(RR(-r, r) * .6, RR(.2, 1.8), RR(-r, r) * .6);
    hatBay(chan.clone().add(o), new V3(RR(-.6, .6), RR(.6, 1.6), RR(-.6, .6)), (k & 1) === 0 ? TIM_TOI : TIM, RR(.25, .5), RR(.5, .9));
  }
}

/** VFXThamSoChay.TroiNhe(mau, manh, giayThat): gọi chồng ⇒ giữ cái MẠNH hơn (bằng nhau ⇒ cái sau thay).
 *  Game là Volume ngả màu (trọng số manh) — vfx.troi pha thẳng màu trời ⇒ hạ 0,6 cho gần độ ngả của game. */
let troiCu = null;
function troiNhe(mau, manh, giayThat) {
  if (troiCu && DK.now < troiCu.het && troiCu.manh > manh) return;
  troiCu = { manh, het: DK.now + THAT(giayThat) };
  vfx.troi(mau, THAT(giayThat), manh * .6);
}

// ---------------------------------------------------------------- người khối (BongGia.VeNguoi): lõi tối đặc + vỏ tím cộng sáng
const VI = [[0, 1.58, 0], [0, 1.02, 0], [.37, 1.02, 0], [-.37, 1.02, 0], [.12, .38, 0], [-.12, .38, 0]];
const CO = [[.44, .44, .44], [.46, .68, .26], [.2, .66, .2], [.2, .66, .2], [.22, .76, .22], [.22, .76, .22]];
const HOP1 = new T.BoxGeometry(1, 1, 1); HOP1.giu = true;
function taoNguoi(loi, vo) {
  const g = new T.Group();
  const mLoi = new T.MeshBasicMaterial({ color: vfx.mau(loi), transparent: true, opacity: .72, depthWrite: false });
  const mVo = vfx.matCong(vo, .22);
  for (let i = 0; i < VI.length; i++) {
    const a = new T.Mesh(HOP1, mLoi); a.position.fromArray(VI[i]); a.scale.fromArray(CO[i]); g.add(a);
    const b = new T.Mesh(HOP1, mVo); b.position.fromArray(VI[i]); b.scale.fromArray(CO[i]).multiplyScalar(1.12); b.renderOrder = 7; g.add(b);
  }
  return { g, dat(chan, huong, k) { g.position.copy(chan); const h = ngang(huong); g.rotation.y = Math.atan2(h.x, h.z); mLoi.opacity = .72 * k; mVo.opacity = .22 * k; g.visible = k > .01; } };
}
/** BongGia.VeTam: bóng thoáng qua tại chỗ, mờ dần trong `dai` giây */
function veTam(chan, huong, dai, mau) {
  const n = taoNguoi(mau, TIM); n.dat(chan, huong, 1);
  return vfx.them(n.g, Math.max(.05, dai), (dt, u) => n.dat(chan, huong, 1 - u));
}

// ---------------------------------------------------------------- ẨN THÂN người chơi (AnThanNguoiChoi)
const AN = { tHet: -1, tGiu: -1, tLo: -1, k: 0, aApDung: 1 };
const dangAn = () => DK.now < AN.tHet;
const dangGiu = () => DK.now < AN.tGiu;
function datAn(giayThat) { if (DK.now < AN.tLo) return; AN.tHet = Math.max(AN.tHet, DK.now + THAT(giayThat)); }
const giuAn = giayThat => { AN.tGiu = Math.max(AN.tGiu, DK.now + THAT(giayThat)); };
function thoiAn() { AN.tHet = -1; AN.tGiu = -1; }
function hinhNc(a) {
  if (Math.abs(a - AN.aApDung) < .005) return;
  AN.aApDung = a; vfx.trong(nc, a);
  // thân như kính tím (game: vẽ hai bản lưới cộng sáng tím / lam lệch nhau, tắt Renderer gốc)
  if (nc.mat && nc.mat.emissive) nc.mat.emissive.setRGB(.25 * (1 - a), .15 * (1 - a), .45 * (1 - a));
}
DK.moiKhung(dt => {
  const an = dangAn();
  AN.k = an ? Math.min(1, AN.k + dt / NHIP * 6) : 0;
  hinhNc(an ? .5 - .32 * AN.k : 1);
});
// đòn trực tiếp của người chơi làm lộ (trừ độc / trạng thái, trừ lúc giữ ẩn); giết lúc đang ẩn ⇒ ẩn lại 2,5 s thật
DK.nghe('trung', x => {
  if (!x || !x.op || (x.op.nguon && x.op.nguon !== nc) || x.dich === nc) return;
  const an = dangAn(), giu = dangGiu();
  if (!x.op.asDoc && !giu && an) thoiAn();
  if ((an || giu) && x.dich.mau <= 0) { AN.tLo = -1; datAn(2.5); quangNo(nguc(nc), .8, TIM, .3); }
});
// hệ số đòn đầu từ bóng tối: +30 %, nhánh U Ảnh của Ẩn Ảnh +60 %
const nhanhCua = maChieu => { const S = DK.chon; return S && S.tang >= 3 && S.nhanh ? (S.nhanh[maChieu] || null) : null; };
const heSoBongToi = () => !dangAn() ? 1 : (nhanhCua('an_anh') === 'u_anh' ? 1.6 : 1.3);

// ---------------------------------------------------------------- hệ số tầng + trạng thái tầng (CongPhapVuKhi — game tự nhân/gắn cho mọi đòn của chiêu)
const TEN_TT = { giap_vo: 'Giáp vỡ', cham: 'Chậm', choang: 'Choáng', an_than: 'Ẩn', doc: 'Độc' };
function boDL() { return DL.CONG_PHAP.find(b => b.ma === MA); }
function thongTin(ch, tang, nh) {
  const td = ch.tang[Math.min(tang, ch.tang.length) - 1] || {}; const n = nh ? ch.nhanh.find(x => x.ma === nh) : null;
  let k = td.he_so > 0 ? td.he_so : 1; if (n && n.so_mod && n.so_mod.he_so > 0) k *= n.so_mod.he_so;
  let tt = td.trang_thai && td.trang_thai.ma && td.trang_thai.giay > 0 && !td.trang_thai.ban_than ? td.trang_thai.ma : null;
  if (n && n.so_mod && n.so_mod.trang_thai) tt = n.so_mod.trang_thai;
  return { heSo: k, tt: tt ? (TEN_TT[tt] || tt) : null };
}
// MaChieuWeb: đòn đến sau (bóng giả nổ, kim còn bay) vẫn gắn theo chiêu vừa thi trong 8 s thật
let ganChieu = null;
function ganHienTai() { return ganChieu && DK.now - ganChieu.t < THAT(8) ? ganChieu : null; }
/** ChieuDanh.Trung của người chơi: manh × hệ số tầng (+ nhánh), gắn trạng thái tầng */
function danh(d, manh, op = {}) {
  if (!d) return;
  const g = ganHienTai(); const tt = g ? g.tt : null;
  DK.trung(d, { nguon: nc, st: manh * (g ? g.heSo : 1), mau: op.mau || TIM, day: op.lui || 0, hat: op.len || 0, trangThai: tt || undefined });
}

// ---------------------------------------------------------------- LỚP VFX CHUNG theo tầng (CongPhapVuKhi.PhatVFXTang → VFXThamSo.Phat) — gần đúng
const KIEU_TRAN = { kiem_khi: 15, vong: 6, ho_no: 5, dai: 5, hat: 24 };
function lopChung(ctx) {
  const tang = ctx.tang; if (tang < 2) return;
  const ch = ctx.ch, g = ch.vfx_goc; if (!g || !g.kieu) return;
  const vt = (ch.tang[tang - 1] || {}).vfx_tang || {}; const n = ctx.nhanh && tang >= 3 ? ch.nhanh.find(x => x.ma === ctx.nhanh) : null; const nm = n ? n.vfx_mod || {} : null;
  const kieu = nm && nm.kieu ? nm.kieu : g.kieu;
  const mau = new T.Color(nm && nm.mau ? nm.mau : g.mau || '#9a6aff').convertSRGBToLinear();
  let kich = (vt.kich_thuoc_nhan || 1) * (nm && nm.kich_thuoc_nhan > 0 ? nm.kich_thuoc_nhan : 1);
  const so = Math.min(KIEU_TRAN[kieu] || 8, Math.max(1, Math.round(g.soLuong * (vt.so_luong_nhan || 1) * (nm && nm.so_luong_nhan > 0 ? nm.so_luong_nhan : 1))));
  const lop = new Set([].concat(g.lop || [], vt.lop || [], nm ? nm.lop || [] : []));
  const R = Math.max(.1, g.banKinh) * kich, L = Math.max(.2, g.dai) * kich, W = Math.max(.05, g.rong) * kich, toc = Math.max(.5, g.tocDo), tg = Math.max(.05, g.thoiGian);
  const duChan = lop.has('du_chan'), hat = lop.has('hat') || lop.has('vet_sang'), vet = lop.has('vet') || lop.has('vet_sang'), cuc = lop.has('hoa_canh');
  const truoc = nc.toi(), goc = nc.pos.clone();
  // kiểu bay ra (kiem_khi / dai? không — chỉ kiem_khi, dai, trang) đi từ người; nổ tại chỗ đặt ở mục tiêu / 4 m trước mặt
  const tuNguoi = kieu === 'kiem_khi' || kieu === 'dai' || kieu === 'trang';
  const diem = tuNguoi ? goc : (ctx.dich ? ctx.dich.pos.clone() : goc.clone().addScaledVector(truoc, 4));
  let Tg;
  if (kieu === 'kiem_khi') {
    Tg = L / toc + (duChan ? .45 : .15);
    const quat = g.goc > 0 ? g.goc : Math.min(70, 12 * (so - 1));
    for (let i = 0; i < so; i++) {
      const lech = so === 1 ? 0 : -quat / 2 + quat * i / (so - 1), dir = xoayY(truoc, lech);
      const tu = diem.clone().add(new V3(0, 1.1, 0));
      vfx.cung(tu, dir, { bk: W * .5, goc: 110, mau, song: L / toc, bay: toc, day: W * .35 });
      if (duChan) DK.sau(L / toc, () => { const cuoi = tu.clone().addScaledVector(dir, L); songXung(cuoi, 1.4 * W * 1.25, mau, .35, UP); if (hat) vfx.hat(cuoi, { so: 10, mau, toc: 4, co: .07 * kich, song: .35 }); });
    }
  } else if (kieu === 'hat') {
    Tg = Math.max(tg, .8) * 1.4;
    const tam = diem.clone().add(new V3(0, .88, 0));
    vfx.chop(tam, { co: .8 + R * .4, mau: TRANG, song: .18 });
    vfx.quang(tam, { co: .6 * kich * 2, mau, song: Tg, op: .5, tat: true });
    if (lop.has('xoay')) vfx.vong(diem, { bk0: R * 1.1, bk1: R * 1.1, mau, song: Tg, day: .3, op: .5 });
    vfx.hat(tam, { so: Math.min(60, so * 24), mau, toc: 1.2, co: .12 * W, song: Math.max(.8, tg), trongLuc: -1, can: .5, lech: R * .5 });
  } else if (kieu === 'vong') {
    Tg = tg + (duChan ? .45 : 0);
    for (let i = 0; i < so; i++) DK.sau(i * .12, () => vfx.vong(diem, { bk0: .2, bk1: R * (1 + .22 * i), mau, song: tg * .9, day: .3 }));
    if (hat) vfx.hat(diem.clone().add(new V3(0, .1, 0)), { so: 30, mau, toc: 2.5, co: .07 * kich, song: .45, lech: R * .5, trongLuc: -1 });
    if (duChan) DK.sau(tg * .54, () => vfx.vong(diem, { bk0: .3, bk1: R * 1.35, mau, song: tg * .9, day: .3, op: .55 }));
  } else if (kieu === 'ho_no') {
    Tg = tg * 4 + .3;
    vfx.chop(diem.clone().add(new V3(0, R * .4, 0)), { co: R * 1.6, mau: TRANG, song: tg * .25 });
    quangNo(diem.clone().add(new V3(0, R * .45, 0)), R * .8, mau, tg);
    vfx.vong(diem, { bk0: .1, bk1: R * 1.5, mau, song: tg, day: .4 });
    vfx.hat(diem.clone().add(new V3(0, .3, 0)), { so: Math.round(30 * kich), mau, toc: 4 * Math.sqrt(R), co: .09 * kich, song: .7, trongLuc: 7, can: 1.2 });
    DK.rung((lop.has('rung_may') ? .35 : .16) * DK.clamp(kich, .8, 1.6));
    if (duChan) DK.sau(tg * 1.1, () => { vfx.vong(diem, { bk0: .2, bk1: R * 2, mau, song: .5, day: .4 }); quangNo(diem.clone().add(new V3(0, R * .5, 0)), R * .9, mau, tg); });
  } else if (kieu === 'dai') {
    Tg = tg + (duChan ? .45 : 0);
    const quet = g.goc > 0 ? g.goc : 180, tam = diem.clone().add(new V3(0, 1.1, 0));
    for (let i = 0; i < so; i++) {
      const ng = so === 1 ? 0 : -18 + 36 * i / (so - 1);
      vfx.cung(tam, truoc, { bk: Math.max(.1, R * (1 + .12 * i) - W), goc: Math.min(340, quet), nghieng: ng, mau, song: tg, day: W });
    }
    if (duChan) DK.sau(tg * .55, () => vfx.cung(tam, truoc, { bk: R * 1.1, goc: 22, mau, song: .5, bay: 12, day: .5 }));
  } else Tg = tg;
  // cảm giác lúc phát: rung (rung_may) · trời đổi màu (mau_troi) · chữ: kịch bản tay đã hiện tên ⇒ game bỏ (d.ten = null)
  if (lop.has('rung_may') || lop.has('rung') || g.rungMay) DK.rung((cuc ? .6 : .32) * DK.clamp(kich, .8, 1.5), .3);
  if (lop.has('mau_troi') || vt.doi_mau_troi > 0) troiNhe(mau, cuc ? .55 : .3, Tg + .6);
}

// ---------------------------------------------------------------- bắt đầu một chiêu (chung)
function batDau(ctx, i) {
  const nh = ctx.tang >= 3 ? ctx.nhanh : null;        // TienDoCongPhap.NhanhHieuLuc: chỉ hiệu lực từ Đại Thành (TANG_CHON_NHANH = 3)
  const tt = thongTin(ctx.ch, ctx.tang, nh);
  ganChieu = { t: DK.now, heSo: tt.heSo, tt: tt.tt, i };
  return nh;
}

// ================================================================ Z · ẨN ẢNH
function anAnh(ctx) {
  const nh = batDau(ctx, 0), tang = ctx.tang;
  ctx.phat('NIEM_0');
  let giay = 2.6 + .4 * (tang - 1);                    // giây thật: 2,6 · 3,0 · 3,4 · 3,8 · 4,2
  if (tang >= 5) giay *= 1.5;
  if (nh === 'u_anh') giay *= 1.5; else if (nh === 'yen_vu') giay *= .7;
  const p = nc.pos.clone();
  khoi(p, 1.4);
  ctx.sau(.12, () => {
    datAn(giay);
    quangNo(nguc(nc), .9, TIM, .25);
    if (tang < 3 && nh !== 'yen_vu') return;
    // Đại Thành: vòng khói u minh — chậm; Hoá Cảnh thêm choáng 0,6; Yên Vụ: khói độc 5 m (chậm 3 s + độc 3/s × 4 s)
    const r = nh === 'yen_vu' ? 5 : tang >= 5 ? 6 : 4;
    khoi(p, r);
    songXung(p.clone().add(new V3(0, .08, 0)), r * .7, LUC, .6);
    for (const o of DK.trongTron(p, r - .35)) {
      DK.chuNoi(tang >= 5 ? 'Chậm · Choáng' : 'Chậm', o.diem('dau').add(new V3(0, .8, 0)), '#c9a8ff');
      if (nh === 'yen_vu') docNgam(o, 3, 4, tang);
    }
  });
  lopChung(ctx);
}

// ================================================================ X · BỐI THỨ
function boiThu(ctx) {
  const nh = batDau(ctx, 1), tang = ctx.tang, d = ctx.dich;   // game: khoá ⇒ nó; không ⇒ địch gần nhất trong quạt 120° tầm max(6, 14) m
  const goc0 = nc.pos.clone();
  const hsBong = heSoBongToi();
  const MANH = 70;
  ctx.phat('CHIEU_1');
  lopChung(ctx);
  if (!d) {
    // không mục tiêu: chớp tới 6 m, đâm quạt hẹp 2,6 m 70°
    const h = nc.toi(), den = goc0.clone().addScaledVector(h, 6);
    khoi(goc0, 1);
    ctx.sau(.1, () => { dichToi(nc, den); khoi(den, .9); });
    ctx.sau(.22, () => {
      for (const o of DK.trongNon(nc, 2.6, 70)) danh(o, MANH * hsBong, { lui: .4 });
      vetCheo(nguc(nc).addScaledVector(h, 1.4), h, 1.8, TIM);
    });
    return;
  }
  giuHuong(d);
  const kc = BK + BK + .45;
  const sau0 = sauLung(d, kc);
  // báo trước: khói loé sau lưng mục tiêu
  quangNo(sau0.clone().add(UP), .6, TIM_TOI, .22);
  khoi(goc0, 1.1);
  ctx.sau(.1, () => {
    const sau = sauLung(d, kc);
    dichToi(nc, sau); nc.ngam(d.pos);
    khoi(sau, .9);
  });
  ctx.sau(.22, () => {
    const lung = oSauLung(d, nc.pos);
    const st = MANH * (lung ? (tang >= 5 ? 3 : 2.5) : 1) * hsBong;
    const h = ngang(d.pos.clone().sub(nc.pos));
    danh(d, st, { lui: .4 });
    const nd = nguc(d);
    vetThang(nguc(nc).addScaledVector(h, .3), nd.clone().addScaledVector(h, .9), TIM, .1, .28);
    quangNo(nd, .8, TIM, .2);
    tiaLua(nd, 10, TIM, 6);
    DK.rung(.12);
  });
  // Đại Thành: Song Ảnh — bóng thứ hai đâm từ phía trước (40 %); Hoá Cảnh thêm bóng thứ ba từ bên hông
  if (tang >= 3) {
    ctx.sau(.34, () => bongDam(d, matCua(d), MANH * .4 * hsBong));
    if (tang >= 5) ctx.sau(.42, () => bongDam(d, phaiCua(matCua(d)), MANH * .4 * hsBong));
  }
  // nhánh Ảnh Hoàn: lùi về chỗ cũ trong bóng tối, ẩn 1,5 s thật
  if (nh === 'anh_hoan') ctx.sau(.48, () => { khoi(nc.pos.clone(), .9); dichToi(nc, goc0); khoi(goc0, .9); datAn(1.5); });
}
function bongDam(d, phia, manh) {
  const p = quanhDich(d, phia, BK + .9);
  const h = ngang(d.pos.clone().sub(p));
  veTam(p, h, .45, TIM_TOI);
  vetThang(p.clone().add(new V3(0, 1.2, 0)), nguc(d), TIM_TOI, .09, .3);
  danh(d, manh);
  quangNo(nguc(d), .6, TIM, .18);
}

// ================================================================ C · ĐỘC CHÂM
function docCham(ctx) {
  const nh = batDau(ctx, 2), tang = ctx.tang;
  let so = tang >= 3 ? 5 : 3, quat = tang >= 3 ? 26 : 18, manh = 15, docDps = 8, r = .3, co = 1;
  let xuyen = false; const duoi = tang >= 5, suong = tang >= 3;
  if (nh === 'van_doc') { so = tang >= 5 ? 9 : 7; quat = 60; }
  else if (nh === 'thuc_cot') { so = 1; quat = 0; xuyen = true; docDps *= 2; r = .5; co = 2.2; }
  const hsBong = heSoBongToi();
  if (dangAn()) giuAn(.9);                              // ném không làm lộ hình
  // HuongNgam: ngực → ngực (ngang nếu mục tiêu đứng đất)
  const dich = ctx.dich;
  const h = dich ? ngang(nguc(dich).sub(nguc(nc))) : nc.toi();
  ctx.phat('XUAT_2');
  lopChung(ctx);
  ctx.sau(.18, () => {
    const tu = nguc(nc).addScaledVector(nc.toi(), .5);
    for (let k = 0; k < so; k++) {
      const g = so <= 1 ? 0 : -quat * .5 + quat * k / (so - 1);
      kimDoc(tu, xoayY(h, g), manh * hsBong, docDps, r, co, xuyen, duoi ? dich : null, suong, tang);
    }
    quangNo(tu, .4, LUC, .15);
  });
}
/** KimDoc: bay thẳng 40 m/s, tầm 22 m; Hoá Cảnh đuổi mục tiêu (quay 6 rad/s); trúng ⇒ sát thương + ngấm độc; Đại Thành nổ sương độc 2 m */
function kimDoc(tu, huong, manh, dps, r, co, xuyen, duoi, suong, tang) {
  const pos = tu.clone(), truoc = tu.clone(), vel = huong.clone().normalize().multiplyScalar(40); let conLai = 22;
  const thu = [];
  const g = new T.Group();
  const than = new T.Mesh(HOP1, vfx.matThuong(LUC, .95));   // game cộng sáng; nền sáng ⇒ pha thường để còn sắc lục than.scale.set(.035 * co, .035 * co, .5 * co); g.add(than);
  const dau = new T.Mesh(HOP1, vfx.matThuong(TIM, .95)); dau.scale.set(.06 * co, .06 * co, .1 * co); dau.position.z = .26 * co; g.add(dau);
  const Z = new V3(0, 0, 1);
  const datHinh = () => { g.position.copy(pos); g.quaternion.setFromUnitVectors(Z, vel.clone().normalize()); };
  datHinh();
  vfx.them(g, 3, dt => {
    if (duoi && DK.dsBuNhin.indexOf(duoi) >= 0) {
      // Vector3.RotateTowards(vel, muon, 6·dt, 0)
      const muon = nguc(duoi).sub(pos).normalize(), v0 = vel.clone().normalize();
      const goc = v0.angleTo(muon), buoc = Math.min(goc, 6 * dt);
      if (goc > 1e-4) { const truc = new V3().crossVectors(v0, muon); if (truc.lengthSq() < 1e-10) truc.set(0, 1, 0); truc.normalize(); vel.applyAxisAngle(truc, buoc); }
    }
    truoc.copy(pos); pos.addScaledVector(vel, dt); conLai -= vel.length() * dt;
    let het = false;
    for (const o of DK.dsBuNhin) {
      if (het || thu.indexOf(o) >= 0) continue;
      const p1 = o.pos.clone().add(new V3(0, .3, 0)), p2 = o.pos.clone().add(new V3(0, 1.8 * .85, 0)), giua = p1.clone().add(p2).multiplyScalar(.5);
      const kc = Math.min(kcDoan(p1, truoc, pos), kcDoan(p2, truoc, pos), kcDoan(giua, truoc, pos));
      if (kc > r + BK) continue;
      thu.push(o);
      const nd = nguc(o);
      danh(o, manh, { mau: LUC });
      docNgam(o, dps, 5, tang);
      quangNo(nd, .45 * co, LUC, .16);
      if (suong) suongDoc(o.pos.clone(), dps, tang, thu);
      if (!xuyen) het = true;
    }
    if (het || conLai <= 0 || pos.y < .03) return false;
    datHinh();
    if (Math.random() < .25) hatBay(pos, vel.clone().multiplyScalar(-.02), DOC, .12 * co, .3);
  });
}
function suongDoc(tam, dps, tang, thu) {
  quangNo(tam.clone().add(new V3(0, .8, 0)), 1.4, DOC, .5);
  for (let k = 0; k < 6; k++) hatBay(tam.clone().add(new V3(RR(-1.5, 1.5), RR(.2, 1.4), RR(-1.5, 1.5))), new V3(0, RR(.3, .8), 0), (k & 1) === 0 ? DOC : TIM, .4, .9);
  for (const o of DK.dsBuNhin) { if (thu.indexOf(o) >= 0 || o.pos.distanceTo(tam) > 2) continue; docNgam(o, dps * .5, 4, tang); }
}
/** DocNgam: đốt máu mỗi 0,5 s web (dps × lớp × 0,5), cộng dồn ≤ 3 lớp, không làm lộ; Hoá Cảnh đủ 3 lớp ⇒ nổ độc 3 m (40) rồi về 1 lớp.
 *  Game nhân dps với hệ số tầng của CHIÊU ĐỘC CHÂM (cả khi độc đến từ Yên Vụ của Ẩn Ảnh). */
const dsDoc = [];
function docNgam(dich, dps, giay, tang) {
  if (!dich || dps <= 0) return;
  const S = DK.chon, ch = boDL().chieu[2];
  dps *= thongTin(ch, S ? Math.min(S.tang, 5) : 1, nhanhCua('doc_cham')).heSo;
  for (const d of dsDoc) {
    if (d.het || d.dich !== dich) continue;
    d.lop = Math.min(3, d.lop + 1); d.dps = Math.max(d.dps, dps); d.tHet = DK.now + giay; d.tang = Math.max(d.tang, tang);
    if (d.lop >= 3 && d.tang >= 5) noDoc(d);
    return;
  }
  dsDoc.push({ dich, dps, tHet: DK.now + giay, nhip: 0, lop: 1, tang, het: false });
}
function noDoc(d) {
  d.lop = 1;
  const tam = d.dich.pos.clone();
  noLon(tam.clone().add(UP), 1.6, DOC);
  songXung(tam.clone().add(new V3(0, .06, 0)), 3, TIM, .5);
  for (const o of DK.trongTron(tam, 3 - .35)) DK.trung(o, { nguon: nc, st: 40, mau: DOC, khongPhanUng: true, asDoc: true });
}
DK.moiKhung(dt => {
  for (let i = dsDoc.length - 1; i >= 0; i--) {
    const d = dsDoc[i];
    if (d.het || DK.dsBuNhin.indexOf(d.dich) < 0 || DK.now >= d.tHet) { dsDoc.splice(i, 1); continue; }
    d.nhip += dt;
    while (d.nhip >= .5) {
      d.nhip -= .5;
      DK.trung(d.dich, { nguon: nc, st: d.dps * d.lop * .5, mau: DOC, khongPhanUng: true, asDoc: true });
      const nd = nguc(d.dich);
      hatBay(nd.clone().add(new V3(RR(-.25, .25), RR(-.3, .3), RR(-.25, .25))), new V3(0, RR(.4, .9), 0), DOC, .18 + .05 * d.lop, .7);
      hatBay(nd.clone().add(new V3(RR(-.25, .25), RR(-.3, .3), RR(-.25, .25))), new V3(0, RR(.4, .9), 0), TIM, .15 + .05 * d.lop, .7);
    }
  }
});

// ================================================================ V · ẢO ẢNH PHÂN THÂN
function aoAnh(ctx) {
  const nh = batDau(ctx, 3), tang = ctx.tang;
  const goc0 = nc.pos.clone(), h = ctx.dich ? ngang(ctx.dich.pos.clone().sub(nc.pos)) : nc.toi();
  const ben = phaiCua(h), phia = Math.random() < .5 ? 1 : -1;
  const den = goc0.clone().addScaledVector(ben, phia * 3);
  const song = nh === 'kinh_hoa' ? 8 : 4, mau = nh === 'kinh_hoa' ? 300 : 150;
  const no = nh !== 'kinh_hoa', lao = nh === 'anh_bao';
  const rNo = 3 * (tang >= 3 ? 1.25 : 1) * (nh === 'anh_bao' ? 1.2 : 1);
  ctx.phat('LUOT_TRAI');
  taoBong(goc0, h, song, mau, no, lao, rNo, 60, tang >= 5);
  if (tang >= 3) taoBong(goc0.clone().addScaledVector(ben, -phia * 1.8), h, song, mau, no, lao, rNo, 60, tang >= 5);
  if (tang >= 5) {
    taoBong(goc0.clone().addScaledVector(h, 1.8), h, song, mau, no, lao, rNo, 60, true);
    taoBong(goc0.clone().addScaledVector(h, -1.8), h, song, mau, no, lao, rNo, 60, true);
  }
  khoi(goc0, 1.2);
  ctx.sau(.06, () => { diToi(nc, den, .14, 'o'); datAn(1.5); });
  ctx.sau(.24, () => khoi(nc.pos.clone(), .8));
  lopChung(ctx);
}
/** KichBanChieuWeb.DiToi: dời người tới `den` trong tg giây theo ease */
function diToi(nv, den, tg, ease) {
  const tu = nv.pos.clone();
  DK.lap((dt, tl) => { const u = Math.min(1, tl / Math.max(.01, tg)); nv.pos.lerpVectors(tu, den, DK.ease(ease || 'io', u)); return u < 1; });
}
/** BongGia: bóng giả (người khối tím đen nhấp nháy) — hết giờ / vỡ ⇒ nổ bóng tối (trừ Kính Hoa). Ảnh Bạo: lao vào kẻ gần nhất, nổ sau 1,2 s.
 *  Hoá Cảnh: mỗi 1 s tự đâm kẻ gần nhất trong 2,5 m (15). Bù nhìn không đánh ⇒ không thấy được phần "hút đòn". */
const dsBong = [];
function taoBong(p, huong, songWeb, mau, no, lao, rNo, manhNo, dam) {
  const b = { pos: p.clone(), huong: ngang(huong), mau, tSinh: DK.now, tHet: DK.now + (lao ? 1.2 : songWeb), no, lao, rNo, manhNo, dam, tDam: DK.now, chet: false, id: Math.random() * 100 };
  b.hinh = taoNguoi(TIM_TOI, TIM);
  dsBong.push(b);
  b.x = vfx.them(b.hinh.g, (lao ? 1.2 : songWeb) + 1, (dt) => capBong(b, dt));
  return b;
}
function ganNhat(p, r) { let tot = null, kc = r; for (const o of DK.dsBuNhin) { const d = Math.hypot(o.pos.x - p.x, o.pos.z - p.z); if (d <= kc) { kc = d; tot = o; } } return tot; }
function capBong(b, dt) {
  if (b.chet) return false;
  const now = DK.now;
  if (b.lao && now - b.tSinh > .3) {
    const d = ganNhat(b.pos, 14);
    if (d) { const v = d.pos.clone().sub(b.pos); v.y = 0; const L = v.length(); if (L > 1) { b.huong = v.divideScalar(L); b.pos.addScaledVector(b.huong, Math.min(L - .9, 9 * dt)); } }
  }
  if (b.dam && now - b.tDam > 1) {
    b.tDam = now;
    const d = ganNhat(b.pos, 2.5 + BK);
    if (d) {
      const h = d.pos.clone().sub(b.pos); h.y = 0; if (h.lengthSq() > 1e-6) b.huong = h.normalize();
      danh(d, 15);
      vetThang(b.pos.clone().add(new V3(0, 1.25, 0)), nguc(d), TIM, .06, .2);
    }
  }
  if (now >= b.tHet) { ketBong(b, true); return false; }
  const k = DK.clamp((now - b.tSinh) / .15, 0, 1) * DK.clamp((b.tHet - now) / .3, 0, 1);
  const nhay = .75 + .25 * Math.sin(now / NHIP * 23 + b.id);
  b.hinh.dat(b.pos, b.huong, k * nhay);
}
function ketBong(b, coNo) {
  if (b.chet) return; b.chet = true;
  const i = dsBong.indexOf(b); if (i >= 0) dsBong.splice(i, 1);
  if (coNo && b.no) {
    const tam = b.pos.clone().add(new V3(0, .9, 0));
    for (const o of DK.trongTron(tam, b.rNo - .35)) danh(o, b.manhNo, { lui: 1.2 });
    noLon(tam, b.rNo * .5, TIM_TOI);
    songXung(b.pos.clone().add(new V3(0, .06, 0)), b.rNo, TIM, .45);
    DK.rung(.1);
  } else quangNo(b.pos.clone().add(UP), .7, TIM_TOI, .3);
}

// ================================================================ R · U MINH TUYỆT SÁT
function uMinh(ctx) {
  const nh = batDau(ctx, 4), tang = ctx.tang;
  let soNhat = 6, toiDa = 6, manh = 26, r = 16;
  if (nh === 'tuyet_anh') soNhat += 2;
  else if (nh === 'u_vuc') { soNhat += 4; toiDa = 10; r *= 1.25; }
  if (tang >= 5) soNhat = Math.max(soNhat + 3, 9);
  soNhat += tieuSatY();
  manh *= heSoBongToi();
  // gom đích
  let ds = [];
  if (nh === 'tuyet_anh' && ctx.dich) ds.push(ctx.dich);
  else {
    const p0 = nc.pos.clone();
    ds = DK.dsBuNhin.filter(o => o.pos.distanceTo(p0) <= r).sort((a, b) => a.pos.distanceTo(p0) - b.pos.distanceTo(p0));
    if (ctx.dich && ds.indexOf(ctx.dich) >= 0) { ds.splice(ds.indexOf(ctx.dich), 1); ds.unshift(ctx.dich); }
    if (ds.length > toiDa) ds.length = toiDa;
  }
  const nhip = Math.min(.22, 1.5 / Math.max(1, soNhat));
  const tCuoi = .15 + soNhat * nhip + .05;
  const giayThat = (tCuoi + .3) / NHIP;
  ctx.phat('CHIEU_3');
  // biến mất: ẩn + giữ ẩn (đòn chém không làm lộ) + bất tử suốt chuỗi
  khoi(nc.pos.clone(), 1.6);
  datAn(giayThat + .4);
  giuAn(giayThat + .2);
  if (tang >= 4) {
    troiNhe(SRGB(.2, .06, .36), tang >= 5 ? .6 : .3, giayThat + 1.2);
    vfx.chu(tang >= 5 ? 'U Minh Quỷ Vực' : 'U Minh Tuyệt Sát', { mau: '#996bff', song: 1.6 });
    DK.rung(.16);
  }
  lopChung(ctx);   // game gọi PhatVFXTang SAU kb.Thi ⇒ lớp chung (đổi trời theo màu vfx) đè lên trời U Minh
  if (!ds.length) {
    const h = nc.toi();
    ctx.sau(.2, () => {
      for (const o of DK.trongNon(nc, 5, 120)) danh(o, manh * 2);
      for (let k = 0; k < 3; k++) vetCheo(nguc(nc).addScaledVector(h, 2.5), h, 3.5, TIM, .1, .4);
    });
    ctx.sau(.5, () => ketThucUMinh(giayThat));
    return;
  }
  const cuoi = [null];
  for (let k = 0; k < soNhat; k++) { const idx = k; ctx.sau(.15 + k * nhip, () => nhatUMinh(ds, idx, manh, tang, cuoi)); }
  ctx.sau(tCuoi, () => nhatChot(ds, manh, tang, nh, cuoi));
  ctx.sau(tCuoi + .25, () => ketThucUMinh(giayThat));
}
const dichThu = (ds, k) => { for (let j = 0; j < ds.length; j++) { const o = ds[(k + j) % ds.length]; if (DK.dsBuNhin.indexOf(o) >= 0) return o; } return null; };
function nhatUMinh(ds, k, manh, tang, cuoi) {
  const d = dichThu(ds, k); if (!d) return;
  cuoi[0] = d;
  const huong = xoayY(new V3(0, 0, 1), k * 137.5);
  const p = quanhDich(d, huong, BK + BK + .6);
  const nd = nguc(d);
  quangNo(nd, .5, TIM_TOI, .12);                       // vệt tím loé sát thân trước nhát chém
  dichToi(nc, p);
  const h = ngang(d.pos.clone().sub(p));
  quayMat(nc, h);
  veTam(p, h, .2, TIM_TOI);
  danh(d, manh, { lui: .3 });
  vetCheo(nd, h, 2.2, TIM, .07, .3);
  tiaLua(nd, 6, TIM, 7);
  if (tang >= 3) vetCheo(nd.clone().add(new V3(0, RR(-.3, .5), 0)), h, 3, TIM_TOI, .12, .9);   // lưỡi bóng tối treo lại
  DK.rung(.05);
}
function nhatChot(ds, manh, tang, nh, cuoi) {
  const d = cuoi[0] && DK.dsBuNhin.indexOf(cuoi[0]) >= 0 ? cuoi[0] : dichThu(ds, 0); if (!d) return;
  const sau = sauLung(d, BK + BK + .45);
  dichToi(nc, sau);
  const h = ngang(d.pos.clone().sub(sau));
  quayMat(nc, h);
  khoi(sau, 1.1);
  const st = manh * 1.5;
  if (tang >= 3 || nh === 'u_vuc') {
    const r = nh === 'u_vuc' ? 5 : 4;
    for (const o of DK.trongTron(nguc(d), r)) danh(o, st, { lui: .8 });
    songXung(d.pos.clone().add(new V3(0, .9, 0)), r, TIM, .5);
    noLon(nguc(d), r * .45, TIM_TOI);
  } else danh(d, st, { lui: .8 });
  for (let k = 0; k < 2; k++) vetCheo(nguc(d), h, 3.2, TIM, .12, .5);
  DK.rung(tang >= 4 ? .22 : .14);
  if (tang >= 5) {
    // vết rạch "đen" xé ngang trời (game vẽ cộng sáng ⇒ thực ra là vạch tím tối mờ + lõi tím)
    const ng = phaiCua(h), tren = d.pos.clone().add(new V3(0, 9, 0));
    vetThang(tren.clone().addScaledVector(ng, -32).add(new V3(0, 3, 0)), tren.clone().addScaledVector(ng, 32).add(new V3(0, -3, 0)), TIM_TOI, .6, 1.4);
    vetThang(tren.clone().addScaledVector(ng, -30).add(new V3(0, 3, 0)), tren.clone().addScaledVector(ng, 30).add(new V3(0, -3, 0)), TIM, .18, 1.2);
  }
}
function ketThucUMinh(giayThat) {
  AN.tGiu = -1;                                         // AnThanNguoiChoi.ThoiGiu
  // vừa giết lúc ẩn ⇒ giữ ẩn; không thì hiện ra sau lưng kẻ cuối (bù nhìn không chết thật ⇒ luôn hiện)
  thoiAn();
}
/** Sát Ý (tài nguyên đạo lộ Sát Thủ — DaoLo): mỗi 25 thêm 1 nhát U Minh (≤ 3), tiêu luôn. HTML: đặt tay DK.anhSat.satY (mặc định 0). */
function tieuSatY() { const s = DK.anhSat.satY || 0; const n = Math.min(3, Math.floor(s / 25)); if (n > 0) DK.anhSat.satY -= n * 25; return n; }
DK.anhSat = { satY: 0, an: AN, dangAn, dsBong, dsDoc };

// ---------------------------------------------------------------- đặt lại
DK.nghe('datLai', () => {
  AN.tHet = AN.tGiu = AN.tLo = -1; AN.k = 0; AN.aApDung = -1; hinhNc(1);
  troiCu = null; dsDoc.length = 0; for (const b of dsBong) b.chet = true; dsBong.length = 0; ganChieu = null;
});

DK.dangKyBo(MA, {
  nguon: 'CongPhap/Bo/AnhSat.cs, CongPhap/AnThanNguoiChoi.cs, CongPhap/ChieuVe.cs, CongPhapVuKhi.cs (PhatVFXTang, GanChieuNguoiChoi), VFX/VFXThamSo*.cs',
  ghiChu: 'Theo CODE: Z ẩn 2,6+0,4/tầng s thật (JSON nói +0,5); Z/X/C/V KHÔNG tự đổi trời/hiện chữ ở Viên Mãn — chỉ R; trời + rung đến từ lớp VFX chung (PhatVFXTang, tầng ≥ 2), lớp này của Ẩn Ảnh / Ảo Ảnh nổ ở CHỖ MỤC TIÊU (lộ vị trí?). ' +
    'X: clip CHIEU_1 dài 1,43 s, thế đâm CHI_KIEM ở 0,83 s nhưng nhát đâm thật ở 0,22 s (lệch dáng ↔ đòn). V: luôn clip LUOT_TRAI dù lách trái hay phải (ngẫu nhiên); Hoá Cảnh không "hút kẻ địch vào tâm" như JSON. ' +
    'C: Hoá Cảnh không có "cổ trùng / lan độc" riêng — chỉ kim đuổi + nổ độc 3 lớp; độc của Yên Vụ (Z) cũng nhân hệ số tầng của Độc Châm. R: không có "mặt trăng tím" (lớp nguyệt chỉ vẽ ở kiểu trang); Sát Ý = DK.anhSat.satY (mặc định 0). ' +
    'Gần đúng: lớp VFX chung tầng ≥ 2 (VFXThamSo: hat/kiem_khi/ho_no/dai/vong) dựng tạm trong file này; thân "kính" = trong suốt + ánh tím; bóng giả không hút đòn (bù nhìn không đánh); bù nhìn bị khoá hướng lúc ra X (lõi tự quay mặt).',
  chieu: { an_anh: anAnh, boi_thu: boiThu, doc_cham: docCham, ao_anh: aoAnh, u_minh: uMinh },
});
})();
