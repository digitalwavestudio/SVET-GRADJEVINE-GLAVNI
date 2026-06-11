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
