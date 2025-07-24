import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Question } from '../../../shared/models/quiz.model';

export interface QuestionFilter {
  language?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  type?: 'qcm' | 'fill-in-the-blank' | 'coding';
  category?: string;
  validated?: boolean;
}

export interface QuestionBank {
  _id: string;
  questions: Question[];
  metadata: {
    totalQuestions: number;
    byLanguage: Record<string, number>;
    byDifficulty: Record<string, number>;
    byType: Record<string, number>;
    validatedQuestions: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class QuestionBankService {
  private http = inject(HttpClient);
  
  private questionsSignal = signal<Question[]>([]);
  questions = this.questionsSignal.asReadonly();
  
  // Sample questions for different languages and difficulties
  private sampleQuestions: Question[] = [
    // Java Questions
    {
      id: 'java_1',
      text: 'What is the correct way to declare a main method in Java?',
      type: 'qcm',
      answers: [
        { id: 'a1', option: 'public static void main(String[] args)', isCorrect: true },
        { id: 'a2', option: 'public void main(String[] args)', isCorrect: false },
        { id: 'a3', option: 'static void main(String[] args)', isCorrect: false },
        { id: 'a4', option: 'public static int main(String[] args)', isCorrect: false }
      ],
      language: 'Java',
      difficulty: 'easy',
      validity: true
    },
    {
      id: 'java_2',
      text: 'Write a Java method that returns the sum of two integers.',
      type: 'coding',
      language: 'Java',
      difficulty: 'easy',
      validity: true,
      code: `public class Solution {
    public static int sum(int a, int b) {
        // Your code here
        return 0;
    }
}`,
      testCases: [
        { input: '5,3', expectedOutput: '8' },
        { input: '10,20', expectedOutput: '30' },
        { input: '-5,5', expectedOutput: '0' }
      ],
      functionSignatures: [
        {
          language: 'Java',
          arguments: [
            { name: 'a', type: 'int' },
            { name: 'b', type: 'int' }
          ],
          returnType: 'int'
        }
      ],
      functionName: 'sum'
    },
    {
      id: 'java_3',
      text: 'Which keyword is used to create a class in Java?',
      type: 'fill-in-the-blank',
      expectedAnswer: 'class',
      language: 'Java',
      difficulty: 'easy',
      validity: true
    },
    {
      id: 'java_4',
      text: 'What is the time complexity of binary search?',
      type: 'qcm',
      answers: [
        { id: 'a1', option: 'O(log n)', isCorrect: true },
        { id: 'a2', option: 'O(n)', isCorrect: false },
        { id: 'a3', option: 'O(n log n)', isCorrect: false },
        { id: 'a4', option: 'O(n²)', isCorrect: false }
      ],
      language: 'Java',
      difficulty: 'medium',
      validity: true
    },
    {
      id: 'java_5',
      text: 'Implement a Java method to reverse a string.',
      type: 'coding',
      language: 'Java',
      difficulty: 'medium',
      validity: true,
      code: `public class Solution {
    public static String reverseString(String str) {
        // Your code here
        return "";
    }
}`,
      testCases: [
        { input: 'hello', expectedOutput: 'olleh' },
        { input: 'world', expectedOutput: 'dlrow' },
        { input: 'java', expectedOutput: 'avaj' }
      ],
      functionSignatures: [
        {
          language: 'Java',
          arguments: [{ name: 'str', type: 'String' }],
          returnType: 'String'
        }
      ],
      functionName: 'reverseString'
    },
    
    // Python Questions
    {
      id: 'python_1',
      text: 'How do you create a list in Python?',
      type: 'qcm',
      answers: [
        { id: 'a1', option: 'list = []', isCorrect: true },
        { id: 'a2', option: 'list = ()', isCorrect: false },
        { id: 'a3', option: 'list = {}', isCorrect: false },
        { id: 'a4', option: 'list = <>', isCorrect: false }
      ],
      language: 'Python',
      difficulty: 'easy',
      validity: true
    },
    {
      id: 'python_2',
      text: 'Write a Python function that returns the factorial of a number.',
      type: 'coding',
      language: 'Python',
      difficulty: 'medium',
      validity: true,
      code: `def factorial(n):
    # Your code here
    pass`,
      testCases: [
        { input: '5', expectedOutput: '120' },
        { input: '3', expectedOutput: '6' },
        { input: '0', expectedOutput: '1' }
      ],
      functionSignatures: [
        {
          language: 'Python',
          arguments: [{ name: 'n', type: 'int' }],
          returnType: 'int'
        }
      ],
      functionName: 'factorial'
    },
    {
      id: 'python_3',
      text: 'What keyword is used to define a function in Python?',
      type: 'fill-in-the-blank',
      expectedAnswer: 'def',
      language: 'Python',
      difficulty: 'easy',
      validity: true
    },
    
    // TypeScript Questions
    {
      id: 'ts_1',
      text: 'How do you declare a variable with type annotation in TypeScript?',
      type: 'qcm',
      answers: [
        { id: 'a1', option: 'let name: string = "John"', isCorrect: true },
        { id: 'a2', option: 'let name = "John": string', isCorrect: false },
        { id: 'a3', option: 'string name = "John"', isCorrect: false },
        { id: 'a4', option: 'let name<string> = "John"', isCorrect: false }
      ],
      language: 'TypeScript',
      difficulty: 'easy',
      validity: true
    },
    {
      id: 'ts_2',
      text: 'Implement a TypeScript function that checks if a string is a palindrome.',
      type: 'coding',
      language: 'TypeScript',
      difficulty: 'medium',
      validity: true,
      code: `function isPalindrome(str: string): boolean {
    // Your code here
    return false;
}`,
      testCases: [
        { input: 'racecar', expectedOutput: 'true' },
        { input: 'hello', expectedOutput: 'false' },
        { input: 'level', expectedOutput: 'true' }
      ],
      functionSignatures: [
        {
          language: 'TypeScript',
          arguments: [{ name: 'str', type: 'string' }],
          returnType: 'boolean'
        }
      ],
      functionName: 'isPalindrome'
    },
    
    // Hard Questions
    {
      id: 'java_hard_1',
      text: 'Implement a Java method to find the longest common subsequence.',
      type: 'coding',
      language: 'Java',
      difficulty: 'hard',
      validity: true,
      code: `public class Solution {
    public static int longestCommonSubsequence(String text1, String text2) {
        // Your code here
        return 0;
    }
}`,
      testCases: [
        { input: 'abcde,ace', expectedOutput: '3' },
        { input: 'abc,abc', expectedOutput: '3' },
        { input: 'abc,def', expectedOutput: '0' }
      ],
      functionSignatures: [
        {
          language: 'Java',
          arguments: [
            { name: 'text1', type: 'String' },
            { name: 'text2', type: 'String' }
          ],
          returnType: 'int'
        }
      ],
      functionName: 'longestCommonSubsequence'
    },
    {
      id: 'python_hard_1',
      text: 'Write a Python function to implement merge sort.',
      type: 'coding',
      language: 'Python',
      difficulty: 'hard',
      validity: true,
      code: `def merge_sort(arr):
    # Your code here
    pass`,
      testCases: [
        { input: '[64, 34, 25, 12, 22, 11, 90]', expectedOutput: '[11, 12, 22, 25, 34, 64, 90]' },
        { input: '[5, 2, 8, 1, 9]', expectedOutput: '[1, 2, 5, 8, 9]' },
        { input: '[1]', expectedOutput: '[1]' }
      ],
      functionSignatures: [
        {
          language: 'Python',
          arguments: [{ name: 'arr', type: 'List[int]' }],
          returnType: 'List[int]'
        }
      ],
      functionName: 'merge_sort'
    }
  ];

  constructor() {
    // Initialize with sample questions
    this.questionsSignal.set(this.sampleQuestions);
  }

  // Get all questions
  getAllQuestions(): Observable<Question[]> {
    return of(this.questionsSignal());
  }

  // Get questions by filter
  getQuestionsByFilter(filter: QuestionFilter): Observable<Question[]> {
    const questions = this.questionsSignal();
    const filtered = questions.filter(q => {
      if (filter.language && q.language !== filter.language) return false;
      if (filter.difficulty && q.difficulty !== filter.difficulty) return false;
      if (filter.type && q.type !== filter.type) return false;
      if (filter.validated !== undefined && q.validity !== filter.validated) return false;
      return true;
    });
    return of(filtered);
  }

  // Get random questions for quiz generation
  getRandomQuestions(count: number, filter: QuestionFilter = {}): Observable<Question[]> {
    return new Observable(observer => {
      this.getQuestionsByFilter(filter).subscribe(questions => {
        const shuffled = [...questions].sort(() => 0.5 - Math.random());
        observer.next(shuffled.slice(0, count));
        observer.complete();
      });
    });
  }

  // Add new question
  addQuestion(question: Question): Observable<Question> {
    const newQuestion = {
      ...question,
      id: question.id || `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    const currentQuestions = this.questionsSignal();
    this.questionsSignal.set([...currentQuestions, newQuestion]);
    return of(newQuestion);
  }

  // Update existing question
  updateQuestion(question: Question): Observable<Question> {
    const questions = this.questionsSignal();
    const updated = questions.map(q => 
      q.id === question.id ? { ...question } : q
    );
    this.questionsSignal.set(updated);
    return of(question);
  }

  // Delete question
  deleteQuestion(questionId: string): Observable<void> {
    const questions = this.questionsSignal();
    const filtered = questions.filter(q => q.id !== questionId);
    this.questionsSignal.set(filtered);
    return of(void 0);
  }

  // Validate question
  validateQuestion(questionId: string, isValid: boolean): Observable<Question> {
    const questions = this.questionsSignal();
    const updated = questions.map(q => 
      q.id === questionId ? { ...q, validity: isValid } : q
    );
    this.questionsSignal.set(updated);
    
    const validatedQuestion = updated.find(q => q.id === questionId);
    return of(validatedQuestion!);
  }

  // Get question bank metadata
  getQuestionBankMetadata(): Observable<QuestionBank['metadata']> {
    const questions = this.questionsSignal();
    
    const metadata = {
      totalQuestions: questions.length,
      byLanguage: {} as Record<string, number>,
      byDifficulty: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      validatedQuestions: questions.filter(q => q.validity).length
    };

    // Count by language
    questions.forEach(q => {
      metadata.byLanguage[q.language] = (metadata.byLanguage[q.language] || 0) + 1;
    });

    // Count by difficulty
    questions.forEach(q => {
      metadata.byDifficulty[q.difficulty] = (metadata.byDifficulty[q.difficulty] || 0) + 1;
    });

    // Count by type
    questions.forEach(q => {
      metadata.byType[q.type] = (metadata.byType[q.type] || 0) + 1;
    });

    return of(metadata);
  }

  // Search questions
  searchQuestions(searchTerm: string): Observable<Question[]> {
    const questions = this.questionsSignal();
    const filtered = questions.filter(q => 
      q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.language.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return of(filtered);
  }

  // Batch validate questions
  validateQuestions(questionIds: string[]): Observable<void> {
    const questions = this.questionsSignal();
    const updated = questions.map(q => 
      questionIds.includes(q.id) ? { ...q, validity: true } : q
    );
    this.questionsSignal.set(updated);
    return of(void 0);
  }

  // Batch delete questions
  deleteQuestions(questionIds: string[]): Observable<void> {
    const questions = this.questionsSignal();
    const filtered = questions.filter(q => !questionIds.includes(q.id));
    this.questionsSignal.set(filtered);
    return of(void 0);
  }

  // Import questions from JSON
  importQuestions(questions: Question[]): Observable<void> {
    const currentQuestions = this.questionsSignal();
    const newQuestions = questions.map(q => ({
      ...q,
      id: q.id || `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }));
    this.questionsSignal.set([...currentQuestions, ...newQuestions]);
    return of(void 0);
  }
}
