import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SetupMetabolicComponent } from './setup-metabolic.component';

describe('SetupMetabolicComponent', () => {
  let component: SetupMetabolicComponent;
  let fixture: ComponentFixture<SetupMetabolicComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SetupMetabolicComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SetupMetabolicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
