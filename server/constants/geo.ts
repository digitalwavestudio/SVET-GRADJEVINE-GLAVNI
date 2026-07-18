// Zajedničke geo konstante — Srbija + Nemačka (hub GEO sistem)
// Koristi se i u spa.middleware i u seo-db.service da liste budu uvek usklađene.

export const CITIES: string[] = [
  "beograd", "novi-sad", "nis", "kragujevac", "subotica", "zrenjanin",
  "pancevo", "smederevo", "cacak", "novi-pazar", "kraljevo", "sabac",
  "uzice", "vranje", "valjevo", "leskovac", "krusevac", "zajecar",
  "sombor", "pozarevac", "pirot", "bor", "srem", "backa", "banat",
  "nemacka", "berlin", "munchen", "muenchen", "hamburg", "koln", "koeln",
  "frankfurt", "stuttgart", "dortmund", "leipzig", "dresden", "bremen",
  "duesseldorf", "nurnberg", "nuernberg", "hannover",
];

export const CITY_DISPLAY: Record<string, string> = {
  beograd: "Beograd", "novi-sad": "Novi Sad", nis: "Niš",
  kragujevac: "Kragujevac", subotica: "Subotica", zrenjanin: "Zrenjanin",
  pancevo: "Pančevo", smederevo: "Smederevo", cacak: "Čačak",
  "novi-pazar": "Novi Pazar", kraljevo: "Kraljevo", sabac: "Šabac",
  uzice: "Užice", vranje: "Vranje", valjevo: "Valjevo",
  leskovac: "Leskovac", krusevac: "Kruševac", zajecar: "Zaječar",
  sombor: "Sombor", pozarevac: "Požarevac", pirot: "Pirot",
  bor: "Bor",
  nemacka: "Nemačka", berlin: "Berlin", munchen: "München",
  muenchen: "München", hamburg: "Hamburg", koln: "Köln", koeln: "Köln",
  frankfurt: "Frankfurt", stuttgart: "Stuttgart", dortmund: "Dortmund",
  leipzig: "Leipzig", dresden: "Dresden", bremen: "Bremen",
  duesseldorf: "Düsseldorf", nurnberg: "Nürnberg", nuernberg: "Nürnberg",
  hannover: "Hannover",
};

export const GERMAN_SLUGS: Set<string> = new Set([
  "nemacka", "berlin", "munchen", "muenchen", "hamburg", "koln", "koeln",
  "frankfurt", "stuttgart", "dortmund", "leipzig", "dresden", "bremen",
  "duesseldorf", "nurnberg", "nuernberg", "hannover",
]);

export function displayCity(slug: string): string {
  return CITY_DISPLAY[slug] || slug.charAt(0).toUpperCase() + slug.slice(1);
}
