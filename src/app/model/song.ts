import { Line, Title } from '.';

export class Song {
  songId: string;
  title: Title;
  lyricist?: string;
  composer?: string;
  arranger?: string;
  disabled?: boolean;
  lyrics: Line[];
}
