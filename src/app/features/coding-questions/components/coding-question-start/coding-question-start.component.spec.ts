import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodingQuestionStartComponent } from './coding-question-start.component';
import { CodingQuestionsService } from '../../services/coding-questions.service';
import { provideRouter } from '@angular/router';

describe('CodingQuestionStartComponent', () => {
  let component: CodingQuestionStartComponent;
  let fixture: ComponentFixture<CodingQuestionStartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodingQuestionStartComponent],
      providers: [
        {
          provide: CodingQuestionsService,
          useValue: {},
        },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CodingQuestionStartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
