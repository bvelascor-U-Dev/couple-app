import { inject, Service } from '@angular/core';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase.provider';
import { AuthService } from '../../auth/services/auth.service';
import { Profile } from '../models/profile.model';
import { UpdateProfileInput } from '../models/updateProfile';

interface ProfileRow {
  id: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

@Service()
export class ProfileService {
    private readonly supabase = inject(SUPABASE_CLIENT);
    private readonly authService = inject(AuthService);

    public async getProfile (): Promise<Profile> {
        const userId = this.getAuthenticatedUserId();
        
        const { data, error } = await this.supabase
          .from('profiles')
          .select('id,display_name,created_at,updated_at')
          .eq('id',userId)
          .single();

        if(error){
            throw error;
        }

        if (!data) {
            throw new Error('Profile not found.');
        }
        
        return this.toProfile(data);     
    }

    public async updateProfile (input: UpdateProfileInput): Promise<Profile> {
        const userId = this.getAuthenticatedUserId();

        const displayName = input.displayName.trim();

        if (!displayName) {
        throw new Error('Display name is required.');
        }

        const { data, error} = await this.supabase
            .from('profiles')
            .update({
                display_name: displayName
            })
            .eq('id',userId)
            .select('id,display_name,created_at,updated_at')
            .single()

        if(error){
            throw error;
        }

        if (!data) {
            throw new Error('Profile not found.');
        }

        return this.toProfile(data);
    }

    private getAuthenticatedUserId(): string {
        const userId = this.authService.user()?.id;

        if(!userId){
            throw new Error ('No authenticated user.');
        }

        return userId;
    }

    private toProfile(row: ProfileRow): Profile {
        return {
            id: row.id,
            displayName: row.display_name,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}
