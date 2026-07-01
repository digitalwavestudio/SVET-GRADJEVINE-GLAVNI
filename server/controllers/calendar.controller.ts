import { Request, Response, NextFunction } from "express";
import { db } from "../config/firebase.ts";
import { FieldValue } from "firebase-admin/firestore";
import { AuditService } from "../services/audit.service.ts";
import { calendarEventSchema, saveDiarySchema } from "@svet-gradjevine/shared";
import type { AuthenticatedRequest } from "../types/auth.ts";

export const createEvent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const uid = req.user.uid;
    const eventData = calendarEventSchema.parse(req.body);

    const batch = db.batch();
    const eventRef = db.collection("events").doc();

    batch.set(eventRef, {
      ...eventData,
      authorId: uid,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Atomic Activity Log
    const activityRef = db.collection("activities").doc();
    batch.set(activityRef, {
      type: "EVENT_CREATED",
      userId: uid,
      targetId: eventRef.id,
      title: "Novi događaj u kalendaru",
      message: `Dodat je događaj: ${eventData.title || ""}`,
      createdAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    res.json({ id: eventRef.id, status: "created" });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const uid = req.user.uid;
    const { id } = req.params;

    const eventRef = db.collection("events").doc(id);
    const eventSnap = await eventRef.get();

    if (eventSnap.exists && eventSnap.data()?.authorId === uid) {
      const batch = db.batch();
      batch.update(eventRef, {
        status: "deleted",
        updatedAt: FieldValue.serverTimestamp(),
      });

      const activityRef = db.collection("activities").doc();
      batch.set(activityRef, {
        type: "EVENT_DELETED",
        userId: uid,
        targetId: id,
        title: "Događaj obrisan",
        message: "Događaj je uklonjen iz kalendara.",
        createdAt: FieldValue.serverTimestamp(),
      });

      await batch.commit();
    }

    // Log destructive event deletion to DB _logs
    AuditService.logDestructive(req, id, "EVENT_DELETION", { type: "calendar_event" });

    res.json({ id, status: "deleted" });
  } catch (error) {
    next(error);
  }
};

export const saveDiary = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const uid = req.user.uid;
    const validated = saveDiarySchema.parse(req.body);
    const { day, month, year, content } = validated;

    const diaryId = `${year}-${month}-${day}-${uid}`;
    const diaryRef = db.collection("diaries").doc(diaryId);

    const batch = db.batch();
    batch.set(
      diaryRef,
      {
        content,
        day,
        month,
        year,
        authorId: uid,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    const activityRef = db.collection("activities").doc();
    batch.set(activityRef, {
      type: "DIARY_UPDATED",
      userId: uid,
      targetId: diaryId,
      title: "Građevinski dnevnik ažuriran",
      message: `Upis za dan ${day}. u mesecu ${month + 1}.`,
      createdAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    res.json({ id: diaryId, status: "updated" });
  } catch (error) {
    next(error);
  }
};

export const getCalendarData = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const uid = req.user.uid;
    const { month, year } = req.query;

    // 1. Events
    const eventsSnap = await db
      .collection("events")
      .where("authorId", "==", uid)
      .where("status", "!=", "deleted")
      .limit(500)
      .get();
    const events = eventsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 2. Diaries
    let diariesQuery = db.collection("diaries").where("authorId", "==", uid).limit(500);
    if (month && year) {
      diariesQuery = diariesQuery
        .where("month", "==", parseInt(month as string))
        .where("year", "==", parseInt(year as string));
    }
    const diariesSnap = await diariesQuery.get();
    const diaries: Record<number, string> = {};
    diariesSnap.docs.forEach((doc) => {
      const data = doc.data();
      diaries[data.day] = data.content;
    });

    // 3. Metrics
    const metricsSnap = await db
      .collection("metrics")
      .doc(`today-${uid}`)
      .get();
    const metrics = metricsSnap.exists
      ? metricsSnap.data()
      : { totalWorkers: 0, activeWorkers: 0, dailyCost: 0 };

    res.json({ events, diaries, metrics });
  } catch (error) {
    next(error);
  }
};
