import { Injectable } from '@angular/core';

import { ApiProvider } from '../api/api';
import { ApiSettingsProvider, SEARCH_FILTER_SET } from '../api-settings/api-settings';
import { startOfDay } from 'date-fns';

interface SOURCE_DMS_LIST {
  SHAREPOINT: "SP",
  IMANAGE: "IM",
  V_ENTERPRISE: "VM",
  V_POINT: "VP",
  V_FORCE: "VF",
  OTHER: "NA"
}

interface PAGINATION_INSTRUCTION {
  direction: 'prev' | 'next' | 'skipToPage',
  pageNumber: number
};

interface PAGING_SETTINGS {
  "resultsPerPage": number,
  "skipCount": number,
  'direction': 'prev' | 'next' | 'skipToPage' | 'reset',
  'pageNumber': number,
  'pages': Array<number>
}

export enum SORT_ORDER {
  AUTHOR_DESCENDING = "authorDescending",
  AUTHOR_ASCENDING = "authorAscending",
  NEWEST_FIRST = "newestFirst",
  OLDEST_FIRST = "oldestFirst",
  TITLE_ASCENDING = "titleAscending",
  TITLE_DESCENDING = "titleDescending",
  "RELEVANCE" = "relevance"
}

interface SORTING_SETTINGS {
  order: SORT_ORDER,
  title: string,
  iconName?: string
}

export interface SEARCH_RESULT {
  "author": string,
  "createdAt": string,
  "modifiedAt": string,
  "title": string,
  "format": string,
  "language": string,
  "documentUrl": string,
  "downloadUrl": string,
  "previewBase64": string,
  "dmsName": string,
  "clientCode": string,
  "clientName": string,
  "jurisdiction": string,
  "id": string,
  "subject": string,
  "description": string,
  "recipients": string,
  "classification": string,
  "reviewDate": string,
  "registerFiling": string,
  "documentExpiry": string,
  "retention": string,
  "taxLevel0": string,
  "taxLevel1": string,
  "taxLevel2": string,
  "taxLevel3": string,
  "taxLevel4": string,
  "taxLevel5": string,
  "taxLevel6": string,
  "taxLevel7": string,
  "expanded": boolean
}
interface FLOATING_PAGINATION_COORDINATES {
  "start": number,
  "middle": number,
  "end": number,
  "pageCount": number
}

@Injectable()
export class SearchProvider {
  searchKeyword: string = "";
  targetSystem: "ALFRESCO" | "ELASTIC" = "ELASTIC";
  results: Array<SEARCH_RESULT> = [];
  // Populate with aggregate values fetched by apiProvider.elasticSearch(query: string, sortOrder)
  aggregates = {
    byMe: 0,
    byOthers: 0,
    created6MonthsAgo: 0,
    created12MonthsAgo: 0,
    createdInCustomDateRange: 0,
    modified6MonthsAgo: 0,
    modified12MonthsAgo: 0,
    modifiedInCustomDateRange: 0,
    vForce: 0,
    vPoint: 0,
    vEnterprise: 0,
    sharepoint: 0,
    iManage: 0,
    word: 0,
    excel:0,
    powerpoint: 0,
    pdf: 0
  }
  selectedDocument: SEARCH_RESULT = {
    "author": "N/A",
    "createdAt": "N/A",
    "modifiedAt": "N/A",
    "title": "Document Title",
    "format": "N/A",
    "language": "N/A",
    "documentUrl": "N/A",
    "downloadUrl": "N/A",
    "previewBase64": "",
    "dmsName": "N/A",
    "clientCode": "N/A",
    "clientName": "N/A",
    "id": "N/A",
    "jurisdiction": "N/A",
    "subject": "N/A",
    "description": "N/A",
    "recipients": "N/A",
    "classification": "N/A",
    "reviewDate": "N/A",
    "registerFiling": "N/A",
    "documentExpiry": "N/A",
    "retention": "N/A",
    "taxLevel0": "N/A",
    "taxLevel1": "N/A",
    "taxLevel2": "N/A",
    "taxLevel3": "N/A",
    "taxLevel4": "N/A",
    "taxLevel5": "N/A",
    "taxLevel6": "N/A",
    "taxLevel7": "N/A",
    "expanded": false
  }
  elasticSearchFilters = [];
  paginationSettings:PAGING_SETTINGS = {
    "resultsPerPage": 10,
    "skipCount": 0,
    'direction': 'skipToPage',
    'pageNumber': 1,
    'pages': []
  };
  pagination = {
    "totalItems": 0,
    'count': 0,
    "skipCount": 0,
    'maxItems': this.paginationSettings.resultsPerPage,
    'hasMoreItems': false,
    'lastPage': 10
  };
  // sortOrder: SORT_ORDER = SORT_ORDER.NEWEST_FIRST;
  sortingSettings: SORTING_SETTINGS = {
    order: SORT_ORDER.RELEVANCE,
    title: ""
  }
  dateCreatedLabel: string = "";
  dateModifiedLabel: string = "";
    floatingPaginationCoordinates: FLOATING_PAGINATION_COORDINATES = {
    "start": 1,
    "middle": 0,
    "end": 1,
    "pageCount": 1,
  }

