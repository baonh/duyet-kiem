"use strict";
// ============================================================================
// nang_cap.js — 2026-11-15 — LÕI BẢN NÂNG CẤP (đề xuất, chưa có trong game):
//   người dùng chê "hiệu ứng đơn sơ, +10 không đặc sắc, động tác đơn giản, viên mãn không tác động địa hình,
//   kiếm phóng ra không ra kiếm" ⇒ dựng bản đề xuất bên cạnh bản "game hiện tại" để so, duyệt xong mới port Unity.
//   · DK.NC (bật = bản nâng cấp) · DK.dangKyBoNC(ma, bo) · DK.vfx.kiemThat (mô hình kiếm thật: lưỡi thon, sống kiếm, chắn tay, chuôi, tua kiếm)
//   · bloom HDR tự viết (không thêm thư viện) · DK.vfx.vaCham (khung va chạm đảo màu 1–3 khung — KHÔNG chậm thời gian)
//   · DK.dia — địa hình phá được: hố, rãnh, gồ, sóng đất, cháy xém, vết nứt phát sáng, đá vụn, gai đá, cỏ rạp/đứt, cây rung/gãy, đá đổ, kiếm cắm đất.
// ============================================================================
(function () {
const DK = window.DK, T = DK.T, V3 = DK.V3, scene = DK.scene, vfx = DK.vfx, renderer = DK.renderer, cam = DK.cam;
const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
const sm = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const mauC = c => c instanceof T.Color ? c.clone() : new T.Color(c != null ? c : 0xffffff);

// ---------------------------------------------------------------- công tắc bản
DK.NC = !/[?&]nc=0/.test(location.search);
DK.BO_NC = {};
/** đăng ký bản nâng cấp của một bộ (cùng khuôn DK.dangKyBo; thêm `yTuong`: mô tả ý tưởng hiện trên bảng) */
DK.dangKyBoNC = function (ma, bo) { bo.ma = ma; bo.nc = true; DK.BO_NC[ma] = bo; if (bo.tuThe) DK.ttBang(bo.tuThe); if (DK.veLai) DK.veLai(); };
/** bộ đang dùng theo công tắc */
DK.boDung = ma => (DK.NC && DK.BO_NC[ma]) || DK.BO[ma];

// ============================================================================
// KIẾM THẬT — mô hình thủ tục, trục +z = mũi, gốc (0,0,0) = giữa chuôi (chỗ tay cầm)
// ============================================================================
const _matKL = {};
function hinhLuoi(L, w, t, mui) {
  // tiết diện thoi (4 đỉnh: mép trái, sống trên, mép phải, sống dưới); thon nhẹ dọc lưỡi, vát mũi ở đoạn cuối
  const z = [0, L * (1 - mui), L], k = [1, .78, 0];
  const P = [];
  const vong = i => { const ww = w * .5 * k[i], tt = t * .5 * (i === 2 ? 0 : (1 - .3 * i / 2)); return [[-ww, 0, z[i]], [0, tt, z[i]], [ww, 0, z[i]], [0, -tt, z[i]]]; };
  const R = [vong(0), vong(1), vong(2)];
  for (let i = 0; i < 2; i++) for (let j = 0; j < 4; j++) {
    const a = R[i][j], b = R[i][(j + 1) % 4], c = R[i + 1][(j + 1) % 4], d = R[i + 1][j];
    P.push(...a, ...b, ...c, ...a, ...c, ...d);
  }
  // đáy lưỡi
  const r = R[0]; P.push(...r[0], ...r[2], ...r[1], ...r[0], ...r[3], ...r[2]);
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.computeVertexNormals(); return g;
}
/**
 * vfx.kiemThat({ dai (m lưỡi, mặc định 0.95), rong (m, mặc định dai*.075), mau (màu kiếm khí/viền — mặc định màu thanh đang cầm),
 *   kim (màu thép), chuoi (màu chuôi), chan (màu chắn tay), tua (true/màu tua kiếm), sang (0..3 độ phát sáng), quang (true: bao kiếm quang cộng sáng),
 *   kieu: 'kiem' | 'rong' (bản rộng) | 'manh' (mảnh) | 'hon' (kiếm hồn trong suốt) })
 *   → Group (chưa add vào scene) có .luoi (mesh lưỡi), .bao (mesh quang), .datSang(k), .muiL (m), .capTua(dt) (tự gọi nếu dùng vfx.phiKiem)
 */
vfx.kiemThat = function (op = {}) {
  const vk = DK.nc && DK.nc.vk;
  const L = op.dai || .95, kieu = op.kieu || 'kiem';
  const w = op.rong || L * (kieu === 'rong' ? .11 : kieu === 'manh' ? .05 : .075), t = w * .32;
  const c = mauC(op.mau != null ? op.mau : (vk ? vk.mau_hex : '#bfe6ff'));
  const g = new T.Group();
  const hon = kieu === 'hon';
  const thep = mauC(op.kim != null ? op.kim : (hon ? c : 0xd9dde4));
  const matL = hon ? new T.MeshBasicMaterial({ color: c.clone().multiplyScalar(1.6), transparent: true, opacity: .55, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })
    : new T.MeshStandardMaterial({ color: thep, metalness: .85, roughness: .22, emissive: c, emissiveIntensity: op.sang != null ? op.sang * .35 : .25, flatShading: true });
  const luoi = new T.Mesh(hinhLuoi(L, w, t, .16), matL); luoi.castShadow = !hon; g.add(luoi); g.luoi = luoi;
  // rãnh máu (sống kiếm sáng)
  const ranh = new T.Mesh(new T.BoxGeometry(w * .16, t * 1.08, L * .72), new T.MeshBasicMaterial({ color: c.clone().multiplyScalar(1.4 + (op.sang || 1) * .6), toneMapped: false }));
  ranh.position.z = L * .4; g.add(ranh);
  // bao kiếm quang (cộng sáng, rộng hơn lưỡi) — bloom làm nó toả
  let bao = null;
  if (op.quang !== false) {
    bao = new T.Mesh(hinhLuoi(L * 1.05, w * 1.7, t * 2.4, .2), new T.MeshBasicMaterial({ color: c.clone().multiplyScalar(.9), transparent: true, opacity: .32 * (op.sang != null ? Math.min(1.6, .5 + op.sang * .5) : 1), blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false }));
    bao.position.z = -L * .02; g.add(bao); g.bao = bao;
  }
  if (!hon) {
    const cChan = mauC(op.chan != null ? op.chan : 0xc9a24a), cChuoi = mauC(op.chuoi != null ? op.chuoi : 0x2a1a14);
    const mChan = _matKL.chan || (_matKL.chan = new T.MeshStandardMaterial({ color: 0xffffff, metalness: .9, roughness: .3 }));
    const matChan = mChan.clone(); matChan.color = cChan;
    // chắn tay: thanh ngang + 2 cánh vểnh về phía mũi
    const chan = new T.Mesh(new T.BoxGeometry(w * 3.4, t * 2.6, w * .55), matChan); chan.position.z = -w * .1; g.add(chan);
    for (const s of [-1, 1]) { const canh = new T.Mesh(new T.BoxGeometry(w * .7, t * 2.2, w * .9), matChan); canh.position.set(s * w * 1.75, 0, w * .25); canh.rotation.y = s * .5; g.add(canh); }
    const ngoc = new T.Mesh(new T.OctahedronGeometry(w * .42), new T.MeshBasicMaterial({ color: c.clone().multiplyScalar(1.5), toneMapped: false })); ngoc.position.z = -w * .1; ngoc.position.y = t * 1.35; g.add(ngoc);
    // chuôi quấn dây
    const dC = L * .24;
    const matChuoi = new T.MeshStandardMaterial({ color: cChuoi, roughness: .8 });
    const chuoi = new T.Mesh(new T.BoxGeometry(w * .62, w * .62, dC), matChuoi); chuoi.position.z = -dC / 2 - w * .35; g.add(chuoi);
    for (let i = 0; i < 4; i++) { const v = new T.Mesh(new T.BoxGeometry(w * .72, w * .72, dC * .07), matChan); v.position.z = -w * .45 - (i + .5) * dC / 4; g.add(v); }
    const num = new T.Mesh(new T.OctahedronGeometry(w * .5), matChan); num.position.z = -dC - w * .55; num.scale.z = 1.3; g.add(num);
    // tua kiếm (chuỗi đốt, lắc theo quán tính)
    if (op.tua !== false) {
      const cTua = mauC(op.tua && op.tua !== true ? op.tua : 0xc0182c);
      const matT = new T.MeshStandardMaterial({ color: cTua, roughness: .9 });
      const goc = new V3(0, 0, -dC - w * .9); const ds = [];
      for (let i = 0; i < 5; i++) { const m = new T.Mesh(new T.BoxGeometry(w * (.32 - i * .03), w * .32, w * 1.1), matT); m.castShadow = true; scene.add(m); ds.push({ m, p: null, v: new V3() }); }
      g.tua = ds; g.tuaGoc = goc;
      g.capTua = function () {
        g.updateMatrixWorld(true); let a = goc.clone().applyMatrix4(g.matrixWorld); const doan = w * 1.1;
        for (const d of ds) {
          if (!d.p) d.p = a.clone().add(new V3(0, -doan, 0));
          d.p.y -= .012; const dir = d.p.clone().sub(a); const l = dir.length() || 1; d.p.copy(a).addScaledVector(dir, doan / l);
          d.m.position.copy(a).lerp(d.p, .5); d.m.lookAt(d.p); a = d.p;
        }
      };
      g.huyTua = () => { for (const d of ds) { scene.remove(d.m); d.m.geometry.dispose(); } };
    }
  }
  g.muiL = L; g.mau = c;
  g.datSang = k => { if (matL.emissiveIntensity != null) matL.emissiveIntensity = k * .35; if (bao) bao.material.opacity = .32 * Math.min(1.6, .5 + k * .5); };
  return g;
};

/**
 * vfx.phiKiem({ ...op kiemThat, co (hệ số to), vet (true: vệt sáng màu kiếm), song, tuoi }) → { o, dat(pos, huong), huy(), x, muiL }
 *   thay vfx.kiem khi DK.NC — phi kiếm có hình kiếm thật + vệt + tua. Caller di chuyển bằng DK.lap như vfx.kiem.
 */
vfx.phiKiem = function (op = {}) {
  const co = op.co || 1;
  const k = vfx.kiemThat(Object.assign({}, op, { dai: (op.dai || .95) * co }));
  const g = new T.Group(); k.position.z = -k.muiL * .35; g.add(k);   // gốc nhóm ~ trọng tâm kiếm
  const c = k.mau;
  let vet = null;
  if (op.vet !== false) {
    const N = op.doVet || 22, P = new Float32Array(N * 2 * 3), A = new Float32Array(N * 2 * 4), geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setAttribute('color', new T.BufferAttribute(A, 4));
    const I = []; for (let i = 0; i < N - 1; i++) { const a = i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } geo.setIndex(I);
    vet = { m: new T.Mesh(geo, new T.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending, toneMapped: false })), ds: [], N };
    vet.m.frustumCulled = false; scene.add(vet.m);
  }
  const cv = c.clone().multiplyScalar(1.6);
  const x = vfx.them(g, op.song || 3, () => {
    if (k.capTua) k.capTua();
    if (!vet) return; g.updateMatrixWorld(true);
    // vệt dẹt theo bản lưỡi (mặt phẳng ngang của kiếm)
    const a = new V3(-k.muiL * .06, 0, -k.muiL * .35).applyMatrix4(g.matrixWorld), b = new V3(k.muiL * .06, 0, -k.muiL * .35).applyMatrix4(g.matrixWorld);
    const p = g.position.clone(); if (vet.ds.length && vet.ds[0][2].distanceToSquared(p) < 1e-6) return;
    vet.ds.unshift([a, b, p]); if (vet.ds.length > vet.N) vet.ds.pop();
    const P = vet.m.geometry.attributes.position.array, A = vet.m.geometry.attributes.color.array;
    for (let i = 0; i < vet.N; i++) {
      const s = vet.ds[Math.min(i, vet.ds.length - 1)]; const u = i / vet.N, wk = 1 - u * .6;
      const mid = new V3().lerpVectors(s[0], s[1], .5); const p0 = new V3().lerpVectors(mid, s[0], wk), p1 = new V3().lerpVectors(mid, s[1], wk);
      P.set([p0.x, p0.y, p0.z, p1.x, p1.y, p1.z], i * 6); const al = (1 - u) * (1 - u) * .9; A.set([cv.r, cv.g, cv.b, al, cv.r, cv.g, cv.b, al], i * 8);
    }
    vet.m.geometry.attributes.position.needsUpdate = vet.m.geometry.attributes.color.needsUpdate = true;
  }, () => { if (vet) { scene.remove(vet.m); vet.m.geometry.dispose(); vet.m.material.dispose(); } if (k.huyTua) k.huyTua(); });
  return {
    o: g, kiem: k, x, muiL: k.muiL,
    dat(pos, huong) { g.position.copy(pos); if (huong && huong.lengthSq() > 1e-8) g.quaternion.setFromUnitVectors(new V3(0, 0, 1), huong.clone().normalize()); },
    huy() { x.t = x.song; },
    /** 2026-11-15 — tắt/xoá vệt (kiếm dừng lại, cắm đất…) */
    tatVet() { if (vet) { scene.remove(vet.m); vet.m.geometry.dispose(); vet.m.material.dispose(); vet = null; } },
  };
};
// bản nâng cấp: vfx.kiem (dùng ở mọi bộ cũ) tự đổi sang kiếm thật ⇒ "kiếm ra kiếm"
const kiemCu = vfx.kiem;
vfx.kiem = function (muc, op = {}) {
  if (!DK.NC || op.hop) return kiemCu(muc, op);
  muc = muc || (DK.nc && DK.nc.vk) || DL.VU_KHI[0];
  const muiL = (muc.mui ? muc.mui[1] : 20) * DL.PX;
  return vfx.phiKiem({ dai: Math.max(.8, muiL * .85), co: op.co || 1, mau: op.mau != null ? op.mau : muc.mau_hex, sang: op.sang != null ? op.sang * 1.4 : 1.2, vet: op.vet, song: op.song });
};
// kiếm cầm tay cũng đổi sang kiếm thật khi DK.NC (giữ nguyên chiều dài thanh của game)
const camCu = DK.NhanVat ? DK.NhanVat.prototype.camKiem : null;
function camNC(nv) {
  if (!nv || !nv.kiem) return;
  if (nv.kiemThat) { nv.kiem.remove(nv.kiemThat); if (nv.kiemThat.huyTua) nv.kiemThat.huyTua(); nv.kiemThat = null; }
  if (nv.kiemMesh) nv.kiemMesh.visible = !DK.NC || !nv.vk;
  if (!DK.NC || !nv.vk) return;
  const muiY = (nv.vk.mui ? nv.vk.mui[1] : 20) * DL.PX;
  const k = vfx.kiemThat({ dai: muiY * .8, mau: nv.vk.mau_hex, sang: .5, tua: nv.la !== 'bu_nhin', quang: nv.la !== 'bu_nhin' });
  k.position.z = muiY * .2; nv.kiem.add(k); nv.kiemThat = k;
}
DK.camNC = camNC;
if (camCu) DK.NhanVat.prototype.camKiem = function (muc) { camCu.call(this, muc); camNC(this); };
DK.moiKhung(() => { const nv = DK.nc; if (nv && nv.kiemThat && nv.kiemThat.capTua) nv.kiemThat.capTua(); });
DK.datNC = function (b) {
  DK.NC = !!b; camNC(DK.nc); for (const d of DK.dsBuNhin) camNC(d);
  DK.suKien('doiBan', DK.NC); if (DK.veLai) DK.veLai();
};

