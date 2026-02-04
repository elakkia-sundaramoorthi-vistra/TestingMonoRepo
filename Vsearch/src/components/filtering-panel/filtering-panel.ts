import { AdvancedFilterPage } from './../../pages/advanced-filter/advanced-filter';
import { SearchProvider } from './../../providers/search/search';
import { Component, EventEmitter, Output } from '@angular/core';
import { AlertController, PopoverController, ToastController } from 'ionic-angular';
import { DateRangePopupPage } from '../../pages/date-range-popup/date-range-popup';

import { ApiSettingsProvider } from '../../providers/api-settings/api-settings';
import { UtilsProvider } from '../../providers/utils/utils';
import { GenericPopoverComponent } from '../../pages/generic-popover/generic-popover';

@Component({
  selector: 'filtering-panel',
  templateUrl: 'filtering-panel.html'
})
export class FilteringPanelComponent {
  @Output() resetFilters: EventEmitter<any> = new EventEmitter<any>();
  @Output() applyFilters: EventEmitter<any> = new EventEmitter<any>();
  @Output() applyAdvancedFilters: EventEmitter<any> = new EventEmitter<any>();
  @Output() selectAllFilters: EventEmitter<any> = new EventEmitter<any>();
  filterGroupToggle = {
    author: {show: true},
    dateCreated: {show: true},
    dateModified: {show: true},
    application: {show: true},
    documentType: { show: true },
    customDateRange: { show: true}
  }
  dateCreatedRangeSelected: boolean = false;
  dateModifiedRangeSelected: boolean = false;
  dateInputMask = [/\d/, /\d/, '/', /\d/, /\d/, '/', /\d/, /\d/, /\d/, /\d/];

  constructor(
    private alertCtrl: AlertController,
    public apiSettingsProvider: ApiSettingsProvider,
    private popoverCtrl: PopoverController,
    protected searchProvider: SearchProvider,
    private toastCtrl: ToastController,
    private utils: UtilsProvider) { }

  emitApplyFilters() {
    this.applyFilters.emit();
  }

  emitApplyAdvancedFilters() {
    this.applyAdvancedFilters.emit();
  }

  emitSelectAllFilters() {
    this.selectAllFilters.emit();
  }

  onChange($event) {
    console.log($event);
  }

  emitApplyFiltersForDateCreatedRange(event) {
    this.apiSettingsProvider.filteringCriteria.dateCreatedRangeStart = new Date(event.start).toISOString();
    this.apiSettingsProvider.filteringCriteria.dateCreatedRangeEnd = new Date(event.end).toISOString();
    if ((this.apiSettingsProvider.filteringCriteria.dateCreatedRangeStart == null) || (this.apiSettingsProvider.filteringCriteria.dateCreatedRangeEnd == null)) {
    } else {
      if(this.isDateRangeValid(event.start, event.end)) {
        this.applyFilters.emit();
      } else {
        this.showToast("Start date cannot be greater than end date", 3000, "error-toast");
        }
    }
  }

  emitApplyFiltersToClearDateCreatedRange(toggle) {   
    if (this.apiSettingsProvider.filteringCriteria.dateCreatedRange) {
      this.presentDateRangePopover(toggle, "dateCreated");
    } else {
      this.emitApplyFilters()
    }
  }

  emitApplyFiltersToClearDateModifiedRange(toggle) {
    if (this.apiSettingsProvider.filteringCriteria.dateModifiedRange) {
      this.presentDateRangePopover(toggle, "dateModified");
    } else {
      this.emitApplyFilters()
    }
  }

  /**
   * Timezone thoughts:
   * Apply specific timezone: https://stackoverflow.com/a/54127122/941991
  */

