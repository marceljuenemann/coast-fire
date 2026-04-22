import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';

const COUNT_JS = 'https://gc.zgo.at/count.js';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private scriptRequested = false;

  constructor() {
    if (
      environment.production &&
      environment.goatcounter.enabled &&
      environment.goatcounter.siteCode
    ) {
      this.ensureScript();
    }
  }

  /** Fire a non-pageview event after a debounced bulk analyze (valid form only). */
  maybeTrackBulkAnalyze(): void {
    if (!environment.goatcounter.enabled || !environment.goatcounter.siteCode) {
      return;
    }
    window.goatcounter?.count({
      path: 'bulk-analyze',
      title: 'Bulk coast analyze',
      event: true,
    });
  }

  private ensureScript(): void {
    if (this.scriptRequested || typeof document === 'undefined') {
      return;
    }
    this.scriptRequested = true;
    const code = environment.goatcounter.siteCode;
    const endpoint = `https://${code}.goatcounter.com/count`;
    const s = document.createElement('script');
    s.async = true;
    s.src = COUNT_JS;
    s.dataset['goatcounter'] = endpoint;
    document.head.appendChild(s);
  }
}
