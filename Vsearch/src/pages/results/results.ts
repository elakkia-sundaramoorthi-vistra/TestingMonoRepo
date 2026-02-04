import { AfterViewChecked, Component, ElementRef, ViewChild } from '@angular/core';
import {
  AlertController, IonicPage, PopoverController,
  // NavController,
  ToastController, ViewController
} from 'ionic-angular';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { ApiSettingsProvider } from '../../providers/api-settings/api-settings';
import { UtilsProvider } from '../../providers/utils/utils';
import { SEARCH_RESULT, SearchProvider, SORT_ORDER } from '../../providers/search/search';
import { FilteringPanelPage } from '../filtering-panel/filtering-panel';
import { GenericPopoverComponent } from '../generic-popover/generic-popover';
import { DocumentPreviewPage } from '../document-preview/document-preview';
import { PaginationInstance } from 'ngx-pagination';

@IonicPage()
@Component({
  selector: 'page-results',
  templateUrl: 'results.html',
})
export class ResultsPage implements AfterViewChecked {
  @ViewChild('resultsPanel') resultsPanel: ElementRef;
  @ViewChild('resultsPanelInner') resultsPanelInner: ElementRef;
  @ViewChild('summaryPanel') summaryPanel: ElementRef;
  @ViewChild('filteringPanel') filteringPanel: ElementRef;
  @ViewChild('filteringPanelInner') filteringPanelInner: ElementRef;
  @ViewChild('header') header: ElementRef;
  @ViewChild('footer') footer: ElementRef;
  @ViewChild('containerGrid') containerGrid: ElementRef;
  @ViewChild('ionContent') ionContent;
  results = [];
  pagination = [];
  paginationSettings: PaginationInstance;
  pages = [];
  placeholders = [];
  filterForm: FormGroup;
  dateCreatedStart;
  dateCreatedEnd;
  showSortingSpinner;
  sortingTitle = "";
  showPreview: boolean = false;
  showSmallScreenPreview: boolean = false;

  constructor(
              private alertCtrl: AlertController,
              public apiSettingsProvider: ApiSettingsProvider,
              private domSanitizer: DomSanitizer,
              private formBuilder: FormBuilder,
              // private navCtrl: NavController,
              private popoverCtrl: PopoverController,
              public  searchProvider: SearchProvider,
              private  toastCtrl: ToastController,
    private utils: UtilsProvider) {
    this.setupPlaceholderArray();
    this.setupPagination();
    this.filterForm = this.formBuilder.group({
      createdByMe: [ false, ],
      createdByOthers: [ false, ],
      createdLastSixMonths: [ false, ],
      createdLastYear: [ false, ],
      dateCreatedRange: [ false, ],
      modifiedLastSixMonths: [ false, ],
      modifiedLastYear: [ false, ],
      dateModifiedRange: [ false, ],
      dmsSharepoint: [ false, ],
      dmsIManage: [ false, ],
      dmsVEnterprise: [ false, ],
      dmsVPoint: [ false, ],
      dmsVForce: [ false, ],
      docTypeWord: [ false, ],
      docTypeExcel: [ false, ],
      docTypePowerpoint: [ false, ],
      docTypePdf: [ false, ],
    });
  }

  ngAfterViewChecked(): void {
    // this.adjustResultsPanelHeight();

    // this.setResultsPanelHeight();
    // this.setFilteringPanelHeight();
  }

  setupPagination() {
    this.paginationSettings = {
      itemsPerPage: this.apiSettingsProvider.pagination.resultsPerPage,
      currentPage: this.apiSettingsProvider.pagination.pageNumber,
      totalItems: this.apiSettingsProvider.pagination.totalItems - this.apiSettingsProvider.pagination.resultsPerPage
    }
  }

  /*
    ==========================
    Per-result accordion idea:
    ==========================
    * Add "expanded" field to each result object after fetching
    * In the displaying *ngFor, show a detailed version of the result item if "expanded" is not null
   */

