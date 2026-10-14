import { Service, inject } from '@angular/core';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase.provider';

@Service()
export class AuthService {
  private readonly supabase = inject(SUPABASE_CLIENT);

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
}
