import admin from "firebase-admin";
import fs from "fs";
import path from "path";

async function run() {
  try {
    const configPath = path.resolve("firebase-applet-config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    
    let credential;
    const localKeyPath = path.resolve("firebase-service-account.json");
    if (fs.existsSync(localKeyPath)) {
      credential = admin.credential.cert(JSON.parse(fs.readFileSync(localKeyPath, "utf-8")));
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      credential = admin.credential.cert(JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf-8")));
    } else {
      credential = admin.credential.applicationDefault();
    }
    
    admin.initializeApp({
      credential,
      projectId: config.projectId,
    });
    
    const db = admin.firestore(admin.app(), config.firestoreDatabaseId);
    
    const snap = await db.collection("listings").where("type", "==", "job").get();
    console.log(`Found ${snap.docs.length} job listings:`);
    for (const doc of snap.docs) {
      const data = doc.data();
      console.log(`- ID: ${doc.id}`);
      console.log(`  Title: ${data.title}`);
      console.log(`  isPremium: ${data.isPremium} (type: ${typeof data.isPremium})`);
      console.log(`  isUrgent: ${data.isUrgent} (type: ${typeof data.isUrgent})`);
      console.log(`  plataMin: ${data.plataMin}`);
      console.log(`  plataMax: ${data.plataMax}`);
      console.log(`  salaryType: ${data.salaryType}`);
      console.log(`  sal: ${data.sal}`);
      console.log(`  salary: ${data.salary}`);
      console.log("-------------------");
    }
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}

run();
