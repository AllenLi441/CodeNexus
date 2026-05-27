'use client'

import { useEffect, useRef } from 'react'

type Particle = {
  x: number; y: number
  vx: number; vy: number
  life: number; maxLife: number
  size: number; color: string
}

const COLORS = [
  '#67E8F9', '#38BDF8', '#22D3EE',
  '#00FF41', '#00CC33',
  '#A5F3FC', '#7DD3FC',
]

export function SparkParticles({ intensity = 1 }: { intensity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Particle[]>([])
  const animRef = useRef<number>(0)
  const frame = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const spawn = () => {
      // Spawn from bottom with slight random horizontal spread
      const x = Math.random() * canvas.width
      particles.current.push({
        x,
        y: canvas.height + 5,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -(Math.random() * 2.0 + 0.6) * intensity,
        life: 1,
        maxLife: Math.random() * 200 + 100,
        size: Math.random() * 1.8 + 0.3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      frame.current++

      // Spawn rate based on intensity
      const spawnInterval = Math.round(4 / intensity)
      if (frame.current % spawnInterval === 0) spawn()

      particles.current = particles.current.filter((p) => {
        p.x += p.vx
        p.y += p.vy
        // Gentle drift
        p.vx += (Math.random() - 0.5) * 0.08
        p.vy -= 0.005  // slight acceleration upward
        p.life -= 1 / p.maxLife

        if (p.life <= 0 || p.y < -10) return false

        const alpha = p.life * 0.45
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.fillStyle = p.color
        ctx.shadowBlur = 8
        ctx.shadowColor = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
        return true
      })

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      window.removeEventListener('resize', resize)
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [intensity])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, opacity: 0.55 }}
      aria-hidden
    />
  )
}
