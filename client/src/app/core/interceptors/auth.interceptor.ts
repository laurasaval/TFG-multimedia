import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { SessionService } from "../services/session.service";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const sessionService = inject(SessionService);
    const sessionToken = sessionService.getSessionToken();

    if (!sessionToken) {
        return next(req);
    }

    const authRequest = req.clone({
        setHeaders: {
            Authorization: `Bearer ${sessionToken}`
        }
    });

    return next(authRequest);
};