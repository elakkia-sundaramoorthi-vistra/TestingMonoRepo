import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { GenericPopoverComponent } from './generic-popover';

@NgModule({
  declarations: [
    GenericPopoverComponent,
  ],
  imports: [
    IonicPageModule.forChild(GenericPopoverComponent),
  ],
})
export class GenericPopoverPageModule {}
