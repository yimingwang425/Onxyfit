import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { IOtpRecord } from '../otp-record.model';
import { sampleWithFullData, sampleWithNewData, sampleWithPartialData, sampleWithRequiredData } from '../otp-record.test-samples';

import { OtpRecordService, RestOtpRecord } from './otp-record.service';

const requireRestSample: RestOtpRecord = {
  ...sampleWithRequiredData,
  expiryTime: sampleWithRequiredData.expiryTime?.toJSON(),
};

describe('OtpRecord Service', () => {
  let service: OtpRecordService;
  let httpMock: HttpTestingController;
  let expectedResult: IOtpRecord | IOtpRecord[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    expectedResult = null;
    service = TestBed.inject(OtpRecordService);
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

    it('should create a OtpRecord', () => {
      const otpRecord = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(otpRecord).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a OtpRecord', () => {
      const otpRecord = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(otpRecord).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a OtpRecord', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of OtpRecord', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a OtpRecord', () => {
      const expected = true;

      service.delete(123).subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addOtpRecordToCollectionIfMissing', () => {
      it('should add a OtpRecord to an empty array', () => {
        const otpRecord: IOtpRecord = sampleWithRequiredData;
        expectedResult = service.addOtpRecordToCollectionIfMissing([], otpRecord);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(otpRecord);
      });

      it('should not add a OtpRecord to an array that contains it', () => {
        const otpRecord: IOtpRecord = sampleWithRequiredData;
        const otpRecordCollection: IOtpRecord[] = [
          {
            ...otpRecord,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addOtpRecordToCollectionIfMissing(otpRecordCollection, otpRecord);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a OtpRecord to an array that doesn't contain it", () => {
        const otpRecord: IOtpRecord = sampleWithRequiredData;
        const otpRecordCollection: IOtpRecord[] = [sampleWithPartialData];
        expectedResult = service.addOtpRecordToCollectionIfMissing(otpRecordCollection, otpRecord);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(otpRecord);
      });

      it('should add only unique OtpRecord to an array', () => {
        const otpRecordArray: IOtpRecord[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const otpRecordCollection: IOtpRecord[] = [sampleWithRequiredData];
        expectedResult = service.addOtpRecordToCollectionIfMissing(otpRecordCollection, ...otpRecordArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const otpRecord: IOtpRecord = sampleWithRequiredData;
        const otpRecord2: IOtpRecord = sampleWithPartialData;
        expectedResult = service.addOtpRecordToCollectionIfMissing([], otpRecord, otpRecord2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(otpRecord);
        expect(expectedResult).toContain(otpRecord2);
      });

      it('should accept null and undefined values', () => {
        const otpRecord: IOtpRecord = sampleWithRequiredData;
        expectedResult = service.addOtpRecordToCollectionIfMissing([], null, otpRecord, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(otpRecord);
      });

      it('should return initial array if no OtpRecord is added', () => {
        const otpRecordCollection: IOtpRecord[] = [sampleWithRequiredData];
        expectedResult = service.addOtpRecordToCollectionIfMissing(otpRecordCollection, undefined, null);
        expect(expectedResult).toEqual(otpRecordCollection);
      });
    });

    describe('compareOtpRecord', () => {
      it('should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareOtpRecord(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('should return false if one entity is null', () => {
        const entity1 = { id: 25623 };
        const entity2 = null;

        const compareResult1 = service.compareOtpRecord(entity1, entity2);
        const compareResult2 = service.compareOtpRecord(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('should return false if primaryKey differs', () => {
        const entity1 = { id: 25623 };
        const entity2 = { id: 4731 };

        const compareResult1 = service.compareOtpRecord(entity1, entity2);
        const compareResult2 = service.compareOtpRecord(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('should return false if primaryKey matches', () => {
        const entity1 = { id: 25623 };
        const entity2 = { id: 25623 };

        const compareResult1 = service.compareOtpRecord(entity1, entity2);
        const compareResult2 = service.compareOtpRecord(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
