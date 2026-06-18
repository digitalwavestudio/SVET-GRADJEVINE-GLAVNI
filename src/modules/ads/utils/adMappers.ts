import { AdFormData } from '../hooks/usePostAdController';

export function mapEditItemToFormData(
  editType: string,
  editId: string,
  item: any,
  getValues: () => any
): Partial<AdFormData> | null {
  if (!item || item.id !== editId) return null;

  const currentValues = getValues();

  if (editType === 'plac' || editType === 'placevi') {
    return {
      ...currentValues,
      location: item.location || '',
      tacnaLokacija: item.address || '',
      opis: item.description || '',
      phone: item.contact?.phone || '',
      email: item.contact?.email || '',
      images: item.images || [],
      paket: item.isPremium ? 'premium' : (item.isUrgent ? 'urgent' : 'free'),
      plotArea: item.area?.toString() || '',
      plotAreaUnit: (item.areaUnit === 'ha' ? 'ha' : 'ari'),
      plotPrice: item.price?.toString() || '',
      plotCurrency: item.currency || 'EUR',
      plotPurpose: item.purpose || 'građevinsko',
      plotInfrastructure: { 
        struja: !!item.infrastructure?.electricity,
        voda: !!item.infrastructure?.water,
        kanalizacija: !!item.infrastructure?.sewer,
        gas: !!item.infrastructure?.gas,
        optika: !!item.infrastructure?.internet 
      },
      plotAccessRoad: (item.accessRoad === 'tucanik' ? 'tucanik' : (item.accessRoad === 'zemlja' ? 'zemljani' : 'asfalt')),
      plotCadastralNumber: item.cadastralNumber || '',
      plotCadastralMunicipality: item.cadastralMunicipality || '',
      plotOccupancy: item.occupancy?.toString() || '',
      plotBuildabilityIndex: item.buildabilityIndex?.toString() || '',
      plotMaxFloors: item.maxFloors?.toString() || '',
      plotNotes: item.notes || '',
      plotDocs: item.docs?.length ? item.docs : [{ label: '', url: '' }],
      plotHeating: item.heating || false,
      plotTelephone: item.telephone || false,
      plotTechnicalWater: item.technicalWater || false,
      plotDrinkingWater: item.drinkingWater || false,
      plotRailAccess: item.railAccess || false,
      plotHighwayAccess: item.highwayAccess || false,
      plotAirportAccess: item.airportAccess || false,
      plotPlannedPurpose: item.plannedPurpose || '',
      plotMinParcelSize: item.minParcelSize?.toString() || '',
      plotMaxParcelSize: item.maxParcelSize?.toString() || '',
      plotBuildingHeight: item.buildingHeight?.toString() || '',
      plotParkingStandard: item.parkingStandard || '',
      plotProductionParkingStandard: item.productionParkingStandard || '',
      plotParcelNumbers: item.parcelNumbers || '',
      plotMunicipalityName: item.municipalityName || '',
      plotPopulationEstimate: item.populationEstimate?.toString() || '',
      plotAverageSalary: item.averageSalary?.toString() || '',
      plotMarketValueEstimate: item.marketValueEstimate || '',
      plotDevelopmentFeeBusiness: item.developmentFeeBusiness || '',
      plotDevelopmentFeeResidential: item.developmentFeeResidential || '',
      plotFreeZone: item.freeZone || false,
      plotGreenEnergySuitable: item.greenEnergySuitable || false
    };
  }

  if (editType === 'masine' || editType === 'machine' || editType === 'gradjevinske-masine') {
    return {
      ...currentValues,
      machBrand: item.manufacturer || '',
      machModel: item.modelstr || '',
      machCategory: item.categoryId || '',
      machSubCategory: item.subcategoryId || '',
      machYear: item.year || '',
      machPower: item.powerKw || '',
      machHours: item.workingHours || '',
      machFuel: item.fuelType || '',
      machAdType: (item.adType === 'iznajmljivanje' ? 'iznajmljivanje' : 'prodaja'),
      machPrice: item.price !== 'Na upit' ? item.price : '',
      machPricePerDay: item.pricePerDay || '',
      machOperator: (item.operatorIncluded ? 'sa-rukovaocem' : 'bez-rukovaoca'),
      machWeight: item.weightKg || '',
      machWeightKg: item.weightKg?.toString() || '',
      machLengthMm: item.lengthMm?.toString() || '',
      machWidthMm: item.widthMm?.toString() || '',
      machHeightMm: item.heightMm?.toString() || '',
      machLoadCapacityKg: item.loadCapacityKg?.toString() || '',
      machBucketCapacityM3: item.bucketCapacityM3?.toString() || '',
      machMaxDigDepthMm: item.maxDigDepthMm?.toString() || '',
      machMaxReachMm: item.maxReachMm?.toString() || '',
      machServiceHistory: item.serviceHistory || '',
      machVideoUrl: item.videoUrl || '',
      location: item.locationSlug || '',
      phone: item.phone || '',
      whatsapp: item.whatsapp || false,
      images: item.images || [],
      paket: item.isPremium ? 'premium' : (item.isUrgent ? 'urgent' : 'free')
    };
  }

  if (editType === 'company' || editType === 'firma' || editType === 'poslodavac') {
    return {
      ...currentValues,
      companyName: item.name || '',
      companyPIB: item.pib || '',
      companyAddress: item.address || '',
      location: item.locationSlug || '',
      phone: item.phone || '',
      companyWorkingHours: item.workingHours || '',
      companyDescription: item.description || '',
      companyDescriptionValue: item.description || '',
      companyMainCats: item.mainCategories || [],
      companySubCats: item.subCategories || [],
      companyCoverage: (item.coverageType === 'regional' || item.coverageType === 'national' || item.coverageType === 'international') ? item.coverageType : 'local',
      companyCoverageValue: item.coverageValue || '',
      companyIG: item.instagram || '',
      companyFB: item.facebook || '',
      companyWeb: item.website || '',
      companyLogo: item.logo || '',
      images: item.images || [],
      companyEmployees: item.employeeCount || '1-5',
      companyPortfolioImages: item.portfolioImages || [],
      companyReferences: item.references?.join('\n') || '',
      companyLicenses: item.licenses?.join('\n') || '',
      companyCertifications: item.certifications?.join('\n') || '',
      companyEquipmentSummary: item.equipmentSummary || '',
      companyTeamSpecialties: item.teamSpecialties?.join('\n') || '',
      paket: item.isPremium ? 'premium' : (item.isUrgent ? 'urgent' : 'free')
    };
  }

  if (editType === 'smestaj' || editType === 'accommodation') {
    return {
      ...currentValues,
      accType: item.typeSlug || '',
      location: item.locationSlug || '',
      totalBeds: item.totalBeds?.toString() || '',
      availableBeds: item.availableBeds?.toString() || '',
      price: item.price || '',
      priceType: item.priceType || 'perPerson',
      amenities: item.amenities || [],
      opis: item.description || '',
      images: item.images || [],
      paket: item.isPremium ? 'premium' : (item.isUrgent ? 'urgent' : 'free'),
      accDistanceToSiteKm: item.distanceToSiteKm?.toString() || '',
      accParkingAvailable: item.parkingAvailable || false,
      accTruckAccess: item.truckAccess || false,
      accLaundryAvailable: item.laundryAvailable || false,
      accKitchenAvailable: item.kitchenAvailable || false,
      accWifiAvailable: item.wifiAvailable || false,
      accAirConditioning: item.airConditioning || false,
      accInvoiceAvailable: item.invoiceAvailable || false,
      accMinStayDays: item.minStayDays?.toString() || '',
      accContactPhone: item.contactPhone || ''
    };
  }

  if (editType === 'ketering' || editType === 'catering') {
    return {
      ...currentValues,
      catTitle: item.title || '',
      catKitchenType: item.kitchenType || '',
      location: item.locationSlug || '',
      tacnaLokacija: item.tacnaLokacija || '',
      catMinOrder: item.minOrder?.toString() || '',
      catPricePerMeal: item.pricePerMeal || '',
      catDeliveryZone: item.deliveryZone || '',
      amenities: item.amenities || [],
      opis: item.description || '',
      phone: item.telefon || item.contactPhone || '',
      images: item.images || [],
      paket: item.isPremium ? 'premium' : (item.isUrgent ? 'urgent' : 'free'),
      catInvoiceAvailable: item.invoiceAvailable || false,
      catHaccpCertified: item.haccpCertified || false,
      catPackagingIncluded: item.packagingIncluded || false,
      catDailyCapacityMeals: item.dailyCapacityMeals?.toString() || '',
      catContactPhone: item.contactPhone || '',
      catMenuItems: item.menuItems?.join('\n') || ''
    };
  }

  if (editType === 'job' || editType === 'posao') {
    const salStr = item.sal || item.salary || '';
    const salParts = salStr.toString().replace('€', '').split(' — ');
    const min = salParts[0]?.trim();
    const max = salParts[1]?.trim();
    
    return {
      ...currentValues,
      sector: item.sectorSlug || '',
      profession: item.professionSlug || '',
      location: item.locationSlug || '',
      plataMin: min || '',
      plataMax: max || '',
      dinamikaIsplate: 'mesecna', 
      iskustvo: item.experienceSlug || '',
      tipAngazmana: item.engagementSlug || 'puno-radno-vreme',
      benefits: item.benefits || [],
      opis: item.description || '', 
      phone: item.telefon || item.phone || '',
      email: '',
      paket: item.isPremium ? 'premium' : 'free'
    };
  }

  if (editType === 'marketplace' || editType === 'berza' || editType === 'alat-i-oprema') {
    return {
      ...currentValues,
      title: item.title || '',
      marketCategory: item.marketCategory || '',
      marketCondition: item.marketCondition || 'new',
      marketValue: item.price || '',
      location: item.locationSlug || '',
      tacnaLokacija: item.address || '',
      opis: item.description || '',
      images: item.images || [],
      phone: item.phone || item.telefon || '',
      paket: item.isPremium ? 'premium' : (item.isUrgent ? 'urgent' : 'free')
    };
  }

  return null;
}
