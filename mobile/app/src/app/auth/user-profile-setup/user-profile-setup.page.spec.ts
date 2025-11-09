import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserProfileSetupPage } from './user-profile-setup.page';

describe('UserProfileSetupPage', () => {
  let component: UserProfileSetupPage;
  let fixture: ComponentFixture<UserProfileSetupPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UserProfileSetupPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