  presentDateRangePopover(event: any, rangeName: string) {
    let cssClass = "date-range-popover-content";
    if(this.utils.isIe11) {
      cssClass = "date-range-popover-content-ie11";
    }
    const popover = this.popoverCtrl.create(DateRangePopupPage, {}, {cssClass: cssClass});
    popover.onDidDismiss(data => {
      if((data != null) && (data.fn == "applyFilters")) {
        let start = new Date(data.start.substring(0, 4), (Number(data.start.substring(5, 7)) - 1), data.start.substring(8, 10));
        let end = new Date(data.end.substring(0, 4), Number(data.end.substring(5, 7) - 1), data.end.substring(8, 10));
        // this.searchProvider.dateModifiedLabel = rangeName == "dateCreated"?data.start + " — " + data.end:"";
        /* TODO: Make date range label formats consistent! */
        switch (rangeName) {
          case "dateModified":
            this.apiSettingsProvider.filteringCriteria.dateModifiedRangeStart = (start).toISOString();
            this.apiSettingsProvider.filteringCriteria.dateModifiedRangeEnd = end.toISOString();
            this.searchProvider.dateModifiedLabel = data.start.substring(8, 10) + "-" + data.start.substring(5, 7) + "-" +data.start.substring(0, 4) + " — " + data.end.substring(8, 10) + "-" + data.end.substring(5, 7) + "-" +data.end.substring(0, 4);
            // this.dateModifiedLabel = this.apiSettingsProvider.filteringCriteria.dateCreatedRangeStart.substring(0, 4) + "-" + this.apiSettingsProvider.filteringCriteria.dateCreatedRangeStart.substring(5, 7) + "-" + this.apiSettingsProvider.filteringCriteria.dateCreatedRangeStart.substring(8, 10) + "—>" + this.apiSettingsProvider.filteringCriteria.dateCreatedRangeEnd.substring(0, 4) + "-" + this.apiSettingsProvider.filteringCriteria.dateCreatedRangeEnd.substring(5, 7) + "-" + this.apiSettingsProvider.filteringCriteria.dateCreatedRangeEnd.substring(8, 10);
            break;
          case "dateCreated":
            this.apiSettingsProvider.filteringCriteria.dateCreatedRangeStart = (start).toISOString();
            this.apiSettingsProvider.filteringCriteria.dateCreatedRangeEnd = end.toISOString();
            this.searchProvider.dateCreatedLabel = data.start.substring(8, 10) + "-" + data.start.substring(5, 7) + "-" +data.start.substring(0, 4) + " — " + data.end.substring(8, 10) + "-" + data.end.substring(5, 7) + "-" +data.end.substring(0, 4);
            // this.dateCreatedLabel = this.apiSettingsProvider.filteringCriteria.dateCreatedRangeStart.substring(0, 4) + "-" + this.apiSettingsProvider.filteringCriteria.dateCreatedRangeStart.substring(5, 7) + "-" + this.apiSettingsProvider.filteringCriteria.dateCreatedRangeStart.substring(8, 10) + "—>" + this.apiSettingsProvider.filteringCriteria.dateCreatedRangeEnd.substring(0, 4) + "-" + this.apiSettingsProvider.filteringCriteria.dateCreatedRangeEnd.substring(5, 7) + "-" + this.apiSettingsProvider.filteringCriteria.dateCreatedRangeEnd.substring(8, 10);
            break;
        }
        this.emitApplyFilters()
      } else {
        switch (rangeName) {
          case "dateModified":
            this.apiSettingsProvider.filteringCriteria.dateModifiedRange = false;
            break;
          case "dateCreated":
            this.apiSettingsProvider.filteringCriteria.dateCreatedRange = false;
            break;
        }
      }
    });
    popover.present({ ev: event });
  }

  clearAdvancedFilter() {
    this.apiSettingsProvider.filteringCriteria.customFilter = false;
    this.apiSettingsProvider.filteringCriteria.customFilterFieldName = "";
    this.apiSettingsProvider.filteringCriteria.customFilterFieldValue = "";
    this.applyFilters.emit();
  }

  emitApplyFiltersForDateModifiedRange(event) {
    this.apiSettingsProvider.filteringCriteria.dateModifiedRangeStart = new Date(event.start).toISOString();
    this.apiSettingsProvider.filteringCriteria.dateModifiedRangeEnd = new Date(event.end).toISOString();
    if ((this.apiSettingsProvider.filteringCriteria.dateModifiedRangeStart == null) || (this.apiSettingsProvider.filteringCriteria.dateModifiedRangeEnd == null)) {
    } else {
      if(this.isDateRangeValid(event.start, event.end)) {
        this.applyFilters.emit();
      } else {
        this.showToast("Start date cannot be greater than end date", 3000, "error-toast");
         }
    }
  }

  isDateRangeValid(startDate: string, endDate: string): boolean {
    let isValid = false;
    let start = new Date(startDate);
    let end = new Date(endDate);
    if (start.getTime() > end.getTime()) {
      isValid = false;
    } else {
      isValid = true;
    }
    return isValid;
  }

  showToast(message: string, duration: number = 0, cssClass: string = "default-toast", position = "middle") {
    let toastOptions = {
      message: message,
      position: position,
      cssClass: cssClass
    };
    if(duration > 0) {
      toastOptions["duration"] = duration;
    }
    const toast = this.toastCtrl.create(toastOptions);
    toast.present();
  }

  emitResetFilters() {
    this.resetFilters.emit();
  }

  toggleGroup(groupName: "documentType" | "author" | "dateCreated" | "dateModified" | "application"|"customDateRange") {
    switch (groupName) {
      case 'author':
        this.filterGroupToggle[groupName].show = !this.filterGroupToggle.author.show;
        break;
      case 'dateCreated':
        this.filterGroupToggle[groupName].show = !this.filterGroupToggle.dateCreated.show;
        break;
      case 'dateModified':
        this.filterGroupToggle[groupName].show = !this.filterGroupToggle.dateModified.show;
        break;
      case 'application':
        this.filterGroupToggle[groupName].show = !this.filterGroupToggle.application.show;
        break;
      case 'documentType':
        this.filterGroupToggle[groupName].show = !this.filterGroupToggle.documentType.show;
        break;
      case 'customDateRange':
        this.filterGroupToggle[groupName].show = !this.filterGroupToggle.customDateRange.show;
        break;
      default:
        break;
    }
  }
}
