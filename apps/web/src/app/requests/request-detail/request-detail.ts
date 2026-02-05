import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { switchMap, map, filter } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { RequestApiService } from '../../core/services/request-api';
import { SpareRequest, RequestType } from '@hockeyspare/contracts';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './request-detail.html',
  styleUrl: './request-detail.scss',
})
export class RequestDetailComponent {
  readonly RequestType = RequestType;

  private route = inject(ActivatedRoute);
  private api = inject(RequestApiService);

  request$: Observable<SpareRequest> = this.route.paramMap.pipe(
    map(pm => Number(pm.get('id'))),
    filter((id): id is number => Number.isFinite(id) && id > 0),
    switchMap(id => this.api.getRequestById(id)),
  );

  nameLabel(req: SpareRequest): string {
    return req.type === RequestType.PLAYER_NEEDS_TEAM ? 'Player Name' : 'Team Name';
  }

  nameValue(req: SpareRequest): string {
    return req.type === RequestType.PLAYER_NEEDS_TEAM ? req.playerName : req.teamName;
  }
}