  private setResultsPanelHeight() {
    let resultsPanelHeight: string;
    if (this.filteringPanelIsHidden()) {
      let footerTop = this.dropPxFromElementPosition(getComputedStyle(this.footer.nativeElement).getPropertyValue('top'));
      let footerHeight = this.dropPxFromElementPosition(getComputedStyle(this.footer.nativeElement).getPropertyValue('height'));
      resultsPanelHeight = (footerTop - footerHeight) + "px";
    } else {
      resultsPanelHeight = (this.filteringPanel.nativeElement.offsetHeight - this.summaryPanel.nativeElement.offsetHeight) + "px;";
      // this.resultsPanel.nativeElement.setAttribute('style', 'height:' + (this.filteringPanel.nativeElement.offsetHeight - this.summaryPanel.nativeElement.offsetHeight) + "px;");
      }
    this.resultsPanel.nativeElement.setAttribute('style', 'height:' + resultsPanelHeight);
  }

  private adjustResultsPanelHeight() {
    /* Backout code */
    let resultsPanelHeight = (this.containerGrid.nativeElement.offsetHeight) + "px;";
    this.resultsPanel.nativeElement.setAttribute('style', 'height:' + resultsPanelHeight);
    this.resultsPanelInner.nativeElement.setAttribute('style', 'flex-grow: 1');

    /* this.summaryPanel.nativeElement.setAttribute("style", 'margin-bottom:' + 'auto;')
    this.summaryPanel.nativeElement.setAttribute("style", 'margin-top:' + 'auto;') */
    /* Backout code */
    //let resultsPanelHeight = (this.containerGrid.nativeElement.offsetHeight) + "px;";

    /* CURRENTLY EXPLORING THIS FOR THICK BOTTOM BARs
    this.summaryPanel.nativeElement.setAttribute('style', 'height:' + "15% !important");
    let resultsPanelHeight = (this.filteringPanel.nativeElement.offsetHeight - this.summaryPanel.nativeElement.offsetHeight) + "px;";
    this.resultsPanelInner.nativeElement.setAttribute('style', 'height:' + (this.filteringPanelInner.nativeElement.offsetHeight - this.summaryPanel.nativeElement.offsetHeight) + "px"); */

    //this.summaryPanel.nativeElement.setAttribute('style', 'bottom:' + getComputedStyle(this.filteringPanel.nativeElement).getPropertyValue('bottom'));
    /* let resultsPanelHeight: string;
    if (this.filteringPanelIsHidden()) {
      resultsPanelHeight = (this.dropPxFromElementPosition(getComputedStyle(this.resultsPanel.nativeElement).getPropertyValue('height')) - this.summaryPanel.nativeElement.offsetHeight) + "px;";
      console.log("Results panel height (no filtering panel):", resultsPanelHeight);
    } else {
      resultsPanelHeight = (this.filteringPanel.nativeElement.offsetHeight - this.summaryPanel.nativeElement.offsetHeight) + "px;";
      console.log("Results panel height (with filtering panel):", resultsPanelHeight);
    }
    this.resultsPanel.nativeElement.setAttribute('style', 'height:' + resultsPanelHeight); */
  }

  downloadFile(downloadUrl: string) {
    //downloadUrl = "https://vistradev.sharepoint.com/sites/VSearch/Shared%20Documents/GDPR/2020/GDPR%20Mail_16th%20July%20to%2015th%20August%202020.pdf";
    if(downloadUrl && this.isValidHttpUrl(downloadUrl)) {
      this.searchProvider.downloadFile(downloadUrl)
        .then((response: any) => {
          let dataType = response.type;
          if(dataType.toLowerCase().includes("html")) {
            console.error("Document is HTML. Skipping download...");
            this.showToast("Please verify that you have permission to access this document.", 3000, "error-toast");
          } else{
            let binaryData = [];
            binaryData.push(response);
            let downloadLink = document.createElement('a');
            downloadLink.href = window.URL.createObjectURL(new Blob(binaryData, {type: dataType}));
            downloadLink.setAttribute('download', downloadUrl);
            document.body.appendChild(downloadLink);
            downloadLink.click();
            window.URL.revokeObjectURL(downloadLink.href);
            downloadLink.remove();
          }
        })
        .catch(err => {
        console.error("Download error:", err)
        this.showToast("Unknown error downloading document", 3000, "error-toast");
      })
    } else {
      this.showToast("Document download URL not valid", 3000, "error-toast");
    }
  }

