import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: false,
})
export class RegisterComponent {
  username = '';
  password = '';
  errorMessage = '';
  successMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  register(): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.register(this.username, this.password).subscribe({
      next: () => {
        this.successMessage =
          'User registered successfully! You can now log in.';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        if (err.error?.errors) {
          this.errorMessage = err.error.errors
            .map((e: any) => e.msg)
            .join(', ');
        } else if (err.error?.message) {
          this.errorMessage = err.error?.message;
        } else {
          this.errorMessage = 'Failed to register. Please try again.';
        }
      },
    });
  }
}
