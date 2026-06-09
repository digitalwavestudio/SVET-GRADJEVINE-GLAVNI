import { OptimizedImage } from '@/src/components/OptimizedImage';
import { motion } from 'motion/react';
import { Link, useParams } from 'react-router-dom';
import SeoHead from '@/src/components/SeoHead';
import { generateMenuItemSchema } from '@/src/lib/seoSchema';
import { APP_CONFIG } from '@/src/constants/config';

const MENU_ITEMS = [
  {
    id: 1,
    category: 'lunch',
    name: 'Gulaš sa domaćim testom',
    description: 'Tradicionalni goveđi gulaš sa domaćim širokim rezancima, sezonska salata i hleb.',
    price: 520,
    image: '',
    popular: true,
    nutrition: {
      calories: '940 kcal',
      protein: '52 g',
      carbs: '85 g'
    },
    ingredients: [
      'Juneći but (prva klasa)',
      'Crni luk i korenasto povrće',
      'Domaći hleb iz kamene peći',
      'Začinska paprika (Horgoš)',
      'Sveža sezonska salata'
    ]
  },
  {
    id: 2,
    category: 'lunch',
    name: 'Bečka šnicla i pomfrit',
    description: 'Pohovana svinjska šnicla, hrskavi pomfrit, tartar sos i limun.',
    price: 580,
    image: '',
    popular: true,
    nutrition: {
      calories: '1120 kcal',
      protein: '45 g',
      carbs: '95 g'
    },
    ingredients: [
      'Svinjski but',
      'Prezle i jaja',
      'Krompir (pomfrit)',
      'Tartar sos',
      'Limun'
    ]
  }
];

const REVIEWS = [
  {
    id: 1,
    author: 'Marko Kostić',
    role: 'Šef gradilišta, Projekt-A',
    rating: 5,
    comment: 'Gulaš je pravi muški, mesa ima više nego što smo navikli kod drugih. Hleb stiže još uvek topao.',
    date: 'Pre 2 dana'
  },
  {
    id: 2,
    author: 'Darko Perić',
    role: 'Operativa, Konstrukt d.o.o.',
    rating: 5,
    comment: 'Dogovor ispoštovan u minut. Porcije su ogromne, radnici su siti i zadovoljni.',
    date: 'Pre 1 nedelju'
  },
  {
    id: 3,
    author: 'Stevan Jović',
    role: 'Vlasnik, S-Gradnja',
    rating: 5,
    comment: 'HACCP standard se vidi u svemu, od pakovanja do higijene dostavljača. Svaka preporuka.',
    date: 'Pre 2 nedelje'
  }
];

const SIMILAR_OFFERS = [
  {
    id: 1,
    name: 'Domaći Pasulj',
    provider: 'Pasulj sa Dimljenim Mesom',
    price: 550,
    image: ''
  },
  {
    id: 2,
    name: 'Roštilj',
    provider: 'Mix Roštilj - Porcija 500g',
    price: 850,
    image: ''
  },
  {
    id: 3,
    name: 'Lagani Obrok',
    provider: 'Obrok Salata sa Piletinom',
    price: 400,
    image: ''
  },
  {
    id: 4,
    name: 'Tradicionalno',
    provider: 'Punjena Paprika (2 kom)',
    price: 620,
    image: ''
  }
];

