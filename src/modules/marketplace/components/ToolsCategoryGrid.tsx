import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import {
  Zap,
  Wrench,
  Building2,
  Shield,
  Settings,
  Package,
  Drill,
  HardHat,
} from 'lucide-react'

interface CategoryItem {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  itemCount?: string
  span?: 'sm' | 'md' | 'lg'
}

const categories: CategoryItem[] = [
  {
    id: 'elektricni-alat',
    name: 'Električni alat',
    description: 'Bušilice, brusilice, testere, glodalice i još mnogo toga',
    icon: <Zap className="w-8 h-8" />,
    color: 'from-secondary/20 to-secondary/5',
    itemCount: '240+',
    span: 'md',
  },
  {
    id: 'rucni-alat',
    name: 'Ručni alat',
    description: 'Čekići, šrafcigeri, ključevi, merdevine, kolica',
    icon: <Wrench className="w-8 h-8" />,
    color: 'from-primary/20 to-primary/5',
    itemCount: '180+',
    span: 'sm',
  },
  {
    id: 'oprema-skele-oplate',
    name: 'Skele i oplate',
    description: 'Građevinske skele, oplate, platforme, penjalice',
    icon: <Building2 className="w-8 h-8" />,
    color: 'from-tertiary/20 to-tertiary/5',
    itemCount: '90+',
    span: 'sm',
  },
  {
    id: 'htz-oprema',
    name: 'HTZ oprema',
    description: 'Kacige, prsluci, rukavice, zaštitna oprema',
    icon: <Shield className="w-8 h-8" />,
    color: 'from-green-500/20 to-green-500/5',
    itemCount: '160+',
    span: 'sm',
  },
  {
    id: 'rezervni-delovi',
    name: 'Rezervni delovi',
    description: 'Motori, pumpe, filteri, ležajevi, hidraulika',
    icon: <Settings className="w-8 h-8" />,
    color: 'from-violet-500/20 to-violet-500/5',
    itemCount: '310+',
    span: 'sm',
  },
  {
    id: 'ostalo',
    name: 'Ostalo',
    description: 'Sve što ne spada u ostale kategorije',
    icon: <Package className="w-8 h-8" />,
    color: 'from-slate-500/20 to-slate-500/5',
    itemCount: '520+',
    span: 'sm',
  },
  {
    id: 'masine',
    name: 'Građevinske mašine',
    description: 'Bageri, viljuškari, dizalice, rovokopači',
    icon: <Drill className="w-8 h-8" />,
    color: 'from-secondary/20 to-secondary/5',
    itemCount: '75+',
    span: 'md',
  },
  {
    id: 'all',
    name: 'Svi oglasi',
    description: 'Pregledaj kompletnu ponudu alata i opreme',
    icon: <HardHat className="w-8 h-8" />,
    color: 'from-white/10 to-white/5',
    itemCount: '1,500+',
    span: 'lg',
  },
]

const staggerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      delay: i * 0.08,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
}

export function ToolsCategoryGrid() {
  return (
    <section className="relative py-20 md:py-32 bg-surface-container-lowest">
      {/* Pozadina blueprint efekat */}
      <div className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(254,191,13,0.3) 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        {/* Naslov */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-secondary">
            Kategorije
          </span>
          <h2 className="mt-4 font-headline text-4xl md:text-5xl font-[900] text-white leading-tight">
            Šta ti
            {' '}
            <span className="text-secondary">treba</span>
            ?
          </h2>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat, idx) => {
            const spanClass =
              cat.span === 'lg'
                ? 'md:col-span-2 md:row-span-2'
                : cat.span === 'md'
                  ? 'md:col-span-2'
                  : ''

            return (
              <motion.div
                key={cat.id}
                custom={idx}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                variants={staggerVariants}
              >
                <Link
                  to={cat.id === 'all' ? '/alat-i-oprema' : `/alat-i-oprema/${cat.id}`}
                  className={`group relative block p-6 md:p-8 h-full rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-secondary/20 overflow-hidden transition-all duration-500 ${spanClass}`}
                >
                  {/* Hover glow efekat */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${cat.color}`} />

                  {/* Ikona */}
                  <div className="relative z-10 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-secondary group-hover:bg-white/10 group-hover:border-secondary/30 group-hover:scale-110 transition-all duration-500">
                      {cat.icon}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    <h3 className="font-headline text-lg md:text-xl font-bold text-white group-hover:text-secondary transition-colors duration-300">
                      {cat.name}
                    </h3>
                    <p className="mt-2 text-sm text-slate-400 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>

                    {/* Item count */}
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-xs font-bold text-secondary/60 bg-secondary/10 px-2 py-1 rounded-md">
                        {cat.itemCount} oglasa
                      </span>
                    </div>
                  </div>

                  {/* Strelica */}
                  <div className="absolute bottom-6 right-6 z-10 opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all duration-500">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center">
                      <svg className="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
