import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthPageComponent } from './auth-page.component';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, provideRouter } from '@angular/router';

describe('AuthPageComponent', () => {
  let component: AuthPageComponent;
  let fixture: ComponentFixture<AuthPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthPageComponent],
      providers: [
        {
          provide: AuthService,
          useValue: { isAuthenticated: () => {} },
        },
        {
          provide: ActivatedRoute,
          useValue: {snapshot:{
            url: 'signin'
          }}
        }
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
