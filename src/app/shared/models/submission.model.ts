import { QuizAnswer } from "./quiz.model";

export interface SubmissionRequest {
    quizId: string; 
    answers: QuizAnswer;
}

export interface Submission {
    id: string; 
    answers: QuizAnswer;
    quizId: string;
    correctAnswers: QuizAnswer;
    score: number;
}

export interface SubmissionConfirmation {
    submissionId: string;
}