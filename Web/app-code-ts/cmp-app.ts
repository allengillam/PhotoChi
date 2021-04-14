/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../node_modules/@types/knockout/index.d.ts" />

namespace gm.Components.App {

    export class AppModel {

        status: KnockoutObservable<gm.Components.Status.StatusModel>;
        auth: KnockoutObservable<gm.Components.Auth.AuthModel>;
        tasks: KnockoutObservable<gm.Components.Tasks.TasksModel>;

        constructor() {

            this.status = ko.observable(new gm.Components.Status.StatusModel());
            this.auth = ko.observable(new gm.Components.Auth.AuthModel(this.status));
            this.tasks = ko.observable(new gm.Components.Tasks.TasksModel(this.auth, this.status));

            this.auth().authStatus.subscribe((newValue) => {
                this.authStatusChanged(newValue);
            });

        }

        authStatusChanged(authStatus: gm.Components.Auth.AuthStatuses) {
            try {
                if (authStatus == gm.Components.Auth.AuthStatuses.LoggedOut) {
                    this.tasks().initTasks(Tasks.TasksModel.INIT_TRIG_LOGOUT);
                    location.href = "#";
                } else if (authStatus == gm.Components.Auth.AuthStatuses.LoggedIn) {
                    this.tasks().initTasks(Tasks.TasksModel.INIT_TRIG_LOGIN);
                }
            } catch (e) {
                this.status().setErrorStatus(e, "An error occurred in AppModel's authStatusChanged.");
            }
        }
    
    }

    export class AppViewModel {

        vmStatus: KnockoutObservable<gm.Components.Status.StatusViewModel>;
        vmAuth: KnockoutObservable<gm.Components.Auth.AuthViewModel>;
        vmHome: KnockoutObservable<gm.Components.Home.HomePageViewModel>;
        vmTasks: KnockoutObservable<gm.Components.Tasks.TasksViewModel>;

        constructor(mAppModel: gm.Components.App.AppModel) {

            this.vmStatus = ko.observable(new gm.Components.Status.StatusViewModel(mAppModel));
            this.vmAuth = ko.observable(new gm.Components.Auth.AuthViewModel(mAppModel));
            this.vmHome = ko.observable(new gm.Components.Home.HomePageViewModel(mAppModel));
            this.vmTasks = ko.observable(new gm.Components.Tasks.TasksViewModel(mAppModel));
          
        }

    }

}