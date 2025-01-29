import { inject, Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AlertService } from '../../alert/services/alert.service';

@Injectable({
  providedIn: 'root',
})
export class TutorGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);
  private alertService = inject(AlertService);

  canActivate(): boolean {
    if (this.authService.hasTutorAccess()) {
      return true;
    }

    this.router.navigate(['/']);
    this.alertService.setMessage({ message: 'Unauthorized!', type: 'danger' });
    return false;
  }
}
