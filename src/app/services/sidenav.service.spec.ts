import { SidenavService } from './sidenav.service';

describe('SidenavService', () => {
  let service: SidenavService;

  beforeEach(() => (service = new SidenavService()));

  it('#setEnabled should set enabled value', () => {
    service.setEnabled(true);
    expect(service.enabled).toBe(true);
  });

  it('enable$ should emit value from #setEnabled', (done: DoneFn) => {
    service.enable$.subscribe(value => {
      expect(value).toBe(true);
      done();
    });
    service.setEnabled(true);
  });
});
