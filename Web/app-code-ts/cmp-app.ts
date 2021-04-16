/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../node_modules/@types/knockout/index.d.ts" />

namespace pc.Components.App {

    export class AppModel {

        status: KnockoutObservable<pc.Components.Status.StatusModel>;
        auth: KnockoutObservable<pc.Components.Auth.AuthModel>;
        albumizer: KnockoutObservable<pc.Components.Albumizer.AlbumizerModel>;

        constructor() {

            this.status = ko.observable(new pc.Components.Status.StatusModel());
            this.auth = ko.observable(new pc.Components.Auth.AuthModel(this.status));
            this.albumizer = ko.observable(new pc.Components.Albumizer.AlbumizerModel(this.auth, this.status));

            this.auth().authStatus.subscribe((newValue) => {
                this.authStatusChanged(newValue);
            });

        }

        authStatusChanged(authStatus: pc.Components.Auth.AuthStatuses) {
            try {
                if (authStatus == pc.Components.Auth.AuthStatuses.LoggedOut) {
                    location.href = "#";
                } else if (authStatus == pc.Components.Auth.AuthStatuses.LoggedIn) {
                }
            } catch (e) {
                this.status().setErrorStatus(e, "An error occurred in AppModel's authStatusChanged.");
            }
        }
    
    }

    export class AppViewModel {

        vmStatus: KnockoutObservable<pc.Components.Status.StatusViewModel>;
        vmAuth: KnockoutObservable<pc.Components.Auth.AuthViewModel>;
        vmHome: KnockoutObservable<pc.Components.Home.HomePageViewModel>;
        vmAlbumizer: KnockoutObservable<pc.Components.Albumizer.AlbumizerViewModel>;

        constructor(mAppModel: pc.Components.App.AppModel) {

            this.vmStatus = ko.observable(new pc.Components.Status.StatusViewModel(mAppModel));
            this.vmAuth = ko.observable(new pc.Components.Auth.AuthViewModel(mAppModel));
            this.vmHome = ko.observable(new pc.Components.Home.HomePageViewModel(mAppModel));
            this.vmAlbumizer = ko.observable(new pc.Components.Albumizer.AlbumizerViewModel(mAppModel));
          
        }

    }

}