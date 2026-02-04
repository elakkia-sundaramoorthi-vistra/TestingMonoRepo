import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';



@IonicPage()
@Component({
  selector: 'page-document-viewer',
  templateUrl: 'document-viewer.html',
})
export class DocumentViewerPage implements OnInit {
  @ViewChild('documentContainer') documentContainer: ElementRef;

  src: any;
  element: any;

  constructor(private domSanitizer: DomSanitizer, public navParams: NavParams) {
  }
  ngOnInit(): void {
    //this.setupIFrame();
    //this.src = this.transform(this.navParams.get("src"));
    // this.src = "data:application/pdf;" + this.navParams.get("src");
    this.src = this.navParams.get("src");
    this.setupIFrameAsInnerHTML(this.src);
  }

  transform(url) {
    return this.domSanitizer.bypassSecurityTrustResourceUrl(url);
    //return this.domSanitizer.bypassSecurityTrustResourceUrl("https://fr.wikipedia.org/wiki/Main_Page");
  }

  setupIFrameAsInnerHTML(src: any) {
    this.element = this.domSanitizer.bypassSecurityTrustHtml('<iframe #documentContainer [src]="' + src + '"></iframe>');
  }

  setupIFrame() {
    //this.documentContainer.nativeElement.setAttribute('src', this.src);
    let iFrame = document.createElement("iframe");
    iFrame.src = this.src;
    this.documentContainer.nativeElement.innerHTML = "Tester"; // (optional) Totally Clear it if needed
    this.documentContainer.nativeElement.appendChild(iFrame);

    let iFrameDoc = iFrame.contentWindow && iFrame.contentWindow.document;
    if (!iFrameDoc) {
      console.log("iFrame security.");
      return;
    }
    iFrameDoc.write(this.documentContainer.nativeElement);
    iFrameDoc.close();
  }
}
