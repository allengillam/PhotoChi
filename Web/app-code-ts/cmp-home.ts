/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../node_modules/@types/knockout/index.d.ts" />
/// <reference path="../node_modules/firebase/index.d.ts" />

namespace gm.Components.Home {

    export class HomePageViewModel {

        status: KnockoutObservable<Status.StatusModel>;
        auth: KnockoutObservable<Auth.AuthModel>;

        constructor(mAppModel: App.AppModel) {

            this.status = ko.observable(mAppModel.status());
            this.auth = ko.observable(mAppModel.auth());
 
        }
       
    }

}