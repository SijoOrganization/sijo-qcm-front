import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodingQuestionEditComponent } from './coding-question-edit.component';
import { ActivatedRoute } from '@angular/router';
import { CodingQuestionsService } from '../../services/coding-questions.service';
import { of } from 'rxjs';
import { MOCK_CODING_QUESTION } from '../../mocks/coding-questions.mock';

describe('CodingQuestionEditComponent', () => {
  let component: CodingQuestionEditComponent;
  let fixture: ComponentFixture<CodingQuestionEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodingQuestionEditComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '123' } } },
        },
        {
          provide: CodingQuestionsService,
          useValue: { fetchCodingQuestion: () => of(MOCK_CODING_QUESTION) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CodingQuestionEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
