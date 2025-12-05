import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse, provideHttpClient } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, from, of } from 'rxjs';

import { OtpRecordService } from '../service/otp-record.service';
import { IOtpRecord } from '../otp-record.model';
import { OtpRecordFormService } from './otp-record-form.service';

import { OtpRecordUpdateComponent } from './otp-record-update.component';

describe('OtpRecord Management Update Component', () => {
  let comp: OtpRecordUpdateComponent;
  let fixture: ComponentFixture<OtpRecordUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let otpRecordFormService: OtpRecordFormService;
  let otpRecordService: OtpRecordService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [OtpRecordUpdateComponent],
      providers: [
        provideHttpClient(),
        FormBuilder,
        {
          provide: ActivatedRoute,
          useValue: {
            params: from([{}]),
          },
        },
      ],
    })
      .overrideTemplate(OtpRecordUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(OtpRecordUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    otpRecordFormService = TestBed.inject(OtpRecordFormService);
    otpRecordService = TestBed.inject(OtpRecordService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('should update editForm', () => {
      const otpRecord: IOtpRecord = { id: 4731 };

      activatedRoute.data = of({ otpRecord });
      comp.ngOnInit();

      expect(comp.otpRecord).toEqual(otpRecord);
    });
  });

  describe('save', () => {
    it('should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IOtpRecord>>();
      const otpRecord = { id: 25623 };
      jest.spyOn(otpRecordFormService, 'getOtpRecord').mockReturnValue(otpRecord);
      jest.spyOn(otpRecordService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ otpRecord });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: otpRecord }));
      saveSubject.complete();

      // THEN
      expect(otpRecordFormService.getOtpRecord).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(otpRecordService.update).toHaveBeenCalledWith(expect.objectContaining(otpRecord));
      expect(comp.isSaving).toEqual(false);
    });

    it('should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IOtpRecord>>();
      const otpRecord = { id: 25623 };
      jest.spyOn(otpRecordFormService, 'getOtpRecord').mockReturnValue({ id: null });
      jest.spyOn(otpRecordService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ otpRecord: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: otpRecord }));
      saveSubject.complete();

      // THEN
      expect(otpRecordFormService.getOtpRecord).toHaveBeenCalled();
      expect(otpRecordService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IOtpRecord>>();
      const otpRecord = { id: 25623 };
      jest.spyOn(otpRecordService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ otpRecord });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(otpRecordService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });
});
