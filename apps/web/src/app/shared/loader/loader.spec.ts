import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoaderComponent } from './loader';

describe('LoaderComponent', () => {
  let fixture: ComponentFixture<LoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LoaderComponent] }).compileComponents();
    fixture = TestBed.createComponent(LoaderComponent);
  });

  it('shows the label and announces itself to screen readers', () => {
    fixture.componentRef.setInput('label', 'Loading standings...');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const status = el.querySelector('[role="status"]');

    expect(status).not.toBeNull();
    expect(status?.textContent).toContain('Loading standings...');
  });

  it('hides the decoration from screen readers', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.rink')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('can be compact', () => {
    fixture.componentRef.setInput('compact', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.loader')?.classList).toContain('compact');
  });
});
