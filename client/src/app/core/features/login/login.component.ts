import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../../shared/models/auth.models';
import { IdentityKeyService } from '../../services/identity-key.service';
import { SessionService } from '../../services/session.service';
import { TokenService } from '../../services/token.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  voterId = '';
  secretCode = '';
  selectedPem = '';
  errorMessage = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private identityKeyService: IdentityKeyService,
    private sessionService: SessionService,
    private tokenService: TokenService
  ) { }

  async onPemSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.selectedPem = file.name;
    const pem = await file.text();
    await this.identityKeyService.setPrivateKeyPem(pem);
  }

  async onSubmit(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    const payload: LoginRequest = {
      voterId: this.voterId,
      secretCode: this.secretCode
    };

    if (!this.voterId || !this.secretCode || !this.selectedPem) {
      this.errorMessage = 'Por favor, introduzca su identificador de votante, su código secreto y su clave privada';
      this.loading = false;
      return;
    }

    this.authService.login(payload).subscribe({
      next: async (response) => {
        try {
          if (!response.ok) {
            this.errorMessage = response.message ?? 'Credenciales incorrectas';
            this.loading = false;
            return;
          }

          this.sessionService.setSession(response.session);
          await this.tokenService.requestVoteToken(response.voter);

          this.loading = false;
          this.router.navigate(['/dashboard']);
        } catch (error) {
          this.loading = false;
          this.errorMessage = 'No se pudo preparar el token de voto, por favor, vuelva a intentarlo.';
          console.log(error);
        }
      }
    });
  }
}