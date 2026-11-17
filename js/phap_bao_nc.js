"use strict";
// ============================================================================
// phap_bao_nc.js — 2026-11-15 — BẢN NÂNG CẤP (đề xuất) PHÁP BẢO KIẾM: Phi kiếm trận (Q) + Ngự kiếm (F).
//   Người dùng chê "kiếm phóng ra không ra kiếm" ⇒ 5 phi kiếm mỗi thanh một hình riêng (vfx.kiemThat + khối trang trí):
//     Bích Ngọc (ngọc trong mờ, lõi sáng, vòng hạt ngọc) · Huyền Thủy (thép băng, gai băng, giọt nước chảy dọc lưỡi)
//     Tử Lôi (bản rộng tím thẫm, chắn mặt quỷ có sừng, vân sét, hồ quang) · Bát Quái (đồng xanh, đĩa bát quái ở chắn, phù văn)
//     Thanh Mộc (gỗ đào, dây leo quấn + lá, lá phù vàng).
//   Q: người chơi KẾT ẤN → TRIỆU KIẾM (kiếm chỉ chỉ trời, xoay người) → CHỈ KIẾM (lao bộ, kiếm chỉ về đích); kiếm thật xếp đội hình
//     theo thuộc tính thanh đang chọn (sen / mưa / vòng hào quang / bát quái / xoắn dây leo), đâm xuống đích, cắm đất (kiếm cắm + nứt + hố),
//     đòn kết phá cây / đèn đá trong vùng. Một màu chủ đạo = màu phi kiếm chọn.
//   F: kiếm lớn ra từ sau lưng, vọt lên đầu, lật ngang phóng to, trượt vào dưới chân; bay lượn WASD (Space/Ctrl lên xuống, Shift lao — như bản game);
//     vệt + hạt theo thuộc tính; bay thấp làm rạp cỏ; hạ cánh có sóng gió + sóng đất nhẹ, kiếm thu về sau lưng.
// Lõi dùng: vfx.kiemThat / vfx.phiKiem / vfx.vaCham / vfx.vienMan, DK.dia (nang_cap.js). Không sửa lõi.
// ============================================================================
(function () {
const DK = window.DK, T = DK.T, V3 = DK.V3, vfx = DK.vfx, dia = DK.dia, D = DK.D;
if (!vfx || !vfx.kiemThat || !dia) return;
const PBN = DK.PB_NC = {};
const TAU = Math.PI * 2;
const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
const tien = DK.tien || ((k, dt) => 1 - Math.exp(-k * dt));
const easeO = u => 1 - Math.pow(1 - clamp(u, 0, 1), 3);
const easeIO = u => { u = clamp(u, 0, 1); return u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
const easeBat = x => { x = clamp(x, 0, 1); const c = 1.70158, a = x - 1; return 1 + (c + 1) * a * a * a + c * a * a; };
const R = (a, b) => a + Math.random() * (b - a);
const UP = new V3(0, 1, 0), DOWN = new V3(0, -1, 0), O = new V3();
const ngauCau = () => { const v = new V3(R(-1, 1), R(-1, 1), R(-1, 1)); return v.lengthSq() > 1e-6 ? v.normalize() : v.set(0, 1, 0); };
const bez = (a, k, b, u, o) => { const v = 1 - u; return (o || new V3()).set(v * v * a.x + 2 * v * u * k.x + u * u * b.x, v * v * a.y + 2 * v * u * k.y + u * u * b.y, v * v * a.z + 2 * v * u * k.z + u * u * b.z); };
const bezD = (a, k, b, u, o) => (o || new V3()).set(2 * (1 - u) * (k.x - a.x) + 2 * u * (b.x - k.x), 2 * (1 - u) * (k.y - a.y) + 2 * u * (b.y - k.y), 2 * (1 - u) * (k.z - a.z) + 2 * u * (b.z - k.z));
const hexCss = c => '#' + c.getHexString();
const pbChon = muc => muc || (DK.chon && DL.PHAP_BAO.find(p => p.ma === DK.chon.pb)) || DL.PHAP_BAO[0];

// ============================================================================
// 1) HÌNH 5 PHI KIẾM — vfx.kiemThat + khối trang trí (port Unity: prefab ghép khối, không shader riêng)
// ============================================================================
const CAU = {
  ngoc_kiem:     { tran: 'sen',  kieu: 'kiem', kim: 0x9effd2, chan: 0xeafff4, chuoi: 0x2c6a52, tua: 0x5fe8a0, sang: .7, bao: .5, tenTran: 'Ngọc Liên Kiếm Trận (hoa sen)' },
  thuy_kiem:     { tran: 'mua',  kieu: 'kiem', kim: 0xdaf6ff, chan: 0xa9dcff, chuoi: 0x1a3550, tua: 0x6fd8ff, sang: .6, bao: .45, tenTran: 'Hàn Băng Kiếm Vũ (mưa kiếm)' },
  tu_kiem:       { tran: 'vong', kieu: 'rong', kim: 0x4a3466, chan: 0x2a1838, chuoi: 0x120a18, tua: 0xa860ff, sang: .6, bao: .45, tenTran: 'Tử Lôi Kiếm Luân (vòng hào quang)' },
  bat_quai_kiem: { tran: 'bq',   kieu: 'kiem', kim: 0x86a486, chan: 0xc9a24a, chuoi: 0x3a2a14, tua: 0xffc860, sang: .5, bao: .35, tenTran: 'Bát Quái Trấn Thiên Trận' },
  moc_kiem:      { tran: 'xoan', kieu: 'kiem', kim: 0xb07a4a, chan: 0x6a4020, chuoi: 0x3a2412, tua: 0xe0b840, sang: .2, bao: .08, tenTran: 'Thanh Mộc Triền Kiếm (xoắn dây leo)' },
};
const matSang = (hex, k) => new T.MeshBasicMaterial({ color: new T.Color(hex).multiplyScalar(k || 1.6), toneMapped: false });
const matDac = (hex, op = {}) => new T.MeshStandardMaterial(Object.assign({ color: hex, roughness: .6, metalness: .2 }, op));

/** đĩa bát quái phẳng (mặt XY, pháp tuyến +z): vòng bát giác + 8 quẻ (vạch liền / đứt) + âm dương giữa */
function hinhBatQuai(Rr, mau, op = {}) {
  const g = new T.Group(); const c = new T.Color(mau).multiplyScalar(op.k || 1.5);
  const mk = a => new T.MeshBasicMaterial({ color: c, transparent: true, opacity: a, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false });
  const mat = mk(op.a != null ? op.a : .9), matMo = mk((op.a != null ? op.a : .9) * .3);
  const add = (geo, m, x, y, rz) => { const ms = new T.Mesh(geo, m || mat); ms.position.set(x || 0, y || 0, 0); ms.rotation.z = rz || 0; g.add(ms); return ms; };
  add(new T.RingGeometry(Rr * .93, Rr, 8, 1), null, 0, 0, Math.PI / 8);
  add(new T.RingGeometry(Rr * .4, Rr * .44, 8, 1), null, 0, 0, Math.PI / 8);
  const QUE = [7, 6, 5, 4, 3, 2, 1, 0];
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU, tx = -Math.sin(a), ty = Math.cos(a);
    for (let j = 0; j < 3; j++) {
      const rr = Rr * (.52 + .13 * j), len = rr * .58, day = Rr * .065, x = Math.cos(a) * rr, y = Math.sin(a) * rr;
      if ((QUE[i] >> j) & 1) add(new T.PlaneGeometry(len, day), null, x, y, a + Math.PI / 2);
      else for (const s of [-1, 1]) add(new T.PlaneGeometry(len * .42, day), null, x + tx * s * len * .29, y + ty * s * len * .29, a + Math.PI / 2);
    }
  }
  // âm dương: nửa sáng / nửa mờ + hai chấm
  add(new T.CircleGeometry(Rr * .3, 24, 0, Math.PI), null); add(new T.CircleGeometry(Rr * .3, 24, Math.PI, Math.PI), matMo);
  add(new T.CircleGeometry(Rr * .06, 10), matMo, Rr * .15, Rr * .0); add(new T.CircleGeometry(Rr * .06, 10), null, -Rr * .15, 0);
  g.mat = mat; g.matMo = matMo;
  g.datMo = a => { mat.opacity = a; matMo.opacity = a * .3; };
  return g;
}

/** gắn trang trí riêng của từng phi kiếm lên Group kiemThat k. Trả cap(dt) (hoạt hoạ nhỏ) hoặc null.
 *  op.nho: thanh nhỏ (phi kiếm trận) · op.hat: được phép phát hạt / hồ quang */
function trangTri(k, ma, op = {}) {
  const c = CAU[ma] || CAU.ngoc_kiem, kieu = op.kieu || c.kieu;
  const L = k.muiL, w = op.rong || L * (kieu === 'rong' ? .11 : kieu === 'manh' ? .05 : .075), t = w * .32;
  const mau = k.mau.clone();
  const L0 = k.luoi.material;
  // 2026-11-15 — giảm bao quang để thấy chất liệu riêng từng thanh (ngọc / băng / ma kiếm / đồng / gỗ), bloom không làm trắng xoá
  if (k.bao) k.bao.material.opacity *= (op.bao != null ? op.bao : c.bao != null ? c.bao : .5);
  const add = (geo, m, x, y, z, rx, ry, rz) => { const ms = new T.Mesh(geo, m); ms.position.set(x, y, z); ms.rotation.set(rx || 0, ry || 0, rz || 0); k.add(ms); return ms; };
  const the = new V3();
  const theGioi = (x, y, z) => { k.updateMatrixWorld(true); return k.localToWorld(the.set(x, y, z)).clone(); };
  if (ma === 'ngoc_kiem') {
    // ngọc bích trong mờ: lưỡi trong, lõi sáng xuyên, vòng 6 hạt ngọc quay quanh chắn
    L0.transparent = true; L0.opacity = .5; L0.depthWrite = false; L0.metalness = .25; L0.roughness = .08; L0.emissiveIntensity = .7;
    add(new T.BoxGeometry(w * .2, t * .5, L * .86), matSang(0x7fffc8, 1.9), 0, 0, L * .45);
    for (const s of [-1, 1]) add(new T.BoxGeometry(w * .06, t * .3, L * .5), matSang(0xd8fff0, 1.4), s * w * .26, 0, L * .3);
    const vong = new T.Group(); vong.position.z = w * .35; k.add(vong);
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, m = new T.Mesh(new T.OctahedronGeometry(w * .2), matSang(0x8fffd0, 1.3)); m.position.set(Math.cos(a) * w * 2.3, Math.sin(a) * w * 2.3, 0); vong.add(m); }
    return dt => { vong.rotation.z += dt * 2.2; };
  }
  if (ma === 'thuy_kiem') {
    // thép băng hơi trong, gai băng hai mép gần chắn, giọt nước chảy dọc lưỡi rồi nhỏ khỏi mũi
    L0.transparent = true; L0.opacity = .85; L0.emissiveIntensity = .45; L0.roughness = .1;
    const matBang = matDac(0xeafcff, { emissive: 0x6fd8ff, emissiveIntensity: .45, metalness: .1, roughness: .1, transparent: true, opacity: .9 });
    for (const s of [-1, 1]) for (let j = 0; j < 3; j++) { const m = add(new T.OctahedronGeometry(w * .3), matBang, s * w * (.48 - j * .05), 0, L * (.08 + .13 * j), 0, s * (.55 + j * .1), 0); m.scale.set(.45, .45, 2.4 - j * .4); }
    const giot = [];
    for (let j = 0; j < 3; j++) { const m = add(new T.BoxGeometry(w * .3, w * .3, w * .3), matSang(0x9fe8ff, 1.6), 0, t * .55, 0, Math.PI / 4, Math.PI / 4, 0); giot.push({ m, z: L * (.15 + .27 * j), x: (j - 1) * .22, v: .5 + j * .2 }); }
    return dt => {
      for (const g of giot) {
        g.z += dt * L * .35 * g.v; if (g.z > L * .93) { g.z = L * .12; if (op.hat) vfx.hat(theGioi(0, 0, L * .97), { so: 1, mau: 0x8fdcff, toc: .4, co: .05, song: .7, trongLuc: 9, can: .5 }); }
        g.m.position.set(g.x * w * (1 - g.z / L), t * .55, g.z);
      }
    };
  }
  if (ma === 'tu_kiem') {
    // ma kiếm tím thẫm bản rộng: chắn mặt quỷ (mặt + 2 sừng + mắt sáng), vân sét gấp khúc trên sống, hồ quang chạy dọc lưỡi
    L0.metalness = .7; L0.roughness = .25; L0.emissiveIntensity = .35;
    const matMat = matDac(0x2a1638, { metalness: .6, roughness: .35 });
    add(new T.BoxGeometry(w * 2.0, t * 3.4, w * 1.0), matMat, 0, 0, w * .55);
    for (const s of [-1, 1]) {
      const sung = add(new T.ConeGeometry(w * .28, w * 1.6, 4), matMat, s * w * .95, t * .6, w * 1.25); sung.rotation.order = 'YXZ'; sung.rotation.set(Math.PI / 2, s * .55, 0);
      add(new T.BoxGeometry(w * .34, t * .5, w * .2), matSang(mau, 2.4), s * w * .42, t * 1.72, w * .7);
    }
    add(new T.BoxGeometry(w * .9, t * .4, w * .12), matSang(mau, 1.8), 0, t * 1.72, w * 1.06);   // miệng ngậm sét
    const P = []; for (let j = 0; j <= 6; j++) P.push(new V3((j % 2 ? 1 : -1) * w * .2, t * .52, L * (.12 + .11 * j)));
    const mV = matSang(mau, 2.2);
    for (let j = 0; j < 6; j++) { const a = P[j], b = P[j + 1], l = a.distanceTo(b); const m = add(new T.BoxGeometry(w * .1, t * .18, l), mV, (a.x + b.x) / 2, a.y, (a.z + b.z) / 2); m.rotation.y = Math.atan2(b.x - a.x, b.z - a.z); }
    let tA = 0;
    return dt => {
      tA += dt; if (!op.hat || tA < .09) return; tA = 0;
      if (Math.random() < .55) { const z = R(.1, .85) * L, a = theGioi(R(-1, 1) * w * .5, 0, z), b = theGioi(R(-1, 1) * w * 1.6, R(-1, 1) * w, z + R(.1, .3) * L); vfx.tia(a, b, { zigzag: w * .9, rong: .02 + w * .06, mau: mau.clone().multiplyScalar(1.6), song: .07 }); }
    };
  }
  if (ma === 'bat_quai_kiem') {
    // cổ kiếm đồng xanh: đĩa bát quái vàng quay ở chắn, phù văn hình thoi dọc sống
    L0.metalness = .75; L0.roughness = .35; L0.emissiveIntensity = .3;
    const bq = hinhBatQuai(w * 2.5, 0xffc860, { a: .95, k: 1.7 }); bq.position.z = w * .45; k.add(bq);
    for (let j = 0; j < 5; j++) { const s = j % 2 ? .22 : .34; add(new T.BoxGeometry(w * s, t * .25, w * s), matSang(0xffd070, 2), 0, t * .5, L * (.18 + .14 * j), 0, Math.PI / 4, 0); }
    return dt => { bq.rotation.z += dt * 1.6; };
  }
  if (ma === 'moc_kiem') {
    // gỗ đào ngàn năm: dây leo xoắn quanh lưỡi, lá non, lá phù vàng dán gần chắn
    L0.metalness = .04; L0.roughness = .85; L0.color.setHex(0xb07a4a); L0.emissive.setHex(0x4a2a12); L0.emissiveIntensity = .5;
    if (k.children[1] && k.children[1] !== k.bao) k.children[1].visible = false;   // gỗ không có rãnh sáng
    const mDay = matDac(0x3f8a2c, { roughness: .8, emissive: 0x2a6a1a, emissiveIntensity: .35 }), mLa = matDac(0x7acc48, { roughness: .8, emissive: 0x3a7a1a, emissiveIntensity: .35 });
    const n = 20;
    for (let i = 0; i < n; i++) {
      const a = i * .85, z = L * (.04 + .74 * i / (n - 1)), co = 1 - z / L * .35;
      const x = Math.cos(a) * w * .6 * co, y = Math.sin(a) * t * 1.9;
      add(new T.BoxGeometry(w * .17, w * .17, L * .065), mDay, x, y, z, 0, Math.cos(a) * .4, 0);
      if (i % 4 === 2) { const la = add(new T.BoxGeometry(w * .85, w * .05, w * .45), mLa, x * 1.9, y * 1.4, z + L * .02, 0, a, Math.sin(a) * .5); la.userData.goc = la.rotation.z; }
    }
    add(new T.BoxGeometry(w * .92, t * 1.12, L * .14), matDac(0xe8c650, { roughness: .9 }), 0, 0, L * .1);
    add(new T.BoxGeometry(w * .22, t * 1.18, L * .12), matSang(0xc02020, 1), 0, 0, L * .1);
    return null;
  }
  return null;
}

/** phi kiếm bay của pháp bảo (vfx.phiKiem + trang trí) → pk với pk.cap(dt) */
function taoKiem(pb, op = {}) {
  const c = CAU[pb.ma] || CAU.ngoc_kiem;
  const pk = vfx.phiKiem({ dai: .95, co: op.co || 1, mau: pb.mau_hex, kim: c.kim, chan: c.chan, chuoi: c.chuoi, tua: c.tua, sang: c.sang, kieu: c.kieu, vet: op.vet, song: op.song || 8 });
  pk.cap = trangTri(pk.kiem, pb.ma, { nho: true, hat: op.hat !== false });
  return pk;
}
const _m4 = new T.Matrix4();
/** đặt kiếm: vị trí + hướng mũi, bản lưỡi giữ nằm ngang (lookAt với trục lên) */
function datKiem(pk, p, d, co, len) {
  const o = pk.o; o.position.copy(p);
  const dd = d.lengthSq() > 1e-8 ? d : UP;
  _m4.lookAt(dd, O, len || (Math.abs(dd.y) > .97 ? new V3(0, 0, 1) : UP)); o.quaternion.setFromRotationMatrix(_m4);
  if (co != null) o.scale.setScalar(Math.max(.001, co));
}

// ============================================================================
// 2) PHI KIẾM TRẬN (Q) — động tác + đội hình theo thuộc tính
// ============================================================================
DK.ttBang([
  // kết ấn: tay trái kiếm chỉ dựng trước mặt, kiếm tay phải dạt ra sau hông, chùng gối
  'PBN_KET', 'tor:14,24,0 head:-10,-20,0 aR:-14,0,-48 fR:-24,0,0 w:150,0,0 aL:-100,0,-18 fL:-118,0,0 lR:-42,0,-12 sR:60,0,0 lL:30,0,12 sL:44,0,0 ao:14,0,0 jy:-.1 cham:1',
  // triệu kiếm: kiếm chỉ chỉ thẳng trời, ngửa người nhìn lên, kiếm phải dang ngang sau
  'PBN_TRIEU', 'tor:-16,8,0 co:-6,0,0 head:-30,-6,0 aR:-24,0,-62 fR:-18,0,0 w:120,0,0 aL:-182,0,8 fL:-6,0,0 lR:-22,0,-12 sR:24,0,0 lL:24,0,12 sL:28,0,0 ao:-8,0,0 toc:-12,0,0 jy:0 cham:1',
  // chỉ kiếm: lao bộ thấp, kiếm chỉ duỗi thẳng về đích, kiếm phải giơ cao ra sau
  'PBN_CHI', 'tor:22,34,0 head:-14,-30,0 aR:-140,0,-62 fR:-26,0,0 w:110,0,0 aL:-92,0,4 fL:-4,0,0 lR:-66,0,-10 sR:84,0,0 cR:-10,0,0 lL:46,0,12 sL:44,0,0 cL:14,0,0 ao:30,0,0 toc:16,0,0 jy:-.16 cham:1',
]);
DK.clip('PBN_TRAN', '0 THU; .14 PBN_KET o; .34 PBN_KET; .55 PBN_TRIEU bat; .95 PBN_TRIEU; 1.1 PBN_CHI o; 1.85 PBN_CHI; 2.2 THU io', null, null, { xoay: [.36, .6, 360], tron: .08, ra: .3, than: 1 });

// ---- đội hình: mỗi hàm nhận X = { nv, Tg (điểm đất đích), P (vị trí thi triển), f, r, mau, pb, dich } ----
// trả { N, co(i), raDur, tRa(i), goc(i) (điểm xuất phát — mặc định sau lưng), slot(i,t) → [p, d, an, coK], tLao(i), duong(i, p) → { G, K?, toc }, st(i), cam(s,G,d), buoc(t,dt,ds), ket(), rVung }
const HE = {};
HE.sen = X => {
  const N = 12, Lb = .95 * 1.4;
  const C = new V3();
  const tam = t => { const u = easeIO((t - 1.0) / .5); return C.copy(X.P).add(new V3(0, 3.1, 0)).addScaledVector(X.f, -.2).lerp(new V3(X.Tg.x, 3.9, X.Tg.z), u); };
  const ao = [];
  return {
    N, co: () => 1.4, raDur: .35, tRa: i => .32 + i * .03, rVung: 1.4,
    slot(i, t) {
      const c = tam(t), trong = i < 6, bloom = easeO((t - .55) / .5), quay = t * 1.1;
      const a = (i % 6) / 6 * TAU + (trong ? 0 : TAU / 12) + quay, ra = new V3(Math.cos(a), 0, Math.sin(a));
      const nghieng = (trong ? 24 : 62) * D * (.2 + .8 * bloom), rr = (trong ? .22 : .5) + .15 * bloom;
      const d = UP.clone().multiplyScalar(Math.cos(nghieng)).addScaledVector(ra, Math.sin(nghieng));
      ao[i] = ra;
      return [c.clone().addScaledVector(ra, rr).addScaledVector(d, Lb * .35).add(new V3(0, trong ? 0 : -.2, 0)), d];
    },
    tLao: i => 1.62 + (i % 3) * .2 + Math.floor(i / 3) * .03,
    duong: (i) => ({ G: X.Tg.clone().addScaledVector(ao[i] || X.f, i < 6 ? .3 : .7), toc: 34 }),
    st: () => 26,
    cam(s, G) { vfx.hat(G.clone().setY(.2), { so: 6, mau: 0xbfffe0, toc: 3, co: .07, song: .5, huong: UP, loe: .8 }); },
    ket() {
      // sen ngọc nở trên đất: hai vòng sáng + đĩa sen (12 cánh khối) rồi tan
      vfx.vong(X.Tg, { bk0: .4, bk1: 5, mau: X.mau, song: .7, op: .8, day: .5 });
      vfx.vong(X.Tg, { bk0: .2, bk1: 3, mau: 0xffffff, song: .45, op: .5 });
      canhSen(X.Tg, X.mau);
      dia.no(X.Tg, { muc: 2, r: 2, mau: X.mau }); dia.pha(X.Tg, 4.6);
      vfx.vaCham({ kieu: 'chop', mau: X.mau, song: .06 });
    },
  };
};
HE.mua = X => {
  const N = 18, tMay = .95, tron = [];   // mưa: kiếm to hơn, rơi 24 m/s để mắt còn thấy hình kiếm
  for (let i = 0; i < N; i++) tron.push(i); tron.sort(() => Math.random() - .5);
  const thu = {}; tron.forEach((v, k) => thu[v] = k);
  const vt = i => { const a = i * 2.39996, rr = 2.4 * Math.sqrt((i + .5) / N); return new V3(Math.cos(a) * rr, 0, Math.sin(a) * rr); };
  let mayX = false;
  return {
    N, co: () => 1.1, raDur: .14, tRa: i => .32 + i * .018, rVung: 2.6,
    slot(i, t) {
      if (t < tMay) { const b = X.P.clone().add(new V3(0, 1.6 + (t - .32 - i * .018) * 26, 0)).addScaledVector(X.f, -.3); return [b, UP.clone(), b.y > 7.5]; }
      const o = vt(i), y = 6.2 + (i % 3) * .45 + Math.sin(t * 3 + i) * .06;
      const d = DOWN.clone().addScaledVector(X.f, .18).normalize();
      return [new V3(X.Tg.x + o.x, y, X.Tg.z + o.z).addScaledVector(X.f, -1.4), d, false, clamp((t - tMay) / .2, 0, 1)];
    },
    tLao: i => 1.45 + thu[i] * .055,
    duong: (i, p) => { const o = i % 3 === 0 ? new V3(R(-.15, .15), 0, R(-.15, .15)) : vt(i).multiplyScalar(.9); return { G: X.Tg.clone().add(o), toc: 24 }; },
    st: () => 26,
    buoc(t) {
      if (!mayX && t >= tMay - .08) {
        mayX = true; const c = new V3(X.Tg.x, 6.8, X.Tg.z).addScaledVector(X.f, -1.4);
        vfx.hat(c, { so: 46, mau: 0xdff6ff, toc: 1.2, co: .22, song: 1.7, trongLuc: 0, can: 3, dat: false, lech: 1.6 });
        vfx.hat(c, { so: 24, mau: X.mau, toc: .8, co: .15, song: 1.4, trongLuc: 0, can: 3, dat: false, lech: 2.2 });
        vfx.vong(c, { bk0: .5, bk1: 3.6, mau: X.mau, song: .7, op: .6, cao: 0, phap: UP });
        vfx.vienMan(X.mau, 1.6, .22);
      }
    },
    cam(s, G) {
      dia.chay(G, .8, { mau: 0x9fe0ff, manh: .35 });
      vfx.hat(G.clone().setY(.15), { so: 7, mau: 0x8fdcff, toc: 3.5, co: .06, song: .55, huong: UP, loe: .6, trongLuc: 9 });
      vfx.hat(G.clone().setY(.1), { so: 4, mau: 0xffffff, toc: 1.5, co: .1, song: .5, trongLuc: 0, can: 3 });
    },
    ket() {
      dia.gai(X.Tg, { so: 9, r: 2.2, cao: 1.9, mau: 0xcff2ff, song: 2.6 });
      dia.chay(X.Tg, 3.4, { mau: 0xbfeaff, manh: .45 }); dia.song(X.Tg, { r: 5, toc: 12, cao: .18 }); dia.gio(X.Tg, 6, 1.6); dia.pha(X.Tg, 4.6);
      vfx.hat(X.Tg.clone().setY(.4), { so: 30, mau: 0xe8fbff, toc: 5, co: .1, song: .9, trongLuc: 4, lech: 1 });
      if (X.dich) DK.chuNoi('Chậm', X.dich.diem('dau').add(new V3(0, .9, 0)), '#9fe8ff');
      vfx.troi(0x5f8fb0, 2.2, .3); vfx.vaCham({ kieu: 'chop', mau: X.mau, song: .06 }); DK.rung(.3, .3);
    },
  };
};
HE.vong = X => {
  const N = 12, nv = X.nv; let tTia = 0; const dau = [];
  return {
    N, co: () => 1.15, raDur: .3, tRa: i => .32 + i * .035, rVung: 1.2,
    slot(i, t) {
      const f = nv.toi(), r = nv.phai(); const H = nv.pos.clone().add(new V3(0, 1.8, 0)).addScaledVector(f, -.65);
      const a = i / N * TAU + t * 2.2, mo = .45 + .55 * easeO((t - .4) / .5);
      const rad = r.clone().multiplyScalar(Math.cos(a)).addScaledVector(UP, Math.sin(a));
      const p = H.addScaledVector(rad, 1.45 * mo); dau[i] = p.clone().addScaledVector(rad, .62 * 1.09);
      return [p, rad];
    },
    tLao: i => 1.28 + (i % 3) * .24 + Math.floor(i / 3) * .025,
    duong: (i, p) => { const a = i / N * TAU, G = X.Tg.clone().add(new V3(Math.cos(a) * .35, 0, Math.sin(a) * .35)); return { G, K: p.clone().lerp(G, .5).add(new V3(0, 4.5, 0)), toc: 34 }; },
    st: () => 26,
    buoc(t, dt, ds) {
      // hồ quang nối các kiếm kề nhau trên vòng (vòng sau lưng — không phải đường nối tới đích)
      tTia += dt; if (tTia < .07) return; tTia = 0;
      const j = Math.floor(Math.random() * N), s1 = ds[j], s2 = ds[(j + 1) % N];
      if (s1.trang === 2 && s2.trang === 2 && dau[j] && dau[(j + 1) % N]) vfx.tia(dau[j], dau[(j + 1) % N], { zigzag: .25, rong: .035, mau: X.mau.clone().multiplyScalar(1.5), song: .08 });
    },
    cam(s, G) {
      const top = G.clone().add(new V3(R(-1.5, 1.5), 11, R(-1.5, 1.5)));
      vfx.tia(top, G.clone().setY(.05), { zigzag: .9, rong: .07, mau: X.mau.clone().multiplyScalar(1.7), song: .12 });
      vfx.chop(G.clone().setY(.4), { co: 2.2, mau: X.mau, song: .18 });
    },
    ket() {
      for (let k = 0; k < 3; k++) DK.sau(k * .06, () => vfx.tia(X.Tg.clone().add(new V3(R(-2, 2), 14, R(-2, 2))), X.Tg.clone().setY(.05), { zigzag: 1.4, rong: .14, mau: X.mau.clone().multiplyScalar(1.8), song: .16 }));
      vfx.cot(X.Tg, { r: .9, cao: 12, mau: X.mau, song: .4, op: .6 });
      dia.no(X.Tg, { muc: 2, r: 2.2, mau: X.mau }); dia.pha(X.Tg, 4.8);
      vfx.troi(0x2a1840, 2, .45); vfx.vaCham({ kieu: 'dao', mau: X.mau, song: .07 });
    },
  };
};
HE.bq = X => {
  const N = 9, Q = new V3(X.Tg.x, 4.1, X.Tg.z); let dia_ = null, tranXong = false, soNho = 0;
  const goc8 = i => i / 8 * TAU + Math.PI / 8;
  return {
    N, co: i => i === 8 ? 2.6 : 1.15, raDur: .42, tRa: i => i === 8 ? 1.15 : .32 + i * .04, rVung: 2.2,
    goc: i => i === 8 ? Q.clone().add(new V3(0, 1.2, 0)) : null,
    slot(i, t) {
      if (i === 8) return [Q.clone().add(new V3(0, 1.2 + Math.sin(t * 4) * .05, 0)), DOWN.clone(), false, .2 + .8 * easeBat((t - 1.15) / .45)];
      const a = goc8(i) + t * .5, ra = new V3(Math.cos(a), 0, Math.sin(a));
      const d = DOWN.clone().multiplyScalar(Math.cos(18 * D)).addScaledVector(ra, -Math.sin(18 * D));
      return [Q.clone().addScaledVector(ra, 2.3), d];
    },
    tLao: i => i === 8 ? 2.25 : 1.75 + i * .035,
    duong: (i, p) => i === 8 ? { G: X.Tg.clone(), toc: 24 } : { G: X.Tg.clone().add(new V3(p.x - Q.x, 0, p.z - Q.z).normalize().multiplyScalar(1.7)), toc: 30 },
    st: i => i === 8 ? 104 : 0,
    buoc(t) {
      if (!dia_ && t >= .7) {
        dia_ = hinhBatQuai(2.9, X.mau, { a: 0, k: 1.6 }); dia_.rotation.x = -Math.PI / 2; dia_.position.copy(Q).add(new V3(0, .05, 0));
        vfx.them(dia_, 2.2, (dt, u, tt) => { dia_.rotation.z += dt * .9; dia_.datMo(.85 * clamp(tt / .3, 0, 1) * (u > .8 ? (1 - u) / .2 : 1)); dia_.scale.setScalar(.6 + .4 * easeO(tt / .4)); });
        vfx.vienMan(X.mau, 2, .16);
      }
    },
    cam(s, G) {
      if (s.i === 8) return;
      vfx.vong(G, { bk0: .1, bk1: 1, mau: X.mau, song: .35, op: .8 });
      if (++soNho === 8 && !tranXong) {
        // tám kiếm cắm thành trận bát giác ⇒ trận đồ dưới chân đích, trói + sát thương trận
        tranXong = true; const g = hinhBatQuai(1.95, X.mau, { a: 0, k: 1.4 }); g.rotation.x = -Math.PI / 2; g.position.copy(X.Tg).setY(.06);
        vfx.them(g, 3.2, (dt, u, tt) => { g.rotation.z -= dt * .6; g.datMo(.75 * clamp(tt / .15, 0, 1) * (u > .75 ? (1 - u) / .25 : 1)); });
        vfx.cot(X.Tg, { r: 1.9, cao: 3, mau: X.mau, song: .5, op: .35 });
        if (X.dich) DK.trung(X.dich, { st: 208, nguon: X.nv, mau: hexCss(X.mau), trangThai: 'Trói' });
      }
    },
    ket() {
      dia.no(X.Tg, { muc: 3, r: 2.4, mau: X.mau }); dia.pha(X.Tg, 5.5);
      vfx.cot(X.Tg, { r: 1.2, cao: 10, mau: X.mau, song: .5, op: .55 });
      vfx.vaCham({ kieu: 'dao', mau: X.mau, song: .07 });
    },
  };
};
HE.xoan = X => {
  const N = 12, nv = X.nv;
  return {
    N, co: () => 1.1, raDur: .3, tRa: i => .3 + i * .04, rVung: 1.6,
    slot(i, t) {
      const a = i * .95 + t * 2.4, rr = 1.05 + .1 * Math.sin(t * 3 + i);
      const p = nv.pos.clone().add(new V3(Math.cos(a) * rr, .35 + i * .21, Math.sin(a) * rr));
      return [p, new V3(-Math.sin(a), .38, Math.cos(a)).normalize()];
    },
    tLao: i => 1.3 + i * .075,
    duong: (i, p) => { const a = i * .95, G = X.Tg.clone().add(new V3(Math.cos(a) * (.2 + .06 * i), 0, Math.sin(a) * (.2 + .06 * i))); return { G, K: p.clone().lerp(G, .5).add(new V3(0, 3.2, 0)).addScaledVector(X.r, i % 2 ? 1.6 : -1.6), toc: 32 }; },
    st: () => 26,
    cam(s, G) { dayLeo(G, .9 + Math.random() * .4, 3.6); vfx.hat(G.clone().setY(.3), { so: 6, mau: 0x7acc48, toc: 2.5, co: .07, song: .9, trongLuc: 3, to: true }); },
    ket() {
      dia.gai(X.Tg, { so: 8, r: 2, cao: 1.7, mau: 0x5a3a1e, song: 2.6 });
      for (let k = 0; k < 7; k++) { const a = k / 7 * TAU; dayLeo(X.Tg.clone().add(new V3(Math.cos(a) * 1.3, 0, Math.sin(a) * 1.3)), 1.6, 3); }
      dia.chay(X.Tg, 3, { mau: 0x4f9a2c, manh: .3 }); dia.song(X.Tg, { r: 4.5, toc: 10, cao: .16 }); dia.gio(X.Tg, 6, 1.6); dia.pha(X.Tg, 4.8);
      vfx.hat(X.Tg.clone().setY(.5), { so: 30, mau: 0x8fd850, toc: 4, co: .08, song: 1.4, trongLuc: 2.5, to: true, lech: 1.2 });
      if (X.dich) DK.chuNoi('Trói', X.dich.diem('dau').add(new V3(0, .9, 0)), '#b8f08a');
      vfx.vaCham({ kieu: 'chop', mau: X.mau, song: .06 }); DK.rung(.3, .3);
    },
  };
};
// cánh sen ngọc nở trên đất (12 cánh khối dẹt dựng lên rồi tan)
function canhSen(p, mau) {
  const g = new T.Group(); g.position.copy(p).setY(.05); const ds = [];
  const mat = new T.MeshBasicMaterial({ color: new T.Color(mau).multiplyScalar(.75), transparent: true, opacity: .45, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false });
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU + (i % 2 ? TAU / 24 : 0), trong = i % 2 === 0, gg = new T.Group(); gg.rotation.y = -a; g.add(gg);
    const m = new T.Mesh(new T.BoxGeometry(.9, .04, 2.2).translate(0, 0, 1.1), mat); m.scale.set(trong ? .8 : 1, 1, trong ? .8 : 1); gg.add(m); ds.push({ m, trong });
  }
  vfx.them(g, 1.5, (dt, u) => { for (const d of ds) d.m.rotation.x = -(d.trong ? 1.05 : .55) * easeO(u / .35); g.scale.setScalar(.6 + .7 * easeO(u / .4)); mat.opacity = .45 * (u > .55 ? (1 - u) / .45 : 1); });
}
// dây leo mọc từ đất (khối nối nhau xoắn lên, mọc dần rồi rút xuống)
const matDayLeo = matDac(0x3f8a2c, { roughness: .85, emissive: 0x1f5a12, emissiveIntensity: .3 }); matDayLeo.giu = true;
const matLaLeo = matDac(0x7acc48, { roughness: .85, emissive: 0x2f6a1a, emissiveIntensity: .3 }); matLaLeo.giu = true;
const geoDay = new T.BoxGeometry(.08, .2, .08); geoDay.giu = true; const geoLa = new T.BoxGeometry(.2, .03, .13); geoLa.giu = true;
function dayLeo(p, cao, song) {
  const g = new T.Group(); g.position.copy(p).setY(0); const n = Math.round(cao / .16), ds = [], a0 = Math.random() * TAU;
  for (let i = 0; i < n; i++) {
    const a = a0 + i * .8, m = new T.Mesh(i % 3 === 2 ? geoLa : geoDay, i % 3 === 2 ? matLaLeo : matDayLeo);
    m.position.set(Math.cos(a) * .16, i * .16 + .1, Math.sin(a) * .16); m.rotation.set(Math.sin(a) * .5, a, Math.cos(a) * .4); m.castShadow = true; g.add(m); ds.push(m);
  }
  vfx.them(g, song, (dt, u, t) => { const lui = u > .85 ? (u - .85) / .15 : 0; ds.forEach((m, i) => { const k = clamp((t * 3.2 - i / n) * 2, 0, 1) * (1 - lui); m.scale.setScalar(Math.max(.001, k)); }); });
}

