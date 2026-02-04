import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { ViewController } from 'ionic-angular';
import { SearchProvider } from '../../providers/search/search';
import { UtilsProvider } from '../../providers/utils/utils';

@IonicPage()
@Component({
  selector: 'page-sorting-popover',
  templateUrl: 'sorting-popover.html',
})
export class SortingPopoverPage {
  items: Array<{ "icon": string, "value": string, "label": string }> = [];

  constructor(protected utils: UtilsProvider, private viewCtrl: ViewController,  public searchProvider: SearchProvider) {
    this.items = this.utils.genericPopoverItems;
    
  }

  returnItem(itemValue) {
    this.viewCtrl.dismiss(itemValue);
  }

}
