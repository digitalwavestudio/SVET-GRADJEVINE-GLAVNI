// @ts-nocheck
import { BaseAdStrategy } from "./base-ad.strategy.ts";
import { admin as firebaseAdmin } from "../../config/firebase.ts";

export class CompaniesStrategy extends BaseAdStrategy {
  get category() { return "companies"; }
  get entityType() { return "company"; }

  protected resolvePackagePrice(pkgId: string): number {
    if (pkgId === "premium") return 6000;
    return super.resolvePackagePrice(pkgId);
  }

  protected async afterAdCreated(transaction: FirebaseFirestore.Transaction, adId: string, rawData: any, userData: any, adData: any): Promise<void> {
    const userUpdates: any = {};
    if (!userData.company && adData.name) userUpdates.company = adData.name;
    if (!userData.phone && adData.phone) userUpdates.phone = adData.phone;
    if (!userData.role || userData.role === "standard")
      userUpdates.role = "poslodavac";

    if (Object.keys(userUpdates).length > 0) {
      const { db } = await import("../../config/firebase.ts");
      const userRef = db.collection("users").doc(rawData.authorId || adData.authorId);
      transaction.update(userRef, userUpdates);
    }
  }
}
