import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { NgxEchartsModule } from 'ngx-echarts';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoastFirePageComponent } from './coast-fire/coast-fire-page.component';
import { HorizonProbabilityChartComponent } from './coast-fire/horizon-probability-chart.component';
import { HorizonSummaryTableComponent } from './coast-fire/horizon-summary-table.component';
import { PathDetailDialogComponent } from './coast-fire/path-detail-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    CoastFirePageComponent,
    HorizonProbabilityChartComponent,
    HorizonSummaryTableComponent,
    PathDetailDialogComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    NgxEchartsModule.forRoot({
      echarts: () => import('./echarts-init').then(m => m.echarts),
    }),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
