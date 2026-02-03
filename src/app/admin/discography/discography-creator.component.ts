import { AfterViewInit, Component, ElementRef, inject, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatInput } from '@angular/material/input';
import { Discography } from '../../model';
import { AdminService } from '../admin.service';
import { SectionsParser } from './sections-parser';

@Component({
  selector: 'app-discography-creator',
  templateUrl: './discography-creator.component.html',
  styleUrls: ['./discography-creator.component.css'],
  imports: [ReactiveFormsModule, MatFormField, MatInput, MatIconButton, MatIcon, MatCheckbox],
})
export class DiscographyCreatorComponent implements AfterViewInit {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);

  discoForm = this.fb.group({
    artistId: [''],
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

  constructor() {
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

      this.adminService.getDiscography(artistId).subscribe(disco => {
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
