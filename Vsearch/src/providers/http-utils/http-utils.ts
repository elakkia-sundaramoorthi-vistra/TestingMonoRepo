import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
//import { throwError } from 'rxjs';

/*
  Generated class for the HttpUtilsProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class HttpUtilsProvider {

  constructor(public http: HttpClient) { }
/*
  handleError(error: HttpErrorResponse) {
    if (error.status === 0) {
      // A client-side or network error occurred.
      return throwError(
        'please check your internet connection and try again [' +
          error.statusText +
          ']'
      );
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      console.error(
        `Backend returned code ${error.status}, ` + `body was: ${error.error}`
      );
      return throwError(
        'please check your input and try again [' + error.statusText + ']'
      );
    }
  }
*/
}
