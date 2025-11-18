import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SetupGoalComponent } from './setup-goal.component';

describe('SetupGoalComponent', () => {
  let component: SetupGoalComponent;
  let fixture: ComponentFixture<SetupGoalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SetupGoalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SetupGoalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
