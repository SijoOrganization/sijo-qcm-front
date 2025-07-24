import {
  Component,
  OnInit,
  signal,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { QuizFormComponent } from '../quiz-form/quiz-form.component';
import { QuizService } from '../../services/quiz.service';
import { CommonModule } from '@angular/common';
import { Quiz } from '../../../../shared/models/quiz.model';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-quiz-taker',
  imports: [CommonModule, QuizFormComponent],
  templateUrl: './quiz-taker.component.html',
  styleUrls: ['./quiz-taker.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuizTakerComponent implements OnInit {
  quiz = signal<Quiz | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  private route = inject(ActivatedRoute);
  private quizService = inject(QuizService);

  ngOnInit(): void {
    const quizId = this.route.snapshot.paramMap.get('id');
    if (quizId) {
      this.loadQuiz(quizId);
    } else {
      this.error.set('No quiz ID provided');
      this.isLoading.set(false);
    }
  }

  private loadQuiz(quizId: string): void {
    this.quizService.fetchQuizWithQuestions(quizId).subscribe({
      next: (quiz) => {
        this.quiz.set(quiz);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading quiz:', error);
        this.error.set('Failed to load quiz. Please try again.');
        this.isLoading.set(false);
      }
    });
  }
}
