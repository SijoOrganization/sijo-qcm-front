import { CodingQuestion } from '../../../shared/models/codingQuestion.model';

export const MOCK_CODING_QUESTION: CodingQuestion = {
  title: 'Sum of Digits',
  description: 'Given an integer n, return the sum of its digits.',
  testCases: [
    {
      input: '123',
      expectedOutput: '6',
    },
    {
      input: '456',
      expectedOutput: '15',
    },
    {
      input: '0',
      expectedOutput: '0',
    },
  ],
  functionSignatures: [
    {
      language: 'java',
      arguments: [
        {
          name: 'n',
          type: 'Integer',
        },
      ],
      returnType: 'int',
    },
  ],
  functionName: 'sumOfDigits',
};
