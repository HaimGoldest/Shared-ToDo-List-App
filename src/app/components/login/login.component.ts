import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: false,
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  login(): void {
    this.errorMessage = '';
    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.router.navigate(['/tasks']);
      },
      error: (err) => {
        if (err.error?.errors) {
          this.errorMessage = err.error.errors
            .map((e: any) => e.msg)
            .join(', ');
        } else if (err.error?.message) {
          this.errorMessage = err.error?.message;
        } else {
          this.errorMessage = 'Failed to login. Please try again.';
        }
      },
    });
  }
}
