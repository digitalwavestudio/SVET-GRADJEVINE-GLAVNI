import { useRef, useMemo } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { Link } from 'react-router-dom'
import { Search, ArrowDown, Zap, Wrench, Building2, Shield, Settings, Package, HardHat } from 'lucide-react'
import { OptimizedImage } from '@/src/components/OptimizedImage'

const categories = [
  { id: 'elektricni-alat', name: 'Električni alat', icon: Zap },
  { id: 'rucni-alat', name: 'Ručni alat', icon: Wrench },
  { id: 'oprema-skele-oplate', name: 'Skele i oplate', icon: Building2 },
  { id: 'htz-oprema', name: 'HTZ oprema', icon: Shield },
  { id: 'rezervni-delovi', name: 'Rezervni delovi', icon: Settings },
  { id: 'ostalo', name: 'Ostalo', icon: Package },
]

const HERO_IMAGE = 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1920&q=80'

function Particle({ index }: { index: number }) {
  const size = useMemo(() => Math.random() * 6 + 2, [])
  const x = useMemo(() => Math.random() * 100, [])
  const duration = useMemo(() => Math.random() * 8 + 6, [])
  const delay = useMemo(() => Math.random() * 5, [])
  const isGold = useMemo(() => Math.random() > 0.5, [])

  return (
    <motion.div
      className={`absolute rounded-full ${isGold ? 'bg-secondary/30' : 'bg-white/10'}`}
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        bottom: '-10px',
      }}
      animate={{
        y: [0, -(Math.random() * 400 + 200)],
        x: [0, (Math.random() - 0.5) * 100],
        opacity: [0, 0.8, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  )
}

export function ToolsParallaxHero() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '45%'])
  const backgroundScale = useTransform(scrollYProgress, [0, 1], [1, 1.2])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])
  const contentY = useTransform(scrollYProgress, [0, 0.3], ['0%', '-30%'])
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.5], [0.55, 0.85])
  const scrollArrowOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0])

  const particles = useMemo(
    () => Array.from({ length: 20 }, (_, i) => <Particle key={i} index={i} />),
    [],
  )

  return (
    <section ref={sectionRef} className="relative min-h-[700px] md:min-h-screen flex flex-col items-center justify-center overflow-hidden bg-surface">
      {/* Parallax pozadina sa REALNOM SLIKOM gradilišta */}
      <motion.div
        style={{ y: backgroundY, scale: backgroundScale }}
        className="absolute inset-0 z-0 will-change-transform"
      >
        <OptimizedImage
          src={HERO_IMAGE}
          alt="Građevinski radovi"
          className="w-full h-full object-cover"
          containerClassName="w-full h-full"
          fallbackType="machine"
        />
        {/* Tamni overlay sa gradijentom */}
        <div className="absolute inset-0 bg-gradient-to-r from-surface/95 via-surface/80 to-surface/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-surface/30" />
      </motion.div>

      {/* Floating čestice */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        {particles}
      </div>

      {/* Industrial grid linije preko slike */}
      <div
        className="absolute inset-0 z-[1] opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(254,191,13,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(254,191,13,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Overlay koji tamni na skrol */}
      <motion.div
        style={{ opacity: overlayOpacity }}
        className="absolute inset-0 z-[2] bg-gradient-to-b from-transparent via-transparent to-surface pointer-events-none"
      />

      {/* Glavni sadržaj */}
      <motion.div
        style={{ opacity: contentOpacity, y: contentY }}
        className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col items-center text-center pt-36 md:pt-48 pb-20"
      >
        {/* Badge sa animacijom enter-a */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-secondary/15 border border-secondary/30 text-secondary text-xs font-black tracking-[0.25em] uppercase shadow-[0_0_30px_rgba(254,191,13,0.15)]">
            <HardHat className="w-4 h-4" />
            Alat i oprema
          </div>
        </motion.div>

        {/* Naslov sa clip reveal efektom */}
        <div className="overflow-hidden">
          <motion.h1
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="font-headline text-6xl md:text-8xl lg:text-9xl font-[1000] text-white leading-[0.85] tracking-[-0.06em] uppercase max-w-6xl"
          >
            Alati za
            <br />
            <span className="text-secondary drop-shadow-[0_0_40px_rgba(254,191,13,0.3)]">
              tvoj posao
            </span>
          </motion.h1>
        </div>

        {/* Podnaslov */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 text-lg md:text-xl text-slate-300 max-w-2xl font-medium leading-relaxed"
        >
          Iznajmi ili izdaj građevinski alat i opremu. Od ručnog alata do teških mašina — sve na jednom mestu.
        </motion.p>

        {/* Glassmorphism Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 w-full max-w-2xl"
        >
          <Link
            to="/alat-i-oprema"
            className="group relative flex items-center gap-4 w-full px-7 py-5 rounded-2xl bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] hover:border-secondary/30 transition-all duration-500 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)]"
          >
            <Search className="w-6 h-6 text-slate-400 group-hover:text-secondary transition-colors duration-300 shrink-0" />
            <span className="flex-1 text-left text-lg text-slate-400 group-hover:text-slate-200 transition-colors duration-300">
              Pretraži alat i opremu...
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-xs text-slate-500 border border-white/5">
              <kbd className="font-mono font-bold">⌘</kbd>
              <kbd className="font-mono font-bold">K</kbd>
            </span>
          </Link>
        </motion.div>

        {/* Kategorije — horizontalni red sa staggerom */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08, delayChildren: 0.65 } },
          }}
          className="mt-12 flex flex-wrap justify-center gap-3"
        >
          {categories.map((cat) => {
            const Icon = cat.icon
            return (
              <motion.div
                key={cat.id}
                variants={{
                  hidden: { opacity: 0, y: 20, scale: 0.9 },
                  visible: { opacity: 1, y: 0, scale: 1 },
                }}
              >
                <Link
                  to={`/alat-i-oprema/${cat.id}`}
                  className="group relative inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] hover:border-secondary/30 hover:bg-secondary/10 transition-all duration-300"
                >
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-secondary transition-colors duration-300" />
                  <span className="text-sm text-slate-300 group-hover:text-secondary font-medium transition-colors duration-300">
                    {cat.name}
                  </span>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Scroll indikator */}
        <motion.div
          style={{ opacity: scrollArrowOpacity }}
          className="mt-20 flex flex-col items-center gap-3"
        >
          <span className="text-[9px] font-bold tracking-[0.35em] uppercase text-slate-500">
            Skroluj
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ArrowDown className="w-4 h-4 text-slate-500" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}
