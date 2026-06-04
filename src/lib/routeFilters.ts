import { LOCATIONS } from '@/src/constants/taxonomy';
import { APP_CONFIG } from '@/src/constants/config';

export interface BaseFilters {
  locationSlug: string | null;
  professionSlug: string | null;
  sectorSlug: string | null;
  categorySlug: string | null;
  purposeSlug: string | null;
  typeSlug: string | null;
}

export const resolveRouteFilters = (type: string, params: { grad?: string; zanimanje?: string; kategorija?: string; namena?: string; tip?: string } = {}) => {
  const { grad: routeGrad, zanimanje: routeZanimanje, kategorija: routeKategorija, namena: routeNamena, tip: routeTip } = params || {};
  
  const filters: BaseFilters = {
    locationSlug: null,
    professionSlug: null,
    sectorSlug: null,
    categorySlug: null,
    purposeSlug: null,
    typeSlug: null
  };

  if (type === 'poslovi' || type === 'majstori') {
    // Resolve route ambiguity (because /poslovi/:zanimanje matches /poslovi/beograd too)
    const isZanimanjeActuallyGrad = routeZanimanje && !routeGrad && LOCATIONS.some(l => l.slug === routeZanimanje);
    filters.locationSlug = isZanimanjeActuallyGrad ? routeZanimanje || null : routeGrad || null;
    filters.professionSlug = isZanimanjeActuallyGrad ? null : routeZanimanje || null;
  } else if (type === 'masine') {
    const isKategorijaActuallyGrad = routeKategorija && !routeGrad && LOCATIONS.some(l => l.slug === routeKategorija);
    filters.locationSlug = isKategorijaActuallyGrad ? routeKategorija || null : routeGrad || null;
    filters.categorySlug = isKategorijaActuallyGrad ? null : routeKategorija || null;
  } else if (type === 'alat-i-oprema') {
    const isKategorijaActuallyGrad = routeKategorija && !routeGrad && LOCATIONS.some(l => l.slug === routeKategorija);
    filters.locationSlug = isKategorijaActuallyGrad ? routeKategorija || null : routeGrad || null;
    filters.categorySlug = isKategorijaActuallyGrad ? null : routeKategorija || null;
  } else if (type === 'placevi') {
    const isNamenaActuallyGrad = routeNamena && !routeGrad && LOCATIONS.some(l => l.slug === routeNamena);
    filters.locationSlug = isNamenaActuallyGrad ? routeNamena || null : routeGrad || null;
    filters.purposeSlug = isNamenaActuallyGrad ? null : routeNamena || null;
  } else if (type === 'smestaj') {
    const isTipActuallyGrad = routeTip && !routeGrad && LOCATIONS.some(l => l.slug === routeTip);
    filters.locationSlug = isTipActuallyGrad ? routeTip || null : routeGrad || null;
    filters.typeSlug = isTipActuallyGrad ? null : routeTip || null;
  } else if (type === 'ketering' || type === 'firme') {
     filters.locationSlug = routeGrad || null;
  }

  return filters;
};

export const getCanonicalPath = (type: string, filters?: BaseFilters) => {
  if (type === 'home') return `${APP_CONFIG.BASE_URL}/`;
  
  const parts = [type];
  
  if (type === 'poslovi' && filters?.professionSlug) parts.push(filters.professionSlug);
  if (type === 'majstori' && filters?.professionSlug) parts.push(filters.professionSlug);
  if (type === 'masine' && filters?.categorySlug) parts.push(filters.categorySlug);
  if (type === 'alat-i-oprema' && filters?.categorySlug) parts.push(filters.categorySlug);
  if (type === 'placevi' && filters?.purposeSlug) parts.push(filters.purposeSlug);
  if (type === 'smestaj' && filters?.typeSlug) parts.push(filters.typeSlug);
  
  if (filters?.locationSlug) parts.push(filters.locationSlug);
  
  return `${APP_CONFIG.BASE_URL}/${parts.join('/')}`;
};

export const getJobLink = (id: string) => `/posao/${id}`;
export const getFirmLink = (id: string) => `/firma/${id}`;
export const getUserLink = (id: string) => `/profil/${id}`;
export const getMachineLink = (id: string) => `/gradjevinske-masine/${id}`;
export const getAccommodationLink = (id: string) => `/smestaj/${id}`;
export const getCateringLink = (id: string) => `/ketering/provajder/${id}`;
export const getPlotLink = (id: string) => `/placevi/${id}`;
export const getMarketplaceLink = (id: string) => `/alat-i-oprema/${id}`;
