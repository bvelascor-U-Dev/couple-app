import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  const isAuthenticated = vi.fn();

  let router: Router;

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            isAuthenticated,
          },
        },
      ],
    });

    router = TestBed.inject(Router);
  });

  function executeGuard() {
    return TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  }

  it('should allow navigation when the user is authenticated', () => {
    isAuthenticated.mockReturnValue(true);

    const result = executeGuard();

    expect(result).toBe(true);
    expect(isAuthenticated).toHaveBeenCalledTimes(1);
  });

  it('should redirect to sign-in when the user is not authenticated', () => {
    isAuthenticated.mockReturnValue(false);

    const result = executeGuard();

    expect(result).toEqual(router.createUrlTree(['/auth/sign-in']));
    expect(isAuthenticated).toHaveBeenCalledTimes(1);
  });
});
