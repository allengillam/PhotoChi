/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../node_modules/@types/knockout/index.d.ts" />
/// <reference path="../node_modules/firebase/index.d.ts" />

namespace gm.Shell {

    export class Application {

        shellViewModel: ShellViewModel;
        urlMapping: IKvp;

        constructor() {
        }

        pageNavigate(page: string, data: object) {
            try {
                this.shellViewModel.vmApp().vmStatus().status().beginWork();
                switch (page) {
                    case "home-page":
                        this.shellViewModel.setActivePage({ title: "Home", view: "home-page-template", model: this.shellViewModel.vmApp().vmHome });
                        break;
                    case "manage-tasks-page":
                        this.shellViewModel.setActivePage({ title: "Manage Tasks", view: "manage-tasks-template", model: this.shellViewModel.vmApp().vmTasks });
                        if (data["id"] != null) {
                            this.shellViewModel.vmApp().vmTasks().tasks().initTasks(gm.Components.Tasks.TasksModel.INIT_TRIG_NAV, data["id"]);
                        } else {
                            this.shellViewModel.vmApp().vmTasks().tasks().initTasks(gm.Components.Tasks.TasksModel.INIT_TRIG_NAV);
                        }
                        break;
                    default:
                        this.shellViewModel.setActivePage({ title: "404 Error", view: "404-error-template", model: null });
                }
            } catch (e) {
                this.shellViewModel.vmApp().vmStatus().status().setErrorStatus(e);
            } finally {
                this.shellViewModel.vmApp().vmStatus().status().finishWork();
            }
        }    

        run() {

            var firebaseConfig = {
                apiKey: "AIzaSyAgsAfe-2t5aTv0o6q9TSIR8x-B9qAiFJs",
                authDomain: "photochi.firebaseapp.com",
                databaseUrl: "https://photochi-default-rtdb.firebaseio.com",
                projectId: "photochi",
                storageBucket: "photochi.appspot.com",
                messagingSenderId: "793178649724",
                appId: "1:793178649724:web:36e84b2e7e6ba0c37e45f9"
            };
            firebase.default.initializeApp(firebaseConfig);

            // Add URL Mappings:
            this.urlMapping = {};
            this.urlMapping["home-page"] = /^$/;
            this.urlMapping["manage-tasks-page"] = /^manage-tasks$/;

            // Initialize appState
            let appModel = new gm.Components.App.AppModel();

            // Initialize main view model and router
            this.shellViewModel = new ShellViewModel(appModel);
            this.shellViewModel.setRouter(this.urlMapping);
            this.shellViewModel.router().currentRoute.subscribe((value) => {
                this.pageNavigate(value.page, value.data);
            }, this);

            // Trigger a navigation to initialize the router activePage
            $(window).trigger("hashchange");

            ko.applyBindings(this.shellViewModel, $('html').get(0));


        }
    }

    class ShellViewModel {

        activePage: KnockoutObservable<IAppPageModel>;
        router: KnockoutObservable<Router>;
        appLoaded: KnockoutObservable<boolean>

        vmApp: KnockoutObservable<gm.Components.App.AppViewModel>;        

        constructor(mAppModel: gm.Components.App.AppModel) {

            this.appLoaded = ko.observable(false);

            this.activePage = ko.observable(null);
            this.router = ko.observable(null);

            this.vmApp = ko.observable(new gm.Components.App.AppViewModel(mAppModel));

            this.appLoaded(true);

        }      

        setActivePage(activePage: IAppPageModel) {
            this.activePage(activePage);
        }

        setRouter(urlMapping: IKvp) {
            this.router(new Router(urlMapping));
        }

    }

    class Router {

        urlMapping: IKvp;
        currentRoute: KnockoutObservable<IRouterResult>;

        constructor(urlMapping: IKvp) {
            this.urlMapping = urlMapping;
            this.currentRoute = ko.observable(null);

            $(window).bind("hashchange", () => {
                let url = location.hash.substr(1).split('?');
                let path = url[0];
                let query = url[1];
                let page = "";
                let data = {};
                //Get the page name
                for (var key in this.urlMapping) {
                    var exp = this.urlMapping[key];
                    var matches = exp.exec(decodeURIComponent(path));
                    if (matches) {
                        page = key;
                    }
                }
                //Get the Query String data
                if (query) {
                    let params = query.split('&');
                    for (var i = 0; i < params.length; i++) {
                        let kvp = params[i].split('=');
                        if (kvp.length == 2) {
                            data[kvp[0]] = decodeURIComponent(kvp[1]);
                        }
                    }
                }
                this.currentRoute({ page: page, data: data });
            });
        }
    }

    interface IAppPageModel {
        title: string;
        view: string;
        model: object;
    }

    interface IRouterResult {
        page: string;
        data: object;
    }

    interface IKvp {
        [key: string]: RegExp;
    }

}
