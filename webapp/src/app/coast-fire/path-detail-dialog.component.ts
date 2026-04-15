import { AfterViewInit, Component, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

import { SingleResult } from '../calc/simulation';

export interface PathDetailDialogData {
  horizonYears: number;
  results: SingleResult[];
}

@Component({
  selector: 'app-path-detail-dialog',
  templateUrl: './path-detail-dialog.component.html',
  styleUrls: ['./path-detail-dialog.component.css'],
})
export class PathDetailDialogComponent implements AfterViewInit {
  readonly displayedColumns: string[] = ['start', 'reached', 'years', 'final'];
  readonly dataSource = new MatTableDataSource<SingleResult>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(@Inject(MAT_DIALOG_DATA) public data: PathDetailDialogData) {
    this.dataSource.data = data.results;
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  startLabel(r: SingleResult): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[r.startMonth]} ${r.startYear}`;
  }
}
