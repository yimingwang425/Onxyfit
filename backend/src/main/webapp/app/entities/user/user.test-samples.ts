import { IUser } from './user.model';

export const sampleWithRequiredData: IUser = {
  id: 31617,
  login: 'zh',
};

export const sampleWithPartialData: IUser = {
  id: 9805,
  login: 'lLdjq',
};

export const sampleWithFullData: IUser = {
  id: 6874,
  login: 'Id@o2m\\s9XLGx',
};
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
