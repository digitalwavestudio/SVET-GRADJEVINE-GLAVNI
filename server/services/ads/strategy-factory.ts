import { BaseAdStrategy } from "./base-ad.strategy.ts";
import { JobsStrategy } from "./jobs.strategy.ts";
import { MachineryStrategy } from "./machinery.strategy.ts";
import { CateringStrategy } from "./catering.strategy.ts";
import { AccommodationsStrategy } from "./accommodations.strategy.ts";
import { PlotsStrategy } from "./plots.strategy.ts";
import { MarketplaceStrategy } from "./marketplace.strategy.ts";
import { CompaniesStrategy } from "./companies.strategy.ts";
import { BadRequestError } from "../../utils/appError.ts";

export class AdStrategyFactory {
  private static strategies: Record<string, BaseAdStrategy> = {
    jobs: new JobsStrategy(),
    machines: new MachineryStrategy(),
    caterings: new CateringStrategy(),
    accommodations: new AccommodationsStrategy(),
    plots: new PlotsStrategy(),
    real_estate: new PlotsStrategy(),
    marketplace: new MarketplaceStrategy(),
    companies: new CompaniesStrategy(),
  };

  public static getStrategy(category: string): BaseAdStrategy {
    const strategy = this.strategies[category];
    if (!strategy) {
      throw new BadRequestError(`No strategy found for category: ${category}`);
    }
    return strategy;
  }
}
