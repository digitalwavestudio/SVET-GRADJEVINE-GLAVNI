interface FirestoreTimestamp {
  toDate: () => Date;
}

type DateLike = string | number | Date | FirestoreTimestamp | null | undefined;

interface LocationOption {
  id?: string;
  slug?: string;
  name?: string;
}

interface JobLike {
  createdAt?: unknown;
  locationSlug?: unknown;
  location?: unknown;
  loc?: unknown;
  lokacijaStr?: unknown;
  isNegotiable?: unknown;
  plataMin?: unknown;
  plataMax?: unknown;
  salary?: unknown;
  sal?: unknown;
  price?: unknown;
  benefits?: unknown;
  benefiti?: unknown;
  rawBenefits?: unknown;
  smestaj?: unknown;
  housing?: unknown;
  prevoz?: unknown;
  transport?: unknown;
  hrana?: unknown;
  food?: unknown;
  topliObrok?: unknown;
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function parseFirestoreDate(value: unknown): Date | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'object') {
    const candidate = value as { toDate?: unknown; _seconds?: unknown };
    if (typeof candidate.toDate === 'function') {
      const date = (candidate.toDate as () => unknown)();
      if (date instanceof Date && !Number.isNaN(date.getTime())) return date;
      return null;
    }
    if (typeof candidate._seconds === 'number') {
      return new Date(candidate._seconds * 1000);
    }
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export function isNewJob(createdAt: unknown, now: number = Date.now(), maxAgeMs: number = 48 * 60 * 60 * 1000): boolean {
  const createdDate = parseFirestoreDate(createdAt);
  return !!createdDate && now - createdDate.getTime() < maxAgeMs;
}

export function formatLocationName(job: JobLike, locations: LocationOption[] = []): string {
  const slug = job.locationSlug || job.location || job.loc || job.lokacijaStr;
  if (!slug) return 'Srbija';

  if (typeof slug === 'string') {
    const cleanSlug = slug.toLowerCase().trim();
    const found = locations.find((location) => location.slug === cleanSlug || location.id === cleanSlug);
    if (found?.name) return found.name;
    return slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase();
  }

  if (typeof slug === 'object') {
    const named = slug as { name?: unknown; address?: unknown };
    if (typeof named.name === 'string' && named.name) return named.name;
    if (typeof named.address === 'string' && named.address) return named.address;
  }

  return 'Srbija';
}

export function formatSalaryText(job: JobLike): string | null {
  if (job.isNegotiable) return 'Pozvati';

  const min = asNumber(job.plataMin);
  const max = asNumber(job.plataMax);
  if (min !== null && min > 0) {
    if (max !== null && max > 0) {
      if (min === max) return `${min.toLocaleString()} €`;
      return `${min.toLocaleString()} - ${max.toLocaleString()} €`;
    }
    return `Od ${min.toLocaleString()} €`;
  }
  if (max !== null && max > 0) {
    return `Do ${max.toLocaleString()} €`;
  }

  const legacy = job.salary ?? job.sal ?? job.price;
  if (typeof legacy === 'number') return `${legacy.toLocaleString()} €`;
  if (typeof legacy === 'string' && legacy.trim()) {
    const clean = legacy.replace(/€/g, '').trim();
    return `${clean} €`;
  }
  return null;
}

export function getJobBenefitFlags(job: JobLike): { smestaj: boolean; prevoz: boolean; hrana: boolean } {
  const slugs = [
    ...(Array.isArray(job.benefits) ? job.benefits : []),
    ...(Array.isArray(job.benefiti) ? job.benefiti : []),
    ...(Array.isArray(job.rawBenefits) ? job.rawBenefits : []),
  ];
  const hasSlug = (slug: string) => slugs.includes(slug);

  return {
    smestaj: hasSlug('smestaj') || job.smestaj === true || job.housing === true,
    prevoz: hasSlug('prevoz') || job.prevoz === true || job.transport === true,
    hrana: hasSlug('topli-obrok') || hasSlug('hrana') || job.hrana === true || job.food === true || job.topliObrok === true,
  };
}

export function formatCompanyName(job: JobLike, fallback = 'Svet Građevine Član'): string {
  const record = job as Record<string, any>;
  return (
    record.authorSnapshot?.companyName ||
    record.authorSnapshot?.displayName ||
    asText(record.comp) ||
    asText(record.company) ||
    asText(record.companyName) ||
    fallback
  );
}
