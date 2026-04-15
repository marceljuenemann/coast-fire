import { Component, EventEmitter, Input, Output } from '@angular/core';

import { HorizonStats } from './coast-fire-bulk-runner.service';

const DEFAULT_YEAR_MARKS = [5, 10, 15, 20, 25, 30];

@Component({
  selector: 'app-horizon-summary-table',
  templateUrl: './horizon-summary-table.component.html',
  styleUrls: ['./horizon-summary-table.component.css'],
})
export class HorizonSummaryTableComponent {
  @Input() horizons: HorizonStats[] | null = null;
  @Input() showAllYears = false;
  @Output() rowSelected = new EventEmitter<HorizonStats>();

  readonly displayedColumns: string[] = ['years', 'probability', 'counts', 'hint'];

  get visibleRows(): HorizonStats[] {
    if (!this.horizons?.length) {
      return [];
    }
    if (this.showAllYears) {
      return [...this.horizons].filter((h) => h.totalRuns > 0).sort((a, b) => a.horizonYears - b.horizonYears);
    }
    const rows: HorizonStats[] = [];
    for (const y of DEFAULT_YEAR_MARKS) {
      const found = this.horizons.find((h) => h.horizonYears === y);
      if (found && found.totalRuns > 0) {
        rows.push(found);
      }
    }
    return rows;
  }

  selectRow(row: HorizonStats): void {
    this.rowSelected.emit(row);
  }
}
