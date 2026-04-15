import { Injectable } from '@angular/core';

import { FIRST_YEAR, HISTORIC_PRICES } from '../calc/historic-us-returns';
import { Config, HistoricReturns, Simulator, SingleResult } from '../calc/simulation';

/** Start years before this are excluded from bulk runs (simulator does not enforce `minYear`). */
export const DEFAULT_MIN_START_YEAR = 1900;

/** Upper bound for horizon rows and for the “all years” list. */
export const MAX_HORIZON_CAP = 50;

export interface CoastFireFormValues {
  targetInvestment: number;
  initialInvestment: number;
  annualInvestment: number;
}

export interface HorizonStats {
  horizonYears: number;
  probability: number;
  totalRuns: number;
  successes: number;
  results: SingleResult[];
}

@Injectable({
  providedIn: 'root',
})
export class CoastFireBulkRunnerService {
  analyze(values: CoastFireFormValues): HorizonStats[] {
    const historic = new HistoricReturns();
    const maxH = this.maxHorizonWithAnyPath(historic, DEFAULT_MIN_START_YEAR);
    const cap = Math.min(MAX_HORIZON_CAP, maxH);
    const stats: HorizonStats[] = [];
    for (let h = 1; h <= cap; h++) {
      stats.push(this.runHorizon(values, h, DEFAULT_MIN_START_YEAR, historic));
    }
    return stats;
  }

  private maxHorizonWithAnyPath(historic: HistoricReturns, minYear: number): number {
    let maxH = 0;
    const lastMonthIndex = HISTORIC_PRICES.length - 1;
    const scanUntil = FIRST_YEAR + Math.floor(lastMonthIndex / 12);
    for (let y = minYear; y <= scanUntil; y++) {
      for (let m = 0; m < 12; m++) {
        let h = 0;
        while (h < 200 && historic.yoyReturns(y + h, m) !== null) {
          h++;
        }
        maxH = Math.max(maxH, h);
      }
    }
    return Math.max(maxH, 1);
  }

  private canSimulate(historic: HistoricReturns, startYear: number, startMonth: number, horizonYears: number): boolean {
    for (let k = 0; k < horizonYears; k++) {
      if (historic.yoyReturns(startYear + k, startMonth) === null) {
        return false;
      }
    }
    return true;
  }

  private runHorizon(
    values: CoastFireFormValues,
    horizonYears: number,
    minYear: number,
    historic: HistoricReturns,
  ): HorizonStats {
    const config: Config = {
      initialInvestment: values.initialInvestment,
      annualInvestment: values.annualInvestment,
      targetInvestment: values.targetInvestment,
      maxYears: horizonYears,
      minYear,
      decemberStartOnly: false,
    };
    const sim = new Simulator(config);
    const results: SingleResult[] = [];
    const lastMonthIndex = HISTORIC_PRICES.length - 1;
    const lastCalendarYear = FIRST_YEAR + Math.floor(lastMonthIndex / 12);
    for (let y = minYear; y <= lastCalendarYear; y++) {
      for (let m = 0; m < 12; m++) {
        if (!this.canSimulate(historic, y, m, horizonYears)) {
          continue;
        }
        results.push(sim.singleSimulation(y, m));
      }
    }
    const successes = results.filter((r) => r.targetReached).length;
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
