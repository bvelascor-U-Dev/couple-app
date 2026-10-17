import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SignInPage } from './sign-in-page';

describe('SignInPage', () => {
  const signIn = vi.fn();

  let component: SignInPage;
  let router: Router;

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [SignInPage],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            signIn,
          },
        },
      ],
    }).compileComponents();

    component = TestBed.createComponent(SignInPage).componentInstance;
    router = TestBed.inject(Router);
  });

  it('should not submit an invalid form', async () => {
    await component.onSubmit();

    expect(component.signInForm.controls.email.touched).toBe(true);
    expect(component.signInForm.controls.password.touched).toBe(true);
    expect(signIn).not.toHaveBeenCalled();
  });

  it('should sign in and navigate to the dashboard', async () => {
    const navigateByUrl = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    signIn.mockResolvedValue({
      user: { id: 'user-1' },
      session: { access_token: 'test-token' },
    });

    component.signInForm.setValue({
      email: 'user@example.com',
      password: 'Password1!',
    });

    await component.onSubmit();

    expect(signIn).toHaveBeenCalledWith('user@example.com', 'Password1!');
    expect(navigateByUrl).toHaveBeenCalledWith('/app/dashboard');
    expect(component.errorMessage()).toBeNull();
    expect(component.isLoading()).toBe(false);
  });

  it('should display an error when sign-in fails', async () => {
    signIn.mockRejectedValue(new Error('Invalid credentials'));

    component.signInForm.setValue({
      email: 'user@example.com',
      password: 'Password1!',
    });

    await component.onSubmit();

    expect(component.errorMessage()).not.toBeNull();
    expect(component.isLoading()).toBe(false);
  });
});
