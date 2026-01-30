import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { switchMap, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { RequestApiService } from '../../core/services/request-api';
import { SpareRequest } from '../../shared/models/request.model';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './request-detail.html',
  styleUrl: './request-detail.scss',
})
export class RequestDetailComponent {
  private route = inject(ActivatedRoute);
  private api = inject(RequestApiService);

  request$: Observable<SpareRequest> = this.route.paramMap.pipe(
    map(pm => Number(pm.get('id'))),
    switchMap(id => this.api.getById(id)),
  );
}
