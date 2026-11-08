import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SeoService } from './seo.service';
import { I18nService } from '../i18n/i18n.service';

@Component({ template: '' })
class Blank {}

const canonical = () => document.head.querySelector('link[rel="canonical"]')?.getAttribute('href');
const description = () => document.head.querySelector('meta[name="description"]')?.getAttribute('content');

describe('SeoService', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    document.head.querySelector('link[rel="canonical"]')?.remove();
    document.head.querySelector('meta[name="description"]')?.remove();
    document.title = 'unset';

    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: Blank },
          { path: 'terms', component: Blank, data: { seo: { title: 'Terms of Service - HockeySpare', description: 'The terms.' } } },
          { path: 'tournaments/:id', component: Blank, data: { seo: { keep: true } } },
          { path: 'login', component: Blank },
        ]),
      ],
    });
    TestBed.inject(I18nService).setLang('en');
    TestBed.inject(SeoService).start();
    harness = await RouterTestingHarness.create();
  });

  it('gives a page its own title, description and canonical address', async () => {
    await harness.navigateByUrl('/terms');

    expect(document.title).toBe('Terms of Service - HockeySpare');
    expect(description()).toBe('The terms.');
    expect(canonical()).toBe('https://hockeyspare.webinkgraphics.com/terms');
  });

  it('falls back to the site-wide text, with its own canonical address', async () => {
    await harness.navigateByUrl('/login?next=%2F');

    expect(document.title).toBe(DEFAULT_TITLE);
    expect(description()).toBe(DEFAULT_DESCRIPTION);
    expect(canonical()).toBe('https://hockeyspare.webinkgraphics.com/login');
  });

  it('uses the home address for the home page', async () => {
    await harness.navigateByUrl('/');

    expect(canonical()).toBe('https://hockeyspare.webinkgraphics.com/');
  });

  it("leaves a tournament page's server-written tags alone", async () => {
    document.title = 'Pierrefonds Oldtimers Tournament - HockeySpare';
    document.head.querySelector('link[rel="canonical"]')?.remove();
    await harness.navigateByUrl('/tournaments/abc');

    expect(document.title).toBe('Pierrefonds Oldtimers Tournament - HockeySpare');
    expect(canonical()).toBeUndefined();
  });

  it('shows the title in French when the language is French', async () => {
    TestBed.inject(I18nService).setLang('fr');
    await harness.navigateByUrl('/');

    expect(document.title).toBe('HockeySpare - Trouvez un substitut, gérez votre ligue ou votre tournoi');
    TestBed.inject(I18nService).setLang('en');
  });
});
