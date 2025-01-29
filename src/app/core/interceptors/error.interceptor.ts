import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../auth/services/auth.service';
import { AlertService } from '../alert/services/alert.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const alertService = inject(AlertService);

  return next(req).pipe(
    catchError((err) => {
      const message =
        err?.status == 500 ? err.statusText : err.error.description;
      alertService.setMessage({
        message,
        type: 'danger',
      });
      return throwError(() => err.error);
    }),
  );
};
