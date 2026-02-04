import { Component } from '@angular/core';
import { IonicPage, ViewController } from 'ionic-angular';
import { SearchProvider } from '../../providers/search/search';

@IonicPage()
@Component({
  selector: 'page-thumbnail-popover',
  templateUrl: 'thumbnail-popover.html',
})
export class ThumbnailPopoverPage {
  constructor(public viewCtrl: ViewController, public  searchProvider: SearchProvider) {}

  open() {
    this.viewCtrl.dismiss("open");
  }

  exit() {
    this.viewCtrl.dismiss();
  }
}
