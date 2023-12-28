import { Injectable } from '@angular/core';

import { HISTORIC_PRICES } from './historic-us-returns';

@Injectable({
  providedIn: 'root'
})
export class SimulationService {

  private historicReturns: number[] = []

  constructor() { 
    for (let i = 12; i < HISTORIC_PRICES.length; i++) {
      this.historicReturns.push(HISTORIC_PRICES[i] / HISTORIC_PRICES[i - 12])
    }
  }

  public foo(): any {
    let sum = 0.0
    let histogram = new Map<number, number>()
    for (let r of this.historicReturns) {
      sum += r
      const bucket = (Math.floor(r * 10) - 10) * 10
      console.log("Bucket", bucket, r)
      histogram.set(bucket, (histogram.get(bucket) || 0) + 1)
    }
    for (let [key, count] of histogram) {
      console.log(key, count)
    }
    return sum / this.historicReturns.length
  } 
}
