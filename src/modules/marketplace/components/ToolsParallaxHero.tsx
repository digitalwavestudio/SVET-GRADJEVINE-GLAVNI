import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { Link } from 'react-router-dom'
import { Search, Wrench, HardHat, Building2, ArrowDown } from 'lucide-react'

const categories = [
  { id: 'elektricni-alat', name: 'Električni alat', icon: '⚡' },
  { id: 'rucni-alat', name: 'Ručni alat', icon: '🔧' },
  { id: 'oprema-skele-oplate', name: 'Skele i oplate', icon: '🏗️' },
  { id: 'htz-oprema', name: 'HTZ oprema', icon: '🛡️' },
  { id: 'rezervni-delovi', name: 'Rezervni delovi', icon: '⚙️' },
  { id: 'ostalo', name: 'Ostalo', icon: '📦' },
]

export function ToolsParallaxHero() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '40%'])
  const backgroundScale = useTransform(scrollYProgress, [0, 1], [1, 1.15])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0])
  const contentY = useTransform(scrollYProgress, [0, 0.4], ['0%', '-20%'])
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.6], [0.6, 0.8])
  const scrollArrowOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0])

  return (
    <section ref={sectionRef} className="relative min-h-[620px] md:min-h-screen flex flex-col items-center justify-center overflow-hidden bg-surface">
      {/* Parallax pozadina */}
      <motion.div
        style={{ y: backgroundY, scale: backgroundScale }}
        className="absolute inset-0 z-0"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-surface via-surface/95 to-surface/90" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 50%, rgba(254,191,13,0.12) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(0,97,165,0.1) 0%, transparent 50%),
              radial-gradient(circle at 50% 80%, rgba(231,118,0,0.08) 0%, transparent 50%)
            `,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(254,191,13,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(254,191,13,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Industrial ornament - decorative circles */}
        <div className="absolute top-20 right-[10%] w-72 h-72 rounded-full border border-secondary/5" />
        <div className="absolute top-40 right-[15%] w-48 h-48 rounded-full border border-secondary/8" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full border border-primary/5" />
      </motion.div>

      {/* Overlay koji tamni na skrol */}
      <motion.div
        style={{ opacity: overlayOpacity }}
        className="absolute inset-0 z-[1] bg-gradient-to-b from-transparent via-surface/20 to-surface"
      />

      {/* Glavni sadržaj */}
      <motion.div
        style={{ opacity: contentOpacity, y: contentY }}
        className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col items-center text-center pt-32 md:pt-40 pb-16"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-bold tracking-[0.2em] uppercase">
            <HardHat className="w-4 h-4" />
            Alat i oprema
          </div>
        </motion.div>

        {/* Naslov */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="font-headline text-5xl md:text-7xl lg:text-8xl font-[1000] text-white leading-[0.85] tracking-[-0.05em] uppercase max-w-5xl"
        >
          Alati za
          <br />
          <span className="text-secondary">tvoj posao</span>
        </motion.h1>

        {/* Podnaslov */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 text-lg md:text-xl text-slate-300 max-w-2xl font-medium"
        >
          Iznajmi ili iznajmi građevinski alat i opremu. Od ručnog alata do teških mašina — sve na jednom mestu.
        </motion.p>

        {/* Glassmorphism Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 w-full max-w-2xl"
        >
          <Link
            to="/alat-i-oprema"
            className="group flex items-center gap-4 w-full px-6 py-4 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:border-secondary/30 hover:bg-white/[0.06] transition-all duration-500"
          >
            <Search className="w-6 h-6 text-slate-400 group-hover:text-secondary transition-colors duration-300 shrink-0" />
            <span className="flex-1 text-left text-slate-400 group-hover:text-slate-200 transition-colors duration-300">
              Pretraži alat i opremu...
            </span>
            <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 text-xs text-slate-500 border border-white/5">
              <span className="text-[10px]">⌘</span>K
            </kbd>
          </Link>
        </motion.div>

        {/* Kategorije — horizontalni red */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-wrap justify-center gap-3"
        >
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/alat-i-oprema/${cat.id}`}
              className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] hover:border-secondary/20 hover:bg-secondary/5 transition-all duration-300"
            >
              <span className="text-base">{cat.icon}</span>
              <span className="text-sm text-slate-300 group-hover:text-secondary transition-colors duration-300">
                {cat.name}
              </span>
            </Link>
          ))}
        </motion.div>

        {/* Scroll indikator */}
        <motion.div
          style={{ opacity: scrollArrowOpacity }}
          className="mt-16 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-slate-500">
            Skroluj
          </span>
          <ArrowDown className="w-4 h-4 text-slate-500 animate-bounce" />
        </motion.div>
      </motion.div>
    </section>
  )
}