// ============================================================================
// BLOOM HDR (tự viết, không thêm thư viện) + khung va chạm + viền màn
// ============================================================================
const PP = DK.PP = { bat: true, manh: .9, nguong: .82, vaCham: 0, vcMau: new T.Color(0, 0, 0), vcKieu: 0, vien: 0, vienMau: new T.Color(0, 0, 0) };
(function () {
  const cO = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1), sO = new T.Scene(), quad = new T.Mesh(new T.PlaneGeometry(2, 2)); sO.add(quad);
  const gl = renderer.getContext(); const hf = renderer.capabilities.isWebGL2 && (gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'));
  const TYPE = hf ? T.HalfFloatType : T.UnsignedByteType;
  let W = 0, H = 0, rtS = null; const mip = [], mip2 = []; const N = 5;
  const vs = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';
  const mSang = new T.ShaderMaterial({ uniforms: { t: { value: null }, ng: { value: .8 } }, vertexShader: vs, depthTest: false, depthWrite: false,
    fragmentShader: 'uniform sampler2D t; uniform float ng; varying vec2 vUv; void main(){ vec3 c = texture2D(t, vUv).rgb; float l = max(c.r, max(c.g, c.b)); float k = smoothstep(ng, ng + .6, l); gl_FragColor = vec4(c * k, 1.); }' });
  const mMo = new T.ShaderMaterial({ uniforms: { t: { value: null }, d: { value: new T.Vector2() } }, vertexShader: vs, depthTest: false, depthWrite: false,
    fragmentShader: 'uniform sampler2D t; uniform vec2 d; varying vec2 vUv; void main(){ vec3 s = texture2D(t, vUv).rgb * .2270; s += (texture2D(t, vUv + d * 1.3846).rgb + texture2D(t, vUv - d * 1.3846).rgb) * .3162; s += (texture2D(t, vUv + d * 3.2308).rgb + texture2D(t, vUv - d * 3.2308).rgb) * .0703; gl_FragColor = vec4(s, 1.); }' });
  const mGhep = new T.ShaderMaterial({
    uniforms: { t: { value: null }, b0: { value: null }, b1: { value: null }, b2: { value: null }, b3: { value: null }, b4: { value: null }, manh: { value: 1 }, vc: { value: 0 }, vcMau: { value: new T.Color() }, vcKieu: { value: 0 }, vien: { value: 0 }, vienMau: { value: new T.Color() } },
    vertexShader: vs, depthTest: false, depthWrite: false, toneMapped: true,
    fragmentShader: `uniform sampler2D t, b0, b1, b2, b3, b4; uniform float manh, vc, vcKieu, vien; uniform vec3 vcMau, vienMau; varying vec2 vUv;
      void main(){
        vec3 c = texture2D(t, vUv).rgb;
        vec3 b = texture2D(b0, vUv).rgb * .55 + texture2D(b1, vUv).rgb * .5 + texture2D(b2, vUv).rgb * .45 + texture2D(b3, vUv).rgb * .4 + texture2D(b4, vUv).rgb * .35;
        c += b * manh;
        float r = length(vUv - .5) * 1.414; c = mix(c, vienMau * 1.4, vien * smoothstep(.45, 1.05, r));
        gl_FragColor = vec4(c, 1.);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
        // khung va chạm: 0 = đảo đơn sắc (mực trên nền sáng), 1 = chớp màu
        if (vc > 0.) {
          float l = dot(gl_FragColor.rgb, vec3(.299, .587, .114));
          vec3 dao = vcKieu < .5 ? mix(vec3(1.) - vec3(step(.42, l)), vcMau, .35 * step(.42, l)) : mix(gl_FragColor.rgb, vcMau, .65);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, dao, vc);
        }
      }` });
  function dam(w, h) {
    W = w; H = h; if (rtS) { rtS.dispose(); mip.forEach(m => m.dispose()); mip2.forEach(m => m.dispose()); }
    rtS = new T.WebGLRenderTarget(w, h, { type: TYPE, samples: renderer.capabilities.isWebGL2 ? 4 : 0 });
    mip.length = mip2.length = 0;
    let ww = w >> 1, hh = h >> 1;
    for (let i = 0; i < N; i++) { mip.push(new T.WebGLRenderTarget(Math.max(2, ww), Math.max(2, hh), { type: TYPE })); mip2.push(new T.WebGLRenderTarget(Math.max(2, ww), Math.max(2, hh), { type: TYPE })); ww >>= 1; hh >>= 1; }
  }
  function ve(mat, rt) { quad.material = mat; renderer.setRenderTarget(rt); renderer.render(sO, cO); }
  // nền trời + sương là màu ĐẦU RA (không qua tone map) ⇒ khi vẽ vào RT tuyến tính phải đổi ngược để ghép xong vẫn đúng màu cũ
  const fit = v => (v * (v + .0245786) - .000090537) / (v * (.983729 * v + .432951) + .238081);
  const ra = (x, e) => { let y = clamp(fit(x * e / .6), 0, 1); return y <= .0031308 ? y * 12.92 : 1.055 * Math.pow(y, 1 / 2.4) - .055; };
  const nguoc = (y, e) => { let a = 0, b = 64; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (ra(m, e) < y) a = m; else b = m; } return (a + b) / 2; };
  const _bg = new T.Color(), _fg = new T.Color(), _inv = {};
  const doiNguoc = (c, e) => { const k = c.getHexString() + e.toFixed(3); return _inv[k] || (_inv[k] = new T.Color(nguoc(c.r, e), nguoc(c.g, e), nguoc(c.b, e))); };
  DK.ve = function () {
    if (!PP.bat) { renderer.setRenderTarget(null); renderer.render(scene, cam); return; }
    const sz = renderer.getDrawingBufferSize(new T.Vector2());
    if (sz.x !== W || sz.y !== H) dam(sz.x, sz.y);
    const e = renderer.toneMappingExposure, bg = scene.background && scene.background.isColor ? scene.background : null;
    if (bg) { _bg.copy(bg); bg.copy(doiNguoc(_bg, e)); } if (scene.fog) { _fg.copy(scene.fog.color); scene.fog.color.copy(doiNguoc(_fg, e)); }
    renderer.setRenderTarget(rtS); renderer.render(scene, cam);
    if (bg) bg.copy(_bg); if (scene.fog) scene.fog.color.copy(_fg);
    mSang.uniforms.t.value = rtS.texture; mSang.uniforms.ng.value = PP.nguong; ve(mSang, mip[0]);
    for (let i = 0; i < N; i++) {
      if (i > 0) { mMo.uniforms.t.value = mip[i - 1].texture; mMo.uniforms.d.value.set(0, 0); ve(mMo, mip[i]); }
      mMo.uniforms.t.value = mip[i].texture; mMo.uniforms.d.value.set(1 / mip[i].width, 0); ve(mMo, mip2[i]);
      mMo.uniforms.t.value = mip2[i].texture; mMo.uniforms.d.value.set(0, 1 / mip[i].height); ve(mMo, mip[i]);
    }
    const u = mGhep.uniforms; u.t.value = rtS.texture; for (let i = 0; i < N; i++) u['b' + i].value = mip[i].texture;
    u.manh.value = PP.manh; u.vc.value = PP.vaCham; u.vcMau.value.copy(PP.vcMau); u.vcKieu.value = PP.vcKieu; u.vien.value = PP.vien; u.vienMau.value.copy(PP.vienMau);
    ve(mGhep, null);
  };
})();
let vcHet = 0, vienHet = 0, vienSong = 1;
/** khung va chạm (impact frame) — t giây mô phỏng (mặc định .07 ≈ 2–3 khung), kieu 'dao' (mực/trắng đảo) | 'chop' (chớp màu) */
// 2026-11-17 — người dùng: "nháy màn hình xấu lắm, bỏ đi" ⇒ tắt hẳn khung va chạm cho mọi bộ (giữ hàm để code cũ không lỗi)
vfx.vaCham = function (op = {}) { if (!DK.choVaCham) return; PP.vaCham = 1; PP.vcKieu = op.kieu === 'chop' ? 1 : 0; PP.vcMau.copy(mauC(op.mau != null ? op.mau : 0xc0182c)); vcHet = DK.now + (op.song || .07); };
/** viền màn nhuộm màu (chiêu lớn) */
vfx.vienMan = function (mau, song, manh) { PP.vienMau.copy(mauC(mau)); PP.vien = manh || .55; vienHet = DK.now + (song || 1.5); vienSong = song || 1.5; };
DK.moiKhung(() => {
  if (PP.vaCham > 0 && DK.now >= vcHet) PP.vaCham = 0;
  if (PP.vien > 0) { const con = vienHet - DK.now; if (con <= 0) PP.vien = 0; else if (con < .4) PP.vien = Math.min(PP.vien, con / .4 * .55); }
});

