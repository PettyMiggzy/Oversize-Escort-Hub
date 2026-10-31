import * as THREE from 'three'

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking'
export type OrbTheme = 'orange' | 'ice'

const COLORS: Record<OrbTheme, string> = { orange: '#ff6a13', ice: '#28c8ff' }
const PARAMS: Record<OrbState, { spin: number; pulse: number; core: number; scan: number; voice: number; speak: number }> = {
  idle: { spin: 0.28, pulse: 0.012, core: 0.68, scan: 0, voice: 0, speak: 0.18 },
  listening: { spin: 0.82, pulse: 0.042, core: 1.08, scan: 0, voice: 0, speak: 0.34 },
  thinking: { spin: 2.35, pulse: 0.02, core: 1.2, scan: 1, voice: 0, speak: 0.3 },
  speaking: { spin: 0.72, pulse: 0.05, core: 1.02, scan: 0, voice: 1, speak: 0.92 },
}

export type Orb = {
  setState(s: OrbState): void
  setTheme(t: OrbTheme): void
  /** A short burst of activity (0 to 1) from the microphone or the spoken reply; it fades after holdSeconds. */
  setActivity(level: number, holdSeconds: number): void
  resize(): void
  dispose(): void
}

type Colored = { color: THREE.Color }

/** The Wraith orb: ten tilted rings of broken arcs turning against each other, a scanner, a ring of voice bars and a glowing core. */
export function createOrb(canvas: HTMLCanvasElement, stage: HTMLElement): Orb {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' })
  renderer.setClearColor(0x000000, 0)
  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-4, 4, 4, -4, 0.1, 80)
  camera.position.z = 20; camera.lookAt(0, 0, 0)
  const root = new THREE.Group(); scene.add(root)

  const activeColor = new THREE.Color(COLORS.orange), targetColor = activeColor.clone()
  const accent: Colored[] = []
  const disposables: { dispose(): void }[] = []
  const track = <T extends { dispose(): void }>(d: T) => { disposables.push(d); return d }

  function resize() {
    const w = Math.max(1, stage.clientWidth), h = Math.max(1, stage.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(w, h, false)
    const vh = (8.05 * h) / Math.min(w, h)
    camera.top = vh / 2; camera.bottom = -vh / 2; camera.left = (-vh * w) / h / 2; camera.right = (vh * w) / h / 2
    camera.updateProjectionMatrix()
    root.position.y = vh * 0.07
  }

  const gc = document.createElement('canvas'); gc.width = gc.height = 128
  const gx = gc.getContext('2d')!
  const gg = gx.createRadialGradient(64, 64, 0, 64, 64, 64)
  gg.addColorStop(0, 'rgba(255,255,255,.88)'); gg.addColorStop(0.11, 'rgba(255,255,255,.48)'); gg.addColorStop(0.42, 'rgba(255,255,255,.12)'); gg.addColorStop(1, 'rgba(255,255,255,0)')
  gx.fillStyle = gg; gx.fillRect(0, 0, 128, 128)
  const tex = track(new THREE.CanvasTexture(gc)); tex.minFilter = THREE.LinearFilter

  const addSprite = (opacity: number, size: number, z: number) => {
    const m = track(new THREE.SpriteMaterial({ map: tex, color: activeColor.clone(), transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }))
    const sp = new THREE.Sprite(m); sp.position.z = z; sp.scale.set(size, size, 1); root.add(sp); accent.push(m); return sp
  }
  const halo = addSprite(0.5, 6.3, -0.62)
  addSprite(0.65, 2.25, 0.18)

  const pos: number[] = []
  for (let i = 0; i < 190; i++) {
    const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = 3.75 + Math.random() * 2.65, q = Math.sqrt(1 - u * u)
    pos.push(r * q * Math.cos(a), r * q * Math.sin(a), r * u)
  }
  const dg = track(new THREE.BufferGeometry()); dg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  const dust = new THREE.Points(dg, track(new THREE.PointsMaterial({ color: 0xaab3bd, size: 0.033, transparent: true, opacity: 0.38, depthWrite: false, sizeAttenuation: true, map: tex, blending: THREE.AdditiveBlending })))
  root.add(dust)

  const arc = (radius: number, start: number, length: number, steps: number) => {
    const p: THREE.Vector3[] = []
    for (let i = 0; i <= steps; i++) { const a = start + (length * i) / steps; p.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0)) }
    return track(new THREE.BufferGeometry().setFromPoints(p))
  }
  const accentMat = <M extends THREE.Material & Colored>(m: M) => { track(m); accent.push(m); return m }

  const rings: { tilt: THREE.Group; spin: THREE.Group; dir: number; speed: number; phase: number }[] = []
  const alphas = [0.53, 0.37, 0.46, 0.3, 0.43]
  for (let i = 0; i < 10; i++) {
    const tilt = new THREE.Group(); tilt.rotation.set((Math.random() - 0.5) * 0.78, (Math.random() - 0.5) * 0.82, (Math.random() - 0.5) * 0.22)
    const spin = new THREE.Group(); tilt.add(spin); root.add(tilt)
    const radius = 1.03 + i * 0.252, count = 3 + (i % 3), offset = Math.random() * Math.PI * 2
    for (let j = 0; j < count; j++) {
      const start = offset + (j * Math.PI * 2) / count + (Math.random() - 0.5) * 0.42
      const len = ((Math.PI * 2) / count) * (0.38 + Math.random() * 0.48)
      spin.add(new THREE.Line(arc(radius, start, len, 26), accentMat(new THREE.LineBasicMaterial({ color: activeColor.clone(), transparent: true, opacity: alphas[(i + j) % 5], blending: THREE.AdditiveBlending, depthWrite: false }))))
      if ((i + j) % 3 === 0) {
        const node = new THREE.Mesh(track(new THREE.SphereGeometry(0.02, 8, 6)), accentMat(new THREE.MeshBasicMaterial({ color: activeColor.clone(), transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending, depthWrite: false })))
        node.position.set(Math.cos(start + len) * radius, Math.sin(start + len) * radius, 0.012); spin.add(node)
      }
    }
    rings.push({ tilt, spin, dir: i % 2 ? -1 : 1, speed: 0.38 + i * 0.05, phase: i * 0.52 })
  }

  const scanG = arc(1.02, -0.64, 1.27, 52), sa = scanG.attributes.position.array, spts: THREE.Vector3[] = []
  for (let i = 0; i < scanG.attributes.position.count; i++) spts.push(new THREE.Vector3(sa[i * 3], sa[i * 3 + 1], 0.06))
  const scanMat = accentMat(new THREE.MeshBasicMaterial({ color: activeColor.clone(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }))
  const scanner = new THREE.Group()
  scanner.add(new THREE.Mesh(track(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spts), 52, 0.014, 5, false)), scanMat)); root.add(scanner)

  const barGeo = track(new THREE.BoxGeometry(0.031, 1, 0.025))
  const bars: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; a: number; seed: number }[] = []
  for (let i = 0; i < 64; i++) {
    const mat = accentMat(new THREE.MeshBasicMaterial({ color: activeColor.clone(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }))
    const mesh = new THREE.Mesh(barGeo, mat), a = (i / 64) * Math.PI * 2
    mesh.rotation.z = a - Math.PI / 2; mesh.position.set(Math.cos(a) * 1.04, Math.sin(a) * 1.04, 0.16); mesh.scale.y = 0.04
    root.add(mesh); bars.push({ mesh, mat, a, seed: Math.random() * 6.28 })
  }

  const shell = new THREE.Mesh(track(new THREE.IcosahedronGeometry(0.5, 2)), accentMat(new THREE.MeshBasicMaterial({ color: activeColor.clone(), wireframe: true, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })))
  shell.position.z = 0.28; root.add(shell)
  const core = new THREE.Mesh(track(new THREE.SphereGeometry(0.335, 32, 24)), track(new THREE.MeshBasicMaterial({ color: 0xffe8d1, transparent: true, opacity: 0.96 })))
  core.position.z = 0.37; root.add(core)
  const point = new THREE.Mesh(track(new THREE.SphereGeometry(0.13, 20, 16)), track(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.86 })))
  point.position.set(-0.07, 0.075, 0.65); root.add(point)

  let px = 0, py = 0
  const onMove = (e: PointerEvent) => { px = (e.clientX / window.innerWidth - 0.5) * 2; py = (e.clientY / window.innerHeight - 0.5) * 2 }
  const onLeave = () => { px = 0; py = 0 }
  window.addEventListener('pointermove', onMove, { passive: true }); window.addEventListener('pointerleave', onLeave)

  const lerp = THREE.MathUtils.lerp
  const smooth = (a: number, b: number, k: number, dt: number) => lerp(a, b, 1 - Math.exp(-k * dt))
  let state: OrbState = 'idle', clock = 0, last = 0, raf = 0, dead = false
  let spinNow = 0.25, pulseNow = 0.012, coreNow = 0.7, scanNow = 0, voiceNow = 0, speakNow = 0.2, activityNow = 0
  let activity = 0, activityUntil = 0

  function frame(ts: number) {
    if (dead) return
    raf = requestAnimationFrame(frame)
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts; clock += dt
    const p = PARAMS[state]
    spinNow = smooth(spinNow, p.spin, 2.4, dt); pulseNow = smooth(pulseNow, p.pulse, 2.7, dt); coreNow = smooth(coreNow, p.core, 2.6, dt)
    scanNow = smooth(scanNow, p.scan, 3.2, dt); voiceNow = smooth(voiceNow, p.voice, 3.2, dt); speakNow = smooth(speakNow, p.speak, 2.8, dt)
    const baseline = state === 'speaking' ? 0.24 + 0.48 * Math.abs(Math.sin(clock * 3.8)) : 0
    const target = state === 'listening' || state === 'speaking' ? (clock < activityUntil ? activity : baseline) : 0
    activityNow = smooth(activityNow, target, 8, dt)
    activeColor.lerp(targetColor, 1 - Math.exp(-2.6 * dt)); accent.forEach((m) => m.color.copy(activeColor))
    root.rotation.x = smooth(root.rotation.x, py * 0.105, 2.2, dt); root.rotation.y = smooth(root.rotation.y, px * 0.12, 2.2, dt); root.rotation.z = Math.sin(clock * 0.11) * 0.018
    dust.rotation.y += dt * 0.012; dust.rotation.x += dt * 0.006
    halo.material.opacity = 0.31 + coreNow * 0.12 + activityNow * 0.1 + Math.sin(clock * 1.2) * 0.025
    halo.scale.setScalar(6.25 + coreNow * 0.14 + Math.sin(clock * 1.05) * 0.08)
    shell.rotation.x += dt * 0.12; shell.rotation.y -= dt * 0.18
    shell.scale.setScalar(1 + Math.sin(clock * 2.3) * (0.025 + pulseNow * 0.24 + activityNow * 0.1))
    core.scale.setScalar(1 + Math.sin(clock * (state === 'speaking' ? 8 : 2.1)) * (0.018 + pulseNow * 0.4) + (state === 'speaking' ? 0.025 * Math.sin(clock * 11.7) : 0) + activityNow * 0.055)
    rings.forEach((r) => {
      r.spin.rotation.z += dt * r.speed * spinNow * r.dir
      const wave = state === 'speaking' ? Math.max(0, Math.sin(clock * 3.6 - r.phase)) * (0.012 + activityNow * 0.04) : 0
      const listenWave = state === 'listening' ? Math.max(0, Math.sin(clock * 4 - r.phase)) * 0.018 * activityNow : 0
      r.spin.scale.setScalar(1 + Math.sin(clock * 2.1 - r.phase) * pulseNow + wave + listenWave)
      r.tilt.rotation.x += dt * Math.sin(clock * 0.22 + r.phase) * 0.0008; r.tilt.rotation.y += dt * Math.cos(clock * 0.19 + r.phase) * 0.0008
    })
    scanner.rotation.z += dt * (1.2 + spinNow * 1.45); scanMat.opacity = scanNow * 0.94
    bars.forEach((b, i) => {
      const wave = 0.5 + 0.5 * Math.sin(clock * (3.2 + speakNow * 2.8) + b.seed + Math.sin(clock * 1.4 + i * 0.13) * 0.8)
      const beat = 0.5 + 0.5 * Math.sin(clock * (3.2 + speakNow * 2.8) * 0.42 + i * 0.16)
      const h = 0.08 + wave * (0.07 + speakNow * 0.27) + beat * speakNow * 0.05 + activityNow * (0.06 + wave * 0.16)
      const visible = Math.max(voiceNow, state === 'listening' ? activityNow * 0.8 : 0)
      b.mesh.scale.y = h; b.mesh.position.set(Math.cos(b.a) * (1.04 + h * 0.48), Math.sin(b.a) * (1.04 + h * 0.48), 0.16); b.mat.opacity = visible * (0.2 + wave * 0.8)
    })
    renderer.render(scene, camera)
  }
  resize(); raf = requestAnimationFrame(frame)

  return {
    setState(s) { state = s },
    setTheme(t) { targetColor.set(COLORS[t]) },
    setActivity(level, holdSeconds) { activity = Math.max(0, Math.min(1, level)); activityUntil = clock + holdSeconds },
    resize,
    dispose() {
      dead = true; cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerleave', onLeave)
      disposables.forEach((d) => d.dispose()); renderer.dispose()
    },
  }
}
