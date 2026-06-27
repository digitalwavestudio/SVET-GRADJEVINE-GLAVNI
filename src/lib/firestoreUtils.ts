
/**
 * Utility to scrub data before sending to Firestore.
 * Ensures we only send whitelisted fields to avoid rule violations.
 */

export const USER_WHITELIST = [
  'firstName', 'lastName', 'bio', 'photoURL', 'phoneNumber', 'city', 
  'profession', 'experience', 'skills', 'education', 'languages', 
  'socialLinks', 'updatedAt', 'isVerified', 'status', 'syncStatus', 
  'lastSyncedAt', 'freeAdsCount', 'promotedAdsCount', 'id', 'uid', 'name'
];

export const ADS_WHITELIST = [
  'title', 'description', 'locationSlug', 'sectorSlug', 'professionSlug', 
  'plataMin', 'plataMax', 'benefits',
  'categorySlug', 'brandSlug', 'price', 'priceType', 'weightKg', 'year',
  'areaM2', 'totalBeds', 'availableBeds', 'amenities', 'images', 'updatedAt',
  'typeSlug', 'pricePerMeal', 'status'
];

export function scrubData(data: Record<string, unknown>, whitelist: string[]): Record<string, unknown> {
  const scrubbed: Record<string, unknown> = {};
  whitelist.forEach(key => {
    if (key in data) {
      scrubbed[key] = data[key];
    }
  });
  return scrubbed;
}
