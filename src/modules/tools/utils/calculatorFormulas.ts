export const calculateFasada = (fasadaKvadratura: number | string, fasadaDebljina: number | string) => {
    const k = Number(fasadaKvadratura) || 0;
    const d = Number(fasadaDebljina) || 0;
    
    // Potrosnja po m2 (okvirno)
    return [
      { name: 'Stiropor (EPS)', amount: k * 1.05, unit: 'm²', desc: 'Uračunat otpad 5%' },
      { name: 'Lepak za lepljenje', amount: k * 5, unit: 'kg', desc: '5 kg / m²' },
      { name: 'Lepak za gletovanje', amount: k * 5, unit: 'kg', desc: '5 kg / m²' },
      { name: 'Staklena mrežica', amount: k * 1.1, unit: 'm²', desc: '1.1 m² / m² (preklopi)' },
      { name: 'Tiplovi', amount: k * 6, unit: 'kom', desc: '6 kom / m²' },
      { name: 'Ugaona lajsna sa mrežicom', amount: Math.ceil(Math.sqrt(k) * 1.5), unit: 'm', desc: 'Slobodna procena' },
      { name: 'Prajmer (Osnovni premaz)', amount: k * 0.2, unit: 'L', desc: '0.2L / m²' },
      { name: 'Završni malter (Bavalit/Akril)', amount: k * 2.8, unit: 'kg', desc: 'Zavisi od granulacije (cca 2.8kg)' }
    ];
};

export const calculateZidanje = (zidanjeKvadratura: number | string, zidanjeTipBloka: string) => {
    const k = Number(zidanjeKvadratura) || 0;
    let blokovaPoM2 = 25; // Default Giter
    if (zidanjeTipBloka === 'YTONG 20') blokovaPoM2 = 8;
    if (zidanjeTipBloka === 'KLIMA BLOK 25') blokovaPoM2 = 10.7;
    
    const malterPoM2 = zidanjeTipBloka.includes('YTONG') ? 0 : 35; // kg
    
    return [
      { name: 'Blokovi', amount: Math.ceil(k * blokovaPoM2 * 1.05), unit: 'kom', desc: `Uračunat otpad 5% (${blokovaPoM2} kom/m²)` },
      { name: 'Malter za zidanje / Lepak', amount: zidanjeTipBloka.includes('YTONG') ? Math.ceil(k * 2) : Math.ceil(k * malterPoM2), unit: 'kg', desc: zidanjeTipBloka.includes('YTONG') ? 'Lepak 2kg/m²' : `Tipična potrošnja ${malterPoM2}kg/m²` }
    ];
};

export const calculateKeramika = (keramikaKvadratura: number | string) => {
    const k = Number(keramikaKvadratura) || 0;
    return [
      { name: 'Keramičke pločice', amount: Number((k * 1.1).toFixed(1)), unit: 'm²', desc: 'Uračunat otpad 10% (za standardno postavljanje)' },
      { name: 'Fleksibilni lepak (S1/S2)', amount: k * 4, unit: 'kg', desc: 'Prosek 4 kg / m²' },
      { name: 'Masa za fugovanje', amount: Number((k * 0.4).toFixed(1)), unit: 'kg', desc: 'Prosek 0.4 kg / m² (zavisi od fugne)' },
      { name: 'Krstići / Kajle / Distanceri', amount: k * 30, unit: 'kom', desc: 'Cca 30 kom / m²' },
      { name: 'Prajmer', amount: Number((k * 0.15).toFixed(1)), unit: 'L', desc: '0.15L / m²' }
    ];
};

export const calculateBeton = (betonDuzina: number | string, betonSirina: number | string, betonDubina: number | string) => {
    const duzina = Number(betonDuzina) || 0;
    const sirina = Number(betonSirina) || 0;
    const dubina = Number(betonDubina) || 0;
    const kubikaza = duzina * sirina * dubina;
    
    return [
      { name: 'Potrebno betona', amount: kubikaza.toFixed(2), unit: 'm³', desc: 'Ukupna zapremina bez otpada' },
      { name: 'Uz otpad (5%)', amount: (kubikaza * 1.05).toFixed(2), unit: 'm³', desc: 'Preporučeno za naručivanje' }
    ];
};

