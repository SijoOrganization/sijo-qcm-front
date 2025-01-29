import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuizInfoComponent } from './quiz-info.component';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { QuizService } from '../../services/quiz.service';
import { SubmissionService } from '../../services/submission.service';

describe('QuizInfoComponent', () => {
  let component: QuizInfoComponent;
  let fixture: ComponentFixture<QuizInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizInfoComponent],
      providers: [
        {
          provide: AuthService,
          useValue: { isAuthenticated: () => {} },
        },
        {
          provide: QuizService,
          useValue: {},
        },
        {
          provide: SubmissionService,
          useValue: {},
        },
        provideRouter([]),
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuizInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
