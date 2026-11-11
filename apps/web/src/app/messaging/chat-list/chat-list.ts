import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MyTeamSummary } from '@hockeyspare/contracts';
import { TeamService } from '../../core/services/team';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { I18nService } from '../../core/i18n/i18n.service';
import { LoaderComponent } from '../../shared/loader/loader';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [LoaderComponent, CommonModule, RouterLink, TranslatePipe],
  templateUrl: './chat-list.html',
  styleUrl: './chat-list.scss',
})
export class ChatListComponent implements OnInit {
  private readonly teamService = inject(TeamService);
  private readonly i18n = inject(I18nService);

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
        this.error.set(this.i18n.t('Could not load your teams.'));
        this.loading.set(false);
      },
    });
  }

  trackByTeamId(_index: number, team: MyTeamSummary): string {
    return team.id;
  }
}