PBN.kiemTran = function (ctx) {
  const nv = ctx.nv, pb = pbChon(), cau = CAU[pb.ma] || CAU.ngoc_kiem, mau = new T.Color(pb.mau_hex);
  const dich = ctx.dich && ctx.dich.pos.distanceTo(nv.pos) <= 60 ? ctx.dich : null;
  if (dich) nv.ngam(dich.pos);
  if (!nv.dangCuoi) ctx.phat('PBN_TRAN', { khoaDi: true, khongMv: true });
  const f = nv.toi(), r = nv.phai();
  const Tg = dich ? dich.pos.clone().setY(0) : nv.pos.clone().addScaledVector(f, 10).setY(0);
  const X = { nv, Tg, P: nv.pos.clone(), f, r, mau, pb, dich };
  const he = HE[cau.tran](X);
  vfx.chu(cau.tenTran, { mau: hexCss(mau), song: 1.3 });
  // mở trận: ấn quang ở tay kiếm chỉ + vòng dưới chân
  DK.sau(.16, () => { vfx.chop(nv.diem('tayL'), { co: .9, mau, song: .3 }); vfx.vong(nv.pos, { bk0: .3, bk1: 2.4, mau, song: .5, op: .55 }); });
  DK.sau(.5, () => { vfx.chop(nv.diem('tayL'), { co: 1.4, mau, song: .35 }); vfx.hat(nv.diem('tayL'), { so: 10, mau, toc: 4, huong: UP, loe: .3, co: .05, song: .4, trongLuc: 0 }); dia.gio(nv.pos, 3.5, .9); });
  DK.sau(1.1, () => { vfx.chop(nv.diem('tayL'), { co: 1.1, mau, song: .25 }); });

  const ds = [];
  for (let i = 0; i < he.N; i++) ds.push({ i, trang: 0, pk: null, p: new V3(), pT: new V3(), d: UP.clone(), co: he.co(i), an: false, trung: false });
  let t = 0, soCam = 0, ketXong = false, daBao = false, tHat = 0;
  const Lb = s => .95 * s.co;
  DK.lap((dt) => {
    t += dt; tHat += dt; const phatHat = tHat > .02; if (phatHat) tHat = 0;
    if (he.buoc) he.buoc(t, dt, ds);
    let con = 0;
    for (const s of ds) {
      if (s.trang === 6) continue; con++;
      if (s.pk && s.pk.cap) s.pk.cap(dt);
      if (s.trang === 0) {
        if (t < he.tRa(s.i)) continue;
        s.trang = 1; s.t0 = t; s.pk = taoKiem(pb, { co: s.co, song: 12 });
        const g = he.goc ? he.goc(s.i) : null;
        s.B = g || nv.diem('lung').addScaledVector(nv.toi(), -.2).add(new V3(R(-.15, .15), .1, 0)); s.tuGoc = !!g;
        if (!g && s.i % 3 === 0) vfx.hat(s.B, { so: 4, mau, toc: 2, co: .05, song: .3, trongLuc: 0 });
      }
      if (s.trang === 1 || s.trang === 2) {
        const sl = he.slot(s.i, t);
        if (sl[2] && !s.an) { s.an = true; if (s.pk) s.pk.huy(); s.pk = null; }
        else if (!sl[2] && s.an) { s.an = false; s.pk = taoKiem(pb, { co: s.co, song: 12 }); s.p.copy(sl[0]); vfx.chop(sl[0], { co: .8, mau, song: .2 }); }
        const coK = sl[3] != null ? sl[3] : 1;
        if (s.trang === 1) {
          const u = (t - s.t0) / he.raDur;
          if (s.tuGoc) { s.p.copy(sl[0]); s.d.copy(sl[1]); }
          else { const k = s.B.clone().add(new V3(0, 1.2, 0)).addScaledVector(X.f, -.5); bez(s.B, k, sl[0], easeO(u), s.p); s.d.copy(UP).lerp(sl[1], easeIO(u)).normalize(); }
          if (s.pk) datKiem(s.pk, s.p, s.d, (s.tuGoc ? coK : (.3 + .7 * easeO(u)) * coK));
          if (u >= 1) s.trang = 2;
        } else {
          s.p.copy(sl[0]); s.d.copy(sl[1]); if (s.pk) datKiem(s.pk, s.p, s.d, coK);
          if (t >= he.tLao(s.i) - .28) {
            s.trang = 3; s.tN = t; s.P0 = s.p.clone(); s.duong = he.duong(s.i, s.p.clone());
            s.huongNgam = (s.duong.K || s.duong.G).clone().sub(s.p).normalize();
            if (!daBao) { daBao = true; vfx.vung(Tg, { r: he.rVung, song: .55, mau }); }
          }
        }
        continue;
      }
      if (s.trang === 3) {
        // ngắm: lùi nhẹ, mũi quay về đường lao, mũi sáng dần (không có tia nối)
        const u = (t - s.tN) / .28;
        s.p.copy(s.P0).addScaledVector(s.huongNgam, -.4 * easeO(u)); s.d.lerp(s.huongNgam, tien(16, dt)).normalize();
        datKiem(s.pk, s.p, s.d, s.co / s.co * (he.slot(s.i, t)[3] || 1));
        if (phatHat && Math.random() < .5) vfx.hat(s.p.clone().addScaledVector(s.d, Lb(s) * .65), { so: 1, toc: 0, mau, co: .05 + .05 * u, song: .12, trongLuc: 0, dat: false });
        if (u >= 1) {
          s.trang = 4; s.A = s.p.clone(); s.K = s.duong.K || s.A.clone().lerp(s.duong.G, .5); s.G = s.duong.G;
          const L = s.A.distanceTo(s.K) + s.K.distanceTo(s.G); s.dur = L / s.duong.toc; s.u = 0; s.pT.copy(s.p);
          vfx.chop(s.p, { co: .9 * s.co, mau, song: .18 }); if (s.i % 4 === 0) DK.rung(.1);
        }
        continue;
      }
      if (s.trang === 4) {
        s.pT.copy(s.p); s.u = Math.min(1, s.u + dt / s.dur);
        const e = .3 * s.u * s.u + .7 * s.u;
        bez(s.A, s.K, s.G, e, s.p); bezD(s.A, s.K, s.G, e, s.d).normalize();
        // mũi chạm đất ⇒ cắm
        const mui = s.p.clone().addScaledVector(s.d, Lb(s) * .65);
        datKiem(s.pk, s.p, s.d, s.co);
        if (phatHat) vfx.hat(s.p.clone(), { so: 1, toc: 1.5, huong: s.d.clone().negate(), loe: .1, mau, co: .05, song: .2, trongLuc: 0, dat: false });
        if (!s.trung) for (const b of DK.trongDuong(s.pT, s.p, .64)) {
          const y = (s.pT.y + s.p.y) / 2 - b.pos.y; if (y > -.3 && y < 2.4) {
            s.trung = true; const st = he.st(s.i);
            if (st > 0) DK.trung(b, { st, nguon: nv, mau: hexCss(mau), day: s.i === he.N - 1 ? 1.5 : 0 });
            vfx.chop(b.diem('nguc'), { co: 1.2 * s.co, mau, song: .18 }); vfx.hat(b.diem('nguc'), { so: 8, mau, toc: 6, co: .06, song: .4 }); break;
          }
        }
        if (mui.y <= dia.cao(mui.x, mui.z) + .02 || s.u >= 1) {
          // cắm đất: đổi sang kiếm cắm (không vệt) đúng chỗ, chôn ~28 % lưỡi
          const G = new V3(mui.x, dia.cao(mui.x, mui.z), mui.z);
          s.pk.huy(); s.pk = taoKiem(pb, { co: s.co, vet: false, song: 6, hat: false });
          s.d.y = Math.min(s.d.y, -.35); s.d.normalize();
          s.p.copy(G).addScaledVector(s.d, -Lb(s) * .38); datKiem(s.pk, s.p, s.d, s.co);
          const to = s.co > 2;
          dia.vun(G, { so: to ? 30 : 5, luc: to ? 5 : 2, len: to ? 6 : 3, co: to ? .22 : .1 });
          dia.ho(G, (to ? 1.6 : .4) * Math.min(1.5, s.co), to ? .5 : .1, { mau });
          dia.nut(G, { r: to ? 3.5 : 1.1 * s.co, nhanh: to ? 9 : 4, mau, song: 3 });
          vfx.vong(G, { bk0: .1, bk1: 1.3 * s.co, mau, song: .35, op: .7 });
          vfx.hat(G.clone().setY(.15), { so: 7, mau, toc: 4, co: .06, song: .4, huong: UP, loe: .7 });
          dia.gio(G, 2.2 * s.co, .7);
          he.cam(s, G, s.d);
          s.trang = 5; s.tC = t; soCam++;
          if (soCam === he.N && !ketXong) { ketXong = true; he.ket(); }
        }
        continue;
      }
      if (s.trang === 5) {
        // kiếm cắm đứng lại ~4,4 s rồi chìm xuống đất
        const tc = t - s.tC;
        if (tc > 4.4) { s.p.addScaledVector(s.d, dt * Lb(s) * 1.3); datKiem(s.pk, s.p, s.d, s.co); }
        if (tc > 5) { s.pk.huy(); s.pk = null; s.trang = 6; }
      }
    }
    if (con === 0) return false;
  });
};

