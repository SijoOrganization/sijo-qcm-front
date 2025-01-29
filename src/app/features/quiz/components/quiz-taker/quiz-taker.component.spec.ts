import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuizTakerComponent } from './quiz-taker.component';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { QuizService } from '../../services/quiz.service';

describe('QuizTakerComponent', () => {
  let component: QuizTakerComponent;
  let fixture: ComponentFixture<QuizTakerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizTakerComponent],
      providers: [
        {
          provide: AuthService,
          useValue: { isAuthenticated: () => {} },
        },
        {
          provide: QuizService,
          useValue: {}
        },
        provideRouter([]),
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuizTakerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
