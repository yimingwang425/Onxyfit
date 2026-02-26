import { TestBed } from '@angular/core/testing';

import { PlanService } from './plan.service.js';

describe('PlanServiceTs', () => {
  let service: PlanService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlanService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
