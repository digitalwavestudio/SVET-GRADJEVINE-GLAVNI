import { db } from "../../config/firebase.ts";
import { CacheService } from "../cache.service.ts";
import { ImageTransformer } from "../../utils/image.transformer.ts";
import { 
  UserMatchProfileSchema, 
  UserMatchProfileDTO,
  SmartMatchItemDTO,
  ApplicationItemDTO 
} from "../../dto/dashboard.dto.ts";
import { 
  smartMatchesMemoryCache, 
  jobTokensLRU, 
  userProfileTokensLRU, 
  stringsToIds 
} from "./dashboard-lru.ts";

export type UserMatchProfile = UserMatchProfileDTO;

interface SmartMatchResult {
  smartMatches: SmartMatchItemDTO[];
  recentApplications: ApplicationItemDTO[];
}

export class DashboardSmartMatchService {
  static async getSmartMatches(user: UserMatchProfile) {
    const parsedUser = UserMatchProfileSchema.parse(user);
    const uid = parsedUser.uid || parsedUser.id;
    if (!uid) return [];
    
    const cacheKey = `smart_matches:${uid}`;
    const thirtyMinutesTtl = 30 * 60 * 1000;

    try {
      const result = await CacheService.getOrSetSWR<SmartMatchResult>(
        cacheKey,
        async () => {
          // 1. Memory Check
          const memoryCached = smartMatchesMemoryCache.get(uid);
          if (memoryCached) {
            return memoryCached;
          }

          const poolKey = "global_smart_matches_pool";
          let availableJobs = await CacheService.get<SmartMatchItemDTO[]>(poolKey);
          let recentApplications: ApplicationItemDTO[] = [];
          let isFirestoreHealthy = true;

          try {
            if (!availableJobs) {
              // Osiguravamo maksimalni limit od 50 dokumenata kako bismo izbegli skeniranje cele kolekcije (Firestore Cost Discipline)
              const qSmartJobs = db
                .collection("listings")
                .where("type", "==", "job")
                .where("status", "==", "active")
                .orderBy("createdAt", "desc")
                .limit(50);

              const snap = await qSmartJobs.get();
              availableJobs = snap.docs.map((d) =>
                ImageTransformer.transformDocumentImages({ id: d.id, ...d.data() })
              ) as SmartMatchItemDTO[];
              await CacheService.set(poolKey, availableJobs, 30 * 60 * 1000); // 30 min Index cache
            }
          } catch (err: unknown) {
            console.warn("[DashboardService] Failed to load smart matches pool:", (err as Error).message);
            isFirestoreHealthy = false;
          }

          if (isFirestoreHealthy) {
            try {
              const appsSnap = await db
                .collection("applications")
                .where("candidateId", "==", uid)
                .orderBy("createdAt", "desc")
                .limit(5)
                .get();

              recentApplications = appsSnap.docs.map((d) => ({
                id: d.id,
                ...d.data(),
              })) as ApplicationItemDTO[];
            } catch (err: unknown) {
              console.warn("[DashboardService] Failed to fetch candidate applications:", (err as Error).message);
            }
          }

          // Fallback Mock Builder
          if (!isFirestoreHealthy || (process.env.NODE_ENV !== "production" && (!availableJobs || availableJobs.length === 0))) {
            availableJobs = [
              { id: "mock_job_1", title: "Zidar / Tesar", type: "job", status: "active", location: "Beograd", city: "Beograd", requirements: "Zidar", createdAt: new Date() },
              { id: "mock_job_2", title: "Armirač", type: "job", status: "active", location: "Novi Sad", city: "Novi Sad", requirements: "Armirač", createdAt: new Date() }
            ];
            recentApplications = [
              { id: "mock_app_m_1", jobTitle: "Zidar / Tesar", status: "pending", createdAt: new Date().toISOString() }
            ];
          }

          // 3. High-Performance Token Inverted Index Matching Algorithm
          const invertedIndex = new Map<number, string[]>(); // tokenId -> jobId[]
          const jobMap = new Map<string, SmartMatchItemDTO>();

          const normalize = (text: string) => {
            return (text || "")
              .toLowerCase()
              .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ")
              .split(/\s+/)
              .filter(t => t.length > 2);
          };

          const jobs = availableJobs || [];
          let iterationCount = 0;
          for (const j of jobs) {
            if (iterationCount++ % 100 === 0) {
              await new Promise((resolve) => setImmediate(resolve));
            }
            if (!j.id) continue;
            jobMap.set(j.id, j);

            let cachedIds = jobTokensLRU.get(j.id);
            if (!cachedIds) {
              cachedIds = {
                title: stringsToIds(normalize(j.title || "")),
                requirements: stringsToIds(normalize(j.requirements || "")),
                city: stringsToIds(normalize(j.city || "")),
                location: stringsToIds(normalize(j.location || ""))
              };
              jobTokensLRU.set(j.id, cachedIds);
            }

            const tokenIds = new Set<number>();
            (cachedIds.title || []).forEach(id => tokenIds.add(id));
            (cachedIds.requirements || []).forEach(id => tokenIds.add(id));
            (cachedIds.city || []).forEach(id => tokenIds.add(id));
            (cachedIds.location || []).forEach(id => tokenIds.add(id));

            for (const tid of tokenIds) {
              if (!invertedIndex.has(tid)) {
                invertedIndex.set(tid, []);
              }
              invertedIndex.get(tid)!.push(j.id);
            }
          }

          const candidateJobScores = new Map<string, number>();
          const profession = parsedUser.profession || parsedUser.displayName || "";
          const city = parsedUser.city || parsedUser.location || "";
          const userCacheKey = `${uid}:${profession}:${city}`;

          let cachedUserTokenIds = userProfileTokensLRU.get(userCacheKey);
          if (!cachedUserTokenIds) {
            cachedUserTokenIds = {
              profession: stringsToIds(normalize(profession)),
              city: stringsToIds(normalize(city))
            };
            userProfileTokensLRU.set(userCacheKey, cachedUserTokenIds);
          }

          const userProfessionTokenIds = cachedUserTokenIds.profession;
          const userCityTokenIds = cachedUserTokenIds.city;

          for (const tid of userProfessionTokenIds) {
            const matchIds = invertedIndex.get(tid);
            if (matchIds) {
              for (const id of matchIds) {
                const currentScore = candidateJobScores.get(id) || 50;
                candidateJobScores.set(id, currentScore + 25);
              }
            }
          }

          for (const tid of userCityTokenIds) {
            const matchIds = invertedIndex.get(tid);
            if (matchIds) {
              for (const id of matchIds) {
                const currentScore = candidateJobScores.get(id) || 50;
                candidateJobScores.set(id, currentScore + 15);
              }
            }
          }

          const smartMatches: SmartMatchItemDTO[] = [];
          candidateJobScores.forEach((score, id) => {
            const j = jobMap.get(id);
            if (j && score >= 60) {
              smartMatches.push({
                ...j,
                matchRate: Math.min(score, 99)
              });
            }
          });

          const isFallbackActive = smartMatches.length === 0;
          if (isFallbackActive && jobs.length > 0) {
            for (const j of jobs.slice(0, 3)) {
              smartMatches.push({
                ...j,
                matchRate: 60
              });
            }
          }

          const finalSmartMatches = smartMatches
            .sort((a, b) => (b.matchRate || 0) - (a.matchRate || 0))
            .slice(0, isFallbackActive ? 3 : 5);

          const res: SmartMatchResult = { smartMatches: finalSmartMatches, recentApplications };
          smartMatchesMemoryCache.set(uid, res);
          return res;
        },
        thirtyMinutesTtl
      );

      return result?.smartMatches || [];
    } catch (err) {
      console.error("Error in getSmartMatches:", err);
      return [];
    }
  }
}

