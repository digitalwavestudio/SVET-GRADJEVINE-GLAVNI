import { z } from 'zod';

export const jobSchema = z.object({
  sector: z.string().optional().or(z.literal('')),
  profession: z.string().optional().or(z.literal('')),
  tipAngazmana: z.string().optional().or(z.literal('')),
  iskustvo: z.string().optional().or(z.literal('')),
  dinamikaIsplate: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  title: z.string().max(100, "Naslov je predugačak").optional().or(z.literal('')),
  description: z.string().max(10000, "Opis je predugačak").optional().or(z.literal('')),
  opis: z.string().max(10000, "Opis je predugačak").optional().or(z.literal('')),
  location: z.string().min(1, "Lokacija je obavezna"),
  locationSlug: z.string().optional().or(z.literal('')),
  locationName: z.string().optional().or(z.literal('')),
  sectorSlug: z.string().optional().or(z.literal('')),
  professionSlug: z.string().optional().or(z.literal('')),
  engagementSlug: z.string().optional().or(z.literal('')),
  experienceSlug: z.string().optional().or(z.literal('')),
  type: z.string().optional().or(z.literal('')),
  salary: z.string().optional().or(z.literal('')),
  salaryType: z.string().optional().or(z.literal('')),
  plataMin: z.coerce.number().optional().nullable().or(z.literal('')),
  plataMax: z.coerce.number().optional().nullable().or(z.literal('')),
  logo: z.string().or(z.literal('')).optional(),
  logoPlaceholder: z.string().optional(),
  telefon: z.string().optional().or(z.literal('')),
  viber: z.union([z.string(), z.boolean(), z.null()]).optional(),
  whatsapp: z.union([z.string(), z.boolean(), z.null()]).optional(),
  images: z.array(z.string()).optional(),
  tacnaLokacija: z.string().optional().or(z.literal('')),
  benefits: z.array(z.string()).optional(),
  benefiti: z.array(z.string()).optional(),
  rawBenefits: z.array(z.string()).optional(),
  smestaj: z.boolean().optional(),
  prevoz: z.boolean().optional(),
  hrana: z.boolean().optional(),
  housing: z.boolean().optional(),
  transport: z.boolean().optional(),
  food: z.boolean().optional(),
  topliObrok: z.boolean().optional(),
  email: z.string().email().or(z.literal('')).optional().or(z.null()),
  status: z.enum(['active', 'approved', 'pending', 'pending_payment', 'rejected', 'draft', 'archived']).optional(),
  companyId: z.string().nullable().optional(),
  paket: z.string().optional(),
  isPremium: z.boolean().optional(),
  isUrgent: z.boolean().optional(),
  isPremiumPartner: z.boolean().optional(),
  comp: z.string().optional(),
  sal: z.string().optional(),
  cat: z.string().optional(),
  loc: z.string().optional(),
  time: z.string().optional(),
  name: z.string().optional(),
  viewsCount: z.number().optional(),
  categorySlug: z.string().optional(),
  categoryId: z.string().optional(),
  isCompanyVerified: z.boolean().optional(),
});

export const jobSearchSchema = z.object({
  searchQuery: z.string().optional(),
  filters: z.object({
    locationSlug: z.string().optional(),
    professionSlug: z.string().optional(),
    sector: z.string().optional(),
    engagement: z.string().optional(),
    experience: z.string().optional(),
    minSalary: z.number().optional(),
    maxSalary: z.number().optional(),
    isPremium: z.boolean().optional(),
    isUrgent: z.boolean().optional(),
    isPremiumPartner: z.boolean().optional(),
    isVerified: z.boolean().optional(),
    showAllStatuses: z.boolean().optional(),
    status: z.string().optional(),
    companyId: z.string().optional()
  }).optional(),
  lastVisibleId: z.string().nullable().optional(),
  pageSize: z.number().min(1).max(100).optional()
});

export const applicationSchema = z.object({
  jobId: z.string().max(128),
  coverLetter: z.string().max(5000).optional(),
  phone: z.string().regex(/^\+?[0-9\s\-()]{6,20}$/, "Neispravan format telefona").optional(),
  applicantData: z.object({
    role: z.string().optional(),
    city: z.string().optional(),
    profileImage: z.string().optional(),
    skillsSummary: z.string().optional(),
    profileScore: z.number().optional()
  }).optional()
});

