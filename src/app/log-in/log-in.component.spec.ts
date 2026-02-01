import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { click, newEvent, RouterLinkDirectiveStub } from 'src/testing';
import { SidenavServiceStub, TitleServiceStub } from '../model/testing';
import { DataService } from '../services/data.service';
import { SidenavService } from '../services/sidenav.service';
import { TitleService } from '../services/title.service';
import { LogInComponent } from './log-in.component';

describe('LogInComponent', () => {
  let comp: LogInComponent;
  let fixture: ComponentFixture<LogInComponent>;
  let sidenavService: SidenavService;
  let titleService: TitleService;
  let formBuilder: FormBuilder;
  let dataServiceSpy;
  let routerSpy;
  let afAuth;
  let authSpy;

  beforeEach(async(() => {
    dataServiceSpy = jasmine.createSpyObj('DataService', ['logIn']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    authSpy = jasmine.createSpyObj('FirebaseAuth', ['signInWithEmailAndPassword']);
    afAuth = {
      auth: authSpy,
    };
    formBuilder = new FormBuilder();

    TestBed.configureTestingModule({
      imports: [RouterTestingModule, LogInComponent, RouterLinkDirectiveStub],
      providers: [
        { provide: DataService, useValue: dataServiceSpy },
        { provide: FormBuilder, useValue: formBuilder },
        { provide: Router, useValue: routerSpy },
        { provide: SidenavService, useClass: SidenavServiceStub },
        { provide: TitleService, useClass: TitleServiceStub },
        { provide: Auth, useValue: afAuth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LogInComponent);
    comp = fixture.componentInstance;

    const injector = fixture.debugElement.injector;
    sidenavService = injector.get(SidenavService);
    titleService = injector.get(TitleService);

    fixture.detectChanges(); // ngOnInit()
  }));

  it('should hide the sidenav', () => {
    expect(sidenavService.setEnabled).toHaveBeenCalledWith(false);
  });

  it('should reset the document title', () => {
    expect(titleService.resetTitle).toHaveBeenCalled();
  });

  it('should have a fail count of zero', fakeAsync(() => {
    expect(comp.failCount).toBe(0);
  }));

  describe('logging in successful', () => {
    let email;
    let password;

    beforeEach(fakeAsync(() => {
      afAuth.auth.signInWithEmailAndPassword.and.returnValue(Promise.resolve(true));

      email = 'email';
      const emailEl = fixture.nativeElement.querySelector('.email');
      emailEl.value = email;
      emailEl.dispatchEvent(newEvent('input')); // notify Angular

      password = 'password';
      const passwordEl = fixture.nativeElement.querySelector('.password');
      passwordEl.value = password;
      passwordEl.dispatchEvent(newEvent('input')); // notify Angular

      const logIn = fixture.nativeElement.querySelector('.log-in');
      click(logIn);
    }));

    it('should sign in with user provided email and password', () => {
      expect(afAuth.auth.signInWithEmailAndPassword).toHaveBeenCalledWith(email, password);
    });

    it('should navigate to admin', () => {
      expect(routerSpy.navigate).toHaveBeenCalledWith(['admin']);
    });
  });

  describe('logging in failed', () => {
    beforeEach(fakeAsync(() => {
      afAuth.auth.signInWithEmailAndPassword.and.returnValue(Promise.reject(false));

      const logIn = fixture.nativeElement.querySelector('.log-in');
      click(logIn);

      tick(1000); // needs to be 1000
    }));

    it('should increase fail count', () => {
      expect(comp.failCount).toBe(1);
    });

    it('should increase timeout', () => {
      expect(comp.timeout).toBe(1000);
    });
  });
});
