import * as THREE from 'three'

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking'
export type OrbTheme = 'orange' | 'ice'

const PAL = { orange: { a: 0xff6a13, b: 0xffb067 }, ice: { a: 0x28c8ff, b: 0xaaebff } }
const PRESETS: Record<OrbState, { spin: number; pulse: number; core: number; scan: number; bar: number; ripple: number; glow: number }> = {
  idle: { spin: 1.0, pulse: 0.1, core: 1.0, scan: 0, bar: 0, ripple: 0, glow: 1.0 },
  listening: { spin: 1.9, pulse: 1.0, core: 1.45, scan: 0, bar: 0, ripple: 0, glow: 1.35 },
  thinking: { spin: 4.6, pulse: 0.45, core: 1.2, scan: 1, bar: 0, ripple: 0, glow: 1.15 },
  speaking: { spin: 1.3, pulse: 0.6, core: 1.15, scan: 0, bar: 1, ripple: 1, glow: 1.25 },
}

export type Orb = { setState(s: OrbState): void; setTheme(t: OrbTheme): void; resize(): void; dispose(): void }

/** The Wraith orb: ten tilted, counter-rotating rings, a core, voice bars and a scanner. Draws into `canvas`, sized to `stage`. */
export function createOrb(canvas: HTMLCanvasElement, stage: HTMLElement): Orb {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
  renderer.setClearColor(0x000000, 1)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 220)
  const MAXR = 9.15
  function resize() {
    const w = stage.clientWidth || 1, h = stage.clientHeight || 1
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    const vFov = (camera.fov * Math.PI) / 180
    const dv = (MAXR * 1.1) / Math.tan(vFov / 2)
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect)
    const dh = (MAXR * 1.1) / Math.tan(hFov / 2)
    camera.position.set(0, -1.5, Math.max(dv, dh))
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }

  const colA = new THREE.Color(PAL.orange.a), colB = new THREE.Color(PAL.orange.b)
  const tgtA = new THREE.Color(PAL.orange.a), tgtB = new THREE.Color(PAL.orange.b)
  const orb = new THREE.Group()
  scene.add(orb)
  const disposables: { dispose(): void }[] = []
  const mats: { mat: THREE.Material & { color: THREE.Color; opacity: number }; baseOp: number; slot: number }[] = []
  function mkMat(slot: number, op: number) {
    const m = new THREE.MeshBasicMaterial({ color: (slot ? colB : colA).clone(), transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false })
    mats.push({ mat: m, baseOp: op, slot }); disposables.push(m)
    return m
  }
  const geo = <G extends THREE.BufferGeometry>(g: G) => { disposables.push(g); return g }

  const RINGS: { spin: THREE.Group; dir: number; speed: number; phase: number; node: THREE.Group }[] = []
  const MINR = 2.35, GAPR = (MAXR - MINR) / 9
  for (let i = 0; i < 10; i++) {
    const rad = MINR + GAPR * i
    const g = new THREE.Group()
    g.rotation.x = THREE.MathUtils.degToRad(((i * 37) % 66) - 33)
    g.rotation.y = THREE.MathUtils.degToRad(((i * 53) % 74) - 37)
    const spin = new THREE.Group(); g.add(spin)
    const segs = 4 + ((i * 3) % 5)
    for (let s = 0; s < segs; s++) {
      const arc = 0.2 + Math.random() * 0.62
      const m = new THREE.Mesh(geo(new THREE.TorusGeometry(rad, 0.0125 + Math.random() * 0.007, 6, Math.max(8, Math.round(arc * 54)), arc)), mkMat((s + i) % 2, 0.24 + Math.random() * 0.46))
      m.rotation.z = (s / segs) * Math.PI * 2 + Math.random() * 0.45
      spin.add(m)
    }
    orb.add(g)
    RINGS.push({ spin, dir: i % 2 ? 1 : -1, speed: 0.1 + Math.random() * 0.36, phase: Math.random() * 6.283, node: g })
  }

  const hc = document.createElement('canvas'); hc.width = hc.height = 256
  const hx = hc.getContext('2d')!
  const grd = hx.createRadialGradient(128, 128, 0, 128, 128, 128)
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.22, 'rgba(255,255,255,.55)'); grd.addColorStop(0.55, 'rgba(255,255,255,.14)'); grd.addColorStop(1, 'rgba(255,255,255,0)')
  hx.fillStyle = grd; hx.fillRect(0, 0, 256, 256)
  const haloTex = new THREE.CanvasTexture(hc); disposables.push(haloTex)
  const sprite = (op: number, size: number) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false }))
    disposables.push(sp.material); sp.scale.setScalar(size); orb.add(sp); return sp
  }
  const halo = sprite(0.9, 9)
  const coreMat = new THREE.MeshBasicMaterial({ color: colB.clone(), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false })
  disposables.push(coreMat); mats.push({ mat: coreMat, baseOp: 0.95, slot: 1 })
  const core = new THREE.Mesh(geo(new THREE.SphereGeometry(0.42, 28, 28)), coreMat); orb.add(core)
  const coreGlow = sprite(0.85, 3.4)

  const scanner = new THREE.Mesh(geo(new THREE.TorusGeometry(1.55, 0.022, 6, 64, 1.15)), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }))
  disposables.push(scanner.material as THREE.Material); orb.add(scanner)

  const BARS = 48, barGroup = new THREE.Group(), bars: THREE.Mesh[] = []
  const barGeo = geo(new THREE.PlaneGeometry(0.055, 1))
  for (let b = 0; b < BARS; b++) {
    const bm = new THREE.Mesh(barGeo, mkMat(b % 2, 0.85))
    const a = (b / BARS) * Math.PI * 2
    bm.position.set(Math.cos(a) * 2.15, Math.sin(a) * 2.15, 0); bm.rotation.z = a + Math.PI / 2; bm.userData.amp = 0.3
    barGroup.add(bm); bars.push(bm)
  }
  orb.add(barGroup)

  const RIPPLES: { m: THREE.Mesh; life: number }[] = []
  const ripGeo = geo(new THREE.TorusGeometry(1.3, 0.02, 6, 72, Math.PI * 1.7))
  for (let r = 0; r < 8; r++) {
    const rm = new THREE.Mesh(ripGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }))
    disposables.push(rm.material as THREE.Material); rm.rotation.z = Math.random() * 6.28; orb.add(rm); RIPPLES.push({ m: rm, life: 0 })
  }

  const COUNT = window.innerWidth < 560 ? 170 : 320
  const pos = new Float32Array(COUNT * 3)
  for (let p = 0; p < COUNT; p++) {
    const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), rr = 7 + Math.random() * 10
    pos[p * 3] = rr * Math.sin(ph) * Math.cos(th); pos[p * 3 + 1] = rr * Math.cos(ph) * 0.6; pos[p * 3 + 2] = rr * Math.sin(ph) * Math.sin(th)
  }
  const pGeo = geo(new THREE.BufferGeometry()); pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const pMat = new THREE.PointsMaterial({ size: 0.055, transparent: true, opacity: 0.5, color: colA.clone(), blending: THREE.AdditiveBlending, depthWrite: false })
  disposables.push(pMat); mats.push({ mat: pMat as unknown as (typeof mats)[number]['mat'], baseOp: 0.5, slot: 0 })
  const dust = new THREE.Points(pGeo, pMat); scene.add(dust)

  let tiltX = 0, tiltY = 0, tTiltX = 0, tTiltY = 0
  const onMove = (e: PointerEvent) => {
    const r = stage.getBoundingClientRect()
    tTiltY = (((e.clientX - r.left) / r.width) * 2 - 1) * 0.26
    tTiltX = (((e.clientY - r.top) / r.height) * 2 - 1) * -0.18
  }
  const onLeave = () => { tTiltX = 0; tTiltY = 0 }
  stage.addEventListener('pointermove', onMove); stage.addEventListener('pointerleave', onLeave)

  let state: OrbState = 'idle', want = PRESETS.idle, voice = 0, rippleTimer = 0, raf = 0, last = performance.now(), t = 0, dead = false
  const cur = { ...PRESETS.idle }

  function frame(now: number) {
    if (dead) return
    const dt = Math.min((now - last) / 1000, 0.05); last = now; t += dt
    const k = Math.min(1, dt * 4.2)
    for (const key of Object.keys(cur) as (keyof typeof cur)[]) cur[key] += (want[key] - cur[key]) * k
    tiltX += (tTiltX - tiltX) * Math.min(1, dt * 3.5); tiltY += (tTiltY - tiltY) * Math.min(1, dt * 3.5)
    orb.rotation.x = tiltX; orb.rotation.y = tiltY
    colA.lerp(tgtA, Math.min(1, dt * 3)); colB.lerp(tgtB, Math.min(1, dt * 3))
    for (const rec of mats) { rec.mat.color.copy(rec.slot ? colB : colA); rec.mat.opacity = rec.baseOp }
    for (const R of RINGS) {
      R.spin.rotation.z += dt * R.speed * cur.spin * R.dir
      R.node.scale.setScalar(1 + Math.sin(t * 1.7 + R.phase) * cur.pulse * 0.028)
    }
    core.scale.setScalar(cur.core * (1 + Math.sin(t * 1.25) * 0.05) * (1 + voice * 0.22))
    coreGlow.scale.setScalar(3.4 * cur.core * (0.9 + Math.sin(t * 2.1) * 0.06) * (1 + voice * 0.3))
    coreGlow.material.opacity = 0.55 * cur.glow
    halo.scale.setScalar(9 * cur.glow * (1 + Math.sin(t * 0.9) * 0.04)); halo.material.opacity = 0.22 * cur.glow
    const sm = scanner.material as THREE.MeshBasicMaterial
    sm.opacity = cur.scan * 0.9; sm.color.copy(colB); scanner.rotation.z += dt * 7; scanner.scale.setScalar(1 + cur.scan * 0.12)
    const target = state === 'speaking' ? 0.35 + Math.random() * 0.9 : 0
    voice += (target - voice) * Math.min(1, dt * 9)
    if (state === 'speaking' && Math.random() < 0.06) voice = 1.25
    bars.forEach((bar, i) => {
      const a = 0.22 + Math.abs(Math.sin(t * 7.3 + i * 0.55)) * 1.5
      bar.userData.amp += (a - bar.userData.amp) * Math.min(1, dt * 12)
      bar.scale.y = Math.max(0.06, bar.userData.amp * cur.bar * (0.4 + voice))
    })
    barGroup.rotation.z -= dt * 0.25
    rippleTimer -= dt
    if (cur.ripple > 0.5 && rippleTimer <= 0) { rippleTimer = 0.42; const r = RIPPLES.find((x) => x.life <= 0); if (r) { r.life = 1; r.m.scale.setScalar(1) } }
    for (const rp of RIPPLES) {
      const rm = rp.m.material as THREE.MeshBasicMaterial
      if (rp.life > 0) { rp.life -= dt * 0.9; rp.m.scale.setScalar(1 + (1 - rp.life) * 2.6); rm.opacity = Math.max(0, rp.life * 0.5); rm.color.copy(colB) } else rm.opacity = 0
    }
    dust.rotation.y += dt * 0.035; dust.rotation.x = Math.sin(t * 0.1) * 0.06
    renderer.render(scene, camera)
    raf = requestAnimationFrame(frame)
  }
  resize()
  raf = requestAnimationFrame(frame)

  return {
    setState(s) { state = s; want = PRESETS[s] },
    setTheme(th) { tgtA.setHex(PAL[th].a); tgtB.setHex(PAL[th].b) },
    resize,
    dispose() {
      dead = true; cancelAnimationFrame(raf)
      stage.removeEventListener('pointermove', onMove); stage.removeEventListener('pointerleave', onLeave)
      disposables.forEach((d) => d.dispose()); renderer.dispose()
    },
  }
}
