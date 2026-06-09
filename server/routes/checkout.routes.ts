import { Router } from "express";
import { db, admin } from "../config/firebase.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";
import { validateRequest } from "../middleware/validate.ts";
import { checkoutSchema } from "@svet-gradjevine/shared";
import { generateProformaInvoice } from "../utils/invoiceGenerator.ts";
import { CacheService } from "../services/cache.service.ts";
import nodemailer from "nodemailer";

export const checkoutRouter = Router();

// Get checkout status (Cached 15m)
checkoutRouter.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const uid = (req as any)?.user.uid;
    const cacheKey = `checkout_status:${id}`;

    // 1. Try Cache
    const cached = await CacheService.get<any>(cacheKey);
    if (cached) {
      if (cached.userId !== uid && !(req as any)?.user.isAdmin) {
        return res.status(403).json({ error: "Forbidden" });
      }
      return res.json(cached);
    }

    // 2. Fetch from DB
    const snap = await db.collection("checkouts").doc(id).get();
    if (!snap.exists) return res.status(404).json({ error: "Not found" });

    const checkoutData = snap.data();
    if (!checkoutData) return res.status(404).json({ error: "No data" });

    const checkout = { id: snap.id, ...checkoutData } as any;

    // Security check
    if (checkout.userId !== uid && !(req as any)?.user.isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // 3. Store in Cache (15 min = 900,000 ms)
    await CacheService.set(cacheKey, checkout, 900000);

    res.json(checkout);
  } catch (error) {
    next(error);
  }
});

// Create checkout session
checkoutRouter.post(
  "/",
  requireAuth,
  validateRequest(checkoutSchema),
  async (req, res, next) => {
    try {
      const uid = (req as any)?.user.uid;
      const { packageId, amount, paymentMethod } = req.body;

      // Amount is now strictly positive due to validation

      const checkout = {
        userId: uid,
        packageId,
        amount,
        paymentMethod,
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await db.collection("checkouts").add(checkout);
      res.status(201).json({ id: docRef.id, success: true });
    } catch (error) {
      next(error);
    }
  },
);

// Generate Pro-forma Invoice
checkoutRouter.post(
  "/generate-proforma",
  requireAuth,
  async (req, res, next) => {
    try {
      const uid = (req as any)?.user.uid;
      const { packageId, packageName, amount, customerInfo } = req.body;

      const invoiceNumber = `PR-${Date.now().toString().slice(-6)}`;
      const date = new Date().toLocaleDateString("sr-RS");
      const dueDate = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toLocaleDateString("sr-RS");

      const vat = amount * 0.2;
      const subtotal = amount - vat;

      const invoiceData = {
        invoiceNumber,
        date,
        dueDate,
        customerName: customerInfo?.name || "Korisnik",
        customerEmail: customerInfo?.email || "",
        customerPIB: customerInfo?.pib || "",
        customerAddress: customerInfo?.address || "",
        items: [
          {
            name: packageName || "Oglasni paket",
            quantity: 1,
            price: amount,
            total: amount,
          },
        ],
        subtotal,
        vat,
        total: amount,
      };

      const pdfBuffer = await generateProformaInvoice(invoiceData);

      // Record in DB
      await db.collection("checkouts").add({
        userId: uid,
        packageId,
        amount,
        paymentMethod: "invoice",
        status: "pending_payment",
        invoiceNumber,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // In a real app we would use nodemailer here:
      /*
    const transporter = nodemailer.createTransport({...});
    await transporter.sendMail({
      from: '"Svet GraÄ‘evine" <noreply@svetgradjevine.com>',
      to: customerInfo?.email,
      subject: `PredraÄun ${invoiceNumber} - Svet GraÄ‘evine`,
      text: 'PoÅ¡tovani, u prilogu se nalazi VaÅ¡ predraÄun.',
      attachments: [{ filename: `Predracun-${invoiceNumber}.pdf`, content: pdfBuffer }]
    });
    */
      console.log(
        `[INVOICE] Generated pro-forma ${invoiceNumber} for user ${uid}`,
      );

      // Return PDF to client
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=Predracun-${invoiceNumber}.pdf`,
      );
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  },
);

// Update checkout status
checkoutRouter.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const uid = (req as any)?.user.uid;

    const snap = await db.collection("checkouts").doc(id).get();
    if (!snap.exists) return res.status(404).json({ error: "Not found" });

    const checkout = snap.data()!;
    if (checkout.userId !== uid && !(req as any)?.user.isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await db.collection("checkouts").doc(id).update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

