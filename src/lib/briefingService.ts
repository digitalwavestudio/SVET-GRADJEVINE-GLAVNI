export interface BriefingUser {
  role?: string | null;
}

export interface BriefingRoleData {
  activeMetrics?: {
    pendingApplications?: number;
    totalAds?: number;
    totalApplications?: number;
  };
  nicheDetails?: {
    totalBeds?: number;
    availableBeds?: number;
    dailyCapacityMeals?: number;
  };
  smartMatches?: unknown[];
}

export function generateDailyBriefing(
  user: BriefingUser | null | undefined,
  roleData: BriefingRoleData | null | undefined,
  currentHour: number
): { greeting: string; briefing: string } {
  if (!user || !roleData) {
    return { greeting: 'DOBAR DAN', briefing: 'UČITAVANJE PODATAKA...' };
  }

  let greeting = 'DOBAR DAN';
  if (currentHour < 12) greeting = 'DOBRO JUTRO';
  else if (currentHour > 18) greeting = 'DOBRO VEČE';

  let briefing = '';
  const isEmployer = user.role === 'poslodavac';
  const isStandard = user.role === 'standard';

  if (isStandard) {
    briefing = 'AKTIVIRAJTE VAŠU ULOGU DA BISTE OTKLJUČALI SPECIFIČNE ALATE.';
    return { greeting, briefing };
  }

  if (isEmployer) {
    const pending = roleData.activeMetrics?.pendingApplications || 0;
    const totalAds = roleData.activeMetrics?.totalAds || 0;

    if (currentHour < 12) {
      if (pending > 0) briefing = `VREME JE ZA RASPODELU POSLA. IMATE ${pending} NOVIH PRIJAVA OD NOĆAS.`;
      else if (totalAds > 0) briefing = `SREĆAN RAD. VAŠI OGLASI SU AKTIVNI I GENERIŠU PREGLEDE.`;
      else briefing = `DOBAR POČETAK DANA! KREIRAJTE NOVI OGLAS DA PRONAĐETE RADNIKE.`;
    } else if (currentHour > 18) {
      if (pending > 0) briefing = `ZAVRŠETAK DANA. NE ZABORAVITE DA PREGLEDATE ${pending} NEODGOVORENIH PRIJAVA.`;
      else briefing = `EVO KRATKOG PRESEKA UČINKA VAŠIH OGLASA ZA DANAS.`;
    } else {
       if (totalAds > 0) briefing = `TRENUTNO IMATE ${totalAds} AKTIVNA OGLASA I ZVANIČNO STE AKTIVAN POSLODAVAC.`;
       else briefing = `SREĆAN RAD! KREIRAJTE OGLAS KAKO BI KANDIDATI MOGLI DA VAS PRONAĐU.`;
    }
  } else {
    // Radnik / Majstor
    const totalApps = roleData.activeMetrics?.totalApplications || 0;
    const matches = roleData.smartMatches?.length || 0;
    
    if (currentHour < 12) {
      if (matches > 0) briefing = `SREĆAN RAD. PRONAŠLI SMO ${matches} NOVIH OGLASA KOJI ODGOVARAJU VAŠOJ STRUCI.`;
      else briefing = `DOBAR POČETAK DANA! TRENUTNO IMATE ${totalApps} AKTIVNIH PRIJAVA.`;
    } else if (currentHour > 18) {
      briefing = `ODMORITE SE. POGLEDAJTE MESTA GDE MOŽETE DA KONKURIŠETE SUTRA.`;
    } else {
      if (matches > 0) briefing = `ODLIČNO NAPREDUJETE! IMATE ${matches} IDEALNIH PONUDA NA TRŽIŠTU.`;
      else briefing = `VAŠ PROFIL JE AKTIVAN. POGLEDAJTE NOVE OGLASE NA TRŽIŠTU.`;
    }
  }

  return { greeting, briefing };
}
