import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastController } from 'ionic-angular';

export enum ENVIRONMENTS {
  DEV = "dev",
  STAGING = "staging",
  PRODUCTION = "prod",
}

@Injectable()
export class UtilsProvider {
  genericPopoverItems: Array<{ "icon": string, "value": string, "label": string }> = [];
  genericPopoverHeader: string = "Actions";
  isIe11 = !(window["ActiveXObject"]) && "ActiveXObject" in window;

  constructor(private  toastCtrl: ToastController) { }

  showToast(message: string, duration: number = 0, cssClass: string = "default-toast", position = "middle") {
    let toastOptions = {
      message: message,
      position: position,
      cssClass: cssClass
    };
    if(duration > 0) {
      toastOptions["duration"] = duration;
    }
    const toast = this.toastCtrl.create(toastOptions);
    toast.present();
  }

}
