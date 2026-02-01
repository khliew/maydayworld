import { Song } from '../song';

export function getTestSong(): Song {
  return {
    id: 'songId',
    title: {
      chinese: { zht: 'zht', zhp: 'zhp', eng: 'eng' },
      english: 'english',
    },
    lyricist: 'lyricist',
    composer: 'composer',
    arranger: 'arranger',
    lyrics: [
      {
        type: 'lyric',
        zht: 'line zht',
        zhp: 'line zhp',
        eng: 'line eng',
      },
      {
        type: 'text',
        text: 'line text',
      },
      {
        type: 'break',
      },
    ],
  };
}