// ============================================================================
// ĐỊA HÌNH PHÁ ĐƯỢC — DK.dia
// ============================================================================
const dia = DK.dia = {};
const R = 26, O = .25, NN = Math.round(R * 2 / O);   // mảnh đất biến dạng 52×52 m, ô 0.25 m
const NV = NN + 1;
const Hc = new Float32Array(NV * NV), Hd = new Float32Array(NV * NV), hoi = new Float32Array(NV * NV);   // cao cố định / cao động / thời điểm bắt đầu lành
const MAU = new Float32Array(NV * NV * 3).fill(1), mauHoi = new Float32Array(NV * NV);
let manh = null, ban = false, dongCo = false;
(function dungManh() {
  const geo = new T.PlaneGeometry(R * 2, R * 2, NN, NN); geo.rotateX(-Math.PI / 2);
  // uv khớp lưới gạch sân gốc (chu kỳ 8 m)
  const uv = geo.attributes.uv, pos = geo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + 64) / 128, (-pos.getZ(i) + 64) / 128);
  geo.setAttribute('color', new T.BufferAttribute(MAU, 3));
  const mat = new T.MeshStandardMaterial({ map: DK.texSan, roughness: .95, vertexColors: true });
  manh = new T.Mesh(geo, mat); manh.receiveShadow = true; manh.castShadow = false; scene.add(manh);
  // 2026-11-15 — khoét lỗ sân phẳng đúng vùng mảnh đất biến dạng (trước đây sân đè lên lòng hố/rãnh)
  if (DK.san) {
    const sh = new T.Shape([new T.Vector2(-64, -64), new T.Vector2(64, -64), new T.Vector2(64, 64), new T.Vector2(-64, 64)]);
    sh.holes.push(new T.Path([new T.Vector2(-R, -R), new T.Vector2(-R, R), new T.Vector2(R, R), new T.Vector2(R, -R)]));
    const g2 = new T.ShapeGeometry(sh); const p2 = g2.attributes.position, u2 = g2.attributes.uv;
    for (let i = 0; i < p2.count; i++) u2.setXY(i, (p2.getX(i) + 64) / 128, (p2.getY(i) + 64) / 128);
    DK.san.geometry.dispose(); DK.san.geometry = g2; DK.san.position.y = 0;
  }
})();
const idx = (i, j) => j * NV + i;
const oCua = (x, z) => [Math.round((x + R) / O), Math.round((z + R) / O)];
/** cao độ mặt đất tại (x,z) */
dia.cao = (x, z) => { const [i, j] = oCua(x, z); if (i < 0 || j < 0 || i >= NV || j >= NV) return 0; return Hc[idx(i, j)] + Hd[idx(i, j)]; };
function quet(x, z, r, fn) {
  const [i0, j0] = oCua(x - r, z - r), [i1, j1] = oCua(x + r, z + r);
  for (let j = Math.max(0, j0); j <= Math.min(NV - 1, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(NV - 1, i1); i++) {
    const px = -R + i * O, pz = -R + j * O; fn(idx(i, j), px, pz);
  }
  ban = true;
}
const GIU = 7;   // giây trước khi đất tự lành (để duyệt lặp lại)
/** hố: r bán kính, sau độ sâu, vanh độ cao vành (mặc định sau*.35) */
dia.ho = function (pos, r = 2, sau = .5, op = {}) {
  const vanh = op.vanh != null ? op.vanh : sau * .35, giu = op.giu || GIU;
  quet(pos.x, pos.z, r * 1.5, (k, x, z) => {
    const d = Math.hypot(x - pos.x, z - pos.z) / r;
    let h = d < 1 ? -sau * (1 - d * d) : 0; if (d > .75 && d < 1.5) h += vanh * Math.sin((d - .75) / .75 * Math.PI) * (d < 1 ? (d - .75) / .25 : 1);
    h += (Math.random() - .5) * .04 * (d < 1.2 ? 1 : 0);
    if (h < 0 ? h < Hc[k] : h > Hc[k] && Hc[k] >= 0) Hc[k] = h < 0 ? Math.min(Hc[k], h) : Math.max(Hc[k], h);
    if (d < 1.5) hoi[k] = DK.now + giu;
  });
  dia.chay(pos, r * 1.1, { mau: op.mau, manh: op.chay != null ? op.chay : .55, giu });
};
/** rãnh xẻ đất theo đoạn a→b (kiếm khí chém xuống đất) */
dia.ranh = function (a, b, rong = .5, sau = .35, op = {}) {
  const giu = op.giu || GIU, ab = new V3().subVectors(b, a); ab.y = 0; const L = ab.length() || 1e-4; const u = ab.clone().divideScalar(L);
  const mx = Math.min(a.x, b.x) - rong * 2, Mx = Math.max(a.x, b.x) + rong * 2, mz = Math.min(a.z, b.z) - rong * 2, Mz = Math.max(a.z, b.z) + rong * 2;
  quet((mx + Mx) / 2, (mz + Mz) / 2, Math.max(Mx - mx, Mz - mz) / 2, (k, x, z) => {
    const t = clamp((x - a.x) * u.x + (z - a.z) * u.z, 0, L); const dx = x - (a.x + u.x * t), dz = z - (a.z + u.z * t); const d = Math.hypot(dx, dz) / rong;
    const dau = Math.min(1, t / Math.min(L * .2, 1.5), (L - t) / Math.min(L * .2, 1.5));
    let h = d < 1 ? -sau * (1 - d * d) * (.4 + .6 * dau) : 0; if (d > .8 && d < 1.8) h += sau * .3 * Math.sin((d - .8) / 1 * Math.PI) * dau;
    if (h < Hc[k] || (h > 0 && h > Hc[k] && Hc[k] >= 0)) Hc[k] = h;
    if (d < 1.8) hoi[k] = DK.now + giu;
    if (d < 1.2) { const k3 = k * 3, m = op.mau ? mauC(op.mau) : null; const s = .5; MAU[k3] *= s; MAU[k3 + 1] *= s; MAU[k3 + 2] *= s; if (m) { MAU[k3] += m.r * .35; MAU[k3 + 1] += m.g * .35; MAU[k3 + 2] += m.b * .35; } mauHoi[k] = DK.now + giu; }
  });
  dongCo = true;
};
/** gồ đất (khối đất nhô) */
dia.nang = function (pos, r = 2, cao = .6, op = {}) {
  const giu = op.giu || GIU;
  quet(pos.x, pos.z, r, (k, x, z) => { const d = Math.hypot(x - pos.x, z - pos.z) / r; if (d < 1) { Hc[k] = Math.max(Hc[k], cao * (1 - d * d) * (1 - d * .3)); hoi[k] = DK.now + giu; } });
};
/** cháy xém / nhuộm màu mặt đất */
dia.chay = function (pos, r = 2, op = {}) {
  const giu = op.giu || GIU, m = op.mau != null ? mauC(op.mau) : null, mm = op.manh != null ? op.manh : .6;
  quet(pos.x, pos.z, r, (k, x, z) => {
    const d = Math.hypot(x - pos.x, z - pos.z) / r; if (d >= 1) return; const a = mm * (1 - d * d) * (.75 + Math.random() * .25), k3 = k * 3;
    MAU[k3] *= 1 - a * .75; MAU[k3 + 1] *= 1 - a * .78; MAU[k3 + 2] *= 1 - a * .8;
    if (m && d < .6) { MAU[k3] += m.r * a * .25; MAU[k3 + 1] += m.g * a * .25; MAU[k3 + 2] += m.b * a * .25; }
    mauHoi[k] = DK.now + giu;
  });
  dongCo = true;
};
/** 2026-11-15 — phủ màu SÁNG/nhuộm (băng, sương, ánh sen…): kéo màu đất về `mau` với độ `manh` */
dia.phu = function (pos, r = 2, op = {}) {
  const giu = op.giu || GIU, m = mauC(op.mau != null ? op.mau : 0xdff4ff), mm = op.manh != null ? op.manh : .7;
  quet(pos.x, pos.z, r, (k, x, z) => {
    const d = Math.hypot(x - pos.x, z - pos.z) / r; if (d >= 1) return; const a = mm * (1 - d * d), k3 = k * 3;
    MAU[k3] += (m.r * 1.3 - MAU[k3]) * a; MAU[k3 + 1] += (m.g * 1.3 - MAU[k3 + 1]) * a; MAU[k3 + 2] += (m.b * 1.3 - MAU[k3 + 2]) * a; mauHoi[k] = DK.now + giu;
  });
  dongCo = true;
};
// sóng đất (vòng lan): thêm vào Hd mỗi khung
const songDat = [];
/** sóng đất lan vòng: { r (bán kính tối đa), toc (m/s), cao (m), rong (m bề rộng gờ) } */
dia.song = function (pos, op = {}) { songDat.push({ p: pos.clone(), r: op.r || 8, toc: op.toc || 14, cao: op.cao || .35, rong: op.rong || 1.2, t: 0 }); };

// vết nứt phát sáng (đường gấp khúc toả ra, bám mặt đất)
/** vết nứt: { r (dài), nhanh (số tia), mau, song, rong, sang } */
dia.nut = function (pos, op = {}) {
  const c = mauC(op.mau != null ? op.mau : 0xff6a2a), soT = op.nhanh || 7, Rr = op.r || 4, song = op.song || 3.5, rong = op.rong || .09;
  const P = [], C = [];
  const doan = (x0, z0, x1, z1, w0, w1, sang) => {
    const dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l;
    const y0 = dia.cao(x0, z0) + .02, y1 = dia.cao(x1, z1) + .02;
    const A = [x0 + nx * w0, y0, z0 + nz * w0], B = [x0 - nx * w0, y0, z0 - nz * w0], Cc = [x1 - nx * w1, y1, z1 - nz * w1], D = [x1 + nx * w1, y1, z1 + nz * w1];
    P.push(...A, ...B, ...Cc, ...A, ...Cc, ...D); for (let i = 0; i < 6; i++) C.push(c.r * sang, c.g * sang, c.b * sang);
  };
  const tia = (x, z, goc, L, w, cap) => {
    let px = x, pz = z; const n = Math.max(3, Math.round(L / .35));
    for (let i = 0; i < n; i++) {
      goc += (Math.random() - .5) * .9; const l = L / n; const nx = px + Math.cos(goc) * l, nz = pz + Math.sin(goc) * l;
      const w0 = w * (1 - i / n), w1 = w * (1 - (i + 1) / n);
      doan(px, pz, nx, nz, w0 + .002, w1 + .002, 2.2 - i / n); px = nx; pz = nz;
      if (cap < 2 && Math.random() < .28) tia(px, pz, goc + (Math.random() < .5 ? -1 : 1) * (.5 + Math.random() * .6), L * (1 - i / n) * .6, w0 * .7, cap + 1);
    }
  };
  for (let i = 0; i < soT; i++) tia(pos.x, pos.z, i / soT * Math.PI * 2 + Math.random() * .5, Rr * (.6 + Math.random() * .5), rong, 0);
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('color', new T.Float32BufferAttribute(C, 3));
  const mat = new T.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const m = new T.Mesh(g, mat); m.renderOrder = 2;
  // lõi tối dưới vết nứt (khe đất)
  const g2 = g.clone(); const m2 = new T.Mesh(g2, new T.MeshBasicMaterial({ color: 0x050505, transparent: true, opacity: .85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 })); m2.scale.set(1, 1, 1);
  const grp = new T.Group(); grp.add(m2); grp.add(m);
  dia.chay(pos, Rr * .5, { manh: .35, mau: c });
  return vfx.them(grp, song, (dt, u) => { const k = u < .08 ? u / .08 : 1 - sm((u - .5) / .5); mat.opacity = k; m2.material.opacity = .85 * Math.min(1, (1 - u) * 3); });
};

// đá vụn (khối voxel mang màu đất, nảy trên mặt đất, nằm lại rồi chìm)
const VUN_MAX = 900; let vunI = 0;
const vunMesh = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshStandardMaterial({ color: 0xffffff, roughness: .95 }), VUN_MAX);
vunMesh.instanceMatrix.setUsage(T.DynamicDrawUsage); vunMesh.castShadow = true; vunMesh.frustumCulled = false; scene.add(vunMesh);
const vun = []; for (let i = 0; i < VUN_MAX; i++) vun.push({ song: 0 });
const _m = new T.Matrix4(), _q = new T.Quaternion(), _e = new T.Euler(), _s = new V3(), _p = new V3();
for (let i = 0; i < VUN_MAX; i++) { vunMesh.setMatrixAt(i, _m.makeScale(0, 0, 0)); vunMesh.setColorAt(i, new T.Color(1, 1, 1)); }
/** đá vụn: { so, luc (m/s), len (m/s đi lên), co (m), mau, song (s), huong (V3: thiên về hướng), xoay } */
dia.vun = function (pos, op = {}) {
  const so = op.so || 24, luc = op.luc || 5, len = op.len != null ? op.len : 6, co = op.co || .22, song = op.song || 3;
  const base = op.mau != null ? mauC(op.mau) : null;
  for (let n = 0; n < so; n++) {
    const v = vun[vunI]; const id = vunI; vunI = (vunI + 1) % VUN_MAX;
    const a = Math.random() * Math.PI * 2; const r = Math.random();
    v.p = pos.clone().add(new V3(Math.cos(a) * r * (op.r || .6), .05, Math.sin(a) * r * (op.r || .6)));
    v.v = new V3(Math.cos(a) * luc * (.3 + Math.random() * .7), len * (.5 + Math.random() * .7), Math.sin(a) * luc * (.3 + Math.random() * .7));
    if (op.huong) v.v.addScaledVector(op.huong, luc * .8);
    v.r = new V3(Math.random() * 6, Math.random() * 6, Math.random() * 6); v.w = new V3((Math.random() - .5) * 14, (Math.random() - .5) * 14, (Math.random() - .5) * 14);
    v.co = co * (.45 + Math.random() * .9); v.song = song * (.7 + Math.random() * .5); v.t = 0; v.nam = false;
    const g = .38 + Math.random() * .22; const c = base ? base.clone().multiplyScalar(.6 + Math.random() * .5) : new T.Color(g, g * .97, g * .9);
    vunMesh.setColorAt(id, c);
  }
  vunMesh.instanceColor.needsUpdate = true;
};
// gai đá trồi (cột đá nhọn đâm lên rồi vỡ)
/** gai đá: { so, r (bán kính rải), cao, mau, song } */
dia.gai = function (pos, op = {}) {
  const so = op.so || 7, Rr = op.r || 1.6, cao = op.cao || 1.6, song = op.song || 2.4, c = op.mau != null ? mauC(op.mau) : new T.Color(0x77736c);
  const g = new T.Group();
  const mat = new T.MeshStandardMaterial({ color: c, roughness: .9, flatShading: true });
  const ds = [];
  for (let i = 0; i < so; i++) {
    const a = i / so * Math.PI * 2 + Math.random() * .6, r = Rr * (.3 + Math.random() * .7), h = cao * (.6 + Math.random() * .7);
    const m = new T.Mesh(new T.ConeGeometry(.22 + Math.random() * .18, h, 4), mat); m.castShadow = true;
    m.position.set(pos.x + Math.cos(a) * r, -h / 2, pos.z + Math.sin(a) * r); m.rotation.set((Math.random() - .5) * .5 + Math.sin(a) * .25, Math.random() * 3, -Math.cos(a) * .25 + (Math.random() - .5) * .3);
    g.add(m); ds.push({ m, h, tre: Math.random() * .08 });
  }
  dia.vun(pos, { so: so * 3, luc: 3, len: 5, r: Rr });
  dia.nang(pos, Rr * .9, .18);
  return vfx.them(g, song, (dt, u, t) => {
    for (const d of ds) { const k = sm((t - d.tre) / .09); const ra = u > .8 ? sm((u - .8) / .2) : 0; d.m.position.y = -d.h / 2 + d.h * .5 * k - d.h * ra; }
    if (u > .8 && !g.vo) { g.vo = true; for (const d of ds) dia.vun(d.m.getWorldPosition(new V3()).setY(.3), { so: 3, luc: 2, len: 3, co: .18 }); }
  });
};

