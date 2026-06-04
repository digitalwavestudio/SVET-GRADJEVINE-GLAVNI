import { BaseAdStrategy } from "./base-ad.strategy.ts";

export class PlotsStrategy extends BaseAdStrategy {
  get category() { return "plots"; }
  get entityType() { return "plot"; }

  protected resolvePackagePrice(pkgId: string): number {
    if (pkgId === "premium") return 6000;
    return super.resolvePackagePrice(pkgId);
  }
}
