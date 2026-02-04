import { AfterViewChecked, Component, ElementRef, ViewChild } from '@angular/core';
import {
  AlertController, IonicPage, PopoverController,
  // NavController,
  ToastController, ViewController
} from 'ionic-angular';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { ApiSettingsProvider } from '../../providers/api-settings/api-settings';
import { UtilsProvider } from '../../providers/utils/utils';
import { SEARCH_RESULT, SearchProvider, SORT_ORDER } from '../../providers/search/search';
import { FilteringPanelPage } from '../filtering-panel/filtering-panel';
import { GenericPopoverComponent } from '../generic-popover/generic-popover';
import { DocumentPreviewPage } from '../document-preview/document-preview';
import { PaginationInstance } from 'ngx-pagination';
import { ThumbnailPopoverPage } from '../thumbnail-popover/thumbnail-popover';
import { DocumentPreviewComponent } from '../../components/document-preview/document-preview';
import { SortingPopoverPage } from '../sorting-popover/sorting-popover';
import { AuthProvider } from '../../providers/auth/auth';

@IonicPage()
@Component({
  selector: 'page-search-results',
  templateUrl: 'search-results.html',
})
export class SearchResultsPage {
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
    private auth: AuthProvider,
    private domSanitizer: DomSanitizer,
    private formBuilder: FormBuilder,
    // private navCtrl: NavController,
    private router: Router,
    private popoverCtrl: PopoverController,
    public searchProvider: SearchProvider,
    private toastCtrl: ToastController,
    private utils: UtilsProvider) {
    this.setupPagination();
    this.filterForm = this.formBuilder.group({
      createdByMe: [false,],
      createdByOthers: [false,],
      createdLastSixMonths: [false,],
      createdLastYear: [false,],
      dateCreatedRange: [false,],
      modifiedLastSixMonths: [false,],
      modifiedLastYear: [false,],
      dateModifiedRange: [false,],
      dmsSharepoint: [false,],
      dmsIManage: [false,],
      dmsVEnterprise: [false,],
      dmsVPoint: [false,],
      dmsVForce: [false,],
      docTypeWord: [false,],
      docTypeExcel: [false,],
      docTypePowerpoint: [false,],
      docTypePdf: [false,],
    });
  }

  setupPagination() {
    this.paginationSettings = {
      itemsPerPage: this.apiSettingsProvider.pagination.resultsPerPage,
      currentPage: this.apiSettingsProvider.pagination.pageNumber,
      totalItems: this.apiSettingsProvider.pagination.totalItems - this.apiSettingsProvider.pagination.resultsPerPage
    }
  }

  downloadFile(downloadUrl: string) {
    //downloadUrl = "https://vistradev.sharepoint.com/sites/VSearch/Shared%20Documents/GDPR/2020/GDPR%20Mail_16th%20July%20to%2015th%20August%202020.pdf";
    if (downloadUrl && this.isValidHttpUrl(downloadUrl)) {
      this.searchProvider.downloadFile(downloadUrl)
        .then((response: any) => {
          let dataType = response.type;
          if (dataType.toLowerCase().includes("html")) {
            console.error("Document is HTML. Skipping download...");
            this.showToast("Please verify that you have permission to access this document.", 3000, "error-toast");
          } else {
            let binaryData = [];
            binaryData.push(response);
            let downloadLink = document.createElement('a');
            downloadLink.href = window.URL.createObjectURL(new Blob(binaryData, { type: dataType }));
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

  showToast(message: string, duration: number = 0, cssClass: string = "default-toast", position = "middle") {
    let toastOptions = {
      message: message,
      position: position,
      cssClass: cssClass
    };
    if (duration > 0) {
      toastOptions["duration"] = duration;
    }
    const toast = this.toastCtrl.create(toastOptions);
    toast.present();
  }

  applyFilters(sortOrder?: SORT_ORDER) {
    if (sortOrder) {
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
    this.closeDocumentPreview();
    //this.apiSettingsProvider.pagination.from = 0;
    this.apiSettingsProvider.pagination.pageNumber = pageNumber;
    if (this.apiSettingsProvider.pagination.pageNumber == 1) {
      this.apiSettingsProvider.pagination.from = 0;
    }
    if (this.searchProvider.searchKeyword.length > 0) {
      let formats: string[] = [];
      this.searchProvider.elasticSearch()
        .then(data => {
          this.searchProvider.results = this.searchProvider.extractElasticSearchResults(data["hits"].hits);
          /* this.searchProvider.results.forEach(hit => {
            console.log("Format:", hit.format);
            if(formats.indexOf(hit.format) < 0) {
              formats.push(hit.format);
            }
          });
          console.log("Formats:", formats);  // ['WORD_X', 'JPG', 'EXCEL_X', 'PNG', 'PDF', 'PPTX', 'MSG', 'TXT', 'POWER_POINT_X'] */
          this.searchProvider.pagination.totalItems = data["hits"].total.value;
          this.apiSettingsProvider.pagination.totalItems = data["hits"].total.value;
          this.searchProvider.pagination.count = this.searchProvider.results.length;
          this.searchProvider.resetPagination();
          //this.searchProvider.setupElasticPagination();
          this.searchProvider.setupFloatingElasticPagination();
        })
        .catch(err => {
          //console.error("Error performing elastic", err);
          this.router.navigateByUrl('/error', { skipLocationChange: true});
        })
    }
  }

  presentAdvancedFilterPopover() {
    /* const popover = this.popoverCtrl.create(AdvancedFilterPage, {}, {cssClass: "date-range-popover-content"});
    popover.onDidDismiss(filter => {
      if (filter != null) {
      }
    });
    popover.present({ ev: event }); */
    this.utils.genericPopoverItems = [
      { "label": "Client Code", "value": "ClientCode", "icon": null },
      { "label": "Client Name", "value": "ClientName", "icon": null },
      //{ "label": "Company Name", "value": "CompanyName", "icon": null },
      //{ "label": "Company Number", "value": "CompanyNo", "icon": null },
      { "label": "Document Type", "value": "DocClassification", "icon": null },
      { "label": "Jurisdiction", "value": "Jurisdiction", "icon": null },
      { "label": "Title", "value": "Title", "icon": null },
      { "label": "Content", "value": "content", "icon": null },
    ];
    this.utils.genericPopoverHeader = "Select Field";
    const popover = this.popoverCtrl.create(GenericPopoverComponent);
    popover.onDidDismiss(fieldName => {
        this.presentAdvancedFilterPrompt(fieldName);
    });
    popover.present();
  }

  presentAdvancedFilterPrompt(fieldName: string) {
    let fieldLabel: string = this.getMetadataFieldLabel(fieldName);
    let alert = this.alertCtrl.create({
      //title: 'Enter value',
      message: 'Enter the <strong>' + fieldLabel + "</strong> to filter by",
      cssClass: "advanced-filter-prompt",
      inputs: [
        {
          type: 'text',
          name: 'value',
          placeholder: 'Value'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Apply',
          cssClass: "apply-button",
          handler: input => {
            if (input && input.value && input.value.length > 0) {
              this.apiSettingsProvider.filteringCriteria.customFilter = true;
              this.apiSettingsProvider.filteringCriteria.customFilterFieldName = fieldName;
              this.apiSettingsProvider.filteringCriteria.customFilterFieldValue = input.value;
              this.applyAdvancedFilter();
            }
          }
        }
      ]
    });
    alert.present();
  }

  private getMetadataFieldLabel(fieldValue: string): string {
    let fieldLabel: string = "value of the field";
    this.utils.genericPopoverItems.forEach(item => {
      if (item.value == fieldValue) {
        fieldLabel = item.label;
      }
    });
    return fieldLabel;
  }

  applyAdvancedFilter(pageNumber: number = 1) {
    this.apiSettingsProvider.pagination.pageNumber = pageNumber;
    if (this.apiSettingsProvider.pagination.pageNumber == 1) {
      this.apiSettingsProvider.pagination.from = 0;
    }
    this.searchProvider.applyAdvancedFilter()
      .then(data => {
        this.searchProvider.results = this.searchProvider.extractElasticSearchResults(data["hits"].hits);
        this.searchProvider.pagination.totalItems = data["hits"].total.value;
        this.apiSettingsProvider.pagination.totalItems = data["hits"].total.value;
        this.searchProvider.pagination.count = this.searchProvider.results.length;
        this.searchProvider.resetPagination();
        this.searchProvider.setupFloatingElasticPagination();
      })
      .catch(err => {
        console.error("Error applying advanced filter", err);
      })
  }

  applyAdvancedFilter2(fieldName: string, fieldValue: string, pageNumber: number = 1) {
    /* Uses current search results as context */
    this.apiSettingsProvider.pagination.pageNumber = pageNumber;
    if (this.apiSettingsProvider.pagination.pageNumber == 1) {
      this.apiSettingsProvider.pagination.from = 0;
    }
    this.apiSettingsProvider.filteringCriteria.customFilterFieldName = fieldName;
    this.apiSettingsProvider.filteringCriteria.customFilterFieldValue = fieldValue;
    this.applyElasticSearchFilters();
  }

  applySortOrder(sortOrder: SORT_ORDER) {
    this.searchProvider.sortingSettings.order = sortOrder;
    this.searchProvider.sortingSettings.iconName = "";
    this.showSortingSpinner = true;
    switch (this.searchProvider.sortingSettings.order) {
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
    this.auth.getUserDetails()
    .then(userDetails => {
      this.searchProvider.searchKeyword = keyword;
    if (this.searchProvider.targetSystem == "ALFRESCO") {
      this.applyFilters(SORT_ORDER.NEWEST_FIRST);
    }
    if (this.searchProvider.targetSystem == "ELASTIC") {
      this.apiSettingsProvider.pagination.from = 0;
      this.applyElasticSearchFilters();
    }
    })
    .catch(refresh => {
      window.location.reload();
    })   
  }

  initialiseFilters() {
    this.apiSettingsProvider.filteringCriteria = this.apiSettingsProvider.getInitialFilteringState();
    if (this.searchProvider.targetSystem == "ALFRESCO") {
      this.applyFilters(SORT_ORDER.NEWEST_FIRST);
    }
    if (this.searchProvider.targetSystem == "ELASTIC") {
      this.applyElasticSearchFilters();
    }
  }

  selectAllFilters() {
    this.apiSettingsProvider.filteringCriteria = this.apiSettingsProvider.getPopulatedFilteringState();
    if (this.searchProvider.targetSystem == "ALFRESCO") {
      this.applyFilters(SORT_ORDER.NEWEST_FIRST);
    }
    if (this.searchProvider.targetSystem == "ELASTIC") {
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
    switch (deviceSize) {
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
      if (selectedItemValue) {
        switch (selectedItemValue) {
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
    popover.present({ ev: event });
  }

  openDocument(url: string) {
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

  presentDocumentPreviewPopover(document: SEARCH_RESULT) {
    this.searchProvider.selectedDocument = document;
    const popover = this.popoverCtrl.create(
      DocumentPreviewComponent, {}, { cssClass: "preview-popover" });
    popover.present();
  }

  presentSmallScreenPreview(document: SEARCH_RESULT) {
    this.searchProvider.selectedDocument = document;
    const popover = this.popoverCtrl.create(
      DocumentPreviewPage, {}, { cssClass: "preview-popover" });
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
      .then(function () {
        thiz.showToast("Copied to clipboard!", 3000);
      }, function () {
        thiz.showToast("Could not write to clipboard!", 3000);
      })
  }

  presentFilteringPopover() {
    const popover = this.popoverCtrl.create(
      FilteringPanelPage, {}, { cssClass: "filtering-popover" });
    popover.onDidDismiss(selectedItemValue => {
      if (selectedItemValue) {
        switch (true) {
          case ((selectedItemValue.action == "applyFilters") && (this.searchProvider.targetSystem == "ALFRESCO")):
            this.applyFilters();
            break;
          case ((selectedItemValue.action == "applyFilters") && (this.searchProvider.targetSystem == "ELASTIC")):
            this.applyElasticSearchFilters();
            break;
          case ((selectedItemValue.action == "selectAllFilters") && (this.searchProvider.targetSystem == "ELASTIC")):
            this.selectAllFilters();
            break;
          case (selectedItemValue.action == "resetFilters"):
            this.initialiseFilters();
            break;
          case (selectedItemValue.action == "applyAdvancedFilters"):
            this.presentAdvancedFilterPopover();
            break;
        }
      }
    });
    popover.present();
  }

  presentPreviewAlert(event, document) {
    let base64Html = this.domSanitizer.bypassSecurityTrustHtml('<img [src]="data:image/png;base64, "' + document.previewBase64) + ' alt="Document preview" />';
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
    if (document.previewBase64.length > 0) {
      this.searchProvider.selectedDocument = document;
      let popover = this.popoverCtrl.create(ThumbnailPopoverPage);
      popover.onDidDismiss(selectedOption => {
        switch (selectedOption) {
          case ("open"):
            this.openDocument(document.documentUrl);
            break;
        }
      });
      popover.present({ ev: event });
    }
  }

  changePage(changeData) {
    switch (changeData.to) {
      case "next":
        this.goToNextPage();
        break;
      case "previous":
        this.goToPreviousPage();
        break;
      case "pageNumber":
        this.goToPage(changeData.pageNumber);
        break;
      default:
        break;
    }

  }

  goToNextPage() {
    switch (this.searchProvider.targetSystem) {
      case "ALFRESCO":
        if (this.searchProvider.pagination.hasMoreItems) {
          this.searchProvider.paginationSettings.direction = 'next';
          this.searchProvider.paginationSettings.pageNumber++;
        }
        break;
      case "ELASTIC":let pageCount = this.searchProvider.getPageCount();if (this.apiSettingsProvider.pagination.pageNumber < pageCount) {
          this.apiSettingsProvider.pagination.pageNumber++;
          this.searchProvider.setElasticSearchPageStart(this.apiSettingsProvider.pagination.pageNumber);
          this.setLeftFloatingStart();
          if (this.apiSettingsProvider.filteringCriteria.customFilter) {
            this.applyAdvancedFilter(this.apiSettingsProvider.pagination.pageNumber);
          } else {
            this.applyElasticSearchFilters(this.apiSettingsProvider.pagination.pageNumber);
          }
        }
        break;
    }
  }

  goToPreviousPage() {
    switch (this.searchProvider.targetSystem) {
      case "ALFRESCO":
        if (this.searchProvider.pagination.skipCount > 0) {
          this.searchProvider.paginationSettings.direction = 'prev';
          this.searchProvider.paginationSettings.pageNumber--;
          this.applyFilters();
        }
        break;
      case "ELASTIC":
        if (this.apiSettingsProvider.pagination.from > 0) {
          this.apiSettingsProvider.pagination.pageNumber--;
          this.searchProvider.setElasticSearchPageStart(this.apiSettingsProvider.pagination.pageNumber);
          this.setLeftFloatingStart();
          if (this.apiSettingsProvider.filteringCriteria.customFilter) {
            this.applyAdvancedFilter(this.apiSettingsProvider.pagination.pageNumber);
          } else {
            this.applyElasticSearchFilters(this.apiSettingsProvider.pagination.pageNumber);
          }
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
        if (this.apiSettingsProvider.filteringCriteria.customFilter) {
          this.applyAdvancedFilter(this.apiSettingsProvider.pagination.pageNumber);
        } else {
          this.applyElasticSearchFilters(this.apiSettingsProvider.pagination.pageNumber);
        }
        break;
    }
  }

  setLeftFloatingStart() {
    if (this.apiSettingsProvider.pagination.pageNumber == 1) {
      this.apiSettingsProvider.pagination.floatingStart = 4;
    } else {
      if (this.apiSettingsProvider.pagination.pageNumber == this.apiSettingsProvider.pagination.pages.length) {
        this.apiSettingsProvider.pagination.floatingStart = this.apiSettingsProvider.pagination.pages.length - 4;
       } else {
        this.apiSettingsProvider.pagination.floatingStart = this.apiSettingsProvider.pagination.pageNumber - 2;
      }
    }
  }

  setRightFloatingStart() {
    if (this.apiSettingsProvider.pagination.pageNumber == 1) {
      this.apiSettingsProvider.pagination.floatingStart = 4;
    } else {
      if (this.apiSettingsProvider.pagination.pageNumber == this.apiSettingsProvider.pagination.pages.length) {
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
      { "value": SORT_ORDER.AUTHOR_ASCENDING, "label": "By author A-Z", "icon": null },
      { "value": SORT_ORDER.AUTHOR_DESCENDING, "label": "By author Z-A", "icon": null },
      { "value": SORT_ORDER.TITLE_ASCENDING, "label": "Document Name A-Z", "icon": null },
      { "value": SORT_ORDER.TITLE_DESCENDING, "label": "Document Name Z-A", "icon": null },
      { "value": SORT_ORDER.RELEVANCE, "label": "Relevance", "icon": null },
    ];
    this.utils.genericPopoverHeader = "Sort results";
    const popover = this.popoverCtrl.create(
      SortingPopoverPage,
      {
        "items": this.utils.genericPopoverItems
      });
    popover.onDidDismiss(selectedItemValue => {
      if (selectedItemValue) {
        switch (selectedItemValue) {
          case SORT_ORDER.NEWEST_FIRST:
            this.searchProvider.sortingSettings.order = SORT_ORDER.NEWEST_FIRST;
            break;
          case SORT_ORDER.OLDEST_FIRST:
            this.searchProvider.sortingSettings.order = SORT_ORDER.OLDEST_FIRST;
            break;
          case SORT_ORDER.AUTHOR_ASCENDING:
            this.searchProvider.sortingSettings.order = SORT_ORDER.AUTHOR_ASCENDING;
            break;
          case SORT_ORDER.AUTHOR_DESCENDING:
            this.searchProvider.sortingSettings.order = SORT_ORDER.AUTHOR_DESCENDING;
            break;
          case SORT_ORDER.TITLE_ASCENDING:
            this.searchProvider.sortingSettings.order = SORT_ORDER.TITLE_ASCENDING;
            break;
          case SORT_ORDER.TITLE_DESCENDING:
            this.searchProvider.sortingSettings.order = SORT_ORDER.TITLE_DESCENDING;
            break;
          case SORT_ORDER.RELEVANCE:
            this.searchProvider.sortingSettings.order = SORT_ORDER.RELEVANCE;
            break;
          default:
            break;
        }
        if (this.apiSettingsProvider.filteringCriteria.customFilter) {
          this.applyAdvancedFilter();
        } else {
          this.applyElasticSearchFilters();
        }
      }
    });
    popover.present({ ev: event });
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
      if (selectedItemValue) {
        this.searchProvider.resetPagination();
        switch (this.searchProvider.targetSystem) {
          case "ELASTIC":
            this.apiSettingsProvider.pagination.resultsPerPage = selectedItemValue;
            this.searchProvider.setElasticSearchPageStart(0);
            this.apiSettingsProvider.pagination.from = 0;
            if (this.apiSettingsProvider.filteringCriteria.customFilter) {
              this.applyAdvancedFilter();
            } else {
              this.applyElasticSearchFilters();
            }
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
    popover.present({ ev: event });
  }

  /* goToHomePage() {
    this.navCtrl.push("HomePage");
  } */

  setElasticResusltsPerPage() { }
  seAlfrescoResusltsPerPage() { }

}
