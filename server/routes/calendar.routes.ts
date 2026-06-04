import express from "express";
import { validateRequest } from "../middleware/validate.ts";
import { calendarEventSchema, saveDiarySchema } from "@svet-gradjevine/shared";
import {
  createEvent,
  deleteEvent,
  saveDiary,
  getCalendarData,
} from "../controllers/calendar.controller.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";

import { RequestHandler } from "express";

export const calendarRouter = express.Router();

calendarRouter.get("/", requireAuth, getCalendarData as unknown as RequestHandler);
calendarRouter.post(
  "/",
  requireAuth,
  validateRequest(calendarEventSchema),
  createEvent as unknown as RequestHandler,
);
calendarRouter.delete("/:id", requireAuth, deleteEvent as unknown as RequestHandler);
calendarRouter.post("/diary", requireAuth, validateRequest(saveDiarySchema), saveDiary as unknown as RequestHandler);
