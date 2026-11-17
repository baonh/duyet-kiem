"use strict";
// ============================================================================
// phap_bao.js — 2026-11-14 — PHÁP BẢO KIẾM cho phòng duyệt: Phi kiếm trận (Q) + ngự kiếm / cưỡi phi kiếm (F).
// Nguồn Unity (chỉ đọc): PhapBaoDanh/PhapBaoDanhMon1.cs (HCKiemTran), PhapBaoDanh.cs (MON[0], Tung),
//   Bay.cs (BatBay / BuocGoi / BuocCuoi / Xoay / NghiengNguoi / HaCanh), ThongSoBay.cs (VAT_CUOI[0] phi_kiem),
//   VatCuoi.cs (DungPhiKiem / HoatHinh / PhatHat / HieuUngGoi / Dai), DongTac/DongTacWeb.cs (nhánh Cuoi + TayBayKiem),
//   PhapBao.cs (DangDung, VanKiemQuyTong — không còn gọi từ phím).
// Mọi thời gian = giây MÔ PHỎNG (như Unity PhapBaoDanh.Now / Bay tSim).
// ============================================================================
(function () {
const DK = window.DK, T = DK.T, V3 = DK.V3, vfx = DK.vfx, D = DK.D;
const PB = DK.PB;
const TAU = Math.PI * 2;
const tien = DK.tien, clamp = DK.clamp;
const easeO = u => 1 - Math.pow(1 - u, 3);
const easeIO = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
const easeBat = x => { const c = 1.70158, a = x - 1; return 1 + (c + 1) * a * a * a + c * a * a; };
const R = (a, b) => a + Math.random() * (b - a);
const ngauCau = () => { const v = new V3(R(-1, 1), R(-1, 1), R(-1, 1)); return v.lengthSq() > 1e-6 ? v.normalize() : v.set(0, 1, 0); };

// ---------------------------------------------------------------- dọn khi đặt lại
const dsDon = [];   // hàm dọn (mesh ngoài vfx, trạng thái cưỡi)
DK.nghe('datLai', () => { for (const f of dsDon.splice(0)) try { f(); } catch (e) { console.error(e); } });

// ============================================================================
// 1) PHI KIẾM TRẬN (HCKiemTran) — 12 kiếm, vòng RV 2,3 m, 3 đợt ngắm 0,32 s rồi lao 36 m/s, đuổi nhẹ 0,22 s.
// ============================================================================
const KT = { N: 12, CO: 1, RV: 2.3, LAO: 36 };
const MAU_TRAN = new T.Color(1, .18, .28);            // BangPB.Tran(ta) — phe ta đỏ máu
// hình kiếm: HopPB(cỡ x,y,z, tâm x,y,z, màu) — mét, mũi +z (LookRotation)
let geoKT = null;
function hinhKiemTran() {
  if (geoKT) return geoKT;
  const hop = [
    [.06, .11, 1.25, 0, 0, .72, new T.Color(.95, .97, 1)],
    [.075, .045, 1.1, 0, 0, .66, MAU_TRAN],
    [.3, .07, .08, 0, 0, 0, MAU_TRAN],
    [.065, .065, .32, 0, 0, -.18, new T.Color(.12, .1, .13)],
  ];
  const ds = hop.map(h => { const g = new T.BoxGeometry(h[0], h[1], h[2]).toNonIndexed(); g.translate(h[3], h[4], h[5]); const n = g.attributes.position.count, c = new Float32Array(n * 3); for (let i = 0; i < n; i++) { c[i * 3] = h[6].r; c[i * 3 + 1] = h[6].g; c[i * 3 + 2] = h[6].b; } g.setAttribute('color', new T.BufferAttribute(c, 3)); return g; });
  let n = 0; for (const g of ds) n += g.attributes.position.count;
  const P = new Float32Array(n * 3), C = new Float32Array(n * 3); let o = 0;
  for (const g of ds) { P.set(g.attributes.position.array, o * 3); C.set(g.attributes.color.array, o * 3); o += g.attributes.position.count; }
  geoKT = new T.BufferGeometry(); geoKT.setAttribute('position', new T.BufferAttribute(P, 3)); geoKT.setAttribute('color', new T.BufferAttribute(C, 3)); geoKT.computeBoundingSphere(); geoKT.giu = true;
  return geoKT;
}
const nguc = b => b.diem('nguc');
// ReVe: xoay v về phía đích tối đa `goc` rad (giữ độ lớn)
function reVe(v, p, dich, goc) {
  const L = v.length(); if (L < 1e-5) return v;
  const a = v.clone().divideScalar(L), b = new V3().subVectors(dich, p); if (b.lengthSq() < 1e-6) return v; b.normalize();
  const g = a.angleTo(b); if (g < 1e-5) return v;
  const k = Math.min(1, goc / g); const q = new T.Quaternion().setFromUnitVectors(a, b); const q2 = new T.Quaternion().slerp(q, k);
  return a.applyQuaternion(q2).multiplyScalar(L);
}

PB.kiemTran = function (ctx) {
  const nv = ctx.nv;
  // 2026-11-14 — Unity: người chơi tung KHÔNG phát clip nào (chỉ bot gọi TUNG_PHAP_BAO); clip PB_KIEM_TRAN là của web, phát để thấy tay.
  if (!nv.dangCuoi) ctx.phat('PB_KIEM_TRAN', { khoaDi: false, khongMv: true });
  // mục tiêu: khoá hoặc gần nhất trong 60 m (PhapBaoDanh.Tung → TimDich 60)
  let dich = ctx.dich && ctx.dich.pos.distanceTo(nv.pos) <= 60 ? ctx.dich : null;
  if (dich) nv.ngam(dich.pos);
  const mau = MAU_TRAN;
  const mat = new T.MeshBasicMaterial({ vertexColors: true });
  const g = new T.Group();
  const K = [];
  const diemRa = () => nv.pos.clone().add(new V3(0, 1.35, 0)).addScaledVector(nv.toi(), -.25);
  let quay = Math.random() * TAU, tocQuay = 3, t = 0;
  const viTriQuy = (k) => { const th = quay + k / KT.N * TAU; return new V3(nv.pos.x - Math.cos(th) * KT.RV, nv.pos.y + 1.55 + Math.sin(th * 2 + quay) * .28, nv.pos.z + Math.sin(th) * KT.RV); };
  const a0 = diemRa();
  for (let k = 0; k < KT.N; k++) {
    const m = new T.Mesh(hinhKiemTran(), mat); m.visible = false; g.add(m);
    K.push({ m, trang: 1, t: 0, p: a0.clone(), pT: a0.clone(), v: new V3(), dir: new V3(0, 1, 0), dau: new V3(), xoay: new V3(), sang: 0, ngam: 0, dot: k % 3, thu: Math.floor(k / 3), tHat: 0 });
  }
  const q0 = nv.pos.clone().add(new V3(0, 1.4, 0));
  vfx.chop(q0, { co: 1.6 * 1.6, mau, song: .45 });                     // HinhPB.Quang(q, 1,6, mau, .45)
  vfx.vong(q0, { bk0: .4, bk1: 3.2, mau, song: .45, op: .6, cao: 0 });   // HinhPB.Vong(q, .4, 3.2, mau, .45, .6)

  const batVang = s => { s.trang = 6; s.t = 0; s.v = s.dir.clone().multiplyScalar(-R(6, 10)); s.v.y += R(5, 9); s.v.x += R(-4, 4); s.v.z += R(-4, 4); s.xoay = ngauCau(); };
  const kiemTrung = (s, den) => {
    const cuoi = s.dot === 2 && s.thu === 3;
    if (DK.cheDoBuNhin === 'do' && den.la === 'bu_nhin') {   // KetQuaPB.Do ⇒ kiếm bật văng
      DK.trung(den, { st: 26, nguon: nv, mau: '#' + mau.getHexString() });
      batVang(s); vfx.hat(s.p, { so: 12, toc: 8, mau: new T.Color(1, .85, .4), co: .06, song: .4 });
      return;
    }
    DK.trung(den, { st: 26, nguon: nv, mau: '#' + mau.getHexString(), day: cuoi ? 2.2 : 0, hat: cuoi ? .3 : 0 });
    s.trang = 5; s.t = 0;
    vfx.chop(s.p, { co: .9 * 1.6, mau, song: .25 });
    vfx.hat(s.p, { so: 12, toc: 7, mau, co: .07, song: .5 });
    vfx.hat(s.p, { so: 6, toc: 4, mau: 0xffffff, co: .05, song: .3 });
  };
  const muc = new V3(), tam = new V3(), qd = new T.Matrix4(), O = new V3(), UP = new V3(0, 1, 0), FW = new V3(0, 0, 1);
  vfx.them(g, 30, (dt) => {
    t += dt;
    const dSong = !!dich;
    tocQuay += (7.5 - tocQuay) * tien(1.2, dt); quay += tocQuay * dt;
    let con = 0;
    for (let k = 0; k < KT.N; k++) {
      const s = K[k]; s.pT.copy(s.p);
      if (s.trang === 0) continue;
      con++; s.t += dt;
      const tNgam = .95 + s.dot * .5 + s.thu * .05, tLao = tNgam + .32;
      const th = quay + k / KT.N * TAU;
      if (s.trang === 1) {
        const u = clamp((t - k * .025) / .38, 0, 1);
        s.p.lerpVectors(diemRa(), viTriQuy(k), easeO(u));
        const c = new V3(Math.sin(th), 0, Math.cos(th));                     // tiếp tuyến vòng (đã đổi trục x Unity → web)
        s.dir.copy(UP).lerp(c, easeIO(u)).normalize(); s.sang = u;
        if (u >= 1) s.trang = 2;
      } else if (s.trang === 2) {
        s.p.lerp(viTriQuy(k), tien(18, dt));
        const c = new V3(Math.sin(th), .15, Math.cos(th)).normalize();
        s.dir.lerp(c, tien(14, dt)).normalize();
        if (t >= tNgam) { s.trang = 3; s.t = 0; }
      } else if (s.trang === 3) {
        // ngắm: dừng quay, lùi nhẹ ra sau, mũi xoay về mục tiêu
        if (dSong) s.dau.copy(nguc(dich)); else s.dau.copy(nv.pos).addScaledVector(nv.toi(), 20).add(new V3(0, 1.4, 0));
        const c = new V3().subVectors(s.dau, s.p).normalize();
        s.dir.lerp(c, tien(16, dt)).normalize();
        s.p.addScaledVector(c, -1.6 * dt); s.ngam = clamp(s.t / .3, 0, 1); s.sang = 1 + s.ngam * .6;
        // dấu báo: đầu mũi sáng dần (không có tia nối tới mục tiêu)
        s.tHat += dt; if (s.tHat > .0125) { s.tHat = 0; if (Math.random() < .5) vfx.hat(s.p.clone().addScaledVector(s.dir, 1.3), { so: 1, toc: 0, mau, co: .05 + .06 * s.ngam, song: .12, trongLuc: 0, dat: false }); }
        if (t >= tLao) {
          s.trang = 4; s.t = 0;
          if (dSong) s.dau.copy(nguc(dich)).addScaledVector(dich.vel || O, .12);    // đón đầu nhẹ
          s.v.subVectors(s.dau, s.p).normalize().multiplyScalar(KT.LAO); s.dir.copy(s.v).normalize();
          vfx.chop(s.p, { co: .7 * 1.6, mau, song: .2 });
          if (k % 3 === 0) DK.rung(.12);
        }
      } else if (s.trang === 4) {
        // lao: đuổi nhẹ 0,22 s đầu (giới hạn góc quay 2,6 rad/s), sau đó bay thẳng
        if (dSong && s.t < .22) s.v = reVe(s.v, s.p, nguc(dich), 2.6 * dt);
        s.p.addScaledVector(s.v, dt); s.dir.copy(s.v).normalize(); s.ngam = Math.max(0, s.ngam - dt * 6);
        s.tHat += dt; if (s.tHat > .016) { s.tHat = 0; vfx.hat(s.p.clone(), { so: 1, toc: 1.8, huong: s.v.clone().negate(), loe: .1, mau, co: .05, song: .22, trongLuc: 0, dat: false }); }
        // VaChamDoan(pT → p, bán kính .32) với bù nhìn
        let trung = null;
        for (const b of DK.trongDuong(s.pT, s.p, .64)) { const y = (s.pT.y + s.p.y) / 2 - b.pos.y; if (y > -.3 && y < 2.2) { trung = b; break; } }
        if (trung) { kiemTrung(s, trung); continue; }
        if (s.t > 1.1) { s.trang = 7; s.t = 0; continue; }
        if (s.p.y < .05 && s.p.y > -1) {   // cắm đất
          s.trang = 5; s.t = 0; const a = new V3(s.p.x, .05, s.p.z);
          vfx.hat(a, { so: 10, toc: 6, mau: new T.Color(.8, .75, .7), co: .08, song: .6, huong: UP, loe: .8, trongLuc: 12, to: true });
          vfx.vong(a, { bk0: .2, bk1: 1.6, mau, song: .3, op: .6 });
        }
      } else if (s.trang === 6) {
        s.v.y -= 22 * dt; s.p.addScaledVector(s.v, dt);
        s.dir.applyAxisAngle(s.xoay, 14 * dt);
        if (s.t > .7) { s.trang = 7; s.t = 0; }
      } else if (s.t > (s.trang === 5 ? .06 : .25)) s.trang = 0;   // 5 trúng (vỡ) · 7 tan
    }
    // vẽ
    const camP = DK.cam.position;
    for (let k = 0; k < KT.N; k++) {
      const s = K[k], m = s.m; const hien = s.trang !== 0 && s.trang !== 5; m.visible = hien; if (!hien) continue;
      let co = KT.CO;
      if (s.trang === 1) co *= .3 + .7 * clamp(s.sang, 0, 1);
      if (s.trang === 7) co *= Math.max(.01, 1 - s.t / .25);
      const dm = s.p.distanceTo(camP); if (dm < 4.4) co *= Math.max(.01, (dm - 1.6) / 2.8);   // sát ống kính thu nhỏ
      const d = s.dir.lengthSq() > 1e-6 ? s.dir : UP;
      qd.lookAt(d, O, Math.abs(d.y) > .98 ? FW : UP); m.quaternion.setFromRotationMatrix(qd);
      m.position.copy(s.p); m.scale.setScalar(co);
    }
    if (con === 0 && t > .5) return false;
  }, () => mat.dispose());
};

// ============================================================================
// 2) NGỰ KIẾM — cưỡi Phi kiếm (VatCuoi loại 0 + Bay.cs). F bật / F hạ cánh.
// ============================================================================
const VC = { toc: 14, lao: 27, giaToc: 3.2, nghieng: .55, caoDung: .08, quay: 7, canKhi: 1.4, lenXuong: 9, cuiMax: .35, lacBien: .03, lacTanSo: 2.6, lacLan: .02 };
const TS = { CAT_CANH_HOP: 7, CAT_CANH_TRE: .2, CAT_CANH_NANG: 6.5, CAT_CANH_TG: 1, BAY_LEN: 6.5, BAY_LEN_LAO: 9.5, TOC_DOC: 4,
  TRONG_LUC: 24, ROI_NHANH: 1.3, ROI_TOI_DA: 34, DI: 3.8, CHAY: 6.4, KHONG_DIEU_KHIEN: 2.6, QUAY_TOI_DA: 9.5,
  HA_CANH_HE: 1.9, HA_CANH_TOC_MIN: 1.4, HA_CANH_TOC_MAX: 15, HA_CANH_CHAM: .06, HA_CANH_CAO: .25, DA: .08, Y_MAX: 80, DEM: 6 };
const TG_CAT_BAY = 1.5 * DK.NHIP_GOC;            // DongTacWeb: bay 1,5 s thật không giao chiến ⇒ tự cất kiếm
const hex = h => new T.Color(((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255);
const KIEM = hex(0xd0142a), KIEM_SANG = new T.Color(1, .16, .26);

// tư thế cầm kiếm khi bay (DongTacWeb TT_CAM_KIEM_BAY / _LAO) + tư thế động của clip giữ
DK.ttBang(['PB_CAM_KIEM_BAY', 'aR:52,0,-20 fR:-6 hR:0,0,0 w:90', 'PB_CAM_KIEM_BAY_LAO', 'aR:58,0,-56 fR:-6 hR:0,0,0 w:92']);
const TTD = DK.tt('PB_CUOI_DONG', 'cham:1');
TTD.set(DK.TT.CUOI_KIEM);
DK.clip('PB_CUOI_GIU', '0 PB_CUOI_DONG', null, null, { tron: .18, ra: .25, than: 0 });
const KI = DK.KI, TAY_PHAI = ['aR', 'fR', 'hR', 'w'].map(k => KI[k]);

// ---- mô hình phi kiếm (VatCuoi.DungPhiKiem) — gốc = đế chân, mũi +z ----
function hopGeo(ds) {
  const parts = ds.map(h => { const g = new T.BoxGeometry(h[1][0], h[1][1], h[1][2]); if (h[3]) g.rotateY(h[3] * D); g.translate(h[0][0], h[0][1], h[0][2]); const g2 = g.toNonIndexed(); const n = g2.attributes.position.count, c = new Float32Array(n * 3), nor = g2.attributes.normal; for (let i = 0; i < n; i++) { const k = h[4] ? 1 : (nor.getY(i) > .5 ? 1.1 : nor.getY(i) < -.5 ? .7 : .9); c[i * 3] = h[2].r * k; c[i * 3 + 1] = h[2].g * k; c[i * 3 + 2] = h[2].b * k; } g2.setAttribute('color', new T.BufferAttribute(c, 3)); return g2; });
  let n = 0; for (const g of parts) n += g.attributes.position.count;
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = new Float32Array(n * 3); let o = 0;
  for (const g of parts) { P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); C.set(g.attributes.color.array, o * 3); o += g.attributes.position.count; }
  const G = new T.BufferGeometry(); G.setAttribute('position', new T.BufferAttribute(P, 3)); G.setAttribute('normal', new T.BufferAttribute(N, 3)); G.setAttribute('color', new T.BufferAttribute(C, 3)); G.computeBoundingSphere(); return G;
}
function tamSang(cha, rong, dai, y, mau, a) {
  const m = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: vfx.texTron, color: mau, transparent: true, opacity: a, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
  m.rotation.x = -Math.PI / 2; const g = new T.Group(); g.add(m); g.position.y = y; g.scale.set(rong, 1, dai); cha.add(g); return { g, m };
}
function dungPhiKiem(muc) {
  const goc = new T.Group(), c = new T.Group(); goc.add(c);
  const loi = hex(0xf4f6fa), ranh = KIEM.clone().multiplyScalar(.45), vang = hex(0xc89a3a), chuoi = hex(0x1c1418);
  let mauSang = KIEM_SANG;
  if (muc && PB.cuoiTheoPB) {
    // 2026-11-14 — chế độ XEM THỬ (không có trong game): lưỡi dựng từ hop của pháp bảo chọn, phóng to dài ≈ 2,25 m như phi kiếm game
    const m = DK.meshKiem(muc, { sang: .35 }); const dai = (muc.mui ? muc.mui[1] : muc.dai || 20) * DL.PX; const k = 2.25 / Math.max(.3, dai);
    m.rotation.x = Math.PI / 2; m.scale.setScalar(k); m.position.set(0, -.03, -1.1); c.add(m);
    mauSang = new T.Color(muc.mau_hex);
  } else {
    // lưỡi (lớp tự sáng) + chắn / chuôi / núm (có sáng tối)
    const sang = [
      [[0, -.035, .2], [.27, .03, 2.05], KIEM, 0, 1], [[0, -.03, .22], [.17, .05, 2.25], loi, 0, 1], [[0, -.03, .12], [.04, .054, 1.9], ranh, 0, 1],
      [[0, -.03, 1.36], [.13, .045, .13], loi, 45, 1], [[0, -.035, 1.3], [.2, .028, .2], KIEM, 45, 1],
    ];
    const dac = [[[0, -.03, -.93], [.64, .09, .11], vang], [[0, -.03, -.93], [.22, .14, .17], vang], [[0, -.03, -1.22], [.075, .075, .46], chuoi], [[0, -.03, -1.49], [.14, .11, .11], vang]];
    c.add(new T.Mesh(hopGeo(sang), new T.MeshBasicMaterial({ vertexColors: true })));
    const md = new T.Mesh(hopGeo(dac), new T.MeshStandardMaterial({ vertexColors: true, roughness: .5, metalness: .4, emissive: 0xffffff, emissiveIntensity: 0 })); md.castShadow = true; c.add(md);
    goc.userData.matDac = md.material;
  }
  // tua kiếm: hai dải lụa đỏ sau chuôi
  const tua = new T.Group(); tua.position.set(0, -.03, -1.55); c.add(tua);
  tua.add(new T.Mesh(hopGeo([[[.03, 0, -.27], [.035, .025, .55], hex(0xb01020)], [[-.03, -.01, -.22], [.035, .025, .45], hex(0xb01020)]]), new T.MeshStandardMaterial({ vertexColors: true, roughness: .8 })));
  const q1 = tamSang(c, 1.5, 3.6, -.1, mauSang, .75), q2 = tamSang(c, .7, 3.0, -.08, 0xffffff, .35);
  goc.rotation.order = 'YXZ';
  return { goc, c, tua, quang: q1, quang2: q2, mauSang };
}
// ---- dải sáng (VatCuoi.Dai): 30 mẫu, tắt theo tuổi .45 s, thon về đuôi ----
function taoDai(mau) {
  const n = 30, A = [], B = [], tuoi = new Float32Array(n).fill(9), sang = new Float32Array(n); let dau = 0;
  for (let i = 0; i < n; i++) { A.push(new V3()); B.push(new V3()); }
  const geo = new T.BufferGeometry(), P = new Float32Array(n * 6), C = new Float32Array(n * 6);
  geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setAttribute('color', new T.BufferAttribute(C, 3));
  const I = []; for (let i = 0; i < n - 1; i++) { const a = i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } geo.setIndex(I);
  const m = new T.Mesh(geo, new T.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
  m.frustumCulled = false; m.renderOrder = 7; DK.scene.add(m);
  const mid = new V3(), pa = new V3(), pb = new V3();
  return {
    m,
    datLai(a, b) { for (let i = 0; i < n; i++) { A[i].copy(a); B[i].copy(b); tuoi[i] = 9; } },
    day(a, b, s) { dau = (dau + 1) % n; A[dau].copy(a); B[dau].copy(b); tuoi[dau] = 0; sang[dau] = s; },
    buoc(ds) { for (let i = 0; i < n; i++) tuoi[i] += ds; },
    ve(coDau, a0, b0) {
      let co = false;
      for (let i = 0; i < n; i++) {
        const j = (dau - i + n) % n, u = i / (n - 1);
        pa.copy(A[j]); pb.copy(B[j]); if (i === 0 && coDau) { pa.copy(a0); pb.copy(b0); }
        mid.addVectors(pa, pb).multiplyScalar(.5); const th = 1 - u * .85;
        P[i * 6] = mid.x + (pa.x - mid.x) * th; P[i * 6 + 1] = mid.y + (pa.y - mid.y) * th; P[i * 6 + 2] = mid.z + (pa.z - mid.z) * th;
        P[i * 6 + 3] = mid.x + (pb.x - mid.x) * th; P[i * 6 + 4] = mid.y + (pb.y - mid.y) * th; P[i * 6 + 5] = mid.z + (pb.z - mid.z) * th;
        const f = Math.max(0, 1 - tuoi[j] / .45) * (1 - u) * (1 - u * .4) * sang[j]; if (f > .003) co = true;
        let r = mau.r * f, g = mau.g * f, b = mau.b * f; if (i === 0) { r = Math.min(1, r + f * .6); g = Math.min(1, g + f * .6); b = Math.min(1, b + f * .6); }
        C[i * 6] = C[i * 6 + 3] = r; C[i * 6 + 1] = C[i * 6 + 4] = g; C[i * 6 + 2] = C[i * 6 + 5] = b;
      }
      m.visible = co; geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
    },
    huy() { DK.scene.remove(m); geo.dispose(); m.material.dispose(); },
  };
}
// ---- hiệu ứng gọi / cất (VatCuoi.HieuUngGoi loại 0) ----
function hieuUngGoi(p, ra) {
  const m = KIEM_SANG;
  if (ra) {
    vfx.cot(p.clone().add(new V3(0, -2.2, 0)), { r: 1.1, cao: 6.5, mau: m, song: .65, op: .5 });
    vfx.vong(p.clone().add(new V3(0, .05, 0)), { bk0: .3, bk1: 3.6, mau: m, song: .55, op: .78, day: .35 });
    vfx.vong(p.clone().add(new V3(0, .05, 0)), { bk0: .2, bk1: 2.2, mau: 0xffffff, song: .35, op: .48 });
    vfx.chop(p.clone().add(new V3(0, .4, 0)), { co: 1.12 * 2.2, mau: m, song: .5 });
    for (let i = 0; i < 26; i++) { const a = R(0, TAU), r = R(.4, 1.4); vfx.hat(new V3(p.x + Math.cos(a) * r, p.y - .3, p.z + Math.sin(a) * r), { so: 1, mau: m, toc: R(2, 6), huong: new V3(Math.cos(a) * .15, 1, Math.sin(a) * .15), loe: .05, co: R(.04, .09), song: R(.4, .9), trongLuc: 2, can: 1.6, dat: false }); }
  } else {
    const q = p.clone().add(new V3(0, -.2, 0));
    vfx.chop(q, { co: .84 * 2.2, mau: m, song: .4 });
    vfx.vong(q, { bk0: .4, bk1: 2.4, mau: m, song: .4, op: .54, cao: 0 });
    vfx.hat(q, { so: 22, mau: m, toc: 5, co: .06, song: .55, trongLuc: 3, can: 2.5, dat: false });
  }
}

// ---- trạng thái cưỡi ----
let S = null;
function dongCuoi(nv, nhanh) {
  if (!S) return;
  const s = S; S = null;
  s.song = false;
  if (nv.kiemMesh) nv.kiemMesh.visible = true;
  nv.dangCuoi = false; nv.treo = false;
  nv.root.rotation.set(0, nv.yaw, 0);
  if (nv.hd && nv.hd.clip === DK.CLIP.PB_CUOI_GIU) nv.hd.dung();
  if (nhanh) { s.mo.goc.parent && DK.scene.remove(s.mo.goc); s.dai.forEach(d => d.huy()); }
}
DK.nghe('datLai', () => dongCuoi(DK.nc, true));

PB.nguKiem = function (ctx, muc) {
  const nv = ctx.nv;
  if (S && S.song) {
    // F lần nữa: đang cưỡi / nâng ⇒ hạ cánh; đang hạ ⇒ huỷ hạ; pha bật nhảy chờ kiếm ⇒ bỏ qua (Bay.BamBay)
    if (S.che === 'cuoi') { S.che = 'ha'; S.tPha = S.tSim; }
    else if (S.che === 'nang') { S.che = 'ha'; S.tPha = S.tSim; }
    else if (S.che === 'ha') S.che = 'cuoi';
    return;
  }
  if (S) dongCuoi(nv, true);
  // ---- BatBay (đứng đất): bật nhảy 7 m/s, gọi phi kiếm ngay, 0,2 s sau nâng sin 1 s ----
  const mo = dungPhiKiem(muc); DK.scene.add(mo.goc);
  const s = S = { song: true, che: 'goi', tSim: 0, tPha: 0, v: new V3(nv.vel.x, TS.CAT_CANH_HOP, nv.vel.z), vTruoc: new V3(), yaw: nv.yaw, cui: 0, ng: 0,
    wLao: 0, lx: 0, wRut: 1, tGiaoChien: 0, mo, tMo: 0, moTrang: 'hien', moT0: 0, moPos: new V3(), moRot: new T.Euler(0, 0, 0, 'YXZ'),
    dai: [taoDai(mo.mauSang), taoDai(mo.mauSang)], tichDai: 0, tichHat: 0, k: 0 };
  nv.dangCuoi = true; nv.treo = true; nv.vel.set(0, 0, 0); nv.datDat = false;
  if (nv.hd) nv.hd.dung();
  hieuUngGoi(nv.pos.clone(), true);
  const diemDai = () => {   // VatCuoi.DiemDai — đuôi kiếm (z −1,45)
    const g = mo.goc; g.updateMatrixWorld(true);
    return [new V3(-.24, -.03, -1.45), new V3(.24, -.03, -1.45), new V3(0, .2, -1.45), new V3(0, -.26, -1.45)].map(p => p.applyMatrix4(g.matrixWorld));
  };
  { const d = diemDai(); s.dai[0].datLai(d[0], d[1]); s.dai[1].datLai(d[2], d[3]); }

  const ten = DK.TT;
  const datTuThe = (dt) => {
    const o = TTD;
    if (s.che === 'goi') {   // trên không thường (chưa đứng lên kiếm)
      DK.tron(ten.DINH, ten.LEN, clamp(s.v.y / 6, 0, 1), o); if (s.v.y < 0) DK.tron(o, ten.ROI, clamp(-s.v.y / 9, 0, 1), o);
      return;
    }
    const vh = s.v.length();
    const lao = DK.phim.Shift && vh > VC.toc * .75 ? 1 : 0;
    s.wLao += (lao - s.wLao) * tien(5, dt);
    DK.tron(ten.CUOI_KIEM, ten.CUOI_KIEM_LAO, s.wLao, o);
    // TayBayKiem: tay phải xuôi ra sau, lưỡi nối cẳng tay (chỉ khi kiếm còn rút)
    if (s.wRut > .005) {
      const k = DK.tron(ten.PB_CAM_KIEM_BAY, ten.PB_CAM_KIEM_BAY_LAO, s.wLao, new Float32Array(64)); const ph = DK.now * 2.3;
      k[KI.aR * 3] += 2.5 * Math.sin(ph); k[KI.w * 3] += 1.5 * Math.sin(ph + .9);
      for (const j of TAY_PHAI) for (let a = 0; a < 3; a++) o[j * 3 + a] += (k[j * 3 + a] - o[j * 3 + a]) * s.wRut;
    }
    // lên / xuống: ngả sau khi vọt lên, chúi khi hạ
    const ld = (DK.phim.Control ? 1 : 0) - (DK.phim[' '] ? 1 : 0);
    s.lx += (ld - s.lx) * tien(4, dt);
    o[KI.tor * 3] += s.lx * 10; o[KI.head * 3] -= s.lx * 6;
    // lượn: tay phía ngoài dang ra giữ thăng bằng
    const ng = s.ng / D;
    o[KI.aL * 3 + 2] += Math.max(0, ng) * 1.1; o[KI.aR * 3 + 2] -= Math.max(0, -ng) * 1.1; o[KI.tor * 3 + 2] -= ng * .25;
  };

  DK.lap((ds) => {
    if (S !== s || !s.song) return false;
    s.tSim += ds; s.vTruoc.copy(s.v);
    const ph = DK.phim, may = DK.may;
    // ý chí: hướng theo máy quay (như buocNguoiChoi của lõi)
    let f = 0, r = 0; if (ph.w || ph.ArrowUp) f++; if (ph.s || ph.ArrowDown) f--; if (ph.d || ph.ArrowRight) r++; if (ph.a || ph.ArrowLeft) r--;
    const h = new V3();
    if (f || r) { const fy = may.yaw + Math.PI; h.set(Math.sin(fy) * f - Math.cos(fy) * r, 0, Math.cos(fy) * f + Math.sin(fy) * r).normalize(); }
    const len = !!ph[' '], xuong = !!ph.Control, lx = (len ? 1 : 0) - (xuong ? 1 : 0);
    const p = nv.pos;
    const ngang = (mx, mz, rTang, rGiam) => { const rate = mx * mx + mz * mz > s.v.x * s.v.x + s.v.z * s.v.z ? rTang : rGiam; const k = tien(rate, ds); s.v.x += (mx - s.v.x) * k; s.v.z += (mz - s.v.z) * k; };
    if (s.che === 'goi') {
      // BuocGoi: bật nhảy, điều khiển trên không; 0,2 s sau sang nâng
      if (s.tSim - s.tPha >= TS.CAT_CANH_TRE) { s.che = 'nang'; s.tPha = s.tSim; }
      else {
        const gk = s.v.y < 0 ? TS.ROI_NHANH : 1; s.v.y = Math.max(-TS.ROI_TOI_DA, s.v.y - TS.TRONG_LUC * gk * ds);
        const toc = ph.Shift ? TS.CHAY : TS.DI; ngang(h.x * toc, h.z * toc, TS.KHONG_DIEU_KHIEN, TS.KHONG_DIEU_KHIEN * .6);
        p.addScaledVector(s.v, ds);
        if (p.y < 0) { p.y = 0; s.v.y = 0; }
      }
    }
    let xongHa = false;
    if (s.che !== 'goi') {
      // BuocCuoi
      const lao = ph.Shift && h.lengthSq() > .01;
      const toc = lao ? VC.lao : VC.toc;
      let mx = h.x * toc, mz = h.z * toc;
      let vyMuc = lx * (lao ? VC.lenXuong * TS.BAY_LEN_LAO / TS.BAY_LEN : VC.lenXuong), rateDoc = TS.TOC_DOC;
      if (s.che === 'nang') { const u = (s.tSim - s.tPha) / TS.CAT_CANH_TG; if (u >= 1) s.che = 'cuoi'; else vyMuc += TS.CAT_CANH_NANG * Math.sin(Math.PI * u); }
      else if (s.che === 'ha') {
        if (len) s.che = 'cuoi';
        else {
          const hh = p.y; vyMuc = -clamp(hh * TS.HA_CANH_HE, TS.HA_CANH_TOC_MIN, TS.HA_CANH_TOC_MAX); rateDoc = 5; mx *= .35; mz *= .35;
          if (hh < TS.HA_CANH_CHAM + TS.DA + .02) xongHa = true;
        }
      }
      if (!xongHa) {
        if (s.che === 'cuoi') vyMuc += Math.cos(s.tSim * VC.lacTanSo) * VC.lacBien * VC.lacTanSo * 1.6 * (1 - .6 * Math.min(1, h.length()));
        if (p.y > TS.Y_MAX - TS.DEM) vyMuc = Math.min(vyMuc, (TS.Y_MAX - p.y) * 1.5);
        ngang(mx, mz, VC.giaToc, VC.canKhi);
        s.v.y += (vyMuc - s.v.y) * tien(rateDoc, ds);
        p.addScaledVector(s.v, ds);
        // không chui đất: chân cách đất ≥ max(.25, caoDung + .05)
        const cao = s.che === 'ha' ? 0 : Math.max(TS.HA_CANH_CAO, VC.caoDung + .05);
        if (p.y < cao) { p.y = cao; if (s.v.y < 0) s.v.y = 0; }
        if (xuong && !len && s.che === 'cuoi' && p.y < .9) { s.che = 'ha'; s.tPha = s.tSim; }   // Ctrl sát đất ⇒ tự hạ cánh
      }
    }
    // Xoay (Bay.Xoay): khoá mục tiêu ⇒ nhìn mục tiêu (trừ khi lao tốc), cưỡi ⇒ theo vận tốc, không thì theo phím
    const vh = Math.hypot(s.v.x, s.v.z); const dangCuoiK = s.che !== 'goi';
    let rate = dangCuoiK ? VC.quay : 5, muc = null;
    const khoa = DK.khoa;
    if (khoa && !(dangCuoiK && ph.Shift && vh > VC.toc * 1.05)) { muc = Math.atan2(khoa.pos.x - p.x, khoa.pos.z - p.z); rate = 12; }
    else if (dangCuoiK && vh > 2) muc = Math.atan2(s.v.x, s.v.z);
    else if (h.lengthSq() > .01) muc = Math.atan2(h.x, h.z);
    if (muc != null) { const tran = TS.QUAY_TOI_DA * ds; let dg = ((muc - s.yaw) / D + 540) % 360 - 180; s.yaw += clamp(dg * D * tien(rate, ds), -tran, tran); }
    nv.yaw = s.yaw;
    // NghiengNguoi
    const sy = Math.sin(s.yaw), cy = Math.cos(s.yaw);
    const ax = (s.v.x - s.vTruoc.x) / ds, az = (s.v.z - s.vTruoc.z) / ds;
    const aLat = -(ax * cy - az * sy), aToi = ax * sy + az * cy, vLat = -(s.v.x * cy - s.v.z * sy), vToi = s.v.x * sy + s.v.z * cy;   // phải của web = (−cos, 0, sin)
    let nMuc, cMuc, kn = 6, kc = 5;
    if (dangCuoiK) {
      nMuc = clamp(aLat * .05 + vLat * .012, -VC.nghieng, VC.nghieng);
      cMuc = clamp(vToi / VC.lao * .34 + aToi * .012, -.16, VC.cuiMax);
      if (s.che === 'nang') cMuc -= .1; else if (s.che === 'ha') cMuc -= .06;
      kn = 4.5; kc = 4;
    } else { nMuc = clamp(aLat * .01, -.1, .1); cMuc = clamp(-s.v.y * .006, -.1, .12); }
    s.ng += (nMuc - s.ng) * tien(kn, ds); s.cui += (cMuc - s.cui) * tien(kc, ds);
    // rút / cất kiếm tay (DongTacWeb: bay 1,5 s thật không giao chiến ⇒ cất; đối thủ < 9 m giữ rút)
    const mt = DK.mucTieu(); if (mt && mt.pos.distanceTo(p) < 9) s.tGiaoChien = s.tSim;
    const rut = s.tSim - s.tGiaoChien <= TG_CAT_BAY; s.wRut += ((rut ? 1 : 0) - s.wRut) * tien(9, ds);
    if (nv.kiemMesh) nv.kiemMesh.visible = s.wRut > .5;
    // tư thế: clip giữ (tư thế động) — chiêu khác chen ngang thì chờ xong rồi giữ lại
    datTuThe(ds);
    if (!nv.hd) DK.phat(nv, 'PB_CUOI_GIU', { giu: true, khongMv: true, khoaDi: true });
    // nghiêng cả người quanh đế chân (Bay.DatTuThe) — lõi đặt lại root mỗi bước nên đặt sau apDung
    nv.root.position.copy(p); nv.root.rotation.set(s.cui, s.yaw, s.ng); nv.root.updateMatrixWorld(true);

    // ---- vật cưỡi: vẽ + hoạt cảnh + hạt (VatCuoi.VeMo / HoatHinh / PhatHat) ----
    s.tMo += ds; const t = s.tMo;
    const g = mo.goc; let sc, uGoi = 1;
    if (s.moTrang === 'hien') { uGoi = clamp(t / .42, 0, 1); sc = Math.max(.001, easeBat(uGoi)); g.position.copy(p); g.rotation.set(s.cui, s.yaw, s.ng); }
    g.scale.setScalar(sc);
    const vmp = s.v.length(), k = clamp(vmp / VC.toc, 0, 1.6); s.k = k;
    const mo_ = easeO(uGoi), lac = Math.sin(t * VC.lacTanSo) * VC.lacLan;
    mo.c.rotation.set(0, -(1 - mo_) * TAU * 1.25, -lac); mo.c.position.y = Math.sin(t * 31) * .004 * (1 + k);
    mo.tua.rotation.set(.25 + k * .5 + Math.sin(t * 9) * (.12 + k * .1), -Math.sin(t * 6.3) * .2, 0);
    mo.quang.m.material.opacity = .75 * clamp(.5 + .2 * Math.sin(t * 7) + .3 * Math.min(1, k), 0, 1.4);
    mo.quang.g.scale.set(1.5, 1, 3.6 * (1 + k * .25));
    if (g.userData.matDac) g.userData.matDac.emissiveIntensity = Math.max(0, 1 - t / .55) * 1.4 * .4;
    for (const d of s.dai) d.buoc(ds);
    const dd = diemDai();
    // hai dải sáng: mẫu mới mỗi 1/60 s
    s.tichDai += ds;
    if (s.tichDai >= 1 / 60) { s.tichDai = 0; const sg = clamp(.35 + k * .9, 0, 1.3); s.dai[0].day(dd[0], dd[1], sg); s.dai[1].day(dd[2], dd[3], sg); }
    s.dai[0].ve(true, dd[0], dd[1]); s.dai[1].ve(true, dd[2], dd[3]);
    // tia lửa khi bay nhanh
    if (k > .3) {
      s.tichHat += (.3 + k * .4) * 60 * ds;
      while (s.tichHat >= 1) {
        s.tichHat -= 1; g.updateMatrixWorld(true);
        const q = new V3(R(-.12, .12), -.03, R(-1.4, 1.2)).applyMatrix4(g.matrixWorld);
        const vv = s.v.clone().multiplyScalar(-.15).add(ngauCau().multiplyScalar(.6));
        vfx.hat(q, { so: 1, toc: vv.length(), huong: vv, loe: 0, mau: Math.random() < .3 ? 0xffffff : mo.mauSang, co: R(.03, .06), song: R(.25, .5), trongLuc: 0, can: 2, dat: false });
      }
    }
    if (xongHa) {
      // XongHaCanh: cất vật cưỡi, về đất, giữ đà ngang
      hieuUngGoi(p.clone(), false);
      p.y = 0; nv.datDat = true; nv.vy = 0; nv.vel.set(s.v.x * .5, 0, s.v.z * .5);
      const pos0 = p.clone(), rot0 = g.rotation.clone(), cui0 = s.cui, ng0 = s.ng; const daiCu = s.dai;
      dongCuoi(nv, false);
      // VeMo pha Thu: thu nhỏ 1 − u³, chìm 1,2 m, xoay 2,5 rad trong .36 s; dải sáng tắt dần; người nhả nghiêng (~0,3 s)
      let u = 0, kc2 = cui0, kn2 = ng0;
      DK.lap((dt2) => {
        u += dt2 / .36; const ei = Math.min(1, u) ** 3;
        g.scale.setScalar(Math.max(.001, 1 - ei)); g.position.copy(pos0).add(new V3(0, -ei * 1.2, 0)); g.rotation.set(rot0.x, rot0.y - Math.min(1, u) * 2.5, rot0.z);
        for (const d of daiCu) { d.buoc(dt2); d.ve(false); }
        const kk = 1 - Math.exp(-10 * dt2 / DK.NHIP_GOC); kc2 += -kc2 * kk; kn2 += -kn2 * kk;
        if (!S) { nv.root.rotation.set(kc2, nv.yaw, kn2); nv.root.updateMatrixWorld(true); }
        if (u >= 1) { DK.scene.remove(g); daiCu.forEach(d => d.huy()); return false; }
      });
      return false;
    }
  });
  dsDon.push(() => { if (mo.goc.parent) DK.scene.remove(mo.goc); s.dai.forEach(d => { try { d.huy(); } catch (e) { } }); });
};

// ============================================================================
// 3) + 4) GHI CHÚ tình trạng pháp bảo kiếm trong game
// ============================================================================
PB.cuoiTheoPB = /[?&]cuoi_pb=1/.test(location.search);
PB.nguon = 'PhapBaoDanh/PhapBaoDanhMon1.cs (HCKiemTran), PhapBaoDanh.cs, Bay.cs, ThongSoBay.cs, VatCuoi.cs, DongTac/DongTacWeb.cs, PhapBao.cs';
PB.ghiChu =
  'Q Phi kiếm trận (HCKiemTran): 12 kiếm đỏ máu (phe ta) ra từ sau lưng, quay vòng 2,3 m, 3 đợt (đợt k%3) ngắm 0,32 s rồi lao 36 m/s, đuổi nhẹ 0,22 s; ST 26/kiếm, kiếm cuối đợt 3 đánh văng; đỡ thì kiếm bật văng. ' +
  'Khác: game không phát clip người khi người chơi tung (clip PB_KIEM_TRAN chỉ có ở web; bot dùng TUNG_PHAP_BAO) — ở đây vẫn phát PB_KIEM_TRAN cho dễ xem; game chỉ giảm tốc đi còn 55 % trong 0,55 s. ' +
  'F Ngự kiếm: game cưỡi "Phi kiếm" CỐ ĐỊNH (VatCuoi loại 0, vật phẩm cuoi_phi_kiem, kiếm đỏ dài 2,25 m, vệt chéo đỏ) — KHÔNG dùng 5 phi kiếm pháp bảo bên dưới; chọn thanh nào ở đây cũng ra kiếm đỏ như game (thêm ?cuoi_pb=1 vào URL để xem thử lưỡi + màu của thanh đã chọn — không có trong game). ' +
  'Số: lượn 14 / lao (Shift) 27 m/s, lên/xuống 9 m/s, nghiêng ≤ 0,55 rad, chúi ≤ 0,35 rad; cất cánh bật 7 m/s + 0,2 s chờ + nâng sin 1 s; F lần nữa hạ cánh; Ctrl sát đất tự hạ; kiếm tay tự cất sau 1,5 s thật nếu không có đối thủ < 9 m. ' +
  '5 phi kiếm pháp bảo (Bích Ngọc, Huyền Thủy, Tử Lôi, Bát Quái, Thanh Mộc): đã bị bỏ khỏi danh mục vật phẩm (vat_pham.json), chỉ còn trong phap_bao.json + tủ đồ nhân vật mẫu (đeo trên lưng); nếu đeo thì đổi màu vệt kiếm khí (ChienDau.MauKiem) và màu trận pháp bay (TranPhap). ' +
  'Chiêu riêng loại kiếm VẠN KIẾM QUY TÔNG (PhapBao.VanKiemQuyTong: kiếm ×3 bay lên đầu, 9 kiếm ảnh xoè quạt lao vào đích trong 18 m rồi quy về) còn trong code nhưng phím Q không còn gọi (chỉ kịch bản KiemLoi cũ gọi TungChieu) — không dựng.';
if (DK.veLai) DK.veLai();
})();
