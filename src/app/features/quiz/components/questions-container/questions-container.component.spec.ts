import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionsContainerComponent } from './questions-container.component';
import { QuizService } from '../../services/quiz.service';
import { MockQuiz } from '../../mocks/quiz.mock';

describe('QuestionsContainerComponent', () => {
  let component: QuestionsContainerComponent;
  let fixture: ComponentFixture<QuestionsContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionsContainerComponent],
      providers: [
        {
          provide: QuizService,
          useValue: {}
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionsContainerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("quiz",MockQuiz)
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
