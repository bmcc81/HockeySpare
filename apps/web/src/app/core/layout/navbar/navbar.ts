import { CommonModule } from '@angular/common';
import { Component, HostListener, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent {
  mobileOpen = signal(false);
  actionsOpen = signal(false);
  accountOpen = signal(false);
  scrolled = signal(false);

  toggleMobile(): void {
    const next = !this.mobileOpen();
    this.mobileOpen.set(next);

    if (!next) {
      this.actionsOpen.set(false);
      this.accountOpen.set(false);
    }
  }

  toggleActions(): void {
    this.actionsOpen.set(!this.actionsOpen());
    this.accountOpen.set(false);
  }

  toggleAccount(): void {
    this.accountOpen.set(!this.accountOpen());
    this.actionsOpen.set(false);
  }

  closeAll(): void {
    this.mobileOpen.set(false);
    this.actionsOpen.set(false);
    this.accountOpen.set(false);
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 10);
  }
}