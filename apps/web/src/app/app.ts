import { Component } from '@angular/core';
<<<<<<< Updated upstream
import { RouterLink, RouterOutlet } from '@angular/router';
=======
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './core/layout/navbar/navbar';
>>>>>>> Stashed changes

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
