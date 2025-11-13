import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PasswordResetVerifyPage } from './password-reset-verify.page';

describe('PasswordResetVerifyPage', () => {
  let component: PasswordResetVerifyPage;
  let fixture: ComponentFixture<PasswordResetVerifyPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PasswordResetVerifyPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