// ------------------------------------------------ cỏ (khối voxel nhỏ, gió lay, sóng nổ làm rạp, kiếm khí cắt đứt)
const CO_N = 2600;   // 2026-11-16 — bớt cỏ: cảnh rối tranh chỗ hiệu ứng
const coMesh = new T.InstancedMesh(new T.BoxGeometry(.05, 1, .05).translate(0, .5, 0), new T.MeshStandardMaterial({ color: 0xffffff, roughness: .9 }), CO_N);
coMesh.instanceMatrix.setUsage(T.DynamicDrawUsage); coMesh.frustumCulled = false; coMesh.receiveShadow = true; scene.add(coMesh);
const co = [];
(function () {
  let n = 0; const tam = [[0, 0]];
  while (n < CO_N) {
    // bụi cỏ thành cụm, thưa ở giữa sân (đường đi), dày ra ngoài
    const a = Math.random() * Math.PI * 2, r = 3 + Math.pow(Math.random(), .7) * 21; const cx = Math.cos(a) * r, cz = Math.sin(a) * r;
    const so = 6 + (Math.random() * 10 | 0);
    for (let k = 0; k < so && n < CO_N; k++, n++) {
      const x = cx + (Math.random() - .5) * .7, z = cz + (Math.random() - .5) * .7; const h = .18 + Math.random() * .32;
      co.push({ x, z, h, cao: h, bx: 0, bz: 0, vx: 0, vz: 0, pha: Math.random() * 6, cat: 0, nghieng: (Math.random() - .5) * .3 });
      const g = .3 + Math.random() * .15; coMesh.setColorAt(n, new T.Color(.2 * g * 2, .3 * g * 2, .16 * g * 2));   // 2026-11-16 — cỏ ngả xám, nền gần đơn sắc để chỉ hiệu ứng có màu
    }
  }
  coMesh.instanceColor.needsUpdate = true; void tam;
})();
/** gió/sóng nổ: đẩy cỏ, rung cây ra xa tâm (luc 0..3) */
dia.gio = function (pos, r = 4, luc = 1) {
  for (const c of co) { const dx = c.x - pos.x, dz = c.z - pos.z, d = Math.hypot(dx, dz); if (d < r && d > 1e-3) { const k = luc * (1 - d / r) * 6; c.vx += dx / d * k; c.vz += dz / d * k; } }
  for (const c of cay) { const d = Math.hypot(c.x - pos.x, c.z - pos.z); if (d < r * 1.6 && !c.gay) { c.rung = Math.max(c.rung, luc * (1 - d / (r * 1.6)) * .35); if (Math.random() < .7) roiLa(c, Math.ceil(luc * 6)); } }
};
/** 2026-11-15 — nhuộm cỏ trong bán kính (đóng băng, héo độc, cháy…); tự trả màu khi đặt lại hoặc sau giu giây */
dia.nhuomCo = function (pos, r = 3, mau = 0xcfeaff, giu = GIU) {
  const c = mauC(mau); co.forEach((b, i) => { if (Math.hypot(b.x - pos.x, b.z - pos.z) < r) { if (!b.mauGoc) { b.mauGoc = new T.Color(); coMesh.getColorAt(i, b.mauGoc); } coMesh.setColorAt(i, c.clone().multiplyScalar(.8 + Math.random() * .3)); b.hetNhuom = DK.now + giu; } });
  coMesh.instanceColor.needsUpdate = true;
};
/** cắt cỏ dọc đoạn a→b (đường kiếm khí sát đất) + văng mảnh cỏ */
dia.cat = function (a, b, rong = .6) {
  const ab = new V3().subVectors(b, a); ab.y = 0; const L = ab.length() || 1e-4; const u = ab.divideScalar(L);
  let so = 0;
  for (const c of co) {
    const t = clamp((c.x - a.x) * u.x + (c.z - a.z) * u.z, 0, L); const d = Math.hypot(c.x - (a.x + u.x * t), c.z - (a.z + u.z * t));
    if (d < rong && c.cat <= 0) { c.cat = 1; c.h = c.cao * .25; so++; if (so % 4 === 0) vfx.hat(new V3(c.x, c.cao * .6, c.z), { so: 2, mau: 0x3f8a2a, toc: 2.5, co: .06, song: 1.2, trongLuc: 6 }); }
  }
};
// ------------------------------------------------ cây voxel + đèn đá (rung, rụng lá, gãy đổ)
const cay = [], daDo = [];
(function () {
  const matThan = new T.MeshStandardMaterial({ color: 0x5a3c26, roughness: .95 }), matLa = [0x3f7d2c, 0x4f8f34, 0x6a9e3c, 0xd98fae].map(c => new T.MeshStandardMaterial({ color: c, roughness: .9 }));
  const dat = [[13, 30], [15, 75], [17, 120], [12, 160], [16, 205], [14, 250], [18, 290], [13, 330]];
  dat.forEach(([r, g], i) => {
    const a = g / 180 * Math.PI, x = Math.cos(a) * r, z = Math.sin(a) * r, h = 2.4 + (i % 3) * .6;
    const grp = new T.Group(); grp.position.set(x, 0, z);
    const than = new T.Mesh(new T.BoxGeometry(.45, h, .45), matThan); than.position.y = h / 2; than.castShadow = true; grp.add(than);
    const la = new T.Group(); la.position.y = h; grp.add(la);
    const mL = matLa[i % 4 === 3 ? 3 : i % 3];
    for (let k = 0; k < 9; k++) { const b = new T.Mesh(new T.BoxGeometry(1.1, .9, 1.1), mL); b.position.set((Math.random() - .5) * 1.8, (Math.random() - .3) * 1.1, (Math.random() - .5) * 1.8); b.castShadow = true; la.add(b); }
    scene.add(grp); cay.push({ grp, la, than, x, z, h, rung: 0, pha: Math.random() * 6, gay: 0, mauLa: mL.color.clone(), r: .6 });
  });
  const matDa = new T.MeshStandardMaterial({ color: 0x8b867c, roughness: 1, flatShading: true });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6 + .08) * Math.PI * 2, r = 9.5; const grp = new T.Group(); grp.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    // đèn đá: đế + thân + mái
    const de = new T.Mesh(new T.BoxGeometry(.7, .3, .7), matDa); de.position.y = .15; const th = new T.Mesh(new T.BoxGeometry(.32, .9, .32), matDa); th.position.y = .75;
    const hop = new T.Mesh(new T.BoxGeometry(.6, .45, .6), matDa); hop.position.y = 1.42; const mai = new T.Mesh(new T.ConeGeometry(.6, .4, 4), matDa); mai.position.y = 1.85; mai.rotation.y = Math.PI / 4;
    const lua = new T.Mesh(new T.BoxGeometry(.3, .25, .62), new T.MeshBasicMaterial({ color: 0xffb35a, toneMapped: false })); lua.position.y = 1.42;
    for (const m of [de, th, hop, mai]) { m.castShadow = m.receiveShadow = true; grp.add(m); } grp.add(lua);
    scene.add(grp); daDo.push({ grp, x: grp.position.x, z: grp.position.z, r: .5, vo: false });
  }
})();
const la = [];
function roiLa(c, n) { for (let i = 0; i < n; i++) la.push({ p: new V3(c.x + (Math.random() - .5) * 2, c.h + Math.random() * .8, c.z + (Math.random() - .5) * 2), v: new V3((Math.random() - .5) * 2, 0, (Math.random() - .5) * 2), t: 0, song: 2 + Math.random() * 2, c: c.mauLa }); }
const LA_MAX = 400; const laMesh = new T.InstancedMesh(new T.BoxGeometry(.12, .03, .12), new T.MeshStandardMaterial({ color: 0xffffff }), LA_MAX); laMesh.frustumCulled = false; scene.add(laMesh);
for (let i = 0; i < LA_MAX; i++) { laMesh.setMatrixAt(i, _m.makeScale(0, 0, 0)); laMesh.setColorAt(i, new T.Color(.3, .6, .2)); }
/** phá vật (cây gãy đổ / đèn đá vỡ) trong bán kính r */
dia.pha = function (pos, r = 3, op = {}) {
  for (const c of cay) { const d = Math.hypot(c.x - pos.x, c.z - pos.z); if (d < r + c.r && !c.gay) { c.gay = 1e-3; c.huongDo = Math.atan2(c.z - pos.z, c.x - pos.x); roiLa(c, 20); dia.vun(new V3(c.x, .3, c.z), { so: 10, mau: 0x5a3c26, luc: 3, len: 4 }); } }
  for (const s of daDo) { const d = Math.hypot(s.x - pos.x, s.z - pos.z); if (d < r + s.r && !s.vo) { s.vo = true; s.grp.visible = false; dia.vun(new V3(s.x, .5, s.z), { so: 26, mau: 0x8b867c, luc: 4.5, len: 5, co: .26, r: .4, huong: new V3(s.x - pos.x, 0, s.z - pos.z).normalize() }); } }
  for (const c of DK.cotDa || []) { const d = Math.hypot(c.position.x - pos.x, c.position.z - pos.z); if (d < r + 1.2 && c.visible) { c.visible = false; c.voDa = true; dia.vun(c.position.clone().setY(1), { so: 60, luc: 6, len: 7, co: .45, r: 1 }); } }
};
// ------------------------------------------------ kiếm cắm đất
/** kiếm cắm xuống đất (giữ lại sau đòn): huong = hướng mũi (thường (0,-1,0) nghiêng), song */
dia.camKiem = function (pos, huong, op = {}) {
  const k = vfx.phiKiem(Object.assign({ vet: false }, op, { song: op.song || 4 }));
  const h = (huong || new V3(0, -1, 0)).clone().normalize();
  k.dat(pos.clone().addScaledVector(h, -k.muiL * .05), h);
  dia.vun(pos, { so: 6, luc: 2, len: 3, co: .12 }); dia.chay(pos, .6, { manh: .5 });
  return k;
};

