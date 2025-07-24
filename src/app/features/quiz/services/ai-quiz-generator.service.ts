import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Quiz, Question } from '../../../shared/models/quiz.model';
import { QuestionBankService } from './question-bank.service';
import { QuizService } from './quiz.service';

export interface AIQuizGenerationRequest {
  topics: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  languages: string[];
  questionTypes: ('qcm' | 'fill-in-the-blank' | 'coding')[];
  questionCount: number;
  codingQuestionCount: number;
  includeExistingQuestions: boolean;
  validatedOnly: boolean;
}

export interface AIQuizGenerationResponse {
  quiz: Quiz;
  metadata: {
    generatedQuestions: number;
    reusedQuestions: number;
    difficulty: string;
    estimatedTime: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AIQuizGeneratorService {
  private http = inject(HttpClient);
  private questionBankService = inject(QuestionBankService);
  private quizService = inject(QuizService);

  private generationInProgress = signal(false);
  isGenerating = this.generationInProgress.asReadonly();

  generateQuiz(request: AIQuizGenerationRequest): Observable<AIQuizGenerationResponse> {
    this.generationInProgress.set(true);
    
    return combineLatest([
      this.getExistingQuestions(request),
      this.generateNewQuestions(request)
    ]).pipe(
      map(([existingQuestions, newQuestions]) => {
        const allQuestions = [...existingQuestions, ...newQuestions];
        const selectedQuestions = this.selectBestQuestions(allQuestions, request);
        
        const quiz: Quiz = {
          _id: `ai-quiz-${Date.now()}`,
          title: this.generateQuizTitle(request),
          explanation: this.generateQuizExplanation(request),
          category: request.topics.join(', '),
          difficulty: request.difficulty === 'mixed' ? 'medium' : request.difficulty,
          estimatedTime: this.calculateEstimatedTime(selectedQuestions),
          isValidated: false, // Les quiz IA doivent être validés
          questions: selectedQuestions,
          createdAt: new Date(),
          isPublic: false
        };

        // Ajouter le quiz au service QuizService pour qu'il apparaisse dans le dashboard
        this.quizService.addQuizToList(quiz);

        const metadata = {
          generatedQuestions: newQuestions.length,
          reusedQuestions: existingQuestions.length,
          difficulty: request.difficulty,
          estimatedTime: this.calculateEstimatedTime(selectedQuestions)
        };

        this.generationInProgress.set(false);
        return { quiz, metadata };
      })
    );
  }

  /**
   * Simplified method to generate quiz using back-end AI service
   */
  generateQuizWithBackend(topics: string, questionCount: number): Observable<Quiz> {
    this.generationInProgress.set(true);
    
    return this.http.post<Quiz>('/api/quizzes/generate', null, {
      params: {
        topics: topics,
        nbQuestions: questionCount.toString()
      }
    }).pipe(
      map(quiz => {
        this.generationInProgress.set(false);
        return quiz;
      })
    );
  }

  private getExistingQuestions(request: AIQuizGenerationRequest): Observable<Question[]> {
    if (!request.includeExistingQuestions) {
      return of([]);
    }

    return this.questionBankService.getQuestionsByFilter({
      language: request.languages.length === 1 ? request.languages[0] : undefined,
      difficulty: request.difficulty !== 'mixed' ? request.difficulty : undefined,
      validated: request.validatedOnly
    }).pipe(
      map(questions => {
        // Filter by question types
        const filtered = questions.filter(q => 
          request.questionTypes.includes(q.type)
        );
        
        // Shuffle and limit
        const shuffled = filtered.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.floor(request.questionCount * 0.4)); // Use up to 40% existing questions
      })
    );
  }

  private generateNewQuestions(request: AIQuizGenerationRequest): Observable<Question[]> {
    const questionsToGenerate = request.questionCount - Math.floor(request.questionCount * 0.4);
    
    if (questionsToGenerate <= 0) {
      return of([]);
    }

    // Generate questions using AI
    return this.generateQuestionsWithAI(request, questionsToGenerate);
  }

  private generateQuestionsWithAI(request: AIQuizGenerationRequest, count: number): Observable<Question[]> {
    const generatedQuestions: Question[] = [];
    
    // Generate different types of questions
    const qcmCount = Math.floor(count * 0.4);
    const fillBlankCount = Math.floor(count * 0.2);
    const codingCount = Math.min(request.codingQuestionCount, count - qcmCount - fillBlankCount);
    
    // Generate QCM questions
    for (let i = 0; i < qcmCount; i++) {
      generatedQuestions.push(this.generateQCMQuestion(request, i));
    }
    
    // Generate fill-in-the-blank questions
    for (let i = 0; i < fillBlankCount; i++) {
      generatedQuestions.push(this.generateFillBlankQuestion(request, i));
    }
    
    // Generate coding questions
    for (let i = 0; i < codingCount; i++) {
      generatedQuestions.push(this.generateCodingQuestion(request, i));
    }

    return of(generatedQuestions);
  }

  private generateQCMQuestion(request: AIQuizGenerationRequest, index: number): Question {
    const language = request.languages[index % request.languages.length];
    const topic = request.topics[index % request.topics.length];
    const difficulty = request.difficulty === 'mixed' ? 
      ['easy', 'medium', 'hard'][index % 3] as 'easy' | 'medium' | 'hard' : 
      request.difficulty;

    // Generate question based on topic and language
    const questionTemplates = this.getQCMTemplates(language, topic, difficulty);
    const template = questionTemplates[index % questionTemplates.length];
    
    return {
      id: `ai_qcm_${Date.now()}_${index}`,
      text: template.text,
      type: 'qcm',
      answers: template.answers,
      language,
      difficulty,
      validity: false // AI generated questions need validation
    };
  }

  private generateFillBlankQuestion(request: AIQuizGenerationRequest, index: number): Question {
    const language = request.languages[index % request.languages.length];
    const topic = request.topics[index % request.topics.length];
    const difficulty = request.difficulty === 'mixed' ? 
      ['easy', 'medium', 'hard'][index % 3] as 'easy' | 'medium' | 'hard' : 
      request.difficulty;

    const templates = this.getFillBlankTemplates(language, topic, difficulty);
    const template = templates[index % templates.length];
    
    return {
      id: `ai_fill_${Date.now()}_${index}`,
      text: template.text,
      type: 'fill-in-the-blank',
      expectedAnswer: template.expectedAnswer,
      language,
      difficulty,
      validity: false
    };
  }

  private generateCodingQuestion(request: AIQuizGenerationRequest, index: number): Question {
    const language = request.languages[index % request.languages.length];
    const topic = request.topics[index % request.topics.length];
    const difficulty = request.difficulty === 'mixed' ? 
      ['easy', 'medium', 'hard'][index % 3] as 'easy' | 'medium' | 'hard' : 
      request.difficulty;

    const templates = this.getCodingTemplates(language, topic, difficulty);
    const template = templates[index % templates.length];
    
    return {
      id: `ai_coding_${Date.now()}_${index}`,
      text: template.text,
      type: 'coding',
      language,
      difficulty,
      validity: false,
      code: template.code,
      testCases: template.testCases,
      functionSignatures: template.functionSignatures,
      functionName: template.functionName
    };
  }

  private selectBestQuestions(questions: Question[], request: AIQuizGenerationRequest): Question[] {
    // Score questions based on relevance and quality
    const scoredQuestions = questions.map(q => ({
      question: q,
      score: this.calculateQuestionScore(q, request)
    }));

    // Sort by score and take the best ones
    scoredQuestions.sort((a, b) => b.score - a.score);
    
    return scoredQuestions
      .slice(0, request.questionCount)
      .map(sq => sq.question);
  }

  private calculateQuestionScore(question: Question, request: AIQuizGenerationRequest): number {
    let score = 0;
    
    // Language match
    if (request.languages.includes(question.language)) {
      score += 30;
    }
    
    // Question type preference
    if (request.questionTypes.includes(question.type)) {
      score += 20;
    }
    
    // Difficulty match
    if (request.difficulty === 'mixed' || question.difficulty === request.difficulty) {
      score += 20;
    }
    
    // Validation bonus
    if (question.validity) {
      score += 20;
    }
    
    // Coding question bonus if requested
    if (question.type === 'coding' && request.codingQuestionCount > 0) {
      score += 15;
    }
    
    return score;
  }

  private generateQuizTitle(request: AIQuizGenerationRequest): string {
    const languages = request.languages.join(' & ');
    const topics = request.topics.join(', ');
    const difficulty = request.difficulty === 'mixed' ? 'Mixed Level' : request.difficulty;
    
    return `${languages} ${difficulty} Quiz: ${topics}`;
  }

  private generateQuizExplanation(request: AIQuizGenerationRequest): string {
    const questionCount = request.questionCount;
    const codingCount = request.codingQuestionCount;
    const languages = request.languages.join(' and ');
    const topics = request.topics.join(', ');
    
    return `This quiz contains ${questionCount} questions covering ${topics} in ${languages}. ` +
           `It includes ${codingCount} coding challenges and various question types to test your knowledge comprehensively.`;
  }

  private calculateEstimatedTime(questions: Question[]): number {
    let totalTime = 0;
    
    questions.forEach(q => {
      switch (q.type) {
        case 'qcm':
          totalTime += q.difficulty === 'easy' ? 1 : q.difficulty === 'medium' ? 2 : 3;
          break;
        case 'fill-in-the-blank':
          totalTime += q.difficulty === 'easy' ? 1.5 : q.difficulty === 'medium' ? 2.5 : 4;
          break;
        case 'coding':
          totalTime += q.difficulty === 'easy' ? 10 : q.difficulty === 'medium' ? 15 : 25;
          break;
      }
    });
    
    return totalTime;
  }

  // Template generators for different question types
  private getQCMTemplates(language: string, topic: string, difficulty: string) {
    const templates: Record<string, Record<string, any>> = {
      Java: {
        easy: [
          {
            text: `What is the correct syntax for a ${topic} in Java?`,
            answers: [
              { id: 'a1', option: 'public class Example {}', isCorrect: true },
              { id: 'a2', option: 'class public Example {}', isCorrect: false },
              { id: 'a3', option: 'Example class public {}', isCorrect: false },
              { id: 'a4', option: 'public Example class {}', isCorrect: false }
            ]
          },
          {
            text: `Which keyword is used for inheritance in Java?`,
            answers: [
              { id: 'a1', option: 'extends', isCorrect: true },
              { id: 'a2', option: 'inherits', isCorrect: false },
              { id: 'a3', option: 'implements', isCorrect: false },
              { id: 'a4', option: 'super', isCorrect: false }
            ]
          }
        ],
        medium: [
          {
            text: `What is the time complexity of ${topic} operations?`,
            answers: [
              { id: 'a1', option: 'O(1)', isCorrect: false },
              { id: 'a2', option: 'O(log n)', isCorrect: true },
              { id: 'a3', option: 'O(n)', isCorrect: false },
              { id: 'a4', option: 'O(n²)', isCorrect: false }
            ]
          }
        ],
        hard: [
          {
            text: `Which design pattern is best for ${topic} implementation?`,
            answers: [
              { id: 'a1', option: 'Factory Pattern', isCorrect: true },
              { id: 'a2', option: 'Singleton Pattern', isCorrect: false },
              { id: 'a3', option: 'Observer Pattern', isCorrect: false },
              { id: 'a4', option: 'Strategy Pattern', isCorrect: false }
            ]
          }
        ]
      },
      Python: {
        easy: [
          {
            text: `How do you define a function in Python for ${topic}?`,
            answers: [
              { id: 'a1', option: 'def function_name():', isCorrect: true },
              { id: 'a2', option: 'function function_name():', isCorrect: false },
              { id: 'a3', option: 'def function_name()[]', isCorrect: false },
              { id: 'a4', option: 'define function_name():', isCorrect: false }
            ]
          }
        ],
        medium: [
          {
            text: `What is the best Python data structure for ${topic}?`,
            answers: [
              { id: 'a1', option: 'List', isCorrect: false },
              { id: 'a2', option: 'Dictionary', isCorrect: true },
              { id: 'a3', option: 'Set', isCorrect: false },
              { id: 'a4', option: 'Tuple', isCorrect: false }
            ]
          }
        ],
        hard: [
          {
            text: `Which Python feature is most suitable for ${topic} optimization?`,
            answers: [
              { id: 'a1', option: 'Generators', isCorrect: true },
              { id: 'a2', option: 'Lists', isCorrect: false },
              { id: 'a3', option: 'Dictionaries', isCorrect: false },
              { id: 'a4', option: 'Sets', isCorrect: false }
            ]
          }
        ]
      },
      TypeScript: {
        easy: [
          {
            text: `How do you declare a variable with type annotation in TypeScript for ${topic}?`,
            answers: [
              { id: 'a1', option: 'let variable: type = value', isCorrect: true },
              { id: 'a2', option: 'let variable = value: type', isCorrect: false },
              { id: 'a3', option: 'type variable = value', isCorrect: false },
              { id: 'a4', option: 'let variable<type> = value', isCorrect: false }
            ]
          }
        ],
        medium: [
          {
            text: `What is the correct interface definition for ${topic} in TypeScript?`,
            answers: [
              { id: 'a1', option: 'interface Name { prop: type }', isCorrect: true },
              { id: 'a2', option: 'interface Name = { prop: type }', isCorrect: false },
              { id: 'a3', option: 'interface Name: { prop: type }', isCorrect: false },
              { id: 'a4', option: 'interface Name -> { prop: type }', isCorrect: false }
            ]
          }
        ],
        hard: [
          {
            text: `Which TypeScript advanced feature is best for ${topic} implementation?`,
            answers: [
              { id: 'a1', option: 'Generics', isCorrect: true },
              { id: 'a2', option: 'Enums', isCorrect: false },
              { id: 'a3', option: 'Interfaces', isCorrect: false },
              { id: 'a4', option: 'Classes', isCorrect: false }
            ]
          }
        ]
      }
    };

    return templates[language]?.[difficulty] || templates['Java']['easy'];
  }

  private getFillBlankTemplates(language: string, topic: string, difficulty: string) {
    const templates: Record<string, Record<string, any>> = {
      Java: {
        easy: [
          { text: `The keyword _____ is used to define a class in Java.`, expectedAnswer: 'class' },
          { text: `The _____ method is the entry point of a Java application.`, expectedAnswer: 'main' }
        ],
        medium: [
          { text: `The _____ keyword is used to prevent inheritance in Java.`, expectedAnswer: 'final' },
          { text: `The _____ collection provides O(1) lookup time.`, expectedAnswer: 'HashMap' }
        ],
        hard: [
          { text: `The _____ pattern ensures only one instance of a class exists.`, expectedAnswer: 'Singleton' },
          { text: `The _____ interface is used for custom comparison logic.`, expectedAnswer: 'Comparator' }
        ]
      },
      Python: {
        easy: [
          { text: `The _____ keyword is used to define a function in Python.`, expectedAnswer: 'def' },
          { text: `The _____ function is used to get the length of a list.`, expectedAnswer: 'len' }
        ],
        medium: [
          { text: `The _____ module is used for regular expressions in Python.`, expectedAnswer: 're' },
          { text: `The _____ method is used to add an element to a list.`, expectedAnswer: 'append' }
        ],
        hard: [
          { text: `The _____ decorator is used to create static methods.`, expectedAnswer: 'staticmethod' },
          { text: `The _____ module provides high-performance container datatypes.`, expectedAnswer: 'collections' }
        ]
      },
      TypeScript: {
        easy: [
          { text: `The _____ keyword is used to define a variable with type annotation.`, expectedAnswer: 'let' },
          { text: `The _____ keyword is used to define a type alias.`, expectedAnswer: 'type' }
        ],
        medium: [
          { text: `The _____ keyword is used to define a contract for classes.`, expectedAnswer: 'interface' },
          { text: `The _____ operator is used for optional chaining.`, expectedAnswer: '?.' }
        ],
        hard: [
          { text: `The _____ utility type makes all properties optional.`, expectedAnswer: 'Partial' },
          { text: `The _____ keyword is used to define template parameters.`, expectedAnswer: 'generic' }
        ]
      }
    };

    return templates[language]?.[difficulty] || templates['Java']['easy'];
  }

  private getCodingTemplates(language: string, topic: string, difficulty: string) {
    const templates: Record<string, Record<string, any>> = {
      Java: {
        easy: [
          {
            text: `Write a Java method that adds two numbers.`,
            code: `public class Solution {
    public static int add(int a, int b) {
        // Your code here
        return 0;
    }
}`,
            testCases: [
              { input: '5,3', expectedOutput: '8' },
              { input: '10,20', expectedOutput: '30' },
              { input: '0,0', expectedOutput: '0' }
            ],
            functionSignatures: [{ language: 'Java', arguments: [{ name: 'a', type: 'int' }, { name: 'b', type: 'int' }], returnType: 'int' }],
            functionName: 'add'
          }
        ],
        medium: [
          {
            text: `Write a Java method to check if a string is a palindrome.`,
            code: `public class Solution {
    public static boolean isPalindrome(String s) {
        // Your code here
        return false;
    }
}`,
            testCases: [
              { input: 'racecar', expectedOutput: 'true' },
              { input: 'hello', expectedOutput: 'false' },
              { input: 'level', expectedOutput: 'true' }
            ],
            functionSignatures: [{ language: 'Java', arguments: [{ name: 's', type: 'String' }], returnType: 'boolean' }],
            functionName: 'isPalindrome'
          }
        ],
        hard: [
          {
            text: `Write a Java method to find the longest common subsequence of two strings.`,
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
            functionSignatures: [{ language: 'Java', arguments: [{ name: 'text1', type: 'String' }, { name: 'text2', type: 'String' }], returnType: 'int' }],
            functionName: 'longestCommonSubsequence'
          }
        ]
      },
      Python: {
        easy: [
          {
            text: `Write a Python function to calculate the factorial of a number.`,
            code: `def factorial(n):
    # Your code here
    pass`,
            testCases: [
              { input: '5', expectedOutput: '120' },
              { input: '3', expectedOutput: '6' },
              { input: '0', expectedOutput: '1' }
            ],
            functionSignatures: [{ language: 'Python', arguments: [{ name: 'n', type: 'int' }], returnType: 'int' }],
            functionName: 'factorial'
          }
        ],
        medium: [
          {
            text: `Write a Python function to find the maximum element in a list.`,
            code: `def find_max(arr):
    # Your code here
    pass`,
            testCases: [
              { input: '[1, 5, 3, 9, 2]', expectedOutput: '9' },
              { input: '[10, 20, 30]', expectedOutput: '30' },
              { input: '[5]', expectedOutput: '5' }
            ],
            functionSignatures: [{ language: 'Python', arguments: [{ name: 'arr', type: 'List[int]' }], returnType: 'int' }],
            functionName: 'find_max'
          }
        ],
        hard: [
          {
            text: `Write a Python function to implement merge sort.`,
            code: `def merge_sort(arr):
    # Your code here
    pass`,
            testCases: [
              { input: '[64, 34, 25, 12, 22, 11, 90]', expectedOutput: '[11, 12, 22, 25, 34, 64, 90]' },
              { input: '[5, 2, 8, 1, 9]', expectedOutput: '[1, 2, 5, 8, 9]' },
              { input: '[1]', expectedOutput: '[1]' }
            ],
            functionSignatures: [{ language: 'Python', arguments: [{ name: 'arr', type: 'List[int]' }], returnType: 'List[int]' }],
            functionName: 'merge_sort'
          }
        ]
      },
      TypeScript: {
        easy: [
          {
            text: `Write a TypeScript function to reverse a string.`,
            code: `function reverseString(str: string): string {
    // Your code here
    return "";
}`,
            testCases: [
              { input: 'hello', expectedOutput: 'olleh' },
              { input: 'world', expectedOutput: 'dlrow' },
              { input: 'typescript', expectedOutput: 'tpircsepyt' }
            ],
            functionSignatures: [{ language: 'TypeScript', arguments: [{ name: 'str', type: 'string' }], returnType: 'string' }],
            functionName: 'reverseString'
          }
        ],
        medium: [
          {
            text: `Write a TypeScript function to find the first non-repeating character in a string.`,
            code: `function firstNonRepeatingChar(str: string): string | null {
    // Your code here
    return null;
}`,
            testCases: [
              { input: 'hello', expectedOutput: 'h' },
              { input: 'aabbcc', expectedOutput: 'null' },
              { input: 'abcabc', expectedOutput: 'null' }
            ],
            functionSignatures: [{ language: 'TypeScript', arguments: [{ name: 'str', type: 'string' }], returnType: 'string | null' }],
            functionName: 'firstNonRepeatingChar'
          }
        ],
        hard: [
          {
            text: `Write a TypeScript function to implement a binary search tree.`,
            code: `class TreeNode {
    val: number;
    left: TreeNode | null;
    right: TreeNode | null;
    constructor(val: number) {
        this.val = val;
        this.left = null;
        this.right = null;
    }
}

function insertIntoBST(root: TreeNode | null, val: number): TreeNode | null {
    // Your code here
    return null;
}`,
            testCases: [
              { input: '4,2', expectedOutput: 'TreeNode with val=4, left=TreeNode(2)' },
              { input: '4,6', expectedOutput: 'TreeNode with val=4, right=TreeNode(6)' },
              { input: 'null,5', expectedOutput: 'TreeNode with val=5' }
            ],
            functionSignatures: [{ language: 'TypeScript', arguments: [{ name: 'root', type: 'TreeNode | null' }, { name: 'val', type: 'number' }], returnType: 'TreeNode | null' }],
            functionName: 'insertIntoBST'
          }
        ]
      }
    };

    return templates[language]?.[difficulty] || templates['Java']['easy'];
  }
}
