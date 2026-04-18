import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../../shared/models/auth.models';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  voterId = '';
  secretCode = '';
  errorMessage = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  async onSubmit(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    const payload: LoginRequest = {
      voterId: this.voterId,
      secretCode: this.secretCode
    };

    if (!this.voterId || !this.secretCode) {
      this.errorMessage = 'Por favor, introduzca su identificador de votante y su código secreto';
      this.loading = false;
      return;
    }

    this.authService.login(payload).subscribe({
      next: (response) => {
        this.loading = false;

        if (!response.ok) {
          this.errorMessage = response.message ?? 'Credenciales incorrectas';
          return;
        }

        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Credenciales incorrectas';
      }
    });
  }
}