import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-advanced-filter',
  templateUrl: 'advanced-filter.html',
})
export class AdvancedFilterPage {
  metadataField
  metadataFields = [
    { "label": "Author", "value": "Author" },
    { "label": "Title", "value": "Title" },
    { "label": "Format", "value": "Format" },
    { "label": "Jurisdiction", "value": "Jurisdiction" },
    { "label": "Description", "value": "Description"},
    { "label": "Classification", "value": "DocClassification"},
    { "label": "Review Date", "value": "ReviewDate"},
    { "label": "Register Filing", "value": "RegisterFiling"},
    { "label": "Document Expiry", "value": "DocumentExpiry"},
    { "label": "Retention", "value": "Retention"},
    // { "label": "taxLevel0", "value": "Tax Level"}
  ]

  constructor(public navCtrl: NavController, public navParams: NavParams) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad AdvancedFilterPage');
  }

}
