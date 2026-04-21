import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';

import { HorizonStats } from './coast-fire-bulk-runner.service';

/** Default summary horizons (5-year steps through 40 years; simulations cap at 40). */
const DEFAULT_YEAR_MARKS = [5, 10, 15, 20, 25, 30, 35, 40];

export type HorizonTableRow =
  | { kind: 'stats'; stats: HorizonStats }
  /** Gap before `high`: show integer horizons in (`low`, `high`). Use `low === 0` for years 1…`high - 1` above the first anchor. */
  | { kind: 'gap'; low: number; high: number };

@Component({
  selector: 'app-horizon-summary-table',
  templateUrl: './horizon-summary-table.component.html',
  styleUrls: ['./horizon-summary-table.component.css'],
})
export class HorizonSummaryTableComponent implements OnChanges {
  @Input() horizons: HorizonStats[] | null = null;
  @Output() rowSelected = new EventEmitter<HorizonStats>();

  readonly displayedColumns: string[] = ['years', 'probability', 'counts', 'hint'];
  readonly gapColumns: string[] = ['gap'];

  /** Gaps the user has revealed; each gap’s button is removed permanently (no collapse). */
  revealedGaps = new Set<string>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['horizons'] && !changes['horizons'].firstChange) {
      this.revealedGaps = new Set();
    }
  }

  get tableRows(): HorizonTableRow[] {
    const h = this.horizons;
    if (!h?.length) {
      return [];
    }
    const anchors = DEFAULT_YEAR_MARKS.filter((y) => {
      const row = h.find((x) => x.horizonYears === y);
      return row && row.totalRuns > 0;
    });
    if (!anchors.length) {
      return [];
    }
    const out: HorizonTableRow[] = [];
    const firstAnchor = anchors[0];
    if (firstAnchor > 1) {
      const topKey = gapKey(0, firstAnchor);
      if (this.revealedGaps.has(topKey)) {
        for (let yy = 1; yy < firstAnchor; yy++) {
          const mid = h.find((x) => x.horizonYears === yy);
          if (mid && mid.totalRuns > 0) {
            out.push({ kind: 'stats', stats: mid });
          }
        }
      } else {
        out.push({ kind: 'gap', low: 0, high: firstAnchor });
      }
    }
    for (let i = 0; i < anchors.length; i++) {
      const y = anchors[i];
      const stat = h.find((x) => x.horizonYears === y)!;
      out.push({ kind: 'stats', stats: stat });
      if (i >= anchors.length - 1) {
        break;
      }
      const nextY = anchors[i + 1];
      if (nextY <= y + 1) {
        continue;
      }
      const key = gapKey(y, nextY);
      if (this.revealedGaps.has(key)) {
        for (let yy = y + 1; yy < nextY; yy++) {
          const mid = h.find((x) => x.horizonYears === yy);
          if (mid && mid.totalRuns > 0) {
            out.push({ kind: 'stats', stats: mid });
          }
        }
      } else {
        out.push({ kind: 'gap', low: y, high: nextY });
      }
    }
    return out;
  }

  isStatsRow = (_index: number, row: HorizonTableRow): boolean => row.kind === 'stats';

  isGapRow = (_index: number, row: HorizonTableRow): boolean => row.kind === 'gap';

  revealGap(low: number, high: number, ev: Event): void {
    ev.stopPropagation();
    const key = gapKey(low, high);
    if (this.revealedGaps.has(key)) {
      return;
    }
    this.revealedGaps = new Set(this.revealedGaps).add(key);
  }

  selectRow(row: HorizonStats): void {
    this.rowSelected.emit(row);
  }
}

function gapKey(low: number, high: number): string {
  return `${low}-${high}`;
}
