import { HttpUtilsProvider } from './../http-utils/http-utils';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PopoverController } from 'ionic-angular';
import subMonths from 'date-fns/subMonths';
import formatISO from 'date-fns/formatISO';

import { ApiSettingsProvider } from '../api-settings/api-settings';
import { Observable } from 'rxjs';
import { DocumentViewerPage } from '../../pages/document-viewer/document-viewer';

interface ELASTICSEARCH_QUERY_PARAMETERS {
  "createdByMe"?:  string;
  "createdByOthers"?: string;
  "createdLastSixMonths"?: string;
  "createdLastYear"?: string;
  "dateCreatedRange"?: string,
  "dateCreatedRangeStart"?: string,
  "dateCreatedRangeEnd"?: string,
  "modifiedLastSixMonths"?: string;
  "modifiedLastYear"?: string;
  "dateModifiedRange"?: string,
  "dateModifiedRangeStart"?: string,
  "dateModifiedRangeEnd"?: string,
  "dmsSharepoint": string,
  "dmsIManage": string,
  "dmsVEnterprise": string,
  "dmsVPoint": string,
  "dmsVForce": string,
  "docTypeWord": string,
  "docTypeExcel": string,
  "docTypePowerpoint": string,
  "docTypePdf": string
}
enum RUNNING_ENVIRONMENT {
  DEVELOPMENT = "dev",
  QA = "qa",
  PRODUCTION = "prod",
}

@Injectable()
export class ApiProvider {
  _backend = {
    appPackageName: "",
    appType: "",
    // baseUrl: "https://dms.datadmsdev.vaws/alfresco/api/-default-/public/",
    baseUrl: "/alfresco/api/-default-/public/",
    elasticSearchBaseUrl: "/es/vsearch-simflofy310/_search",
    elasticSearchBackend: "/es/",
    elasticSearchIndex: "vsearchv1",
    expiryDate: "",
    appName: "",
    orgModuleLabel: "",
    lastCachedAt: "",
    environment: "localhost",
    searchHistoryIndex: "search_history_prod"
  };

  headers = new HttpHeaders({
    'Content-Type': 'application/jso; charset=ISO-8859-1',
    "cache-control": "no-cache"
  })
  authHeaders = new HttpHeaders({
    'Content-Type': 'application/jso; charset=ISO-8859-1',
     'Authorization': 'Basic ' + btoa('admin:admin'),
    //"cache-control": "no-cache"
  });
  authTicket: string = "";
  elasticSearchQueryParameters: ELASTICSEARCH_QUERY_PARAMETERS;

  constructor(
    private apiSettingsProvider: ApiSettingsProvider,
    private popoverCtrl: PopoverController,
    private httpClient: HttpClient,
    private httpUtilsProvider: HttpUtilsProvider) {
    if (window.location.origin.includes("localhost") || window.location.origin.includes("127.0.0.1")) {
      this._backend.baseUrl = "https://dms.datadmsdev.vaws/alfresco/api/-default-/public/";
      this._backend.elasticSearchBaseUrl = "https://dms.datadmsdev.vaws";
    } else {
      this._backend.baseUrl = window.location.origin + this._backend.baseUrl;
      this._backend.elasticSearchBaseUrl = window.location.origin;
      switch (true) {
        case (window.location.origin.includes("dev")):
          this._backend.environment = RUNNING_ENVIRONMENT.DEVELOPMENT;
          this._backend.elasticSearchBackend = "/es/";
          break;
        case (window.location.origin.includes("qa")):
          this._backend.environment = RUNNING_ENVIRONMENT.QA;
          this._backend.elasticSearchBackend = "/es/";
          break;
          case (window.location.origin.includes("prod") || window.location.origin.includes("vistra")):
          this._backend.environment = RUNNING_ENVIRONMENT.PRODUCTION;
          this._backend.elasticSearchBackend = "/es/";
          break;
      }
    }
  }

  getUserDetails() {
    if (this._backend.environment == RUNNING_ENVIRONMENT.QA || 
      this._backend.environment == RUNNING_ENVIRONMENT.PRODUCTION) {

      return this.httpClient.get(this._backend.elasticSearchBaseUrl + "/oauth2/userinfo").toPromise();

    } else {
        return new Promise((resolve, reject) => {
          resolve({
            "user"              : "User details implementation only active in QA for now...",
            "email"             : "TempAnonymous@vistra.com",
            "preferredUsername" : "Temp Anonymous User"
          });
        });
      }
  }

  login(credentials: string) {
    credentials = JSON.stringify({"userId": "admin","password": "admin"});
    return this.httpClient.post(this._backend.baseUrl + "authentication/versions/1/tickets", credentials, {headers: this.headers, withCredentials: false}).toPromise();
  }

