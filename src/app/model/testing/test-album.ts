import { Album } from '../album';

export function getTestAlbum(): Album {
  return {
    id: 'albumId',
    type: 'studio',
    title: {
      chinese: { zht: 'zht', zhp: 'zhp', eng: 'eng' },
      english: 'english',
    },
    releaseDate: '1999-07-07',
    songs: {
      1: {
        id: 'songId1',
        title: {
          chinese: { zht: 'songZht1', zhp: 'songZhp1', eng: 'songEng1' },
          english: 'songEnglish1',
        },
      },
      2: {
        id: 'songId2',
        title: {
          chinese: { zht: 'songZht2', zhp: 'songZhp2', eng: 'songEng2' },
          english: 'songEnglish2',
        },
      },
      3: {
        id: 'songId3',
        title: {
          chinese: { zht: 'songZht3', zhp: 'songZhp3', eng: 'songEng3' },
          english: 'songEnglish3',
        },
        disabled: true,
      },
      4: {
        id: 'songId4',
        title: {
          chinese: { zht: 'songZht4', zhp: 'songZhp4', eng: 'songEng4' },
          english: 'songEnglish4',
        },
      },
    },
  };
}
