import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodingQuestionFormComponent } from './coding-question-form.component';
import { MOCK_CODING_QUESTION } from '../../mocks/coding-questions.mock';

describe('CodingQuestionFormComponent', () => {
  let component: CodingQuestionFormComponent;
  let fixture: ComponentFixture<CodingQuestionFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodingQuestionFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodingQuestionFormComponent);
    component = fixture.componentInstance;
    component.codingQuestion.set(MOCK_CODING_QUESTION);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
