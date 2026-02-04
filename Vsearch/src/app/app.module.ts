import { AdvancedFilterPageModule } from './../pages/advanced-filter/advanced-filter.module';
import { SearchResultsPageModule } from './../pages/search-results/search-results.module';
import { NotFoundPageModule } from './../pages/not-found/not-found.module';
import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import {
  OKTA_CONFIG,
  OktaAuthModule
} from '@okta/okta-angular';
import { OktaAuth } from '@okta/okta-auth-js'; // <=== Use this
import { OAuthModule } from 'angular-oauth2-oidc';

import { ComponentsModule } from '../components/components.module'
import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { GenericPopoverComponent } from '../pages/generic-popover/generic-popover';
import { SortingPopoverPage } from '../pages/sorting-popover/sorting-popover';
import { ServicesSearchProvider } from '../providers/services-search/services-search';
import { SearchProvider } from '../providers/search/search';
//import { ComponentsModule } from '../components/components.module';
//import { SearchResultsMiniComponent } from '../components/search-results-mini/search-results-mini';
import { ApiProvider } from '../providers/api/api';
import { UserProvider } from '../providers/user/user';
import { HttpUtilsProvider } from '../providers/http-utils/http-utils';
import { UtilsProvider } from '../providers/utils/utils';
import { FilteringPanelPage } from '../pages/filtering-panel/filtering-panel';
import { ApiSettingsProvider } from '../providers/api-settings/api-settings';
import { DocumentPreviewPage } from '../pages/document-preview/document-preview';
import { AuthProvider } from '../providers/auth/auth';
import { AppRoutingModule } from './app.routing.module';
import { ResultsPageModule } from '../pages/results/results.module';
import { NgxDocViewerModule } from 'ngx-doc-viewer';
import { LocationStrategy, PathLocationStrategy } from '@angular/common';
import { ThumbnailPopoverPage } from '../pages/thumbnail-popover/thumbnail-popover';
import { PipesModule } from '../pipes/pipes.module';
import { DateRangePopupPage } from '../pages/date-range-popup/date-range-popup';
import { DocumentViewerPage } from '../pages/document-viewer/document-viewer';
import { ErrorPageModule } from '../pages/error/error.module';

const config = {
  issuer: 'https://vsearch.datadmsdev.vaws/auth/realms/alfresco',
  clientId: 'vsearch',
  redirectUri: window.location.origin + '/home',
  pkce: false,
  /* issuer: 'https://dev-10231573.okta.com/oauth2/default',
  clientId: '0oa3lb8ut7aVqqhJE5d7',
  redirectUri: window.location.origin + '/login/callback',
  pkce: false, */
}

// const oktaAuth = new OktaAuth(config);

@NgModule({
  declarations: [
    MyApp,
    DocumentPreviewPage,
    GenericPopoverComponent,
    SortingPopoverPage,
    FilteringPanelPage,
    DateRangePopupPage,
    HomePage,
    DocumentViewerPage,
    ThumbnailPopoverPage,
    //NgxDocViewerModule
    //SearchResultsMiniComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    IonicModule.forRoot(MyApp),
    ComponentsModule,
    AdvancedFilterPageModule,
    NotFoundPageModule,
    OktaAuthModule,
    OAuthModule.forRoot(),
    RouterModule,
    SearchResultsPageModule,
    AppRoutingModule,
    ResultsPageModule,
    PipesModule,
    ErrorPageModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    DocumentPreviewPage,
    FilteringPanelPage,
    DateRangePopupPage,
    GenericPopoverComponent,
    SortingPopoverPage,
    HomePage,
    DocumentViewerPage,
    ThumbnailPopoverPage
  ],
  providers: [
    //Location,
    { provide: LocationStrategy, useClass: PathLocationStrategy },
    StatusBar,
    SplashScreen,
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    ServicesSearchProvider,
    SearchProvider,
    ApiProvider,
    UserProvider,
    HttpUtilsProvider,
    UtilsProvider,
    ApiSettingsProvider,
    AuthProvider,
    {
      provide: OKTA_CONFIG,
      useValue: { config }
    }
  ]
})
export class AppModule {}
