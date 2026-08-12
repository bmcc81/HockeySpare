import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AdminTeamSummary } from '@hockeyspare/contracts';
import { TeamService } from '../../core/services/team';

@Component({
  selector: 'app-all-teams',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './all-teams.html',
})
export class AllTeamsComponent implements OnInit {
  private readonly teamService = inject(TeamService);
  private readonly router = inject(Router);

  teams = signal<AdminTeamSummary[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  search = signal('');

  filteredTeams(): AdminTeamSummary[] {
    const query = this.search().trim().toLowerCase();

    if (!query) {
      return this.teams();
    }

    return this.teams().filter(
      (team) =>
        team.name.toLowerCase().includes(query) ||
        (team.league?.name ?? '').toLowerCase().includes(query),
    );
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.teamService.listAllTeamsForAdmin().subscribe({
      next: (teams) => {
        this.teams.set(teams);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(
          err?.error?.message || 'Could not load teams.',
        );
        this.loading.set(false);
      },
    });
  }

  setSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.search.set(input.value);
  }

  manageTeam(team: AdminTeamSummary): void {
    this.router.navigate(['/my-team'], {
      queryParams: { teamId: team.id },
    });
  }

  trackByTeamId(_index: number, team: AdminTeamSummary): string {
    return team.id;
  }
}
