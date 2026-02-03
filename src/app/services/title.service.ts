import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Injectable()
export class TitleService {
  private title = inject(Title);

  public setTitle(newTitle: string): void {
    this.title.setTitle(`${newTitle} - ${TITLE_DEFAULT}`);
  }

  public resetTitle(): void {
    this.title.setTitle(TITLE_DEFAULT);
  }
}

export const TITLE_DEFAULT =
  'Mayday World: Chinese lyrics, pinyin, and English translations 五月天歌詞漢語拼音英文翻譯';
