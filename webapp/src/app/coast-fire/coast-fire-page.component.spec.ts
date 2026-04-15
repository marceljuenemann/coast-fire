import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { CoastFirePageComponent } from './coast-fire-page.component';
import { HorizonSummaryTableComponent } from './horizon-summary-table.component';

describe('CoastFirePageComponent', () => {
  let fixture: ComponentFixture<CoastFirePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CoastFirePageComponent, HorizonSummaryTableComponent],
      imports: [
        BrowserAnimationsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCardModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatTableModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CoastFirePageComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
