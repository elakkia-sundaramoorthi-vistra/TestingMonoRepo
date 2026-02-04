import { Component } from '@angular/core';
import { IonicPage, ViewController } from 'ionic-angular';
import { SearchProvider } from '../../providers/search/search';

@IonicPage()
@Component({
  selector: 'page-document-preview',
  templateUrl: 'document-preview.html',
})
export class DocumentPreviewPage {

  constructor(public searchProvider: SearchProvider, private viewCtrl: ViewController) {
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }
}
