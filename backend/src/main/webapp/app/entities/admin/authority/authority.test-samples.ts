import { IAuthority, NewAuthority } from './authority.model';

export const sampleWithRequiredData: IAuthority = {
  name: '13f77418-dc2b-4b4e-bf20-aa651bab15e5',
};

export const sampleWithPartialData: IAuthority = {
  name: '6f7aa716-53ac-4da4-8f17-ada5c0697b77',
};

export const sampleWithFullData: IAuthority = {
  name: '5f20f6f6-fdbe-4b1e-b228-3602599ce439',
};

export const sampleWithNewData: NewAuthority = {
  name: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