export const calculateGips = (gipsKvadratura: number | string, gipsTipSistema: string) => {
    const k = Number(gipsKvadratura) || 0;
    const isDouble = gipsTipSistema === 'W112';
    
    const slojevi = isDouble ? 4 : 2; // Obe strane
    
    return [
      { name: 'Gips-karton ploče (standard)', amount: Number((k * slojevi * 1.05).toFixed(1)), unit: 'm²', desc: `Sistem ${gipsTipSistema} (uračunato 5% otpada)` },
      { name: 'CD Profil', amount: Math.ceil(k * 2.1), unit: 'm', desc: 'Prosek 2.1m po m² zida' },
      { name: 'UD Profil', amount: Math.ceil(k * 0.8), unit: 'm', desc: 'Prosek 0.8m po m² zida' },
      { name: 'Vijak (TN 25/35)', amount: k * (isDouble ? 40 : 20), unit: 'kom', desc: isDouble ? '40 kom/m² (za dva sloja)' : '20 kom/m²' },
      { name: 'Ispuna spojeva (Uniflott/Fugen)', amount: Number((k * (isDouble ? 0.7 : 0.4)).toFixed(1)), unit: 'kg', desc: isDouble ? '0.7 kg/m²' : '0.4 kg/m²' },
      { name: 'Bandaž traka', amount: Math.ceil(k * 1.6), unit: 'm', desc: '1.6m po m²' },
      { name: 'Mineralna vuna (izolacija)', amount: Number((k * 1.05).toFixed(1)), unit: 'm²', desc: 'Ispuna zida' }
    ];
};

export const calculateMoleraj = (molerajKvadratura: number | string, molerajOdbijci: number | string, molerajTipBoje: string, molerajBrojRuku: number | string) => {
    const k = Number(molerajKvadratura) || 0;
    const o = Number(molerajOdbijci) || 0;
    const neto = Math.max(0, k - o);
    const ruke = Number(molerajBrojRuku) || 2;
    
    let bojaPoKvadrati = 0.25; // kg poludisperzija
    let unit = 'kg';
    
    if (molerajTipBoje === 'AKRILNA') {
      bojaPoKvadrati = 0.15; // L
      unit = 'L';
    } else if (molerajTipBoje === 'PERIVA') {
      bojaPoKvadrati = 0.12; // L
      unit = 'L';
    }

    const ukupnaBoja = neto * bojaPoKvadrati * ruke;

    return [
      { name: 'Površina za obradu (Neto)', amount: neto.toFixed(1), unit: 'm²', desc: 'Nakon odbijanja otvora' },
      { name: 'Podloga (Primer)', amount: (neto * 0.1).toFixed(1), unit: 'kg', desc: 'Akrilna podloga 1:9 (očekivana potrošnja)' },
      { name: 'Unutrašnja boja', amount: ukupnaBoja.toFixed(1), unit: unit, desc: `Tip: ${molerajTipBoje}, ${ruke} sloja (ruke)` },
      { name: 'Glet masa (za 2 sloja)', amount: (neto * 1.5).toFixed(1), unit: 'kg', desc: 'Prosek 1.5 kg/m² za kompletno gletovanje' },
      { name: 'Zaštitna traka (Papirna)', amount: Math.ceil(neto * 0.5), unit: 'm', desc: 'Okvirna procena za zaštitu' }
    ];
};

export const calculatePodovi = (podoviKvadratura: number | string, podoviTipSlaganja: string, podoviPakovanjeM2: number | string) => {
    const k = Number(podoviKvadratura) || 0;
    const pM2 = Number(podoviPakovanjeM2) || 2.22;
    
    const wasteFactor = podoviTipSlaganja === 'RIBLJA_KOST' ? 1.12 : 1.07;
    const brutoArea = k * wasteFactor;
    const packs = Math.ceil(brutoArea / pM2);
    
    // Perimeter estimate for skirting (heuristic)
    const skirting = Math.ceil(Math.sqrt(k) * 4.5);
    
    return [
      { name: 'Neto površina poda', amount: k.toFixed(1), unit: 'm²', desc: 'Realna površina prostora' },
      { name: 'Bruto materijal (sa otpadom)', amount: brutoArea.toFixed(1), unit: 'm²', desc: `Otpad za ${podoviTipSlaganja === 'RIBLJA_KOST' ? '12%' : '7%'} (uključujući sečenje)` },
      { name: 'Broj pakovanja', amount: packs, unit: 'pak', desc: `Pri ${pM2} m² po pakovanju` },
      { name: 'Podna izolacija (Filc/XPS)', amount: (k * 1.05).toFixed(1), unit: 'm²', desc: 'Podloga ispod laminata' },
      { name: 'Podne lajsne', amount: skirting, unit: 'm', desc: 'Procenjena dužina po obodu (heuristic)' },
      { name: 'Završni profili (Pragovi)', amount: Math.ceil(k / 15), unit: 'kom', desc: 'Procenjen broj prelaznih lajsni' }
    ];
};

