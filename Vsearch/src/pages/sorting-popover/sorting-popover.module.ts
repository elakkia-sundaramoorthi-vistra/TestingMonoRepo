import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SortingPopoverPage } from './sorting-popover';

@NgModule({
  declarations: [
    SortingPopoverPage,
  ],
  imports: [
    IonicPageModule.forChild(SortingPopoverPage),
  ],
})
export class SortingPopoverPageModule {}
