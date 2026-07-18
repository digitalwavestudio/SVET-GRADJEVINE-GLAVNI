import { admin } from "../config/firebase.ts";

export type AdStatus = "pending" | "active" | "pending_payment" | "inactive" | "draft" | "rejected" | "approved" | "deleted";

export interface AuthorSnapshot {
  displayName: string;
  photoURL: string;
  isVerified: boolean;
  role: string;
  companyName: string;
}

export interface AdLocation {
  address?: string;
  city?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface BaseAd {
  id: string;
  authorId: string;
  authorSnapshot: AuthorSnapshot;
  type: string;
  status: AdStatus;
  comp: string;
  logo: string;
  isCompanyVerified: boolean;
  isPremium: boolean;
  isUrgent: boolean;
  premiumUntil?: admin.firestore.Timestamp | null;
  createdAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
  updatedAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
  viewsCount: number;
  searchKeywords?: string[];
  _geoloc?: { lat: number; lng: number } | null;
  imageStatus?: "processing" | "ready";
  images?: string[];
  title?: string;
  description?: string;
  location?: AdLocation;
  grad?: string;
  city?: string;
}

export interface JobAd extends BaseAd {
  type: "job";
  category: "jobs";
  sector: string;
  profession: string;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  experience?: string;
  workType?: string;
  phone?: string;
  email?: string;
}

export interface RealEstateAd extends BaseAd {
  type: "realEstate";
  category: "real_estate";
  area?: number;
  rooms?: number;
  floor?: number;
}

export type Listing = JobAd | RealEstateAd | BaseAd;
