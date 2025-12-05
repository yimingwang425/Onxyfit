import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { DATE_FORMAT } from 'app/config/input.constants';
import { IProgressLog } from '../progress-log.model';
import { sampleWithFullData, sampleWithNewData, sampleWithPartialData, sampleWithRequiredData } from '../progress-log.test-samples';

import { ProgressLogService, RestProgressLog } from './progress-log.service';

const requireRestSample: RestProgressLog = {
  ...sampleWithRequiredData,
  logDate: sampleWithRequiredData.logDate?.format(DATE_FORMAT),
  createdAt: sampleWithRequiredData.createdAt?.toJSON(),
};

describe('ProgressLog Service', () => {
  let service: ProgressLogService;
  let httpMock: HttpTestingController;
  let expectedResult: IProgressLog | IProgressLog[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    expectedResult = null;
    service = TestBed.inject(ProgressLogService);
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

    it('should create a ProgressLog', () => {
      const progressLog = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(progressLog).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a ProgressLog', () => {
      const progressLog = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(progressLog).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a ProgressLog', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of ProgressLog', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a ProgressLog', () => {
      const expected = true;

      service.delete(123).subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addProgressLogToCollectionIfMissing', () => {
      it('should add a ProgressLog to an empty array', () => {
        const progressLog: IProgressLog = sampleWithRequiredData;
        expectedResult = service.addProgressLogToCollectionIfMissing([], progressLog);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(progressLog);
      });

      it('should not add a ProgressLog to an array that contains it', () => {
        const progressLog: IProgressLog = sampleWithRequiredData;
        const progressLogCollection: IProgressLog[] = [
          {
            ...progressLog,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addProgressLogToCollectionIfMissing(progressLogCollection, progressLog);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a ProgressLog to an array that doesn't contain it", () => {
        const progressLog: IProgressLog = sampleWithRequiredData;
        const progressLogCollection: IProgressLog[] = [sampleWithPartialData];
        expectedResult = service.addProgressLogToCollectionIfMissing(progressLogCollection, progressLog);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(progressLog);
      });

      it('should add only unique ProgressLog to an array', () => {
        const progressLogArray: IProgressLog[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const progressLogCollection: IProgressLog[] = [sampleWithRequiredData];
        expectedResult = service.addProgressLogToCollectionIfMissing(progressLogCollection, ...progressLogArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const progressLog: IProgressLog = sampleWithRequiredData;
        const progressLog2: IProgressLog = sampleWithPartialData;
        expectedResult = service.addProgressLogToCollectionIfMissing([], progressLog, progressLog2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(progressLog);
        expect(expectedResult).toContain(progressLog2);
      });

      it('should accept null and undefined values', () => {
        const progressLog: IProgressLog = sampleWithRequiredData;
        expectedResult = service.addProgressLogToCollectionIfMissing([], null, progressLog, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(progressLog);
      });

      it('should return initial array if no ProgressLog is added', () => {
        const progressLogCollection: IProgressLog[] = [sampleWithRequiredData];
        expectedResult = service.addProgressLogToCollectionIfMissing(progressLogCollection, undefined, null);
        expect(expectedResult).toEqual(progressLogCollection);
      });
    });

    describe('compareProgressLog', () => {
      it('should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareProgressLog(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('should return false if one entity is null', () => {
        const entity1 = { id: 13028 };
        const entity2 = null;

        const compareResult1 = service.compareProgressLog(entity1, entity2);
        const compareResult2 = service.compareProgressLog(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('should return false if primaryKey differs', () => {
        const entity1 = { id: 13028 };
        const entity2 = { id: 173 };

        const compareResult1 = service.compareProgressLog(entity1, entity2);
        const compareResult2 = service.compareProgressLog(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('should return false if primaryKey matches', () => {
        const entity1 = { id: 13028 };
        const entity2 = { id: 13028 };

        const compareResult1 = service.compareProgressLog(entity1, entity2);
        const compareResult2 = service.compareProgressLog(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
