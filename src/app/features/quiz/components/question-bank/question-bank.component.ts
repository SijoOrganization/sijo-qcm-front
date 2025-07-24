import { Component, signal, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { QuestionBankService, QuestionFilter } from '../../services/question-bank.service';
import { Question } from '../../../../shared/models/quiz.model';

@Component({
  selector: 'app-question-bank',
  imports: [CommonModule, FormsModule],
  templateUrl: './question-bank.component.html',
  styleUrl: './question-bank.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuestionBankComponent implements OnInit {
  private questionBankService = inject(QuestionBankService);
  private router = inject(Router);

  // Available questions
  questions = this.questionBankService.questions;
  
  // Filter state
  filter = signal<QuestionFilter>({
    language: '',
    difficulty: undefined,
    type: undefined,
    category: '',
    validated: undefined
  });

  // UI state
  selectedQuestions = signal<Set<string>>(new Set());
  viewMode = signal<'grid' | 'list'>('grid');
  isLoading = signal(false);
  showAddForm = signal(false);

  // New question form
  newQuestion = signal({
    text: '',
    type: 'qcm' as 'qcm' | 'fill-in-the-blank' | 'coding',
    language: 'Java',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    category: '',
    answers: [
      { id: 'a1', option: '', isCorrect: false },
      { id: 'a2', option: '', isCorrect: false }
    ],
    expectedAnswer: '',
    code: '',
    testCases: [],
    functionName: 'solution',
    validity: false
  });

  // Available options
  availableLanguages = ['Java', 'Python', 'TypeScript', 'JavaScript', 'C++', 'C#'];
  availableDifficulties = ['easy', 'medium', 'hard'];
  availableTypes = [
    { value: 'qcm', label: 'Multiple Choice' },
    { value: 'fill-in-the-blank', label: 'Fill in the Blank' },
    { value: 'coding', label: 'Coding Challenge' }
  ];
  availableCategories = [
    'Data Structures', 'Algorithms', 'Object-Oriented Programming', 'Design Patterns',
    'Database Management', 'Web Development', 'API Design', 'Software Architecture',
    'Testing', 'Version Control', 'Frameworks', 'Security', 'Performance'
  ];

  // Pagination
  currentPage = signal(1);
  pageSize = signal(20);
  totalPages = signal(1);

  // Statistics
  stats = signal({
    totalQuestions: 0,
    validatedQuestions: 0,
    byLanguage: {} as Record<string, number>,
    byDifficulty: {} as Record<string, number>,
    byType: {} as Record<string, number>
  });

  ngOnInit() {
    this.loadQuestions();
    this.updateStats();
  }

  private loadQuestions() {
    this.isLoading.set(true);
    const filterValue = this.filter();
    
    this.questionBankService.getRandomQuestions(
      this.pageSize() * this.currentPage(),
      filterValue
    ).subscribe({
      next: (questions) => {
        this.isLoading.set(false);
        this.updateStats();
      },
      error: (error) => {
        console.error('Error loading questions:', error);
        this.isLoading.set(false);
      }
    });
  }

  private updateStats() {
    const questions = this.questions();
    const stats = {
      totalQuestions: questions.length,
      validatedQuestions: questions.filter(q => q.validity).length,
      byLanguage: {} as Record<string, number>,
      byDifficulty: {} as Record<string, number>,
      byType: {} as Record<string, number>
    };

    questions.forEach(q => {
      // Count by language
      if (q.language) {
        stats.byLanguage[q.language] = (stats.byLanguage[q.language] || 0) + 1;
      }
      
      // Count by difficulty
      if (q.difficulty) {
        stats.byDifficulty[q.difficulty] = (stats.byDifficulty[q.difficulty] || 0) + 1;
      }
      
      // Count by type
      if (q.type) {
        stats.byType[q.type] = (stats.byType[q.type] || 0) + 1;
      }
    });

    this.stats.set(stats);
  }

  updateFilter(key: keyof QuestionFilter, value: any) {
    this.filter.update(filter => ({ ...filter, [key]: value }));
    this.currentPage.set(1);
    this.loadQuestions();
  }

  clearFilters() {
    this.filter.set({
      language: '',
      difficulty: undefined,
      type: undefined,
      category: '',
      validated: undefined
    });
    this.currentPage.set(1);
    this.loadQuestions();
  }

  toggleQuestionSelection(questionId: string) {
    const selected = this.selectedQuestions();
    const newSelected = new Set(selected);
    
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    
    this.selectedQuestions.set(newSelected);
  }

  selectAllQuestions() {
    const allIds = this.questions().map(q => q.id);
    this.selectedQuestions.set(new Set(allIds));
  }

  clearSelection() {
    this.selectedQuestions.set(new Set());
  }

  validateSelectedQuestions() {
    const selectedIds = Array.from(this.selectedQuestions());
    if (selectedIds.length === 0) {
      alert('Please select questions to validate');
      return;
    }

    this.questionBankService.validateQuestions(selectedIds).subscribe({
      next: () => {
        this.loadQuestions();
        this.clearSelection();
        alert('Questions validated successfully');
      },
      error: (error: any) => {
        console.error('Error validating questions:', error);
        alert('Error validating questions');
      }
    });
  }

  deleteSelectedQuestions() {
    const selectedIds = Array.from(this.selectedQuestions());
    if (selectedIds.length === 0) {
      alert('Please select questions to delete');
      return;
    }

    if (confirm(`Are you sure you want to delete ${selectedIds.length} question(s)?`)) {
      this.questionBankService.deleteQuestions(selectedIds).subscribe({
        next: () => {
          this.loadQuestions();
          this.clearSelection();
          alert('Questions deleted successfully');
        },
        error: (error: any) => {
          console.error('Error deleting questions:', error);
          alert('Error deleting questions');
        }
      });
    }
  }

  addNewQuestion() {
    const questionData = this.newQuestion();
    
    if (!questionData.text.trim()) {
      alert('Please enter question text');
      return;
    }

    // Create the question with an ID
    const question: Question = {
      id: `new_${Date.now()}`,
      text: questionData.text,
      type: questionData.type,
      language: questionData.language,
      difficulty: questionData.difficulty,
      answers: questionData.answers,
      expectedAnswer: questionData.expectedAnswer,
      code: questionData.code,
      testCases: questionData.testCases,
      functionName: questionData.functionName,
      validity: questionData.validity,
      tags: questionData.category ? [questionData.category] : []
    };

    this.questionBankService.addQuestion(question).subscribe({
      next: (addedQuestion) => {
        this.loadQuestions();
        this.resetNewQuestionForm();
        this.showAddForm.set(false);
        alert('Question added successfully');
      },
      error: (error: any) => {
        console.error('Error adding question:', error);
        alert('Error adding question');
      }
    });
  }

  private resetNewQuestionForm() {
    this.newQuestion.set({
      text: '',
      type: 'qcm',
      language: 'Java',
      difficulty: 'medium',
      category: '',
      answers: [
        { id: 'a1', option: '', isCorrect: false },
        { id: 'a2', option: '', isCorrect: false }
      ],
      expectedAnswer: '',
      code: '',
      testCases: [],
      functionName: 'solution',
      validity: false
    });
  }

  addAnswer() {
    const currentAnswers = this.newQuestion().answers;
    const newAnswer = {
      id: `a${currentAnswers.length + 1}`,
      option: '',
      isCorrect: false
    };
    
    this.newQuestion.update(q => ({
      ...q,
      answers: [...currentAnswers, newAnswer]
    }));
  }

  removeAnswer(index: number) {
    this.newQuestion.update(q => ({
      ...q,
      answers: q.answers.filter((_, i) => i !== index)
    }));
  }

  updateNewQuestion(field: string, value: any) {
    this.newQuestion.update(q => ({ ...q, [field]: value }));
  }

  updateAnswer(index: number, field: string, value: any) {
    this.newQuestion.update(q => ({
      ...q,
      answers: q.answers.map((answer, i) => 
        i === index ? { ...answer, [field]: value } : answer
      )
    }));
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.loadQuestions();
    }
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadQuestions();
    }
  }

  exportQuestions() {
    const questions = this.questions();
    const dataStr = JSON.stringify(questions, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `questions-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  importQuestions(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const questions = JSON.parse(e.target?.result as string);
          this.questionBankService.importQuestions(questions).subscribe({
            next: () => {
              this.loadQuestions();
              alert('Questions imported successfully');
            },
            error: (error: any) => {
              console.error('Error importing questions:', error);
              alert('Error importing questions');
            }
          });
        } catch (error) {
          console.error('Error parsing JSON:', error);
          alert('Invalid JSON file');
        }
      };
      
      reader.readAsText(file);
    }
  }

  validateQuestion(questionId: string, isValid: boolean) {
    this.questionBankService.validateQuestion(questionId, isValid).subscribe({
      next: () => {
        this.loadQuestions();
        alert(isValid ? 'Question validated' : 'Question validation removed');
      },
      error: (error: any) => {
        console.error('Error validating question:', error);
        alert('Error validating question');
      }
    });
  }

  // Helper method for template
  Object = Object;

  // Handle checkbox change events
  handleSelectAllChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.selectAllQuestions();
    } else {
      this.clearSelection();
    }
  }
}