  search(keyword: string, resultsPerPage: number) {
    //let body = '{"query":{"query":"' + keyword + '"}}';
    let body = {
      "query": {
          //"query": keyword
          //"query": "\"" + keyword + "\" +TYPE:\"document\""
          "query": "(\"" + keyword + "\" OR cm:name:\"" + keyword + "*\" OR cm:creator:\"" + keyword + "*\") AND TYPE:\"cm:content\" AND !TYPE:\"fm:post\"",
        },
      "sort": {"type":"FIELD", "field":"cm:created", "ascending":"false"},
      "paging": {
          "maxItems": resultsPerPage
      }
    }
    this.authHeaders.set("Authorization", 'Basic ' + btoa(this.authTicket));
    let authHeaders = new HttpHeaders({
      'Content-Type': 'application/jso; charset=ISO-8859-1',
      'Authorization': 'Basic ' + btoa(this.authTicket),
      "cache-control": "no-cache"
    });
    return this.httpClient.post(this._backend.baseUrl + "search/versions/1/search",JSON.stringify(body), {headers: authHeaders, withCredentials: false}).toPromise();
  }

  elasticSearch(query: string, sortOrder) {
    let requestPayload = {
      "from": this.apiSettingsProvider.pagination.from,
      "size": this.apiSettingsProvider.pagination.resultsPerPage,
      "_source": [
        "Title","Author","CreatedDate","DMSName","FullUrl","id","Subject","Description","Recipients","Language",
        "Format","DocType","DocClassification","TaxLevel0","TaxLevel1","TaxLevel2","TaxLevel3","TaxLevel4","TaxLevel5",
        "TaxLevel6","TaxLevel7","ClientCode","ClientName","Retention","DocumentExpiry","Jurisdiction","ReviewDate",
        "RegisterFiling","ModifiedDate", "DownloadUrl"
      ],
      "query": {
        "bool": {
          "must": [{
            "multi_match":
            {
              "query": query,
              "fields": ["Title", "Author", "content", "ClientName", "ClientCode", "Description", "Subject", "DocClassification","Jurisdiction"],
              "type": "cross_fields",
              "operator": "and",
              "minimum_should_match": "50%",
              "auto_generate_synonyms_phrase_query": "true"
            }
          }
          ]
        }
      }
    };
    let filters = this.getFilters();
    if(filters.length > 0) {
      requestPayload["query"]["bool"]["filter"] = filters;
    }
    if(sortOrder.length > 0) {
      requestPayload["sort"] = sortOrder;
    };
    let advancedFilters = this.getAdvancedFilters();  
    if(advancedFilters != null) {
      requestPayload["query"]["bool"]["must"].push(advancedFilters);
    }
    this.getSearchHistory(query);
   //requestPayload["aggs"] = this.getAggregates();
    let authHeaders = new HttpHeaders({
      'Content-Type': 'application/json; charset=ISO-8859-1',
      //'Authorization': 'Basic ' + btoa('elasticadmin:elasticadmin'),
      'cache-control': 'no-cache'      
    });
    if (this._backend.environment == RUNNING_ENVIRONMENT.DEVELOPMENT) {
      authHeaders.set("Authorization", 'Basic ' + btoa('elasticadmin:elasticadmin'));
      return this.httpClient.post(this._backend.elasticSearchBaseUrl + this._backend.elasticSearchBackend  + this._backend.elasticSearchIndex + "/_search", JSON.stringify(requestPayload), {headers: authHeaders, withCredentials: true}).toPromise();
    }
    if (this.apiSettingsProvider.isOffline) {
      return this.elasticSearchOffline();
    } else
    {
      return this.httpClient.post(this._backend.elasticSearchBaseUrl + this._backend.elasticSearchBackend  + this._backend.elasticSearchIndex + "/_search", JSON.stringify(requestPayload), {headers: authHeaders, withCredentials: false}).toPromise();
    }
  }

  getSearchHistory(searchTerm: string) {    
    let result = {"UserName": this.apiSettingsProvider.currentUser.preferredUsername,"UserEmail":  this.apiSettingsProvider.currentUser.email,"SearchTerm": searchTerm,"SearchDate": new Date()};
    let authHeaders = new HttpHeaders({
      'Content-Type': 'application/json; charset=ISO-8859-1',
      'cache-control': 'no-cache'
    });
    if (this._backend.environment == RUNNING_ENVIRONMENT.DEVELOPMENT) {
      authHeaders.set("Authorization", 'Basic ' + btoa('elasticadmin:elasticadmin'));
      return this.httpClient.post(this._backend.elasticSearchBaseUrl + this._backend.elasticSearchBackend  + this._backend.searchHistoryIndex + "/_doc", JSON.stringify(result), {headers: authHeaders, withCredentials: true}).toPromise();
    } else {
    return this.httpClient.post(this._backend.elasticSearchBaseUrl + this._backend.elasticSearchBackend  + this._backend.searchHistoryIndex + "/_doc", JSON.stringify(result), {headers: authHeaders, withCredentials: false}).toPromise();
    }
  }

  getAdvancedFilters() {
    let advancedFilter;
    if (this.apiSettingsProvider.filteringCriteria.customFilterFieldValue.length >0 &&
      this.apiSettingsProvider.filteringCriteria.customFilterFieldName.length >0) {
      advancedFilter = {
        "multi_match": {
          "query": this.apiSettingsProvider.filteringCriteria.customFilterFieldValue,
          "fields": [this.apiSettingsProvider.filteringCriteria.customFilterFieldName],
          "type": "cross_fields",
          "operator": "and",
          "minimum_should_match": "50%",
          "auto_generate_synonyms_phrase_query": "true"
        }
      }
    } else {
      advancedFilter = null;
    }
    return advancedFilter;
  }

