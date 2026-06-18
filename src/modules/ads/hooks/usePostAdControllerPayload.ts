export const applyPayloadTransform = (selectedCategory: string | null, sData: Record<string, any>, commonMeta: Record<string, any>): any => {
  const payload = { 
    ...commonMeta,
    description: sData.opis,
    images: sData.images,
    paket: sData.paket
  };

  if (selectedCategory === 'marketplace') {
    return {
      ...payload,
      opis: sData.opis,
      tacnaLokacija: sData.tacnaLokacija,
      location: sData.location,
      locationSlug: sData.location,
      
      marketCategory: sData.marketCategory,
      marketCondition: sData.marketCondition,
      marketValue: Number(sData.marketValue) || 0
    };
  } 
  
  if (selectedCategory === 'job') {
    return {
      ...payload,
      opis: sData.opis,
      tacnaLokacija: sData.tacnaLokacija,
      location: sData.location,
      locationSlug: sData.location,
      
      sector: sData.sector,
      profession: sData.profession,
      tipAngazmana: sData.tipAngazmana,
      iskustvo: sData.iskustvo,
      dinamikaIsplate: sData.dinamikaIsplate || 'Dogovor',
      plataMin: Number(sData.plataMin) || 0,
      plataMax: Number(sData.plataMax) || 0,
      
      salaryType: sData.salaryType,
      benefits: sData.benefits,
      phone: sData.kontaktTelefon || commonMeta.phone
    };
  } 
  
  if (selectedCategory === 'machines') {
    return {
      ...payload,
      opis: sData.opis,
      tacnaLokacija: sData.tacnaLokacija,
      location: sData.location,
      locationSlug: sData.location,
      
      machBrand: sData.machBrand,
      machModel: sData.machModel,
      machAdType: sData.machAdType,
      machCategory: sData.machCategory,
      machSubCategory: sData.machSubCategory,
      machYear: Number(sData.machYear) || 0,
      machHours: Number(sData.machHours) || 0,
      machFuel: sData.machFuel,
      machPrice: Number(sData.machPrice) || 0,
      machPricePerDay: Number(sData.machPricePerDay) || 0,
      currency: sData.currency || 'EUR'
    };
  } 
  
  if (selectedCategory === 'accommodation') {
    return {
      ...payload,
      opis: sData.opis,
      tacnaLokacija: sData.tacnaLokacija,
      location: sData.location,
      locationSlug: sData.location,
      
      accType: sData.accType,
      price: Number(sData.price) || 0,
      totalBeds: Number(sData.totalBeds) || 0,
      availableBeds: Number(sData.availableBeds) || 0,
      invoiceAvailable: sData.accInvoiceAvailable,
      parkingAvailable: sData.accParkingAvailable,
      wifiAvailable: sData.accWifiAvailable,
      
      // additional passed silently just in case:
      accDistanceToSiteKm: Number(sData.accDistanceToSiteKm) || 0,
      accMinStayDays: Number(sData.accMinStayDays) || 0,
      accContactPhone: sData.accContactPhone
    };
  } 
  
  if (selectedCategory === 'catering') {
    return {
      ...payload,
      opis: sData.opis,
      tacnaLokacija: sData.tacnaLokacija,
      location: sData.location,
      locationSlug: sData.location,
      
      catKitchenType: sData.catKitchenType,
      catMinOrder: Number(sData.catMinOrder) || 0,
      catPricePerMeal: Number(sData.catPricePerMeal) || 0,
      deliveryAvailable: sData.catDeliveryAvailable || false,
      
      // Additional tracking fields
      catDeliveryZone: sData.catDeliveryZone,
      catInvoiceAvailable: sData.catInvoiceAvailable,
      catDailyCapacityMeals: Number(sData.catDailyCapacityMeals) || 0,
      catMenuItems: sData.catMenuItems?.split('\n').filter((i: string) => i.trim()) || [],
      catContactPhone: sData.catContactPhone
    };
  } 
  
  if (selectedCategory === 'plot') {
    return {
      ...payload,
      opis: sData.opis,
      tacnaLokacija: sData.tacnaLokacija,
      location: sData.location,
      locationSlug: sData.location,
      
      plotArea: Number(sData.plotArea) || 0,
      plotAreaUnit: sData.plotAreaUnit,
      plotPurpose: sData.plotPurpose || sData.plotPlannedPurpose || 'Razno',
      plotPrice: Number(sData.plotPrice) || 0,
      plotCurrency: sData.plotCurrency || 'EUR',
      plotAccessRoad: sData.plotAccessRoad,
      
      // Infrastructure mapping
      infrastructure: {
        electricity: !!sData.plotInfrastructure?.struja,
        water: !!sData.plotInfrastructure?.voda,
        sewer: !!sData.plotInfrastructure?.kanalizacija,
        gas: !!sData.plotInfrastructure?.gas,
        internet: !!sData.plotInfrastructure?.optika
      },

      // Additional plot flags
      heating: !!sData.plotHeating,
      telephone: !!sData.plotTelephone,
      technicalWater: !!sData.plotTechnicalWater,
      drinkingWater: !!sData.plotDrinkingWater,
      railAccess: !!sData.plotRailAccess,
      highwayAccess: !!sData.plotHighwayAccess,
      airportAccess: !!sData.plotAirportAccess,
      plannedPurpose: sData.plotPlannedPurpose,
      freeZone: !!sData.plotFreeZone,
      greenEnergySuitable: !!sData.plotGreenEnergySuitable,
      cadastralNumber: sData.plotCadastralNumber,
      cadastralMunicipality: sData.plotCadastralMunicipality,
      municipalityName: sData.plotMunicipalityName,
      averageSalary: Number(sData.plotAverageSalary) || 0,
      marketValueEstimate: sData.plotMarketValueEstimate,
      developmentFeeBusiness: sData.plotDevelopmentFeeBusiness,
      docs: sData.plotDocs,
      notes: sData.plotNotes,

      // Keep others for outbox / details
      plotOccupancy: Number(sData.plotOccupancy) || 0,
      plotBuildabilityIndex: Number(sData.plotBuildabilityIndex) || 0,
      plotMaxFloors: Number(sData.plotMaxFloors) || 0,
      plotAreaValue: Number(sData.plotArea) || 0
    };
  } 
  
  if (selectedCategory === 'company') {
    return {
      ...payload,
      opis: sData.companyDescription || sData.opis || 'Kratak opis kompanije.',
      tacnaLokacija: sData.companyAddress || sData.tacnaLokacija || 'N/A',
      location: sData.location || 'N/A',
      
      companyName: sData.companyName,
      companyPIB: sData.companyPIB,
      companyAddress: sData.companyAddress,
      companyDescription: sData.companyDescription,
      phone: sData.phone || sData.kontaktTelefon || 'N/A',
      companyWorkingHours: sData.companyWorkingHours,
      companyIG: sData.companyIG,
      companyFB: sData.companyFB,
      companyWeb: sData.companyWeb,
      companyMainCats: sData.companyMainCats || [],
      companySubCats: sData.companySubCats || [],
      companyCoverage: sData.companyCoverage,
      companyCoverageValue: sData.companyCoverageValue,
      companyEmployees: sData.companyEmployees || '1-10',
      companyPortfolioImages: sData.companyPortfolioImages || [],
      logo: sData.companyLogo,
      website: sData.companyWeb,
      images: sData.images || []
    };
  }
  
  return payload;
};
