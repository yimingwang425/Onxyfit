import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterPasswordPage } from './register-password.page';

describe('RegisterPasswordPage', () => {
  let component: RegisterPasswordPage;
  let fixture: ComponentFixture<RegisterPasswordPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RegisterPasswordPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
