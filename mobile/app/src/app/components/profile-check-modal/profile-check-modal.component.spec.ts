import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ProfileCheckModalComponent } from './profile-check-modal.component';

describe('ProfileCheckModalComponent', () => {
  let component: ProfileCheckModalComponent;
  let fixture: ComponentFixture<ProfileCheckModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ProfileCheckModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileCheckModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
