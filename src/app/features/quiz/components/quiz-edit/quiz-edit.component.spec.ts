import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuizEditComponent } from './quiz-edit.component';
import { FormsModule } from '@angular/forms';
import { NgbNavModule, NgbNavChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { QuizService } from '../../services/quiz.service';
import { AlertService } from '../../../../core/alert/services/alert.service';
import { MockQuiz } from '../../mocks/quiz.mock';

describe('QuizEditComponent', () => {
  let component: QuizEditComponent;
  let fixture: ComponentFixture<QuizEditComponent>;
  let quizServiceMock: any;
  let alertServiceMock: any;
  let routerMock: any;

  beforeEach(async () => {
    quizServiceMock = {
      fetchFullQuizById: jasmine
        .createSpy('fetchFullQuizById')
        .and.returnValue(of({ ...MockQuiz })),
      updateQuiz: jasmine.createSpy('updateQuiz').and.returnValue(of(MockQuiz)),
      deleteQuiz: jasmine.createSpy('deleteQuiz').and.returnValue(of({})),
      createQuiz: jasmine.createSpy('createQuiz').and.returnValue(of(MockQuiz)),
    };

    alertServiceMock = {
      setMessage: jasmine.createSpy('setMessage'),
    };

    routerMock = {
      navigate: jasmine.createSpy('navigate'),
    };

    await TestBed.configureTestingModule({
      imports: [QuizEditComponent, FormsModule, NgbNavModule],
      providers: [
        provideRouter([]),
        { provide: QuizService, useValue: quizServiceMock },
        { provide: AlertService, useValue: alertServiceMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '123' } } },
        },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QuizEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch quiz on init', () => {
    expect(quizServiceMock.fetchFullQuizById).toHaveBeenCalledWith('123');
  });

  it('should prevent switching to form if JSON is not checked', () => {
    const event: NgbNavChangeEvent = {
      activeId: 2,
      nextId: 1,
      preventDefault: jasmine.createSpy(),
    };
    component.jsonQuiz.set("");

    component.onTabChange(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(alertServiceMock.setMessage).toHaveBeenCalledWith({
      message: 'Invalid JSON format. Please correct it.',
      type: 'danger',
    });
  });

});
