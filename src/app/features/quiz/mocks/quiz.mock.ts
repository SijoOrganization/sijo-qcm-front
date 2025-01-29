import { Quiz } from '../../../shared/models/quiz.model';
import { Submission } from '../../../shared/models/submission.model';

export const MockQuiz: Quiz = {
  _id: '%s',
  title: 'This is an example',
  explanation: 'Example',
  category: 'Java',
  questions: [
    {
      id: 'q1',
      text: "Quel est le type de retour de la méthode 'main' en Java ?",
      answers: [
        { id: 'a1', option: 'void', isCorrect: true },
        { id: 'a2', option: 'int', isCorrect: true },
        { id: 'a3', option: 'String' },
        { id: 'a4', option: 'boolean' },
      ],
    },
  ],
};

export const mockSubmission: Submission = {
  id: 'submission-12345',
  answers: {
    q1: new Set(['A']),
    q2: new Set(['B', 'C']),
    q3: new Set(['D']),
  },
  quizId: 'quiz-67890',
  correctAnswers: {
    q1: new Set(['A']),
    q2: new Set(['B', 'C']),
    q3: new Set(['D']),
  },
  score: 100, // Assuming a full score for this mock
};
