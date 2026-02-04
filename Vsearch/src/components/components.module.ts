import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { SearchResultsMiniComponent } from './search-results-mini/search-results-mini';
import { FilteringPanelComponent } from './filtering-panel/filtering-panel';
import { DocumentPreviewComponent } from './document-preview/document-preview';
import { PaginationComponent } from './pagination/pagination';
import { ResultsGridComponent } from './results-grid/results-grid';
import { PipesModule } from '../pipes/pipes.module';
import { NgxPaginationModule } from 'ngx-pagination';
import { DatePickerComponent } from './date-picker/date-picker';

@NgModule({
	declarations: [SearchResultsMiniComponent,
    FilteringPanelComponent,
    DocumentPreviewComponent,
    PaginationComponent,
    ResultsGridComponent,
    DatePickerComponent, ],
	imports: [IonicModule, NgxPaginationModule, PipesModule],
	exports: [SearchResultsMiniComponent,
    FilteringPanelComponent,
    DocumentPreviewComponent,
    PaginationComponent,
    ResultsGridComponent,
    DatePickerComponent, ]
  ,
  entryComponents: [DocumentPreviewComponent]
})
export class ComponentsModule {}
