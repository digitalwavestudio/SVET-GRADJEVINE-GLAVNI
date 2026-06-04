export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  beograd: { lat: 44.7866, lng: 20.4489 },
  "novi-sad": { lat: 45.2671, lng: 19.8335 },
  nis: { lat: 43.3209, lng: 21.8958 },
  kragujevac: { lat: 44.0128, lng: 20.9114 },
  cacak: { lat: 43.8914, lng: 20.3503 },
  kraljevo: { lat: 43.7234, lng: 20.687 },
  subotica: { lat: 46.1005, lng: 19.6646 },
  zrenjanin: { lat: 45.3836, lng: 20.3819 },
  pancevo: { lat: 44.8708, lng: 20.6403 },
  valjevo: { lat: 44.2666, lng: 19.8833 },
  kopaonik: { lat: 43.2847, lng: 20.8094 },
  zlatibor: { lat: 43.7297, lng: 19.6993 },
};

export const DISTRICT_COORDS: Record<string, { lat: number; lng: number }> = {
  beograd: { lat: 44.7866, lng: 20.4489 },
  juznobacki: { lat: 45.2671, lng: 19.8335 },
  nisavski: { lat: 43.3209, lng: 21.8958 },
  sumadijski: { lat: 44.0128, lng: 20.9114 },
  moravicki: { lat: 43.8914, lng: 20.3503 },
  raski: { lat: 43.7234, lng: 20.687 },
  severnobacki: { lat: 46.1005, lng: 19.6646 },
  srednjebanatski: { lat: 45.3836, lng: 20.3819 },
  juznobanatski: { lat: 44.8708, lng: 20.6403 },
  kolubarski: { lat: 44.2666, lng: 19.8833 },
  rasinski: { lat: 43.5822, lng: 21.3283 },
  zlatiborski: { lat: 43.8586, lng: 19.8481 },
};

export const CITY_TO_DISTRICT: Record<string, string> = {
  // Beograd i okolina
  beograd: "beograd",
  obrenovac: "beograd",
  mladenovac: "beograd",
  lazarevac: "beograd",
  sopot: "beograd",
  barajevo: "beograd",
  grocka: "beograd",
  surcin: "beograd",

  // Južnobački okrug
  "novi-sad": "juznobacki",
  veternik: "juznobacki",
  futog: "juznobacki",
  "backa-palanka": "juznobacki",
  temerin: "juznobacki",
  becej: "juznobacki",
  vrbas: "juznobacki",

  // Nišavski okrug
  nis: "nisavski",
  aleksinac: "nisavski",
  svrljig: "nisavski",
  merosina: "nisavski",
  doljevac: "nisavski",

  // Šumadijski okrug
  kragujevac: "sumadijski",
  arandjelovac: "sumadijski",
  topola: "sumadijski",
  batocina: "sumadijski",
  lapovo: "sumadijski",

  // Moravički okrug
  cacak: "moravicki",
  "gornji-milanovac": "moravicki",
  lucani: "moravicki",
  ivanica: "moravicki",

  // Raški okrug
  kraljevo: "raski",
  "vrnjacka-banja": "raski",
  raska: "raski",
  tutin: "raski",
  "novi-pazar": "raski",

  // Severnobački okrug
  subotica: "severnobacki",
  "backa-topola": "severnobacki",
  "mali-idjos": "severnobacki",

  // Srednjebanatski okrug
  zrenjanin: "srednjebanatski",
  "novi-becej": "srednjebanatski",
  zitiste: "srednjebanatski",
  secanj: "srednjebanatski",

  // Južnobanatski okrug
  pancevo: "juznobanatski",
  vrsac: "juznobanatski",
  kovacica: "juznobanatski",
  alibunar: "juznobanatski",
  "bela-crkva": "juznobanatski",

  // Kolubarski okrug
  valjevo: "kolubarski",
  ub: "kolubarski",
  lajkovac: "kolubarski",
  mionica: "kolubarski",
  ljig: "kolubarski",

  // Rasinski okrug
  kopaonik: "rasinski",
  krusevac: "rasinski",
  trstenik: "rasinski",
  aleksandrovac: "rasinski",
  brus: "rasinski",

  // Zlatiborski okrug
  zlatibor: "zlatiborski",
  uzice: "zlatiborski",
  pozega: "zlatiborski",
  arilje: "zlatiborski",
  kosjeric: "zlatiborski",
  prijepolje: "zlatiborski",
  "nova-varos": "zlatiborski",
  cajetina: "zlatiborski",
};

export function resolveGeoFallback(locationSlug: string | undefined): {
  lat: number;
  lng: number;
  district: string;
} | null {
  if (!locationSlug) return null;
  const slug = locationSlug.toLowerCase();

  // 1. Direct city match
  if (CITY_COORDS[slug]) {
    const coords = CITY_COORDS[slug];
    const district = CITY_TO_DISTRICT[slug] || "srbija";
    return { ...coords, district };
  }

  // 2. Resolve via CITY_TO_DISTRICT mapping
  const district = CITY_TO_DISTRICT[slug];
  if (district && DISTRICT_COORDS[district]) {
    const coords = DISTRICT_COORDS[district];
    return { ...coords, district };
  }

  // 3. Last fallback (Beograd centre coords as baseline if unrecognizable in Serbia)
  return { ...DISTRICT_COORDS.beograd, district: "beograd" };
}
