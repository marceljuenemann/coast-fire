import { HistoricReturns, Simulator } from './simulation';

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
      })
    })
  })
})
