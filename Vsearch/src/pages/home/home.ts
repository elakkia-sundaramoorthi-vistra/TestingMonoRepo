import { SearchProvider } from './../../providers/search/search';
import { Component, OnInit } from '@angular/core';
// import { NavController } from 'ionic-angular';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { environment } from '../../environments/environment';
import { UserProvider } from '../../providers/user/user';
import { UtilsProvider } from '../../providers/utils/utils';
import { ApiSettingsProvider } from '../../providers/api-settings/api-settings';
import { AuthProvider } from '../../providers/auth/auth';
import { PopoverController } from 'ionic-angular';
import { DocumentViewerPage } from '../document-viewer/document-viewer';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage implements OnInit {
  searchForm: FormGroup;
  envorinment: "online" | "offline" = "online";

  constructor(
              private apiSettingsProvider: ApiSettingsProvider,
              private auth: AuthProvider,
    private formBuilder: FormBuilder,
              private popoverCtrl: PopoverController,
              private router: Router,
              // private navCtrl: NavController,
              private user: UserProvider,
              private searchProvider: SearchProvider,
              private utils: UtilsProvider) {
    if (this.searchProvider.targetSystem == "ALFRESCO" && !this.isOffline()) {
      this.login();
    }
    if (this.searchProvider.targetSystem == "ELASTIC" && !this.isOffline()) {
      this.getUserDetails();
    }
    this.searchForm = this.formBuilder.group({
      searchText: ['', [Validators.required,]],
    });
    this.apiSettingsProvider.presentationMode = environment.presentationMode;
  }

  ngOnInit(): void {
    // Testing file processing (trying to display but the file tries to download)
    /* this.uploadFileTest();
    this.presentDocumentPreviewPopover("assets/GBC Church Information System.docx"); */
  }

  fetchIManageDocument() {
    this.searchProvider.fetchIManageDocument("fileId: string", "PDF");
  }

  presentDocumentPreviewPopover(src: string) {
    const popover = this.popoverCtrl.create(
      DocumentViewerPage, { "src": src}, { cssClass: "preview-popover"});
    popover.present();
  }



  uploadFileTest() {
    document.getElementById("upload").onchange = function (e) {
      var file = (<HTMLInputElement>document.getElementById('upload')).files[0];
      var reader = new FileReader();
      reader.onload = function() {
        // document.getElementById("display").src = reader.result;
        // image editing
        // ...
        var blob = (window as any).dataURLtoBlob(reader.result);
      };
      reader.readAsDataURL(file);
    };
  }

  getUserDetails() {
    this.auth.getUserDetails()
    .then(userDetails => {
      //this.apiSettingsProvider.currentUser.username = userDetails["user"];
      this.apiSettingsProvider.currentUser.preferredUsername = userDetails["preferredUsername"];
      this.apiSettingsProvider.currentUser.email = userDetails["email"];
    })
    .catch(err => {
      console.error("Failed to retrieve user details:", err);
    })
  }

  isOffline() {
     return this.envorinment == "offline";
  }

  login() {
    let body = new URLSearchParams();
    body.set("userId", "admin")
    body.set("password", "admin")
    return this.user.login(body.toString())
      .then((data) => {
        this.user.setAuthTicket(data["entry"].id);
      })
      .catch(err => {
      // this.searchProvider.basePath = "vsearch/"
    })
  }

  search(event) {
    switch (this.searchProvider.targetSystem) {
      case "ALFRESCO":
        this.alfrescoSearch(event);
        break;
      case "ELASTIC":
        this.elasticSearch(event);
      default:
        break;
    }
  }

  alfrescoSearch(event) {
    this.searchProvider.searchKeyword = this.searchForm.value.searchText.trim();
    if (this.searchProvider.searchKeyword.length > 0) {
      this.searchProvider.search(this.isOffline())
        .then(data => {
          this.searchProvider.results = data["list"].entries;
          this.searchProvider.pagination = data["list"].pagination;
          this.searchProvider.resetPagination();
          this.searchProvider.setupPagination();
          // this.searchProvider.results =  data["list"].entries.slice(-1);
          /* this.navCtrl.push("ResultsPage", {
            "results": data["list"].entries,
            "pagination": data["list"].pagination,
          }); */
        })
        .catch(err => {
          console.error("Error searching:", err);
      })
    }
    event.stopPropagation();
  }

  elasticSearch(event) {
    this.searchProvider.searchKeyword = this.searchForm.value.searchText.trim();
    if (this.searchProvider.searchKeyword.length > 0) {
      this.searchProvider.elasticSearch(this.isOffline())
        .then(data => {
          this.searchProvider.results = this.searchProvider.extractElasticSearchResults(data["hits"].hits);
          this.searchProvider.resetPagination();
          this.searchProvider.pagination.totalItems = data["hits"].total.value;
          this.apiSettingsProvider.pagination.totalItems = data["hits"].total.value;
          this.searchProvider.setupElasticPagination();
          this.searchProvider.setupFloatingElasticPagination();
          this.searchProvider.pagination.count = this.searchProvider.results.length;
          // this.navCtrl.push("ResultsPage");
          /*           this.searchProvider.results = data["list"].entries;
          this.searchProvider.pagination = data["list"].pagination;
          this.searchProvider.resetPagination();
          this.searchProvider.setupPagination();
          // this.searchProvider.results =  data["list"].entries.slice(-1);
          this.navCtrl.push("ResultsPage", {
            "results": data["list"].entries,
            "pagination": data["list"].pagination,
          }); */
          // this.router.navigate(['/results']);
          this.router.navigateByUrl('/results', { skipLocationChange: true});
        })
        .catch(err => {
          //console.error("Error performing elastic", err);
          this.router.navigateByUrl('/error', { skipLocationChange: true});
      })
    }
    event.stopPropagation();
  }
}
