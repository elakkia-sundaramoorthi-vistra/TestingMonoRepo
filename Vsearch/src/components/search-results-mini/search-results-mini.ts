import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'search-results-mini',
  templateUrl: 'search-results-mini.html'
})
export class SearchResultsMiniComponent {
  @Input() items: string;
  @Output() itemSelected: EventEmitter<{ "event": any, "item": any }> = new EventEmitter<{ "event": any, "item": any }>();

  text: string;

  constructor() {
    this.text = 'Hello World';
  }

}