// ------------------------------------------------ bước mỗi khung
let tGio = 0;
DK.moiKhung(dt => {
  tGio += dt;
  // lành đất
  let doi = ban || songDat.length > 0;
  for (let k = 0; k < Hc.length; k++) {
    if (Hc[k] !== 0 && DK.now > hoi[k]) { Hc[k] *= Math.max(0, 1 - dt * 1.2); if (Math.abs(Hc[k]) < .003) Hc[k] = 0; doi = true; }
    if (mauHoi[k] && DK.now > mauHoi[k]) { const k3 = k * 3; let xong = true; for (let c = 0; c < 3; c++) { MAU[k3 + c] += (1 - MAU[k3 + c]) * Math.min(1, dt * 1.5); if (Math.abs(MAU[k3 + c] - 1) > .01) xong = false; else MAU[k3 + c] = 1; } if (xong) mauHoi[k] = 0; dongCo = true; }
  }
  // sóng đất
  if (songDat.length) {
    Hd.fill(0);
    for (let i = songDat.length - 1; i >= 0; i--) {
      const s = songDat[i]; s.t += dt; const rr = s.t * s.toc; if (rr > s.r + s.rong) { songDat.splice(i, 1); continue; }
      const tat = 1 - rr / (s.r + s.rong);
      quet(s.p.x, s.p.z, Math.min(R, rr + s.rong), (k, x, z) => { const d = Math.hypot(x - s.p.x, z - s.p.z), q = (d - rr) / s.rong; if (q > -1 && q < 1) Hd[k] += s.cao * tat * Math.cos(q * Math.PI / 2) ** 2; });
      // cỏ bị sóng hất
      for (const c of co) { const d = Math.hypot(c.x - s.p.x, c.z - s.p.z); if (Math.abs(d - rr) < .3 && d > .1) { c.vx += (c.x - s.p.x) / d * 3 * tat; c.vz += (c.z - s.p.z) / d * 3 * tat; } }
    }
    doi = true;
    if (!songDat.length) Hd.fill(0);
  }
  if (doi) {
    const p = manh.geometry.attributes.position;
    for (let j = 0; j < NV; j++) for (let i = 0; i < NV; i++) { const k = idx(i, j); p.array[k * 3 + 1] = Hc[k] + Hd[k]; }
    p.needsUpdate = true; manh.geometry.computeVertexNormals(); ban = false;
  }
  if (dongCo) { manh.geometry.attributes.color.needsUpdate = true; dongCo = false; }
  // đá vụn
  for (let i = 0; i < VUN_MAX; i++) {
    const v = vun[i]; if (!(v.song > 0)) continue;
    v.t += dt; if (v.t >= v.song) { v.song = 0; vunMesh.setMatrixAt(i, _m.makeScale(0, 0, 0)); continue; }
    if (!v.nam) {
      v.v.y -= 22 * dt; v.p.addScaledVector(v.v, dt); v.r.addScaledVector(v.w, dt);
      const nen = dia.cao(v.p.x, v.p.z) + v.co * .5;
      if (v.p.y < nen) { v.p.y = nen; if (Math.abs(v.v.y) < 1.5) { v.nam = true; } else { v.v.y *= -.35; v.v.x *= .55; v.v.z *= .55; v.w.multiplyScalar(.5); } }
    }
    const chim = Math.max(0, (v.t - v.song + .6) / .6);
    _q.setFromEuler(_e.set(v.r.x, v.r.y, v.r.z)); _s.setScalar(v.co * (1 - chim * .9)); _p.copy(v.p); _p.y -= chim * v.co;
    vunMesh.setMatrixAt(i, _m.compose(_p, _q, _s));
  }
  vunMesh.instanceMatrix.needsUpdate = true;
  // cỏ
  let traMau = false;
  for (let i = 0; i < co.length; i++) {
    const c = co[i];
    if (c.hetNhuom && DK.now > c.hetNhuom) { coMesh.setColorAt(i, c.mauGoc); c.hetNhuom = 0; traMau = true; }
    c.vx += -c.bx * 40 * dt; c.vz += -c.bz * 40 * dt; c.vx *= Math.exp(-5 * dt); c.vz *= Math.exp(-5 * dt);
    c.bx = clamp(c.bx + c.vx * dt, -1.3, 1.3); c.bz = clamp(c.bz + c.vz * dt, -1.3, 1.3);
    const gio = Math.sin(tGio * 1.6 + c.pha + c.x * .3) * .12;
    const y = dia.cao(c.x, c.z);
    _q.setFromEuler(_e.set(c.bz + gio * .5 + c.nghieng, 0, -c.bx - gio));
    _s.set(1, c.h, 1); _p.set(c.x, y, c.z);
    coMesh.setMatrixAt(i, _m.compose(_p, _q, _s));
  }
  coMesh.instanceMatrix.needsUpdate = true; if (traMau) coMesh.instanceColor.needsUpdate = true;
  // cây
  for (const c of cay) {
    if (c.gay > 0) { c.gay = Math.min(1, c.gay + dt * 1.4); const k = c.gay * c.gay; c.grp.rotation.set(0, 0, 0); c.grp.rotateOnWorldAxis(new V3(-Math.sin(c.huongDo), 0, Math.cos(c.huongDo)), -k * 1.45); if (c.gay >= 1 && !c.dap) { c.dap = true; dia.vun(new V3(c.x + Math.cos(c.huongDo) * c.h, .3, c.z + Math.sin(c.huongDo) * c.h), { so: 14, mau: c.mauLa, luc: 3, len: 3 }); roiLa(c, 30); } continue; }
    c.rung *= Math.exp(-2.2 * dt); const s = Math.sin(tGio * 9 + c.pha) * c.rung + Math.sin(tGio * 1.3 + c.pha) * .02;
    c.la.rotation.set(s * .6, 0, s); c.than.rotation.z = s * .2;
  }
  // lá rơi
  for (let i = la.length - 1; i >= 0; i--) { const l = la[i]; l.t += dt; if (l.t > l.song || l.p.y < 0) { la.splice(i, 1); continue; } l.v.y = -1.1; l.p.addScaledVector(l.v, dt); l.p.x += Math.sin(l.t * 4 + i) * dt * .8; }
  for (let i = 0; i < LA_MAX; i++) {
    const l = la[i];
    if (!l) { laMesh.setMatrixAt(i, _m.makeScale(0, 0, 0)); continue; }
    _q.setFromEuler(_e.set(l.t * 3, l.t * 2, 0)); laMesh.setMatrixAt(i, _m.compose(l.p, _q, _s.setScalar(1))); laMesh.setColorAt(i, l.c);
  }
  laMesh.instanceMatrix.needsUpdate = true; if (laMesh.instanceColor) laMesh.instanceColor.needsUpdate = true;
});
dia.datLai = function () {
  Hc.fill(0); Hd.fill(0); hoi.fill(0); MAU.fill(1); mauHoi.fill(0); songDat.length = 0; ban = true; dongCo = true;
  for (const v of vun) v.song = 0; la.length = 0;
  co.forEach((c, i) => { c.h = c.cao; c.cat = 0; c.bx = c.bz = c.vx = c.vz = 0; if (c.hetNhuom) { coMesh.setColorAt(i, c.mauGoc); c.hetNhuom = 0; } }); coMesh.instanceColor.needsUpdate = true;
  for (const c of cay) { c.gay = 0; c.dap = false; c.rung = 0; c.grp.rotation.set(0, 0, 0); }
  for (const s of daDo) { s.vo = false; s.grp.visible = true; }
  for (const c of DK.cotDa || []) c.visible = true;
  PP.vaCham = 0; PP.vien = 0;
};
DK.nghe('datLai', dia.datLai);

