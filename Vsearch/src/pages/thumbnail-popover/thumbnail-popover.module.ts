import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ThumbnailPopoverPage } from './thumbnail-popover';

@NgModule({
  declarations: [
    ThumbnailPopoverPage,
  ],
  imports: [
    IonicPageModule.forChild(ThumbnailPopoverPage),
  ],
})
export class ThumbnailPopoverPageModule {}