  floatingPages: Array<{
    "logoSegment": string,
    "page": number,
  }> = [];

  constructor(private api: ApiProvider, private apiSettingsProvider: ApiSettingsProvider) { }

  downloadFile(file: string) {
    return this.api.downloadFile(file);
  }

  downloadVPointFile(url: string) {
    return this.api.downloadVPointFile(url);
  }

  search(offlineSearch: boolean = false) {
    if (offlineSearch) {
      return this.api.searchOffline();
    } else {
      return this.api.search(this.searchKeyword, this.paginationSettings.resultsPerPage);
    }
  }

  elasticSearch(offlineSearch: boolean = false) {
    if (offlineSearch) {
      switch (this.targetSystem) {
        case "ALFRESCO":
          return this.api.searchOffline();
        case "ELASTIC":
          return this.api.elasticSearchOffline();
      }
    } else {
      //this.getElasticSearchFilters();
      if (this.apiSettingsProvider.filteringCriteria.customFilter) {
        return this.applyAdvancedFilter();
      } else {
        return this.api.elasticSearch(this.searchKeyword, this.getElasticSearchSortOrder());
      }
    }
  }

  applyAdvancedFilter() {
    return this.api.elasticSearch(this.searchKeyword, this.getElasticSearchSortOrder());
  }

  setElasticSearchPageStart(newPageNumber: number) {
    /* this.apiSettingsProvider.pagination.from = 0;
    this.apiSettingsProvider.pagination.pageNumber = newPageNumber;
    if(this.apiSettingsProvider.pagination.pageNumber > 1 && this.apiSettingsProvider.pagination.from <= this.apiSettingsProvider.pagination.totalItems) {
      this.apiSettingsProvider.pagination.from = this.apiSettingsProvider.pagination.pageNumber * this.apiSettingsProvider.pagination.resultsPerPage;
    } */

    if(this.apiSettingsProvider.pagination.pageNumber > 1) {
     this.apiSettingsProvider.pagination.from = (this.apiSettingsProvider.pagination.pageNumber - 1) * this.apiSettingsProvider.pagination.resultsPerPage;
      if(this.apiSettingsProvider.pagination.from >= this.apiSettingsProvider.pagination.totalItems) {
        this.apiSettingsProvider.pagination.from = (this.apiSettingsProvider.pagination.totalItems - this.apiSettingsProvider.pagination.resultsPerPage);
      }
    } else {
      this.apiSettingsProvider.pagination.from = 0;
    }
/*     if(pageNumber >= 0 && pageNumber < this.apiSettingsProvider.pagination.pages.length) {
      this.apiSettingsProvider.pagination.from = this.apiSettingsProvider.pagination.totalItems
      this.pagination.maxItems * (this.paginationSettings.pageNumber - 1)
    }
 */  }

  getElasticSearchFilters() {
    this.elasticSearchFilters = [];
    this.getElasticSearchDateFilters();
    this.getElasticSearchUserFilters();
    this.getElasticSearchSourceDMSFilters();
    this.getElasticSearchDocTypeFilters();
  }

