import { Injectable } from '@angular/core';

import * as HISTORIC_PRICES from './us-real-returns-since-1871.json';

@Injectable({
  providedIn: 'root'
})
export class SimulationService {

  constructor() { }

  public foo(): any {
    return HISTORIC_PRICES
  } 
}
