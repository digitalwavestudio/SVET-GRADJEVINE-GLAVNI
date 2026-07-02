import { useEffect } from 'react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { ArrowRight, Plus, HardHat } from 'lucide-react'
import { ToolsParallaxHero } from '../components/ToolsParallaxHero'
import { ToolsCategoryGrid } from '../components/ToolsCategoryGrid'
import { ToolsStatsSection } from '../components/ToolsStatsSection'
import { ToolsFeaturedList } from '../components/ToolsFeaturedList'
import DynamicSEO from '@/src/components/DynamicSEO'

export default function ToolsHubPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <>
      <DynamicSEO type="alat-i-oprema" />

      {/* Hero */}
      <ToolsParallaxHero />

      {/* Kategorije */}
      <ToolsCategoryGrid />

      {/* Istaknuti oglasi */}
      <ToolsFeaturedList />

      {/* Brojke */}
      <ToolsStatsSection />

      {/* CTA Sekcija */}
      <section className="relative py-24 md:py-40 overflow-hidden bg-surface">
        {/* Pozadina */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: `
                radial-gradient(circle at 30% 50%, rgba(254,191,13,0.3) 0%, transparent 50%),
                radial-gradient(circle at 70% 50%, rgba(0,97,165,0.2) 0%, transparent 50%)
              `,
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(254,191,13,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(254,191,13,0.03) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Ikona */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary/10 border border-secondary/20 mb-8">
              <Plus className="w-8 h-8 text-secondary" />
            </div>

            <h2 className="font-headline text-4xl md:text-6xl font-[900] text-white leading-[0.9] uppercase">
              Imaš alat
              <br />
              <span className="text-secondary">za iznajmljivanje</span>
              ?
            </h2>

            <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Postavi oglas besplatno i poveži se sa hiljadama korisnika koji traže kvalitetan alat i opremu.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/postavi-oglas"
                className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-secondary text-surface font-bold text-base hover:bg-secondary/90 transition-all duration-300 shadow-[0_0_30px_rgba(254,191,13,0.3)] hover:shadow-[0_0_50px_rgba(254,191,13,0.5)]"
              >
                <HardHat className="w-5 h-5" />
                Postavi oglas besplatno
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>

              <Link
                to="/alat-i-oprema"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-slate-300 font-medium hover:border-secondary/30 hover:text-secondary transition-all duration-300"
              >
                Pretraži oglase
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}
