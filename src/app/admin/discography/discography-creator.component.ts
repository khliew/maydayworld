import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Discography } from '../../model';
import { AdminService } from '../admin.service';
import { SectionsParser } from './sections-parser';

@Component({
  selector: 'app-discography-creator',
  templateUrl: './discography-creator.component.html',
  styleUrls: ['./discography-creator.component.css']
})
export class DiscographyCreatorComponent implements AfterViewInit {
  discoForm = this.fb.group({
    artistId: ['']
  });
  outputForm = this.fb.control('');
  readonly = this.fb.control(true);

  @ViewChild('artistId', { static: false }) artistIdEl: ElementRef;

  sectionsParser: SectionsParser;
  hideOutput: boolean;
  output: Discography;
  buttonsDisabled: boolean;

  searchDisabled: boolean;
  searchError: string;

  constructor(private fb: FormBuilder, private adminService: AdminService) {
    this.sectionsParser = new SectionsParser();
    this.hideOutput = true;
    this.buttonsDisabled = false;

    this.searchDisabled = false;
    this.searchError = '';
  }

  ngAfterViewInit() {
    setTimeout(() => this.artistIdEl.nativeElement.focus(), 10);
  }

  searchDiscography() {
    this.hideOutput = true;
    const artistId = this.discoForm.get('artistId').value;

    if (!!artistId) {
      this.searchError = '';
      this.searchDisabled = true;

      this.adminService.getDiscography(artistId)
        .subscribe(disco => {
          this.searchDisabled = false;

          if (disco) {
            this.fillForm(disco);
          } else {
            this.searchError = `Discography not found: ${artistId}`;
          }
        });
    }
  }

  fillForm(discography: Discography) {
    this.outputForm.setValue(JSON.stringify(discography, null, 2));
    this.hideOutput = false;
    this.searchError = '';
  }
}
