import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MyTeamSummary } from '@hockeyspare/contracts';
import { TeamService } from '../../core/services/team';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './chat-list.html',
  styleUrl: './chat-list.scss',
})
export class ChatListComponent implements OnInit {
  private readonly teamService = inject(TeamService);

  teams = signal<MyTeamSummary[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.teamService.listMyTeams().subscribe({
      next: (teams) => {
        this.teams.set(teams);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load your teams.');
        this.loading.set(false);
      },
    });
  }

  trackByTeamId(_index: number, team: MyTeamSummary): string {
    return team.id;
  }
}
