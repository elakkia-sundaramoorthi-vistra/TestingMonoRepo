import { Component, EventEmitter, Output } from '@angular/core';
import { IonicPage, ViewController } from 'ionic-angular';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { UtilsProvider } from '../../providers/utils/utils';


@IonicPage()
@Component({
  selector: 'page-date-range-popup',
  templateUrl: 'date-range-popup.html',
})
export class DateRangePopupPage {
  @Output() applyFilters: EventEmitter<any> = new EventEmitter<any>();
  rangeForm: FormGroup;

  startYYYY: string = "";
  startMM:   string = "";
  startDD: string = "";
  endYYYY: string = "";
  endMM:   string = "";
  endDD: string = "";

  constructor(private formBuilder: FormBuilder, private viewCtrl: ViewController, protected utils: UtilsProvider) {
    this.rangeForm = this.formBuilder.group({
      startDD: [this.getCurrentDay(), [Validators.required,]],
      startMM: [this.getCurrentMonth(), [Validators.required,]],
      startYYYY: [this.getCurrentYear(), [Validators.required,]],
      endDD: [this.getCurrentDay(), [Validators.required,]],
      endMM: [this.getCurrentMonth(), [Validators.required,]],
      endYYYY: [this.getCurrentYear(), [Validators.required,]],
    });
  }

  getCurrentYear() {
    return new Date().getFullYear();
  }

  getCurrentDay() {
    return this.addPadding(new Date().getUTCDate());
  }

  getCurrentMonth() {
    return this.addPadding(new Date().getMonth() + 1);
  }

  emitApplyFilters() {
    let start: string = this.addPadding(this.rangeForm.value.startYYYY) + "-" + this.addPadding(this.rangeForm.value.startMM) + "-" + this.addPadding(this.rangeForm.value.startDD);
    let end: string = this.addPadding(this.rangeForm.value.endYYYY) + "-" + this.addPadding(this.rangeForm.value.endMM) + "-" + this.addPadding(this.rangeForm.value.endDD);
    // this.applyFilters.emit({start: start, end: end});
    this.viewCtrl.dismiss({ fn: "applyFilters", start: start, end: end});
  }

  addPadding(num: number) {
    if (num < 10) {
      return "0" + parseInt(num + "");
    } else {
      return "" + num;
    }
  }

  exit(itemValue) {
    this.viewCtrl.dismiss(itemValue);
  }
}