// ------------------------------------------------ tổ hợp tiện dùng cho chiêu lớn
/** nổ đất (đòn giáng xuống đất): hố + nứt + vụn + sóng + gió + phá vật. muc 1..3 */
dia.no = function (pos, op = {}) {
  const muc = op.muc || 1, c = op.mau;
  const r = (op.r || 2) ;
  dia.ho(pos, r, .25 + .2 * muc, { mau: c, chay: .5 + .15 * muc });
  dia.nut(pos, { r: r * (1.6 + .4 * muc), nhanh: 5 + muc * 3, mau: c, song: 2.5 + muc });
  dia.vun(pos, { so: 14 + 16 * muc, luc: 3 + 2 * muc, len: 5 + 2 * muc, r: r * .5 });
  dia.song(pos, { r: r * (2 + muc * 1.5), toc: 12 + 4 * muc, cao: .12 + .12 * muc });
  dia.gio(pos, r * (2.2 + muc), .8 + .5 * muc);
  if (muc >= 2) dia.pha(pos, r * (.8 + .5 * muc));
  if (DK.rung) DK.rung(.15 + .12 * muc, .25 + .1 * muc);
};

// ============================================================================
// 2026-11-17 — NÚI VOXEL PHÁ ĐƯỢC + ĐẠI PHÁ VÙNG
// Người dùng: "hoá cảnh là có thể phá huỷ 1 khu vực rộng lớn, đánh có thể đánh sập 1 ngọn núi"
// Núi dựng từ cột khối 1.25 m (port Unity: mỗi cột 1 instance, sập = hạ cột + sinh tảng rơi)
// ============================================================================
const NUI = dia.NUI = { tam: new V3(0, 0, 47), r: 20, cao: 22 };
const NO = 1.25, NX0 = -26, NZ0 = 29, NI = Math.round(52 / NO) + 1, NJ = Math.round(40 / NO) + 1;
const luoiNui = new Int32Array(NI * NJ).fill(-1), cotNui = [];
(function dungNui() {
  const dinh = [[0, 47, 22, 13], [-12, 43, 11, 8], [13, 44, 13, 8.5], [5, 55, 16, 9], [-7, 53, 13, 9]];   // x, z, cao, bán kính
  for (let i = 0; i < NI; i++) for (let j = 0; j < NJ; j++) {
    const x = NX0 + i * NO, z = NZ0 + j * NO; let h = 0;
    for (const [px, pz, H, r] of dinh) { const d = Math.hypot(x - px, z - pz) / (r * 1.6); if (d < 1) h = Math.max(h, H * (1 - d) ** 1.35); }
    h += (Math.sin(x * .7 + z * .3) + Math.sin(z * .9 - x * .4)) * .45;
    if (h < .8) continue;
    h = Math.round(h / .6) * .6;
    luoiNui[i * NJ + j] = cotNui.length;
    cotNui.push({ x, z, h0: h, h, hMuc: h, v: 0, tre: 0, tich: 0, hoi: 0, day: new V3(0, 0, 1) });
  }
})();
const matNui = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true });
const hopNui = new T.BoxGeometry(1, 1, 1); hopNui.translate(0, .5, 0);
const nuiMesh = new T.InstancedMesh(hopNui, matNui, cotNui.length); nuiMesh.receiveShadow = true; scene.add(nuiMesh);
const mauNui = h => { const c = new T.Color(h < 2.5 ? 0x5e7242 : h < 9 ? 0x766f63 : h < 16 ? 0x8a8478 : 0x9a9b9c); return c.multiplyScalar(.88 + Math.random() * .2); };
function veCot(k) { const c = cotNui[k]; _p.set(c.x, -.6, c.z); _q.identity(); _s.set(NO, Math.max(.01, c.h + .6), NO); nuiMesh.setMatrixAt(k, _m.compose(_p, _q, _s)); }
cotNui.forEach((c, k) => { veCot(k); nuiMesh.setColorAt(k, mauNui(c.h0)); });
nuiMesh.instanceMatrix.needsUpdate = true;
/** cao độ núi tại (x,z) (0 nếu ngoài chân núi) */
dia.nuiCao = (x, z) => { const i = Math.round((x - NX0) / NO), j = Math.round((z - NZ0) / NO); if (i < 0 || j < 0 || i >= NI || j >= NJ) return 0; const k = luoiNui[i * NJ + j]; return k < 0 ? 0 : cotNui[k].h; };
/** điểm đầu tiên tia goc→huong chạm núi (null nếu trượt) — để phi kiếm / kiếm khí bay tới đúng sườn núi */
dia.chamNui = function (goc, huong, xa = 100) {
  const h = huong.clone().normalize(), p = new V3();
  for (let t = 0; t < xa; t += .5) { p.copy(goc).addScaledVector(h, t); if (p.y <= dia.nuiCao(p.x, p.z)) return p.clone(); }
  return null;
};
// tảng đá lớn lăn xuống sườn núi
const TANG_MAX = 700; let tangI = 0; const tang = []; for (let i = 0; i < TANG_MAX; i++) tang.push({ song: 0 });
const tangMesh = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true }), TANG_MAX);
tangMesh.instanceMatrix.setUsage(T.DynamicDrawUsage); tangMesh.frustumCulled = false; tangMesh.castShadow = true; scene.add(tangMesh);
for (let i = 0; i < TANG_MAX; i++) { tangMesh.setMatrixAt(i, _m.makeScale(0, 0, 0)); tangMesh.setColorAt(i, new T.Color(.5, .5, .5)); }
const nen = (x, z) => Math.max(dia.cao(x, z), dia.nuiCao(x, z));
function themTang(p, v, co, mau) {
  const t = tang[tangI], id = tangI; tangI = (tangI + 1) % TANG_MAX;
  t.p = p.clone(); t.v = v.clone(); t.co = co; t.t = 0; t.song = 6 + Math.random() * 2; t.nam = false;
  t.r = new V3(Math.random() * 6, Math.random() * 6, Math.random() * 6); t.w = new V3((Math.random() - .5) * 6, (Math.random() - .5) * 6, (Math.random() - .5) * 6);
  tangMesh.setColorAt(id, mau); tangMesh.instanceColor.needsUpdate = true;
}
/** tảng đá lớn bay ra (chiêu muốn hất tảng đá): { so, luc, len, co, mau, huong } */
dia.tang = function (pos, op = {}) {
  const so = op.so || 10, luc = op.luc || 6, len = op.len != null ? op.len : 6, co = op.co || 1.1;
  for (let n = 0; n < so; n++) {
    const a = Math.random() * Math.PI * 2;
    const v = new V3(Math.cos(a) * luc * Math.random(), len * (.5 + Math.random() * .7), Math.sin(a) * luc * Math.random());
    if (op.huong) v.addScaledVector(op.huong, luc * .8);
    themTang(pos.clone().add(new V3((Math.random() - .5) * 2, Math.random(), (Math.random() - .5) * 2)), v, co * (.5 + Math.random() * .8), mauC(op.mau != null ? op.mau : 0x7a7468).multiplyScalar(.8 + Math.random() * .3));
  }
};
/**
 * SẬP NÚI: các cột trong bán kính r quanh pos (mặt phẳng ngang) hạ xuống, đỉnh sụp trước, tảng đá lăn xuống sườn, bụi bốc.
 * op: { r (m, mặc định 10), manh (0..1, 1 = san gần phẳng ở tâm), huong (V3 đẩy tảng theo hướng đòn), tre (s trễ), giu (s trước khi núi mọc lại, mặc định 14) }
 * Gọi với pos = dia.NUI.tam, r ≥ 22, manh 1 ⇒ cả ngọn núi đổ sập. Trả về số cột bị sập.
 */
