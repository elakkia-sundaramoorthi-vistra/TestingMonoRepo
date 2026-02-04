import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AlertController, PopoverController } from 'ionic-angular';
import { saveAs } from 'file-saver';

import { GenericPopoverComponent } from '../../pages/generic-popover/generic-popover';
import { ThumbnailPopoverPage } from '../../pages/thumbnail-popover/thumbnail-popover';
import { ApiSettingsProvider } from '../../providers/api-settings/api-settings';
import { SearchProvider, SEARCH_RESULT, SORT_ORDER } from '../../providers/search/search';
import { UtilsProvider } from '../../providers/utils/utils';
import { AuthProvider } from '../../providers/auth/auth';

@Component({
  selector: 'results-grid',
  templateUrl: 'results-grid.html'
})
export class ResultsGridComponent {
  @Output() showPreview: EventEmitter<any> = new EventEmitter<any>();
  @Output() showSmallScreenPreview: EventEmitter<any> = new EventEmitter<any>();
  @Output() presentSortingPopover: EventEmitter<any> = new EventEmitter<any>();
  @Output() presentFilteringPopover: EventEmitter<any> = new EventEmitter<any>();
  @Output() closePreview: EventEmitter<any> = new EventEmitter<any>();
  @Output() changePage: EventEmitter<any> = new EventEmitter<any>();
  @Output() changeResultsPerPage: EventEmitter<any> = new EventEmitter<any>();
  @Input() collapsePaginationControls = false;
  showSortingSpinner;

  constructor(
    private alertCtrl: AlertController,
    private auth: AuthProvider,
    protected apiSettingsProvider: ApiSettingsProvider,
    private popoverCtrl: PopoverController,
    protected searchProvider: SearchProvider,
    private utils: UtilsProvider) {
  }

  emitShowPreview(document: SEARCH_RESULT) {
    this.showPreview.emit(document);
  }

  emitShowSmallScreenPreview(document: SEARCH_RESULT) {
    this.showSmallScreenPreview.emit(document);
  }

  emitClosePreview() {
    this.closePreview.emit();
  }

  emitPresentSortingPopover(event) {
    this.emitClosePreview();
    this.presentSortingPopover.emit(event);
  }

  emitPresentFilteringPopover() {
    this.presentFilteringPopover.emit();
  }

  emitChangePage(to: string, pageNumber?: number) {
    this.changePage.emit({ "to": to, "pageNumber": pageNumber });
  }

  emitChangeResultsPerPage(event) {
    this.changeResultsPerPage.emit(event);
  }

