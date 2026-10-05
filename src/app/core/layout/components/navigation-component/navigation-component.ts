import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {LucideHouse, LucideWallet, LucideCalendarHeart, LucidePlaneTakeoff, LucideGoal, LucideUserRound, LucideSettings} from '@lucide/angular'

@Component({
  selector: 'app-navigation-component',
  imports: [RouterLink, RouterLinkActive, LucideHouse, LucideWallet, LucideCalendarHeart, LucidePlaneTakeoff, LucideGoal, LucideUserRound, LucideSettings],
  templateUrl: './navigation-component.html',
})
export class NavigationComponent {}