// ============================================================================
// 3) NGỰ KIẾM (F) — kiếm lớn ra từ sau lưng, phóng to, đứng lên bay; bay WASD như bản game (Bay.cs / ThongSoBay)
// ============================================================================
const VC = { toc: 14, lao: 27, giaToc: 3.2, nghieng: .55, caoDung: .08, quay: 7, canKhi: 1.4, lenXuong: 9, cuiMax: .35, lacBien: .03, lacTanSo: 2.6, lacLan: .02 };
const TS = { CAT_CANH_HOP: 7, TG_GOI: .52, CAT_CANH_NANG: 6.5, CAT_CANH_TG: 1, BAY_LEN: 6.5, BAY_LEN_LAO: 9.5, TOC_DOC: 4,
  TRONG_LUC: 24, ROI_NHANH: 1.3, ROI_TOI_DA: 34, DI: 3.8, CHAY: 6.4, KHONG_DIEU_KHIEN: 2.6, QUAY_TOI_DA: 9.5,
  HA_CANH_HE: 1.9, HA_CANH_TOC_MIN: 1.4, HA_CANH_TOC_MAX: 15, HA_CANH_CHAM: .06, HA_CANH_CAO: .25, DA: .08, Y_MAX: 80, DEM: 6 };
const KI = DK.KI;
const TTD = DK.tt('PBN_CUOI_DONG', 'cham:1'); TTD.set(DK.TT.CUOI_KIEM);
DK.clip('PBN_CUOI_GIU', '0 PBN_CUOI_DONG', null, null, { tron: .18, ra: .25, than: 0 });

