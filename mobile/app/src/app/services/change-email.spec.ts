import { TestBed } from '@angular/core/testing';

import { ChangeEmailService } from './change-email';

describe('ChangeEmail', () => {
  let service: ChangeEmailService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChangeEmailService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