  getElasticSearchDateFilters() {
    let filter = "";
    if (this.apiSettingsProvider.filteringCriteria.createdLastSixMonths) {
      filter += " AND cm\\:created:[NOW/DAY-6MONTHS TO NOW/DAY+1DAY]"
    }
    if (this.apiSettingsProvider.filteringCriteria.createdLastYear) {
      filter += " AND cm\\:created:[NOW/DAY-12MONTHS TO NOW/DAY+1DAY]"
    }
    if (this.apiSettingsProvider.filteringCriteria.modifiedLastSixMonths) {
      filter += " AND cm\\:modified:[NOW/DAY-6MONTHS TO NOW/DAY+1DAY]"
    }
    if (this.apiSettingsProvider.filteringCriteria.modifiedLastYear) {
      filter += " AND cm\\:modified:[NOW/DAY-12MONTHS TO NOW/DAY+1DAY]"
    }
    return filter;
  }

  getElasticSearchUserFilters() {
    if (this.apiSettingsProvider.filteringCriteria.createdByMe) {
      this.elasticSearchFilters.push({ "term":  { "Author": "admin" }});
    }
  }

  getElasticSearchSourceDMSFilters() {
    /* 2021-12-28: only VForce and SharePoint are implemented */
    if(this.apiSettingsProvider.filteringCriteria.dmsVForce) {
      this.elasticSearchFilters.push({ "term":  { "DMSName": "VForce" }});
      //filter += " TAG:\"salesforce\" OR";
    }
    if(this.apiSettingsProvider.filteringCriteria.dmsSharepoint) {
      this.elasticSearchFilters.push({ "term":  { "DMSName": "SharePoint" }});
    }
    if(this.apiSettingsProvider.filteringCriteria.dmsVEnterprise) {
      //filter += " TAG:\"enterprise\" OR";  // Need to change to correct tag string
    }
    if(this.apiSettingsProvider.filteringCriteria.dmsVPoint) {
      //filter += " TAG:\"vpoint\"";  // Need to change to correct tag string
    }
    if(this.apiSettingsProvider.filteringCriteria.dmsOther) {
      this.elasticSearchFilters.push({ "term":  { "DMSName": "NA" }});
    }
    return this.elasticSearchFilters;
  }

  getElasticSearchDocTypeFilters() {
    let filter = "";
    if (this.apiSettingsProvider.filteringCriteria.docTypeWord) {
      this.elasticSearchFilters.push({ "term":  { "Format": "DOC" }});
    }
    if (this.apiSettingsProvider.filteringCriteria.docTypeExcel) {
      this.elasticSearchFilters.push({ "term":  { "Format": "EXCEL" }});
    }
    if (this.apiSettingsProvider.filteringCriteria.docTypePdf) {
      this.elasticSearchFilters.push({ "term":  { "Format": "PDF" }});
    }
    // Add "Others here"
    if (this.apiSettingsProvider.filteringCriteria.docTypePowerpoint) {
      this.elasticSearchFilters.push({ "term":  { "Format": "PowerPoint" }});
    }
    if (this.apiSettingsProvider.filteringCriteria.docTypePowerpoint) {
      this.elasticSearchFilters.push({ "term":  { "Format": "NA" }});
    }
    return filter;
  }

  getElasticSearchSortOrder() {
    let sortBy = [];
    switch (this.sortingSettings.order) {
      case SORT_ORDER.NEWEST_FIRST:
        sortBy = [{"CreatedDate": {"order": "desc"}}];
        break;
      case SORT_ORDER.OLDEST_FIRST:
        sortBy = [{"CreatedDate": {"order": "asc"}}];
        break;
      case SORT_ORDER.AUTHOR_ASCENDING:
        sortBy =  [{"Author.raw": {"order": "asc"}}];
        break;
      case SORT_ORDER.AUTHOR_DESCENDING:
        sortBy = [{"Author.raw": {"order": "desc"}}];
        break;
      case SORT_ORDER.TITLE_ASCENDING:
        sortBy = [{"Title.raw": {"order": "asc"}}];
        break;
      case SORT_ORDER.TITLE_DESCENDING:
        sortBy = [{"Title.raw": {"order": "desc"}}];
        break;
      case SORT_ORDER.RELEVANCE:
        sortBy = [{"_score": {"order": "desc"}}];
        break;

      default:
        break;
    }
    return sortBy;
  }
  setupPagination() {
    this.paginationSettings.pages = [];
    let pageCount = Math.floor(this.pagination.totalItems / this.pagination.maxItems);
    for(var i = 1;i<=pageCount;i++) {
      this.paginationSettings.pages.push(i);
    }
    if(this.pagination.totalItems % this.pagination.maxItems > 0) {
      this.paginationSettings.pages.push(this.paginationSettings.pages.length + 1);
    }
  }

