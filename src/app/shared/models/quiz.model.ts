export interface Quiz {
    _id?: string;
    title: string;
    explanation: string;
    category: string;
    questions: Question[];
    isValidated?: boolean; // Expert validation status
    validatedBy?: string; // Expert who validated
    validatedAt?: Date; // Validation timestamp
    createdAt?: Date;
    updatedAt?: Date;
    estimatedTime?: number; // Estimated completion time in minutes
    difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
    tags?: string[]; // Additional tags for categorization
    isPublic?: boolean; // Whether quiz is public or private
    authorId?: string; // ID of the quiz creator
}

export interface Question {
  id: string;
  text: string;
  description?: string;
  type: 'qcm' | 'fill-in-the-blank' | 'coding';
  answers?: { id: string; option: string; isCorrect?: boolean }[];
  expectedAnswer?: string;
  code?: string;
  language: string;
  difficulty: 'easy' | 'medium' | 'hard';
  validity: boolean; // Expert validation status for individual questions
  validatedBy?: string; // Expert who validated this question
  validatedAt?: Date; // Question validation timestamp
  points?: number; // Points awarded for correct answer
  timeLimit?: number; // Time limit for this question in minutes
  hints?: string[]; // Hints for the question
  explanation?: string; // Explanation for the correct answer
  tags?: string[]; // Tags for categorization
  // Add these for coding questions:
  testCases?: TestCase[];
  functionSignatures?: import('./codingQuestion.model').FunctionSignature[];
  functionName?: string;
  isPublic?: boolean; // Whether question is public or private
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  description?: string;
  isHidden?: boolean; // Whether this test case is hidden from students
}

export interface Answer {
    id: string
    option: string;
    isCorrect?: boolean;
    explanation?: string; // Explanation for why this answer is correct/incorrect
}

export interface QuizResult {
  submissionId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number; // Time spent in minutes
  submittedAt: Date;
  detailedResults: QuestionResult[];
}

export interface QuestionResult {
  questionId: string;
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
  explanation?: string;
  timeSpent: number; // Time spent on this question in seconds
  points: number; // Points earned for this question
}

export interface QuizStatistics {
  totalAttempts: number;
  averageScore: number;
  completionRate: number;
  averageTimeSpent: number;
  mostDifficultQuestions: string[];
  questionStatistics: {
    questionId: string;
    correctAnswerRate: number;
    averageTimeSpent: number;
    mostCommonWrongAnswer?: string;
  }[];
}

type QuestionId = string;
type AnswerSet = Set<string>;
export type QuizAnswer = Record<QuestionId, AnswerSet>;
