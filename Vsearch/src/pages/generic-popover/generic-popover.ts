
import { ViewController } from 'ionic-angular';
import { Component } from '@angular/core';

import { UtilsProvider } from '../../providers/utils/utils';

@Component({
  selector: 'vistra-generic-popover',
  templateUrl: './generic-popover.html',
})
export class GenericPopoverComponent {
  items: Array<{ "icon": string, "value": string, "label": string }> = [];

  constructor(protected utils: UtilsProvider, private viewCtrl: ViewController) {
    this.items = this.utils.genericPopoverItems;
  }

  returnItem(itemValue) {
    this.viewCtrl.dismiss(itemValue);
  }

}
