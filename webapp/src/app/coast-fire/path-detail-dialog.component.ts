import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
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

@Component({
  selector: 'app-path-detail-dialog',
  templateUrl: './path-detail-dialog.component.html',
  styleUrls: ['./path-detail-dialog.component.css'],
})
export class PathDetailDialogComponent {
  readonly chartOption: EChartsOption;

  constructor(@Inject(MAT_DIALOG_DATA) public data: PathDetailDialogData) {
    this.chartOption = buildPathChartOption(data);
  }
}

function buildPathChartOption(data: PathDetailDialogData): EChartsOption {
  const { horizonYears, results, targetInvestment, initialInvestment } = data;
  const categories = Array.from({ length: horizonYears + 1 }, (_, i) => String(i));

  const lineRgba = 'rgba(57, 73, 171, 0.09)';
  const lineEmphasisRgba = 'rgba(26, 35, 126, 0.9)';
  const symbolBorder = 'rgba(57, 73, 171, 0.28)';

  const lineSeries: EChartsOption['series'] = results.map((r) => {
    const row: (number | null)[] = [initialInvestment];
    for (let i = 0; i < horizonYears; i++) {
      row.push(i < r.investmentByYear.length ? r.investmentByYear[i] : null);
    }
    return {
      type: 'line',
      name: startLabel(r),
      data: row,
      showSymbol: true,
      showAllSymbol: true,
      symbol: 'circle',
      symbolSize: 4,
      triggerLineEvent: false,
      connectNulls: false,
      lineStyle: {
        width: 2,
        color: lineRgba,
      },
      itemStyle: {
        color: '#ffffff',
        borderColor: symbolBorder,
        borderWidth: 1,
      },
      emphasis: {
        focus: 'series',
        scale: false,
        lineStyle: {
          width: 3,
          color: lineEmphasisRgba,
        },
        itemStyle: {
          color: '#ffffff',
          borderColor: lineEmphasisRgba,
          borderWidth: 1.5,
        },
      },
    };
  });

  return {
    animation: false,
    tooltip: {
      show: true,
      showContent: true,
      trigger: 'item',
      confine: false,
      appendToBody: true,
      renderMode: 'html',
      className: 'path-detail-echarts-tooltip',
      formatter(params) {
        if (params == null || Array.isArray(params)) {
          return '';
        }
        if (params.seriesType !== 'line') {
          return '';
        }
        const raw = params.value;
        if (raw == null || raw === '-' || typeof raw !== 'number' || Number.isNaN(raw)) {
          return '';
        }
        const dataIndex = params.dataIndex ?? 0;
        const monthYear = (params.seriesName ?? '').trim();
        const yearLabel = dataIndex === 0 ? 'Year 0 (current)' : `Year ${dataIndex}`;
        const simulationLine = monthYear
          ? `Simulation starting ${monthYear}`
          : 'Simulation starting';
        return `${yearLabel}: ${formatCurrency(raw)}<br/>${simulationLine}`;
      },
    },
    grid: {
      left: 56,
      right: 20,
      top: 40,
      bottom: 54,
      containLabel: false,
    },
    xAxis: {
      type: 'category',
      name: 'Year',
      nameLocation: 'middle',
      nameGap: 36,
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
    series: lineSeries,
  };
}
