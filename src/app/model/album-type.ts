export const SUPPORTED_ALBUM_TYPES = ['studio', 'compilation', 'ep', 'other'] as const;

export type AlbumType = (typeof SUPPORTED_ALBUM_TYPES)[number];

export const ALBUM_TYPE_LABELS: Record<AlbumType, string> = {
  studio: 'Studio Albums',
  compilation: 'Compilations',
  ep: 'EP',
  other: 'Other',
};

export function isSupportedAlbumType(type: string): type is AlbumType {
  return (SUPPORTED_ALBUM_TYPES as readonly string[]).includes(type);
}
