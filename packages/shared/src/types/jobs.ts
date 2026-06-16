import { BaseEntity } from './common';

export enum JobEngagement {
  FULL_TIME = 'full-time',
  PART_TIME = 'part-time',
  CONTRACT = 'contract',
  TEMPORARY = 'temporary'
}

export interface Job extends BaseEntity {
  title: string;
  description: string;
  company: string;
  companyId?: string | null;
  companyLogo?: string;
  location: string;
  locationSlug: string;
  sector: string;
  sectorSlug: string;
  profession: string;
  professionSlug: string;
  engagement: JobEngagement;
  engagementSlug: string;
  experience: string;
  experienceSlug: string;
  plataMin?: number;
  plataMax?: number;
  contactEmail?: string;
  contactPhone?: string;
  benefits?: string[];
  requirements?: string[];
  responsibilities?: string[];

  // Legacy fields (v0/v1 compatibility)
  in?: string;
  comp?: string;
  loc?: string;
  cat?: string;
  time?: string;
  app?: number;
  isUrgent?: boolean;
  isPremium?: boolean;
  paket?: string;
  logo?: string;
  viewsCount?: number;
  applicantsCount?: number;
  authorId?: string;
  authorName?: string;
  isCompanyVerified?: boolean;
  sal?: string | number;
  salary?: string | number;
  salaryType?: string;
  opis?: string;
  telefon?: string;
  viber?: string | boolean | null;
  whatsapp?: string | boolean | null;
  images?: string[];
  tacnaLokacija?: string;
  email?: string;
  dinamikaIsplate?: string;
}

export interface JobApplication extends BaseEntity {
  jobId: string;
  jobTitle: string;
  employerId: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  coverLetter: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  applicantData: {
    role?: string;
    city?: string;
    profileImage?: string;
    skillsSummary?: string;
    profileScore?: number;
  };
  
  // Legacy fields
  phone?: string;
  message?: string;
  applicantProfileImage?: string;
  applicantCity?: string;
  applicantProfileScore?: number;
  applicantRole?: string;
  applicantSkillsSummary?: string;
}

export type JobResponse = Job;