  presentThumbnailPopover(event, document) {
    if (document.previewBase64.length > 0) {
      this.searchProvider.selectedDocument = document;
      let popover = this.popoverCtrl.create(ThumbnailPopoverPage);
      popover.onDidDismiss(selectedOption => {
        switch (selectedOption) {
          case ("open"):
            this.openDocument(document.documentUrl, document.dmsName);
            break;
        }
      });
      popover.present({ ev: event });
    }
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

  presentDocumentPopover(event, document: SEARCH_RESULT, deviceSize: string) {
    this.searchProvider.selectedDocument = document;
    this.emitClosePreview();
    this.utils.genericPopoverItems = [
      { "value": "open", "label": "Open", "icon": null },
      //{ "value": "copy", "label": "Copy Link", "icon": null },
      // { "value": "download", "label": "Download", "icon": null },
      //{ "value": "downloadtest", "label": "Download (test)", "icon": null },
    ];

    if (document.dmsName != "VPoint") {
      this.utils.genericPopoverItems.push({ "value": "copy", "label": "Copy Link", "icon": null });
    }
    //this.setDocumentOpenOrDownloadAction(document);
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
            switch (document.dmsName) {
              case "VPoint":
                //this.fetchVPointBearerToken(this.getFileId(document.id), document.format);
                //this.utils.showToast("VPoint upgrade in progress, cannot open the document now...", 3000);
                this.presentOpenInfoPopover();
                break;
              /* case "iManage":
                //this.fetchVPointBearerToken(this.getFileId(document.id), document.format);
                this.utils.showToast("IManage upgrade in progress, cannot open the document now...", 3000);
                break; */
              default:
                this.openDocument(document.documentUrl, document.dmsName);
                break;
            }
            /* if(document.dmsName == "VPoint") {
              //this.fetchVPointBearerToken(this.getFileId(document.id), document.format);
              this.utils.showToast("VPoint upgrade in progress, cannot open the document now...", 3000);
            } else {
              this.openDocument(document.documentUrl);
            } */
            break;
          case "copy":
            // this.copyDocumentLink(document.documentUrl);
            if (this.utils.isIe11) {
              window.prompt("To copy the link:  Please Press Ctrl+C, Enter", document.documentUrl);
            } else {
              this.presentCopyUrlAlert(document.documentUrl);
            }
            break;
          case "preview":
            this.emitShowPreview(document);
            break;
          case "overlay":
            this.emitShowSmallScreenPreview(document);
            break;
          case "download":
            if (document.dmsName == "VPoint") {
              // this.downloadFile(document.documentUrl);
              this.fetchVPointBearerToken(document.downloadUrl + document.id, document.format);
            } else {
              this.openDocument(document.downloadUrl, document.dmsName);
            }
            break;
          case "downloadtest":
            this.downloadFile("https://vistravforce--devpadvp02.my.salesforce.com/img/logo214.svg");
            break;
        }
      }
    });
    popover.present({ ev: event });
  }

  presentOpenInfoPopover() {
    let alert = this.alertCtrl.create({
      message: "The Open Document functionality is not available for VPoint documents. "
        + "If VSearch indicates that the document you are looking for is stored in the VPoint DMS, "
        + "please go to VPoint and use the application’s search functionality to find the document and "
        + "open it directly from there.",
      buttons: [
        {
          text: 'Close',
          role: 'close',
          handler: data => {
            console.log('Cancel clicked');
          }
        }
      ]
    });
    alert.present();
  }

  fetchIManageDocument() {
    this.searchProvider.fetchIManageDocument("fileId: string", "PDF");
  }

  private setDocumentOpenOrDownloadAction(document: SEARCH_RESULT) {
    if (document.dmsName == "SharePoint") {
      this.utils.genericPopoverItems.unshift({ "value": "open", "label": "Open", "icon": null });
    } else {
      this.utils.genericPopoverItems.unshift({ "value": "download", "label": "Download", "icon": null });
    }
  }

  getFileId(filename: String) {
    const fileId = filename.substring(0, filename.lastIndexOf("-"));
    return fileId;
  }

  fetchVPointBearerToken(fileId: string, fileFormat: string) {
    this.auth.fetchVPointBearerToken()
      .then((token: string) => {
        //this.downloadVPointFile(downloadUrl)
        this.searchProvider.fetchVPointDocument(token, fileId, fileFormat);
      })
      .catch(err => {
        console.error("Failed to get bearer token:", err);
      })
  }

  downloadVPointFile(downloadUrl: string) {
    if (downloadUrl && this.isValidHttpUrl(downloadUrl)) {
      //if(true) {
      this.searchProvider.downloadVPointFile(downloadUrl)
        .then((response: any) => {
          let dataType = response.body.type;
          if (dataType.toLowerCase().includes("html")) {
            console.error("Document is HTML. Skipping download...");
            this.utils.showToast("Please verify that you have permission to access this document.", 3000, "error-toast");
          } else {
            saveAs(response.body, downloadUrl);
            /* let binaryData = [];
            binaryData.push(response);
            let downloadLink = document.createElement('a');
            downloadLink.href = window.URL.createObjectURL(new Blob(binaryData, {type: dataType}));
            downloadLink.setAttribute('download', downloadUrl);
            document.body.appendChild(downloadLink);
            downloadLink.click();
            window.URL.revokeObjectURL(downloadLink.href);
            downloadLink.remove(); */
          }
        })
        .catch(err => {
          console.error("Download error:", err)
          this.utils.showToast("Unknown error downloading document", 3000, "error-toast");
        })
    } else {
      this.utils.showToast("Document download URL not valid: [" + downloadUrl + "]", 3000, "error-toast");
    }
  }

  openDocument(url: string, dmsName: string) {
    if (dmsName == "VPoint") {
      this.presentOpenInfoPopover();
    } else {
      window.open(url, "_blank");
    }
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

  async presentCopyUrlAlert(url: string) {
    const prompt = await this.alertCtrl.create({
      title: 'Copy Link',
      // message: message,
      cssClass: "copy-url-alert",
      inputs: [
        {
          name: 'url',
          placeholder: 'URL',
          value: url
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          cssClass: "copy-url-alert-cancel-button",
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Copy',
          cssClass: "copy-url-alert-primary-button",
          handler: data => {
            /*
              prompt.setCssClass() is of no apparent effect.
              If necessitated, use a pipe to style title
              Failed attempt: prompt.setCssClass("copy-url-alert");
            */
            let nav: any = navigator; // Workaround for typings related build error when using directly
            nav.clipboard.writeText(url)
              .then(function () {
                prompt.setTitle("<strong>Copied!</strong>");
              }, function () {
                prompt.setTitle("Could not write to clipboard!");
              })
            return false;
          }
        }
      ]
    });
    await prompt.present();
  }

  copyDocumentLink(link: string) {
    let thiz = this;
    let nav: any = navigator; // Workaround for typings related build error when using directly
    nav.clipboard.writeText(link)
      .then(function () {
        thiz.utils.showToast("Copied to clipboard!", 3000);
      }, function () {
        thiz.utils.showToast("Could not write to clipboard!", 3000);
      })
  }

  downloadFile(downloadUrl: string) {
    //downloadUrl = "https://vistradev.sharepoint.com/sites/VSearch/Shared%20Documents/GDPR/2020/GDPR%20Mail_16th%20July%20to%2015th%20August%202020.pdf";
    if (downloadUrl && this.isValidHttpUrl(downloadUrl)) {
      //if(true) {
      this.searchProvider.downloadFile(downloadUrl)
        //this.searchProvider.downloadFile("https://vistradev.sharepoint.com/sites/VSearch/Shared%20Documents/GDPR/2020/GDPR%20Mail_1st%20Feb%20to%2015th%20March%202020.pdf")
        .then((response: any) => {
          let dataType = response.body.type;
          if (dataType.toLowerCase().includes("html")) {
            console.error("Document is HTML. Skipping download...");
            this.utils.showToast("Please verify that you have permission to access this document.", 3000, "error-toast");
          } else {
            saveAs(response.body, downloadUrl);
            /* let binaryData = [];
            binaryData.push(response);
            let downloadLink = document.createElement('a');
            downloadLink.href = window.URL.createObjectURL(new Blob(binaryData, {type: dataType}));
            downloadLink.setAttribute('download', downloadUrl);
            document.body.appendChild(downloadLink);
            downloadLink.click();
            window.URL.revokeObjectURL(downloadLink.href);
            downloadLink.remove(); */
          }
        })
        .catch(err => {
          console.error("Download error:", err)
          this.utils.showToast("Unknown error downloading document", 3000, "error-toast");
        })
    } else {
      this.utils.showToast("Document download URL not valid: [" + downloadUrl + "]", 3000, "error-toast");
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
}
