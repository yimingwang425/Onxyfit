import { TestBed } from '@angular/core/testing';

import { sampleWithNewData, sampleWithRequiredData } from '../otp-record.test-samples';

import { OtpRecordFormService } from './otp-record-form.service';

describe('OtpRecord Form Service', () => {
  let service: OtpRecordFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OtpRecordFormService);
  });

  describe('Service methods', () => {
    describe('createOtpRecordFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createOtpRecordFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            email: expect.any(Object),
            otpCode: expect.any(Object),
            expiryTime: expect.any(Object),
            verified: expect.any(Object),
          }),
        );
      });

      it('passing IOtpRecord should create a new form with FormGroup', () => {
        const formGroup = service.createOtpRecordFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            email: expect.any(Object),
            otpCode: expect.any(Object),
            expiryTime: expect.any(Object),
            verified: expect.any(Object),
          }),
        );
      });
    });

    describe('getOtpRecord', () => {
      it('should return NewOtpRecord for default OtpRecord initial value', () => {
        const formGroup = service.createOtpRecordFormGroup(sampleWithNewData);

        const otpRecord = service.getOtpRecord(formGroup) as any;

        expect(otpRecord).toMatchObject(sampleWithNewData);
      });

      it('should return NewOtpRecord for empty OtpRecord initial value', () => {
        const formGroup = service.createOtpRecordFormGroup();

        const otpRecord = service.getOtpRecord(formGroup) as any;

        expect(otpRecord).toMatchObject({});
      });

      it('should return IOtpRecord', () => {
        const formGroup = service.createOtpRecordFormGroup(sampleWithRequiredData);

        const otpRecord = service.getOtpRecord(formGroup) as any;

        expect(otpRecord).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IOtpRecord should not enable id FormControl', () => {
        const formGroup = service.createOtpRecordFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewOtpRecord should disable id FormControl', () => {
        const formGroup = service.createOtpRecordFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
