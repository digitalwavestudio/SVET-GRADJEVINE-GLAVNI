import { Logger } from "../../utils/logger.ts";

export interface SagaStep<TContext> {
  name: string;
  forward: (context: TContext) => Promise<void>;
  backward?: (context: TContext) => Promise<void>;
}

export class SagaOrchestrator<TContext> {
  private steps: SagaStep<TContext>[] = [];
  private executedSteps: SagaStep<TContext>[] = [];

  constructor(
    private name: string,
    private context: TContext,
  ) {}

  addStep(step: SagaStep<TContext>) {
    this.steps.push(step);
    return this;
  }

  async execute() {
    const logger = Logger.withContext();
    logger.info(`[Saga:${this.name}] Starting execution...`);

    try {
      for (const step of this.steps) {
        logger.info(`[Saga:${this.name}] Executing step: ${step.name}`);
        await step.forward(this.context);
        this.executedSteps.push(step);
      }
      logger.info(`[Saga:${this.name}] Completed successfully.`);
    } catch (error: any) {
      logger.error(
        `[Saga:${this.name}] Step failed: ${error.message}. Starting compensation...`,
      );
      await this.compensate();
      throw error;
    }
  }

  private async compensate() {
    const logger = new Logger();
    // Kompenzaciju radimo u obrnutom redosledu
    for (const step of this.executedSteps.reverse()) {
      if (step.backward) {
        try {
          logger.info(`[Saga:${this.name}] Compensating step: ${step.name}`);
          await step.backward(this.context);
        } catch (compError: any) {
          logger.error(
            `[Saga:${this.name}] Compensation failed for ${step.name}: ${compError.message}`,
          );
        }
      }
    }
  }
}
