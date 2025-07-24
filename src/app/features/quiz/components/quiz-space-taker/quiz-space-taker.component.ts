import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { JavaCodeGenerator } from '../../../coding-questions/codeGenerators/java.generator';
import { PythonCodeGenerator } from '../../../coding-questions/codeGenerators/python.generator';
import { TypescriptCodeGenerator } from '../../../coding-questions/codeGenerators/typescript.generator';
import { CodingQuestion, FunctionSignature } from '../../../../shared/models/codingQuestion.model';

@Component({
  selector: 'app-quiz-space-taker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quiz-space-taker.component.html',
  styleUrls: ['./quiz-space-taker.component.css'],
})
export class QuizSpaceTakerComponent {
  quiz: any = null;
  quizAnswers: Record<string, any> = {};
  quizCode: Record<string, string> = {};
  quizCodeResult: Record<string, any> = {};
  quizInput: Record<string, string> = {};
  quizFinished = false;
  quizScore: number | null = null;
  selectedQuestionIdx = 0;
  codeTemplates: Record<string, string> = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {
    const quizzes = JSON.parse(localStorage.getItem('quizspace_quizzes') || '[]');
    const quizId = this.route.snapshot.paramMap.get('id');
    this.quiz = quizzes.find((q: any) => q.id === quizId);

    // Génère les templates pour chaque coding question
    if (this.quiz) {
      this.quiz.questions.forEach((q: any) => {
        if (q.type === 'coding') {
          this.codeTemplates[q.id] = this.generateCodeTemplate(q);
          this.quizCode[q.id] = this.codeTemplates[q.id];
        }
      });
    }
  }

  get currentQuestion() {
    return this.quiz?.questions[this.selectedQuestionIdx];
  }

  selectQuestion(idx: number) {
    this.selectedQuestionIdx = idx;
  }

  generateCodeTemplate(q: any): string {
    const functionSignatures = this.ensureFunctionSignatures(q);
    const language = (q.language || '').toLowerCase();
    const signature = functionSignatures.find(
      (sig: FunctionSignature) => sig.language?.toLowerCase() === language
    )!;

    const codingQuestion: CodingQuestion = {
      title: q.text,
      description: q.description || '',
      testCases: q.testCases || [],
      functionSignatures,
      functionName: q.functionName || 'solution',
    };

    switch (language) {
      case 'java':
        return JavaCodeGenerator.generateJavaCode(codingQuestion, signature);
      case 'python':
        return PythonCodeGenerator.generatePythonCode(codingQuestion, signature);
      case 'typescript':
        return TypescriptCodeGenerator.generateTypescriptCode(codingQuestion, signature);
      default:
        return '// No template available for this language';
    }
  }

  testCode(questionId: string) {
    const code = this.quizCode[questionId] || '';
    const input = this.quizInput[questionId] || '';
    const language = this.quiz.questions.find((q: any) => q.id === questionId)?.language || 'java';
    this.quizCodeResult[questionId] = { loading: true };
    this.http.post<any>('/coding-questions/execute', { code, language, input }).subscribe({
      next: (result) => {
        this.quizCodeResult[questionId] = result;
      },
      error: () => {
        this.quizCodeResult[questionId] = { stderr: 'Erreur lors de l\'exécution du code.' };
      }
    });
  }

  finishQuiz() {
    let score = 0;
    this.quiz.questions.forEach((q: any) => {
      if (q.type === 'qcm') {
        const correct = q.answers.find((a: any) => a.isCorrect)?.id;
        if (this.quizAnswers[q.id] === correct) score++;
      } else if (q.type === 'fill-in-the-blank') {
        if ((this.quizAnswers[q.id] || '').trim().toLowerCase() === q.expectedAnswer.trim().toLowerCase()) score++;
      } else if (q.type === 'coding') {
        const result = this.quizCodeResult[q.id];
        if (result && result.stdout && q.testCases?.[0]?.expectedOutput &&
            result.stdout.trim() === q.testCases[0].expectedOutput.trim()) {
          score++;
        }
      }
    });
    this.quizScore = Math.round((score / this.quiz.questions.length) * 100);
    this.quizFinished = true;
  }

  backToList() {
    this.router.navigate(['/quiz-space']);
  }

  private ensureFunctionSignatures(q: any): FunctionSignature[] {
    let language = (q.language || '').toLowerCase();
    let functionSignatures: FunctionSignature[] = Array.isArray(q.functionSignatures) ? q.functionSignatures : [];
    let signature = functionSignatures.find(
      (sig: FunctionSignature) => sig.language?.toLowerCase() === language
    );
    if (!signature) {
      signature = {
        language: q.language,
        arguments: [],
        returnType: 'void',
      };
      functionSignatures = [...functionSignatures, signature];
    }
    return functionSignatures;
  }
}