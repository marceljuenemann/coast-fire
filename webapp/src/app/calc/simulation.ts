
/**
 * Configuration for a Coast FIRE simulation.
 */
interface Config {
  /** The current amount invested in any currency. */
  initialInvestment: number

  /**
   * The amount of additional investment every year. A negative amount means
   * an annual withdrawal from the portfolio.
   */
  annualInvestment: number

  /**
   * The target FIRE number. A simuilation run is stopped whenever the
   * target is reached at the end of a year, even if it would fall below
   * the portfolio again in the following year.
   */
  targetInvestment: number

  /**
   * Maximum number of years to simulate. It's sufficient to set this to
   * the maximum number of years until retirement.
   */
  maxYears: number

  /**
   * The minimum historic year to use for simulations.
   */
  minYear: number

  /**
   * Whether to only simulate starting with December prices. If false, we
   * run additional simulations for each possible starting month.
   */
  decemberStartOnly: boolean
}


/**
 * 
 * TODO:
 * 
 * 
- Simulation
  - Config
  - runs: SimulationRun[]
    - StartYear
    - StartMonth
    - Target reached
    - Years simulated
    - FinalInvestment
    - targetReachedAfterYears(years): boolean | null
  - resultAfterYears(): SimulationResult[]
    - successfulRuns
    - unsuccessfulRuns
    - totalRuns

1. Build all those objects one after the other
1. Write tests as we go :)
1. Eventually wanna have a nice graph with probabilites for each year span
1. Nice to have: Graph showing actual amounts simulated, like in that one FIRE simulator
  - Might be a very confusing visualization though...
  
 */