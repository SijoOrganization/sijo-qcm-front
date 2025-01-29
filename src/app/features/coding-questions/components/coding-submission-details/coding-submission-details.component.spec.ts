import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodingSubmissionDetailsComponent } from './coding-submission-details.component';

describe('CodingSubmissionDetailsComponent', () => {
  let component: CodingSubmissionDetailsComponent;
  let fixture: ComponentFixture<CodingSubmissionDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodingSubmissionDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodingSubmissionDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
