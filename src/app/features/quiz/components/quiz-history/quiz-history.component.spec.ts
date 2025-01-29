import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuizHistoryComponent } from './quiz-history.component';
import { mockSubmission } from '../../mocks/quiz.mock';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';

describe('QuizHistoryComponent', () => {
  let component: QuizHistoryComponent;
  let fixture: ComponentFixture<QuizHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizHistoryComponent],
      providers: [
        {
          provide: AuthService,
          useValue: { isAuthenticated: () => {} },
        },
        provideRouter([]),
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuizHistoryComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('submissions', [mockSubmission])
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