  setupElasticPagination() {
    this.paginationSettings.pages = [];
    this.apiSettingsProvider.pagination.pages = [];
    let pageCount = Math.floor(this.apiSettingsProvider.pagination.totalItems / this.apiSettingsProvider.pagination.resultsPerPage);
    for(var i = 1;i<=pageCount;i++) {
      this.apiSettingsProvider.pagination.pages.push(i);
    }
    this.updateEnumerator();
    if((this.apiSettingsProvider.pagination.totalItems % this.apiSettingsProvider.pagination.resultsPerPage) > 0) {
      this.apiSettingsProvider.pagination.pages.push(this.apiSettingsProvider.pagination.pages.length + 1);
    }
    this.apiSettingsProvider.pagination.allPages = this.apiSettingsProvider.pagination.pages;
    this.apiSettingsProvider.pagination.pages = this.apiSettingsProvider.pagination.pages.slice(0, this.pagination.lastPage);
    this.setPageNumber();
  }

  setupFloatingElasticPagination() {
    this.setPageEndGuard();
    this.updateEnumerator();
    let logoSegments = [
      '../../assets/imgs/pagination/VSearch_BLANK.png', '../../assets/imgs/pagination/VSearch_V.png',
      '../../assets/imgs/pagination/VSearch_S.png', '../../assets/imgs/pagination/VSearch_E.png',
      '../../assets/imgs/pagination/VSearch_A.png', '../../assets/imgs/pagination/VSearch_R.png',
      '../../assets/imgs/pagination/VSearch_C.png', '../../assets/imgs/pagination/VSearch_H.png',
      '../../assets/imgs/pagination/VSearch_BLANK.png', '../../assets/imgs/pagination/VSearch_BLANK.png'
    ];
    let pages: Array<number> = this.getPages2();
    this.floatingPages = [];
    for (let index = 0; index < 5; index++) {
      this.floatingPages.push({
        logoSegment: logoSegments[index],
        page: pages[index]
      });
    }
    }

  getPages() {
    //let pageCount = Math.floor(this.apiSettingsProvider.pagination.totalItems / this.apiSettingsProvider.pagination.resultsPerPage);
    let { start, end } = this.setFloatingPaginationCoordinates();
    let pageCount = this.getPageCount();
    let pages: Array<number> = [];
    let j = 0;
    /* for (var i = 0; i < start; i++) {
      pages.push(0);
    } */
    for (j = start; j < end; j++) {
      pages.push(j);
    }
    for (var k = j; k < pageCount; k++) {
      pages.push(k);
    }
    return pages;
  }

  setPageEndGuard() {
    //let pageCount = Math.floor(this.apiSettingsProvider.pagination.totalItems / this.apiSettingsProvider.pagination.resultsPerPage);
    let pageCount = this.getPageCount();
    if(this.apiSettingsProvider.pagination.pageNumber > pageCount) {
      this.apiSettingsProvider.pagination.pageNumber = pageCount;
    }
  }

  getPages2() {
    let { start, end } = this.setFloatingPaginationCoordinates();
    let pages: Array<number> = [];
    for(let i = this.apiSettingsProvider.pagination.pageNumber; i>=start;i--) {
      pages.unshift(i);
    }
    for(let i = (this.apiSettingsProvider.pagination.pageNumber + 1); i<=end;i++) {
      pages.push(i);
    }
    //this.setAllPages(Object.assign(new Array(), ...pages), start);  // Legacy code to accommodate boundary check in SearchResultsPage.goToNextPage(). Rather work with pageCount
    return pages.slice(0, 10);
  }

  setAllPages(partialPageArray, start: number) {
    for(let i = start; i>0; i--) {
      partialPageArray.unshift(i);
    }
    this.apiSettingsProvider.pagination.allPages = partialPageArray;
  }

