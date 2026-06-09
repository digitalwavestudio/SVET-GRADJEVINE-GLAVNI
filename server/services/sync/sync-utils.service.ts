export class SyncUtils {
  static getAdUrl(category: string, id: string): string {
    const baseUrl = "https://svetgradjevine.com";
    switch (category) {
      case "jobs":
        return `${baseUrl}/posao/${id}`;
      case "machines":
      case "ostalo":
        return `${baseUrl}/gradjevinske-masine/srbija/ostalo/${id}`;
      case "accommodations":
        return `${baseUrl}/smestaj/srbija/ostalo/${id}`;
      case "caterings":
        return `${baseUrl}/ketering/provajder/${id}`;
      case "lands":
        return `${baseUrl}/placevi/srbija/ostalo/${id}`;
      case "equipments":
        return `${baseUrl}/alat-i-oprema/srbija/ostalo/${id}`;
      case "masters":
        return `${baseUrl}/majstori/profil/${id}`;
      case "companies":
        return `${baseUrl}/firme/profil/${id}`;
      default:
        return `${baseUrl}/oglas/${id}`;
    }
  }

  static shouldSyncToAlgolia(oldData: Record<string, any> | null | undefined, newData: Record<string, any> | null | undefined): { shouldSync: boolean; isPartial: boolean; changedFields: string[] } {
    if (!oldData || !newData) return { shouldSync: true, isPartial: false, changedFields: [] };

    const vitalFields = [
      "title",
      "price",
      "location",
      "locationSlug",
      "status",
      "tags",
      "isPremium",
      "isUrgent",
      "company",
      "companyId",
      "category",
      "type",
      "typeSlug",
      "salary",
      "plataMin",
      "plataMax",
      "kategorija",
      "potkategorija",
      "skills",
      "profession",
      "professionSlug",
      "beds",
      "roomType",
      "parkingAvailable",
      "invoiceAvailable",
      "cuisine",
      "machineType",
      "condition",
      "adType",
      "categoryId",
      "fuelType",
      "weightKg",
      "area",
      "purpose",
      "brand",
      "model",
      "city",
      "mainCategories",
      "employeeCount",
      "isVerified",
      "isPremiumPartner",
      "cateringType",
      "kitchenType",
      "dailyCapacityMeals",
      "minOrder",
      "accessRoad",
      "highwayAccess",
      "railAccess",
      "freeZone",
      "accommodationType",
      "tacnaLokacija",
      "areaM2",
      "viewsCount",
      "geopoint",
      "_geoloc",
    ];

    const changedFields: string[] = [];
    let isPartial = true;
    let shouldSync = false;

    const safePartialFields = new Set(["status", "viewsCount", "isPremium", "isUrgent", "updatedAt"]);

    for (const field of vitalFields) {
      const oldVal = oldData[field];
      const newVal = newData[field];

      if (oldVal === newVal) continue;

      let hasChanged = false;
      if (typeof oldVal === "object" || typeof newVal === "object") {
        if (JSON.stringify(oldVal || null) !== JSON.stringify(newVal || null)) {
          hasChanged = true;
        }
      } else {
        hasChanged = true;
      }

      if (hasChanged) {
        changedFields.push(field);
        shouldSync = true;
        if (!safePartialFields.has(field)) {
          isPartial = false;
        }
      }
    }

    return { shouldSync, isPartial, changedFields };
  }
}

