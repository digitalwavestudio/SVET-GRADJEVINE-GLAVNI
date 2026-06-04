import { BaseAdStrategy } from "./base-ad.strategy.ts";

export class MachineryStrategy extends BaseAdStrategy {
  get category() { return "machines"; }
  get entityType() { return "machine"; }
}
