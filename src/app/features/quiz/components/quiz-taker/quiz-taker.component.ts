import {
  Component,
  Input,
  OnInit,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
  input,
} from '@angular/core';
import { QuestionsContainerComponent } from '../questions-container/questions-container.component';
import { QuizService } from '../../services/quiz.service';
import { CommonModule } from '@angular/common';
import { Quiz } from '../../../../shared/models/quiz.model';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-quiz-taker',
    imports: [CommonModule, QuestionsContainerComponent],
    templateUrl: './quiz-taker.component.html',
    styleUrls: ['./quiz-taker.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuizTakerComponent implements OnInit {
  quiz = signal<Quiz | null>(null);
  private route = inject(ActivatedRoute);
  private quizService = inject(QuizService);

  ngOnInit(): void {
    const quizId = this.route.snapshot.paramMap.get('id');
    if (quizId) {
      this.quizService.fetchQuizWithQuestions(quizId).subscribe((quiz) => {
        this.quiz.set(quiz);
      });
    }
  }
}
