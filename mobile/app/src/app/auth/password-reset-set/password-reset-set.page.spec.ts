import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PasswordResetSetPage } from './password-reset-set.page';

describe('PasswordResetSetPage', () => {
  let component: PasswordResetSetPage;
  let fixture: ComponentFixture<PasswordResetSetPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PasswordResetSetPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
