import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SetupAgeComponent } from './setup-age.component';

describe('SetupAgeComponent', () => {
  let component: SetupAgeComponent;
  let fixture: ComponentFixture<SetupAgeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SetupAgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SetupAgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
