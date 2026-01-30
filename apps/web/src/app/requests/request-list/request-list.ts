import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { RequestApiService } from '../../core/services/request-api';
import { SpareRequest } from '../../shared/models/request.model';

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './request-list.html',
  styleUrls: ['./request-list.scss'],
})
export class RequestListComponent {
  requests$: Observable<SpareRequest[]>;

  constructor(private api: RequestApiService) {
    this.requests$ = this.api.getAll();
  }
}
