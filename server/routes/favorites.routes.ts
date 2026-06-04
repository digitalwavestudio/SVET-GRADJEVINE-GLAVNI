import { Router } from "express";
import { UnifiedFavoritesService } from "../services/unified-favorites.service.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";
import { Logger } from "../utils/logger.ts";
import { validateRequest } from "../middleware/validate.ts";
import { z } from "zod";

const favoritesRouter = Router();
const logger = new Logger({ service: "FavoritesRouter" });

const toggleFavoriteSchema = z.object({
  adId: z.string().min(1, "ID oglasa je obavezan"),
  adType: z.string().min(1, "Tip oglasa je obavezan"),
});

// 1. Toggle Favorite
favoritesRouter.post("/toggle", requireAuth, validateRequest(toggleFavoriteSchema), async (req, res) => {
  try {
    const { adId, adType } = req.body;
    const userId = (req as any)?.user.uid;

    if (!adId || !adType) {
      return res.status(400).json({ error: "Missing adId or adType" });
    }

    const result = await UnifiedFavoritesService.toggleFavorite(
      userId,
      adId,
      adType,
    );
    res.json(result);
  } catch (error: any) {
    logger.error("Toggle favorite error", { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// 2. Get User Favorites
favoritesRouter.get("/my", requireAuth, async (req, res) => {
  try {
    const userId = (req as any)?.user.uid;
    const { limit, lastId } = req.query;

    const favorites = await UnifiedFavoritesService.getUserFavorites(
      userId,
      limit ? parseInt(limit as string) : 20,
      lastId as string,
    );

    res.json(favorites);
  } catch (error: any) {
    logger.error("Get favorites error", { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// 3. Check Status
favoritesRouter.get("/status/:adId", requireAuth, async (req, res) => {
  try {
    const userId = (req as any)?.user.uid;
    const { adId } = req.params;

    const isSaved = await UnifiedFavoritesService.isFavorited(userId, adId);
    res.json({ isSaved });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { favoritesRouter };
