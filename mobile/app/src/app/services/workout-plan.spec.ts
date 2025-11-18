import { TestBed } from '@angular/core/testing';

import { WorkoutPlan } from './workout-plan';

describe('WorkoutPlan', () => {
  let service: WorkoutPlan;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkoutPlan);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
