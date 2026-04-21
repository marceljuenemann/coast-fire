import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import type { EChartsOption } from 'echarts';

import { HorizonStats } from './coast-fire-bulk-runner.service';

const pct = new Intl.NumberFormat(undefined, {
  style: 'percent',
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});

@Component({
  selector: 'app-horizon-probability-chart',
  templateUrl: './horizon-probability-chart.component.html',
  styleUrls: ['./horizon-probability-chart.component.css'],
})
export class HorizonProbabilityChartComponent implements OnChanges {
  @Input() horizons: HorizonStats[] | null = null;
  @Output() horizonSelected = new EventEmitter<HorizonStats>();

  chartOption: EChartsOption = {};

  private latestHorizons: HorizonStats[] = [];

  /** Smallest horizon where success rate ≥ 50%. */
  get yearsTo50(): number | null {
    return firstHorizonMeetingProbability(this.latestHorizons, 0.5);
  }

  /** Smallest horizon where success rate ≥ 90%. */
  get yearsTo90(): number | null {
    return firstHorizonMeetingProbability(this.latestHorizons, 0.9);
  }

  /** Smallest horizon where every simulated path succeeds (100%). */
  get yearsTo100(): number | null {
    return firstHorizonWithFullSuccess(this.latestHorizons);
  }

  formatYearsLabel(years: number | null): string {
    if (years === null) {
      return '—';
    }
    return years === 1 ? '1 year' : `${years} years`;
  }

  /** Full sentence for screen readers (matches visible copy). */
  summaryAriaLabel(years: number | null, pctLabel: string): string {
    const y = this.formatYearsLabel(years);
    return `${pctLabel} of simulations reach FIRE after ${y}`;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['horizons']) {
      this.latestHorizons = this.horizons ?? [];
      this.chartOption = buildBarOption(this.latestHorizons);
    }
  }

  onChartClick(raw: unknown): void {
    const p = raw as { componentType?: string; dataIndex?: number };
    if (p.componentType !== 'series' || typeof p.dataIndex !== 'number') {
      return;
    }
    const row = this.latestHorizons[p.dataIndex];
    if (row) {
      this.horizonSelected.emit(row);
    }
  }
}

/** First horizon whose empirical probability is at least `threshold` (0–1). */
function firstHorizonMeetingProbability(horizons: HorizonStats[], threshold: number): number | null {
  for (const h of horizons) {
    if (h.totalRuns > 0 && h.probability >= threshold) {
      return h.horizonYears;
    }
  }
  return null;
}

/** First horizon where every run succeeded (avoids float edge cases at 100%). */
function firstHorizonWithFullSuccess(horizons: HorizonStats[]): number | null {
  for (const h of horizons) {
    if (h.totalRuns > 0 && h.successes === h.totalRuns) {
      return h.horizonYears;
    }
  }
  return null;
}

function buildBarOption(horizons: HorizonStats[]): EChartsOption {
  if (!horizons.length) {
    return {};
  }
  const categories = horizons.map((h) => String(h.horizonYears));
  const data = horizons.map((h) => h.probability);

  return {
    grid: {
      left: 56,
      right: 20,
      top: 40,
      bottom: 54,
      containLabel: false,
    },
    tooltip: {
      trigger: 'item',
      formatter: (raw: unknown): string => {
        const p = (Array.isArray(raw) ? raw[0] : raw) as { dataIndex?: number };
        const idx = typeof p.dataIndex === 'number' ? p.dataIndex : -1;
        const h = horizons[idx];
        if (!h) {
          return '';
        }
        return [
          `<strong>${h.horizonYears} years</strong>`,
          `Probability: ${pct.format(h.probability)}`,
          `Simulations: ${h.totalRuns.toLocaleString()}`,
        ].join('<br/>');
      },
    },
    xAxis: {
      type: 'category',
      data: categories,
      name: 'Time horizon (years)',
      nameLocation: 'middle',
      nameGap: 36,
      axisLabel: { rotate: horizons.length > 16 ? 40 : 0 },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 1,
      name: 'Success rate',
      axisLabel: {
        formatter: (v: number) => pct.format(v),
      },
    },
    series: [
      {
        type: 'bar',
        name: 'Probability',
        data,
        barMaxWidth: 14,
        itemStyle: {
          color: 'rgba(57, 73, 171, 0.82)',
          borderRadius: [2, 2, 0, 0],
        },
        emphasis: {
          itemStyle: {
            color: 'rgba(26, 35, 126, 0.92)',
          },
        },
      },
    ],
  };
}
