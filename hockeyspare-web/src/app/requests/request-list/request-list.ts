import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RequestService } from '../../core/services/request';
import { SpareRequest } from '../../shared/models/request.model';

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Marketplace</h2>

    <div *ngFor="let req of requests" class="card" [ngClass]="req.type">
      <h3>{{ req.position | uppercase }} - {{ req.skillLevel }}</h3>
      <p><strong>Arena:</strong> {{ req.arena }}</p>
      <p><strong>Time:</strong> {{ req.time }}</p>
      <p><strong>Pay:</strong> {{ req.payAmount | currency:'CAD':'symbol' }}</p>
      <p *ngIf="req.notes">{{ req.notes }}</p>

      <button>
        {{ req.type === 'team_needs_player' ? 'Accept Job' : 'Invite Player' }}
      </button>
    </div>
  `,
  styles: [`
    .card {
      border: 1px solid #ddd;
      padding: 12px;
      margin-bottom: 12px;
      border-radius: 6px;
    }
    .team_needs_player { background: #e6f2ff; }
    .player_needs_team { background: #e6ffe6; }
  `]
})
export class RequestListComponent {
  requests: SpareRequest[] = [];

  constructor(private requestService: RequestService) {
    this.requests = this.requestService.getAll();
  }
}
