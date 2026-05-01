import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  NgZone,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStateService } from '../../../auth/auth-state.service';
import { TeamService } from '../../services/team';

type UserRole = 'PLAYER' | 'CAPTAIN' | 'GENERAL_MANAGER';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class NavbarComponent implements OnInit {
  authState = inject(AuthStateService);
  teamService = inject(TeamService);

  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  private scrollTicking = false;

  mobileOpen = signal(false);
  actionsOpen = signal(false);
  accountOpen = signal(false);
  scrolled = signal(false);
  role = signal<UserRole | null>(null);

  roleClass = computed(() => {
    const currentRole = this.role();

    if (!currentRole) return '';

    let badgeStyle = '';

    if (currentRole === 'CAPTAIN') {
      badgeStyle = 'badge-captain';
    } else if (currentRole === 'GENERAL_MANAGER') {
      badgeStyle = 'badge-gm';
    } else {
      badgeStyle = 'badge-player';
    }

    return `role-${currentRole.toLowerCase().replace('_', '-')} ${badgeStyle}`;
  });

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

  ngOnInit(): void {
    this.setupScrollListener();
    this.loadRole();
  }

  private loadRole(): void {
    if (!this.authState.isLoggedIn()) {
      this.role.set(null);
      return;
    }

    this.teamService
      .getMyTeam()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (team) => {
          this.role.set(team.myMembership?.role ?? null);
        },
        error: (err: unknown) => {
          console.error('Failed to load team role', err);
          this.role.set(null);
        },
      });
  }

  private setupScrollListener(): void {
    this.zone.runOutsideAngular(() => {
      const onScroll = () => {
        if (this.scrollTicking) return;

        this.scrollTicking = true;

        requestAnimationFrame(() => {
          const nextScrolled = window.scrollY > 10;

          if (this.scrolled() !== nextScrolled) {
            this.zone.run(() => {
              this.scrolled.set(nextScrolled);
            });
          }

          this.scrollTicking = false;
        });
      };

      window.addEventListener('scroll', onScroll, { passive: true });

      this.destroyRef.onDestroy(() => {
        window.removeEventListener('scroll', onScroll);
      });

      onScroll();
    });
  }

  toggleMobile(): void {
    const next = !this.mobileOpen();
    this.mobileOpen.set(next);

    if (!next) {
      this.actionsOpen.set(false);
      this.accountOpen.set(false);
    }
  }

  toggleActions(): void {
    this.actionsOpen.update((open) => !open);
    this.accountOpen.set(false);
  }

  toggleAccount(): void {
    this.accountOpen.update((open) => !open);
    this.actionsOpen.set(false);
  }

  closeAll(): void {
    this.mobileOpen.set(false);
    this.actionsOpen.set(false);
    this.accountOpen.set(false);
  }

  logout(): void {
    this.authState.clearSession();
    this.role.set(null);
    this.closeAll();
    this.router.navigateByUrl('/login');
  }
}
