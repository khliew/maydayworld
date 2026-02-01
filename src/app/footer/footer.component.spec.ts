import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterLinkDirectiveStub } from 'src/testing';
import { EnvironmentService } from '../services/environment.service';
import { FooterComponent } from './footer.component';
import { By } from '@angular/platform-browser';

class EnvironmentServiceStub {
  env = { version: 'test version' };
}

describe('FooterComponent ', () => {
  let comp: FooterComponent;
  let environmentService: EnvironmentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FooterComponent,
        { provide: EnvironmentService, useClass: EnvironmentServiceStub },
      ],
    });

    comp = TestBed.get(FooterComponent);
    environmentService = TestBed.get(EnvironmentService);
  });

  it('should get the app version from environment', () => {
    expect(comp.appVersion).toBe(environmentService.env.version);
  });
});

describe('FooterComponent (DOM)', () => {
  let comp: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;
  let environmentService: EnvironmentService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [FooterComponent, RouterLinkDirectiveStub],
      providers: [{ provide: EnvironmentService, useClass: EnvironmentServiceStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    comp = fixture.componentInstance;
    environmentService = fixture.debugElement.injector.get(EnvironmentService);

    fixture.detectChanges();
  }));

  it('should display the app version', () => {
    const footerEl: HTMLElement = fixture.nativeElement;
    const el = footerEl.querySelector('.app-version');
    expect(el.textContent).toEqual(`v${environmentService.env.version}`);
  });

  it('should route "about us" link to the correct page', () => {
    const linkDe = fixture.debugElement.query(By.css('.about-us'));
    const routerLink = linkDe.injector.get(RouterLinkDirectiveStub);

    expect(routerLink.linkParams).toEqual('/about');
  });

  it('should route "privacy policy" link to the correct page', () => {
    const linkDe = fixture.debugElement.query(By.css('.privacy'));
    const routerLink = linkDe.injector.get(RouterLinkDirectiveStub);

    expect(routerLink.linkParams).toEqual('/privacy');
  });
});
