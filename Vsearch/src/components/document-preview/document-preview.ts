import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ViewController } from 'ionic-angular';
import { SearchProvider, SEARCH_RESULT } from '../../providers/search/search';

@Component({
  selector: 'document-preview',
  templateUrl: 'document-preview.html'
})
export class DocumentPreviewComponent {
  @Input() document: SEARCH_RESULT;
  @Output() closePreview: EventEmitter<any> = new EventEmitter<any>();

  constructor(protected searchProvider: SearchProvider, private viewCtrl: ViewController) { }

  close() {
    this.viewCtrl.dismiss();
  }

}
