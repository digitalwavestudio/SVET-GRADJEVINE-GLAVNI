import { BaseAdStrategy } from "./base-ad.strategy.ts";

export class AccommodationsStrategy extends BaseAdStrategy {
  get category() { return "accommodations"; }
  get entityType() { return "accommodation"; }

  protected resolvePackagePrice(pkgId: string): number {
    if (pkgId === "premium") return 3000;
    return super.resolvePackagePrice(pkgId);
  }
}
