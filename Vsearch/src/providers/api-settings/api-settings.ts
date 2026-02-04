import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../user/user';

export interface SEARCH_FILTER_SET {
  "createdByMe"?:  boolean;
  "createdByOthers"?: boolean;
  "createdLastSixMonths"?: boolean;
  "createdLastYear"?: boolean;
  "dateCreatedRange"?: boolean;
  "dateCreatedRangeStart"?: string;
  "dateCreatedRangeEnd"?: string;
  "modifiedLastSixMonths"?: boolean;
  "modifiedLastYear"?: boolean;
  "dateModifiedRange"?: boolean;
  "dateModifiedRangeStart"?: string;
  "dateModifiedRangeEnd"?: string;
  "dmsSharepoint": boolean;
  "dmsIManage": boolean;
  "dmsVEnterprise": boolean;
  "dmsVPoint": boolean;
  "dmsVForce": boolean;
  "dmsOther": boolean;
  "docTypeWord": boolean;
  "docTypeExcel": boolean;
  "docTypePowerpoint": boolean;
  "docTypePdf": boolean;
  "customFilter": boolean;
  "customFilterFieldName"?: string;
  "customFilterFieldValue"?: string;
}

interface PAGING_SETTINGS {
  "resultsPerPage": number,
  "from": number,
  'pageNumber': number,
  'enumerator': number,
  'totalItems': number,
  'pages' : Array<number>,
  'allPages' : Array<number>,
  'floatingStart': number
}

@Injectable()
export class ApiSettingsProvider {
  filteringCriteria: SEARCH_FILTER_SET = this.getInitialFilteringState();
  sortOrder: string;
  pagination: PAGING_SETTINGS = {
    "resultsPerPage": 10,
    "pageNumber": 1,
    "enumerator": 0,
    "from": 0,
    "totalItems": 0,
    "pages": [],
    "allPages": [],
    "floatingStart": 1
  }
  isOffline: boolean = false;
  presentationMode: boolean = false;
  currentUser: User = { "username": "Anonymous", email: "anonymous@vistra.com", preferredUsername: "Anonymous User"};

  constructor(public http: HttpClient) {}

  getInitialFilteringState(): SEARCH_FILTER_SET {
    let today = new Date();
    let initialDate = new Date(today.getFullYear() - 1, today.getMonth(), 1, 1);

    return {
      "createdByMe": false,
      "createdByOthers": false,
      "createdLastSixMonths": false,
      "createdLastYear": false,
      "dateCreatedRange": false,
      "dateCreatedRangeStart": initialDate.toISOString(),
      "dateCreatedRangeEnd": new Date().toISOString(),
      "modifiedLastSixMonths": false,
      "modifiedLastYear": false,
      "dateModifiedRange": false,
      "dateModifiedRangeStart": initialDate.toISOString(),
      "dateModifiedRangeEnd": new Date().toISOString(),
      "dmsSharepoint": false,
      "dmsIManage": false,
      "dmsVEnterprise": false,
      "dmsVPoint": false,
      "dmsVForce": false,
      "dmsOther": false,
      "docTypeWord": false,
      "docTypeExcel": false,
      "docTypePowerpoint": false,
      "docTypePdf": false,
      "customFilter": false,
      "customFilterFieldName": "",
      "customFilterFieldValue": "",  
    };
  }

  getPopulatedFilteringState(): SEARCH_FILTER_SET {
    let today = new Date();
    let initialDate = new Date(today.getFullYear() - 1, today.getMonth(), 1, 1);

    return {
      "createdByMe": true,
      "createdByOthers": true,
      "createdLastSixMonths": true,
      "createdLastYear": true,
      "dateCreatedRange": true,
      "dateCreatedRangeStart": initialDate.toISOString(),
      "dateCreatedRangeEnd": new Date().toISOString(),
      "modifiedLastSixMonths": true,
      "modifiedLastYear": true,
      "dateModifiedRange": true,
      "dateModifiedRangeStart": initialDate.toISOString(),
      "dateModifiedRangeEnd": new Date().toISOString(),
      "dmsSharepoint": true,
      "dmsIManage": true,
      "dmsVEnterprise": true,
      "dmsVPoint": true,
      "dmsVForce": true,
      "dmsOther": true,
      "docTypeWord": true,
      "docTypeExcel": true,
      "docTypePowerpoint": true,
      "docTypePdf": true,
      "customFilter": false,
      "customFilterFieldName": "",
      "customFilterFieldValue": "",  
    };
  }

}
