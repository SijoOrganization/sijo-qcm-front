import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router'; // <-- ajoute ceci
import { NewlinePipe } from '../../../../shared/pipes/newline.pipe';

type QuestionType = 'qcm' | 'fill-in-the-blank' | 'coding';

interface QcmAnswer {
  id: string;
  option: string;
  isCorrect: boolean;
}

interface QcmQuestion {
  id: string;
  type: 'qcm';
  text: string;
  language: string;
  difficulty: 'easy' | 'medium' | 'hard';
  validity: boolean;
  answers: QcmAnswer[];
}

interface FillInBlankQuestion {
  id: string;
  type: 'fill-in-the-blank';
  text: string;
  language: string;
  difficulty: 'easy' | 'medium' | 'hard';
  validity: boolean;
  expectedAnswer: string;
}

interface CodingFunctionArgument {
  name: string;
  type: string;
}

interface FunctionSignature {
  language: string;
  arguments: CodingFunctionArgument[];
  returnType: string;
}

interface CodingTestCase {
  input: string;
  expectedOutput: string;
}

interface CodingQuestion {
  id: string;
  type: 'coding';
  text: string;
  language: string;
  difficulty: 'easy' | 'medium' | 'hard';
  validity: boolean;
  code: string;
  testCases: CodingTestCase[];
  functionSignatures: FunctionSignature[]; // <-- Ajoute ce champ
  functionName: string; // <-- Ajoute ce champ
}

type AnyQuestion = QcmQuestion | FillInBlankQuestion | CodingQuestion;

interface Quiz {
  id: string;
  title: string;
  language: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: AnyQuestion[];
}

@Component({
  selector: 'app-quiz-space',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NewlinePipe], // <-- ajoute RouterModule ici
  templateUrl: './quiz-space.component.html',
  styleUrls: ['./quiz-space.component.css'],
})
export class QuizSpaceComponent {
  // Questions & Quiz storage
  questions: AnyQuestion[] = [];
  quizzes: Quiz[] = [];

  // Form state
  newQuestionType: QuestionType = 'qcm';
  newQcm: Partial<QcmQuestion> = { answers: [], validity: true, difficulty: 'easy', language: 'Java' };
  newFill: Partial<FillInBlankQuestion> = { validity: true, difficulty: 'easy', language: 'Java' };
  newCoding: Partial<CodingQuestion> = { testCases: [], validity: true, difficulty: 'easy', language: 'Java', code: '' };

  // Quiz generation form
  quizGen: { language: string; difficulty: 'easy' | 'medium' | 'hard'; nbCoding: number; nbQuestions: number; title: string } = {
    language: '',
    difficulty: 'easy',
    nbCoding: 1,
    nbQuestions: 10,
    title: ''
  };

  // Quiz taking state
  currentQuiz: Quiz | null = null;
  quizStep = 0;
  quizAnswers: Record<string, any> = {};
  quizScore: number | null = null;
  quizFinished = false;
  quizCode: Record<string, string> = {};
  quizCodeResult: Record<string, string> = {};

  // CRUD for questions
  addQcmAnswer() {
    this.newQcm.answers!.push({ id: `a${this.newQcm.answers!.length + 1}`, option: '', isCorrect: false });
  }
  removeQcmAnswer(idx: number) {
    this.newQcm.answers!.splice(idx, 1);
  }
  addCodingTestCase() {
    this.newCoding.testCases!.push({ input: '', expectedOutput: '' });
  }
  removeCodingTestCase(idx: number) {
    this.newCoding.testCases!.splice(idx, 1);
  }

  addQuestion() {
    let question: AnyQuestion;
    if (this.newQuestionType === 'qcm') {
      question = {
        id: `q${this.questions.length + 1}`,
        type: 'qcm',
        text: this.newQcm.text!,
        language: this.newQcm.language!,
        difficulty: this.newQcm.difficulty!,
        validity: !!this.newQcm.validity,
        answers: JSON.parse(JSON.stringify(this.newQcm.answers!)),
      };
    } else if (this.newQuestionType === 'fill-in-the-blank') {
      question = {
        id: `q${this.questions.length + 1}`,
        type: 'fill-in-the-blank',
        text: this.newFill.text!,
        language: this.newFill.language!,
        difficulty: this.newFill.difficulty!,
        validity: !!this.newFill.validity,
        expectedAnswer: this.newFill.expectedAnswer!,
      };
    } else {
      question = {
        id: `q${this.questions.length + 1}`,
        type: 'coding',
        text: this.newCoding.text!,
        language: this.newCoding.language!,
        difficulty: this.newCoding.difficulty!,
        validity: !!this.newCoding.validity,
        code: this.newCoding.code!,
        testCases: JSON.parse(JSON.stringify(this.newCoding.testCases!)),
        functionSignatures: this.newCoding.functionSignatures ?? [],
        functionName: this.newCoding.functionName!,
      };
    }
    this.questions.push(question);
    this.resetForm();
    this.saveQuestions();
  }

