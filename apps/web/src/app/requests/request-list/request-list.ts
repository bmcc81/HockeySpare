import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { RequestService } from '../../core/services/request';
import { SpareRequest } from '../../shared/models/request.model';

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './request-list.html',
  styleUrls: ['./request-list.scss'],
})
export class RequestListComponent {
  requests$: Observable<SpareRequest[]>;

  constructor(private requestService: RequestService) {
    this.requests$ = this.requestService.getAll();
  }
}
