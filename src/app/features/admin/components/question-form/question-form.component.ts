import { Component, signal, inject, output, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuestionBankService } from '../../../quiz/services/question-bank.service';
import { Question } from '../../../../shared/models/quiz.model';

@Component({
  selector: 'app-question-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './question-form.component.html',
  styleUrl: './question-form.component.css',
  standalone: true
})
export class QuestionFormComponent implements OnInit {
  private questionBankService = inject(QuestionBankService);

  // Inputs
  question = input<Question | null>(null);
  
  // Outputs
  questionSaved = output<Question>();
  formClosed = output<void>();

  // Form state
  isEditing = signal(false);
  isSubmitting = signal(false);
  
  // Form data
  formData = signal({
    id: '',
    text: '',
    type: 'qcm' as 'qcm' | 'fill-in-the-blank' | 'coding',
    language: 'Java',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    validity: false,
    answers: [
      { id: 'a1', option: '', isCorrect: false },
      { id: 'a2', option: '', isCorrect: false }
    ],
    expectedAnswer: '',
    code: '',
    testCases: [] as any[],
    functionSignatures: [] as any[],
    functionName: 'solution'
  });

  availableLanguages = ['Java', 'Python', 'TypeScript', 'JavaScript', 'C++', 'C#'];
  availableDifficulties = ['easy', 'medium', 'hard'];

  ngOnInit() {
    if (this.question()) {
      this.isEditing.set(true);
      this.populateForm(this.question()!);
    }
  }

  private populateForm(question: Question) {
    this.formData.set({
      id: question.id,
      text: question.text,
      type: question.type as 'qcm' | 'fill-in-the-blank' | 'coding',
      language: question.language || 'Java',
      difficulty: question.difficulty as 'easy' | 'medium' | 'hard',
      validity: question.validity ?? false,
      answers: question.answers ? question.answers.map(a => ({
        id: a.id,
        option: a.option,
        isCorrect: a.isCorrect ?? false
      })) : [
        { id: 'a1', option: '', isCorrect: false },
        { id: 'a2', option: '', isCorrect: false }
      ],
      expectedAnswer: question.expectedAnswer || '',
      code: question.code || '',
      testCases: question.testCases ? [...question.testCases] : [],
      functionSignatures: question.functionSignatures ? [...question.functionSignatures] : [],
      functionName: question.functionName || 'solution'
    });
  }

  addAnswer() {
    const form = this.formData();
    const newAnswer = {
      id: `a${form.answers.length + 1}`,
      option: '',
      isCorrect: false
    };
    this.formData.update(data => ({
      ...data,
      answers: [...data.answers, newAnswer]
    }));
  }

  removeAnswer(index: number) {
    this.formData.update(data => ({
      ...data,
      answers: data.answers.filter((_, i) => i !== index)
    }));
  }

  updateAnswer(index: number, field: string, value: any) {
    this.formData.update(data => ({
      ...data,
      answers: data.answers.map((answer, i) => 
        i === index ? { ...answer, [field]: value } : answer
      )
    }));
  }

  updateField(field: string, value: any) {
    this.formData.update(data => ({
      ...data,
      [field]: value
    }));
  }

  onTypeChange(newType: 'qcm' | 'fill-in-the-blank' | 'coding') {
    this.updateField('type', newType);
    
    // Reset type-specific fields
    if (newType === 'qcm') {
      this.updateField('expectedAnswer', '');
      this.updateField('code', '');
    } else if (newType === 'fill-in-the-blank') {
      this.updateField('answers', []);
      this.updateField('code', '');
    } else if (newType === 'coding') {
      this.updateField('answers', []);
      this.updateField('expectedAnswer', '');
    }
  }

  addTestCase() {
    const form = this.formData();
    const newTestCase = {
      input: '',
      expectedOutput: '',
      description: ''
    };
    this.formData.update(data => ({
      ...data,
      testCases: [...data.testCases, newTestCase]
    }));
  }

  removeTestCase(index: number) {
    this.formData.update(data => ({
      ...data,
      testCases: data.testCases.filter((_, i) => i !== index)
    }));
  }

  updateTestCase(index: number, field: string, value: any) {
    this.formData.update(data => ({
      ...data,
      testCases: data.testCases.map((testCase, i) => 
        i === index ? { ...testCase, [field]: value } : testCase
      )
    }));
  }

  async saveQuestion() {
    const form = this.formData();
    
    if (!form.text.trim()) {
      alert('Please enter a question text');
      return;
    }

    if (form.type === 'qcm' && (!form.answers || form.answers.length < 2)) {
      alert('QCM questions need at least 2 answers');
      return;
    }

    if (form.type === 'qcm' && !form.answers.some(a => a.isCorrect)) {
      alert('QCM questions need at least one correct answer');
      return;
    }

    if (form.type === 'fill-in-the-blank' && !form.expectedAnswer.trim()) {
      alert('Fill-in-the-blank questions need an expected answer');
      return;
    }

    if (form.type === 'coding' && !form.code.trim()) {
      alert('Coding questions need a code template');
      return;
    }

    this.isSubmitting.set(true);

    try {
      const questionData: Question = {
        id: form.id || `q${Date.now()}`,
        text: form.text,
        type: form.type,
        language: form.language,
        difficulty: form.difficulty,
        validity: form.validity,
        ...(form.type === 'qcm' && { answers: form.answers }),
        ...(form.type === 'fill-in-the-blank' && { expectedAnswer: form.expectedAnswer }),
        ...(form.type === 'coding' && { 
          code: form.code,
          testCases: form.testCases,
          functionSignatures: form.functionSignatures,
          functionName: form.functionName
        })
      };

      let savedQuestion: Question;
      
      if (this.isEditing()) {
        savedQuestion = await this.questionBankService.updateQuestion(questionData).toPromise() as Question;
      } else {
        savedQuestion = await this.questionBankService.addQuestion(questionData).toPromise() as Question;
      }

      this.questionSaved.emit(savedQuestion);
      this.resetForm();
      
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Failed to save question. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  resetForm() {
    this.formData.set({
      id: '',
      text: '',
      type: 'qcm',
      language: 'Java',
      difficulty: 'medium',
      validity: false,
      answers: [
        { id: 'a1', option: '', isCorrect: false },
        { id: 'a2', option: '', isCorrect: false }
      ],
      expectedAnswer: '',
      code: '',
      testCases: [],
      functionSignatures: [],
      functionName: 'solution'
    });
  }

  getTestCaseNumber(index: number): string {
    return `Test Case ${index + 1}`;
  }

  closeForm() {
    this.formClosed.emit();
  }
}
