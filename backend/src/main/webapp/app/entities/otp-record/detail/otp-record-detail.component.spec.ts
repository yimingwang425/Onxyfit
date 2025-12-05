import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';

import { OtpRecordDetailComponent } from './otp-record-detail.component';

describe('OtpRecord Management Detail Component', () => {
  let comp: OtpRecordDetailComponent;
  let fixture: ComponentFixture<OtpRecordDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtpRecordDetailComponent],
      providers: [
        provideRouter(
          [
            {
              path: '**',
              loadComponent: () => import('./otp-record-detail.component').then(m => m.OtpRecordDetailComponent),
              resolve: { otpRecord: () => of({ id: 25623 }) },
            },
          ],
          withComponentInputBinding(),
        ),
      ],
    })
      .overrideTemplate(OtpRecordDetailComponent, '')
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OtpRecordDetailComponent);
    comp = fixture.componentInstance;
  });

  describe('OnInit', () => {
    it('should load otpRecord on init', async () => {
      const harness = await RouterTestingHarness.create();
      const instance = await harness.navigateByUrl('/', OtpRecordDetailComponent);

      // THEN
      expect(instance.otpRecord()).toEqual(expect.objectContaining({ id: 25623 }));
    });
  });

  describe('PreviousState', () => {
    it('should navigate to previous state', () => {
      jest.spyOn(window.history, 'back');
      comp.previousState();
      expect(window.history.back).toHaveBeenCalled();
    });
  });
});
