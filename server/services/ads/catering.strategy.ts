import { BaseAdStrategy } from "./base-ad.strategy.ts";

export class CateringStrategy extends BaseAdStrategy {
  get category() { return "caterings"; }
  get entityType() { return "catering"; }

  protected resolvePackagePrice(pkgId: string): number {
    if (pkgId === "premium") return 3000;
    return super.resolvePackagePrice(pkgId);
  }
}
