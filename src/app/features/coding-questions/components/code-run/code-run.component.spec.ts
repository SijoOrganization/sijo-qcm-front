import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodeRunComponent } from './code-run.component';
import { CodingQuestionsService } from '../../services/coding-questions.service';

describe('CodeRunComponent', () => {
  let component: CodeRunComponent;
  let fixture: ComponentFixture<CodeRunComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeRunComponent],
      providers: [{ provide: CodingQuestionsService, useValue: {} }],
    }).compileComponents();

    fixture = TestBed.createComponent(CodeRunComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
