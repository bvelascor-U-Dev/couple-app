import { Service, computed, inject, signal } from '@angular/core';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase.provider';
import type { Session } from '@supabase/supabase-js';

@Service()
export class AuthService {
  private readonly supabase = inject(SUPABASE_CLIENT);
  private readonly _sessionState = signal<Session | null | undefined>(undefined);
  private sessionInitializationStarted = false;

  public readonly session = this._sessionState.asReadonly();

  public readonly user = computed(() => {
    return this.session()?.user ?? null;
  });

  public readonly isAuthenticated = computed(() => {
    return this.session() !== null && this.session() !== undefined;
  });

  public readonly isSessionInitialized = computed(() => {
    return this.session() !== undefined;
  });

  public async signIn(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      throw new Error('Email is required');
    }
    if (password.length === 0) {
      throw new Error('Password is required.');
    }

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: password,
    });
    if (error) {
      throw error;
    }
    return data;
  }

  public async signUp(name: string, email: string, password: string) {
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName) {
      throw new Error('Name is required');
    }
    if (!normalizedEmail) {
      throw new Error('Email is required');
    }
    if (password.length === 0) {
      throw new Error('Password is required.');
    }

    const { data, error } = await this.supabase.auth.signUp({
      email: normalizedEmail,
      password: password,
      options: {
        data: {
          full_name: normalizedName,
        },
      },
    });

    if (error) {
      throw error;
    }

    return data;
  }

  public async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      throw error;
    }
  }

  public async getSession() {
    const { data, error } = await this.supabase.auth.getSession();

    if (error) {
      throw error;
    }

    return data.session;
  }

  public async initializeSession(): Promise<void> {
    if (this.sessionInitializationStarted) {
      return;
    }

    this.sessionInitializationStarted = true;

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this._sessionState.set(session);
    });

    try {
      const session = await this.getSession();
      this._sessionState.set(session);
    } catch {
      this._sessionState.set(null);
    }
  }

  public requireAuthenticatedUserId(): string {
    const userId = this.user()?.id;

    if (!userId) {
      throw new Error('No authenticated user');
    }

    return userId;
  }
}
