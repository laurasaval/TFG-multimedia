import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../../shared/models/auth.models';
import { IdentityKeyService } from '../../services/identity-key.service';
import { SessionService } from '../../services/session.service';
import { TokenService } from '../../services/token.service';

interface LoginBackgroundImage {
  url: string;
  alt: string;
}

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

  activeBackgroundIndex = 0;

  backgroundImages: LoginBackgroundImage[] = [
    {
      url: 'assets/performances/es.webp',
      alt: 'Actuación con iluminación cálida en un escenario musical'
    },
    {
      url: 'assets/performances/fr.webp',
      alt: 'Actuación en escenario oscuro con luces de concierto'
    },
    {
      url: 'assets/performances/it.webp',
      alt: 'Cantante interpretando una canción bajo focos de colores'
    },
    {
      url: 'assets/performances/pt.webp',
      alt: 'Grupo vocal actuando con iluminación escénica cálida'
    },
    {
      url: 'assets/performances/de.webp',
      alt: 'Grupo vocal actuando con iluminación escénica cálida'
    }
  ];

  private carouselIntervalId: ReturnType<typeof setInterval> | undefined;
  private readonly carouselDelayMs = 3000;

  constructor(
    private authService: AuthService,
    private router: Router,
    private identityKeyService: IdentityKeyService,
    private sessionService: SessionService,
    private tokenService: TokenService
  ) { }

  ngOnInit(): void {
    if (this.shouldReduceMotion()) {
      return;
    }

    this.carouselIntervalId = setInterval(() => {
      this.activeBackgroundIndex =
        (this.activeBackgroundIndex + 1) % this.backgroundImages.length;
    }, this.carouselDelayMs);
  }

  ngOnDestroy(): void {
    if (this.carouselIntervalId) {
      clearInterval(this.carouselIntervalId);
    }
  }

  private shouldReduceMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

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

    const country = this.voterId.split("-")[0];
    localStorage.setItem("tfg_country", country);

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