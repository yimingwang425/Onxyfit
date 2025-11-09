import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterVerifyPage } from './register-verify.page';

describe('RegisterVerifyPage', () => {
  let component: RegisterVerifyPage;
  let fixture: ComponentFixture<RegisterVerifyPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RegisterVerifyPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