dia.sapNui = function (pos, op = {}) {
  const r = op.r || 10, manh = op.manh != null ? op.manh : 1, giu = op.giu || 14, tre = op.tre || 0;
  let trung = 0;
  for (const c of cotNui) {
    const d = Math.hypot(c.x - pos.x, c.z - pos.z); if (d >= r) continue;
    const k = (1 - (d / r) ** 2) * manh; const muc = Math.max(.4 + Math.random() * .8, c.h * (1 - k));
    if (muc >= c.hMuc - .05) continue;
    c.hMuc = muc; c.tre = DK.now + tre + (d / r) * .5 + Math.random() * .15; c.v = 0; c.hoi = DK.now + tre + giu;
    c.day.set(c.x - pos.x, 0, c.z - pos.z); if (c.day.lengthSq() < 1e-3) c.day.set(Math.random() - .5, 0, Math.random() - .5); c.day.normalize();
    if (op.huong) c.day.addScaledVector(op.huong.clone().setY(0).normalize(), .8).normalize();
    trung++;
  }
  if (!trung) return 0;
  DK.sau(tre, () => {
    dia.pha(pos, r * .9);
    for (let i = 0; i < 6; i++) { const a = Math.random() * Math.PI * 2, d = Math.random() * r * .6, x = pos.x + Math.cos(a) * d, z = pos.z + Math.sin(a) * d; vfx.hat(new V3(x, dia.nuiCao(x, z) + 1, z), { so: 4, mau: 0x4a453e, to: true, toc: 2, co: 1.2, song: 3, trongLuc: -.4, can: 1.2, dat: false }); }
    if (DK.rung) DK.rung(.35 + .35 * manh, 1.4);
  });
  return trung;
};
let nuiDoi = false;
DK.moiKhung(dt => {
  for (let k = 0; k < cotNui.length; k++) {
    const c = cotNui[k];
    if (c.h > c.hMuc + 1e-3) {
      if (DK.now < c.tre) continue;
      c.v = Math.min(16, c.v + 20 * dt); const dh = Math.min(c.h - c.hMuc, c.v * dt); c.h -= dh; c.tich += dh; nuiDoi = true; veCot(k);
      while (c.tich > 1.1) {
        c.tich -= 1.1;
        const v = c.day.clone().multiplyScalar(2 + Math.random() * 5); v.y = 1 + Math.random() * 4;
        themTang(new V3(c.x + (Math.random() - .5) * NO, c.h + .6, c.z + (Math.random() - .5) * NO), v, .6 + Math.random() * 1.1, mauNui(c.h + 1).multiplyScalar(.62));
        if (Math.random() < .12) vfx.hat(new V3(c.x, c.h + .8, c.z), { so: 2, mau: 0x4a453e, to: true, toc: 1.5, co: 1, song: 2.4, trongLuc: -.5, can: 1.4, dat: false });
      }
    } else if (c.h < c.h0 && DK.now > c.hoi) {
      c.h = Math.min(c.h0, c.h + dt * 2.5); c.hMuc = c.h; c.tich = 0; nuiDoi = true; veCot(k);
    }
  }
  if (nuiDoi) { nuiMesh.instanceMatrix.needsUpdate = true; nuiDoi = false; }
  for (let i = 0; i < TANG_MAX; i++) {
    const t = tang[i]; if (!(t.song > 0)) continue;
    t.t += dt; if (t.t >= t.song) { t.song = 0; tangMesh.setMatrixAt(i, _m.makeScale(0, 0, 0)); continue; }
    if (!t.nam) {
      t.v.y -= 20 * dt; t.p.addScaledVector(t.v, dt); t.r.addScaledVector(t.w, dt);
      const y0 = nen(t.p.x, t.p.z) + t.co * .5;
      if (t.p.y < y0) {
        t.p.y = y0;
        // dốc: tảng trượt về phía thấp (lăn xuống sườn)
        const gx = nen(t.p.x + .8, t.p.z) - nen(t.p.x - .8, t.p.z), gz = nen(t.p.x, t.p.z + .8) - nen(t.p.x, t.p.z - .8);
        t.v.x -= gx * 1.6; t.v.z -= gz * 1.6;
        if (Math.abs(t.v.y) < 1.2 && Math.abs(gx) + Math.abs(gz) < .4) t.nam = true; else { t.v.y = Math.abs(t.v.y) * .3; t.v.x *= .8; t.v.z *= .8; t.w.multiplyScalar(.7); }
      }
    }
    const chim = Math.max(0, (t.t - t.song + .8) / .8);
    _q.setFromEuler(_e.set(t.r.x, t.r.y, t.r.z)); _s.setScalar(t.co * (1 - chim * .9)); _p.copy(t.p); _p.y -= chim * t.co;
    tangMesh.setMatrixAt(i, _m.compose(_p, _q, _s));
  }
  tangMesh.instanceMatrix.needsUpdate = true;
});
DK.nghe('datLai', () => {
  cotNui.forEach((c, k) => { c.h = c.hMuc = c.h0; c.v = 0; c.tich = 0; veCot(k); }); nuiMesh.instanceMatrix.needsUpdate = true;
  for (let i = 0; i < TANG_MAX; i++) { tang[i].song = 0; tangMesh.setMatrixAt(i, _m.makeScale(0, 0, 0)); } tangMesh.instanceMatrix.needsUpdate = true;
});