/** kiếm cưỡi: kiemThat dài 2,3 m bản rộng + trang trí + quầng dưới + (bát quái) đĩa quẻ dưới chân. gốc nhóm = đế chân */
function dungKiemCuoi(pb) {
  const c = CAU[pb.ma] || CAU.ngoc_kiem, mau = new T.Color(pb.mau_hex);
  const goc = new T.Group(); goc.rotation.order = 'YXZ';
  const k = vfx.kiemThat({ dai: 2.3, rong: .26, mau, kim: c.kim, chan: c.chan, chuoi: c.chuoi, tua: c.tua, sang: c.sang * .9, kieu: 'rong' });
  k.position.set(0, -.07, -.95); goc.add(k);
  const cap = trangTri(k, pb.ma, { kieu: 'rong', rong: .26, hat: true });
  const quang = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: vfx.texTron, color: mau, transparent: true, opacity: .6, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false }));
  quang.rotation.x = -Math.PI / 2; quang.position.set(0, -.16, .15); quang.scale.set(1.3, 3.6, 1); goc.add(quang);
  let bq = null;
  if (pb.ma === 'bat_quai_kiem') { bq = hinhBatQuai(1.05, mau, { a: .7, k: 1.4 }); bq.rotation.x = -Math.PI / 2; bq.position.set(0, -.22, .1); goc.add(bq); }
  return { goc, k, cap, quang, bq, mau, ma: pb.ma };
}
/** dải sáng 2 mép đuôi kiếm (như VatCuoi.Dai) — 30 mẫu, tắt theo tuổi .45 s, thon về đuôi */
function taoDai(mau) {
  const n = 30, A = [], B = [], tuoi = new Float32Array(n).fill(9), sang = new Float32Array(n); let dau = 0;
  for (let i = 0; i < n; i++) { A.push(new V3()); B.push(new V3()); }
  const geo = new T.BufferGeometry(), P = new Float32Array(n * 6), C = new Float32Array(n * 6);
  geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setAttribute('color', new T.BufferAttribute(C, 3));
  const I = []; for (let i = 0; i < n - 1; i++) { const a = i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } geo.setIndex(I);
  const m = new T.Mesh(geo, new T.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false }));
  m.frustumCulled = false; m.renderOrder = 7;
  const x = vfx.them(m, 1e6);
  const mid = new V3(), pa = new V3(), pb = new V3(), cm = mau.clone().multiplyScalar(1.4);
  return {
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
        let r = cm.r * f, g = cm.g * f, b = cm.b * f; if (i === 0) { r += f * .5; g += f * .5; b += f * .5; }
        C[i * 6] = C[i * 6 + 3] = r; C[i * 6 + 1] = C[i * 6 + 4] = g; C[i * 6 + 2] = C[i * 6 + 5] = b;
      }
      m.visible = co; geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
    },
    huy() { x.t = x.song; },
  };
}
// hạt theo thuộc tính khi bay (k = tốc / tốc lượn)
function hatThuocTinh(ma, q, v, mau, k) {
  const lui = v.clone().multiplyScalar(-.12);
  if (ma === 'ngoc_kiem') vfx.hat(q, { so: 1, mau: Math.random() < .3 ? 0xffffff : 0x8fffc8, toc: .5 + lui.length(), huong: lui.lengthSq() > .01 ? lui : UP, loe: .6, co: R(.04, .07), song: R(.6, 1), trongLuc: -.4, can: 2, dat: false });
  else if (ma === 'thuy_kiem') { vfx.hat(q, { so: 1, mau: 0x7fd8ff, toc: .3, huong: DOWN, loe: .2, co: R(.04, .06), song: .9, trongLuc: 9, can: .3 }); if (Math.random() < .25) vfx.hat(q, { so: 1, mau: 0xe8fbff, toc: .4, co: R(.12, .2), song: .7, trongLuc: 0, can: 3, dat: false }); }
  else if (ma === 'tu_kiem') vfx.hat(q, { so: 1, mau: Math.random() < .4 ? 0xffffff : mau.clone().multiplyScalar(1.5), toc: R(2, 4) + k, co: R(.03, .05), song: R(.12, .25), trongLuc: 0, can: 1, dat: false });
  else if (ma === 'bat_quai_kiem') vfx.hat(q, { so: 1, mau: 0xffd070, toc: .8, huong: UP, loe: .3, co: R(.04, .07), song: R(.5, .8), trongLuc: -.6, can: 1.5, dat: false });
  else vfx.hat(q, { so: 1, mau: Math.random() < .5 ? 0x6ab83c : 0x9be06a, toc: .6 + lui.length() * .5, huong: lui.lengthSq() > .01 ? lui : DOWN, loe: .8, co: R(.06, .09), song: R(1, 1.6), trongLuc: 1.8, can: 1.6, to: true });
}

