import { FIRST_YEAR, HISTORIC_PRICES } from './historic-us-returns';
import { Config, HistoricReturns, Simulator, SingleResult, YoYReturnsSource } from './simulation';

/** Upper bound for horizon rows (simulations never run past this many years). */
export const MAX_HORIZON_CAP = 40;

export interface HorizonStats {
  horizonYears: number;
  probability: number;
  totalRuns: number;
  successes: number;
  results: SingleResult[];
}

export interface BulkAnalyzeInput {
  initialInvestment: number;
  annualInvestment: number;
  targetInvestment: number;
  minStartYear: number;
  maxHorizonCap: number;
}

export class BulkSimulation {
  constructor(private readonly historic: YoYReturnsSource = new HistoricReturns()) {}

  analyze(input: BulkAnalyzeInput): HorizonStats[] {
    const maxH = this.maxHorizonWithAnyPath(this.historic, input.minStartYear);
    const cap = Math.min(input.maxHorizonCap, maxH);
    const stats: HorizonStats[] = [];
    for (let h = 1; h <= cap; h++) {
      stats.push(this.runHorizon(input, h));
    }
    return stats;
  }

  private maxHorizonWithAnyPath(historic: YoYReturnsSource, minYear: number): number {
    const hCap = HISTORIC_PRICES.length;
    let maxH = 0;
    const lastMonthIndex = HISTORIC_PRICES.length - 1;
    const scanUntil = FIRST_YEAR + Math.floor(lastMonthIndex / 12);
    for (let y = minYear; y <= scanUntil; y++) {
      for (let m = 0; m < 12; m++) {
        let h = 0;
        while (h < hCap && historic.yoyReturns(y + h, m) !== null) {
          h++;
        }
        maxH = Math.max(maxH, h);
      }
    }
    return Math.max(maxH, 1);
  }

  private canSimulate(
    historic: YoYReturnsSource,
    startYear: number,
    startMonth: number,
    horizonYears: number,
  ): boolean {
    for (let k = 0; k < horizonYears; k++) {
      if (historic.yoyReturns(startYear + k, startMonth) === null) {
        return false;
      }
    }
    return true;
  }

  private runHorizon(input: BulkAnalyzeInput, horizonYears: number): HorizonStats {
    const config: Config = {
      initialInvestment: input.initialInvestment,
      annualInvestment: input.annualInvestment,
      targetInvestment: input.targetInvestment,
      maxYears: horizonYears,
      minYear: input.minStartYear,
      decemberStartOnly: false,
    };
    const sim = new Simulator(config, this.historic);
    const results: SingleResult[] = [];
    const lastMonthIndex = HISTORIC_PRICES.length - 1;
    const lastCalendarYear = FIRST_YEAR + Math.floor(lastMonthIndex / 12);
    for (let y = input.minStartYear; y <= lastCalendarYear; y++) {
      for (let m = 0; m < 12; m++) {
        if (!this.canSimulate(this.historic, y, m, horizonYears)) {
          continue;
        }
        results.push(sim.singleSimulation(y, m));
      }
    }
    const successes = results.filter(r => r.targetReached).length;
    const totalRuns = results.length;
    return {
      horizonYears,
      probability: totalRuns === 0 ? 0 : successes / totalRuns,
      totalRuns,
      successes,
      results,
    };
  }
}
