import { TestBed } from '@angular/core/testing';

import { MealPlan } from './meal-plan';

describe('MealPlan', () => {
  let service: MealPlan;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MealPlan);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
