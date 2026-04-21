import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxEchartsModule } from 'ngx-echarts';

import { HorizonStats } from './coast-fire-bulk-runner.service';
import { CoastFireBulkRunnerService } from './coast-fire-bulk-runner.service';
import { CoastFirePageComponent } from './coast-fire-page.component';
import { HorizonProbabilityChartComponent } from './horizon-probability-chart.component';
import { HorizonSummaryTableComponent } from './horizon-summary-table.component';

describe('CoastFirePageComponent', () => {
  let fixture: ComponentFixture<CoastFirePageComponent>;
  let component: CoastFirePageComponent;
  let bulkRunner: jasmine.SpyObj<CoastFireBulkRunnerService>;

  const mockRows: HorizonStats[] = [
    {
      horizonYears: 5,
      probability: 0.5,
      totalRuns: 2,
      successes: 1,
      results: [],
    },
  ];

  beforeEach(async () => {
    bulkRunner = jasmine.createSpyObj<CoastFireBulkRunnerService>('CoastFireBulkRunnerService', ['analyze']);
    bulkRunner.analyze.and.returnValue(mockRows);

    await TestBed.configureTestingModule({
      declarations: [
        CoastFirePageComponent,
        HorizonProbabilityChartComponent,
        HorizonSummaryTableComponent,
      ],
      imports: [
        BrowserAnimationsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCardModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatTableModule,
        NgxEchartsModule.forRoot({
          echarts: () => import('../echarts-init').then((m) => m.echarts),
        }),
      ],
      providers: [
        { provide: CoastFireBulkRunnerService, useValue: bulkRunner },
        {
          provide: MatDialog,
          useValue: jasmine.createSpyObj<MatDialog>('MatDialog', ['open']),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CoastFirePageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('runs an initial simulation on init', () => {
    fixture.detectChanges();

    expect(bulkRunner.analyze).toHaveBeenCalledTimes(1);
    expect(component.horizons).toEqual(mockRows);
  });

  it('reruns simulation when inputs change', () => {
    fixture.detectChanges();
    bulkRunner.analyze.calls.reset();
    bulkRunner.analyze.and.returnValue([]);

    component.form.controls.initialInvestment.setValue(400_000);

    expect(bulkRunner.analyze).toHaveBeenCalledTimes(1);
    expect(bulkRunner.analyze).toHaveBeenCalledWith(
      jasmine.objectContaining({
        initialInvestment: 400_000,
      }),
    );
  });

  it('clears results and skips analyze when form is invalid', () => {
    fixture.detectChanges();
    bulkRunner.analyze.calls.reset();
    component.horizons = mockRows;

    component.form.controls.targetInvestment.setValue(0);

    expect(component.form.invalid).toBeTrue();
    expect(component.horizons).toEqual([]);
    expect(bulkRunner.analyze).not.toHaveBeenCalled();
  });
});
