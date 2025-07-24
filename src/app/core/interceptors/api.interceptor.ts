import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  // Skip interceptor for absolute URLs
  if (req.url.startsWith('http://') || req.url.startsWith('https://')) {
    return next(req);
  }
  
  // For relative URLs starting with /api, just pass them through (proxy will handle)
  if (req.url.startsWith('/api')) {
    return next(req);
  }
  
  // For other relative URLs, prepend the backend URL
  const apiReq = req.clone({ url: `${environment.backendUrl}${req.url}` });
  return next(apiReq);
};