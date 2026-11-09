import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InViewDirective } from '../directives/in-view.directive';
import { TranslatePipe } from '../../core/i18n/t.pipe';

/** Home-page showcase for the Pierrefonds Oldtimers Tournament 2026. */
@Component({
  selector: 'app-featured-tournament',
  standalone: true,
  imports: [RouterLink, InViewDirective, TranslatePipe],
  templateUrl: './featured-tournament.html',
  styleUrl: './featured-tournament.scss',
})
export class FeaturedTournamentComponent {
  readonly featuredTournamentId = 'cmspgfwhd0006g3yqolfrjj9j';
}
