import { CommonModule } from '@angular/common';
import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStateService } from '../../../auth/auth-state.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent {
  authState = inject(AuthStateService);
  private router = inject(Router);

  mobileOpen = signal(false);
  actionsOpen = signal(false);
  accountOpen = signal(false);
  scrolled = signal(false);

  displayName = computed(() => {
    const user = this.authState.user();
    if (!user) return '';

    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    return fullName || user.email;
  });

  shortDisplayName = computed(() => {
    const user = this.authState.user();
    if (!user) return '';

    return user.firstName?.trim() || this.displayName();
  });

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

  logout(): void {
    this.authState.clearSession();
    this.closeAll();
    this.router.navigateByUrl('/login');
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 10);
  }
}