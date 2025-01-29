import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Quiz } from '../../../../shared/models/quiz.model';
import { Submission } from '../../../../shared/models/submission.model';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-quiz-history',
    imports: [RouterLink],
    templateUrl: './quiz-history.component.html',
    styleUrl: './quiz-history.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuizHistoryComponent {
  submissions = input.required<Submission[]>();
}
