import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface User {
  username: string,
  email: string,
  preferredUsername: string
}
import { ApiProvider } from '../api/api';
@Injectable()
export class UserProvider {
  currentUser: User = { "username": "Anonymous", email: "anonymous@vistra.com", preferredUsername: "Anonymous User"};
  constructor(private api: ApiProvider) { }

  login(body: string) {
    return this.api.login(body);
  }

  setAuthTicket(ticket: string) {
    this.api.authTicket = ticket;
  }

}
