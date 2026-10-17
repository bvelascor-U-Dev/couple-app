import { Component, inject, output, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideHouse,
  LucideWallet,
  LucideCalendarHeart,
  LucidePlaneTakeoff,
  LucideGoal,
  LucideUserRound,
  LucideSettings,
  LucideLogOut,
} from '@lucide/angular';
import { AuthService } from '../../../../features/auth/services/auth.service';

@Component({
  selector: 'app-navigation-component',
  imports: [
    RouterLink,
    RouterLinkActive,
    LucideHouse,
    LucideWallet,
    LucideCalendarHeart,
    LucidePlaneTakeoff,
    LucideGoal,
    LucideUserRound,
    LucideSettings,
    LucideLogOut,
  ],
  templateUrl: './navigation-component.html',
})
export class NavigationComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  public readonly isLoading = signal(false);
  public readonly errorMessage = signal<string | null>(null);
  public readonly navigationRequested = output<void>();

  public async onSignOut(): Promise<void> {
    if (this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      await this.authService.signOut();
      await this.router.navigateByUrl('/auth/sign-in');
    } catch {
      this.errorMessage.set('The signOut fail, please try it later');
    } finally {
      this.isLoading.set(false);
    }
  }
}