  getAggregates(): any {
    return {
      "DMSName": {
        "terms": {
          "field": "DMSName.raw"
        }
      },
      "Format": {
        "terms": {
          "field": "Format.raw"
        }
      }
      ,
      "range": {
        "date_range": {
          "field": "CreatedDate",
          "format": "yyyy-MM-dd 00:00:00",
          "keyed": true,
          "ranges": [
            {"key":"Last6Month","from": "now-6M/d", "to" : "now/d"},
            {"key":"Last1Year", "from": "now-12M/d", "to" : "now-6M/d-1d"},
            {"key":  "Greater1Year", "from": "now-12M/d+1d", "to" : "now-120M/d-1d"}
          ]
        }
      }
    }
  }  

  downloadDocument(url: string): Observable<Blob> {
    return this.httpClient.get(url, {
      responseType: 'blob'
    });
  }

  getFilters() {
    let filters = [];
    if(this.apiSettingsProvider.filteringCriteria.createdByMe) {
      filters.push(this.getCreatedByMeFilter());
    }
    if(this.apiSettingsProvider.filteringCriteria.createdByOthers) {
      filters.push(this.getCreatedByOthersFilter());
    }
    if(this.apiSettingsProvider.filteringCriteria.createdLastSixMonths) {
      filters.push(this.getDateRangeFilter("CreatedDate", this.getMonthsAgo(6), this.getNow()));
    }
    if(this.apiSettingsProvider.filteringCriteria.createdLastYear) {
      filters.push(this.getDateRangeFilter("CreatedDate", this.getMonthsAgo(12), this.getNow()));
    }
    if(this.apiSettingsProvider.filteringCriteria.dateCreatedRange) {
      filters.push(this.getDateRangeFilter("CreatedDateRange", this.apiSettingsProvider.filteringCriteria.dateCreatedRangeStart, this.apiSettingsProvider.filteringCriteria.dateCreatedRangeEnd));
    }
    if(this.apiSettingsProvider.filteringCriteria.modifiedLastSixMonths) {
      filters.push(this.getDateRangeFilter("ModifiedDate", this.getMonthsAgo(6), this.getNow()));
    }
    if(this.apiSettingsProvider.filteringCriteria.modifiedLastYear) {
      filters.push(this.getDateRangeFilter("ModifiedDate", this.getMonthsAgo(12), this.getNow()));
    }
    if(this.apiSettingsProvider.filteringCriteria.dateModifiedRange) {
      filters.push(this.getDateRangeFilter("ModifiedDateRange", this.apiSettingsProvider.filteringCriteria.dateModifiedRangeStart, this.apiSettingsProvider.filteringCriteria.dateModifiedRangeEnd));
    }
    let dmsFilters = [];
    if(this.apiSettingsProvider.filteringCriteria.dmsSharepoint) {
      dmsFilters.push(this.getSharePointFilter());
    }
    if(this.apiSettingsProvider.filteringCriteria.dmsVForce) {
      dmsFilters.push(this.getVForceFilter());
    }
    if(this.apiSettingsProvider.filteringCriteria.dmsVPoint) {
      dmsFilters.push(this.getVPointFilter());
    }
    if(this.apiSettingsProvider.filteringCriteria.dmsVEnterprise) {
      dmsFilters.push(this.getVEnterpriseFilter());
    }
    if(this.apiSettingsProvider.filteringCriteria.dmsIManage) {
      dmsFilters.push(this.getIManageFilter());
    }
    if(this.apiSettingsProvider.filteringCriteria.dmsOther) {
      dmsFilters.push(this.getOtherDmsFilter());
    }
    if (dmsFilters.length > 0) {
      filters.push({ "terms": { "DMSName": dmsFilters }});
    }
    let documentTypeFilters = [];
    if (this.apiSettingsProvider.filteringCriteria.docTypePdf) {
      //documentTypeFilters.push(this.getPdfFilter());
      this.getPdfFilter().forEach(filter => {
        documentTypeFilters.push(filter);
      })
    }
    if (this.apiSettingsProvider.filteringCriteria.docTypeExcel) {
      //documentTypeFilters.push(this.getExcelFilter());
      this.getExcelFilter().forEach(filter => {
        documentTypeFilters.push(filter);
      });
    }
    if (this.apiSettingsProvider.filteringCriteria.docTypePowerpoint) {
      //documentTypeFilters.push(this.getPowerPointFilter());
      this.getPowerPointFilters().forEach(filter => {
        documentTypeFilters.push(filter);
      });
    }
    if (this.apiSettingsProvider.filteringCriteria.docTypeWord) {
      this.getWordFilter().forEach(filter => {
        documentTypeFilters.push(filter);
      })
    }
    if(documentTypeFilters.length > 0) {
      filters.push({ "terms": { "Format": documentTypeFilters }});
    }
    /* if(this.apiSettingsProvider.filteringCriteria.customFilter) {
      filters.push(this.getAdvancedFilter());
    }  */   
    return filters;
  }