export default function CateringItemDetailPage() {
  const { providerId, itemId } = useParams();
  
  // In a real app, we would fetch data based on IDs
  // For now, we'll use the first item or find it
  const item = MENU_ITEMS.find(i => i.id === Number(itemId)) || MENU_ITEMS[0];

  const menuItemSchema = {
    ...generateMenuItemSchema(item as any, providerId as string, `${APP_CONFIG.BASE_URL}/ketering/${providerId}/stavka/${item.id}`),
    nutrition: {
      "@type": "NutritionInformation",
      calories: item.nutrition?.calories,
      proteinContent: item.nutrition?.protein,
      carbohydrateContent: item.nutrition?.carbs
    },
    suitableForDiet: "https://schema.org/GeneralDiet"
  };

  return (
    <div className="min-h-screen bg-surface pt-24 pb-20">
      <SeoHead 
        title={`${item.name} | Građevinski Ketering`}
        description={item.description}
        image={item.image}
        url={`${APP_CONFIG.BASE_URL}/ketering/${providerId}/stavka/${item.id}`}
        jsonLd={[menuItemSchema]}
      />
      <main className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-12">
          <Link to="/" className="hover:text-white transition-colors">Početna</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <Link to="/ketering" className="hover:text-white transition-colors">Ketering</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <Link to={`/ketering/provajder/${providerId}`} className="hover:text-white transition-colors">Gradjevinski Zalogaj NS</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-secondary">{item.name}</span>
        </nav>

        {/* Hero Section: Asymmetric Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-24">
          <div className="lg:col-span-7">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative group overflow-hidden rounded-[10px] border border-white/10 shadow-2xl"
            >
              <div className="absolute top-6 left-6 z-10 bg-secondary text-slate-950 px-4 py-1.5 rounded-[10px] flex items-center gap-2 shadow-xl">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>verified</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Verifikovan Obrok</span>
              </div>
              <OptimizedImage 
                src={item.image} 
                fallbackType="catering" 
                alt={item.name} 
                className="w-full h-full object-cover" 
                containerClassName="w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </motion.div>
          </div>

          <div className="lg:col-span-5 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <nav className="flex gap-2 mb-6">
                <span className="bg-surface-container-high text-on-surface-variant text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-[10px] border border-white/5">Ketering</span>
                <span className="bg-surface-container-high text-secondary text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-[10px] border border-white/5">Topli Obrok</span>
              </nav>
              
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-6 leading-none text-white">
                {item.name.split(' ').slice(0, -1).join(' ')} <br/>
                <span className="text-secondary">{item.name.split(' ').slice(-1)}</span>
              </h1>

              <div className="flex items-end gap-4 mb-10">
                <span className="text-5xl font-black text-white">{item.price} <span className="text-xl text-on-surface-variant font-medium">RSD</span></span>
                <span className="text-on-surface-variant text-sm mb-2 pb-1 border-b border-white/10 uppercase tracking-widest font-bold">po porciji</span>
              </div>

              <div className="grid grid-cols-2 gap-px bg-white/5 mb-10 rounded-[10px] overflow-hidden border border-white/10 shadow-xl">
                <div className="bg-surface-container-low p-6">
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2">Minimum</p>
                  <p className="text-xl font-bold text-white">10 Obroka</p>
                </div>
                <div className="bg-surface-container-low p-6">
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2">Dostava</p>
                  <p className="text-xl font-bold text-white">06:00 - 14:00</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/kontakt" className="flex-1 bg-secondary text-slate-950 py-5 rounded-[10px] font-black uppercase tracking-[0.2em] text-xs hover:bg-yellow-400 active:scale-95 transition-all shadow-lg shadow-secondary/20 block text-center">
                  Pošalji Upit
                </Link>
                <a href="tel:+381601234567" className="flex-1 border border-white/10 bg-white/5 text-white py-5 rounded-[10px] font-black uppercase tracking-[0.2em] text-xs hover:bg-white/10 active:scale-95 transition-all block text-center">
                  Pozovi za detalje
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Bento Grid Details */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {/* Nutrition Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-surface-container-high p-10 rounded-[10px] relative overflow-hidden flex flex-col justify-between min-h-[350px] border border-white/5 shadow-2xl group"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-secondary"></div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-secondary mb-8">Nutritivne Vrednosti</h3>
              <div className="space-y-8">
                <div className="flex justify-between items-end border-b border-white/5 pb-3 group-hover:border-secondary/30 transition-colors">
                  <span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Kalorije</span>
                  <span className="text-2xl font-black text-white">{item.nutrition?.calories || '940 kcal'}</span>
                </div>
                <div className="flex justify-between items-end border-b border-white/5 pb-3 group-hover:border-secondary/30 transition-colors">
                  <span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Proteini</span>
                  <span className="text-2xl font-black text-white">{item.nutrition?.protein || '52 g'}</span>
                </div>
                <div className="flex justify-between items-end border-b border-white/5 pb-3 group-hover:border-secondary/30 transition-colors">
                  <span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Ugljeni hidrati</span>
                  <span className="text-2xl font-black text-white">{item.nutrition?.carbs || '85 g'}</span>
                </div>
              </div>
            </div>
            <div className="mt-8 flex items-center gap-3 text-secondary">
              <span className="material-symbols-outlined animate-pulse" style={{ fontVariationSettings: '"FILL" 1' }}>bolt</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Visoka energija za radnike</span>
            </div>
          </motion.div>

          {/* Ingredients */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-surface-container p-10 rounded-[10px] border border-white/5 shadow-2xl"
          >
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-on-surface-variant mb-8">Sastojci</h3>
            <ul className="space-y-5">
              {(item.ingredients || []).map((ingredient, idx) => (
                <li key={idx} className="flex items-center gap-4 group">
                  <span className="w-2 h-2 bg-secondary rounded-full group-hover:scale-150 transition-transform"></span>
                  <span className="text-sm font-bold text-white tracking-wide">{ingredient}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Kitchen Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-surface-container p-10 rounded-[10px] border border-white/5 shadow-2xl flex flex-col justify-between"
          >
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-on-surface-variant mb-8">O Kuhinji</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-8 font-medium">
                Naša kuhinja je opremljena najmodernijim Liebherr industrijskim uređajima. Svi obroci se transportuju u termo-boxevima koji održavaju temperaturu od 65°C do trenutka isporuke.
              </p>
            </div>
            <div className="flex items-center gap-5 bg-white/5 p-6 rounded-[10px] border border-white/5">
              <div className="w-14 h-14 bg-secondary/10 flex items-center justify-center rounded-[10px] border border-secondary/20 text-secondary">
                <span className="material-symbols-outlined text-3xl">high_quality</span>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-white mb-1">HACCP Sertifikat</p>
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tighter">Standard ISO 22000</p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Reviews Section */}
        <section className="mb-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Ocene Korisnika</h2>
              <p className="text-on-surface-variant font-medium">Šta kažu šefovi gradilišta o ovom obroku</p>
            </div>
            <div className="flex items-center gap-4 bg-surface-container-high px-6 py-4 rounded-[10px] border border-white/10">
              <div className="flex items-center gap-1 text-secondary">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                <span className="text-2xl font-black">4.9</span>
              </div>
              <div className="h-8 w-px bg-white/10"></div>
              <span className="text-on-surface-variant text-sm font-bold uppercase tracking-widest">(124 ocene)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {REVIEWS.map(review => (
              <div key={review.id} className="bg-surface-container-low border border-white/5 rounded-[10px] p-8 hover:border-secondary/30 transition-all group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-secondary/20 group-hover:bg-secondary transition-colors"></div>
                <div className="flex gap-1 text-secondary mb-6">
                  {[...Array(review.rating)].map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                  ))}
                </div>
                <p className="text-white italic leading-relaxed mb-8 text-lg font-medium">"{review.comment}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-black text-xs border border-secondary/20">
                    {review.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm uppercase tracking-wider">{review.author}</div>
                    <div className="text-on-surface-variant text-[10px] uppercase font-black tracking-widest">{review.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Similar Offers */}
        <section>
          <h2 className="text-center text-[10px] font-black text-on-surface-variant uppercase tracking-[0.4em] mb-16">Slične Ponude u tvojoj blizini</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {SIMILAR_OFFERS.map(offer => (
              <Link to={`/ketering/${providerId}/stavka/${offer.id}`} key={offer.id} className="group cursor-pointer block">
                <div className="relative aspect-[4/3] rounded-[10px] overflow-hidden mb-6 border border-white/5">
                  <OptimizedImage 
                    src={offer.image} 
                    fallbackType="catering" 
                    alt={offer.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    containerClassName="w-full h-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-secondary text-slate-950 text-[10px] font-black px-3 py-1.5 rounded uppercase tracking-widest shadow-xl">
                      {offer.price} RSD
                    </span>
                  </div>
                </div>
                <div className="px-2">
                  <div className="text-[10px] text-secondary font-black uppercase tracking-widest mb-1">{offer.name}</div>
                  <h4 className="text-white font-bold group-hover:text-secondary transition-colors tracking-tight">{offer.provider}</h4>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
