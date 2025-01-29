import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodingSubmissionsListComponent } from './coding-submissions-list.component';
import { CodingQuestionsService } from '../../services/coding-questions.service';

describe('CodingSubmissionsListComponent', () => {
  let component: CodingSubmissionsListComponent;
  let fixture: ComponentFixture<CodingSubmissionsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodingSubmissionsListComponent],
      providers: [
        {
          provide: CodingQuestionsService,
          useValue: {},
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CodingSubmissionsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
