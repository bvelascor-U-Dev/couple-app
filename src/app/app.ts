import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthenticatedLayoutPage } from './core/layout/authenticated-layout/authenticated-layout';

@Component({
  imports: [RouterOutlet, AuthenticatedLayoutPage],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('couple-app');
}
