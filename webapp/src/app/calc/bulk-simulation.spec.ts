import { FIRST_YEAR, HISTORIC_PRICES } from './historic-us-returns';
import { BulkAnalyzeInput, BulkSimulation, MAX_HORIZON_CAP } from './bulk-simulation';
import { HistoricReturns, YoYReturnsSource } from './simulation';

/** Constant YoY until `year >= cutoffYear`, then null (inclusive of data for year < cutoffYear). */
function fakeYoYUntilYear(cutoffYear: number, factor = 1.01): YoYReturnsSource {
  return {
    yoyReturns(year: number, month: number): number | null {
      void month;
      if (year < FIRST_YEAR) {
        return null;
      }
      if (year >= cutoffYear) {
        return null;
      }
      return factor;
    },
  };
}

describe('BulkSimulation', () => {
  const trivialTargetInput = (overrides: Partial<BulkAnalyzeInput> = {}): BulkAnalyzeInput => ({
    initialInvestment: 10_000,
    annualInvestment: 0,
    targetInvestment: 100,
    minStartYear: 1990,
    maxHorizonCap: 5,
    ...overrides,
  });

  it('returns one row per horizon up to maxHorizonCap', () => {
    const bulk = new BulkSimulation(fakeYoYUntilYear(2100));
    const rows = bulk.analyze(trivialTargetInput({ maxHorizonCap: 4 }));
    expect(rows.length).toBe(4);
    expect(rows.map(r => r.horizonYears)).toEqual([1, 2, 3, 4]);
  });

  it('gives probability 1 when target is already met before any market year', () => {
    const bulk = new BulkSimulation(fakeYoYUntilYear(2100));
    const rows = bulk.analyze(trivialTargetInput());
    for (const row of rows) {
      expect(row.probability).toBe(1);
      expect(row.successes).toBe(row.totalRuns);
      expect(row.totalRuns).toBeGreaterThan(0);
    }
  });

  it('skips start windows that lack enough consecutive YoY data', () => {
    const cutoff = 2005;
    const bulkShort = new BulkSimulation(fakeYoYUntilYear(cutoff));
    const longHorizon = 8;
    const short = bulkShort.analyze(
      trivialTargetInput({ maxHorizonCap: longHorizon, minStartYear: 1995 }),
    );
    const rowLong = short.find(r => r.horizonYears === longHorizon);
    const rowOne = short.find(r => r.horizonYears === 1);
    expect(rowLong && rowOne).toBeTruthy();
    if (!rowLong || !rowOne) {
      return;
    }
    expect(rowLong.totalRuns).toBeLessThan(rowOne.totalRuns);
    const bulkWide = new BulkSimulation(fakeYoYUntilYear(2100));
    const wide = bulkWide.analyze(
      trivialTargetInput({ maxHorizonCap: longHorizon, minStartYear: 1995 }),
    );
    const wideRow = wide.find(r => r.horizonYears === longHorizon);
    expect(wideRow).toBeDefined();
    if (!wideRow) {
      return;
    }
    expect(rowLong.totalRuns).toBeLessThan(wideRow.totalRuns);
  });

  it('uses real historic series with sane aggregates', () => {
    const bulk = new BulkSimulation(new HistoricReturns());
    const rows = bulk.analyze({
      initialInvestment: 100_000,
      annualInvestment: 5_000,
      targetInvestment: 1_000_000,
      minStartYear: 1950,
      maxHorizonCap: MAX_HORIZON_CAP,
    });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThanOrEqual(MAX_HORIZON_CAP);
    const lastMonthIndex = HISTORIC_PRICES.length - 1;
    const scanUntil = FIRST_YEAR + Math.floor(lastMonthIndex / 12);
    const monthsPerYear = 12;
    const maxGrid = (scanUntil - 1950 + 1) * monthsPerYear;
    for (const row of rows) {
      expect(row.probability).toBeGreaterThanOrEqual(0);
      expect(row.probability).toBeLessThanOrEqual(1);
      expect(row.totalRuns).toBeLessThanOrEqual(maxGrid);
      expect(row.results.length).toBe(row.totalRuns);
    }
  });
});
