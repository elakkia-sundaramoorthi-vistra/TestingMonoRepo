import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ComponentsModule } from '../../components/components.module';
import { DocumentPreviewPage } from './document-preview';

@NgModule({
  declarations: [
    DocumentPreviewPage,
  ],
  imports: [
    IonicPageModule.forChild(DocumentPreviewPage), ComponentsModule
  ],
})
export class DocumentPreviewPageModule {}
