'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

type ThemeConfig = {
  sceneBg: number
  fogColor: number
  body: number
  bodyEmissive: number
  accent: number
  windowDark: number
  ground: number
  particle: number
  rimLight: number
  ambient: number
}

const THEME_CONFIGS: Record<string, ThemeConfig> = {
  navy: {
    sceneBg: 0x0a1424,
    fogColor: 0x0a1424,
    body: 0x14263f,
    bodyEmissive: 0x1a3050,
    accent: 0xff8a3d,
    windowDark: 0x0d1a2c,
    ground: 0x0c1728,
    particle: 0xff8a3d,
    rimLight: 0x9ec1ff,
    ambient: 0.4,
  },
  dark: {
    sceneBg: 0x0a0a0f,
    fogColor: 0x0a0a0f,
    body: 0x16161f,
    bodyEmissive: 0x1c1c28,
    accent: 0xd4a531,
    windowDark: 0x0d0d14,
    ground: 0x0c0c12,
    particle: 0xd4a531,
    rimLight: 0xd4a531,
    ambient: 0.35,
  },
  light: {
    sceneBg: 0xfaf7f0,
    fogColor: 0xfaf7f0,
    body: 0xd9d2c2,
    bodyEmissive: 0xe8e2d2,
    accent: 0x9c7a14,
    windowDark: 0xb5ad9a,
    ground: 0xefeadd,
    particle: 0xc19a2e,
    rimLight: 0xffffff,
    ambient: 0.85,
  },
  pastel: {
    sceneBg: 0xf6ece2,
    fogColor: 0xf6ece2,
    body: 0xdec4a8,
    bodyEmissive: 0xe9d3bb,
    accent: 0xc1764a,
    windowDark: 0xc4ae95,
    ground: 0xf0e0d1,
    particle: 0xd99a55,
    rimLight: 0xffe9d6,
    ambient: 0.8,
  },
}

const FLOORS = 9
const FLOOR_H = 1.05
const LOOP = 17 // ثانیه — شکل‌گیری، نگاه داشتن، محو شدن

