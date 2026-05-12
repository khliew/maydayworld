import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { doc, Firestore, setDoc } from '@angular/fire/firestore';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Discography } from '../model';
import { FirestoreService } from '../services/firestore.service';
import { AdminService } from './admin.service';

vi.mock('@angular/fire/firestore', () => ({
  collection: vi.fn(),
  deleteField: vi.fn(),
  doc: vi.fn((_firestore: unknown, path: string) => ({ path })),
  Firestore: class Firestore {},
  getDocs: vi.fn(),
  setDoc: vi.fn(() => Promise.resolve()),
  writeBatch: vi.fn(),
}));

describe('AdminService', () => {
  let service: AdminService;
  let firestore: Firestore;

  beforeEach(async () => {
    firestore = {} as Firestore;
    vi.clearAllMocks();
    vi.mocked(doc).mockImplementation((_firestore: unknown, path: string) => ({ path }) as any);
    vi.mocked(setDoc).mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        AdminService,
        { provide: FirestoreService, useValue: {} },
        { provide: Firestore, useValue: firestore },
      ],
    }).compileComponents();

    service = TestBed.inject(AdminService);
  });

  it('writes discographies to the artist document', async () => {
    const discography: Discography = {
      id: 'mayday',
      sections: [
        {
          type: 'studio',
          albums: [
            {
              id: 'first-album',
              releaseDate: '1999-07-07',
              title: {
                chinese: {
                  zht: 'First album zht',
                  zhp: 'di yi zhang chuang zuo zhuan ji',
                  eng: 'First Album',
                },
                english: 'First Album',
              },
            },
          ],
        },
      ],
    };

    await firstValueFrom(service.setDiscography('mayday', discography));

    expect(doc).toHaveBeenCalledWith(firestore, 'discos/mayday');
    expect(setDoc).toHaveBeenCalledWith(
      { path: 'discos/mayday' },
      JSON.parse(JSON.stringify(discography)),
    );
  });

  it('propagates discography write failures', async () => {
    vi.mocked(setDoc).mockRejectedValueOnce(new Error('permission denied'));

    await expect(
      firstValueFrom(service.setDiscography('mayday', { id: 'mayday', sections: [] })),
    ).rejects.toThrow('permission denied');
  });
});
