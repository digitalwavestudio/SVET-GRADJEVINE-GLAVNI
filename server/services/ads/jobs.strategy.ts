import { BaseAdStrategy } from "./base-ad.strategy.ts";

export class JobsStrategy extends BaseAdStrategy {
  get category() { return "jobs"; }
  get entityType() { return "job"; }
}