  getCreatedByMeFilter() {
    let createdByMeFilter;
    createdByMeFilter = {
      "multi_match": {
        "query": this.apiSettingsProvider.currentUser.preferredUsername,
        "fields": ["Author"],
        "type": "cross_fields",
        "operator": "and",
        "minimum_should_match": "50%",
        "auto_generate_synonyms_phrase_query": "true"
      }
    }
    return createdByMeFilter;
  }

  getTitleCase(str: string): string {
    return str.split(' ')
    .map(w => w[0].toUpperCase() + w.substring(1).toLowerCase())
    .join(' ')
  }

  getCreatedByOthersFilter() {
    return {
      "bool": {
        "must_not": {
          "multi_match": {
            "query": this.apiSettingsProvider.currentUser.preferredUsername,
            "fields": ["Author"],
            "type": "cross_fields",
            "operator": "and",
            "minimum_should_match": "50%",
            "auto_generate_synonyms_phrase_query": "true"
          }
        }
      }
    }
  }

  getUsernameMatch() {
    
  }

  getDateRangeFilter(field: string, start, end) {
    //return {"CreatedDate": {"gte": "2021-12-22T10:39:00","lte": "2021-12-26T10:39:00"}};
    let dateRangeFilter: any = {"range": {"CreatedDate": {"gte": start,"lte": end}}};
    switch (field) {
      case "ModifiedDate":
        dateRangeFilter = {"range": {"ModifiedDate": {"gte": start,"lte": end}}};
        break;
      case "CreatedDateRange":
        dateRangeFilter = {"range": {"CreatedDate": {"gte": start,"lte": end}}};
        break;
      case "ModifiedDateRange":
        dateRangeFilter = {"range": {"ModifiedDate": {"gte": start,"lte": end}}};
        break;
    }
    return dateRangeFilter;
  }

  /*
    "";
    "dateCreatedRangeEnd";
    "modifiedLastSixMonths";
    "modifiedLastYear";
    "dateModifiedRange"?: boolean,
    "dateModifiedRangeStart"?: Date,
    "dateModifiedRangeEnd"?: Date,
    "dmsSharepoint": boolean,
    "dmsIManage": boolean,
    "dmsVEnterprise": boolean,
    "dmsVPoint": boolean,
    "dmsVForce": boolean,
    "docTypeWord": boolean,
    "docTypeExcel": boolean,
    "docTypePowerpoint": boolean,
    "docTypePdf": boolean */

  getcreatedLastYear() {
    return;
  }

  getdateCreatedRange() {
  }

  getSharePointFilter() {
    return  "SharePoint";
  }

  getVForceFilter() {
    return  "VForce";
  }

  getVPointFilter() {
    return  "VPoint";
  }

  getVEnterpriseFilter() {
    return  "VEnterprise";
  }

  getIManageFilter() {
    return  "iManage";
  }

  getOtherDmsFilter() {
    return "NA";
  }

  getPdfFilter() {
    return ["PDF","pdf"];
  }

  getExcelFilter() {
    return ["XLSX","xlsx"];
  }

  getPowerPointFilters() {
    return ["PowerPoint", "PPTX", "POWER_POINT_X"];
  }

  getWordFilter(): string[] {
    return ["Word", "DOCX","WORD_X","docx","doc"];
  }

  getAdvancedFilter() {
    let terms = {};
    let term = {};
    term[this.apiSettingsProvider.filteringCriteria.customFilterFieldName] = [this.apiSettingsProvider.filteringCriteria.customFilterFieldValue];
    terms["terms"] = term;
    return terms;
  }

