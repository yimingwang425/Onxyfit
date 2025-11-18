import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SetupDietComponent } from './setup-diet.component';

describe('SetupDietComponent', () => {
  let component: SetupDietComponent;
  let fixture: ComponentFixture<SetupDietComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SetupDietComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SetupDietComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