  private setFloatingPaginationCoordinates() {
    let start = (this.apiSettingsProvider.pagination.pageNumber < 6) ? 1 : (this.apiSettingsProvider.pagination.pageNumber - 4);

    /* if((pageCount - this.apiSettingsProvider.pagination.pageNumber) < 5) {
      console.log("End -> pageCount");
      end = pageCount
    } else{
      console.log("End is not pageCount. Start/pageCount:", start, "/", pageCount);
      end = this.apiSettingsProvider.pagination.pageNumber + 5;
      if((pageCount - start) < 10) {
        end = start + 10;
      }
    } */
    //let end = ((pageCount - this.apiSettingsProvider.pagination.pageNumber) < 5) ? pageCount : (this.apiSettingsProvider.pagination.pageNumber + 4);
    let end: number = this.getPageCount();
    return { start, end };
  }

  getPageCount() {
    let pageCount = Math.floor(this.apiSettingsProvider.pagination.totalItems / this.apiSettingsProvider.pagination.resultsPerPage);
    if((this.apiSettingsProvider.pagination.totalItems % this.apiSettingsProvider.pagination.resultsPerPage) > 0) {
     pageCount++;
    }
    return pageCount;
  }

  updateEnumerator() {
    //this.apiSettingsProvider.pagination.enumerator = this.results.length;
    if(this.apiSettingsProvider.pagination.pageNumber < 2) {
      this.apiSettingsProvider.pagination.enumerator = this.results.length;
    } else {
      let previousResults = ((this.apiSettingsProvider.pagination.pageNumber - 1) * this.apiSettingsProvider.pagination.resultsPerPage);
      this.apiSettingsProvider.pagination.enumerator =  previousResults + this.results.length;
    }
  }

  setPageNumber() {
    if(this.apiSettingsProvider.pagination.pageNumber > this.apiSettingsProvider.pagination.pages.length) {
      this.apiSettingsProvider.pagination.pageNumber = this.apiSettingsProvider.pagination.pages.length;
    }
    else {
      this.apiSettingsProvider.pagination.pageNumber = this.apiSettingsProvider.pagination.pageNumber;
    }
}

  resetPagination() {
    this.paginationSettings.skipCount = 0;
    this.paginationSettings.direction = 'reset';
    this.paginationSettings.pageNumber = 1;
  }

  extractElasticSearchResults(elasticSearchHits = []): Array<SEARCH_RESULT> {
    let entries: Array<SEARCH_RESULT> = [];
    switch (this.targetSystem) {
      case "ELASTIC":
        elasticSearchHits.forEach(entry => {
          const dms = this.getFormattedFieldValue(entry["_source"]["DMSName"]);
          entries.push({
            //"author"        : (dms == "SharePoint")?this.getFormattedAuthorValue(entry["_source"]["Author"]):this.getFormattedFieldValue(entry["_source"]["Author"]),
            "author"        : this.getFormattedAuthorValue(entry["_source"]["Author"]),
            "createdAt"     : this.getFormattedFieldValue(entry["_source"]["CreatedDate"]),
            "modifiedAt"    : this.getFormattedFieldValue(entry["_source"]["ModifiedDate"]),
            "title"         : this.getFormattedFieldValue(entry["_source"]["Title"]),
            "format"        : this.getFormattedFieldValue(entry["_source"]["Format"]),
            "language"      : this.getFormattedFieldValue(entry["_source"]["Language"]),
            "documentUrl"   : this.getFormattedFieldValue(entry["_source"]["FullUrl"]),
            "downloadUrl"   : this.getFormattedFieldValue(entry["_source"]["DownloadUrl"]),
            "previewBase64" : this.getFormattedFieldValue(entry["_source"]["renditionData"]),
            "dmsName"       : this.getFormattedFieldValue(entry["_source"]["DMSName"]),
            "clientCode"    : this.getFormattedClientCodeValue(entry["_source"]["ClientCode"]),
            "clientName"    : this.getFormattedFieldValue(entry["_source"]["ClientName"]),
            "id"            : this.getFormattedFieldValue(entry["_source"]["id"]),
            "jurisdiction"  : this.getFormattedFieldValue(entry["_source"]["Jurisdiction"]),
            "subject"       : this.getFormattedFieldValue(entry["_source"]["Subject"]),
            "description"   : this.getFormattedFieldValue(entry["_source"]["Description"]),
            "recipients"    : this.getFormattedFieldValue(entry["_source"]["Recipients"]),
            "classification": this.getFormattedFieldValue(entry["_source"]["DocClassification"]),
            "reviewDate"    : this.getFormattedFieldValue(entry["_source"]["ReviewDate"]),
            "registerFiling": this.getFormattedFieldValue(entry["_source"]["RegisterFiling"]),
            "documentExpiry": this.getFormattedFieldValue(entry["_source"]["DocumentExpiry"]),
            "retention"     : this.getFormattedFieldValue(entry["_source"]["Retention"]),
            "taxLevel0"     : this.getFormattedFieldValue(entry["_source"]["TaxLevel0"]),
            "taxLevel1"     : this.getFormattedFieldValue(entry["_source"]["TaxLevel1"]),
            "taxLevel2"     : this.getFormattedFieldValue(entry["_source"]["TaxLevel2"]),
            "taxLevel3"     : this.getFormattedFieldValue(entry["_source"]["TaxLevel3"]),
            "taxLevel4"     : this.getFormattedFieldValue(entry["_source"]["TaxLevel4"]),
            "taxLevel5"     : this.getFormattedFieldValue(entry["_source"]["TaxLevel5"]),
            "taxLevel6"     : this.getFormattedFieldValue(entry["_source"]["TaxLevel6"]),
            "taxLevel7"     : this.getFormattedFieldValue(entry["_source"]["TaxLevel7"]),
            "expanded"      : false
          });
        })
        break;
      case "ALFRESCO":
        break;
      default:
        break;
    }
    return entries;
  }

