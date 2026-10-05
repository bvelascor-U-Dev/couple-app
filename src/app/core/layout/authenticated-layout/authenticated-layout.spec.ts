import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthenticatedLayoutPage } from './authenticated-layout';

describe('AuthenticatedLayoutPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthenticatedLayoutPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AuthenticatedLayoutPage);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should open and close the mobile navigation drawer', () => {
    const fixture = TestBed.createComponent(AuthenticatedLayoutPage);
    const compiled = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();

    const openMenuButton = compiled.querySelector<HTMLButtonElement>(
      '[aria-controls="mobile-menu"]',
    );

    expect(openMenuButton?.getAttribute('aria-expanded')).toBe('false');
    expect(compiled.querySelector('#mobile-menu')).toBeNull();

    openMenuButton?.click();
    fixture.detectChanges();

    expect(openMenuButton?.getAttribute('aria-expanded')).toBe('true');
    expect(compiled.querySelector('#mobile-menu')).not.toBeNull();

    const closeMenuButton = compiled.querySelector<HTMLButtonElement>(
      '#mobile-menu button[aria-label="Cerrar menú"]',
    );

    closeMenuButton?.click();
    fixture.detectChanges();

    expect(openMenuButton?.getAttribute('aria-expanded')).toBe('false');
    expect(compiled.querySelector('#mobile-menu')).toBeNull();
  });
});
