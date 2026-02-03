import { Injectable } from '@angular/core';
import { vi } from 'vitest';

@Injectable()
export class SidenavServiceStub {
  setEnabled = vi.fn();
}
