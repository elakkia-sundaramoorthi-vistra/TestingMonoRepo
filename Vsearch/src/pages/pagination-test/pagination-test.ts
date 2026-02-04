/*
To navigate to thish component: http://localhost:8100/#/pagination-test
 */

import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, PopoverController } from 'ionic-angular';
import { UtilsProvider } from '../../providers/utils/utils';

import { GenericPopoverComponent } from '../generic-popover/generic-popover';

@IonicPage()
@Component({
  selector: 'page-pagination-test',
  templateUrl: 'pagination-test.html',
})
export class PaginationTestPage {
  collection: any;
  p: number = 1;
  itemsPerPage = 10;
  totalItems: any;


  /* currentPage = 1;
  cumulativeTotal = 0;
  resultsPerPage = 10; */
  constructor(private http: HttpClient, private popoverCtrl: PopoverController, private utils: UtilsProvider) {
    /* for (let i = 0; i < 10; i++) {
      this.cumulativeTotal++;
      console.log(i + ". Adding:" + i + " of " + this.totalItems);
      this.collection.push(`item ${this.cumulativeTotal}`);
    } */
  }
  ngOnInit() {
this.getAllData();
  }

  getAllData() {
      const url = `https://api.instantwebtools.net/v1/passenger?page=${0}&size=${this.itemsPerPage}`;
      this.http.get(url).subscribe((data: any) => {
      this.collection =  data.data;
      this.totalItems = data.totalPassengers - this.itemsPerPage;
    })
  }

  getPage(page) {
    this.p = page;
    const url = `https://api.instantwebtools.net/v1/passenger?page=${page}&size=${this.itemsPerPage}`;
    this.http.get(url).subscribe((data: any) => {
      this.collection =  data.data;
      this.totalItems = data.totalPassengers - this.itemsPerPage;

    })
  }

  /* fetch(pageNumber: number) {
    this.currentPage = pageNumber;
    this.collection = [];
    for (let i = 0; i < 10; i++) {
      this.cumulativeTotal = this.currentPage + this.resultsPerPage;
      console.log(i + ". Adding:" + this.cumulativeTotal + " of " + this.totalItems);
      if (this.cumulativeTotal <= this.totalItems) {
        this.collection.push(`item ${this.cumulativeTotal}`);
      }
    }
  }
  fetchPageContent(pageNumber: number) {
    let pageContent = [];
    let from = (pageNumber -1) * this.resultsPerPage;
    for (let i = from; (i < this.resultsPerPage)  && (i < this.totalItems); i++) {
      pageContent.push(i);
    }
    console.log('pageContent from', from + ":", pageContent);
    this.collection = pageContent;
  } */

  presentResultsPerPagePopover(event) {
    this.utils.genericPopoverItems = [
      { "value": '10', "label": "10", "icon": null },
      { "value": '20', "label": "20", "icon": null },
      { "value": '30', "label": "30", "icon": null },
    ];
    this.utils.genericPopoverHeader = "Results per page";
    const popover = this.popoverCtrl.create(GenericPopoverComponent);
    popover.onDidDismiss(selectedItemValue => {
      if (selectedItemValue) {
        // this.resultsPerPage = selectedItemValue;
      }
    });
    popover.present({ev: event});
  }
}
