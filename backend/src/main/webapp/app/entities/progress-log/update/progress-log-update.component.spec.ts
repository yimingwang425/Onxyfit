import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse, provideHttpClient } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, from, of } from 'rxjs';

import { IUserProfile } from 'app/entities/user-profile/user-profile.model';
import { UserProfileService } from 'app/entities/user-profile/service/user-profile.service';
import { IPlan } from 'app/entities/plan/plan.model';
import { PlanService } from 'app/entities/plan/service/plan.service';
import { IProgressLog } from '../progress-log.model';
import { ProgressLogService } from '../service/progress-log.service';
import { ProgressLogFormService } from './progress-log-form.service';

import { ProgressLogUpdateComponent } from './progress-log-update.component';

describe('ProgressLog Management Update Component', () => {
  let comp: ProgressLogUpdateComponent;
  let fixture: ComponentFixture<ProgressLogUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let progressLogFormService: ProgressLogFormService;
  let progressLogService: ProgressLogService;
  let userProfileService: UserProfileService;
  let planService: PlanService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProgressLogUpdateComponent],
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
      .overrideTemplate(ProgressLogUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(ProgressLogUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    progressLogFormService = TestBed.inject(ProgressLogFormService);
    progressLogService = TestBed.inject(ProgressLogService);
    userProfileService = TestBed.inject(UserProfileService);
    planService = TestBed.inject(PlanService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('should call UserProfile query and add missing value', () => {
      const progressLog: IProgressLog = { id: 173 };
      const profile: IUserProfile = { id: 22058 };
      progressLog.profile = profile;

      const userProfileCollection: IUserProfile[] = [{ id: 22058 }];
      jest.spyOn(userProfileService, 'query').mockReturnValue(of(new HttpResponse({ body: userProfileCollection })));
      const additionalUserProfiles = [profile];
      const expectedCollection: IUserProfile[] = [...additionalUserProfiles, ...userProfileCollection];
      jest.spyOn(userProfileService, 'addUserProfileToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ progressLog });
      comp.ngOnInit();

      expect(userProfileService.query).toHaveBeenCalled();
      expect(userProfileService.addUserProfileToCollectionIfMissing).toHaveBeenCalledWith(
        userProfileCollection,
        ...additionalUserProfiles.map(expect.objectContaining),
      );
      expect(comp.userProfilesSharedCollection).toEqual(expectedCollection);
    });

    it('should call Plan query and add missing value', () => {
      const progressLog: IProgressLog = { id: 173 };
      const plan: IPlan = { id: 13856 };
      progressLog.plan = plan;

      const planCollection: IPlan[] = [{ id: 13856 }];
      jest.spyOn(planService, 'query').mockReturnValue(of(new HttpResponse({ body: planCollection })));
      const additionalPlans = [plan];
      const expectedCollection: IPlan[] = [...additionalPlans, ...planCollection];
      jest.spyOn(planService, 'addPlanToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ progressLog });
      comp.ngOnInit();

      expect(planService.query).toHaveBeenCalled();
      expect(planService.addPlanToCollectionIfMissing).toHaveBeenCalledWith(
        planCollection,
        ...additionalPlans.map(expect.objectContaining),
      );
      expect(comp.plansSharedCollection).toEqual(expectedCollection);
    });

    it('should update editForm', () => {
      const progressLog: IProgressLog = { id: 173 };
      const profile: IUserProfile = { id: 22058 };
      progressLog.profile = profile;
      const plan: IPlan = { id: 13856 };
      progressLog.plan = plan;

      activatedRoute.data = of({ progressLog });
      comp.ngOnInit();

      expect(comp.userProfilesSharedCollection).toContainEqual(profile);
      expect(comp.plansSharedCollection).toContainEqual(plan);
      expect(comp.progressLog).toEqual(progressLog);
    });
  });

  describe('save', () => {
    it('should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IProgressLog>>();
      const progressLog = { id: 13028 };
      jest.spyOn(progressLogFormService, 'getProgressLog').mockReturnValue(progressLog);
      jest.spyOn(progressLogService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ progressLog });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: progressLog }));
      saveSubject.complete();

      // THEN
      expect(progressLogFormService.getProgressLog).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(progressLogService.update).toHaveBeenCalledWith(expect.objectContaining(progressLog));
      expect(comp.isSaving).toEqual(false);
    });

    it('should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IProgressLog>>();
      const progressLog = { id: 13028 };
      jest.spyOn(progressLogFormService, 'getProgressLog').mockReturnValue({ id: null });
      jest.spyOn(progressLogService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ progressLog: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: progressLog }));
      saveSubject.complete();

      // THEN
      expect(progressLogFormService.getProgressLog).toHaveBeenCalled();
      expect(progressLogService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IProgressLog>>();
      const progressLog = { id: 13028 };
      jest.spyOn(progressLogService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ progressLog });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(progressLogService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });

  describe('Compare relationships', () => {
    describe('compareUserProfile', () => {
      it('should forward to userProfileService', () => {
        const entity = { id: 22058 };
        const entity2 = { id: 9009 };
        jest.spyOn(userProfileService, 'compareUserProfile');
        comp.compareUserProfile(entity, entity2);
        expect(userProfileService.compareUserProfile).toHaveBeenCalledWith(entity, entity2);
      });
    });

    describe('comparePlan', () => {
      it('should forward to planService', () => {
        const entity = { id: 13856 };
        const entity2 = { id: 5247 };
        jest.spyOn(planService, 'comparePlan');
        comp.comparePlan(entity, entity2);
        expect(planService.comparePlan).toHaveBeenCalledWith(entity, entity2);
      });
    });
  });
});
