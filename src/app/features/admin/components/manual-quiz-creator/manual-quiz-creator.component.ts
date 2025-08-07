import { Component, signal, Output, EventEmitter, inject, Input, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Quiz, Question, TestCase } from '../../../../shared/models/quiz.model';

interface ManualQuestion {
  id: string;
  type: 'qcm' | 'fill-in-the-blank' | 'coding';
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  answers?: { id: string; option: string; isCorrect?: boolean }[];
  expectedAnswer?: string;
  code?: string;
  language: string;
  testCases?: TestCase[];
}

@Component({
  selector: 'app-manual-quiz-creator',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="manual-quiz-creator">
      <div class="header-section mb-4">
        <div class="d-flex justify-content-between align-items-center">
          <h4>
            <i class="fas" [ngClass]="isEditMode() ? 'fa-edit' : 'fa-plus-circle'" class="me-2"></i>
            {{ isEditMode() ? 'Edit Quiz' : 'Create Quiz Manually' }}
          </h4>
          <div class="btn-group">
            <button type="button" class="btn btn-outline-secondary" (click)="onCancel()">
              <i class="fas fa-times me-1"></i>Cancel
            </button>
            <button type="button" class="btn btn-primary" (click)="generateQuiz()" [disabled]="!canGenerateQuiz()">
              <i class="fas fa-save me-1"></i>{{ isEditMode() ? 'Update Quiz' : 'Save Quiz' }}
            </button>
          </div>
        </div>
      </div>

      <form [formGroup]="quizForm" class="quiz-metadata-form">
        <!-- Quiz Metadata Section -->
        <div class="card mb-4">
          <div class="card-header">
            <h6><i class="fas fa-info-circle me-2"></i>Quiz Information</h6>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Quiz Title *</label>
                  <input type="text" class="form-control" formControlName="title" placeholder="Enter quiz title">
                </div>
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Category *</label>
                  <select class="form-select" formControlName="category">
                    <option value="">Select category</option>
                    <option value="programming">Programming</option>
                    <option value="web-development">Web Development</option>
                    <option value="data-science">Data Science</option>
                    <option value="mobile-development">Mobile Development</option>
                    <option value="devops">DevOps</option>
                    <option value="algorithms">Algorithms</option>
                    <option value="system-design">System Design</option>
                    <option value="databases">Databases</option>
                    <option value="testing">Testing</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-md-4">
                <div class="mb-3">
                  <label class="form-label">Difficulty *</label>
                  <select class="form-select" formControlName="difficulty">
                    <option value="">Select difficulty</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div class="col-md-4">
                <div class="mb-3">
                  <label class="form-label">Programming Language</label>
                  <select class="form-select" formControlName="language">
                    <option value="">Select language</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="csharp">C#</option>
                    <option value="php">PHP</option>
                    <option value="ruby">Ruby</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                    <option value="typescript">TypeScript</option>
                  </select>
                </div>
              </div>
              <div class="col-md-4">
                <div class="mb-3">
                  <label class="form-label">Estimated Time (minutes)</label>
                  <input type="number" class="form-control" formControlName="estimatedTime" min="5" max="180" placeholder="30">
                </div>
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">Quiz Explanation</label>
              <textarea class="form-control" formControlName="explanation" rows="3" placeholder="Brief explanation of the quiz"></textarea>
            </div>
          </div>
        </div>

        <!-- Questions Section -->
        <div class="card mb-4">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h6><i class="fas fa-question-circle me-2"></i>Questions ({{ questions().length }})</h6>
            <div class="btn-group">
              <button type="button" class="btn btn-sm btn-outline-primary" (click)="addQuestion('qcm')">
                <i class="fas fa-list me-1"></i>QCM
              </button>
              <button type="button" class="btn btn-sm btn-outline-warning" (click)="addQuestion('fill-in-the-blank')">
                <i class="fas fa-edit me-1"></i>Fill-in-blank
              </button>
              <button type="button" class="btn btn-sm btn-outline-success" (click)="addQuestion('coding')">
                <i class="fas fa-code me-1"></i>Coding
              </button>
            </div>
          </div>
          <div class="card-body">
            <div *ngIf="questions().length === 0" class="empty-state text-center py-4">
              <i class="fas fa-plus-circle fa-3x text-muted mb-3"></i>
              <h6>No Questions Added Yet</h6>
              <p class="text-muted">Start by adding questions using the buttons above</p>
            </div>

            <!-- Questions List -->
            <div *ngFor="let question of questions(); let i = index" class="question-item mb-4">
              <div class="question-header d-flex justify-content-between align-items-center mb-3">
                <span class="question-badge">
                  <i class="fas" [ngClass]="{
                    'fa-list': question.type === 'qcm',
                    'fa-edit': question.type === 'fill-in-the-blank',
                    'fa-code': question.type === 'coding'
                  }"></i>
                  Question {{ i + 1 }} - {{ getQuestionTypeLabel(question.type) }}
                </span>
                <button type="button" class="btn btn-sm btn-outline-danger" (click)="removeQuestion(i)">
                  <i class="fas fa-trash"></i>
                </button>
              </div>

              <div class="question-content">
                <!-- Question Text -->
                <div class="mb-3">
                  <label class="form-label">Question Text *</label>
                  <textarea 
                    class="form-control" 
                    [(ngModel)]="question.text" 
                    [ngModelOptions]="{standalone: true}"
                    [name]="'question_text_' + i"
                    placeholder="Enter your question here..."
                    rows="3"
                    required></textarea>
                </div>

                <!-- Question Settings -->
                <div class="row">
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label class="form-label">Difficulty</label>
                      <select class="form-select" [(ngModel)]="question.difficulty" [ngModelOptions]="{standalone: true}" [name]="'question_difficulty_' + i">
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label class="form-label">Language</label>
                      <select class="form-select" [(ngModel)]="question.language" [ngModelOptions]="{standalone: true}" [name]="'question_language_' + i">
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="typescript">TypeScript</option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- QCM Options -->
                <div *ngIf="question.type === 'qcm'" class="mb-3">
                  <label class="form-label">Answer Options *</label>
                  <div *ngFor="let answer of question.answers; let j = index" class="input-group mb-2">
                    <span class="input-group-text">{{ getOptionLetter(j) }}</span>
                    <input 
                      type="text" 
                      class="form-control" 
                      [(ngModel)]="answer.option"
                      [ngModelOptions]="{standalone: true}"
                      [name]="'option_' + i + '_' + j"
                      placeholder="Enter option {{ getOptionLetter(j) }}"
                      required>
                    <div class="input-group-text">
                      <input 
                        type="radio" 
                        [name]="'correct_' + i"
                        [checked]="answer.isCorrect"
                        (change)="setCorrectAnswer(i, j)"
                        class="form-check-input">
                    </div>
                    <button *ngIf="question.answers!.length > 2" type="button" class="btn btn-outline-danger" (click)="removeOption(i, j)">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                  <button type="button" class="btn btn-sm btn-outline-primary" (click)="addOption(i)" [disabled]="question.answers!.length >= 6">
                    <i class="fas fa-plus me-1"></i>Add Option
                  </button>
                </div>

                <!-- Fill in the Blank -->
                <div *ngIf="question.type === 'fill-in-the-blank'" class="mb-3">
                  <label class="form-label">Expected Answer *</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    [(ngModel)]="question.expectedAnswer"
                    [ngModelOptions]="{standalone: true}"
                    [name]="'fill_answer_' + i"
                    placeholder="Enter the expected answer"
                    required>
                </div>

                <!-- Coding Question -->
                <div *ngIf="question.type === 'coding'" class="mb-3">
                  <div class="mb-3">
                    <label class="form-label">Code Template *</label>
                    <textarea 
                      class="form-control code-editor" 
                      [(ngModel)]="question.code"
                      [ngModelOptions]="{standalone: true}"
                      [name]="'code_template_' + i"
                      rows="8"
                      placeholder="Enter the code template that candidates will complete..."
                      required></textarea>
                  </div>
                  
                  <!-- Test Cases -->
                  <div class="mb-3">
                    <label class="form-label">Test Cases *</label>
                    <div *ngFor="let testCase of question.testCases; let tc = index" class="border rounded p-3 mb-2">
                      <div class="d-flex justify-content-between align-items-center mb-2">
                        <h6 class="mb-0">Test Case {{ tc + 1 }}</h6>
                        <button type="button" class="btn btn-sm btn-outline-danger" (click)="removeTestCase(i, tc)">
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                      <div class="row">
                        <div class="col-md-6">
                          <label class="form-label">Input</label>
                          <textarea 
                            class="form-control" 
                            [(ngModel)]="testCase.input"
                            [ngModelOptions]="{standalone: true}"
                            [name]="'test_input_' + i + '_' + tc"
                            rows="2"
                            placeholder="Test input"
                            required></textarea>
                        </div>
                        <div class="col-md-6">
                          <label class="form-label">Expected Output</label>
                          <textarea 
                            class="form-control" 
                            [(ngModel)]="testCase.expectedOutput"
                            [ngModelOptions]="{standalone: true}"
                            [name]="'test_output_' + i + '_' + tc"
                            rows="2"
                            placeholder="Expected output"
                            required></textarea>
                        </div>
                      </div>
                      <div class="mt-2">
                        <label class="form-label">Description (optional)</label>
                        <input 
                          type="text" 
                          class="form-control" 
                          [(ngModel)]="testCase.description"
                          [ngModelOptions]="{standalone: true}"
                          [name]="'test_desc_' + i + '_' + tc"
                          placeholder="Test case description">
                      </div>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-primary" (click)="addTestCase(i)">
                      <i class="fas fa-plus me-1"></i>Add Test Case
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Preview Section -->
        <div *ngIf="showPreview()" class="card mb-4">
          <div class="card-header">
            <h6><i class="fas fa-eye me-2"></i>Quiz Preview</h6>
          </div>
          <div class="card-body">
            <pre>{{ getQuizPreview() | json }}</pre>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="d-flex justify-content-between">
          <button type="button" class="btn btn-outline-info" (click)="togglePreview()">
            <i class="fas fa-eye me-1"></i>{{ showPreview() ? 'Hide' : 'Show' }} Preview
          </button>
          <div class="btn-group">
            <button type="button" class="btn btn-outline-secondary" (click)="onCancel()">
              <i class="fas fa-times me-1"></i>Cancel
            </button>
            <button type="button" class="btn btn-primary" (click)="generateQuiz()" [disabled]="!canGenerateQuiz()">
              <i class="fas fa-save me-1"></i>{{ isEditMode() ? 'Update Quiz' : 'Create Quiz' }} ({{ questions().length }} questions)
            </button>
          </div>
        </div>
      </form>
    </div>
  `,
  styleUrl: './manual-quiz-creator.component.css'
})
export class ManualQuizCreatorComponent implements OnInit {
  @Input() editingQuiz: Quiz | null = null;
  @Output() quizCreated = new EventEmitter<any>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);

  quizForm: FormGroup;
  questions = signal<ManualQuestion[]>([]);
  isGenerating = signal(false);
  showPreview = signal(false);
  isEditMode = signal(false);

  constructor() {
    this.quizForm = this.fb.group({
      title: ['', Validators.required],
      category: ['', Validators.required],
      difficulty: ['', Validators.required],
      language: [''],
      estimatedTime: [30],
      explanation: ['']
    });

    // Effect to watch for editing quiz changes
    effect(() => {
      if (this.editingQuiz) {
        this.loadQuizForEditing(this.editingQuiz);
      }
    });
  }

  ngOnInit() {
    if (this.editingQuiz) {
      this.loadQuizForEditing(this.editingQuiz);
    }
  }

  private loadQuizForEditing(quiz: Quiz) {
    this.isEditMode.set(true);
    
    // Populate form with existing quiz data
    this.quizForm.patchValue({
      title: quiz.title,
      category: quiz.category,
      difficulty: quiz.difficulty,
      language: quiz.language || '',
      estimatedTime: quiz.estimatedTime || 30,
      explanation: quiz.explanation || ''
    });

    // Convert existing questions to ManualQuestion format with proper validation
    const manualQuestions: ManualQuestion[] = quiz.questions.map((q, index) => {
      const baseQuestion: ManualQuestion = {
        id: q.id || `edit_q_${Date.now()}_${index}`,
        type: q.type,
        text: q.text || '',
        difficulty: q.difficulty || 'medium',
        language: q.language || 'javascript'
      };

      // Handle QCM questions
      if (q.type === 'qcm') {
        baseQuestion.answers = q.answers && q.answers.length > 0 
          ? q.answers.map((answer, idx) => ({
              id: answer.id || (idx + 1).toString(),
              option: answer.option || '',
              isCorrect: answer.isCorrect || false
            }))
          : [
              { id: '1', option: '', isCorrect: false },
              { id: '2', option: '', isCorrect: false },
              { id: '3', option: '', isCorrect: false },
              { id: '4', option: '', isCorrect: false }
            ];
      }
      
      // Handle Fill-in-the-blank questions
      else if (q.type === 'fill-in-the-blank') {
        baseQuestion.expectedAnswer = q.expectedAnswer || '';
      }
      
      // Handle Coding questions
      else if (q.type === 'coding') {
        baseQuestion.code = q.code || '';
        baseQuestion.testCases = q.testCases && q.testCases.length > 0
          ? q.testCases.map(tc => ({
              input: tc.input || '',
              expectedOutput: tc.expectedOutput || '',
              description: tc.description || ''
            }))
          : [{ input: '', expectedOutput: '', description: '' }];
      }

      return baseQuestion;
    });

    this.questions.set(manualQuestions);
  }

  addQuestion(type: 'qcm' | 'fill-in-the-blank' | 'coding') {
    const newQuestion: ManualQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      text: '',
      difficulty: 'medium',
      language: 'javascript'
    };

    if (type === 'qcm') {
      newQuestion.answers = [
        { id: '1', option: '', isCorrect: false },
        { id: '2', option: '', isCorrect: false },
        { id: '3', option: '', isCorrect: false },
        { id: '4', option: '', isCorrect: false }
      ];
    } else if (type === 'fill-in-the-blank') {
      newQuestion.expectedAnswer = '';
    } else if (type === 'coding') {
      newQuestion.code = '';
      newQuestion.testCases = [
        { input: '', expectedOutput: '', description: '' }
      ];
    }

    this.questions.update(questions => [...questions, newQuestion]);
  }

  removeQuestion(index: number) {
    this.questions.update(questions => questions.filter((_, i) => i !== index));
  }

  addOption(questionIndex: number) {
    this.questions.update(questions => {
      const updatedQuestions = [...questions];
      if (updatedQuestions[questionIndex].answers) {
        const newId = (updatedQuestions[questionIndex].answers!.length + 1).toString();
        updatedQuestions[questionIndex].answers!.push({
          id: newId,
          option: '',
          isCorrect: false
        });
      }
      return updatedQuestions;
    });
  }

  removeOption(questionIndex: number, optionIndex: number) {
    this.questions.update(questions => {
      const updatedQuestions = [...questions];
      if (updatedQuestions[questionIndex].answers) {
        updatedQuestions[questionIndex].answers!.splice(optionIndex, 1);
      }
      return updatedQuestions;
    });
  }

  setCorrectAnswer(questionIndex: number, answerIndex: number) {
    this.questions.update(questions => {
      const updatedQuestions = [...questions];
      if (updatedQuestions[questionIndex].answers) {
        // Set all answers to false first
        updatedQuestions[questionIndex].answers!.forEach(answer => answer.isCorrect = false);
        // Set the selected answer to true
        updatedQuestions[questionIndex].answers![answerIndex].isCorrect = true;
      }
      return updatedQuestions;
    });
  }

  addTestCase(questionIndex: number) {
    this.questions.update(questions => {
      const updatedQuestions = [...questions];
      if (updatedQuestions[questionIndex].testCases) {
        updatedQuestions[questionIndex].testCases!.push({
          input: '',
          expectedOutput: '',
          description: ''
        });
      }
      return updatedQuestions;
    });
  }

  removeTestCase(questionIndex: number, testCaseIndex: number) {
    this.questions.update(questions => {
      const updatedQuestions = [...questions];
      if (updatedQuestions[questionIndex].testCases) {
        updatedQuestions[questionIndex].testCases!.splice(testCaseIndex, 1);
      }
      return updatedQuestions;
    });
  }

  getQuestionTypeLabel(type: string): string {
    const labels = {
      'qcm': 'Multiple Choice',
      'fill-in-the-blank': 'Fill in the Blank',
      'coding': 'Coding'
    };
    return labels[type as keyof typeof labels] || type;
  }

  canGenerateQuiz(): boolean {
    const formValid = this.quizForm.valid;
    const hasQuestions = this.questions().length > 0;
    const allQuestionsValid = this.questions().every(q => q.text.trim() && this.isQuestionValid(q));
    
    // Debug information (remove in production)
    if (!formValid) {
      console.log('Form is invalid:', this.quizForm.errors);
      console.log('Form values:', this.quizForm.value);
    }
    if (!hasQuestions) {
      console.log('No questions added');
    }
    if (!allQuestionsValid) {
      console.log('Some questions are invalid:');
      this.questions().forEach((q, index) => {
        const valid = q.text.trim() && this.isQuestionValid(q);
        if (!valid) {
          console.log(`Question ${index + 1} is invalid:`, q);
        }
      });
    }
    
    return formValid && hasQuestions && allQuestionsValid;
  }

  private isQuestionValid(question: ManualQuestion): boolean {
    // Basic validation - question must have text
    if (!question.text || !question.text.trim()) {
      return false;
    }

    if (question.type === 'qcm') {
      // Check if answers exist and are properly formatted
      if (!question.answers || question.answers.length < 2) {
        return false;
      }
      // Check if all answers have text and at least one is marked as correct
      const hasValidAnswers = question.answers.every(answer => answer.option && answer.option.trim());
      const hasCorrectAnswer = question.answers.some(answer => answer.isCorrect);
      return hasValidAnswers && hasCorrectAnswer;
    } 
    
    else if (question.type === 'fill-in-the-blank') {
      return !!(question.expectedAnswer && question.expectedAnswer.toString().trim());
    } 
    
    else if (question.type === 'coding') {
      // Check if code template exists
      if (!question.code || !question.code.trim()) {
        return false;
      }
      // Check if test cases exist and are valid
      if (!question.testCases || question.testCases.length === 0) {
        return false;
      }
      // Check if all test cases have input and expected output
      return question.testCases.every(tc => 
        tc.input && tc.input.trim() && 
        tc.expectedOutput && tc.expectedOutput.trim()
      );
    }
    
    return false;
  }

  togglePreview() {
    this.showPreview.update(show => !show);
  }

  getQuizPreview() {
    return this.buildQuizObject();
  }

  generateQuiz() {
    if (!this.canGenerateQuiz()) {
      alert('Please fill in all required fields and add at least one question.');
      return;
    }

    this.isGenerating.set(true);

    const quizData = this.buildQuizObject();
    
    setTimeout(() => {
      this.quizCreated.emit(quizData);
      this.isGenerating.set(false);
    }, 1000);
  }

  private buildQuizObject() {
    const formValue = this.quizForm.value;

    const quizData = {
      title: formValue.title,
      explanation: formValue.explanation,
      category: formValue.category,
      difficulty: formValue.difficulty,
      language: formValue.language,
      estimatedTime: formValue.estimatedTime,
      questions: this.questions().map((q, index) => ({
        id: q.id || `manual_q_${Date.now()}_${index}`,
        text: q.text,
        type: q.type,
        answers: q.answers || undefined,
        expectedAnswer: q.expectedAnswer || undefined,
        code: q.code || undefined,
        language: q.language,
        difficulty: q.difficulty,
        validity: false, // Manual questions need validation
        testCases: q.testCases || undefined
      }))
    };

    // Add quiz ID if we're editing
    if (this.isEditMode() && this.editingQuiz) {
      (quizData as any)._id = this.editingQuiz._id;
      (quizData as any).isUpdate = true;
    }

    return quizData;
  }

  onCancel() {
    // Reset the form and questions
    this.isEditMode.set(false);
    this.questions.set([]);
    this.quizForm.reset({
      title: '',
      category: '',
      difficulty: '',
      language: '',
      estimatedTime: 30,
      explanation: ''
    });
    this.showPreview.set(false);
    this.cancelled.emit();
  }

  // Utility method to get option letters (A, B, C, D, etc.)
  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }
}