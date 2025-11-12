import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeEmailPage } from './change-email.page';

describe('ChangeEmailPage', () => {
  let component: ChangeEmailPage;
  let fixture: ComponentFixture<ChangeEmailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangeEmailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
