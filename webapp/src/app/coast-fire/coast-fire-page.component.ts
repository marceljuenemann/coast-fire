import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

import {
  CoastFireBulkRunnerService,
  HorizonStats,
} from './coast-fire-bulk-runner.service';
import { PathDetailDialogComponent, PathDetailDialogData } from './path-detail-dialog.component';

@Component({
  selector: 'app-coast-fire-page',
  templateUrl: './coast-fire-page.component.html',
  styleUrls: ['./coast-fire-page.component.css'],
})
export class CoastFirePageComponent {
  horizons: HorizonStats[] = [];
  calculating = false;
  showAllYears = false;

  readonly form = this.fb.nonNullable.group({
    targetInvestment: this.fb.control(1_000_000, {
      validators: [Validators.required, Validators.min(1)],
    }),
    initialInvestment: this.fb.control(500_000, {
      validators: [Validators.required, Validators.min(0)],
    }),
    annualInvestment: this.fb.control(0, { validators: [Validators.required] }),
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly bulkRunner: CoastFireBulkRunnerService,
    private readonly dialog: MatDialog,
  ) {}

  calculate(): void {
    if (this.form.invalid || this.calculating) {
      this.form.markAllAsTouched();
      return;
    }
    this.calculating = true;
    const v = this.form.getRawValue() as {
      targetInvestment: number;
      initialInvestment: number;
      annualInvestment: number;
    };
    try {
      this.horizons = this.bulkRunner.analyze({
        targetInvestment: v.targetInvestment,
        initialInvestment: v.initialInvestment,
        annualInvestment: v.annualInvestment,
      });
    } finally {
      this.calculating = false;
    }
  }

  toggleAllYears(): void {
    this.showAllYears = !this.showAllYears;
  }

  openDetail(row: HorizonStats): void {
    const data: PathDetailDialogData = {
      horizonYears: row.horizonYears,
      results: row.results,
    };
    this.dialog.open(PathDetailDialogComponent, {
      data,
      width: '920px',
      maxWidth: '94vw',
      maxHeight: '90vh',
      autoFocus: 'dialog',
    });
  }
}
