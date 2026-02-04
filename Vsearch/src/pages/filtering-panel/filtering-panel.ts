import { Component } from '@angular/core';
import { IonicPage, ViewController } from 'ionic-angular';
import { SearchProvider } from '../../providers/search/search';

@IonicPage()
@Component({
  selector: 'page-filtering-panel',
  templateUrl: 'filtering-panel.html',
})
export class FilteringPanelPage {

  constructor(public searchProvider: SearchProvider, private viewCtrl: ViewController) { }

  dismiss(action: string) {
    this.viewCtrl.dismiss({ "action": action})
  }
}
