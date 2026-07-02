import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { Link } from 'react-router-dom'
import { Star, MapPin, Euro, ArrowRight } from 'lucide-react'

interface FeaturedItem {
  id: string
  title: string
  category: string
  categorySlug: string
  location: string
  price: string
  rating: number
  image: string
  isPremium: boolean
}

const FEATURED_ITEMS: FeaturedItem[] = [
  { id: '1', title: 'Bager guseničar CAT 320', category: 'Građevinske mašine', categorySlug: 'masine', location: 'Novi Sad', price: '85€/dan', rating: 4.8, image: '', isPremium: true },
  { id: '2', title: 'Mikser za beton 300L', category: 'Električni alat', categorySlug: 'elektricni-alat', location: 'Beograd', price: '25€/dan', rating: 4.6, image: '', isPremium: false },
  { id: '3', title: 'Viljuškar električni 2.5t', category: 'Građevinske mašine', categorySlug: 'masine', location: 'Niš', price: '65€/dan', rating: 4.9, image: '', isPremium: true },
  { id: '4', title: 'Čekić bušilica Hilti TE70', category: 'Električni alat', categorySlug: 'elektricni-alat', location: 'Kragujevac', price: '18€/dan', rating: 4.7, image: '', isPremium: false },
  { id: '5', title: 'Skele čelične 5x2m', category: 'Skele i oplate', categorySlug: 'oprema-skele-oplate', location: 'Subotica', price: '12€/dan', rating: 4.5, image: '', isPremium: false },
  { id: '6', title: 'Kompresor vazduha 200L', category: 'Električni alat', categorySlug: 'elektricni-alat', location: 'Beograd', price: '35€/dan', rating: 4.8, image: '', isPremium: true },
]

function FeaturedCard({ item, index }: { item: FeaturedItem; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ['start end', 'end start'],
  })

  const imageScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1.05, 0.95])
  const imageY = useTransform(scrollYProgress, [0, 0.5, 1], ['5%', '-5%', '5%'])
  const glowOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0.6, 0])

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="min-w-[320px] md:min-w-[380px] max-w-[380px] shrink-0"
    >
      <Link
        to={`/alat-i-oprema/${item.categorySlug}/oglas/${item.id}`}
        className="group block relative"
        ref={cardRef}
      >
        <div className="relative rounded-2xl overflow-hidden bg-surface-container border border-white/[0.06] hover:border-secondary/20 transition-all duration-500">
          {/* Image placeholder */}
          <div className="relative h-48 overflow-hidden bg-gradient-to-br from-surface-container-high to-surface-container">
            <motion.div
              style={{ scale: imageScale, y: imageY }}
              className="absolute inset-0"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-primary/5" />
              <div
                className="absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage: `
                    linear-gradient(45deg, rgba(254,191,13,0.05) 25%, transparent 25%),
                    linear-gradient(-45deg, rgba(254,191,13,0.05) 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, rgba(254,191,13,0.05) 75%),
                    linear-gradient(-45deg, transparent 75%, rgba(254,191,13,0.05) 75%)
                  `,
                  backgroundSize: '20px 20px',
                }}
              />
            </motion.div>

            {/* Premium badge */}
            {item.isPremium && (
              <div className="absolute top-3 left-3 z-10 px-2 py-1 rounded-md bg-secondary/90 text-surface text-[10px] font-bold tracking-[0.1em] uppercase shadow-lg">
                Premium
              </div>
            )}

            {/* Category tag */}
            <div className="absolute top-3 right-3 z-10 px-2 py-1 rounded-md bg-surface/80 backdrop-blur-sm text-[10px] text-slate-300 font-medium border border-white/10">
              {item.category}
            </div>

            {/* Hover glow */}
            <motion.div
              style={{ opacity: glowOpacity }}
              className="absolute inset-0 bg-gradient-to-t from-secondary/10 to-transparent z-[2]"
            />
          </div>

          {/* Content */}
          <div className="p-5">
            <h3 className="font-headline font-bold text-white text-base group-hover:text-secondary transition-colors duration-300 line-clamp-2 min-h-[3rem]">
              {item.title}
            </h3>

            <div className="mt-3 flex items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {item.location}
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-secondary/30 text-secondary/30" />
                {item.rating}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="flex items-center gap-1 text-lg font-headline font-bold text-secondary">
                <Euro className="w-4 h-4" />
                {item.price}
              </span>

              <div className="flex items-center gap-1 text-xs text-slate-500 group-hover:text-secondary transition-colors duration-300">
                Detalji
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export function ToolsFeaturedList() {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Pozadina */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(254,191,13,0.2) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        {/* Naslov */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-end justify-between mb-12"
        >
          <div>
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-secondary">
              Istaknuto
            </span>
            <h2 className="mt-3 font-headline text-4xl md:text-5xl font-[900] text-white leading-tight">
              Popularni
              {' '}
              <span className="text-secondary">oglasi</span>
            </h2>
          </div>

          <Link
            to="/alat-i-oprema"
            className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-secondary/30 hover:bg-secondary/5 text-sm text-slate-300 hover:text-secondary transition-all duration-300"
          >
            Svi oglasi
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Horizontal scroll lista */}
        <div
          className="flex gap-6 pb-4 overflow-x-auto snap-x snap-mandatory scrollbar-none"
          style={{
            maskImage: 'linear-gradient(to right, transparent 0%, black 3%, black 97%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 3%, black 97%, transparent 100%)',
          }}
        >
          {FEATURED_ITEMS.map((item, idx) => (
            <FeaturedCard key={item.id} item={item} index={idx} />
          ))}
        </div>

        {/* Mobile CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 text-center md:hidden"
        >
          <Link
            to="/alat-i-oprema"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary text-sm font-bold hover:bg-secondary/20 transition-all duration-300"
          >
            Svi oglasi
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
