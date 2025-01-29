export interface Quiz {
    _id?: string;
    title: string;
    explanation: string;
    category: string;
    questions: Question[];
}

export interface Question {
    id: string
    text: string;
    answers: Answer[];
}

export interface Answer {
    id: string
    option: string;
    isCorrect?: boolean;
}
type QuestionId = string;
type AnswerSet = Set<string>;
export type QuizAnswer = Record<QuestionId, AnswerSet>;
