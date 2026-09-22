import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { PlayerHighlights } from '@hockeyspare/contracts';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-player-highlights',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-highlights.html',
  styleUrl: './player-highlights.scss',
})
export class PlayerHighlightsComponent implements OnChanges, OnDestroy {
  @Input() scope: 'home' | 'league' | 'tournament' = 'home';
  @Input() competitionId = '';
  @Input() searchTerm = '';
  @Input() refreshKey: unknown;
  private readonly http = inject(HttpClient);
  private request?: Subscription;
  readonly failedPhotos = signal<Set<string>>(new Set());

  photoFailed(url: string) {
    this.failedPhotos.update((current) => new Set([...current, url]));
  }

  readonly data = signal<PlayerHighlights | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['scope'] || changes['competitionId']) {
      this.load();
    } else if (changes['refreshKey']) {
      this.load(true);
    }
  }

  filteredLeaders() {
    const query = this.searchTerm.trim().toLowerCase();
    return (this.data()?.pointLeaders ?? []).filter(
      (player) =>
        !query ||
        player.displayName.toLowerCase().includes(query) ||
        player.teamName.toLowerCase().includes(query),
    );
  }
  ngOnDestroy() {
    this.request?.unsubscribe();
  }

  load(preserveData = false) {
    this.request?.unsubscribe();
    if (!preserveData) this.data.set(null);
    this.error.set(false);
    this.loading.set(true);
    const id = encodeURIComponent(this.competitionId);
    const url =
      this.scope === 'league'
        ? `/api/leagues/${id}/player-highlights`
        : this.scope === 'tournament'
          ? `/api/player-highlights/tournaments/${id}`
          : '/api/player-highlights';
    this.request = this.http.get<PlayerHighlights>(url).subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  initials(name: string) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? '')
      .join('')
      .toUpperCase();
  }
}
