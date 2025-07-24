import { Injectable } from '@angular/core';
import { QuizService } from '../features/quiz/services/quiz.service';
import { AIQuizGeneratorService } from '../features/quiz/services/ai-quiz-generator.service';

@Injectable({
  providedIn: 'root'
})
export class TestService {
  
  constructor(
    private quizService: QuizService,
    private aiQuizGenerator: AIQuizGeneratorService
  ) {}

  // Test AI quiz generation and dashboard integration
  testAIQuizGeneration() {
    console.log('Testing AI Quiz Generation...');
    
    // Generate a test AI quiz
    const aiRequest = {
      topics: ['JavaScript', 'React'],
      difficulty: 'medium' as const,
      languages: ['JavaScript'],
      questionTypes: ['qcm' as const, 'fill-in-the-blank' as const],
      questionCount: 5,
      codingQuestionCount: 1,
      includeExistingQuestions: false,
      validatedOnly: false
    };

    this.aiQuizGenerator.generateQuiz(aiRequest).subscribe({
      next: (result) => {
        console.log('AI Quiz generated successfully:', result);
        console.log('Quiz added to service:', result.quiz);
        
        // Check if quiz appears in the quiz list
        setTimeout(() => {
          const allQuizzes = this.quizService.quizzes();
          console.log('All quizzes in service:', allQuizzes);
          
          const aiQuiz = allQuizzes.find(q => q._id === result.quiz._id);
          if (aiQuiz) {
            console.log('✅ AI Quiz found in quiz list!');
            console.log('Quiz details:', aiQuiz);
          } else {
            console.log('❌ AI Quiz not found in quiz list');
          }
        }, 1000);
      },
      error: (error) => {
        console.error('Error generating AI quiz:', error);
      }
    });
  }
}
