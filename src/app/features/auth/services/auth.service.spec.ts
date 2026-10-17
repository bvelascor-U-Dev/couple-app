import { TestBed } from '@angular/core/testing';
import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase.provider';

describe('AuthService', () => {
  const signInWithPassword = vi.fn();
  const signUp = vi.fn();
  const signOut = vi.fn();
  const getSession = vi.fn();
  const onAuthStateChange = vi.fn();

  const supabaseClientMock = {
    auth: {
      signInWithPassword,
      signUp,
      signOut,
      getSession,
      onAuthStateChange,
    },
  } as unknown as SupabaseClient;

  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        {
          provide: SUPABASE_CLIENT,
          useValue: supabaseClientMock,
        },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  it('should start with an uninitialized session state', () => {
    expect(service.session()).toBeUndefined();
    expect(service.isSessionInitialized()).toBe(false);
    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBeNull();
  });

  it('should restore the existing session during initialization', async () => {
    const session = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'user-1',
      },
    } as Session;

    getSession.mockResolvedValue({
      data: {
        session,
      },
      error: null,
    });

    onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });

    await service.initializeSession();

    expect(getSession).toHaveBeenCalledTimes(1);
    expect(onAuthStateChange).toHaveBeenCalledTimes(1);
    expect(service.session()).toBe(session);
    expect(service.isSessionInitialized()).toBe(true);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.user()).toBe(session.user);
  });

  it('should update the session when the authentication state changes', async () => {
    let authStateChangeCallback:
      ((event: AuthChangeEvent, session: Session | null) => void) | undefined;

    onAuthStateChange.mockImplementation((callback) => {
      authStateChangeCallback = callback;

      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      };
    });

    getSession.mockResolvedValue({
      data: {
        session: null,
      },
      error: null,
    });

    await service.initializeSession();

    expect(service.session()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);

    const session = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'user-2',
      },
    } as Session;

    authStateChangeCallback?.('SIGNED_IN', session);

    expect(service.session()).toBe(session);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.user()).toBe(session.user);

    authStateChangeCallback?.('SIGNED_OUT', null);

    expect(service.session()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBeNull();
  });

  it('should initialize the session only once', async () => {
    getSession.mockResolvedValue({
      data: {
        session: null,
      },
      error: null,
    });

    onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });

    await service.initializeSession();
    await service.initializeSession();

    expect(getSession).toHaveBeenCalledTimes(1);
    expect(onAuthStateChange).toHaveBeenCalledTimes(1);
  });

  it('should sign in using a normalized email', async () => {
    const authData = {
      user: { id: 'user-1' },
      session: { access_token: 'test-token' },
    };

    signInWithPassword.mockResolvedValue({
      data: authData,
      error: null,
    });

    const result = await service.signIn('  USER@Example.COM  ', 'valid-password');

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'valid-password',
    });

    expect(result).toBe(authData);
  });

  it('should propagate the sign-in error returned by Supabase', async () => {
    const authenticationError = new Error('Invalid login credentials');

    signInWithPassword.mockResolvedValue({
      data: {
        user: null,
        session: null,
      },
      error: authenticationError,
    });

    await expect(service.signIn('user@example.com', 'wrong-password')).rejects.toBe(
      authenticationError,
    );
  });

  it('should reject an empty email without calling Supabase', async () => {
    await expect(service.signIn('   ', 'valid-password')).rejects.toThrow('Email is required');

    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it('should reject an empty password without calling Supabase', async () => {
    await expect(service.signIn('user@example.com', '')).rejects.toThrow('Password is required.');

    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it('should sign up using normalized user data', async () => {
    const authData = {
      user: { id: 'user-1' },
      session: null,
    };

    signUp.mockResolvedValue({
      data: authData,
      error: null,
    });

    const result = await service.signUp(
      '  Sofia Example  ',
      '  SOFIA@Example.COM  ',
      'valid-password',
    );

    expect(signUp).toHaveBeenCalledWith({
      email: 'sofia@example.com',
      password: 'valid-password',
      options: {
        data: {
          full_name: 'Sofia Example',
        },
      },
    });

    expect(result).toBe(authData);
  });

  it('should propagate the sign-up error returned by Supabase', async () => {
    const registrationError = new Error('Sign-up failed');

    signUp.mockResolvedValue({
      data: {
        user: null,
        session: null,
      },
      error: registrationError,
    });

    await expect(
      service.signUp('Sofia Example', 'sofia@example.com', 'valid-password'),
    ).rejects.toBe(registrationError);
  });

  it('should reject an empty name without calling Supabase', async () => {
    await expect(service.signUp('   ', 'sofia@example.com', 'valid-password')).rejects.toThrow(
      'Name is required',
    );

    expect(signUp).not.toHaveBeenCalled();
  });

  it('should reject an empty sign-up email without calling Supabase', async () => {
    await expect(service.signUp('Sofia Example', '   ', 'valid-password')).rejects.toThrow(
      'Email is required',
    );

    expect(signUp).not.toHaveBeenCalled();
  });

  it('should reject an empty sign-up password without calling Supabase', async () => {
    await expect(service.signUp('Sofia Example', 'sofia@example.com', '')).rejects.toThrow(
      'Password is required.',
    );

    expect(signUp).not.toHaveBeenCalled();
  });

  it('should sign out the current user', async () => {
    signOut.mockResolvedValue({
      error: null,
    });

    await expect(service.signOut()).resolves.toBeUndefined();

    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('should propagate the sign-out error returned by Supabase', async () => {
    const signOutError = new Error('Sign-out failed');

    signOut.mockResolvedValue({
      error: signOutError,
    });

    await expect(service.signOut()).rejects.toBe(signOutError);
  });

  it('should return the current session', async () => {
    const session = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'user-1',
      },
    };

    getSession.mockResolvedValue({
      data: {
        session,
      },
      error: null,
    });

    const result = await service.getSession();

    expect(getSession).toHaveBeenCalledTimes(1);
    expect(result).toBe(session);
  });

  it('should propagate the session error returned by Supabase', async () => {
    const sessionError = new Error('Session retrieval failed');

    getSession.mockResolvedValue({
      data: {
        session: null,
      },
      error: sessionError,
    });

    await expect(service.getSession()).rejects.toBe(sessionError);
  });
});