  /*
    Temporary convenience method to get around current snag with unsanitary author name field data.
    Rather call getFormattedFieldValue(...) as with other fields
   */
  getFormattedAuthorValue(rawFieldValue) {
    /* if(rawFieldValue == null) {
      rawFieldValue = "NA";
    }
    let returnValue = "";
    switch (true) {
      case true && rawFieldValue.includes("chitrakala"):
        returnValue = "chitrakala uthayakumar";
        break;
      case true && rawFieldValue.includes("david.doig"):
        returnValue = "David Doig";
        break;
      default:
        returnValue = (rawFieldValue == "NA") || (rawFieldValue == "Not Applicable") || (rawFieldValue == "") || (rawFieldValue == null) ? "N/A" : rawFieldValue;
        break;
    }
    //console.log("Formatting... Author:", rawFieldValue, "becomes", returnValue);
    return returnValue.replace(".", " "); */
    if ((rawFieldValue == "NA") || (rawFieldValue == "Not Applicable") || (rawFieldValue == "") || (rawFieldValue == null)) {
      return "N/A"
    } else {
      // VPoint returns author name with dot instead of space
      return rawFieldValue.replace(".", " ");
    }
  }

  getFormattedFieldValue(rawFieldValue) {
    return (rawFieldValue == "NA") || (rawFieldValue == "Not Applicable") || (rawFieldValue == "") || (rawFieldValue == null) ? "N/A" : rawFieldValue;
  }

  getFormattedClientCodeValue(rawFieldValue) {
    return (rawFieldValue == "NA") || (rawFieldValue == "Not Applicable") || (rawFieldValue == "") || (rawFieldValue == null) ? "N/A" : rawFieldValue;
  }

  filter = () => {
    return this.api.filter(this.searchKeyword, this.getFilters(), this.getSourceDMSFilters(), this.getDocTypeFilters(), this.getSortOrder(), this.paginationSettings.resultsPerPage, this.getSkipCount());
  }

  getSkipCount() {
    let skipCount = 0;
    switch (this.paginationSettings.direction) {
      case 'prev':
        skipCount = this.getPreviousPageSkipCount();
        break;
      case 'next':
        skipCount = this.getNextPageSkipCount();
        break;
      case 'skipToPage':
        skipCount = this.getSkipToPageSkipCount();
        break;
      case 'reset':
        skipCount = 0;
        break;
      default:
        break;
    }
    return skipCount;
  }

  getNextPageSkipCount() {
    let skipCount = this.pagination.skipCount + this.getLastPageSkipCount();
    if(skipCount > this.pagination.totalItems) {
      skipCount = this.pagination.totalItems - this.pagination.maxItems; // Last page
    }
    return skipCount;
  }

