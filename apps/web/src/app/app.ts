import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './core/layout/navbar/navbar';
import { TranslatePipe } from './core/i18n/t.pipe';
import { UpdateBannerComponent } from './core/updates/update-banner';
import { SeoService } from './core/seo/seo.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NavbarComponent, TranslatePipe, UpdateBannerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  title = 'hockeyspare-web';

  constructor() {
    inject(SeoService).start();
  }
}
