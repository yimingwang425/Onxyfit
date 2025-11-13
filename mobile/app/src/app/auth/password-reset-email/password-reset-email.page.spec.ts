import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PasswordResetEmailPage } from './password-reset-email.page';

describe('PasswordResetEmailPage', () => {
  let component: PasswordResetEmailPage;
  let fixture: ComponentFixture<PasswordResetEmailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PasswordResetEmailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
