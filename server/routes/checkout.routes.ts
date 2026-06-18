import { Router } from "express";
import { getReqUser } from "../utils/request.ts";
import { db, admin } from "../config/firebase.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";
import { generateProformaInvoice } from "../utils/invoiceGenerator.ts";
import { emailService } from "../services/emailService.ts";
import { CacheService } from "../services/cache.service.ts";

export const checkoutRouter = Router();

// Get checkout status (Cached 15m)
checkoutRouter.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const uid = getReqUser(req).uid;
    const cacheKey = `checkout_status:${id}`;

    // 1. Try Cache
    const cached = await CacheService.get<any>(cacheKey);
    if (cached) {
      if (cached.userId !== uid && !getReqUser(req).isAdmin) {
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
    if (checkout.userId !== uid && !getReqUser(req).isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // 3. Store in Cache (15 min = 900,000 ms)
    await CacheService.set(cacheKey, checkout, 900000);

    res.json(checkout);
  } catch (error) {
    next(error);
  }
});

// Generate Pro-forma Invoice
checkoutRouter.post(
  "/generate-proforma",
  requireAuth,
  async (req, res, next) => {
    try {
      const uid = getReqUser(req).uid;
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

      // Send email with PDF attachment
      if (customerInfo?.email) {
        emailService.sendProformaInvoiceNotification({
          to: customerInfo.email,
          invoiceNumber,
          customerName: customerInfo.name || "Korisnik",
          total: amount,
          pdfBuffer,
        }).catch(err => console.error(`[INVOICE] Failed to send email for ${invoiceNumber}:`, err));
      }

      console.info(
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
    const uid = getReqUser(req).uid;

    const snap = await db.collection("checkouts").doc(id).get();
    if (!snap.exists) return res.status(404).json({ error: "Not found" });

    const checkout = snap.data()!;
    if (checkout.userId !== uid && !getReqUser(req).isAdmin) {
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