export const calculateKrov = (krovOsnova: number | string, krovNagib: number | string, krovPotrosnjaCrepa: number | string) => {
    const osnova = Number(krovOsnova) || 0;
    const nagib = Number(krovNagib) || 0;
    const potrosnja = Number(krovPotrosnjaCrepa) || 12.5;

    // A = Osnova / cos(alpha)
    const nagibRad = (nagib * Math.PI) / 180;
    const cosAlpha = Math.cos(nagibRad);
    const kKrova = cosAlpha > 0 ? osnova / cosAlpha : osnova;

    return [
      { name: 'Ukupna površina krova', amount: kKrova.toFixed(1), unit: 'm²', desc: `Izračunato na osnovu nagiba od ${nagib}°` },
      { name: 'Crep (Količina)', amount: Math.ceil(kKrova * potrosnja * 1.05), unit: 'kom', desc: `Pri potrošnji od ${potrosnja} kom/m² (+5% škart)` },
      { name: 'Krovne letve (30x50)', amount: Math.ceil(kKrova * 3), unit: 'm', desc: 'Procenjeno 3m po m² krova' },
      { name: 'Kontra-letve (50x50)', amount: Math.ceil(kKrova * 1.2), unit: 'm', desc: 'Procenjeno 1.2m po m² krova' },
      { name: 'Krovna folija (Paropropusna)', amount: (kKrova * 1.15).toFixed(1), unit: 'm²', desc: 'Uračunato 15% preklopa' },
      { name: 'Sljemenjak (Grebenač)', amount: Math.ceil(Math.sqrt(osnova) * 2), unit: 'kom', desc: 'Okvirna procena na osnovu osnove' }
    ];
};

export const calculateBehaton = (behatonKvadratura: number | string, behatonDebljinaRizle: number | string, behatonIvicnjaci: number | string) => {
    const k = Number(behatonKvadratura) || 0;
    const d = Number(behatonDebljinaRizle) || 0;
    const i = Number(behatonIvicnjaci) || 0;

    // Rizla volume in m3
    const rizlaVolume = (k * (d / 100)) * 1.15; // +15% sabijanje
    const sandVolume = k * 0.03; // ~3cm fini pesak za polaganje

    return [
      { name: 'Behaton ploče', amount: (k * 1.05).toFixed(1), unit: 'm²', desc: 'Uračunato 5% otpada za sečenje' },
      { name: 'Rizla za podlogu (0-31mm)', amount: rizlaVolume.toFixed(2), unit: 'm³', desc: `Debljina ${d}cm (+15% za sabijanje)` },
      { name: 'Fini pesak (0-4mm)', amount: sandVolume.toFixed(2), unit: 'm³', desc: 'Sloj za fini nivo (3cm)' },
      { name: 'Ivičnjaci', amount: i, unit: 'm', desc: 'Ukupna dužina ivica' },
      { name: 'Kvarcni pesak za fugovanje', amount: Math.ceil(k * 3), unit: 'kg', desc: 'Prosek 3kg po m²' },
      { name: 'Beton za ivičnjake', amount: (i * 0.05).toFixed(2), unit: 'm³', desc: 'Betonska stopa za učvršćivanje ivica' }
    ];
};

export const calculateHidro = (hidroKvadratura: number | string, hidroTrakaDužina: number | string) => {
    const k = Number(hidroKvadratura) || 0;
    const t = Number(hidroTrakaDužina) || 0;

    return [
      { name: 'Hidroizolacioni premaz (2 sloja)', amount: (k * 1.5).toFixed(1), unit: 'kg', desc: 'Prosek 1.5kg/m² za dvokomponentni sistem' },
      { name: 'Zaptivna traka za uglove', amount: Math.ceil(t * 1.1), unit: 'm', desc: 'Uračunato 10% za preklope' },
      { name: 'Prajmer (Podloga)', amount: (k * 0.15).toFixed(1), unit: 'L', desc: 'Dubinski premaz pre izolacije' },
      { name: 'Ugaoni elementi (Unutrašnji)', amount: 4, unit: 'kom', desc: 'Standardna procena za kupatilo' },
      { name: 'Manžetne za cevi', amount: 2, unit: 'kom', desc: 'Zaptivanje oko izlaza vode' }
    ];
};

