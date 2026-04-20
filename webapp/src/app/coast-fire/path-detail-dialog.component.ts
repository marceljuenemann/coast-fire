import { Component, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import type { ECharts } from 'echarts/core';
import type { EChartsOption } from 'echarts';

import { SingleResult } from '../calc/simulation';

export interface PathDetailDialogData {
  horizonYears: number;
  results: SingleResult[];
  targetInvestment: number;
  /** Starting portfolio (year 0), same for all paths in this run. */
  initialInvestment: number;
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function startLabel(r: SingleResult): string {
  return `${MONTHS[r.startMonth]} ${r.startYear}`;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  }).format(n);
}

function formatAxisValue(v: number): string {
  if (v >= 1e9) {
    return `${(v / 1e9).toFixed(1)}B`;
  }
  if (v >= 1e6) {
    return `${(v / 1e6).toFixed(1)}M`;
  }
  if (v >= 1e3) {
    return `${(v / 1e3).toFixed(0)}k`;
  }
  return String(Math.round(v));
}

/** Portfolio value at chart dataIndex (0 = year 0 / current). */
function valueAtYear(
  r: SingleResult,
  dataIndex: number,
  initialInvestment: number,
): number | null {
  if (dataIndex === 0) {
    return initialInvestment;
  }
  const yi = dataIndex - 1;
  if (yi < r.investmentByYear.length) {
    return r.investmentByYear[yi];
  }
  return null;
}

@Component({
  selector: 'app-path-detail-dialog',
  templateUrl: './path-detail-dialog.component.html',
  styleUrls: ['./path-detail-dialog.component.css'],
})
export class PathDetailDialogComponent implements OnDestroy {
  readonly chartOption: EChartsOption;

  private removeZrListeners: (() => void) | null = null;
  private tipRaf = 0;

  constructor(@Inject(MAT_DIALOG_DATA) public data: PathDetailDialogData) {
    this.chartOption = buildPathChartOption(data);
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.tipRaf);
    this.detachZrListeners();
  }

  onChartInit(chart: ECharts): void {
    this.detachZrListeners();

    const zr = chart.getZr();
    const gridFinder = { gridIndex: 0 as const };
    const { results, horizonYears, initialInvestment } = this.data;
    const nCat = horizonYears + 1;

    const onMove = (ev: { offsetX: number; offsetY: number }): void => {
      if (chart.isDisposed()) {
        return;
      }
      if (!chart.containPixel(gridFinder, [ev.offsetX, ev.offsetY])) {
        chart.dispatchAction({ type: 'hideTip' });
        return;
      }

      let bestJ = 0;
      let bestDx = Infinity;
      for (let j = 0; j < nCat; j++) {
        const pxPair = chart.convertToPixel(gridFinder, [String(j), 0]);
        if (!pxPair) {
          continue;
        }
        const dx = Math.abs(pxPair[0] - ev.offsetX);
        if (dx < bestDx) {
          bestDx = dx;
          bestJ = j;
        }
      }

      const from = chart.convertFromPixel(gridFinder, [ev.offsetX, ev.offsetY]);
      const yPointer = from?.[1];
      if (yPointer == null || !Number.isFinite(yPointer)) {
        chart.dispatchAction({ type: 'hideTip' });
        return;
      }

      let bestI = -1;
      let bestDist = Infinity;
      for (let i = 0; i < results.length; i++) {
        const v = valueAtYear(results[i], bestJ, initialInvestment);
        if (v == null) {
          continue;
        }
        const d = Math.abs(v - yPointer);
        if (d < bestDist) {
          bestDist = d;
          bestI = i;
        }
      }

      if (bestI < 0) {
        chart.dispatchAction({ type: 'hideTip' });
        return;
      }

      cancelAnimationFrame(this.tipRaf);
      this.tipRaf = requestAnimationFrame(() => {
        if (chart.isDisposed()) {
          return;
        }
        chart.dispatchAction({
          type: 'showTip',
          seriesIndex: bestI,
          dataIndex: bestJ,
        });
      });
    };

    const onGlobalOut = (): void => {
      cancelAnimationFrame(this.tipRaf);
      if (!chart.isDisposed()) {
        chart.dispatchAction({ type: 'hideTip' });
      }
    };

    zr.on('mousemove', onMove);
    zr.on('globalout', onGlobalOut);
    this.removeZrListeners = () => {
      zr.off('mousemove', onMove);
      zr.off('globalout', onGlobalOut);
    };
  }

  private detachZrListeners(): void {
    this.removeZrListeners?.();
    this.removeZrListeners = null;
  }
}

function buildPathChartOption(data: PathDetailDialogData): EChartsOption {
  const { horizonYears, results, targetInvestment, initialInvestment } = data;
  const categories = Array.from({ length: horizonYears + 1 }, (_, i) => String(i));

  const lineRgba = 'rgba(57, 73, 171, 0.09)';
  const lineEmphasisRgba = 'rgba(26, 35, 126, 0.9)';

  const series: EChartsOption['series'] = results.map((r) => {
    const row: (number | null)[] = [initialInvestment];
    for (let i = 0; i < horizonYears; i++) {
      row.push(i < r.investmentByYear.length ? r.investmentByYear[i] : null);
    }
    return {
      type: 'line',
      name: startLabel(r),
      data: row,
      showSymbol: false,
      triggerLineEvent: true,
      connectNulls: false,
      lineStyle: {
        width: 2,
        color: lineRgba,
      },
      emphasis: {
        focus: 'series',
        scale: false,
        lineStyle: {
          width: 3,
          color: lineEmphasisRgba,
        },
      },
    };
  });

  return {
    animation: false,
    tooltip: {
      trigger: 'item',
      confine: false,
      appendToBody: true,
      renderMode: 'html',
      className: 'path-detail-echarts-tooltip',
      formatter(params) {
        if (params == null || Array.isArray(params)) {
          return '';
        }
        const idx = params.dataIndex ?? 0;
        const val = params.value as number;
        if (typeof val !== 'number' || Number.isNaN(val)) {
          return '';
        }
        const name = params.seriesName ?? '';
        const yearLine =
          idx === 0 ? `Year 0 (current): ${formatCurrency(val)}` : `Year ${idx}: ${formatCurrency(val)}`;
        return `${name}<br/>${yearLine}`;
      },
    },
    grid: {
      left: 56,
      right: 20,
      top: 40,
      bottom: 36,
      containLabel: false,
    },
    xAxis: {
      type: 'category',
      name: 'Year',
      nameLocation: 'middle',
      nameGap: 28,
      boundaryGap: false,
      data: categories,
    },
    yAxis: {
      type: 'value',
      name: 'Investment',
      min: 0,
      max: targetInvestment,
      axisLabel: {
        formatter: (v: number) => formatAxisValue(v),
      },
    },
    series,
  };
}
