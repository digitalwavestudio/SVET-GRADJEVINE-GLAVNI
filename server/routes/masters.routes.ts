import express from "express";
import {
  getPublicMasters,
  searchMasters,
} from "../controllers/masters.controller.ts";
import { validateRequest } from "../middleware/validate.ts";
import { masterSearchSchema } from "@svet-gradjevine/shared";

export const mastersRouter = express.Router();

mastersRouter.get("/", getPublicMasters);
mastersRouter.post(
  "/search",
  validateRequest(masterSearchSchema),
  searchMasters,
);
