import { SearchProvider } from './../../providers/search/search';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ApiSettingsProvider } from '../../providers/api-settings/api-settings';
import { UtilsProvider } from '../../providers/utils/utils';
import { PopoverController } from 'ionic-angular';
import { GenericPopoverComponent } from '../../pages/generic-popover/generic-popover';

@Component({
  selector: 'pagination',
  templateUrl: 'pagination.html'
})
export class PaginationComponent {
  @Output() goToNext: EventEmitter<any> = new EventEmitter<any>();
  @Output() goToPrevious: EventEmitter<any> = new EventEmitter<any>();
  @Output() goToPage: EventEmitter<any> = new EventEmitter<any>();
  @Output() goToLast: EventEmitter<any> = new EventEmitter<any>();
  @Output() goToFirst: EventEmitter<any> = new EventEmitter<any>();
  @Input() collapsedMode: false;
  moreResultsButtonLabel = "...";
  lastPage = 10;
  vsearchPaginationLogo = ['', 'V', 'S', 'e', 'a', 'r', 'c', 'h', '', ''];
  numberOfPages: number;

  constructor(public apiSettingsProvider: ApiSettingsProvider, private popoverCtrl: PopoverController, public searchProvider: SearchProvider, private utils: UtilsProvider) {
  }

  emitGoToNext() {
    this.goToNext.emit();
  }

  emitGoToPrevious() {
    this.goToPrevious.emit();
  }

  emitGoToFirst() {
    this.goToFirst.emit();
  }

  emitGoToLast() {
    this.goToLast.emit();
  }

  emitGoToPage(pageNumber: number) {
    this.goToPage.emit(pageNumber);
  }

  presentPageNumberPopover(event) {
    let items = [];
    this.apiSettingsProvider.pagination.allPages.forEach((element) => {
      items.push({ "value": element, "label": element, "icon": null });
    });
    this.utils.genericPopoverItems = items;
    this.utils.genericPopoverHeader = "Skip to page";
    const popover = this.popoverCtrl.create(GenericPopoverComponent);
    popover.onDidDismiss(selectedItemValue => {
      if(selectedItemValue) {
        //this.searchProvider.resetPagination();
        this.searchProvider.setElasticSearchPageStart(0);
        this.apiSettingsProvider.pagination.pageNumber = selectedItemValue;
        this.emitGoToPage(selectedItemValue);
      }
    });
    popover.present();
  }

}
