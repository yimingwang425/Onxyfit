import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SetupWeightComponent } from './setup-weight.component';

describe('SetupWeightComponent', () => {
  let component: SetupWeightComponent;
  let fixture: ComponentFixture<SetupWeightComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SetupWeightComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SetupWeightComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
