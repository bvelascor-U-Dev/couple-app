import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NavigationComponent } from './navigation-component';
import { AuthService } from '../../../../features/auth/services/auth.service';

describe('NavigationComponent', () => {
  const authServiceMock = {
    signOut: vi.fn(),
  };
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationComponent],
      providers: [provideRouter([]),
      {
        provide: AuthService,
        useValue: authServiceMock,
      },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(NavigationComponent);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render links to the application areas', () => {
    const fixture = TestBed.createComponent(NavigationComponent);
    const compiled = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();

    const destinations = Array.from(compiled.querySelectorAll<HTMLAnchorElement>('a[href]')).map(
      (link) => link.getAttribute('href'),
    );

    expect(destinations).toEqual([
      '/app/dashboard',
      '/app/finance',
      '/app/goals-habits',
      '/app/plans-hobbies',
      '/app/projects-trips',
      '/app/profile',
    ]);
  });
});
