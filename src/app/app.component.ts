import { Component } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    MatToolbarModule,
    MatButtonModule
  ]
})
export class AppComponent {
  title = 'aws-pricing-calc';
  
  constructor(private router: Router) {}
  
  navigateToHome() {
    // Use programmatic navigation for Calculator button
    this.router.navigate(['/home']);
  }
  
  navigateToCollections() {
    // Use programmatic navigation for Collections button
    this.router.navigate(['/collections']);
  }
}