export const businessProfileSchema = z.object({
  companyName: z.string().min(2, "Naziv firme je prekratak"),
  companyPIB: z.string().optional().or(z.literal('')),
  companyAddress: z.string().optional().or(z.literal('')),
  companyDescription: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  companyIG: z.string().optional(),
  companyFB: z.string().optional(),
  companyWeb: z.string().optional().or(z.literal('')),
  companyPortfolioImages: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  location: z.string().optional().or(z.literal('')),
  logo: z.string().or(z.literal('')).optional(),
  website: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  coverImage: z.string().optional().or(z.literal('')),
  facebook: z.string().optional().or(z.literal('')),
  instagram: z.string().optional().or(z.literal('')),
  name: z.string().optional(),
  pib: z.string().optional(),
  description: z.string().optional(),
  locationSlug: z.string().optional(),
  portfolioImages: z.array(z.string()).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

export const cvDataSchema = z.object({
  education: z.array(z.object({
    school: z.string(),
    degree: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  })).optional(),
  experience: z.array(z.object({
    company: z.string(),
    position: z.string(),
    from: z.string().optional(),
    to: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
  skills: z.array(z.string()).optional(),
  languages: z.array(z.object({
    language: z.string(),
    level: z.string().optional(),
  })).optional(),
});

export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const registerSchema = z.object({
  email: z.string().email('Nevažeći email'),
  password: z.string().regex(
    passwordRegex, 
    'Lozinka mora imati barem 8 karaktera, uključujući velika i mala slova i barem jednu cifru.'
  ),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.string().optional()
});

export const userProfileSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  name: z.string().max(200).optional(),
  phone: z.string().optional(),
  description: z.string().max(10000).optional(),
  facebook: z.string().url().or(z.literal('')).optional(),
  instagram: z.string().url().or(z.literal('')).optional(),
  mb: z.string().max(20).optional(),
  pib: z.string().max(20).optional(),
  licences: z.array(z.string()).optional(),
  photoURL: z.string().or(z.literal('')).optional(),
  company: z.string().max(200).optional(),
  profession: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  bio: z.string().max(5000).optional(),
  businessProfile: businessProfileSchema.partial().optional(),
  cvData: cvDataSchema.optional(),
  profileScore: z.number().optional(),
  hasCV: z.boolean().optional(),
  availability: z.string().optional(),
  events: z.array(z.object({
    date: z.string(),
    status: z.enum(['free', 'busy', 'maintenance'])
  })).optional(),
  // isVerified, role, status are explicitly removed from this user-facing update schema
});

// Admin-only profile update schema
export const userProfileAdminUpdateSchema = userProfileSchema.extend({
  isVerified: z.boolean().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
});

export const messageSchema = z.object({
  chatId: z.string().min(1, "Chat ID je obavezan"),
  content: z.string()
    .min(1, "Poruka ne može biti prazna")
    .max(5000, "Poruka je predugačka")
    .refine((val) => !/<[^>]*>/g.test(val), { message: "HTML tagovi nisu dozvoljeni iz bezbednosnih razloga" }),
  recipientId: z.string().min(1, "Primalac je obavezan"),
  // Note: senderId and timestamps will be securely added by the backend
});

// <div id="hydrate-fallback">Učitavanje…</div>

export const calendarEventSchema = z.object({
  title: z.string().min(1, "Naslov je obavezan").max(200),
  description: z.string().max(2000).optional(),
  date: z.string().datetime({ message: "Neispravan format datuma" }),
  type: z.enum(['meeting', 'task', 'reminder', 'other']).optional(),
});

export const saveDiarySchema = z.object({
  day: z.number().int().min(1).max(31),
  month: z.number().int().min(0).max(11),
  year: z.number().int().min(2000).max(2100),
  content: z.string().max(5000),
});

export const constructionSiteSchema = z.object({
  name: z.string().min(1, "Naziv gradilišta je obavezan").max(200),
  location: z.string().min(1, "Lokacija je obavezna").max(200),
  status: z.enum(['active', 'completed', 'paused', 'planning']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  notes: z.string().max(5000).optional(),
  budget: z.number().nonnegative().optional(),
  // Additional secure fields
});

export const constructionWorkerSchema = z.record(z.string(), z.unknown());
export const constructionResourceSchema = z.record(z.string(), z.unknown());
export const constructionMetricSchema = z.record(z.string(), z.unknown());

export const verifyUserSchema = z.object({
  targetUserId: z.string().min(1),
  isVerified: z.boolean()
});

export const masterSearchSchema = z.object({
  filters: z.object({
    profession: z.string().optional(),
    sector: z.string().optional(),
    location: z.string().optional(),
    search: z.string().optional()
  }).optional(),
  lastVisibleId: z.string().nullable().optional()
});

export const adBaseSchema = z.object({
  opis: z.string().min(10, "Opis mora imati barem 10 karaktera").optional(),
  tacnaLokacija: z.string().optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(10000).optional(),
  location: z.string().min(1),
  locationSlug: z.string().optional(),
  images: z.array(z.string()).optional(),
  phone: z.string().optional(),
  viber: z.boolean().optional(),
  whatsapp: z.boolean().optional(),
  status: z.enum(['active', 'approved', 'pending', 'pending_payment', 'rejected', 'draft', 'archived']).optional(),
  paket: z.string().optional(),
});

// TODO: Schema keys need to be mapped to interface keys (e.g., machBrand→brand) in the adapter layer
export const machineSchema = adBaseSchema.extend({
  machBrand: z.string().min(1, "Marka je obavezna"),
  machModel: z.string().min(1, "Model je obavezan"),
  machAdType: z.string().min(1, "Tip oglasa je obavezan"),
  machCategory: z.string().min(1, "Kategorija je obavezna"),
  machSubCategory: z.string().min(1, "Podkategorija je obavezna"),
  machYear: z.coerce.number().min(1900, "Neispravna godina").max(new Date().getFullYear() + 1, "Godina ne može biti u dalekoj budućnosti"),
  machHours: z.coerce.number().min(0, "Radni sati ne mogu biti negativni"),
  machFuel: z.string().min(1, "Gorivo je obavezno"),
  machPrice: z.coerce.number().optional().or(z.literal(0)),
  machPricePerDay: z.coerce.number().optional().or(z.literal(0)),
  currency: z.string().default('EUR'),
});



export const realEstateSchema = adBaseSchema.extend({
  area: z.coerce.number().min(1, "Površina mora biti veća od 0"),
  areaUnit: z.enum(['ari', 'ha']).optional(),
  purpose: z.string().min(1, "Namena je obavezna"),
  price: z.coerce.number().optional().or(z.literal(0)),
  currency: z.string().default('EUR'),
  mainImage: z.string().url("Neispravan URL glavne slike").optional().or(z.literal('')),
  contactPhone: z.string().min(6, "Neispravan format telefona").optional().or(z.literal('')),
  contactEmail: z.string().email("Neispravan format email-a").optional().or(z.literal('')),
  accessRoad: z.union([z.boolean(), z.enum(['asfalt', 'tucanik', 'zemlja'])]).optional(),
  infrastructure: z.union([
    z.object({
      electricity: z.boolean().optional(),
      water: z.boolean().optional(),
      sewer: z.boolean().optional(),
      gas: z.boolean().optional(),
      internet: z.boolean().optional(),
      telephone: z.boolean().optional(),
      technicalWater: z.boolean().optional(),
      drinkingWater: z.boolean().optional(),
    }),
    z.array(z.string())
  ]).optional(),
  highwayAccess: z.boolean().optional(),
  railAccess: z.boolean().optional(),
  freeZone: z.boolean().optional(),
  cadastralNumber: z.string().optional(),
  cadastralMunicipality: z.string().optional(),
  occupancy: z.coerce.number().optional(),
  buildabilityIndex: z.coerce.number().optional(),
  maxFloors: z.coerce.number().optional(),
  notes: z.string().optional(),
  
  // Legacy support
  plotArea: z.coerce.number().optional(),
  plotAreaUnit: z.string().optional(),
  plotPurpose: z.string().optional(),
  plotPrice: z.coerce.number().optional(),
  plotCurrency: z.string().optional(),
  plotAccessRoad: z.string().optional(),
});


export const moderateAdSchema = z.object({
  category: z.enum(['jobs', 'companies']),
  id: z.string().min(1),
  action: z.enum(['approve', 'reject', 'pause', 'active']),
  reason: z.string().optional()
});

export const createAdSchema = z.discriminatedUnion('category', [
  z.object({ category: z.literal('jobs'), data: jobSchema }),
  z.object({ category: z.literal('companies'), data: businessProfileSchema })
]);

export const updateAdSchema = z.discriminatedUnion('category', [
  z.object({ category: z.literal('jobs'), data: jobSchema.partial() }),
  z.object({ category: z.literal('companies'), data: businessProfileSchema.partial() })
]);

export const checkoutSchema = z.object({
  packageId: z.string().min(1),
  amount: z.number().positive(),
  promocode: z.string().optional()
});

export const applicationActionSchema = z.object({
  status: z.enum(['pending', 'accepted', 'rejected', 'review'])
});

export const reportSchema = z.object({
  targetId: z.string().min(1),
  reason: z.string().min(1).max(1000)
});

export const notificationActionSchema = z.object({
  activity: z.record(z.string(), z.unknown())
});

export const supportSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  subject: z.string().optional(),
  message: z.string().min(1).max(5000),
  phone: z.string().optional()
});

export const partnerSchema = z.object({
  partnerId: z.string().min(1)
});

export const messagesSendSchema = z.object({
  receiverId: z.string().min(1),
  text: z.string().min(1).max(5000)
});

export const presenceSchema = z.object({
  status: z.enum(['online', 'offline', 'away'])
});

export const updatePackageSchema = z.object({
  packageId: z.string().min(1),
  duration: z.number().int().positive()
});

export const adminActionSchema = z.object({
  action: z.enum(['approve', 'delete', 'premium'])
});

export const migrateProfileSchema = z.object({
  name: z.string().optional(),
  photoURL: z.string().max(2083).or(z.literal('')).optional()
});

export const viewMetricSchema = z.object({
  collectionName: z.enum(['jobs', 'companies', 'users']),
  targetId: z.string().min(1)
});
