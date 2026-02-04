import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { FilteringPanelPage } from './filtering-panel';
import { ComponentsModule } from '../../components/components.module'

@NgModule({
  declarations: [
    FilteringPanelPage,
  ],
  imports: [
    IonicPageModule.forChild(FilteringPanelPage), ComponentsModule
  ],
})
export class FilteringPanelPageModule {}
