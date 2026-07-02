import { useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import {
  Zap, Wrench, Building2, Shield, Settings, Package, Drill, HardHat,
} from 'lucide-react'

interface CategoryItem {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  borderColor: string
  itemCount?: string
}

const categories: CategoryItem[] = [
  {
    id: 'elektricni-alat',
    name: 'Električni alat',
    description: 'Bušilice, brusilice, testere, glodalice i još mnogo toga',
    icon: <Zap className="w-8 h-8" />,
    color: 'from-secondary/20 to-secondary/5',
    borderColor: 'border-secondary/30',
    itemCount: '240+',
  },
  {
    id: 'rucni-alat',
    name: 'Ručni alat',
    description: 'Čekići, šrafcigeri, ključevi, merdevine, kolica',
    icon: <Wrench className="w-8 h-8" />,
    color: 'from-primary/20 to-primary/5',
    borderColor: 'border-primary/30',
    itemCount: '180+',
  },
  {
    id: 'oprema-skele-oplate',
    name: 'Skele i oplate',
    description: 'Građevinske skele, oplate, platforme, penjalice',
    icon: <Building2 className="w-8 h-8" />,
    color: 'from-tertiary/20 to-tertiary/5',
    borderColor: 'border-tertiary/30',
    itemCount: '90+',
  },
  {
    id: 'htz-oprema',
    name: 'HTZ oprema',
    description: 'Kacige, prsluci, rukavice, zaštitna oprema',
    icon: <Shield className="w-8 h-8" />,
    color: 'from-green-500/20 to-green-500/5',
    borderColor: 'border-green-500/30',
    itemCount: '160+',
  },
  {
    id: 'rezervni-delovi',
    name: 'Rezervni delovi',
    description: 'Motori, pumpe, filteri, ležajevi, hidraulika',
    icon: <Settings className="w-8 h-8" />,
    color: 'from-violet-500/20 to-violet-500/5',
    borderColor: 'border-violet-500/30',
    itemCount: '310+',
  },
  {
    id: 'ostalo',
    name: 'Ostalo',
    description: 'Sve što ne spada u ostale kategorije',
    icon: <Package className="w-8 h-8" />,
    color: 'from-slate-500/20 to-slate-500/5',
    borderColor: 'border-slate-500/30',
    itemCount: '520+',
  },
  {
    id: 'masine',
    name: 'Građevinske mašine',
    description: 'Bageri, viljuškari, dizalice, rovokopači',
    icon: <Drill className="w-8 h-8" />,
    color: 'from-amber-500/20 to-amber-500/5',
    borderColor: 'border-amber-500/30',
    itemCount: '75+',
  },
  {
    id: 'all',
    name: 'Svi oglasi',
    description: 'Pregledaj kompletnu ponudu alata i opreme',
    icon: <HardHat className="w-8 h-8" />,
    color: 'from-white/10 to-white/5',
    borderColor: 'border-white/20',
    itemCount: '1,500+',
  },
]

function TiltCard({ cat, index }: { cat: CategoryItem; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [glowPos, setGlowPos] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: x * 12, y: y * -12 })
    setGlowPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 })
  }

  const href = cat.id === 'all' ? '/alat-i-oprema' : `/alat-i-oprema/${cat.id}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        to={href}
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="group relative block p-6 md:p-8 h-full rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 overflow-hidden transition-colors duration-500"
        style={{
          transform: `perspective(800px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
          transition: 'transform 0.1s ease-out',
        }}
      >
        {/* Glow efekat koji prati miš */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(circle 200px at ${glowPos.x}px ${glowPos.y}px, rgba(254,191,13,0.08), transparent)`,
          }}
        />

        {/* Ikona */}
        <div className="relative z-10 mb-5">
          <div className="w-14 h-14 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-secondary group-hover:bg-white/10 group-hover:scale-110 transition-all duration-500">
            {cat.icon}
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <h3 className="font-headline text-lg md:text-xl font-bold text-white group-hover:text-secondary transition-colors duration-300">
            {cat.name}
          </h3>
          <p className="mt-2 text-sm text-slate-400 line-clamp-2 leading-relaxed group-hover:text-slate-300 transition-colors duration-300">
            {cat.description}
          </p>

          <div className="mt-5 flex items-center gap-2">
            <span className="text-xs font-bold text-secondary/70 bg-secondary/10 px-2.5 py-1 rounded-md">
              {cat.itemCount} oglasa
            </span>
          </div>
        </div>

        {/* Strelica */}
        <div className="absolute bottom-6 right-6 z-10 opacity-0 group-hover:opacity-100 translate-x-[-15px] group-hover:translate-x-0 transition-all duration-500 ease-[0.16,1,0.3,1]">
          <div className="w-10 h-10 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center backdrop-blur-sm">
            <svg className="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export function ToolsCategoryGrid() {
  return (
    <section className="relative py-24 md:py-40 bg-surface-container-lowest">
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(254,191,13,0.2) 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-secondary">
            Kategorije
          </span>
          <h2 className="mt-4 font-headline text-4xl md:text-6xl font-[900] text-white leading-[0.9] uppercase">
            Šta ti
            {' '}
            <span className="text-secondary">treba</span>
            ?
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {categories.map((cat, idx) => (
            <div
              key={cat.id}
              className={
                cat.id === 'all'
                  ? 'md:col-span-2 md:row-span-1'
                  : cat.id === 'masine'
                    ? 'md:col-span-2'
                    : ''
              }
            >
              <TiltCard cat={cat} index={idx} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
