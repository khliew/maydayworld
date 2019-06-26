import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Line, Song, SongMetadata, Title } from '../../model';
import { AdminService } from '../admin.service';
import { LyricsParser } from './lyrics-parser';

@Component({
  selector: 'app-song-creator',
  templateUrl: './song-creator.component.html',
  styleUrls: ['./song-creator.component.css']
})
export class SongCreatorComponent implements OnInit {
  search = this.fb.control('');
  songForm = this.fb.group({
    songId: [''],
    disabled: [false],
    chineseTitle: [''],
    englishTitle: [''],
    lyricist: [''],
    composer: [''],
    arranger: [''],
    lyrics: ['']
  });
  outputForm = this.fb.control('');
  readonly = this.fb.control(true);

  songMds: SongMetadata[];
  lyricsParser: LyricsParser;
  hideOutput: boolean;
  output: Song;
  response: string;

  searchError: string;

  constructor(private fb: FormBuilder, private adminService: AdminService) {
    this.lyricsParser = new LyricsParser();
    this.hideOutput = true;
    this.response = '';
    this.searchError = '';

    this.search.valueChanges
      .subscribe(value => {
        this.searchSong(value);
      });
  }

  ngOnInit() {
    this.search.disable({ emitEvent: false });
    this.adminService.getSongs()
      .subscribe(songs => {
        this.songMds = songs.sort((a, b) => {
          return a.id.localeCompare(b.id); // sort by id
        });

        this.search.enable({ emitEvent: false });
      });
  }

  setFormsEnabled(enabled: boolean) {
    if (enabled) {
      this.search.enable({ emitEvent: false });
      this.songForm.enable();
    } else {
      this.search.disable({ emitEvent: false });
      this.songForm.disable();
    }
  }

  searchSong(songId: string) {
    if (!!songId) {
      this.response = '';
      this.searchError = '';
      this.setFormsEnabled(false);

      this.adminService.getSong(songId)
        .subscribe(song => {
          this.setFormsEnabled(true);

          if (song) {
            this.fillForm(song);
          } else {
            this.searchError = `Song not found: ${songId}`;
          }
        });
    }
  }

  fillForm(song: Song) {
    this.songForm.get('songId').setValue(song.id);

    this.songForm.get('disabled').setValue(typeof song.disabled !== 'undefined' ? song.disabled : false);

    const title = song.title;
    this.songForm.get('chineseTitle').setValue(`${title.chinese.zht}\n${title.chinese.zhp}\n${title.chinese.eng}`);
    this.songForm.get('englishTitle').setValue(title.english);

    this.songForm.get('lyricist').setValue(song.lyricist);
    this.songForm.get('composer').setValue(song.composer);
    this.songForm.get('arranger').setValue(song.arranger);

    if (song.lyrics) {
      const lyrics = song.lyrics
        .map(line => {
          switch (line.type) {
            case 'lyric': {
              return `L\n${line.zht}\n${line.zhp}\n${line.eng}\n`;
            }
            case 'break': {
              return 'B\n\n';
            }
            case 'text': {
              return `T\n${line.text}\n`;
            }
          }
        })
        .join('\n');
      this.songForm.get('lyrics').setValue(lyrics);
    }
  }

  clear() {
    this.search.reset('', { emitEvent: false });
    this.songForm.reset();
    this.response = '';
    this.searchError = '';

    this.hideOutput = true;
    this.readonly.setValue(true);
    this.outputForm.setValue('');
  }

  createFormSong() {
    const song = new Song();
    song.id = this.songForm.get('songId').value;

    song.disabled = this.songForm.get('disabled').value;

    song.lyricist = this.songForm.get('lyricist').value;
    song.composer = this.songForm.get('composer').value;
    song.arranger = this.songForm.get('arranger').value;

    song.title = this.parseTitle(
      this.songForm.get('chineseTitle').value,
      this.songForm.get('englishTitle').value
    );

    song.lyrics = this.parseLyrics(this.songForm.get('lyrics').value);
    return song;
  }

  generateJson() {
    this.output = this.createFormSong();

    this.hideOutput = false;
    this.response = '';
    this.searchError = '';
    this.outputForm.setValue(JSON.stringify(this.output, null, 2));
  }

  parseTitle(chinese: string, english: string): Title {
    const title = new Title();
    title.english = english;

    if (!!chinese) {
      const parts = chinese.split('\n');
      title.chinese = {
        zht: parts[0] && parts[0].trim(),
        zhp: parts[1] && parts[1].trim(),
        eng: parts[2] && parts[2].trim()
      };
    }

    return title;
  }

  parseLyrics(lyrics: string): Line[] {
    return this.lyricsParser.parse(lyrics);
  }

  save() {
    if (this.readonly.value) {
      this.output = this.createFormSong();
    } else {
      this.output = JSON.parse(this.outputForm.value);
    }

    this.response = '';
    this.setFormsEnabled(false);
    this.adminService.setSong(this.output.id, this.output)
      .subscribe(() => {
        this.response = 'Song saved!';
        this.setFormsEnabled(true);
      }, err => {
        this.response = err;
        this.setFormsEnabled(true);
      });
  }
}
