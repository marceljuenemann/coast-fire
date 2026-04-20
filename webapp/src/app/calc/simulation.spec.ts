import { Config, HistoricReturns, Simulator, YoYReturnsSource } from './simulation';

/** YoY returns `factor` each year for `yearsWithData` years from (baseYear, baseMonth), then null. */
function fakeConstantReturns(
  baseYear: number,
  baseMonth: number,
  factor: number,
  yearsWithData: number,
): YoYReturnsSource {
  return {
    yoyReturns(year: number, month: number): number | null {
      if (month !== baseMonth) {
        return null;
      }
      const k = year - baseYear;
      if (k >= 0 && k < yearsWithData) {
        return factor;
      }
      return null;
    },
  };
}

describe('HistoricReturns.yoyReturns', () => {
  it('should return historic stock market returns', () => {
    const historicReturns = new HistoricReturns()
    expect(historicReturns.yoyReturns(1871, 0)).toBeCloseTo(1.139, 3)
    expect(historicReturns.yoyReturns(1871, 1)).toBeCloseTo(1.163, 3)
    expect(historicReturns.yoyReturns(2008, 0)).toBeCloseTo(0.644, 3)
    expect(historicReturns.yoyReturns(2020, 1)).toBeCloseTo(1.187, 3)
    expect(historicReturns.yoyReturns(2021, 11)).toBeCloseTo(0.799, 3)
  })

  it('should throw before 1871', () => {
    const historicReturns = new HistoricReturns()
    // historicReturns.yoyReturns(1870, 0)
  })
  // TODO: check for too recent
})

describe('Simulator', () => {
  describe('singleSimulation', () => {
    xit('should something', () => {
      const simulator = new Simulator({
        initialInvestment: 300,
        targetInvestment: 1000,
        annualInvestment: 0,
        minYear: 2008,
        maxYears: 50,
        decemberStartOnly: true,
      })

      expect(simulator.singleSimulation(1990, 1)).toEqual({
        startYear: 2008,
        startMonth: 1,
        targetReached: false,
        finalInvestment: 400,
        yearsSimulated: 1,
        investmentByYear: [400],
      })
    })
  })

  describe('annual investment (injectable YoY)', () => {
    const baseConfig = (): Config => ({
      initialInvestment: 100,
      targetInvestment: 1000,
      annualInvestment: 0,
      minYear: 2000,
      maxYears: 20,
      decemberStartOnly: false,
    })

    it('without contributions, grows only by YoY until target', () => {
      const returns = fakeConstantReturns(2000, 0, 2, 10)
      const sim = new Simulator({ ...baseConfig(), annualInvestment: 0 }, returns)
      const r = sim.singleSimulation(2000, 0)
      expect(r.targetReached).toBe(true)
      expect(r.yearsSimulated).toBe(4)
      expect(r.finalInvestment).toBe(1600)
      expect(r.investmentByYear).toEqual([200, 400, 800, 1600])
    })

    it('applies annual investment after each year’s YoY (market then contribute)', () => {
      const returns = fakeConstantReturns(2000, 0, 2, 10)
      const sim = new Simulator({ ...baseConfig(), annualInvestment: 100 }, returns)
      const r = sim.singleSimulation(2000, 0)
      expect(r.targetReached).toBe(true)
      expect(r.yearsSimulated).toBe(3)
      expect(r.finalInvestment).toBe(1500)
      expect(r.investmentByYear).toEqual([300, 700, 1500])
    })

    it('stops when historic data ends before target', () => {
      const returns = fakeConstantReturns(2000, 0, 2, 2)
      const sim = new Simulator(
        {
          ...baseConfig(),
          annualInvestment: 0,
          targetInvestment: 1_000_000,
          maxYears: 50,
        },
        returns,
      )
      const r = sim.singleSimulation(2000, 0)
      expect(r.targetReached).toBe(false)
      expect(r.yearsSimulated).toBe(2)
      expect(r.finalInvestment).toBe(400)
      expect(r.investmentByYear).toEqual([200, 400])
    })
  })
})
