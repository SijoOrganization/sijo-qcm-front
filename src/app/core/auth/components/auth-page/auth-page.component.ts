import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Credentials } from '../../models/credentials.model';

@Component({
  selector: 'app-auth-page',
  templateUrl: './auth-page.component.html',
  styleUrl: './auth-page.component.css',
  imports: [FormsModule, RouterLink, RouterLinkActive],
})
export class AuthPageComponent implements OnInit {
  authService = inject(AuthService);
  route = inject(ActivatedRoute);
  router = inject(Router);
  destroyRef = inject(DestroyRef);

  title = '';
  authType = '';

  ngOnInit(): void {
    this.authType = this.route.snapshot.url.at(-1)!.path;
    this.title = this.authType === 'signin' ? 'Sign in' : 'Sign up';
  }

  onSubmit(form: NgForm) {
    if (this.authType === 'signin') {
      this.login(form.value as Credentials);
    } else {
      this.signup(form.value as Credentials);
    }
  }

  private login(credentials: Credentials): void {
    this.authService.login(credentials).subscribe({
      next: () => void this.router.navigate(['/']),
      error: (err) => {},
    });
  }

  private signup(credentials: Credentials) {
    this.authService.register(credentials).subscribe({
      next: () => void this.router.navigate(['/auth/signin']),
      error: (err) => {},
    });
  }
}
