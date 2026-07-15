import { apiClient } from '@/src/lib/apiClient';

const PAYMENT_LABELS: Record<string, string> = {
  'dnevna': 'Dnevna isplata',
  'nedeljna': 'Nedeljna isplata',
  'na-15-dana': 'Isplata na 15 dana',
  'mesecna': 'Mesečna plata',
  'po-m2': 'Po kvadratu (m2)',
};

function extractFormData(input: string): Record<string, any> {
  try {
    const jsonStart = input.indexOf('{', input.indexOf('Evo podataka'));
    if (jsonStart === -1) return {};
    const jsonStr = input.slice(jsonStart);
    return JSON.parse(jsonStr);
  } catch { return {}; }
}

function formatSalary(fd: Record<string, any>): string {
  const dinamika = fd.dinamikaIsplate as string;
  const paym = dinamika && PAYMENT_LABELS[dinamika] ? PAYMENT_LABELS[dinamika] : '';
  const paymSuf = paym ? `, isplata: ${paym.toLowerCase()}` : '';

  if (fd.isNegotiable) return ` Satnica zavisi od iskustva${paymSuf}.`;
  const min = fd.plataMin;
  const max = fd.plataMax;
  if (!min && !max) return paym ? ` Isplata: ${paym.toLowerCase()}.` : '';

  const range = `${min || ''}${min && max ? ' - ' : ''}${max || ''}`;
  return ` Zarada: ${range} EUR${paymSuf}.`;
}

function formatBenefits(fd: Record<string, any>): string {
  const list: string[] = Array.isArray(fd.benefits) ? fd.benefits : [];
  if (list.length === 0) return '';
  const map: Record<string, string> = {
    'smestaj': 'Smeštaj', 'prevoz': 'Prevoz', 'topli-obrok': 'Hrana',
    'pauza-za-kafu': 'Pauza za kafu', 'htz-oprema': 'Radno odelo i HTZ oprema',
    'alat-za-rad': 'Obezbeđen alat', 'prijava-ugovor': 'Prijava',
    'placen-prekovremeni': 'Plaćen prekovremeni rad',
    'pomoc-pri-vizi': 'Pomoć pri vizi / radnoj dozvoli',
  };
  return ` Nudimo: ${list.map(s => map[s] || s).join(', ')}.`;
}

function formatContact(fd: Record<string, any>): string {
  const phone = fd.kontaktTelefon || fd.phone || '';
  return phone ? ` Prijave na broj telefona: ${phone}.` : '';
}

export async function processAiCommand(input: string, context?: unknown): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await apiClient.post<{response: string}>('/ai/dashboard-assist', {
           message: input,
           context
        }, { signal: controller.signal });
        clearTimeout(timeout);
        return response.response || "";
    } catch (err: any) {
        clearTimeout(timeout);
        console.error("AI Error:", err);

        const fd = extractFormData(input);
        const category = fd.selectedCategory || context || 'job';

        if (category === 'job') {
            const sector = fd.sector || '';
            const profession = fd.profession || '';
            const location = fd.location || '';
            const position = profession || sector || 'radnik';
            const loc = location ? ` na lokaciji ${location}` : '';
            const salary = formatSalary(fd);
            const benefits = formatBenefits(fd);
            const phone = fd.kontaktTelefon || fd.phone || '';
            const contact = phone ? ` Za sve ostale informacije i više detalja pozvati na broj telefona: ${phone}. Hvala!` : '';
            return `Tražimo iskusnog ${position} za stalno zaposlenje${loc}. Može se krenuti odmah sa radom! Potrebno je odgovorno obavljanje radnih zadataka, timski rad i poštovanje mera bezbednosti na radu. Kandidat treba da ima najmanje 2 godine iskustva u sličnim poslovima.${salary}${benefits}${contact}`;
        }

        if (category === 'accommodation') {
            const loc = fd.location || '';
            const beds = fd.totalBeds || '';
            const price = fd.price || '';
            const l = loc ? ` u ${loc}` : '';
            const p = price ? ` Cena: ${price} EUR.` : '';
            const bedsTxt = beds ? ` Kapacitet: ${beds} kreveta.` : '';
            return `Nudimo kvalitetan smeštaj za radnike${l}.${bedsTxt} Smeštaj je opremljen krevetima, ormarima, kuhinjom i kupatilom.${p} Pogodno za duži boravak. Parking i wifi dostupni.`;
        }

        if (category === 'machines') {
            const brand = fd.machBrand || '';
            const model = fd.machModel || '';
            const m = brand || model ? ` ${brand} ${model}` : '';
            const price = fd.machPrice ? ` Cena: ${fd.machPrice} EUR.` : fd.machPricePerDay ? ` Cena po danu: ${fd.machPricePerDay} EUR.` : '';
            return `Izdajem građevinsku mašinu${m} u odličnom stanju. Redovno servisirana, spremna za rad.${price} Dostupna za uvid uživo.`;
        }

        if (category === 'catering') {
            const price = fd.catPricePerMeal ? ` Cena po obroku: ${fd.catPricePerMeal} EUR.` : '';
            const capacity = fd.catDailyCapacityMeals ? ` Kapacitet: ${fd.catDailyCapacityMeals} obroka dnevno.` : '';
            return `Profesionalna ketering usluga za građevinske radnike. Dnevna ponuda kuvanih obroka, dostava na gradilište. Higijenski ispravno, HACCP standard.${price}${capacity}`;
        }

        if (category === 'plot') {
            const loc = fd.location || '';
            const purpose = fd.plotPurpose || '';
            const area = fd.plotArea ? ` Površina: ${fd.plotArea} ${fd.plotAreaUnit || 'm2'}.` : '';
            const price = fd.plotPrice ? ` Cena: ${fd.plotPrice} ${fd.plotCurrency || 'EUR'}.` : '';
            const l = loc ? ` u ${loc}` : '';
            return `Ponuda ${purpose}građevinskog zemljišta${l}.${area} Pristup sa asfaltnog puta. Infrastruktura u blizini. Pogodno za gradnju.${price}`;
        }

        if (category === 'marketplace') {
            const price = fd.marketValue ? ` Cena: ${fd.marketValue} EUR.` : '';
            return `Prodajem građevinsku opremu u dobrom stanju. Povoljna cena.${price} Moguć dogovor.`;
        }

        return "";
    }
}

export async function generateAdData(description: string, category: string): Promise<Record<string, any>> {
    try {
        const data = await apiClient.post<Record<string, any>>('/ai/generate-ad', {
            description,
            category
        });
        return data;
    } catch (err) {
        console.error("AI generate-ad error:", err);
        return { _error: "AI servis trenutno nije dostupan" };
    }
}

export async function parseAdIntentFrontend(text: string): Promise<Record<string, any>> {
    try {
        const data = await apiClient.post<Record<string, any>>('/ai/parse-ad', { text });
        return data;
    } catch (err) {
        console.error("AI parse-ad error:", err);
        return { _error: "AI servis trenutno nije dostupan" };
    }
}

export async function gradeAdScoreFrontend(adData: any): Promise<{score: number, feedback: string}> {
    try {
        const data = await apiClient.post<{score: number, feedback: string}>('/ai/grade-ad', { adData });
        return data;
    } catch (err) {
        console.error("AI grade-ad error:", err);
        return { score: 0, feedback: "AI ocenjivač trenutno nije dostupan." };
    }
}
