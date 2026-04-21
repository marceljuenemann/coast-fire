import { Injectable } from '@angular/core';

import {
  BulkAnalyzeInput,
  BulkSimulation,
  HorizonStats,
  MAX_HORIZON_CAP,
} from '../calc/bulk-simulation';

export { MAX_HORIZON_CAP } from '../calc/bulk-simulation';
export type { HorizonStats } from '../calc/bulk-simulation';

export interface CoastFireFormValues {
  targetInvestment: number;
  initialInvestment: number;
  annualInvestment: number;
  minStartYear: number;
}

@Injectable({
  providedIn: 'root',
})
export class CoastFireBulkRunnerService {
  private readonly bulkSimulation = new BulkSimulation();

  analyze(values: CoastFireFormValues): HorizonStats[] {
    const input: BulkAnalyzeInput = {
      initialInvestment: values.initialInvestment,
      annualInvestment: values.annualInvestment,
      targetInvestment: values.targetInvestment,
      minStartYear: values.minStartYear,
      maxHorizonCap: MAX_HORIZON_CAP,
    };
    return this.bulkSimulation.analyze(input);
  }
}