  editIndex: number | null = null;
  editQuestion(idx: number) {
    this.editIndex = idx;
    const q = this.questions[idx];
    this.newQuestionType = q.type;
    if (q.type === 'qcm') this.newQcm = { ...q, answers: JSON.parse(JSON.stringify(q.answers)) };
    if (q.type === 'fill-in-the-blank') this.newFill = { ...q };
    if (q.type === 'coding') this.newCoding = { ...q, testCases: JSON.parse(JSON.stringify(q.testCases)) };
  }
  updateQuestion() {
    if (this.editIndex === null) return;
    this.questions.splice(this.editIndex, 1);
    this.addQuestion();
    this.editIndex = null;
  }
  deleteQuestion(idx: number) {
    this.questions.splice(idx, 1);
    this.saveQuestions();
  }
  resetForm() {
    this.newQcm = { answers: [], validity: true, difficulty: 'easy', language: 'Java' };
    this.newFill = { validity: true, difficulty: 'easy', language: 'Java' };
    this.newCoding = { testCases: [], validity: true, difficulty: 'easy', language: 'Java', code: '' };
    this.editIndex = null;
  }

  // Quiz generation
  generateQuiz() {
    const filtered = this.questions.filter(
      q => q.language === this.quizGen.language && q.difficulty === this.quizGen.difficulty && q.validity
    );
    const codingQs = filtered.filter(q => q.type === 'coding').slice(0, this.quizGen.nbCoding);
    const others = filtered.filter(q => q.type !== 'coding');
    // Prendre le nombre restant pour compléter le total
    const nbOthers = Math.max(0, this.quizGen.nbQuestions - codingQs.length);
    const selectedOthers = others.slice(0, nbOthers);
    const quiz: Quiz = {
      id: `quiz${this.quizzes.length + 1}`,
      title: this.quizGen.title || `Quiz ${this.quizzes.length + 1}`,
      language: this.quizGen.language,
      difficulty: this.quizGen.difficulty,
      questions: [...codingQs, ...selectedOthers],
    };
    this.quizzes.push(quiz);
    this.saveQuizzes();
  }

  // JSON persistence
  saveQuestions() {
    localStorage.setItem('quizspace_questions', JSON.stringify(this.questions));
  }
  saveQuizzes() {
    localStorage.setItem('quizspace_quizzes', JSON.stringify(this.quizzes));
  }
  loadQuestions() {
    const data = localStorage.getItem('quizspace_questions');
    if (data) this.questions = JSON.parse(data);
  }
  loadQuizzes() {
    const data = localStorage.getItem('quizspace_quizzes');
    if (data) this.quizzes = JSON.parse(data);
  }

  // Init
  constructor() {
    this.loadQuestions();
    this.loadQuizzes();
  }

  startQuiz(quiz: Quiz) {
    this.currentQuiz = quiz;
    this.quizStep = 0;
    this.quizAnswers = {};
    this.quizScore = null;
    this.quizFinished = false;
    this.quizCode = {};
    this.quizCodeResult = {};
  }

  answerQcm(questionId: string, answerId: string) {
    this.quizAnswers[questionId] = answerId;
  }

  answerFill(questionId: string, value: string) {
    this.quizAnswers[questionId] = value;
  }

  answerCode(questionId: string, code: string) {
    this.quizCode[questionId] = code;
  }

  nextQuestion() {
    if (this.currentQuiz && this.quizStep < this.currentQuiz.questions.length - 1) {
      this.quizStep++;
    } else {
      this.finishQuiz();
    }
  }

  finishQuiz() {
    if (!this.currentQuiz) return;
    let score = 0;
    this.currentQuiz.questions.forEach((q) => {
      if (q.type === 'qcm') {
        const correct = q.answers.find(a => a.isCorrect)?.id;
        if (this.quizAnswers[q.id] === correct) score++;
      } else if (q.type === 'fill-in-the-blank') {
        if ((this.quizAnswers[q.id] || '').trim().toLowerCase() === q.expectedAnswer.trim().toLowerCase()) score++;
      }
      // Coding: handled separately
    });
    this.quizScore = Math.round((score / this.currentQuiz.questions.length) * 100);
    this.quizFinished = true;
  }

  deleteQuiz(idx: number) {
    this.quizzes.splice(idx, 1);
    this.saveQuizzes();
  }
}