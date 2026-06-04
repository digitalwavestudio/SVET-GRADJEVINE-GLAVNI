import { BaseAdStrategy } from "./base-ad.strategy.ts";

export class MarketplaceStrategy extends BaseAdStrategy {
  get category() { return "marketplace"; }
  get entityType() { return "marketplace"; }
}
