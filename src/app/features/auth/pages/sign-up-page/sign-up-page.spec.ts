import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SignUpPage } from './sign-up-page';

describe('SignUpPage', () => {
  const signUp = vi.fn();

  let component: SignUpPage;
  let router: Router;

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [SignUpPage],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            signUp,
          },
        },
      ],
    }).compileComponents();

    component = TestBed.createComponent(SignUpPage).componentInstance;
    router = TestBed.inject(Router);
  });

  it('should not submit an invalid form', async () => {
    component.signUpForm.setValue({
      name: 'Ana',
      email: 'ana@example.com',
      password: 'Password1!',
      confirmPassword: 'Different1!',
      terms: false,
    });

    await component.onSubmit();

    expect(component.signUpForm.controls.name.hasError('pattern')).toBe(true);
    expect(component.signUpForm.hasError('passwordMismatch')).toBe(true);
    expect(component.signUpForm.controls.terms.hasError('required')).toBe(true);
    expect(signUp).not.toHaveBeenCalled();
  });

  it('should display a confirmation message when email verification is required', async () => {
    const navigateByUrl = vi.spyOn(router, 'navigateByUrl');
    signUp.mockResolvedValue({
      user: { id: 'user-1' },
      session: null,
    });

    component.signUpForm.setValue({
      name: 'Ana Maria',
      email: 'ana@example.com',
      password: 'Password1!',
      confirmPassword: 'Password1!',
      terms: true,
    });

    await component.onSubmit();

    expect(signUp).toHaveBeenCalledWith('Ana Maria', 'ana@example.com', 'Password1!');
    expect(component.successMessage()).toContain('confirmar tu cuenta');
    expect(component.errorMessage()).toBeNull();
    expect(component.isLoading()).toBe(false);
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('should display an error when sign-up fails', async () => {
    signUp.mockRejectedValue(new Error('Sign-up failed'));

    component.signUpForm.setValue({
      name: 'Ana Maria',
      email: 'ana@example.com',
      password: 'Password1!',
      confirmPassword: 'Password1!',
      terms: true,
    });

    await component.onSubmit();

    expect(component.errorMessage()).not.toBeNull();
    expect(component.successMessage()).toBeNull();
    expect(component.isLoading()).toBe(false);
  });
});