let S = null;
const anKiemTay = (nv, an) => { if (nv.kiemThat) nv.kiemThat.visible = !an; if (nv.kiemThat && nv.kiemThat.tua) nv.kiemThat.tua.forEach(d => d.m.visible = !an); if (nv.kiemMesh && !nv.kiemThat) nv.kiemMesh.visible = !an; };
function dongCuoi(nv) {
  if (!S) return; const s = S; S = null; s.song = false;
  nv.dangCuoi = false; nv.treo = false; nv.cui = 0; nv.nghieng = 0;
  nv.root.rotation.set(0, nv.yaw, 0);
  if (nv.hd && nv.hd.clip === DK.CLIP.PBN_CUOI_GIU) nv.hd.dung();
  anKiemTay(nv, false);
}
DK.nghe('datLai', () => { if (S) { const s = S; dongCuoi(DK.nc); try { s.x.t = s.x.song; s.dai.forEach(d => d.huy()); } catch (e) { } } });

PBN.nguKiem = function (ctx, muc) {
  const nv = ctx.nv, pb = pbChon(muc), mau = new T.Color(pb.mau_hex);
  if (S && S.song) {
    // F lần nữa: cưỡi / nâng ⇒ hạ cánh; đang hạ ⇒ huỷ hạ; đang gọi kiếm ⇒ bỏ qua (Bay.BamBay)
    if (S.che === 'cuoi' || S.che === 'nang') { S.che = 'ha'; S.tPha = S.tSim; }
    else if (S.che === 'ha') S.che = 'cuoi';
    return;
  }
  const mo = dungKiemCuoi(pb);
  const x = vfx.them(mo.goc, 1e6, null, () => { if (mo.k.huyTua) mo.k.huyTua(); });
  const s = S = { song: true, che: 'goi', tSim: 0, tPha: 0, v: new V3(nv.vel.x, TS.CAT_CANH_HOP, nv.vel.z), vTruoc: new V3(), yaw: nv.yaw, cui: 0, ng: 0,
    wLao: 0, lx: 0, mo, x, dai: [taoDai(mau), taoDai(mau)], tichDai: 0, tichHat: 0, tichGio: 0, k: 0, lung0: nv.diem('lung') };
  nv.dangCuoi = true; nv.treo = true; nv.vel.set(0, 0, 0); nv.datDat = false;
  if (nv.hd) nv.hd.dung();
  anKiemTay(nv, true);
  // ra kiếm: chớp sau lưng + vòng dưới chân + gió cất cánh
  vfx.chop(s.lung0, { co: 1.6, mau, song: .3 }); vfx.vong(nv.pos, { bk0: .3, bk1: 3.4, mau, song: .5, op: .7, day: .35 });
  vfx.hat(s.lung0, { so: 14, mau, toc: 3, huong: UP, loe: .5, co: .06, song: .5, trongLuc: 0 });
  dia.gio(nv.pos, 4.5, 1.3);
  const qDung = new T.Quaternion(), qNgang = new T.Quaternion(), eu = new T.Euler(0, 0, 0, 'YXZ');
  const diemDai = () => {
    const g = mo.goc; g.updateMatrixWorld(true);
    return [new V3(-.2, -.07, -1.5), new V3(.2, -.07, -1.5), new V3(0, .08, -1.5), new V3(0, -.24, -1.5)].map(p => p.applyMatrix4(g.matrixWorld));
  };
  const TT = DK.TT;
  const datTuThe = (dt) => {
    const o = TTD;
    if (s.che === 'goi') { DK.tron(TT.DINH, TT.LEN, clamp(s.v.y / 6, 0, 1), o); if (s.v.y < 0) DK.tron(o, TT.ROI, clamp(-s.v.y / 9, 0, 1), o); return; }
    const vh = s.v.length(); const lao = DK.phim.Shift && vh > VC.toc * .75 ? 1 : 0;
    s.wLao += (lao - s.wLao) * tien(5, dt);
    DK.tron(TT.CUOI_KIEM, TT.CUOI_KIEM_LAO, s.wLao, o);
    const ld = (DK.phim.Control ? 1 : 0) - (DK.phim[' '] ? 1 : 0); s.lx += (ld - s.lx) * tien(4, dt);
    o[KI.tor * 3] += s.lx * 10; o[KI.head * 3] -= s.lx * 6;
    const ng = s.ng / D; o[KI.aL * 3 + 2] += Math.max(0, ng) * 1.1; o[KI.aR * 3 + 2] -= Math.max(0, -ng) * 1.1; o[KI.tor * 3 + 2] -= ng * .25;
  };

  DK.lap((ds) => {
    if (S !== s || !s.song) return false;
    s.tSim += ds; s.vTruoc.copy(s.v);
    const ph = DK.phim, may = DK.may, p = nv.pos;
    let f = 0, r = 0; if (ph.w || ph.ArrowUp) f++; if (ph.s || ph.ArrowDown) f--; if (ph.d || ph.ArrowRight) r++; if (ph.a || ph.ArrowLeft) r--;
    const h = new V3();
    if (f || r) { const fy = may.yaw + Math.PI; h.set(Math.sin(fy) * f - Math.cos(fy) * r, 0, Math.cos(fy) * f + Math.sin(fy) * r).normalize(); }
    const len = !!ph[' '], xuong = !!ph.Control, lx = (len ? 1 : 0) - (xuong ? 1 : 0);
    const ngang = (mx, mz, rTang, rGiam) => { const rate = mx * mx + mz * mz > s.v.x * s.v.x + s.v.z * s.v.z ? rTang : rGiam; const k = tien(rate, ds); s.v.x += (mx - s.v.x) * k; s.v.z += (mz - s.v.z) * k; };
    if (s.che === 'goi') {
      if (s.tSim >= TS.TG_GOI) { s.che = 'nang'; s.tPha = s.tSim; vfx.vong(p.clone().add(new V3(0, -.05, 0)), { bk0: .3, bk1: 2.6, mau, song: .4, op: .6, cao: 0 }); dia.gio(p.clone().setY(0), 3.5, .9); }
      else {
        const gk = s.v.y < 0 ? TS.ROI_NHANH : 1; s.v.y = Math.max(-TS.ROI_TOI_DA, s.v.y - TS.TRONG_LUC * gk * ds);
        const toc = ph.Shift ? TS.CHAY : TS.DI; ngang(h.x * toc, h.z * toc, TS.KHONG_DIEU_KHIEN, TS.KHONG_DIEU_KHIEN * .6);
        p.addScaledVector(s.v, ds); if (p.y < .3) { p.y = .3; s.v.y = Math.max(0, s.v.y); }
      }
    }
    let xongHa = false;
    if (s.che !== 'goi') {
      const lao = ph.Shift && h.lengthSq() > .01, toc = lao ? VC.lao : VC.toc;
      let mx = h.x * toc, mz = h.z * toc;
      let vyMuc = lx * (lao ? VC.lenXuong * TS.BAY_LEN_LAO / TS.BAY_LEN : VC.lenXuong), rateDoc = TS.TOC_DOC;
      if (s.che === 'nang') { const u = (s.tSim - s.tPha) / TS.CAT_CANH_TG; if (u >= 1) s.che = 'cuoi'; else vyMuc += TS.CAT_CANH_NANG * Math.sin(Math.PI * u); }
      else if (s.che === 'ha') {
        if (len) s.che = 'cuoi';
        else { const hh = p.y; vyMuc = -clamp(hh * TS.HA_CANH_HE, TS.HA_CANH_TOC_MIN, TS.HA_CANH_TOC_MAX); rateDoc = 5; mx *= .35; mz *= .35; if (hh < TS.HA_CANH_CHAM + TS.DA + .02) xongHa = true; }
      }
      if (!xongHa) {
        if (s.che === 'cuoi') vyMuc += Math.cos(s.tSim * VC.lacTanSo) * VC.lacBien * VC.lacTanSo * 1.6 * (1 - .6 * Math.min(1, h.length()));
        if (p.y > TS.Y_MAX - TS.DEM) vyMuc = Math.min(vyMuc, (TS.Y_MAX - p.y) * 1.5);
        ngang(mx, mz, VC.giaToc, VC.canKhi);
        s.v.y += (vyMuc - s.v.y) * tien(rateDoc, ds);
        p.addScaledVector(s.v, ds);
        const cao = s.che === 'ha' ? 0 : Math.max(TS.HA_CANH_CAO, VC.caoDung + .05);
        if (p.y < cao) { p.y = cao; if (s.v.y < 0) s.v.y = 0; }
        if (xuong && !len && s.che === 'cuoi' && p.y < .9) { s.che = 'ha'; s.tPha = s.tSim; }
      }
    }
    // xoay (Bay.Xoay)
    const vh = Math.hypot(s.v.x, s.v.z), dangCuoiK = s.che !== 'goi';
    let rate = dangCuoiK ? VC.quay : 5, muc_ = null; const khoa = DK.khoa;
    if (khoa && !(dangCuoiK && ph.Shift && vh > VC.toc * 1.05)) { muc_ = Math.atan2(khoa.pos.x - p.x, khoa.pos.z - p.z); rate = 12; }
    else if (dangCuoiK && vh > 2) muc_ = Math.atan2(s.v.x, s.v.z);
    else if (h.lengthSq() > .01) muc_ = Math.atan2(h.x, h.z);
    if (muc_ != null) { const tran = TS.QUAY_TOI_DA * ds; let dg = ((muc_ - s.yaw) / D + 540) % 360 - 180; s.yaw += clamp(dg * D * tien(rate, ds), -tran, tran); }
    nv.yaw = s.yaw;
    // nghiêng người (NghiengNguoi)
    const sy = Math.sin(s.yaw), cy = Math.cos(s.yaw);
    const ax = (s.v.x - s.vTruoc.x) / ds, az = (s.v.z - s.vTruoc.z) / ds;
    const aLat = -(ax * cy - az * sy), aToi = ax * sy + az * cy, vLat = -(s.v.x * cy - s.v.z * sy), vToi = s.v.x * sy + s.v.z * cy;
    let nMuc, cMuc, kn = 6, kc = 5;
    if (dangCuoiK) { nMuc = clamp(aLat * .05 + vLat * .012, -VC.nghieng, VC.nghieng); cMuc = clamp(vToi / VC.lao * .34 + aToi * .012, -.16, VC.cuiMax); if (s.che === 'nang') cMuc -= .1; else if (s.che === 'ha') cMuc -= .06; kn = 4.5; kc = 4; }
    else { nMuc = clamp(aLat * .01, -.1, .1); cMuc = clamp(-s.v.y * .006, -.1, .12); }
    s.ng += (nMuc - s.ng) * tien(kn, ds); s.cui += (cMuc - s.cui) * tien(kc, ds);
    datTuThe(ds);
    if (!nv.hd) DK.phat(nv, 'PBN_CUOI_GIU', { giu: true, khongMv: true, khoaDi: true });
    nv.cui = dangCuoiK ? s.cui : 0; nv.nghieng = dangCuoiK ? s.ng : 0;
    nv.root.position.copy(p); nv.root.rotation.set(nv.cui, s.yaw, nv.nghieng); nv.root.updateMatrixWorld(true);

    // ---- kiếm cưỡi: pha gọi (sau lưng → trên đầu → lật ngang xuống chân) rồi bám chân ----
    const g = mo.goc, t = s.tSim;
    eu.set(s.cui, s.yaw, s.ng); qNgang.setFromEuler(eu);
    if (s.che === 'goi') {
      const u1 = clamp(t / .26, 0, 1), u2 = clamp((t - .26) / (TS.TG_GOI - .26), 0, 1);
      const dinh = p.clone().add(new V3(0, 3.0, 0)).addScaledVector(nv.toi(), -.3);
      eu.set(-Math.PI / 2, s.yaw + t * 16, 0); qDung.setFromEuler(eu);
      if (u2 <= 0) { g.position.copy(s.lung0).lerp(dinh, easeO(u1)); g.quaternion.copy(qDung); g.scale.setScalar(.35 + .3 * easeO(u1)); }
      else { g.position.copy(dinh).lerp(p.clone().add(new V3(0, -.02, 0)), easeIO(u2)); g.quaternion.copy(qDung).slerp(qNgang, easeIO(u2)); g.scale.setScalar(.65 + .35 * easeBat(u2)); }
      if (Math.random() < .5) vfx.hat(g.position.clone(), { so: 1, mau, toc: 1, co: .06, song: .3, trongLuc: 0, dat: false });
    } else {
      g.position.copy(p); g.quaternion.copy(qNgang); g.scale.setScalar(1);
    }
    const vmp = s.v.length(), k = clamp(vmp / VC.toc, 0, 1.6); s.k = k;
    mo.k.position.y = -.07 + Math.sin(t * 31) * .004 * (1 + k); mo.k.rotation.z = -Math.sin(t * VC.lacTanSo) * VC.lacLan;
    if (mo.k.capTua) mo.k.capTua();
    if (mo.cap) mo.cap(ds);
    if (mo.bq) mo.bq.rotation.z += ds * (1.2 + k);
    mo.quang.material.opacity = .55 * clamp(.5 + .2 * Math.sin(t * 7) + .3 * Math.min(1, k), 0, 1.4) * (s.che === 'goi' ? .3 : 1);
    mo.quang.scale.set(1.3, 3.6 * (1 + k * .25), 1);
    // dải sáng 2 mép đuôi
    for (const d of s.dai) d.buoc(ds);
    const dd = diemDai();
    if (s.tSim < .03 || s.che === 'goi') { s.dai[0].datLai(dd[0], dd[1]); s.dai[1].datLai(dd[2], dd[3]); }
    s.tichDai += ds;
    if (s.tichDai >= 1 / 60) { s.tichDai = 0; const sg = clamp(.3 + k * .9, 0, 1.3); s.dai[0].day(dd[0], dd[1], sg); s.dai[1].day(dd[2], dd[3], sg); }
    s.dai[0].ve(true, dd[0], dd[1]); s.dai[1].ve(true, dd[2], dd[3]);
    // hạt theo thuộc tính
    if (s.che !== 'goi') {
      s.tichHat += (.25 + k * .55) * 60 * ds;
      while (s.tichHat >= 1) { s.tichHat -= 1; g.updateMatrixWorld(true); const q = new V3(R(-.14, .14), -.08, R(-1.5, 1.2)).applyMatrix4(g.matrixWorld); hatThuocTinh(mo.ma, q, s.v, mau, k); }
      // bay thấp: gió kiếm làm rạp cỏ dọc đường
      s.tichGio += ds;
      if (s.tichGio > .08 && p.y < 3.2) { s.tichGio = 0; const day = 1 - p.y / 3.2; if (vmp > 3 || s.che === 'nang') dia.gio(p.clone().setY(0), 2 + vmp * .1, (.3 + .4 * Math.min(1, k)) * day); }
    }
    if (xongHa) {
      // hạ cánh: sóng gió rạp cỏ + sóng đất nhẹ + bụi; kiếm lật dựng, bay về sau lưng thu nhỏ
      p.y = 0; nv.datDat = true; nv.vy = 0; nv.vel.set(s.v.x * .5, 0, s.v.z * .5);
      const pd = p.clone();
      dia.gio(pd, 6.5, 2.2); dia.song(pd, { r: 4.5, toc: 9, cao: .08, rong: 1 });
      vfx.vong(pd, { bk0: .3, bk1: 4.8, mau, song: .55, op: .65, day: .4 }); vfx.vong(pd, { bk0: .2, bk1: 2.6, mau: 0xffffff, song: .35, op: .35 });
      for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; vfx.hat(pd.clone().add(new V3(Math.cos(a) * .6, .1, Math.sin(a) * .6)), { so: 1, mau: 0x9a8c74, toc: R(3, 5), huong: new V3(Math.cos(a), .15, Math.sin(a)), loe: .1, co: R(.08, .14), song: .6, trongLuc: 2, can: 3, to: true }); }
      DK.rung(.12, .2);
      const cu = { pos: g.position.clone(), q: g.quaternion.clone() }, daiCu = s.dai, xCu = s.x;
      dongCuoi(nv); anKiemTay(nv, true);
      let u = 0; const q0 = new T.Quaternion();
      DK.lap((dt2) => {
        u += dt2 / .45; const e = easeIO(u);
        const lung = nv.diem('lung').addScaledVector(nv.toi(), -.15);
        const dinh = cu.pos.clone().add(new V3(0, 1.6, 0));
        if (u < .45) { g.position.copy(cu.pos).lerp(dinh, easeO(u / .45)); eu.set(-Math.PI / 2, nv.yaw + u * 8, 0); q0.setFromEuler(eu); g.quaternion.copy(cu.q).slerp(q0, easeO(u / .45)); }
        else { g.position.copy(dinh).lerp(lung, easeIO((u - .45) / .55)); eu.set(-Math.PI / 2, nv.yaw + u * 8, 0); g.quaternion.setFromEuler(eu); g.scale.setScalar(Math.max(.001, 1 - .75 * easeIO((u - .45) / .55))); }
        if (mo.k.capTua) mo.k.capTua(); mo.quang.material.opacity *= .85;
        for (const d of daiCu) { d.buoc(dt2); d.ve(false); }
        if (u >= 1) { vfx.chop(lung, { co: 1.2, mau, song: .25 }); vfx.hat(lung, { so: 10, mau, toc: 2.5, co: .05, song: .4, trongLuc: 0 }); xCu.t = xCu.song; daiCu.forEach(d => d.huy()); anKiemTay(nv, false); return false; }
      });
      return false;
    }
  });
};

