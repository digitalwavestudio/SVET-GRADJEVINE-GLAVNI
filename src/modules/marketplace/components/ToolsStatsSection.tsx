import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Wrench, Tag, Star, Clock } from 'lucide-react'

interface StatItemProps {
  icon: React.ReactNode
  target: number
  suffix?: string
  label: string
  delay: number
}

function AnimatedCounter({ icon, target, suffix, label, delay }: StatItemProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          const duration = 2000
          const steps = 60
          const increment = target / steps
          let current = 0
          const timer = setInterval(() => {
            current += increment
            if (current >= target) {
              setCount(target)
              clearInterval(timer)
            } else {
              setCount(Math.floor(current))
            }
          }, duration / steps)
        }
      },
      { threshold: 0.3 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [target, hasAnimated])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col items-center text-center p-8"
    >
      {/* Ikona */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-secondary/10 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 scale-150" />
        <div className="relative w-16 h-16 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-secondary group-hover:bg-secondary/10 group-hover:border-secondary/30 transition-all duration-500">
          {icon}
        </div>
      </div>

      {/* Broj */}
      <div className="relative">
        <span className="text-5xl md:text-6xl font-headline font-[900] text-white tracking-tighter">
          {count}
          {suffix}
        </span>
        {/* Dekorativna linija */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 group-hover:w-12 h-[2px] bg-secondary/50 transition-all duration-700" />
      </div>

      {/* Labela */}
      <p className="mt-6 text-sm text-slate-400 font-medium uppercase tracking-[0.15em]">
        {label}
      </p>
    </motion.div>
  )
}

const stats = [
  { icon: <Wrench className="w-7 h-7" />, target: 1500, suffix: '+', label: 'Alata u ponudi' },
  { icon: <Tag className="w-7 h-7" />, target: 320, suffix: '+', label: 'Kategorija opreme' },
  { icon: <Star className="w-7 h-7" />, target: 98, suffix: '%', label: 'Zadovoljnih korisnika' },
  { icon: <Clock className="w-7 h-7" />, target: 24, suffix: '/7', label: 'Podrška' },
]

export function ToolsStatsSection() {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Pozadina */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 30% 50%, rgba(254,191,13,1) 0%, transparent 60%),
            radial-gradient(circle at 70% 50%, rgba(0,97,165,1) 0%, transparent 60%)
          `,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        {/* Naslov sekcije */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-secondary">
            Brojke koje govore
          </span>
          <h2 className="mt-4 font-headline text-4xl md:text-5xl font-[900] text-white leading-tight">
            Naša
            {' '}
            <span className="text-secondary">zajednica</span>
            {' '}
            raste
          </h2>
        </motion.div>

        {/* Grid brojača */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <AnimatedCounter key={stat.label} {...stat} delay={idx * 0.15} />
          ))}
        </div>
      </div>
    </section>
  )
}
