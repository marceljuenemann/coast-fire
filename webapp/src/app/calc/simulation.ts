import { HISTORIC_PRICES, FIRST_YEAR } from './historic-us-returns';

/** Year-over-year return lookup used by {@link Simulator} and bulk runs. */
export interface YoYReturnsSource {
  yoyReturns(year: number, month: number): number | null;
}

/**
 * Configuration for a Coast FIRE simulation.
 */
export interface Config {
  /** The current amount invested in any currency. */
  initialInvestment: number;

  /**
   * The amount of additional investment every year. A negative amount means
   * an annual withdrawal from the portfolio.
   */
  annualInvestment: number;

  /**
   * The target FIRE number. A simuilation run is stopped whenever the
   * target is reached at the end of a year, even if it would fall below
   * the portfolio again in the following year.
   */
  targetInvestment: number;

  /**
   * Maximum number of years to simulate. It's sufficient to set this to
   * the maximum number of years until retirement.
   */
  maxYears: number;

  /**
   * The minimum historic year to use for simulations.
   */
  minYear: number;

  /**
   * Whether to only simulate starting with December prices. If false, we
   * run additional simulations for each possible starting month.
   */
  decemberStartOnly: boolean;
}

/**
 * Result of a single simulation with a specific start year and month.
 */
export interface SingleResult {
  /**
   * The historic year where this simulation was started.
   */
  startYear: number;

  /**
   * The historic zero-based month where this simulation was started.
   */
  startMonth: number;

  /**
   * Whether the target FIRE number was reached during the simulation. The
   * simulation is stopped as soon as the number is reached without checking
   * whether the portfolio would dip below the target again in later years.
   */
  targetReached: boolean;

  /**
   * The number of years that were simulated. The simulation might end because the
   * target was reached, because we ran out of historic data, or because maxYears
   * was reached.
   */
  yearsSimulated: number;

  /**
   * The amount invested in the portfolio in the last year of the simulation.
   */
  finalInvestment: number;

  /**
   * Portfolio value after each simulated year (index 0 = end of year 1).
   * Empty when the loop never ran (e.g. already at or above target).
   */
  investmentByYear: number[];
}

export class HistoricReturns implements YoYReturnsSource {
  private historicReturns: number[] = [];

  constructor() {
    for (let i = 12; i < HISTORIC_PRICES.length; i++) {
      this.historicReturns.push(HISTORIC_PRICES[i] / HISTORIC_PRICES[i - 12]);
    }
  }

  /**
   * Returns the year-over-year returns for the period starting with the given year and month.
   * For example, yoyReturns(2001, 4) returns the stock market returns (as fraction) between
   * May 2001 and May 2002.
   *
   * @param year the start year of the period in question
   * @param month the start month, zero-based
   */
  public yoyReturns(year: number, month: number): number | null {
    const index = month + (year - FIRST_YEAR) * 12;
    if (index < 0 || index > this.historicReturns.length) return null;
    return this.historicReturns[index];
  }
}

export class Simulator {
  public constructor(
    private readonly config: Config,
    private readonly returns: YoYReturnsSource = new HistoricReturns(),
  ) {}

  /**
   * Runs one path: each simulated year applies the YoY factor for that calendar
   * slice, then adds {@link Config.annualInvestment} (contribute after the move).
   */
  public singleSimulation(startYear: number, startMonth: number): SingleResult {
    let currentInvestment = this.config.initialInvestment;
    let yearsSimulated = 0;
    const investmentByYear: number[] = [];

    while (
      currentInvestment < this.config.targetInvestment &&
      yearsSimulated < this.config.maxYears
    ) {
      const nextReturn = this.returns.yoyReturns(startYear + yearsSimulated, startMonth);
      if (nextReturn === null) {
        break;
      }

      currentInvestment = currentInvestment * nextReturn + this.config.annualInvestment;
      yearsSimulated++;
      investmentByYear.push(currentInvestment);
    }

    return {
      startYear,
      startMonth,
      targetReached: currentInvestment >= this.config.targetInvestment,
      yearsSimulated,
      finalInvestment: currentInvestment,
      investmentByYear,
    };
  }
}
