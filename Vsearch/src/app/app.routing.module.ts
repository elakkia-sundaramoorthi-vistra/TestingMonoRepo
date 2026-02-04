import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OktaAuthGuard } from '@okta/okta-angular';
import { HomePage } from '../../src/pages/home/home';
import { PaginationTestPage } from '../pages/pagination-test/pagination-test';
import { ResultsPage } from '../pages/results/results';
import { NotFoundPage } from '../pages/not-found/not-found';
import { SearchResultsPage } from '../pages/search-results/search-results';
import { ErrorPage } from '../pages/error/error';

const routes: Routes = [
  {
    path: '',
    component: HomePage,
    // canActivate: [ OktaAuthGuard ]
  },
  {
    path: 'results',
    // component: ResultsPage,
    component: SearchResultsPage,
    // canActivate: [ OktaAuthGuard ]
  },
  {
    path: 'error',
    component: ErrorPage,
  },
  /* {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
    // canActivate: [ OktaAuthGuard ]
  }, */
  {
    path: '**',
    component: NotFoundPage,
  }  
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    // RouterModule.forRoot(routes ,{ useHash: false }),
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
