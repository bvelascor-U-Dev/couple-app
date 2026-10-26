import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CoupleSpaceService } from '../../services/couple-space.service';
import { CoupleSpaceOverview } from '../../models/couple-space-overview.model';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CoupleSpaceInvitation } from '../../models/couple-space-invitation.model';

@Component({
  selector: 'app-couple-space-page',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './couple-space-page.html',
})
export class CoupleSpacePage implements OnInit {
  private readonly coupleSpaceService = inject(CoupleSpaceService);

  public readonly coupleSpaceOverview = signal<CoupleSpaceOverview | null>(null);

  public readonly isLoading = signal(true);
  public readonly isCreating = signal(false);
  public readonly isJoining = signal(false);
  public readonly isCreatingInvitation = signal(false);

  public readonly loadErrorMessage = signal<string | null>(null);
  public readonly actionErrorMessage = signal<string | null>(null);
  public readonly successMessage = signal<string | null>(null);
  public readonly currentInvitation = signal<CoupleSpaceInvitation | null>(null);
  public readonly isLoadingInvitation = signal(false);
  public readonly invitationErrorMessage = signal<string | null>(null);

  public ngOnInit(): void {
    void this.loadCurrentCoupleSpace();
  }

  public readonly createSpaceForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(80)],
    }),
  });

  public readonly joinSpaceForm = new FormGroup({
    invitationToken: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  private async loadCurrentCoupleSpace(): Promise<void> {
    this.isLoading.set(true);
    this.loadErrorMessage.set(null);

    try {
      const overview = await this.coupleSpaceService.getCurrentCoupleSpace();
      this.coupleSpaceOverview.set(overview);
      if (overview?.membership.role === 'owner') {
        await this.loadCurrentInvitation();
      } else {
        this.currentInvitation.set(null);
      }
    } catch {
      this.loadErrorMessage.set(
        'No fue posible cargar la información de tu espacio de pareja. Recarga la página e inténtalo nuevamente.',
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  public async onCreateSpace(): Promise<void> {
    if (this.createSpaceForm.invalid) {
      this.createSpaceForm.markAllAsTouched();
      return;
    }

    if (this.isCreating()) {
      return;
    }

    this.isCreating.set(true);
    this.actionErrorMessage.set(null);
    this.successMessage.set(null);

    const { name } = this.createSpaceForm.getRawValue();

    try {
      const overview = await this.coupleSpaceService.createCoupleSpace(name);

      this.coupleSpaceOverview.set(overview);
      this.createSpaceForm.reset();

      this.successMessage.set('Tu espacio de pareja fue creado correctamente.');
    } catch {
      this.actionErrorMessage.set(
        'No fue posible crear tu espacio de pareja. Inténtalo nuevamente.',
      );
    } finally {
      this.isCreating.set(false);
    }
  }

  public async onCreateInvitation(): Promise<void> {
    if (this.isCreatingInvitation()) {
      return;
    }

    this.isCreatingInvitation.set(true);
    this.actionErrorMessage.set(null);
    this.successMessage.set(null);

    try {
      const token = await this.coupleSpaceService.createCoupleSpaceInvitation();

      const invitation = await this.coupleSpaceService.getCurrentInvitation();

      if (!invitation || invitation.token !== token) {
        throw new Error('Created invitation could not be loaded.');
      }

      this.currentInvitation.set(invitation);

      this.successMessage.set(
        invitation.status === 'pending'
          ? 'La invitación está lista para compartir.'
          : 'El estado de la invitación se actualizó correctamente.',
      );
    } catch {
      this.actionErrorMessage.set('No fue posible crear la invitación. Inténtalo nuevamente.');
    } finally {
      this.isCreatingInvitation.set(false);
    }
  }

  public async onJoinSpace(): Promise<void> {
    if (this.joinSpaceForm.invalid) {
      this.joinSpaceForm.markAllAsTouched();
      return;
    }

    if (this.isJoining()) {
      return;
    }

    this.isJoining.set(true);
    this.actionErrorMessage.set(null);
    this.successMessage.set(null);

    const { invitationToken } = this.joinSpaceForm.getRawValue();

    try {
      const overview = await this.coupleSpaceService.acceptCoupleSpaceInvitation(invitationToken);
      this.coupleSpaceOverview.set(overview);
      this.joinSpaceForm.reset();
      this.successMessage.set(
        `Te uniste correctamente al espacio de pareja ${overview.coupleSpace.name}`,
      );
    } catch {
      this.actionErrorMessage.set(
        'No fue posible unirte al espacio de pareja. Revisa la invitación e inténtalo nuevamente.',
      );
    } finally {
      this.isJoining.set(false);
    }
  }

  private async loadCurrentInvitation(): Promise<void> {
    if (this.isLoadingInvitation()) {
      return;
    }

    this.isLoadingInvitation.set(true);
    this.invitationErrorMessage.set(null);

    try {
      const invitation = await this.coupleSpaceService.getCurrentInvitation();

      this.currentInvitation.set(invitation);
    } catch {
      this.invitationErrorMessage.set('No fue posible cargar el estado de la invitación.');
    } finally {
      this.isLoadingInvitation.set(false);
    }
  }
}
