import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import {NgxPaginationModule} from 'ngx-pagination';
import { RouterModule } from '@angular/router';

import { ComponentsModule } from '../../components/components.module';
import { ResultsPage, ThumbnailPopoverPage } from './results';
import { SanitizeBase64UrlPipe } from '../../pipes/sanitize-base64-url/sanitize-base64-url';
import { PipesModule } from '../../pipes/pipes.module';

@NgModule({
  declarations: [
    ResultsPage,
    ThumbnailPopoverPage,
    // SanitizeBase64UrlPipe,
  ],
  imports: [
    ComponentsModule,
    IonicPageModule.forChild(ResultsPage),
    NgxPaginationModule,
    PipesModule,
    RouterModule
  ],
  entryComponents: [ ThumbnailPopoverPage ]
})
export class ResultsPageModule {}
