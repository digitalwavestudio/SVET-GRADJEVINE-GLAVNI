import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { APP_CONFIG } from '@/src/constants/config';
import { getCanonicalPath, resolveRouteFilters } from '@/src/lib/routeFilters';
import { sanitizeInput } from '@/src/lib/sanitize';
import { useDocumentHead } from '@/src/hooks/useDocumentHead';

interface Props {
  type: string;
  grad?: string;
  zanimanje?: string;
  itemCount?: number;
  jsonLd?: any;
  preloads?: { href: string; as: string; type?: string }[];
}

export default function DynamicSEO({ type, grad, zanimanje, jsonLd }: Props) {
  const location = useLocation();

  const title = useMemo(() => {
    let t = '';
    
    const displayGrad = grad ? grad.charAt(0).toUpperCase() + grad.slice(1).replace(/-/g, ' ') : '';
    let displayZanimanje = zanimanje ? zanimanje.replace(/-/g, ' ') : '';
    
    if (displayZanimanje && displayZanimanje.toLowerCase() === 'sve') {
        displayZanimanje = '';
    }

    if (type === 'firme') {
      t = 'Građevinske Firme';
      if (displayZanimanje) t = `${displayZanimanje.charAt(0).toUpperCase() + displayZanimanje.slice(1)} Firme`;
    } else if (type === 'majstori') {
      t = displayZanimanje ? `${displayZanimanje.charAt(0).toUpperCase() + displayZanimanje.slice(1)}` : 'Majstori';
    } else if (type === 'masine') {
      t = displayZanimanje ? `${displayZanimanje.charAt(0).toUpperCase() + displayZanimanje.slice(1)}` : 'Sve Građevinske Mašine';
    } else if (type === 'smestaj') {
      t = displayZanimanje ? `${displayZanimanje.charAt(0).toUpperCase() + displayZanimanje.slice(1)} Smeštaj` : 'Smeštaj za Radnike';
    } else if (type === 'alat-i-oprema') {
      t = displayZanimanje ? `Građevinski Alat: ${displayZanimanje.charAt(0).toUpperCase() + displayZanimanje.slice(1)}` : 'Građevinski Alat i Oprema';
    } else if (type === 'ketering') {
      t = displayZanimanje ? `Ketering (${displayZanimanje.charAt(0).toUpperCase() + displayZanimanje.slice(1)})` : 'Ketering za Gradilišta';
    } else if (type === 'placevi') {
      t = displayZanimanje ? `Gradilišta i Placevi: ${displayZanimanje.charAt(0).toUpperCase() + displayZanimanje.slice(1)}` : 'Investicioni Placevi';
    } else {
      t = displayZanimanje ? `${displayZanimanje.charAt(0).toUpperCase() + displayZanimanje.slice(1)} Poslovi` : 'Građevinski Poslovi';
    }

    if (displayGrad) {
      if (type === 'masine') t += ` (${displayGrad})`;
      else t += ` u ${displayGrad}`;
    }

    t += ' | Svet Građevine';
    return t;
  }, [type, grad, zanimanje]);

  const description = useMemo(() => {
    const displayGrad = grad ? grad.replace(/-/g, ' ') : '';
    const descText = displayGrad ? ` u ${displayGrad}` : ' u Srbiji';
    
    switch (type) {
      case 'poslovi': return `Najveća ponuda poslova u građevinarstvu${descText}. Pronađite najbolje plaćene poslove za inženjere, arhitekte i operativce.`;
      case 'firme': return `Katalog proverenih građevinskih firmi${descText}. Pregledajte portfolio, usluge i kontaktirajte najbolje izvođače.`;
      case 'majstori': return `Baza majstora za gipsane, keramičarske, zidarske i ostale građevinske radove${descText}. Sigurni majstori sa recenzijama.`;
      case 'masine': return `Iznajmljivanje i prodaja polovnih i novih građevinskih mašina, bagera, kranova i opreme${descText}.`;
      case 'smestaj': return `Povoljan i adekvatan smeštaj za terenske radnike i građevinske ekipe${descText}. Prenoćišta sa hranom i parkingom.`;
      case 'ketering': return `Usluge restorana i keteringa za gradilišta${descText}. Dostava toplih obroka, lanč paketi i menze za radnike.`;
      case 'placevi': return `Građevinsko, poljoprivredno i industrijsko zemljište${descText}. Pronađite parcele sa dozvolama i pratećom infrastrukturom.`;
      case 'alat-i-oprema': return `Kupovina i iznajmljivanje građevinskog alata, skela, oplata i mehanizacije${descText}.`;
      default: return `Pretražite platformu Svet Građevine za najbolje ponude${descText}.`;
    }
  }, [type, grad]);

  const currentCanonical = useMemo(() => {
    const filters = resolveRouteFilters(type, { grad, zanimanje });
    return getCanonicalPath(type, filters);
  }, [type, grad, zanimanje]);

  const ogImage = `${APP_CONFIG.BASE_URL}/og-image.jpg`;
  
  const isFilterTrap = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const hasActiveFilters = Array.from(searchParams.keys()).filter(k => !['page', 'sort', 'q', 'view'].includes(k)).length > 0;
    return hasActiveFilters;
  }, [location.search]);

  useDocumentHead({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogImage,
    ogUrl: currentCanonical,
    twitterCard: 'summary_large_image',
    jsonLd,
    noindex: isFilterTrap,
  });

  return null;
}
