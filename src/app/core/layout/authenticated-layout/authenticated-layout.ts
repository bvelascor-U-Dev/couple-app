import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent } from '../components/navigation-component/navigation-component';
import { AppBrand } from '../../../shared/components/app-brand/app-brand';

@Component({
  selector: 'app-authenticated-layout',
  imports: [RouterOutlet, NavigationComponent, AppBrand],
  templateUrl: './authenticated-layout.html',
})
export class AuthenticatedLayoutPage {
  protected readonly isMobileMenuOpen = signal(false);

  protected openMobileMenu(): void {
    this.isMobileMenuOpen.set(true);
  }

  protected closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }
}
