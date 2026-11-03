import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-finance-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './finance-layout.html',
})
export class FinanceLayout {}