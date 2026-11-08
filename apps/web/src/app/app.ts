import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './core/layout/navbar/navbar';
import { TranslatePipe } from './core/i18n/t.pipe';
import { UpdateBannerComponent } from './core/updates/update-banner';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NavbarComponent, TranslatePipe, UpdateBannerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  title = 'hockeyspare-web';
}
