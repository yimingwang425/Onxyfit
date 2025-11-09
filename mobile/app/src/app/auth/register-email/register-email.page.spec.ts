import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterEmailPage } from './register-email.page';

describe('RegisterEmailPage', () => {
  let component: RegisterEmailPage;
  let fixture: ComponentFixture<RegisterEmailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RegisterEmailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
