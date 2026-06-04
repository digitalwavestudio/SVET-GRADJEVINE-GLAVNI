// @ts-nocheck
import { eventBus, DomainEvents } from "../events/event-bus.ts";
import { IndexingService } from "../services/indexing.service.ts";
import { SEOMetaService } from "../services/seo/seo-meta.service.ts";

const typeToRoute: Record<string, string> = {
  jobs: "posao",
  companies: "firma",
  plots: "nekretnine",
  machines: "gradjevinske-masine",
  caterings: "ketering/provajder",
  accommodations: "smestaj",
  marketplace: "alat-i-oprema",
  users: "profil",
};

const notifyIndexers = async (
  category: string,
  id: string,
  action: "URL_UPDATED" | "URL_DELETED",
) => {
  try {
    const routePrefix = typeToRoute[category] || category;
    const meta = await SEOMetaService.getAdMetaData(routePrefix, id);
    if (!meta || !meta.url) return;

    await IndexingService.pushToIndex(meta.url, action);
  } catch (error) {
    console.error(
      `[IndexingSubscriber] Error triggering indexing for ${category}:${id}`,
      error,
    );
  }
};

export function setupIndexingSubscriber() {
  // Jobs
  eventBus.on(
    DomainEvents.JOB_CREATED,
    async ({ jobId }: { jobId: string }) => {
      await notifyIndexers("jobs", jobId, "URL_UPDATED");
    },
  );

  eventBus.on(
    DomainEvents.JOB_UPDATED,
    async ({ jobId }: { jobId: string }) => {
      await notifyIndexers("jobs", jobId, "URL_UPDATED");
    },
  );

  eventBus.on(
    DomainEvents.JOB_DELETED,
    async ({ jobId }: { jobId: string }) => {
      await notifyIndexers("jobs", jobId, "URL_DELETED");
    },
  );

  // Ads
  eventBus.on(
    DomainEvents.AD_CREATED,
    async ({ category, id }: { category: string; id: string }) => {
      await notifyIndexers(category, id, "URL_UPDATED");
    },
  );

  eventBus.on(
    DomainEvents.AD_UPDATED,
    async ({ category, id }: { category: string; id: string }) => {
      await notifyIndexers(category, id, "URL_UPDATED");
    },
  );

  eventBus.on(
    DomainEvents.AD_DELETED,
    async ({ category, id }: { category: string; id: string }) => {
      await notifyIndexers(category, id, "URL_DELETED");
    },
  );

  // Users/Masters/Companies
  eventBus.on(
    DomainEvents.USER_UPDATED,
    async ({ userId }: { userId: string }) => {
      // Assuming users update their public profile, signal indexer
      await notifyIndexers("users", userId, "URL_UPDATED");
    },
  );
}
