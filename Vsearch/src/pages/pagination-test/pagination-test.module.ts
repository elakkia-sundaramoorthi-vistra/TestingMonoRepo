import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import {NgxPaginationModule} from 'ngx-pagination';
import { PaginationTestPage } from './pagination-test';

@NgModule({
  declarations: [
    PaginationTestPage,
  ],
  imports: [
    IonicPageModule.forChild(PaginationTestPage),NgxPaginationModule
  ],
})
export class PaginationTestPageModule {}
