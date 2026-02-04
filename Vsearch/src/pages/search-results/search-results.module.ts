import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { RouterModule } from '@angular/router';

import { ComponentsModule } from '../../components/components.module';
import { PipesModule } from '../../pipes/pipes.module';
import { SearchResultsPage } from './search-results';

@NgModule({
  declarations: [
    SearchResultsPage,
  ],
  imports: [
    ComponentsModule, PipesModule, IonicPageModule.forChild(SearchResultsPage), RouterModule
  ],
})
export class SearchResultsPageModule {}
