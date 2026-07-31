import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, interval, startWith, switchMap } from 'rxjs';
import { TeamMessage } from '@hockeyspare/contracts';
import { TeamService } from '../../core/services/team';
import { AuthStateService } from '../../auth/auth-state.service';

const POLL_INTERVAL_MS = 10000;

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './chat-window.html',
  styleUrl: './chat-window.scss',
})
export class ChatWindowComponent implements OnInit, OnDestroy, AfterViewChecked {
  private readonly route = inject(ActivatedRoute);
  private readonly teamService = inject(TeamService);
  private readonly authState = inject(AuthStateService);
  private readonly fb = inject(NonNullableFormBuilder);

  @ViewChild('scrollAnchor') private scrollAnchor?: ElementRef<HTMLElement>;

  teamId = '';
  teamName = signal<string>('');

  messages = signal<TeamMessage[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  sending = signal(false);

  private pollSub?: Subscription;
  private shouldScroll = false;

  messageForm = this.fb.group({
    body: ['', [Validators.required, Validators.maxLength(2000)]],
  });

  ngOnInit(): void {
    this.teamId = this.route.snapshot.paramMap.get('id') ?? '';

    if (!this.teamId) {
      this.loading.set(false);
      this.error.set('Team id was not found.');
      return;
    }

    this.loadTeamName();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.shouldScroll = false;
      this.scrollAnchor?.nativeElement.scrollIntoView({ block: 'end' });
    }
  }

  private loadTeamName(): void {
    this.teamService.listMyTeams().subscribe({
      next: (teams) => {
        const team = teams.find((t) => t.id === this.teamId);
        this.teamName.set(team?.name ?? 'Team Chat');
      },
    });
  }

  private startPolling(): void {
    this.pollSub = interval(POLL_INTERVAL_MS)
      .pipe(
        startWith(0),
        switchMap(() => this.teamService.getTeamMessages(this.teamId)),
      )
      .subscribe({
        next: (messages) => {
          const grew = messages.length > this.messages().length;

          this.messages.set(messages);
          this.loading.set(false);
          this.error.set(null);

          if (grew) {
            this.shouldScroll = true;
          }
        },
        error: () => {
          this.loading.set(false);
          this.error.set(
            'Could not load messages. Make sure you are a member of this team.',
          );
        },
      });
  }

  send(): void {
    if (this.messageForm.invalid || this.sending()) {
      this.messageForm.markAllAsTouched();
      return;
    }

    const body = this.messageForm.controls.body.value.trim();

    if (!body) {
      return;
    }

    this.sending.set(true);

    this.teamService.postTeamMessage(this.teamId, { body }).subscribe({
      next: (message) => {
        this.messages.update((messages) => [...messages, message]);
        this.messageForm.reset({ body: '' });
        this.sending.set(false);
        this.shouldScroll = true;
      },
      error: () => {
        this.error.set('Could not send message.');
        this.sending.set(false);
      },
    });
  }

  isOwnMessage(message: TeamMessage): boolean {
    return message.authorId === this.authState.user()?.id;
  }

  authorName(message: TeamMessage): string {
    const author = message.author;
    const fullName = `${author.firstName ?? ''} ${author.lastName ?? ''}`.trim();
    return fullName || author.email;
  }

  trackByMessageId(_index: number, message: TeamMessage): string {
    return message.id;
  }
}
