import { Component, EventEmitter, Input, Output } from '@angular/core';

import { HorizonStats } from './coast-fire-bulk-runner.service';

@Component({
  selector: 'app-horizon-summary-table',
  templateUrl: './horizon-summary-table.component.html',
  styleUrls: ['./horizon-summary-table.component.css'],
})
export class HorizonSummaryTableComponent {
  @Input() horizons: HorizonStats[] | null = null;
  @Output() rowSelected = new EventEmitter<HorizonStats>();

  readonly displayedColumns: string[] = ['years', 'probability', 'counts', 'hint'];

  get statsRows(): HorizonStats[] {
    return this.horizons ?? [];
  }

  selectRow(row: HorizonStats): void {
    this.rowSelected.emit(row);
  }
}
