import { TestBed } from '@angular/core/testing';

import { sampleWithNewData, sampleWithRequiredData } from '../progress-log.test-samples';

import { ProgressLogFormService } from './progress-log-form.service';

describe('ProgressLog Form Service', () => {
  let service: ProgressLogFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProgressLogFormService);
  });

  describe('Service methods', () => {
    describe('createProgressLogFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createProgressLogFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            logDate: expect.any(Object),
            weightKg: expect.any(Object),
            completedWorkout: expect.any(Object),
            caloriesIntake: expect.any(Object),
            steps: expect.any(Object),
            notes: expect.any(Object),
            createdAt: expect.any(Object),
            profile: expect.any(Object),
            plan: expect.any(Object),
          }),
        );
      });

      it('passing IProgressLog should create a new form with FormGroup', () => {
        const formGroup = service.createProgressLogFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            logDate: expect.any(Object),
            weightKg: expect.any(Object),
            completedWorkout: expect.any(Object),
            caloriesIntake: expect.any(Object),
            steps: expect.any(Object),
            notes: expect.any(Object),
            createdAt: expect.any(Object),
            profile: expect.any(Object),
            plan: expect.any(Object),
          }),
        );
      });
    });

    describe('getProgressLog', () => {
      it('should return NewProgressLog for default ProgressLog initial value', () => {
        const formGroup = service.createProgressLogFormGroup(sampleWithNewData);

        const progressLog = service.getProgressLog(formGroup) as any;

        expect(progressLog).toMatchObject(sampleWithNewData);
      });

      it('should return NewProgressLog for empty ProgressLog initial value', () => {
        const formGroup = service.createProgressLogFormGroup();

        const progressLog = service.getProgressLog(formGroup) as any;

        expect(progressLog).toMatchObject({});
      });

      it('should return IProgressLog', () => {
        const formGroup = service.createProgressLogFormGroup(sampleWithRequiredData);

        const progressLog = service.getProgressLog(formGroup) as any;

        expect(progressLog).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IProgressLog should not enable id FormControl', () => {
        const formGroup = service.createProgressLogFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewProgressLog should disable id FormControl', () => {
        const formGroup = service.createProgressLogFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