// ============================================================================
// 4) GHI CHÚ đề xuất (hiện trên bảng khi bật bản nâng cấp)
// ============================================================================
PBN.taoKiem = taoKiem; PBN.datKiem = datKiem;   // lộ ra để tự kiểm / tích hợp
PBN.nguon = 'Đề xuất trên nền PhapBaoDanhMon1.cs (HCKiemTran) + Bay.cs / VatCuoi.cs — chưa có trong game';
PBN.ghiChu =
  'ĐỀ XUẤT (chưa có trong game). Q Phi kiếm trận: người chơi kết ấn → triệu kiếm (kiếm chỉ chỉ trời, xoay người) → chỉ kiếm (lao bộ); ' +
  'kiếm thật của phi kiếm đang chọn xếp đội hình theo thuộc tính: Bích Ngọc = hoa sen 12 kiếm nở trên đầu rồi lướt tới đích; Huyền Thủy = 18 kiếm vọt lên mây băng rồi mưa xuống, kết gai băng; ' +
  'Tử Lôi = vòng hào quang 12 kiếm sau lưng có hồ quang, mỗi kiếm vòng cung bổ xuống kèm sét; Bát Quái = 8 kiếm bát giác dưới đĩa quẻ + 1 cự kiếm trấn giữa; Thanh Mộc = 12 kiếm xoắn dây leo quanh người, bung lần lượt, mọc dây leo/rễ. ' +
  'Kiếm cắm đất ở lại ~4,5 s + nứt + hố; đòn kết nổ đất, phá đèn đá/cây trong ~5 m, khung va chạm 1 lần. ST giữ 26/kiếm trúng như game (Bát Quái: trận 208 + cự kiếm 104 ⇒ 312 = 12×26). ' +
  'F Ngự kiếm: cưỡi ĐÚNG phi kiếm đang chọn (game cưỡi kiếm đỏ cố định) — kiếm 2,3 m ra từ sau lưng, vọt lên, lật ngang phóng to vào dưới chân; số bay giữ như game (14/27 m/s…); ' +
  'vệt 2 mép + hạt theo thuộc tính (ngọc quang / giọt nước / tia sét / phù văn vàng + đĩa quẻ dưới chân / lá rụng); bay thấp rạp cỏ; hạ cánh sóng gió + sóng đất nhẹ, kiếm bay về lưng.';
if (DK.veLai) DK.veLai();
})();
