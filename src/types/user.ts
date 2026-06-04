export interface UserProfile {
  id: string;
  uid: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  role: string;
  isVerified?: boolean;
  company?: string;
  companyName?: string;
  phone?: string;
  businessProfile?: {
    logo?: string;
    description?: string;
    website?: string;
    address?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface FavoriteAd {
  adId: string;
  type: string;
  _type?: string;
}
