import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SetupActivityComponent } from './setup-activity.component';

describe('SetupActivityComponent', () => {
  let component: SetupActivityComponent;
  let fixture: ComponentFixture<SetupActivityComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SetupActivityComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SetupActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
