import { TestBed } from '@angular/core/testing';

import { sampleWithNewData, sampleWithRequiredData } from '../plan.test-samples';

import { PlanFormService } from './plan-form.service';

describe('Plan Form Service', () => {
  let service: PlanFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlanFormService);
  });

  describe('Service methods', () => {
    describe('createPlanFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createPlanFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            caloriesKcal: expect.any(Object),
            proteinG: expect.any(Object),
            carbsG: expect.any(Object),
            fatG: expect.any(Object),
            workoutType: expect.any(Object),
            workoutIntensity: expect.any(Object),
            source: expect.any(Object),
            createdAt: expect.any(Object),
            mealPlanJson: expect.any(Object),
            workoutPlanJson: expect.any(Object),
            weekStartDate: expect.any(Object),
            profile: expect.any(Object),
          }),
        );
      });

      it('passing IPlan should create a new form with FormGroup', () => {
        const formGroup = service.createPlanFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            caloriesKcal: expect.any(Object),
            proteinG: expect.any(Object),
            carbsG: expect.any(Object),
            fatG: expect.any(Object),
            workoutType: expect.any(Object),
            workoutIntensity: expect.any(Object),
            source: expect.any(Object),
            createdAt: expect.any(Object),
            mealPlanJson: expect.any(Object),
            workoutPlanJson: expect.any(Object),
            weekStartDate: expect.any(Object),
            profile: expect.any(Object),
          }),
        );
      });
    });

    describe('getPlan', () => {
      it('should return NewPlan for default Plan initial value', () => {
        const formGroup = service.createPlanFormGroup(sampleWithNewData);

        const plan = service.getPlan(formGroup) as any;

        expect(plan).toMatchObject(sampleWithNewData);
      });

      it('should return NewPlan for empty Plan initial value', () => {
        const formGroup = service.createPlanFormGroup();

        const plan = service.getPlan(formGroup) as any;

        expect(plan).toMatchObject({});
      });

      it('should return IPlan', () => {
        const formGroup = service.createPlanFormGroup(sampleWithRequiredData);

        const plan = service.getPlan(formGroup) as any;

        expect(plan).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IPlan should not enable id FormControl', () => {
        const formGroup = service.createPlanFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewPlan should disable id FormControl', () => {
        const formGroup = service.createPlanFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
