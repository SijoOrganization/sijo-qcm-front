import { TestBed } from '@angular/core/testing';

import { CodingQuestionsService } from './coding-questions.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('CodingQuestionsService', () => {
  let service: CodingQuestionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CodingQuestionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
