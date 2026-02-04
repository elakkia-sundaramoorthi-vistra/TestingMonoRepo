import { Component } from '@angular/core';
import { IonicPage } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-error',
  templateUrl: 'error.html',
})
export class ErrorPage {

  constructor() {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ErrorPage');
  }

}
