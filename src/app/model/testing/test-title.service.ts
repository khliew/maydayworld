import { Injectable } from '@angular/core';
import { vi } from 'vitest';

@Injectable()
export class TitleServiceStub {
  resetTitle = vi.fn();
  setTitle = vi.fn();
}