  filter(keyword: string, criteria: string, sourceDMSFilters: string, documentTypes: string, sortOrder, resultsPerPage: number, skipCount) {
   
    let jsonBody =
    {
      "query": {
      //"query": "+@cm\\:modified:[NOW/DAY-6MONTHS TO NOW/DAY+1DAY] +@cm\\:creator:mjackson +TYPE:\"cm:content\"",
//      "query": "(cm:name:\"" + keyword + "*\") AND TYPE:\"cm:content\"" + criteria,
        // ====> Reconstructed below
      /* "query": "(\"" + keyword + "\" OR cm:name:\"" + keyword + "*\" OR cm:creator:\"" + keyword + "*\") AND TYPE:\"cm:content\" AND !TYPE:\"fm:post\"" + criteria + " AND (" + sourceDMSFilters + "\")", */
      //"query": criteria,
      //"language": "lucene"
      },
      //"filterQueries": [{"query": "TYPE:'cm:content'"}, {"query": "content.mimetype:'application/msword' OR content.mimetype:'application/vnd.ms-excel'"}],
      //"filterQueries": [{"query": "TYPE:'cm:content'"}, {"query": documentTypes}],
      "fields": ["id", "name", "createdAt", "createdByUser"],
      "paging": {
        "maxItems": resultsPerPage,
        "skipCount": skipCount
        }
      /* ,
      "facetQueries": [
        // {"query": "content.size:[0 TO 10240]", "label": "Small Files"},
        {"query": "content.mimetype:'text/plain'", "label": "Plain Text"},
        {"query": "content.mimetype:'application/msword' OR content.mimetype:'application/vnd.ms-excel'", "label": "Office"}
        ] */
    }
    if(sourceDMSFilters.length > 0) {
      jsonBody["query"]["query"] = "(\"" + keyword + "\" OR cm:name:\"" + keyword + "*\" OR cm:creator:\"" + keyword + "*\") AND TYPE:\"cm:content\" AND !TYPE:\"fm:post\"" + criteria + " AND (" + sourceDMSFilters + "\")";
    }
    else {
      jsonBody["query"]["query"] = "(\"" + keyword + "\" OR cm:name:\"" + keyword + "*\" OR cm:creator:\"" + keyword + "*\") AND TYPE:\"cm:content\" AND !TYPE:\"fm:post\"" + criteria;
    }
    if(documentTypes.length > 0) {
      jsonBody["filterQueries"] = [{"query": "TYPE:'cm:content'"}, {"query": documentTypes}];
    }
    //jsonBody["sort"] = [{"type":"FIELD", "field":"created", "ascending":"false"}]
    if(sortOrder) {
      jsonBody["sort"] = [ sortOrder];
    }

/* {
  "query": {
    "query": "+TYPE:\"cm:content\"",
    "language": "afts"},
    "fields": ["id", "name", "createdAt", "createdByUser", "location", "isFolder", "isFile"],
    "ranges": [
        {
            "field": "created",
            "start": "2020-01-29T10:45:15.729Z",
            "end": "2022-01-29T10:45:15.729Z",
            "gap": "+100DAY"
        }],
    "paging": {
      "maxItems": "25"
      //"skipCount": "10"
    },
    "sort": [{"type":"FIELD", "field":"cm:name", "ascending":"false"}]
} */

//{"query": {"query": "+@cm\\:modified:[NOW/DAY-7DAYS TO NOW/DAY+1DAY] +TYPE:\"cm:content\"","language": "lucene"}}




      //};
   /*
    console.log("JSON auth:", JSON.stringify(jsonBody));
    this.getMonthsAgo(6).substr(0, 19) + ".729Z"
    {
      "query": {
        "query": "+TYPE:\"cm:content\"",
        "language": "afts",
        "fields": ["id", "name", "createdAt", "createdByUser", "location", "isFolder", "isFile"],
        "ranges": [
          {
            "field": "created",
            "start": this.getMonthsAgo(6),
            "end": startOfToday(), "gap": "+100DAY"
          }]
      }
    };*/
    let authHeaders = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(this.authTicket),
      //"cache-control": "no-cache"
    });
    return this.httpClient.post(this._backend.baseUrl + "search/versions/1/search", JSON.stringify(jsonBody), {headers: authHeaders, withCredentials: false}).toPromise();
  }


  searchOffline() {
    return this.httpClient.get('assets/testData.json').toPromise();
  }

  downloadFile(downloadUrl: string) {
    let headers = new HttpHeaders({
      /* 'Access-Control-Allow-Origin': '*', 'crossDomain': 'true',
      'Content-Disposition': 'attachment' */
      /* 'Access-Control-Allow-Origin': '*', 'crossDomain': 'true',
      'Content-Disposition': 'attachment',
      'Access-Control-Allow-Methods': 'GET, OPTIONS, POST, PUT',
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Login-Ajax-call': 'true' */
      "Access-Control-Allow-Origin": "localhost:8100",
      'Access-Control-Allow-Header': 'Orgin, X-Requested-With, Content-Type, Accept',
      "Access-Control-Allow-Methods": "PUT,POST,GET,DELETE,OPTIONS",
      "X-Powered-By": '3.2.1',
      "Content-Type": "application/json;charset=utf-8",
      "Accept": "application/json;odata=verbose",
      "Authorization":"Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6Ik1yNS1BVWliZkJpaTdOZDFqQmViYXhib1hXMCIsImtpZCI6Ik1yNS1BVWliZkJpaTdOZDFqQmViYXhib1hXMCJ9.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTBmZjEtY2UwMC0wMDAwMDAwMDAwMDAvdmlzdHJhZGV2LnNoYXJlcG9pbnQuY29tQDBjZDFlMDhjLWMzMmMtNDhhZi04NTNmLWYyMmVlNjU0ZmVmMCIsImlzcyI6IjAwMDAwMDAxLTAwMDAtMDAwMC1jMDAwLTAwMDAwMDAwMDAwMEAwY2QxZTA4Yy1jMzJjLTQ4YWYtODUzZi1mMjJlZTY1NGZlZjAiLCJpYXQiOjE2NDQ1ODg5ODksIm5iZiI6MTY0NDU4ODk4OSwiZXhwIjoxNjQ0Njc1Njg5LCJpZGVudGl0eXByb3ZpZGVyIjoiMDAwMDAwMDEtMDAwMC0wMDAwLWMwMDAtMDAwMDAwMDAwMDAwQDBjZDFlMDhjLWMzMmMtNDhhZi04NTNmLWYyMmVlNjU0ZmVmMCIsIm5hbWVpZCI6Ijc3ZjliOTI4LWFhMzktNDEzMC1hOTM0LTQ0YWZlZmZhNTU4NUAwY2QxZTA4Yy1jMzJjLTQ4YWYtODUzZi1mMjJlZTY1NGZlZjAiLCJvaWQiOiJhMmNjMjk5OS0yMmFjLTRmYzUtYWE3NS1jZTIxZjQyYTBlYjIiLCJzdWIiOiJhMmNjMjk5OS0yMmFjLTRmYzUtYWE3NS1jZTIxZjQyYTBlYjIiLCJ0cnVzdGVkZm9yZGVsZWdhdGlvbiI6ImZhbHNlIn0.aqqaxSbGTIcTwzV0qMwsphprMwB8zdGsBoHn7pxFqamxlee676uCzWDvAr0JD3UTPDfn_RhnZgrTa0hKBOOYfzkZCR65PjVLAQBV1LyWECN-l70lUeNFrOJ-RdkaxP3bBXiVRwvLv07gqkIOcobMSg9NhtDbtwAMqaS_j6lW52hnjClqb7l-oDizm8lVpGFWRfmPEqdusaN0BJ2IHFEbgrmfv6IyyCczvPeF17SwyqufhildONq43IWBkc9GY1JdEmIaGb5jCkaN-GIauYoOsvB5CLLM8mPw8hYRzn4yDCnGC5eHgiKAYan_h72iFX01nJYdKOb6HQbA3LO0Am63og"
    });
    //headers = headers.set('Access-Control-Allow-Origin', '*');
    return this.httpClient.post(downloadUrl, {}, {headers: headers, withCredentials: true}).toPromise();

    // return this.httpClient.get(downloadUrl, {responseType: 'blob' as 'json', headers: headers, observe: 'response'}).toPromise();
  }

  fetchVPointBearerToken() {
    let url: string = "https://webcountry4.clmvpcuat.vaws/rest/token";
    let headers = new HttpHeaders({
      "username": "vipapi",
      'password': 'Today123',
      "grant_type": "password",
      //"Content-Type": "application/x-www-form-urlencoded",
      'Content-Type': 'application/json; charset=ISO-8859-1',
      //'Authorization': 'Basic ' + btoa(this.authTicket),
      "Authorization": "Bearer WLWxSfKrgEr-2SV-qb3-Zca0KtRIsa4nLzuXbt52URlZf2adwHmIEvRU2fQF0_IBe2tas2BEv-CpFokiy_JilrCErpRrcYSp8gVaQdPLvJaL-Kc60ETqZJd0Oj4_zPForBhPRp9OkD8KpHTSGNiSTDe2RbE-5UWkJGatXRp3lSEdpqzqbZK-Ee5Ha3N3dRtL_3R2UxHHS75hrT7sxESn_T289AvCvxJvygmpcuBl0x61LYtX22n84bb8kIjKf4DPNw64AE-aVF9qw38ThNtRGGbI-eq_ZB2Xhe_e6LanvcbmXyrPq4ARJwgJL_JLVYDCxq4_Gk2ILznR8juj5kAxzZPs-jEaQJP3XcUpVisLCBxgmVl9VNNZwcgU9DRP5RNo9HTHrjYCmXV1QP4EQXsxMdl4_JOlCFv1fNtuquuJQzA1jyahEP6LKCQur7plR-EBlxGMhTdV7aoqmSK7QvAUSlzqKatG3tYuATR3eexkHY7SHqtq5_K4r25qzPjQtk3VL0VfHcU2Zf42WPcOyzKgN8T6r5LqPnd-0NmPBHTj4x7U3Z5n2A4AhbDn_V_kc39TvTxNRoyqg5nDECqcRq1IlPK6rh-0Owm-R1KXV8pPXtCEChOdqCg5gH1O_4DbskpNB3hoP92K51qooXlqCsXehg1qhDoQaHYTwegU5ZqAoiCCi1EAboDoZNXULqwQI9FZqOB10ErJaDD6Re4QM89929HZ26qbLApJ6VP7LmxHpbACVWmba5k9wZBILCLQKSaB6lLPzptkViMu9oZSYOXH_AgSHQEky6PFIAMJjD5PjDLs-uk4MqTIq17XvnOGn_X_FBPAUS04yRYT39kwcVUJ2pEwDn9d8NQveV6jmrOu0z8q3noJ8wNPo3hQPrrvzlR_",
      "cache-control": "no-cache"
      //"Authorization":"Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6Ik1yNS1BVWliZkJpaTdOZDFqQmViYXhib1hXMCIsImtpZCI6Ik1yNS1BVWliZkJpaTdOZDFqQmViYXhib1hXMCJ9.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTBmZjEtY2UwMC0wMDAwMDAwMDAwMDAvdmlzdHJhZGV2LnNoYXJlcG9pbnQuY29tQDBjZDFlMDhjLWMzMmMtNDhhZi04NTNmLWYyMmVlNjU0ZmVmMCIsImlzcyI6IjAwMDAwMDAxLTAwMDAtMDAwMC1jMDAwLTAwMDAwMDAwMDAwMEAwY2QxZTA4Yy1jMzJjLTQ4YWYtODUzZi1mMjJlZTY1NGZlZjAiLCJpYXQiOjE2NDQ1ODg5ODksIm5iZiI6MTY0NDU4ODk4OSwiZXhwIjoxNjQ0Njc1Njg5LCJpZGVudGl0eXByb3ZpZGVyIjoiMDAwMDAwMDEtMDAwMC0wMDAwLWMwMDAtMDAwMDAwMDAwMDAwQDBjZDFlMDhjLWMzMmMtNDhhZi04NTNmLWYyMmVlNjU0ZmVmMCIsIm5hbWVpZCI6Ijc3ZjliOTI4LWFhMzktNDEzMC1hOTM0LTQ0YWZlZmZhNTU4NUAwY2QxZTA4Yy1jMzJjLTQ4YWYtODUzZi1mMjJlZTY1NGZlZjAiLCJvaWQiOiJhMmNjMjk5OS0yMmFjLTRmYzUtYWE3NS1jZTIxZjQyYTBlYjIiLCJzdWIiOiJhMmNjMjk5OS0yMmFjLTRmYzUtYWE3NS1jZTIxZjQyYTBlYjIiLCJ0cnVzdGVkZm9yZGVsZWdhdGlvbiI6ImZhbHNlIn0.aqqaxSbGTIcTwzV0qMwsphprMwB8zdGsBoHn7pxFqamxlee676uCzWDvAr0JD3UTPDfn_RhnZgrTa0hKBOOYfzkZCR65PjVLAQBV1LyWECN-l70lUeNFrOJ-RdkaxP3bBXiVRwvLv07gqkIOcobMSg9NhtDbtwAMqaS_j6lW52hnjClqb7l-oDizm8lVpGFWRfmPEqdusaN0BJ2IHFEbgrmfv6IyyCczvPeF17SwyqufhildONq43IWBkc9GY1JdEmIaGb5jCkaN-GIauYoOsvB5CLLM8mPw8hYRzn4yDCnGC5eHgiKAYan_h72iFX01nJYdKOb6HQbA3LO0Am63og"
    });
    let params = new HttpParams();
    params = params.append("username", "vipapi");
    params = params.append("password", "Today123");
    params = params.append("grant_type", "password");
    //params = params.append("Content-Type", "application/x-www-form-urlencoded");
    let body = {
      "username": "vipapi",
      'password': 'Today123',
      "grant_type": "password",
      "Content-Type": "application/x-www-form-urlencoded",
    }
    /* let body = new FormData();
    body.append('username', 'vipapi');
    body.append('password', 'Today123');
    body.append('grant_type', 'password');
    body.append('Content-Type', 'application/x-www-form-urlencoded'); */

    let  data = "username=vipapi&password=Today123&grant_type=password&Content-Type=application%2Fx-www-form-urlencoded";
   
        data = "username=vipapi&password=Today123&grant_type=password";
        var xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        xhr.addEventListener("readystatechange", function() {
          if(this.readyState === 4) {
            console.log(this.responseText);
          }
        });
        xhr.open("POST", "https://webcountry4.clmvpcuat.vaws/rest/token");
        xhr.setRequestHeader("username", "vipapi");
        xhr.setRequestHeader("password", "Today123");
        xhr.setRequestHeader("grant_type", "password");
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.send(data);
    return this.httpClient.post(url, body, {headers: headers, withCredentials: true}).toPromise();
    //return this.httpClient.get(url, {headers: headers, withCredentials: true}).toPromise();

    // return this.httpClient.get(downloadUrl, {responseType: 'blob' as 'json', headers: headers, observe: 'response'}).toPromise();
  }

  fetchVPointDocument(bearerToken: string, fileId: string, documentFormat: string) {
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.responseType = "blob";
    let thiz = this;
    xhr.addEventListener("readystatechange", function() {
      if(this.readyState === 4) {
        let binaryData = [];
        //let dataType = this.responseType;
        let dataType = thiz.getDocumentMimeType(documentFormat);
        binaryData.push(this.response);
        let downloadLink = document.createElement('a');
        downloadLink.href = window.URL.createObjectURL(new Blob(binaryData, {type: dataType}));
        //downloadLink.href = window.URL.createObjectURL(new Blob(['<a id="a"><b id="b">hey!</b></a>'], {type : 'text/html'}));
        downloadLink.setAttribute('target', "_blank");
        document.body.appendChild(downloadLink);
        downloadLink.click();
        //thiz.presentDocumentPreviewPopover(downloadLink.href);
        window.URL.revokeObjectURL(downloadLink.href);
        downloadLink.remove();
      }
    });

    xhr.open("GET", "https://vsearch.datadmsdev.vaws/viewpoint_files/191");  //Tertius
    //xhr.open("GET", "https://apicountry4.clmvpcuat.vaws/rest/api/V8.0/DocumentManagement/File/Files/2528");
    //xhr.open("GET", "https://apicountry4.clmvpcuat.vaws/rest/api/V8.0/DocumentManagement/File/Files/" + fileId); // Mathys
    //xhr.open("GET", "https://webcountry4.clmvpcuat.vaws/rest/api/V8.0/DocumentManagement/Holders/Documents/19/1/true");


    //xhr.open("GET", "https://webcountry4.clmvpcuat.vaws/rest/api/V8.0/DocumentManagement/File/Files/" + fileId);
    //xhr.setRequestHeader("Authorization", "Bearer OHZ2-___B8UxfbYsre0wdANYJ1cYiDarINnFmvQDh6UULgd8g5d1iw58WCqyOovZJtBunnOlXNp718ZgOeAA4q-06LJWuLu4ql4Evkdgw6AWTCJ-5vqyY03PJNjJTT7dCVobPDtsAV4zq_78rrmIzNqLzsiOecrgMQf-a6VGXTyGTGa1CLQW2KSv3FrSiBjWgRqmgk8GZlZR-xY27V5_Rzu-Attf2kBl6MYxKEVy-oSFMDOZodjO1tqXX8xJqibHKcKzjDRhLClldUevdeB_RWTAEA5gksZN18mcg6WGoZpA_ZnVxgZWRBr93r3f3r9SoDXfTLPZc7dhUdBBActxYleSsims3o_V_HQma0P0FaxFOTh84edrPNMqb8Lucb1-O7H5Y3pjBrBsm7dVk1VOkj6uhxY39lDNTQwu-iAFM1PuDn_d4mjEbdzinedqKaIbDU1Ure1mjvl33YC2rWNm9mAY0NTldZebK0LmQcXqB8RrW3wnMKVAk2f2BKkYuG8F_oQKLpSbFt_nCCouY6DyBHugcYXgMUg-Sl2XZFKVtwgcip_prbEipLHnQYcGXGZf16c1FNEEOHifHJUZ8mrgU9kVEBLq411yBHcpuBspwYE6PzFSGKBYmvoUQEFVFByqhSIks6Xktnap2IwGirv-NNkliVd6u_DF1Po0sZ1fWpHidcr2aKW_3SBrcnFg4uV_oVUfMzTykhF5QIPuUndWmycty_R1dGaKtdNFvwxgTJn-DVgGm_uoPuFpdBXJrgf5F7ibpWgSUpXH1TiT_c7SZpT6qfBf8FAyB3iTDASP4vn0-0ufw8p4rlDmI_rNgnRIw-ClH_Wdt8Vb9Ue4VDvv86-95T1Ln--MJj5EfURwavKl8npqqpSckXgjEiLZoayt");
    xhr.setRequestHeader("Authorization", "Bearer " + bearerToken);
    xhr.send();
  }

  fetchIManageDocument(fileId: string, documentFormat: string) {
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.responseType = "arraybuffer";
    let thiz = this;
    xhr.addEventListener("readystatechange", function() {
      if(this.readyState === 4) {
        let binaryData = [];
        let dataType = this.responseType;
        //let dataType = thiz.getDocumentMimeType(documentFormat);
        binaryData.push(this.response);
        let downloadLink = document.createElement('a');
        downloadLink.href = window.URL.createObjectURL(new Blob(binaryData, {type: "text/html"}));
        //downloadLink.href = window.URL.createObjectURL(new Blob(['<a id="a"><b id="b">hey!</b></a>'], {type : 'text/html'}));
        downloadLink.setAttribute('target', "_blank");
        document.body.appendChild(downloadLink);
        downloadLink.click();
        //thiz.presentDocumentPreviewPopover(downloadLink.href);
        window.URL.revokeObjectURL(downloadLink.href);
        downloadLink.remove();
      }
    });

    xhr.open("GET", "https://sgpimanage.vistra.com/work/web/r/libraries/VTS/folders/VTS!89064?p=1&selectedItem=VTS!446741.1");
    // xhr.setRequestHeader("Authorization", "Bearer " + bearerToken);
    xhr.send();
  }


  presentDocumentPreviewPopover(src: string) {
    const popover = this.popoverCtrl.create(
      DocumentViewerPage, { "src": src}, { cssClass: "preview-popover"});
    popover.present();
  }


  getDocumentMimeType(documentFormat): string {
    let mimeType = "application/octet-stream";

    this.getPdfFilter().forEach((filter: string) => {
      if (filter.includes(documentFormat)) {
        mimeType = "application/pdf";
      }
    });
    this.getExcelFilter().forEach((filter: string) => {
      if (filter.includes(documentFormat)) {
        mimeType = "application/pdf";
      }
    });
    this.getWordFilter().forEach((filter: string) => {
      if (filter.includes(documentFormat)) {
        mimeType = "application/msword";  //break out of this loop here
      }
    });
    return mimeType;
  }

  downloadVPointFile(downloadUrl: string) {
    let headers = new HttpHeaders({
      "username": "vipapi",
      'password': 'Today123',
      "grant_type": "password",
      "Content-Type": "application/x-www-form-urlencoded",
    });
    //headers = headers.set('Access-Control-Allow-Origin', '*');
    return this.httpClient.post(downloadUrl, {}, {headers: headers, withCredentials: true}).toPromise();

    // return this.httpClient.get(downloadUrl, {responseType: 'blob' as 'json', headers: headers, observe: 'response'}).toPromise();
  }

  elasticSearchOffline() {
    return this.httpClient.get('assets/elasticsearchTestData.json').toPromise();
  }

  getMonthsAgo(months: number) {
    let date = new Date();
    return formatISO(subMonths(date, months));
  }

  getNow() {
    //return t.substring(0,t.lastIndexOf(":") + 3);
    return formatISO(new Date());
  }


  /*post(urlSegment: string, body: any) {
    return this.httpClient
      .post(this._backend.baseUrl + urlSegment, body, {headers: this.headers, withCredentials: true})
      .pipe(catchError(this.httpUtilsProvider.handleError));
  }*/

}