  isValidHttpUrl(str: string) {
    let url;

    try {
      url = new URL(str);
    } catch (_) {
      return false;
    }

    return url.protocol === "http:" || url.protocol === "https:";
  }

  private setFilteringPanelHeight() {
    let resultsPanelHeight: string;
    let footerTop = this.dropPxFromElementPosition(getComputedStyle(this.footer.nativeElement).getPropertyValue('top'));
    let headerHeight = this.dropPxFromElementPosition(getComputedStyle(this.header.nativeElement).getPropertyValue('height'));
    let gridPadding = this.dropPxFromElementPosition(getComputedStyle(this.containerGrid.nativeElement).getPropertyValue('padding'));
    let contentHeight = this.ionContent.contentHeight;
    let footerHeight = this.dropPxFromElementPosition(getComputedStyle(this.footer.nativeElement).getPropertyValue('height'));
    resultsPanelHeight = (contentHeight - footerHeight - headerHeight - gridPadding) + "px";
    if (!this.filteringPanelIsHidden()) {
      // this.filteringPanel.nativeElement.setAttribute('style', 'height:' + (contentHeight - footerHeight - headerHeight - gridPadding) + "px");
      this.filteringPanel.nativeElement.setAttribute('style', 'height:' + (contentHeight - (footerHeight / 2)) + "px");
    }
    let resultPanelheight = this.dropPxFromElementPosition(getComputedStyle(this.resultsPanel.nativeElement).getPropertyValue('height'));
    let summaryPanelheight = this.dropPxFromElementPosition(getComputedStyle(this.summaryPanel.nativeElement).getPropertyValue('height'));
    this.resultsPanel.nativeElement.setAttribute('style', 'height:' + (contentHeight - (footerHeight / 2) - summaryPanelheight) + "px");
  }

  private dropPxFromElementPosition(position) {
    return position.split("px")[0];
  }

  private filteringPanelIsHidden() {
    return getComputedStyle(this.filteringPanel.nativeElement).getPropertyValue('display') == "none";
  }