  getLastPageSkipCount() {
    if (this.pagination.count < this.pagination.maxItems) {
      return this.pagination.count;
    } else {
      return this.pagination.maxItems;
    }
  }

  getPreviousPageSkipCount() {
    let skipCount = this.pagination.skipCount - this.pagination.maxItems;
    if(skipCount < 1) {
      skipCount = 0; // First page
    }
    return skipCount;
  }

  getSkipToPageSkipCount() {
    return this.pagination.maxItems * (this.paginationSettings.pageNumber - 1);
  }

  getFilters() {
    let filter = "";
    if (this.apiSettingsProvider.filteringCriteria.createdLastSixMonths) {
      filter += " AND cm\\:created:[NOW/DAY-6MONTHS TO NOW/DAY+1DAY]"
    }
    if (this.apiSettingsProvider.filteringCriteria.createdLastYear) {
      filter += " AND cm\\:created:[NOW/DAY-12MONTHS TO NOW/DAY+1DAY]"
    }
    if (this.apiSettingsProvider.filteringCriteria.modifiedLastSixMonths) {
      filter += " AND cm\\:modified:[NOW/DAY-6MONTHS TO NOW/DAY+1DAY]"
    }
    if (this.apiSettingsProvider.filteringCriteria.modifiedLastYear) {
      filter += " AND cm\\:modified:[NOW/DAY-12MONTHS TO NOW/DAY+1DAY]"
    }
    if (this.apiSettingsProvider.filteringCriteria.createdByMe) {
      filter += " AND cm\\:creator:admin";
    }
    return filter;
  }

  getSourceDMSFilters() {
    let filter = "";
    if(this.apiSettingsProvider.filteringCriteria.dmsVForce) {
      filter += " TAG:\"salesforce\" OR";
    }
    if(this.apiSettingsProvider.filteringCriteria.dmsSharepoint) {
      filter += " TAG:\"sharepoint\" OR";
    }
    if(this.apiSettingsProvider.filteringCriteria.dmsVEnterprise) {
      filter += " TAG:\"enterprise\" OR";  // Need to change to correct tag string
    }
    if(this.apiSettingsProvider.filteringCriteria.dmsVPoint) {
      filter += " TAG:\"vpoint\"";  // Need to change to correct tag string
    }
    return filter;
  }

  getDocTypeFilters() {
    let filter = "";
    if (this.apiSettingsProvider.filteringCriteria.docTypeWord) {
      filter += "content.mimetype:'application/vnd.openxmlformats-officedocument.wordprocessingml.document' OR content.mimetype:'application/msword'";
    }
    if (this.apiSettingsProvider.filteringCriteria.docTypeExcel) {
      filter += "OR content.mimetype:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' OR content.mimetype:'application/vnd.ms-excel'";
    }
    if (this.apiSettingsProvider.filteringCriteria.docTypePdf) {
      filter += " OR content.mimetype:'application/pdf'";
    }
    if (this.apiSettingsProvider.filteringCriteria.docTypePowerpoint) {
      filter += " OR content.mimetype:'application/vnd.ms-powerpoint'";
    }
    return filter;
  }

  getSortOrder() {
    let sortBy = null;
    switch (this.sortingSettings.order) {
      case SORT_ORDER.NEWEST_FIRST:
        sortBy = {"type":"FIELD", "field":"cm:created", "ascending":"false"}
        break;
      case SORT_ORDER.OLDEST_FIRST:
        sortBy = {"type":"FIELD", "field":"cm:created", "ascending":"true"}
        break;
      case SORT_ORDER.AUTHOR_ASCENDING:
        sortBy =  {"type":"FIELD", "field":"cm:creator", "ascending":"true"}
        break;
      case SORT_ORDER.AUTHOR_DESCENDING:
        sortBy = {"type":"FIELD", "field":"cm:creator", "ascending":"false"}
        break;

      default:
        break;
    }
    return sortBy;
  }

  downloadDocument(url: string) {
    return this.api.downloadDocument(url).toPromise();
  }

  fetchVPointDocument(bearerToken: string, fileId: string, fileFormat: string) {
    return this.api.fetchVPointDocument(bearerToken, fileId, fileFormat);
  }

  fetchIManageDocument(fileId: string, documentFormat: string) {
    return this.api.fetchIManageDocument(fileId, documentFormat);
  }
}
