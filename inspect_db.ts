import { getDb } from "./server/config/firebase.ts";
import { FieldPath } from "firebase-admin/firestore";

async function run() {
  try {
    const db = getDb();
    console.log("Povezan na Firestore!");
    
    // Upit koji simulira backend pretragu za premium poslove
    const q = db.collectionGroup("listings")
      .where("type", "==", "job")
      .where("status", "==", "active")
      .where("isPremium", "==", true)
      .orderBy("isPremium", "desc")
      .orderBy("createdAt", "desc")
      .orderBy(FieldPath.documentId(), "desc")
      .limit(7);
      
    const snap = await q.get();
    console.log(`Pronađeno premium poslova sa backend upitom: ${snap.size}`);
    snap.docs.forEach(doc => {
      console.log(`- Naslov: "${doc.data().title}", isPremium: ${doc.data().isPremium}, status: "${doc.data().status}"`);
    });
  } catch (err: any) {
    console.error("Greška tokom izvršavanja backend upita:", err.message || err);
  }
}

run();
