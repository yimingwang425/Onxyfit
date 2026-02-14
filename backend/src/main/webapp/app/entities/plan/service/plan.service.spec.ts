import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { DATE_FORMAT } from 'app/config/input.constants';
import { IPlan } from '../plan.model';
import { sampleWithFullData, sampleWithNewData, sampleWithPartialData, sampleWithRequiredData } from '../plan.test-samples';

import { PlanService, RestPlan } from './plan.service';

const requireRestSample: RestPlan = {
  ...sampleWithRequiredData,
  createdAt: sampleWithRequiredData.createdAt?.toJSON(),
  weekStartDate: sampleWithRequiredData.weekStartDate?.format(DATE_FORMAT),
};

describe('Plan Service', () => {
  let service: PlanService;
  let httpMock: HttpTestingController;
  let expectedResult: IPlan | IPlan[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    expectedResult = null;
    service = TestBed.inject(PlanService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  describe('Service methods', () => {
    it('should find an element', () => {
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.find(123).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should create a Plan', () => {
      const plan = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(plan).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a Plan', () => {
      const plan = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(plan).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a Plan', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of Plan', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a Plan', () => {
      const expected = true;

      service.delete(123).subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addPlanToCollectionIfMissing', () => {
      it('should add a Plan to an empty array', () => {
        const plan: IPlan = sampleWithRequiredData;
        expectedResult = service.addPlanToCollectionIfMissing([], plan);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(plan);
      });

      it('should not add a Plan to an array that contains it', () => {
        const plan: IPlan = sampleWithRequiredData;
        const planCollection: IPlan[] = [
          {
            ...plan,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addPlanToCollectionIfMissing(planCollection, plan);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a Plan to an array that doesn't contain it", () => {
        const plan: IPlan = sampleWithRequiredData;
        const planCollection: IPlan[] = [sampleWithPartialData];
        expectedResult = service.addPlanToCollectionIfMissing(planCollection, plan);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(plan);
      });

      it('should add only unique Plan to an array', () => {
        const planArray: IPlan[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const planCollection: IPlan[] = [sampleWithRequiredData];
        expectedResult = service.addPlanToCollectionIfMissing(planCollection, ...planArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const plan: IPlan = sampleWithRequiredData;
        const plan2: IPlan = sampleWithPartialData;
        expectedResult = service.addPlanToCollectionIfMissing([], plan, plan2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(plan);
        expect(expectedResult).toContain(plan2);
      });

      it('should accept null and undefined values', () => {
        const plan: IPlan = sampleWithRequiredData;
        expectedResult = service.addPlanToCollectionIfMissing([], null, plan, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(plan);
      });

      it('should return initial array if no Plan is added', () => {
        const planCollection: IPlan[] = [sampleWithRequiredData];
        expectedResult = service.addPlanToCollectionIfMissing(planCollection, undefined, null);
        expect(expectedResult).toEqual(planCollection);
      });
    });

    describe('comparePlan', () => {
      it('should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.comparePlan(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('should return false if one entity is null', () => {
        const entity1 = { id: 13856 };
        const entity2 = null;

        const compareResult1 = service.comparePlan(entity1, entity2);
        const compareResult2 = service.comparePlan(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('should return false if primaryKey differs', () => {
        const entity1 = { id: 13856 };
        const entity2 = { id: 5247 };

        const compareResult1 = service.comparePlan(entity1, entity2);
        const compareResult2 = service.comparePlan(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('should return false if primaryKey matches', () => {
        const entity1 = { id: 13856 };
        const entity2 = { id: 13856 };

        const compareResult1 = service.comparePlan(entity1, entity2);
        const compareResult2 = service.comparePlan(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
