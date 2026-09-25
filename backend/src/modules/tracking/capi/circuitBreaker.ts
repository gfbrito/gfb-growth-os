import { logger } from "../../../utils/logger.js";

export enum CircuitState {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN",
}

export class MetaCircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private successCount: number = 0;

  private readonly failureThreshold: number = 5;
  private readonly cooldownPeriodMs: number = 60000; // 60s cooldown

  public canExecute(): boolean {
    const now = Date.now();

    if (this.state === CircuitState.OPEN) {
      if (now - this.lastFailureTime > this.cooldownPeriodMs) {
        this.state = CircuitState.HALF_OPEN;
        logger.info("Meta Graph API Circuit Breaker: Transitioning to HALF_OPEN to test connection");
        return true;
      }
      return false;
    }

    return true;
  }

  public recordSuccess(): void {
    this.failureCount = 0;
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 3) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        logger.info("Meta Graph API Circuit Breaker: Connection restored, state CLOSED");
      }
    }
  }

  public recordFailure(errorDetails?: any): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    logger.warn({ failureCount: this.failureCount, errorDetails }, "Meta Graph API Failure Recorded");

    if (this.failureCount >= this.failureThreshold || this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      logger.error("Meta Graph API Circuit Breaker: TRIP! State is now OPEN. Diverting to retry queue.");
    }
  }

  public getState(): CircuitState {
    return this.state;
  }
}

export const metaCircuitBreaker = new MetaCircuitBreaker();