  private setupPlaceholderArray() {
    if (this.searchProvider.results.length < 8) {
      let numberOfPlaceholders = 8 - this.searchProvider.results.length;
      this.placeholders = Array(numberOfPlaceholders).fill(0).map((x, i) => i);
    }
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

  applyFilters(sortOrder?: SORT_ORDER) {
    if(sortOrder) {
      this.applySortOrder(sortOrder);
    }
    this.searchProvider.filter()
      .then(data => {
        this.searchProvider.results = data["list"].entries;
        this.searchProvider.results.forEach((result) => {
          result.expanded = false;
        })
        this.searchProvider.pagination = data["list"].pagination;
        this.searchProvider.setupPagination();
        this.resetSpinners();
      })
      .catch(err => {
        console.error("Error applying filters:", err);
        this.resetSpinners();
      });
  }


  applyElasticSearchFilters(pageNumber: number = 1) {
    //this.apiSettingsProvider.pagination.from = 0;
    this.apiSettingsProvider.pagination.pageNumber = pageNumber;
    if(this.apiSettingsProvider.pagination.pageNumber == 1){
      this.apiSettingsProvider.pagination.from = 0;
    }
    if (this.searchProvider.searchKeyword.length > 0) {
      this.searchProvider.elasticSearch()
        .then(data => {
          this.searchProvider.results = this.searchProvider.extractElasticSearchResults(data["hits"].hits);
          this.searchProvider.results.forEach(hit => {console.log("Rendition:", hit["renditionData"])});
          this.searchProvider.pagination.totalItems = data["hits"].total.value;
          this.apiSettingsProvider.pagination.totalItems = data["hits"].total.value;
          this.searchProvider.pagination.count = this.searchProvider.results.length;
          this.searchProvider.resetPagination();
          this.searchProvider.setupElasticPagination();
        })
        .catch(err => {
          console.error("Error performing elastic", err);
      })
    }
  }
  applySortOrder(sortOrder: SORT_ORDER) {
    this.searchProvider.sortingSettings.order = sortOrder;
    this.searchProvider.sortingSettings.iconName = "";
    this.showSortingSpinner = true;
    switch(this.searchProvider.sortingSettings.order) {
      case SORT_ORDER.AUTHOR_ASCENDING:
        this.searchProvider.sortingSettings.title = "author";
        this.searchProvider.sortingSettings.iconName = "md-arrow-dropup";
        break;
      case SORT_ORDER.AUTHOR_DESCENDING:
        this.searchProvider.sortingSettings.title = "author";
        this.searchProvider.sortingSettings.iconName = "md-arrow-dropdown";
        break;
      case SORT_ORDER.NEWEST_FIRST:
        this.searchProvider.sortingSettings.title = "newest first";
        break;
      case SORT_ORDER.OLDEST_FIRST:
        this.searchProvider.sortingSettings.title = "oldest first";
        break;
      default:
        this.searchProvider.sortingSettings.title = "";
    }
  }

  resetSpinners() {
      this.showSortingSpinner = false;
  }

  search(keyword: string) {
    this.searchProvider.searchKeyword = keyword;
    if(this.searchProvider.targetSystem == "ALFRESCO") {
      this.applyFilters(SORT_ORDER.NEWEST_FIRST);
    }
    if(this.searchProvider.targetSystem == "ELASTIC") {
      this.apiSettingsProvider.pagination.from = 0;
      this.applyElasticSearchFilters();
    }
  }

  initialiseFilters() {
    this.apiSettingsProvider.filteringCriteria = this.apiSettingsProvider.getInitialFilteringState();
    if(this.searchProvider.targetSystem == "ALFRESCO") {
      this.applyFilters(SORT_ORDER.NEWEST_FIRST);
    }
    if(this.searchProvider.targetSystem == "ELASTIC") {
      this.applyElasticSearchFilters();
    }
  }

  presentDocumentPopover(event, document: SEARCH_RESULT, deviceSize: string) {
    this.utils.genericPopoverItems = [
      { "value": "open", "label": "Open", "icon": null },
      { "value": "copy", "label": "Copy Link", "icon": null },
      { "value": "download", "label": "Download", "icon": null },
      { "value": "downloadtest", "label": "Download (test)", "icon": null },
    ];
    switch(deviceSize) {
      case "small":
        this.utils.genericPopoverItems.push({ "value": "overlay", "label": "More details...", "icon": null });
        break;
      case "large":
        this.utils.genericPopoverItems.push({ "value": "preview", "label": "More details...", "icon": null });
    }
    this.utils.genericPopoverHeader = "Options";
    const popover = this.popoverCtrl.create(
      GenericPopoverComponent,
                                            {
                                              "items": this.utils.genericPopoverItems
                                            });
    popover.onDidDismiss(selectedItemValue => {
      if(selectedItemValue) {
        switch(selectedItemValue) {
          case "open":
            this.openDocument(document.documentUrl);
            break;
          case "copy":
            this.copyDocumentLink(document.documentUrl);
            break;
          case "preview":
            this.revealDocumentPreview(document);
            break;
          case "overlay":
            this.presentSmallScreenPreview(document);
            break;
          case "download":
            this.downloadFile(document.downloadUrl);
            break;
          case "downloadtest":
            this.downloadFile("https://vistravforce--devpadvp02.my.salesforce.com/img/logo214.svg");
            break;
        }
      }
    });
    popover.present({ev: event});
  }

  openDocument(url: string){
    window.open(url, "_blank");
  }

  downloadDocument(url: string) {
    /* From Chitra:
      the FullUrl field has the link for download..
      your href should be mapped to that value from that field so that even it opens a new tab,
      it will trigger automatic download
    */
    this.searchProvider.downloadDocument(url)
    .then(file => {
      console.log("Blob:", file);
    })
  }

  revealDocumentPreview(document: SEARCH_RESULT) {
    this.showPreview = true;
    this.searchProvider.selectedDocument = document;
  }

  presentSmallScreenPreview(document: SEARCH_RESULT) {
    this.searchProvider.selectedDocument = document;
    const popover = this.popoverCtrl.create(
      DocumentPreviewPage, {}, { cssClass: "filtering-popover"});
    popover.onDidDismiss(() => {
      this.showSmallScreenPreview = false;
    });
    popover.present();
  }

  closeDocumentPreview() {
    this.showPreview = false;
  }

  copyDocumentLink(link: string) {
    let thiz = this;
    let nav: any = navigator; // Workaround for typings related build error when using directly
    nav.clipboard.writeText(link)
    .then(function() {
      thiz.showToast("Copied to clipboard!", 3000);
    }, function() {
      thiz.showToast("Could not write to clipboard!", 3000);
    })
  }

  presentFilteringPopover() {
    const popover = this.popoverCtrl.create(
      FilteringPanelPage, {}, { cssClass: "filtering-popover"});
    popover.onDidDismiss(selectedItemValue => {
      if(selectedItemValue) {
        switch(true) {
          case ((selectedItemValue.action == "applyFilters") && (this.searchProvider.targetSystem == "ALFRESCO") ):
            this.applyFilters()
            break;
          case ((selectedItemValue.action == "applyFilters") && (this.searchProvider.targetSystem == "ELASTIC") ):
            this.applyElasticSearchFilters();
            break;
          case (selectedItemValue.action == "resetFilters"):
            this.initialiseFilters();
            break;
        }
      }
    });
    popover.present();
  }

  presentPreviewAlert(event, document) {
    let base64Html = this.domSanitizer.bypassSecurityTrustHtml('<img [src]="data:image/png;base64, "' +  document.previewBase64)  + ' alt="Document preview" />';
    //let base64Url = this.domSanitizer.bypassSecurityTrustResourceUrl("data:image/png;base64," + document.previewBase64);
    let alert = this.alertCtrl.create({
      title: 'Document preview',
      // subTitle: '10% of battery remaining',
      //message: "<img src='https://via.placeholder.com/150' />",
      message: "<img [src]='result.previewBase64[0] | sanitizeBase64Url' />",
     // message:'<img [src]="data:image/png;base64, " ' + base64Url  + ' alt="Document preview" />',
     // message: base64Html,
      //message: '<ngx-doc-viewer [url]="' + documentUrl + '" viewer="google" style="width:100%;height:50vh;" ></ngx-doc-viewer>',
      buttons: [
        {
          text: 'Return to search results',
          role: 'cancel',
          handler: () => { }
        },
        {
          text: 'Open document',
          cssClass: "default-button",
          handler: () => { }
        }
      ],
      cssClass: "document-preview"
    });
    alert.present({ ev: event });
    event.stopPropagation();
  }

  presentThumbnailPopover(event, document) {
    if(document.previewBase64.length > 0) {
      this.searchProvider.selectedDocument = document;
      let popover = this.popoverCtrl.create(ThumbnailPopoverPage);
      popover.onDidDismiss(selectedOption => {
        switch(selectedOption) {
          case ("open"):
            this.openDocument(document.documentUrl);
            break;
        }
      });
      popover.present({ev: event});
    }
  }

  pageChanged(newPageNumber: number) {
    this.searchProvider.setElasticSearchPageStart(newPageNumber);
    this.applyElasticSearchFilters(newPageNumber);
  }

  pageBoundsChanged(closestValidPage: number) {
    this.applyElasticSearchFilters(closestValidPage);
  }

  goToNextPage() {
    switch (this.searchProvider.targetSystem) {
      case "ALFRESCO":
        if(this.searchProvider.pagination.hasMoreItems) {
          this.searchProvider.paginationSettings.direction = 'next';
          this.searchProvider.paginationSettings.pageNumber++;
        }
        break;
      case "ELASTIC":
        if(this.apiSettingsProvider.pagination.pageNumber < this.apiSettingsProvider.pagination.pages.length) {
          this.apiSettingsProvider.pagination.pageNumber++;
          this.searchProvider.setElasticSearchPageStart(this.apiSettingsProvider.pagination.pageNumber);
          this.setLeftFloatingStart();
          this.applyElasticSearchFilters(this.apiSettingsProvider.pagination.pageNumber);
        }
        break;
    }
  }

  goToPreviousPage() {
    switch (this.searchProvider.targetSystem) {
      case "ALFRESCO":
        if(this.searchProvider.pagination.skipCount > 0) {
          this.searchProvider.paginationSettings.direction = 'prev';
          this.searchProvider.paginationSettings.pageNumber--;
          this.applyFilters();
        }
        break;
      case "ELASTIC":
        if(this.apiSettingsProvider.pagination.from > 0) {
          this.apiSettingsProvider.pagination.pageNumber--;
          this.searchProvider.setElasticSearchPageStart(this.apiSettingsProvider.pagination.pageNumber);
          this.setLeftFloatingStart();
          this.applyElasticSearchFilters(this.apiSettingsProvider.pagination.pageNumber);
        }
        break;
    }
  }

  goToPage(pageNumber: number) {
    switch (this.searchProvider.targetSystem) {
      case "ALFRESCO":
        this.searchProvider.paginationSettings.direction = 'skipToPage';
        this.searchProvider.paginationSettings.pageNumber = pageNumber;
        this.applyFilters();
        break;
      case "ELASTIC":
        this.apiSettingsProvider.pagination.pageNumber = pageNumber;
        this.setLeftFloatingStart();
        this.searchProvider.setElasticSearchPageStart(this.apiSettingsProvider.pagination.pageNumber)
        this.applyElasticSearchFilters(pageNumber);
        break;
    }
  }

  setLeftFloatingStart() {
    if(this.apiSettingsProvider.pagination.pageNumber == 1) {
      this.apiSettingsProvider.pagination.floatingStart = 4;
    } else {
      if(this.apiSettingsProvider.pagination.pageNumber == this.apiSettingsProvider.pagination.pages.length) {
        this.apiSettingsProvider.pagination.floatingStart = this.apiSettingsProvider.pagination.pages.length - 4;
        } else {
        this.apiSettingsProvider.pagination.floatingStart = this.apiSettingsProvider.pagination.pageNumber - 2;
      }
    }
  }

  setRightFloatingStart() {
    if(this.apiSettingsProvider.pagination.pageNumber == 1) {
      this.apiSettingsProvider.pagination.floatingStart = 4;
    } else {
      if(this.apiSettingsProvider.pagination.pageNumber == this.apiSettingsProvider.pagination.pages.length) {
        this.apiSettingsProvider.pagination.floatingStart = this.apiSettingsProvider.pagination.pages.length - 4;
       } else {
        this.apiSettingsProvider.pagination.floatingStart = this.apiSettingsProvider.pagination.pageNumber - 2;
      }
    }
  }

  presentSortingPopover(event) {
    this.searchProvider.setElasticSearchPageStart(0);
    this.utils.genericPopoverItems = [
      { "value": SORT_ORDER.NEWEST_FIRST, "label": "Most recent first", "icon": null },
      { "value": SORT_ORDER.OLDEST_FIRST, "label": "Oldest first", "icon": null },
      { "value": SORT_ORDER.AUTHOR_ASCENDING, "label": "By author — A-Z", "icon": null },
      { "value": SORT_ORDER.AUTHOR_DESCENDING, "label": "By author — Z-A", "icon": null },
    ];
    this.utils.genericPopoverHeader = "Sort results";
    const popover = this.popoverCtrl.create(
      GenericPopoverComponent,
                                            {
                                              "items": this.utils.genericPopoverItems
                                            });
    popover.onDidDismiss(selectedItemValue => {
      if(selectedItemValue) {
        switch(selectedItemValue) {
          case SORT_ORDER.NEWEST_FIRST:
            this.searchProvider.sortingSettings.order = SORT_ORDER.NEWEST_FIRST;
            //this.applyFilters(SORT_ORDER.NEWEST_FIRST)
            this.applyElasticSearchFilters();
            break;
          case SORT_ORDER.OLDEST_FIRST:
            this.searchProvider.sortingSettings.order = SORT_ORDER.OLDEST_FIRST;
            //this.applyFilters(SORT_ORDER.OLDEST_FIRST);
            this.applyElasticSearchFilters();
            break;
          case SORT_ORDER.AUTHOR_ASCENDING:
            this.searchProvider.sortingSettings.order = SORT_ORDER.AUTHOR_ASCENDING;
            //this.applyFilters(SORT_ORDER.AUTHOR_ASCENDING);
            this.applyElasticSearchFilters();
            break;
          case SORT_ORDER.AUTHOR_DESCENDING:
            this.searchProvider.sortingSettings.order = SORT_ORDER.AUTHOR_DESCENDING;
            //this.applyFilters(SORT_ORDER.AUTHOR_DESCENDING);
            this.applyElasticSearchFilters();
            break;
          default:
            break;
        }
      }
    });
    popover.present({ev: event});
  }

  presentResultsPerPagePopover(event) {
    this.utils.genericPopoverItems = [
      { "value": '10', "label": "10", "icon": null },
      { "value": '20', "label": "20", "icon": null },
      { "value": '30', "label": "30", "icon": null },
    ];
    this.utils.genericPopoverHeader = "Results per page";
    const popover = this.popoverCtrl.create(
      GenericPopoverComponent,
                                            {
                                              "items": this.utils.genericPopoverItems
                                            });
    popover.onDidDismiss(selectedItemValue => {
      if(selectedItemValue) {
        this.searchProvider.resetPagination();
        switch (this.searchProvider.targetSystem) {
          case "ELASTIC":
            this.apiSettingsProvider.pagination.resultsPerPage = selectedItemValue;
            this.searchProvider.setElasticSearchPageStart(0);
            this.apiSettingsProvider.pagination.from = 0;
            this.applyElasticSearchFilters();
            break;
          case "ALFRESCO":
            this.searchProvider.paginationSettings.resultsPerPage = selectedItemValue;
            this.applyFilters();
            break;
          default:
            break;
        }
      }
    });
    popover.present({ev: event});
  }

  /* goToHomePage() {
    this.navCtrl.push("HomePage");
  } */

  setElasticResusltsPerPage() {}
  seAlfrescoResusltsPerPage() {}

}

@Component({
  template: `
    <ion-list>
      <ion-note>{{ searchProvider.selectedDocument.title}}</ion-note>
      <ion-item>
        <img [src]="searchProvider.selectedDocument.previewBase64[0] | sanitizeBase64Url" style="width: 100%;">
      </ion-item>
      <ion-item>
        <button ion-button outline small (click)="exit()">Close</button>
        <button ion-button small (click)="open()">Open document</button>
      </ion-item>
    </ion-list>
  `
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
