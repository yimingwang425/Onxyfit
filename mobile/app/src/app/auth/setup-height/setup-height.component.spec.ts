import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SetupHeightComponent } from './setup-height.component';

describe('SetupHeightComponent', () => {
  let component: SetupHeightComponent;
  let fixture: ComponentFixture<SetupHeightComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SetupHeightComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SetupHeightComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
