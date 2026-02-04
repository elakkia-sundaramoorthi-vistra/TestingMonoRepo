import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AdvancedFilterPage } from './advanced-filter';

@NgModule({
  declarations: [
    AdvancedFilterPage,
  ],
  imports: [
    IonicPageModule.forChild(AdvancedFilterPage),
  ],
  entryComponents: [ AdvancedFilterPage ]
})
export class AdvancedFilterPageModule {}
