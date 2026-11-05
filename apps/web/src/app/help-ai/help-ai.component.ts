import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AiHelpService,
  AskHelpResponse,
} from '../core/services/ai-help.service';
import { TranslatePipe } from '../core/i18n/t.pipe';
import { I18nService } from '../core/i18n/i18n.service';

@Component({
  selector: 'app-help-ai',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './help-ai.component.html',
})
export class HelpAiComponent {
  private readonly aiHelpService = inject(AiHelpService);
  private readonly i18n = inject(I18nService);

  question = '';
  loading = signal(false);
  error = signal<string | null>(null);
  result = signal<AskHelpResponse | null>(null);

  askHelp(): void {
    const question = this.question.trim();

    if (!question) {
      this.error.set(this.i18n.t('Please enter a question.'));
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);

    this.aiHelpService.askHelp({ question }).subscribe({
      next: (response) => {
        this.result.set(response);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.i18n.t('Could not get a help answer. Please try again.'));
        this.loading.set(false);
      },
    });
  }

  useExample(question: string): void {
    this.question = question;
    this.askHelp();
  }
}