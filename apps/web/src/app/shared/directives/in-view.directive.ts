import {
  AfterViewInit,
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  Renderer2,
  inject,
} from '@angular/core';

@Directive({
  selector: '[appInView]',
  standalone: true,
})
export class InViewDirective implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private renderer = inject(Renderer2);
  private observer?: IntersectionObserver;

  @Input('appInView') delay = 0;
  @Input() inViewOnce = true;

  ngAfterViewInit(): void {
    const element = this.el.nativeElement;

    this.renderer.addClass(element, 'reveal');
    this.renderer.setStyle(element, 'transition-delay', `${this.delay}ms`);

    if (
      typeof window === 'undefined' ||
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      this.renderer.addClass(element, 'reveal-visible');
      return;
    }

    this.observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.renderer.addClass(element, 'reveal-visible');

            if (this.inViewOnce) {
              this.observer?.unobserve(element);
            }
          } else if (!this.inViewOnce) {
            this.renderer.removeClass(element, 'reveal-visible');
          }
        }
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -8% 0px',
      },
    );

    this.observer.observe(element);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}