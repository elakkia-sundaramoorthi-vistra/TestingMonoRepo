import { Injectable } from '@angular/core';
import { AuthConfig } from 'angular-oauth2-oidc';

import { OAuthService, JwksValidationHandler } from 'angular-oauth2-oidc';
import { ApiProvider } from '../api/api';

export const authCodeFlowConfig: AuthConfig = {
  // Url of the Identity Provider
  // issuer: 'https://dms.datadmsdev.vaws/auth/realms/alfresco',
  issuer: 'https://vsearch.datadmsdev.vaws/auth/realms/alfresco',

  // URL of the SPA to redirect the user to after login
  redirectUri: window.location.origin + '/home',

  // The SPA's id. The SPA is registerd with this id at the auth-server
  // clientId: 'server.code',
  clientId: 'vsearch',

  // Just needed if your auth server demands a secret. In general, this
  // is a sign that the auth server is not configured with SPAs in mind
  // and it might not enforce further best practices vital for security
  // such applications.
  // dummyClientSecret: 'secret',

  responseType: 'code',

  // set the scope for the permissions the client should request
  // The first four are defined by OIDC.
  // Important: Request offline_access to get a refresh token
  // The api scope is a usecase specific one
  scope: 'openid profile email',

  showDebugInformation: true,
};
@Injectable()
export class AuthProvider {

  constructor(private api: ApiProvider, private oauthService: OAuthService) { }

  init() {
    this.oauthService.initImplicitFlow();
    this.oauthService.configure(authCodeFlowConfig);
    this.oauthService.loadDiscoveryDocumentAndTryLogin()
      .then(data => {
        console.log("Initialised OAuth:", data);
      });
  }

  getUserDetails() {
    return this.api.getUserDetails();
  }

  /* fetchVPointBearerToken() {
    return this.api.fetchVPointBearerToken();
  } */

  fetchVPointBearerToken() {
    return new Promise((resolve, reject) => {
      let data = "username=vipapi&password=Today123&grant_type=password";
      var xhr = new XMLHttpRequest();
      xhr.withCredentials = true;
      xhr.addEventListener("readystatechange", function() {
        if(this.readyState === 4) {
          if((this.responseText.length < 1) || (JSON.parse(this.responseText)["access_token"] == null)) {
            console.log("VPoint: No access_token found!");
          } else {
            let token = JSON.parse(this.responseText)["access_token"];
            if(token && token.length > 0) {
              resolve(token);
            } else {
              reject(new Error('Failed to retrieve bearer token'));
            }
          }
        }
      });
      //xhr.open("POST", "https://webcountry4.clmvpcuat.vaws/rest/token");
      xhr.open("POST", "https://apicountry4.clmvpcuat.vaws/rest/token");  // Mathys
      xhr.setRequestHeader("username", "vipapi");
      xhr.setRequestHeader("password", "Today123");
      xhr.setRequestHeader("grant_type", "password");
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      xhr.send(data);
    });
  }
}
