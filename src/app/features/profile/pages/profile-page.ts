import { Component, inject, OnInit, signal } from '@angular/core';
import { ProfileService } from '../services/profile.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FULL_NAME_PATTERN } from '../../../shared/validators/full-name.validator';
import { UpdateProfileInput } from '../models/updateProfile';

@Component({
  selector: 'app-profile-page',
  imports: [ReactiveFormsModule],
  templateUrl: './profile-page.html',
})
export class ProfilePage implements OnInit {
  private readonly profileService = inject(ProfileService);

  public readonly isLoading = signal(true);
  public readonly isSaving = signal(false);
  public readonly saveErrorMessage = signal<string | null>(null);
  public readonly loadErrorMessage = signal<string | null>(null);
  public readonly successMessage = signal<string | null>(null);

  public readonly profileForm = new FormGroup({
    displayName : new FormControl('',{
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(FULL_NAME_PATTERN)],
    }),
  });

   public ngOnInit(): void {
    void this.loadProfile();
  }

  private async loadProfile(): Promise<void> {

    this.isLoading.set(true);
    this.loadErrorMessage.set(null);
    try{
      const profile = await this.profileService.getProfile();

      this.profileForm.patchValue({
      displayName: profile.displayName,
    })
    } catch {
      this.loadErrorMessage.set('No fue posible cargar tu perfil. Recarga la página e inténtalo nuevamente');
    } finally {
      this.isLoading.set(false);
    }
    
  }

  public async onSubmit(): Promise<void> {
    if(this.profileForm.invalid){
      this.profileForm.markAllAsTouched();
      return;
    }
    
    if(this.isSaving() || this.isLoading()){
      return;
    }

    this.isSaving.set(true);
    this.saveErrorMessage.set(null);
    this.successMessage.set(null);

    const updatedProfileInput: UpdateProfileInput = {
      displayName: this.profileForm.getRawValue().displayName
    }

    try{
      const updatedProfile = await this.profileService.updateProfile(updatedProfileInput);

      this.profileForm.patchValue({
        displayName: updatedProfile.displayName
      })

      this.successMessage.set('Tu perfil se actualizó correctamente.');
    } catch {
      this.saveErrorMessage.set('No pudimos guardar los cambios de tu perfil. Inténtalo nuevamente.')
    } finally {
      this.isSaving.set(false);
    }

  }
}