/**
 * ĐẠI PHÁ VÙNG (Hoá Cảnh): cả một khu rộng bị xé — hố lớn ở tâm, rãnh toả nan quạt, tảng đất trồi, gai đá, nứt, hai vòng sóng đất,
 * cây/đèn/cột trong vùng gãy đổ, tảng đá văng, bụi đất bốc.
 * op: { r (m, mặc định 16), mau (màu rạn của chiêu), sau (độ sâu hố tâm), nhanh (số rãnh), huong (V3: rãnh dồn thành quạt theo hướng đòn) }
 * Mảnh đất biến dạng chỉ rộng ±26 m quanh gốc — ngoài đó (núi ở z≈29..69) dùng dia.sapNui.
 */
dia.daiPha = function (pos, op = {}) {
  const r = op.r || 16, c = op.mau, sau = op.sau || 1.3, n = op.nhanh || 11;
  const goc0 = op.huong ? Math.atan2(op.huong.z, op.huong.x) : 0;
  dia.ho(pos, r * .28, sau, { mau: c, chay: .85, vanh: sau * .55 });
  for (let i = 0; i < n; i++) {
    const a = op.huong ? goc0 + (i / (n - 1) - .5) * Math.PI * 1.3 + (Math.random() - .5) * .2 : i / n * Math.PI * 2 + Math.random() * .4;
    const L = r * (.65 + Math.random() * .4), cs = Math.cos(a), sn = Math.sin(a);
    const a0 = new V3(pos.x + cs * r * .22, 0, pos.z + sn * r * .22), b = new V3(pos.x + cs * L, 0, pos.z + sn * L);
    DK.sau(.04 + i * .025, () => dia.ranh(a0, b, .45 + Math.random() * .5, .5 + Math.random() * .6, { mau: c }));
    const m = a0.clone().lerp(b, .45 + Math.random() * .35), ben = Math.random() < .5 ? 1 : -1;
    DK.sau(.12 + i * .03, () => dia.nang(m.clone().add(new V3(-sn * ben * 1.4, 0, cs * ben * 1.4)), 1.1 + Math.random() * .9, .5 + Math.random() * .8));
  }
  dia.nut(pos, { r, nhanh: 14, mau: c, song: 5 });
  dia.vun(pos, { so: 150, luc: 9, len: 11, r: r * .3, co: .38 });
  dia.tang(pos, { so: 14, luc: 7, len: 9, co: 1, huong: op.huong });
  DK.sau(.08, () => dia.song(pos, { r: r * 1.5, toc: 20, cao: .7, rong: 2.4 }));
  DK.sau(.45, () => dia.song(pos, { r: r * 1.8, toc: 15, cao: .4, rong: 2 }));
  for (let i = 0; i < 7; i++) { const a = Math.random() * Math.PI * 2, d = r * (.35 + Math.random() * .45); DK.sau(.2 + i * .06, () => dia.gai(new V3(pos.x + Math.cos(a) * d, 0, pos.z + Math.sin(a) * d), { so: 5, r: 1.6, cao: 1.8, mau: c })); }
  for (let i = 0; i < 10; i++) { const a = Math.random() * Math.PI * 2, d = Math.random() * r * .8; vfx.hat(new V3(pos.x + Math.cos(a) * d, .5, pos.z + Math.sin(a) * d), { so: 3, mau: 0x4a453e, to: true, toc: 1.2, co: .9, song: 2.6, trongLuc: -.5, can: 1.5 }); }
  dia.gio(pos, r * 1.8, 2.5);
  dia.pha(pos, r);
  if (DK.rung) DK.rung(.7, 1.2);
};
})();
