import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

import {
  CoastFireBulkRunnerService,
  DEFAULT_MIN_START_YEAR,
  HorizonStats,
} from './coast-fire-bulk-runner.service';
import { PathDetailDialogComponent, PathDetailDialogData } from './path-detail-dialog.component';

interface DatasetOption {
  label: string;
  minStartYear: number;
}

@Component({
  selector: 'app-coast-fire-page',
  templateUrl: './coast-fire-page.component.html',
  styleUrls: ['./coast-fire-page.component.css'],
})
export class CoastFirePageComponent implements OnInit, OnDestroy {
  readonly datasetOptions: DatasetOption[] = [
    { label: `Shiller composite since ${DEFAULT_MIN_START_YEAR}`, minStartYear: DEFAULT_MIN_START_YEAR },
    { label: 'S&P composite since 1927', minStartYear: 1927 },
    { label: 'S&P 500 since 1957', minStartYear: 1957 },
  ];

  horizons: HorizonStats[] = [];
  showAllYears = false;
  private recalculateSub?: Subscription;
  /** Target FIRE number from the last successful bulk run (for chart Y-axis). */
  private lastCalculatedTargetInvestment: number | null = null;
  /** Initial portfolio from the last successful bulk run (chart year 0). */
  private lastCalculatedInitialInvestment: number | null = null;

  readonly form = this.fb.nonNullable.group({
    targetInvestment: this.fb.control(1_000_000, {
      validators: [Validators.required, Validators.min(1)],
    }),
    initialInvestment: this.fb.control(500_000, {
      validators: [Validators.required, Validators.min(0)],
    }),
    annualInvestment: this.fb.control(0, { validators: [Validators.required] }),
    minStartYear: this.fb.control(DEFAULT_MIN_START_YEAR, { validators: [Validators.required] }),
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly bulkRunner: CoastFireBulkRunnerService,
    private readonly dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.recalculateSub = this.form.valueChanges.subscribe(() => this.recalculate());
    this.recalculate();
  }

  ngOnDestroy(): void {
    this.recalculateSub?.unsubscribe();
  }

  private recalculate(): void {
    if (this.form.invalid) {
      this.horizons = [];
      return;
    }
    const v = this.form.getRawValue() as {
      targetInvestment: number;
      initialInvestment: number;
      annualInvestment: number;
      minStartYear: number;
    };
    this.lastCalculatedTargetInvestment = v.targetInvestment;
    this.lastCalculatedInitialInvestment = v.initialInvestment;
    this.horizons = this.bulkRunner.analyze({
      targetInvestment: v.targetInvestment,
      initialInvestment: v.initialInvestment,
      annualInvestment: v.annualInvestment,
      minStartYear: v.minStartYear,
    });
  }

  toggleAllYears(): void {
    this.showAllYears = !this.showAllYears;
  }

  openDetail(row: HorizonStats): void {
    const raw = this.form.getRawValue() as {
      targetInvestment: number;
      initialInvestment: number;
    };
    const targetInvestment = this.lastCalculatedTargetInvestment ?? raw.targetInvestment;
    const initialInvestment = this.lastCalculatedInitialInvestment ?? raw.initialInvestment;
    const data: PathDetailDialogData = {
      horizonYears: row.horizonYears,
      results: row.results,
      targetInvestment,
      initialInvestment,
    };
    this.dialog.open(PathDetailDialogComponent, {
      data,
      width: '960px',
      maxWidth: '94vw',
      maxHeight: '90vh',
      autoFocus: 'dialog',
    });
  }
}
