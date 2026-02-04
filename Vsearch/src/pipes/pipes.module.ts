import { NgModule } from '@angular/core';
import { PaginateResultsPipe } from './paginate-results/paginate-results';
import { SanitizeBase64UrlPipe } from './sanitize-base64-url/sanitize-base64-url';
import { SafePipe } from './safe/safe';
@NgModule({
	declarations: [PaginateResultsPipe,
    SanitizeBase64UrlPipe,
    SafePipe],
	imports: [],
	exports: [PaginateResultsPipe,
    SanitizeBase64UrlPipe,
    SafePipe]
})
export class PipesModule {}
