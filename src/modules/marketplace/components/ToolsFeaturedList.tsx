import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { Link } from 'react-router-dom'
import { Star, MapPin, Euro, ArrowRight } from 'lucide-react'
import { OptimizedImage } from '@/src/components/OptimizedImage'

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

// Realne slike alata sa Unsplash-a
const TOOL_IMAGES = [
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80',
  'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=600&q=80',
  'https://images.unsplash.com/photo-1566576912327-10985352f5c4?w=600&q=80',
  'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&q=80',
  'https://images.unsplash.com/photo-1541888946425-d81bb1c7f3a2?w=600&q=80',
  'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600&q=80',
]

const FEATURED_ITEMS: FeaturedItem[] = [
  { id: '1', title: 'Bager guseničar CAT 320', category: 'Građevinske mašine', categorySlug: 'masine', location: 'Novi Sad', price: '85€/dan', rating: 4.8, image: TOOL_IMAGES[0], isPremium: true },
  { id: '2', title: 'Mikser za beton 300L', category: 'Električni alat', categorySlug: 'elektricni-alat', location: 'Beograd', price: '25€/dan', rating: 4.6, image: TOOL_IMAGES[1], isPremium: false },
  { id: '3', title: 'Viljuškar električni 2.5t', category: 'Građevinske mašine', categorySlug: 'masine', location: 'Niš', price: '65€/dan', rating: 4.9, image: TOOL_IMAGES[2], isPremium: true },
  { id: '4', title: 'Čekić bušilica Hilti TE70', category: 'Električni alat', categorySlug: 'elektricni-alat', location: 'Kragujevac', price: '18€/dan', rating: 4.7, image: TOOL_IMAGES[3], isPremium: false },
  { id: '5', title: 'Skele čelične 5×2m', category: 'Skele i oplate', categorySlug: 'oprema-skele-oplate', location: 'Subotica', price: '12€/dan', rating: 4.5, image: TOOL_IMAGES[4], isPremium: false },
  { id: '6', title: 'Kompresor vazduha 200L', category: 'Električni alat', categorySlug: 'elektricni-alat', location: 'Beograd', price: '35€/dan', rating: 4.8, image: TOOL_IMAGES[5], isPremium: true },
]

function FeaturedCard({ item, index }: { item: FeaturedItem; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ['start end', 'end start'],
  })

  const imageScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1.1, 0.9])
  const imageY = useTransform(scrollYProgress, [0, 0.5, 1], ['8%', '-8%', '8%'])

  return (
    <motion.div
      initial={{ opacity: 0, x: 80 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      className="min-w-[340px] md:min-w-[400px] max-w-[400px] shrink-0 snap-start"
    >
      <Link
        to={`/alat-i-oprema/${item.categorySlug}/oglas/${item.id}`}
        className="group block relative"
        ref={cardRef}
      >
        <div className="relative rounded-2xl overflow-hidden bg-surface-container border border-white/[0.06] hover:border-secondary/20 transition-all duration-500 hover:shadow-[0_20px_60px_-10px_rgba(254,191,13,0.15)]">
          {/* Slika sa parallax hover efektom */}
          <div className="relative h-52 overflow-hidden">
            <motion.div
              style={{ scale: imageScale, y: imageY }}
              className="absolute inset-0 will-change-transform"
            >
              <OptimizedImage
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
                containerClassName="w-full h-full"
                fallbackType="machine"
              />
            </motion.div>

            {/* Gradient preko slike */}
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-transparent to-transparent" />

            {/* Premium badge */}
            {item.isPremium && (
              <div className="absolute top-4 left-4 z-10 px-2.5 py-1 rounded-md bg-secondary text-surface text-[10px] font-black tracking-[0.12em] uppercase shadow-lg shadow-secondary/30">
                Premium
              </div>
            )}

            {/* Category tag */}
            <div className="absolute top-4 right-4 z-10 px-2.5 py-1 rounded-md bg-surface/90 backdrop-blur-md text-[10px] text-slate-300 font-medium border border-white/10">
              {item.category}
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-secondary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>

          {/* Content */}
          <div className="p-5 relative">
            <h3 className="font-headline font-bold text-white text-base group-hover:text-secondary transition-colors duration-300 line-clamp-2 min-h-[3rem]">
              {item.title}
            </h3>

            <div className="mt-3 flex items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-secondary/60" />
                {item.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {item.rating}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xl font-headline font-bold text-secondary">
                <Euro className="w-4 h-4" />
                {item.price}
              </span>

              <span className="flex items-center gap-1 text-xs text-slate-500 group-hover:text-secondary transition-colors duration-300 font-medium">
                Detalji
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export function ToolsFeaturedList() {
  return (
    <section className="relative py-24 md:py-40 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(254,191,13,0.2) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-end justify-between mb-14"
        >
          <div>
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-secondary">
              Istaknuto
            </span>
            <h2 className="mt-3 font-headline text-4xl md:text-6xl font-[900] text-white leading-[0.9] uppercase">
              Popularni
              {' '}
              <span className="text-secondary">oglasi</span>
            </h2>
          </div>

          <Link
            to="/alat-i-oprema"
            className="hidden md:inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-secondary/30 hover:bg-secondary/5 text-sm text-slate-300 hover:text-secondary transition-all duration-300 font-medium"
          >
            Svi oglasi
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Horizontal scroll */}
        <div
          className="flex gap-6 pb-6 overflow-x-auto snap-x snap-mandatory scrollbar-none"
          style={{
            maskImage: 'linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)',
          }}
        >
          {FEATURED_ITEMS.map((item, idx) => (
            <FeaturedCard key={item.id} item={item} index={idx} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 text-center md:hidden"
        >
          <Link
            to="/alat-i-oprema"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary text-sm font-bold hover:bg-secondary/20 transition-all duration-300"
          >
            Svi oglasi
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
