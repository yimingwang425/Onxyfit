import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterPasswordConfirmPage } from './register-password-confirm.page';

describe('RegisterPasswordConfirmPage', () => {
  let component: RegisterPasswordConfirmPage;
  let fixture: ComponentFixture<RegisterPasswordConfirmPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RegisterPasswordConfirmPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
