import { Router } from "express";
import { db, admin } from "../config/firebase.ts";
import { z } from "zod";
import { validateRequest } from "../middleware/validate.ts";

export const rfqRouter = Router();

const rfqSchema = z.object({
  regionId: z.string().min(1, "Region je obavezan"),
  phone: z.string().min(6, "Kontakt telefon mora imati najmanje 6 karaktera"),
  category: z.string().min(1, "Kategorija kalkulatora je obavezna"),
  specification: z.array(
    z.object({
      name: z.string(),
      amount: z.union([z.string(), z.number()]),
      unit: z.string(),
      desc: z.string().optional()
    })
  ).min(1, "Specifikacija ne može biti prazna")
});

rfqRouter.post("/", validateRequest(rfqSchema), async (req, res, next) => {
  try {
    const { regionId, phone, category, specification } = req.body;

    const rfqRef = db.collection("rfqs").doc();
    const outboxRef = db.collection("outbox").doc();

    const rfqId = rfqRef.id;

    await db.runTransaction(async (transaction) => {
      // 1. Sačuvaj RFQ u bazi sa metapodacima
      transaction.set(rfqRef, {
        id: rfqId,
        regionId,
        phone,
        category,
        specification,
        status: "active",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 2. Persistence Outbox Pattern za asinhrono slanje mejlova oglašivačima na lokaciji
      transaction.set(outboxRef, {
        id: outboxRef.id,
        type: "RFQ_CREATED",
        payload: {
          rfqId,
          regionId,
          phone,
          category,
          specification,
        },
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        version: 1,
      });
    });

    res.status(201).json({
      success: true,
      rfqId,
    });
  } catch (err) {
    next(err);
  }
});
