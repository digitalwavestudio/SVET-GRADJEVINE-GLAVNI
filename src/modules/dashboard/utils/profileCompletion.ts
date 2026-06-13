import { User } from '@/src/modules/core/types/user';

export const calculateProfileScore = (user: Partial<User> | null): number => {
  if (!user) return 0;

  const role = user.role || 'standard';
  let score = 0;

  // 1. Standard role (Običan korisnik)
  if (role === 'standard') {
    if (user.name || (user.firstName && user.lastName)) score += 30;
    if (user.phone) score += 30;
    if (user.photoURL) score += 20;
    if (user.emailVerified) score += 20;
    return Math.min(score, 100);
  }

  // 2. Majstor / Candidate (Fizički radnici i kandidati)
  if (role === 'majstor' || role === 'candidate') {
    if (user.name || (user.firstName && user.lastName)) score += 10;
    if (user.phone) score += 10;
    if (user.photoURL) score += 10;
    if (user.profession || user.cvData?.profession) score += 15;
    if ((user.description && user.description.length > 10) || (user.cvData?.about && user.cvData.about.length > 10)) score += 20;
    if (user.hasCV || user.cvData) score += 20;
    if ((user.licences && user.licences.length > 0) || user.availability) score += 15;
    return Math.min(score, 100);
  }

  // 3. Business roles (poslodavac, employer, kompanija, agencija, smestaj, ketering, placevi, masine, partner, admin)
  // Ime kontakt osobe / vlasnika profila
  if (user.firstName || user.lastName || user.name || user.displayName) score += 10;
  
  // Broj telefona
  if (user.phone) score += 10;
  
  // Logo firme ili profilna slika
  const logo = user.businessProfile?.logo || user.photoURL;
  if (logo) score += 15;
  
  // Naziv kompanije / objekta
  const companyName = user.company || user.companyName || user.businessProfile?.companyName || user.displayName || user.name;
  if (companyName) score += 15;
  
  // Opis delatnosti / o nama
  const aboutText = user.description || user.businessProfile?.about;
  if (aboutText && aboutText.length > 10) score += 20;
  
  // Lokacija / Adresa sedišta ili objekta
  const address = user.location || user.businessProfile?.address;
  if (address) score += 15;
  
  // PIB / MB / identifikacija za pravna lica (ili automatska verifikacija za partnere/admine)
  const hasPib = user.pib || user.mb || user.businessProfile?.pib || user.isVerified || role === 'admin';
  if (hasPib) score += 15;

  return Math.min(score, 100);
};
