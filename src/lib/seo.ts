import { slugify, buildJobUrl as buildUrl } from '@/src/lib/url-shared';
import { getJobLink } from '@/src/lib/routeFilters';

export function generateSlug(title: string = '', location: string = '', company: string = '') {
  const t = title || 'bez-naslova';
  const l = location || '';
  const c = company || '';
  return slugify(`${t} ${l} ${c}`.trim());
}

interface JobLike {
  title?: string;
  location?: string;
  loc?: string;
  company?: string;
  comp?: string;
  id?: string | number;
}

export function buildJobUrl(job: JobLike) {
  const id = job.id?.toString() ?? '';
  return getJobLink(id);
}

export function extractJobId(sluggedId: string): string {
  return sluggedId.includes('~') ? sluggedId.split('~').pop() || sluggedId : sluggedId;
}

export interface JobSeoInput {
  title?: string;
  location?: string;
  salary?: string | number;
  plataMin?: string | number | null;
  plataMax?: string | number | null;
  salaryType?: string;
  dinamikaIsplate?: string;
  isNegotiable?: boolean;
  benefits?: unknown;
  description?: string;
}

const BENEFIT_LABELS: Record<string, string> = {
  smestaj: 'smeštaj',
  housing: 'smeštaj',
  prevoz: 'prevoz',
  transport: 'prevoz',
  'topli-obrok': 'hrana',
  hrana: 'hrana',
  food: 'hrana',
};

function cleanSeoText(value?: string): string {
  if (!value) return '';
  return value
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateSeoText(value: string, maxLength: number): string {
  const text = value.trim();
  if (text.length <= maxLength) return text;
  const slice = text.slice(0, maxLength + 1);
  const sentenceEnd = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('! '), slice.lastIndexOf('? '));
  if (sentenceEnd > maxLength * 0.45) {
    return slice.slice(0, sentenceEnd + 1).trim();
  }
  const wordEnd = slice.lastIndexOf(' ');
  if (wordEnd > maxLength * 0.45) {
    return slice.slice(0, wordEnd).trim();
  }
  return slice.slice(0, maxLength).trim();
}

export function formatJobSalarySummary(job: JobSeoInput): string {
  if (job.isNegotiable) return 'pozvati za platu';
  const min = Number(job.plataMin);
  const max = Number(job.plataMax);
  if (Number.isFinite(min) && min > 0) {
    if (Number.isFinite(max) && max > 0 && max !== min) {
      return `${min.toLocaleString()} - ${max.toLocaleString()} €`;
    }
    return `${min.toLocaleString()} €`;
  }
  const salary = cleanSeoText(typeof job.salary === 'number' ? String(job.salary) : job.salary);
  return salary;
}

const PAYMENT_UNITS: Record<string, string> = {
  satnica: 'sat',
  'po-satu': 'sat',
  dnevna: 'dan',
  nedeljna: 'nedelja',
  mesecna: 'mesec',
  'po-m2': 'm2',
};

export function formatJobPaymentUnit(job: JobSeoInput): string {
  const slug = cleanSeoText(job.dinamikaIsplate || job.salaryType).toLowerCase().replace(/\s+/g, '-');
  return PAYMENT_UNITS[slug] || '';
}

function formatJobBenefitList(job: JobSeoInput): string[] {
  const benefits = Array.isArray(job.benefits) ? job.benefits : [];
  return benefits
    .map((benefit) => {
      if (typeof benefit !== 'string') return '';
      const slug = benefit.trim();
      return BENEFIT_LABELS[slug] || slug.replace(/-/g, ' ').trim();
    })
    .filter((label, index, all) => label && all.indexOf(label) === index)
    .slice(0, 3);
}

export function formatJobBenefitSummary(job: JobSeoInput): string {
  return formatJobBenefitList(job).join(', ');
}

export function buildJobSeoTitle(job: JobSeoInput): string {
  const title = cleanSeoText(job.title) || 'Građevinski posao';
  const location = cleanSeoText(job.location);
  const unit = formatJobPaymentUnit(job);
  const salary = formatJobSalarySummary(job);
  const salaryWithUnit = unit && salary && salary !== 'pozvati za platu' ? `${salary} / ${unit}` : salary;
  const primaryBenefit = formatJobBenefitList(job)[0] || '';
  const parts = [title];
  if (location && !title.toLowerCase().includes(location.toLowerCase())) {
    parts.push(location);
  }
  if (salaryWithUnit && !title.toLowerCase().includes(salaryWithUnit.toLowerCase())) {
    parts.push(salaryWithUnit);
  }
  if (primaryBenefit && !title.toLowerCase().includes(primaryBenefit.toLowerCase())) {
    parts.push(primaryBenefit);
  }
  return truncateSeoText(parts.join(' | '), 60);
}

export function buildJobSeoDescription(job: JobSeoInput): string {
  const title = cleanSeoText(job.title) || 'Građevinski posao';
  const location = cleanSeoText(job.location);
  const unit = formatJobPaymentUnit(job);
  const salary = formatJobSalarySummary(job);
  const salaryWithUnit = unit && salary && salary !== 'pozvati za platu' ? `${salary} / ${unit}` : salary;
  const benefits = formatJobBenefitSummary(job);
  const details = cleanSeoText(job.description);

  if (!details || details.toLowerCase() === 'opis posla nije dostupan.') {
    const fallback = [
      `${title}${location ? ` u ${location}` : ''}.`,
      salaryWithUnit ? `Plata: ${salaryWithUnit}.` : '',
      benefits ? `Nudi se: ${benefits}.` : '',
      'Pogledajte uslove i prijavite se direktno.',
    ].filter(Boolean).join(' ');
    return truncateSeoText(fallback, 155);
  }

  const lead = `${title}${location && !details.toLowerCase().includes(location.toLowerCase()) ? ` u ${location}` : ''}.`;
  const extras = [
    salaryWithUnit && !details.includes(salaryWithUnit) ? `Plata: ${salaryWithUnit}.` : '',
    benefits ? `Nudi se: ${benefits}.` : '',
  ].filter(Boolean).join(' ');
  const callToAction = 'Pogledajte uslove i prijavite se direktno.';
  const text = `${lead} ${extras} ${details} ${callToAction}`.replace(/\s+/g, ' ').trim();
  return truncateSeoText(text, 155);
}