export function Hero3D() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    } catch {
      queueMicrotask(() => setFailed(true))
      return
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isMobile = window.innerWidth < 768

    let themeName = 'navy'
    try {
      themeName = localStorage.getItem('nikabana-theme') || localStorage.getItem('mojarrad-theme') || 'navy'
    } catch {}
    if (!THEME_CONFIGS[themeName]) themeName = 'navy'
    let cfg = THEME_CONFIGS[themeName]

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 120)
    camera.position.set(0, 5.4, 14)
    camera.lookAt(0, 4.6, 0)

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 1.75))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setClearColor(cfg.sceneBg, 1)
    container.appendChild(renderer.domElement)
    renderer.domElement.style.pointerEvents = 'none'

    scene.fog = new THREE.FogExp2(cfg.fogColor, 0.03)

    // ===== نورپردازی =====
    const ambient = new THREE.AmbientLight(0xffffff, cfg.ambient)
    scene.add(ambient)
    const rim = new THREE.DirectionalLight(cfg.rimLight, 1.15)
    rim.position.set(-6, 10, 4)
    scene.add(rim)
    const glow = new THREE.PointLight(cfg.accent, 70, 35)
    glow.position.set(4, 7, 7)
    scene.add(glow)
    const back = new THREE.DirectionalLight(0xffffff, 0.3)
    back.position.set(6, 8, -6)
    scene.add(back)

    const tower = new THREE.Group()
    tower.position.x = isMobile ? 1.4 : 2.1

    // ===== ساختمان: طبقه‌ها =====
    const widths = [2.6, 2.6, 2.45, 2.45, 2.3, 2.3, 2.15, 2.15, 2.0]
    const floorMeshes: THREE.Mesh[] = []
    const floorEdges: THREE.LineSegments[] = []
    const floorBlueprints: THREE.LineSegments[] = []
    const windowStrips: THREE.Mesh[] = []
    const edgeMats: THREE.LineBasicMaterial[] = []
    const bpMats: THREE.LineBasicMaterial[] = []
    const winMats: THREE.MeshBasicMaterial[] = []
    const bodyMats: THREE.MeshStandardMaterial[] = []

    for (let i = 0; i < FLOORS; i++) {
      const w = widths[i]
      const y = 1.1 + i * FLOOR_H
      const geo = new THREE.BoxGeometry(w, FLOOR_H * 0.82, w * 0.85)

      const mat = new THREE.MeshStandardMaterial({
        color: cfg.body,
        metalness: 0.7,
        roughness: 0.3,
        emissive: new THREE.Color(cfg.bodyEmissive),
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.y = y
      tower.add(mesh)
      floorMeshes.push(mesh)
      bodyMats.push(mat)

      // خط‌های لبه — وقتی طبقه فرم می‌شود می‌درخشند
      const emat = new THREE.LineBasicMaterial({
        color: new THREE.Color(cfg.accent),
        transparent: true,
        opacity: 0,
      })
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), emat)
      edges.position.y = y
      tower.add(edges)
      floorEdges.push(edges)
      edgeMats.push(emat)

      // شبح خطی (بلوپرینت) — قبل از ظهور جسم، مسیر را نشان می‌دهد
      const bmat = new THREE.LineBasicMaterial({
        color: new THREE.Color(cfg.accent),
        transparent: true,
        opacity: 0,
      })
      const bp = new THREE.LineSegments(new THREE.EdgesGeometry(geo), bmat)
      bp.position.y = y + FLOOR_H
      bp.scale.setScalar(1.04)
      tower.add(bp)
      floorBlueprints.push(bp)
      bpMats.push(bmat)

      // نوار پنجره‌ها — بعد از نشستن طبقه روشن می‌شوند
      const wmat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(cfg.accent),
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      })
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.78, FLOOR_H * 0.38), wmat)
      strip.position.set(0, y, w * 0.85 / 2 + 0.012)
      tower.add(strip)
      windowStrips.push(strip)
      winMats.push(wmat)
    }

    // ===== پودیوم پایه =====
    const podiumGeo = new THREE.BoxGeometry(3.1, 0.7, 2.7)
    const podiumMat = new THREE.MeshStandardMaterial({
      color: cfg.body,
      metalness: 0.55,
      roughness: 0.4,
      emissive: new THREE.Color(cfg.bodyEmissive),
      emissiveIntensity: 0.25,
    })
    const podium = new THREE.Mesh(podiumGeo, podiumMat)
    podium.position.y = 0.35
    tower.add(podium)
    const podiumEdge = new THREE.LineSegments(
      new THREE.EdgesGeometry(podiumGeo),
      new THREE.LineBasicMaterial({ color: new THREE.Color(cfg.accent), transparent: true, opacity: 0.35 })
    )
    podiumEdge.position.y = 0.35
    tower.add(podiumEdge)

    // ===== تاج =====
    const crownGeo = new THREE.CylinderGeometry(0.1, 0.42, 1.5, 4, 1)
    const crownMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(cfg.accent),
      metalness: 0.9,
      roughness: 0.2,
      emissive: new THREE.Color(cfg.accent),
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0,
    })
    const crown = new THREE.Mesh(crownGeo, crownMat)
    crown.position.y = 1.1 + FLOORS * FLOOR_H + 0.5
    crown.rotation.y = Math.PI / 4
    tower.add(crown)

    scene.add(tower)

    // ===== ساختمان‌های پس‌زمینه =====
    const bgGroup = new THREE.Group()
    const bgMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(cfg.body),
      metalness: 0.4,
      roughness: 0.7,
      transparent: true,
      opacity: 0.5,
    })
    for (let i = 0; i < 7; i++) {
      const h = 2.5 + Math.random() * 7
      const w = 1.1 + Math.random() * 1.5
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), bgMat)
      b.position.set(-9 + Math.random() * 6, h / 2, -4 - Math.random() * 7)
      bgGroup.add(b)
    }
    bgGroup.position.x = -3
    scene.add(bgGroup)

    // ===== زمین =====
    const groundMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(cfg.ground),
      metalness: 0.5,
      roughness: 0.35,
    })
    const ground = new THREE.Mesh(new THREE.CircleGeometry(30, 48), groundMat)
    ground.rotation.x = -Math.PI / 2
    scene.add(ground)

    const grid = new THREE.GridHelper(40, 40, cfg.accent, cfg.fogColor)
    const gridMat = grid.material as THREE.Material
    gridMat.transparent = true
    gridMat.opacity = 0.1
    scene.add(grid)

    // ===== ذرات =====
    const particleCount = isMobile ? 200 : 420
    const pGeo = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 24
      positions[i * 3 + 1] = Math.random() * 15
      positions[i * 3 + 2] = (Math.random() - 0.5) * 24
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const pMat = new THREE.PointsMaterial({
      color: new THREE.Color(cfg.particle),
      size: isMobile ? 0.055 : 0.04,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const particles = new THREE.Points(pGeo, pMat)
    scene.add(particles)

    // ===== انیمیشن شکل‌گیری =====
    const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3)
    const clamp01 = (x: number) => Math.max(0, Math.min(1, x))

    const assembleStart = 0.4
    const stagger = 0.55
    const floorDur = 1.1
    const assembleEnd = assembleStart + (FLOORS - 1) * stagger + floorDur + 0.9 // با تاج
    const holdEnd = assembleEnd + 4.5
    const fadeDur = 2.4
    const total = holdEnd + fadeDur

    const towerFloorY = floorMeshes.map((m) => m.position.y)

    let raf = 0
    let running = true
    let visible = true
    const pointer = { x: 0, y: 0 }
    const onPointer = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth - 0.5) * 2
      pointer.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('pointermove', onPointer, { passive: true })

    const clock = new THREE.Clock()
    const tick = () => {
      if (!running) return
      raf = requestAnimationFrame(tick)
      if (!visible) return
      const t = prefersReducedMotion ? holdEnd * 0.6 : clock.getElapsedTime() % total

      // فاز محو شدن پایان چرخه
      let fade = 1
      if (t > holdEnd) fade = clamp01(1 - (t - holdEnd) / fadeDur)
      const fadeIn = clamp01(t / 0.8)

      // چرخش آرام بعد از شکل‌گیری
      const rot = prefersReducedMotion ? 0.4 : Math.min(t * 0.22, (holdEnd - assembleEnd) * 0.22 + 0.55)
      tower.rotation.y = 0.4 + rot
      crown.rotation.y = -rot * 2

      // پودیوم
      podiumMat.opacity = fade * fadeIn
      ;(podiumEdge.material as THREE.LineBasicMaterial).opacity = 0.35 * fade * fadeIn

      for (let i = 0; i < FLOORS; i++) {
        const start = assembleStart + i * stagger
        const p = clamp01((t - start) / floorDur)
        const e = easeOutCubic(p)

        // بلوپرینت: کمی قبل از طبقه ظاهر می‌شود و از بالا به جای طبقه می‌نشیند
        const bpP = clamp01((t - (start - 0.35)) / 0.6)
        const bpY = towerFloorY[i] + FLOOR_H * (1 - bpP)
        floorBlueprints[i].position.y = Math.max(towerFloorY[i], bpY)
        bpMats[i].opacity = Math.max(0, bpP * (1 - p) * 1.1) * fade

        // طبقه: از پایین کوچک بالا می‌آید
        floorMeshes[i].scale.y = Math.max(0.001, e)
        floorMeshes[i].position.y = towerFloorY[i] - (1 - e) * 1.6
        bodyMats[i].opacity = e * fade * fadeIn

        // لبه‌ها هنگام ظهور می‌درخشند و آرام می‌گیرند
        const edgeGlow = e < 1 ? 0.9 : 0.38 + Math.sin(t * 2 + i) * 0.04
        edgeMats[i].opacity = edgeGlow * e * fade * fadeIn

        // پنجره‌ها بعد از نشستن طبقه روشن می‌شوند
        const winP = clamp01((t - start - 0.85) / 1.3)
        winMats[i].opacity = winP * (0.55 + Math.sin(t * 2.4 + i * 1.7) * 0.2) * fade * fadeIn
        windowStrips[i].scale.setX(clamp01(winP * 1.15))
      }

      // تاج: در پایان می‌درخشد
      const crownP = clamp01((t - (assembleEnd - 1.1)) / 0.9)
      crown.scale.setScalar(Math.max(0.001, easeOutCubic(crownP)))
      crownMat.opacity = crownP * fade * fadeIn
      crownMat.emissiveIntensity = 0.4 + Math.sin(t * 3) * 0.25 * crownP

      // نور نقطه‌ای هم‌گام با شکل‌گیری
      const builtRatio = clamp01((t - assembleStart) / (assembleEnd - assembleStart))
      glow.position.y = 1 + builtRatio * 10
      glow.intensity = 40 + builtRatio * 45 * fade

      camera.position.x += (pointer.x * 1.1 - camera.position.x) * 0.04
      camera.position.y += (5.4 - pointer.y * 0.6 - camera.position.y) * 0.04
      camera.lookAt(0, 4.6, 0)

      const pos = particles.geometry.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < particleCount; i++) {
        let y = pos.getY(i) + 0.011
        if (y > 15) y = 0
        pos.setY(i, y)
      }
      pos.needsUpdate = true

      bgGroup.rotation.y = Math.sin(t * 0.05) * 0.04

      renderer.render(scene, camera)
    }
    tick()

    // ===== تغییر تم =====
    const onThemeChange = (e: Event) => {
      const name = (e as CustomEvent).detail as string
      cfg = THEME_CONFIGS[name] || THEME_CONFIGS.navy
      renderer.setClearColor(cfg.sceneBg, 1)
      scene.fog = new THREE.FogExp2(cfg.fogColor, 0.03)
      bodyMats.forEach((m) => {
        m.color.setHex(cfg.body)
        m.emissive.setHex(cfg.bodyEmissive)
      })
      edgeMats.forEach((m) => m.color.setHex(cfg.accent))
      bpMats.forEach((m) => m.color.setHex(cfg.accent))
      winMats.forEach((m) => m.color.setHex(cfg.accent))
      groundMat.color.setHex(cfg.ground)
      pMat.color.setHex(cfg.particle)
      glow.color.setHex(cfg.accent)
      rim.color.setHex(cfg.rimLight)
      ambient.intensity = cfg.ambient
      bgMat.color.setHex(cfg.body)
      podiumMat.color.setHex(cfg.body)
      podiumMat.emissive.setHex(cfg.bodyEmissive)
      ;(podiumEdge.material as THREE.LineBasicMaterial).color.setHex(cfg.accent)
      crownMat.color.setHex(cfg.accent)
      crownMat.emissive.setHex(cfg.accent)
      gridMat.opacity = 0.1
    }
    window.addEventListener('nikabana-theme-change', onThemeChange)

    // ===== اندازه و دید =====
    const resize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)

    const io = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true
    })
    io.observe(container)

    const onVisibility = () => {
      running = !document.hidden
      if (running) {
        clock.start()
        tick()
      } else {
        cancelAnimationFrame(raf)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('nikabana-theme-change', onThemeChange)
      document.removeEventListener('visibilitychange', onVisibility)
      ro.disconnect()
      io.disconnect()
      renderer.dispose()
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        mesh.geometry?.dispose?.()
        const mat = mesh.material as THREE.Material | THREE.Material[]
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
        else mat?.dispose?.()
      })
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  if (failed) {
    return (
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ background: 'radial-gradient(700px 500px at 65% 30%, color-mix(in srgb, var(--gold) 22%, transparent), transparent 70%)' }}
        aria-hidden
      />
    )
  }

  return <div ref={containerRef} className="absolute inset-0" aria-hidden />
}
