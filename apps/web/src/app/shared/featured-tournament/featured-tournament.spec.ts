import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { FeaturedTournamentComponent } from './featured-tournament';

describe('FeaturedTournamentComponent', () => {
  let fixture: ComponentFixture<FeaturedTournamentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeaturedTournamentComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(FeaturedTournamentComponent);
    fixture.detectChanges();
  });

  it('links to the tournament public page and its program', () => {
    const id = fixture.componentInstance.featuredTournamentId;
    const hrefs = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('a'),
    ).map((a) => a.getAttribute('href'));
    expect(hrefs).toContain(`/tournaments/${id}`);
    expect(hrefs).toContain(`/tournaments/${id}/program`);
  });
});
