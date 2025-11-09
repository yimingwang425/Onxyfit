import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth';

describe('AuthGuard (class)', () => {
  let guard: AuthGuard;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(() => {
    const spyAuth = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'getToken', 'setToken', 'logout']);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([])],
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: spyAuth }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow activation when logged in', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);

    const result = guard.canActivate();
    expect(result).toBeTrue();
    expect(authServiceSpy.isLoggedIn).toHaveBeenCalled();
  });

  it('should redirect to /auth/welcome when not logged in', () => {
    authServiceSpy.isLoggedIn.and.returnValue(false);
    spyOn(router, 'navigateByUrl');

    const result = guard.canActivate();
    expect(result).toBeFalse();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/auth/welcome', { replaceUrl: true });
  });
});
