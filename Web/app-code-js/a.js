/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../node_modules/@types/knockout/index.d.ts" />
/// <reference path="../node_modules/firebase/index.d.ts" />
var pc;
(function (pc) {
    var Shell;
    (function (Shell) {
        class Application {
            constructor() {
            }
            pageNavigate(page, data) {
                try {
                    this.shellViewModel.vmApp().vmStatus().status().beginWork();
                    switch (page) {
                        case "home-page":
                            this.shellViewModel.setActivePage({ title: "Home", view: "home-page-template", model: this.shellViewModel.vmApp().vmHome });
                            break;
                        case "albumizer-page":
                            this.shellViewModel.setActivePage({ title: "Albumizer", view: "albumizer-template", model: this.shellViewModel.vmApp().vmAlbumizer });
                            this.shellViewModel.vmApp().vmAlbumizer().onNavigate();
                            break;
                        default:
                            this.shellViewModel.setActivePage({ title: "404 Error", view: "404-error-template", model: null });
                    }
                }
                catch (e) {
                    this.shellViewModel.vmApp().vmStatus().status().setErrorStatus(e);
                }
                finally {
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
                this.urlMapping["albumizer-page"] = /^albumizer$/;
                // Initialize appState
                let appModel = new pc.Components.App.AppModel();
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
        Shell.Application = Application;
        class ShellViewModel {
            constructor(mAppModel) {
                this.appLoaded = ko.observable(false);
                this.activePage = ko.observable(null);
                this.router = ko.observable(null);
                this.vmApp = ko.observable(new pc.Components.App.AppViewModel(mAppModel));
                this.appLoaded(true);
            }
            setActivePage(activePage) {
                this.activePage(activePage);
            }
            setRouter(urlMapping) {
                this.router(new Router(urlMapping));
            }
        }
        class Router {
            constructor(urlMapping) {
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
    })(Shell = pc.Shell || (pc.Shell = {}));
})(pc || (pc = {}));
/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../node_modules/@types/knockout/index.d.ts" />
/// <reference path="../node_modules/firebase/index.d.ts" />
var pc;
(function (pc) {
    var Components;
    (function (Components) {
        var Albumizer;
        (function (Albumizer) {
            class AlbumizerModel {
                constructor(mAuth, mStatus) {
                    this.auth = mAuth;
                    this.status = mStatus;
                    this.albumsLoaded = false;
                    this.photosLoaded = false;
                }
                loadAlbums() {
                    this.getAlbumsPage(10, "");
                    this.albumsLoaded = true;
                }
                loadPhotos() {
                    this.getPhotosPage(10, "");
                    this.photosLoaded = true;
                }
                getAlbumsPage(pageSize, nextPageToken) {
                    let requestData = { pageSize: pageSize };
                    if (nextPageToken.length > 0) {
                        requestData['pageToken'] = nextPageToken;
                    }
                    $.ajax({
                        url: "https://photoslibrary.googleapis.com/v1/albums",
                        headers: { 'Authorization': 'Bearer ' + this.auth().gapiToken },
                        data: requestData,
                        success: (result) => {
                            console.log(result);
                            if (result.albums) {
                                if (result.nextPageToken) {
                                    this.albumsNextPageToken = result.nextPageToken;
                                    this.getAlbumsPage(10, this.albumsNextPageToken);
                                }
                            }
                        },
                        error: (error) => {
                            console.log(error);
                        }
                    });
                }
                getPhotosPage(pageSize, nextPageToken) {
                    let requestData = { pageSize: pageSize };
                    if (nextPageToken.length > 0) {
                        requestData['pageToken'] = nextPageToken;
                    }
                    $.ajax({
                        url: "https://photoslibrary.googleapis.com/v1/mediaItems",
                        headers: {
                            'Content-type': 'application/json',
                            'Authorization': 'Bearer ' + this.auth().gapiToken
                        },
                        data: requestData,
                        success: (result) => {
                            console.log(result);
                            if (result.mediaItems) {
                                if (result.nextPageToken) {
                                    this.photosNextPageToken = result.nextPageToken;
                                    this.getPhotosPage(10, this.photosNextPageToken);
                                }
                            }
                        },
                        error: (error) => {
                            console.log(error);
                        }
                    });
                }
            }
            Albumizer.AlbumizerModel = AlbumizerModel;
            class AlbumizerViewModel {
                constructor(mAppModel) {
                    this.auth = mAppModel.auth;
                    this.status = mAppModel.status;
                    this.albumizer = mAppModel.albumizer;
                }
                onNavigate() {
                    if (!this.albumizer().albumsLoaded) {
                        this.albumizer().loadAlbums();
                    }
                    if (!this.albumizer().photosLoaded) {
                        this.albumizer().loadPhotos();
                    }
                }
            }
            Albumizer.AlbumizerViewModel = AlbumizerViewModel;
        })(Albumizer = Components.Albumizer || (Components.Albumizer = {}));
    })(Components = pc.Components || (pc.Components = {}));
})(pc || (pc = {}));
/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../node_modules/@types/knockout/index.d.ts" />
var pc;
(function (pc) {
    var Components;
    (function (Components) {
        var App;
        (function (App) {
            class AppModel {
                constructor() {
                    this.status = ko.observable(new pc.Components.Status.StatusModel());
                    this.auth = ko.observable(new pc.Components.Auth.AuthModel(this.status));
                    this.albumizer = ko.observable(new pc.Components.Albumizer.AlbumizerModel(this.auth, this.status));
                    this.auth().authStatus.subscribe((newValue) => {
                        this.authStatusChanged(newValue);
                    });
                }
                authStatusChanged(authStatus) {
                    try {
                        if (authStatus == pc.Components.Auth.AuthStatuses.LoggedOut) {
                            location.href = "#";
                        }
                        else if (authStatus == pc.Components.Auth.AuthStatuses.LoggedIn) {
                        }
                    }
                    catch (e) {
                        this.status().setErrorStatus(e, "An error occurred in AppModel's authStatusChanged.");
                    }
                }
            }
            App.AppModel = AppModel;
            class AppViewModel {
                constructor(mAppModel) {
                    this.vmStatus = ko.observable(new pc.Components.Status.StatusViewModel(mAppModel));
                    this.vmAuth = ko.observable(new pc.Components.Auth.AuthViewModel(mAppModel));
                    this.vmHome = ko.observable(new pc.Components.Home.HomePageViewModel(mAppModel));
                    this.vmAlbumizer = ko.observable(new pc.Components.Albumizer.AlbumizerViewModel(mAppModel));
                }
            }
            App.AppViewModel = AppViewModel;
        })(App = Components.App || (Components.App = {}));
    })(Components = pc.Components || (pc.Components = {}));
})(pc || (pc = {}));
/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../node_modules/@types/knockout/index.d.ts" />
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var pc;
(function (pc) {
    var Components;
    (function (Components) {
        var Auth;
        (function (Auth) {
            let AuthStatuses;
            (function (AuthStatuses) {
                AuthStatuses[AuthStatuses["LoggedIn"] = 0] = "LoggedIn";
                AuthStatuses[AuthStatuses["LoggedOut"] = 1] = "LoggedOut";
                AuthStatuses[AuthStatuses["LoggingIn"] = 2] = "LoggingIn";
                AuthStatuses[AuthStatuses["LoggingOut"] = 3] = "LoggingOut";
            })(AuthStatuses = Auth.AuthStatuses || (Auth.AuthStatuses = {}));
            class AuthModel {
                constructor(mStatus) {
                    this.status = mStatus;
                    this._userId = ko.observable("");
                    this._name = ko.observable("");
                    this._emailAddress = ko.observable("");
                    this.gapiToken = "";
                    this.authStatus = ko.observable(AuthStatuses.LoggedOut);
                    this.userId = ko.pureComputed(() => {
                        return this._userId();
                    }, this);
                    this.name = ko.computed(() => {
                        return this._name();
                    }, this);
                    this.emailAddress = ko.pureComputed(() => {
                        return this._emailAddress();
                    }, this);
                    //firebase.default.auth().onAuthStateChanged((user) => {
                    //    //this.authStateChanged(user);
                    //});
                }
                authStateChanged(user) {
                    try {
                        if (user) {
                            this._userId(user.uid);
                            this._name(user.displayName);
                            this._emailAddress(user.email);
                            this.authStatus(AuthStatuses.LoggedIn);
                            //firebase.default.database().ref("/users/" + user.uid + "/profile").get().then((snapshot) => {
                            //    let data = snapshot.val();             
                            //});
                        }
                        else {
                            this._userId("");
                            this._name("");
                            this._emailAddress("");
                            this.gapiToken = "";
                            this.authStatus(AuthStatuses.LoggedOut);
                        }
                    }
                    catch (e) {
                        this.status().setErrorStatus(e, "An error occurred in AuthModel's authStateChanged.");
                    }
                }
                loginWithGoogle() {
                    // Login the user
                    let provider = new firebase.default.auth.GoogleAuthProvider();
                    provider.addScope("https://www.googleapis.com/auth/photoslibrary");
                    firebase.default.auth().signInWithPopup(provider).then((result) => {
                        let cred = result.credential;
                        this.gapiToken = cred.accessToken;
                        this._userId(result.user.uid);
                        this._name(result.user.displayName);
                        this._emailAddress(result.user.email);
                        this.authStatus(AuthStatuses.LoggedIn);
                    }).catch((error) => {
                        console.log(error);
                    });
                }
                doLogout() {
                    firebase.default.auth().signOut();
                    this._userId("");
                    this._name("");
                    this._emailAddress("");
                    this.gapiToken = "";
                    this.authStatus(AuthStatuses.LoggedOut);
                }
            }
            Auth.AuthModel = AuthModel;
            class AuthViewModel {
                constructor(mAppModel) {
                    this.auth = mAppModel.auth;
                    this.status = mAppModel.status;
                    this.displayedEmailAddress = ko.pureComputed(() => {
                        if (this.auth().emailAddress().length > 50) {
                            return this.auth().emailAddress().substring(0, 50) + "...";
                        }
                        else {
                            return this.auth().emailAddress();
                        }
                    }, this);
                    this.displayedName = ko.pureComputed(() => {
                        if (this.auth().name().length > 50) {
                            return this.auth().name().substring(0, 50) + "...";
                        }
                        else {
                            return this.auth().name();
                        }
                    }, this);
                }
                // UI Command
                loginWithGoogle() {
                    try {
                        this.status().beginWork();
                        this.auth().authStatus(Auth.AuthStatuses.LoggingIn);
                        this.auth().loginWithGoogle();
                    }
                    catch (e) {
                        this.status().setErrorStatus(e);
                    }
                    finally {
                        this.status().finishWork();
                    }
                }
                // UI Command
                doLogout() {
                    return __awaiter(this, void 0, void 0, function* () {
                        try {
                            this.status().beginWork();
                            this.auth().authStatus(Auth.AuthStatuses.LoggingOut);
                            this.auth().doLogout();
                        }
                        catch (e) {
                            this.status().setErrorStatus(e);
                        }
                        finally {
                            this.status().finishWork();
                        }
                    });
                }
            }
            Auth.AuthViewModel = AuthViewModel;
            class Student {
                constructor(id, name) {
                    this.id = id;
                    this.name = name;
                }
            }
            Auth.Student = Student;
        })(Auth = Components.Auth || (Components.Auth = {}));
    })(Components = pc.Components || (pc.Components = {}));
})(pc || (pc = {}));
/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../node_modules/@types/knockout/index.d.ts" />
/// <reference path="../node_modules/firebase/index.d.ts" />
var pc;
(function (pc) {
    var Components;
    (function (Components) {
        var Home;
        (function (Home) {
            class HomePageViewModel {
                constructor(mAppModel) {
                    this.status = ko.observable(mAppModel.status());
                    this.auth = ko.observable(mAppModel.auth());
                }
            }
            Home.HomePageViewModel = HomePageViewModel;
        })(Home = Components.Home || (Components.Home = {}));
    })(Components = pc.Components || (pc.Components = {}));
})(pc || (pc = {}));
/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../node_modules/@types/knockout/index.d.ts" />
var pc;
(function (pc) {
    var Components;
    (function (Components) {
        var Status;
        (function (Status) {
            let StatusTypes;
            (function (StatusTypes) {
                StatusTypes[StatusTypes["Clear"] = 0] = "Clear";
                StatusTypes[StatusTypes["Success"] = 1] = "Success";
                StatusTypes[StatusTypes["Error"] = 2] = "Error";
                StatusTypes[StatusTypes["Working"] = 3] = "Working";
            })(StatusTypes = Status.StatusTypes || (Status.StatusTypes = {}));
            class StatusModel {
                constructor() {
                    this.statusType = ko.observable(Status.StatusTypes.Clear);
                    this.statusMessage = ko.observable("");
                    this.statusMoreInfo = ko.observable("");
                }
                beginWork() {
                    this.clearstatus();
                    this.statusType(Status.StatusTypes.Working);
                }
                finishWork() {
                    if (this.statusType() == Status.StatusTypes.Working) {
                        // We finished work without setting a success or error status, so clear the status working
                        this.statusType(Status.StatusTypes.Clear);
                    }
                }
                setSuccessStatus(message) {
                    this.statusType(Status.StatusTypes.Success);
                    this.statusMessage(message);
                    this.statusMoreInfo("");
                }
                setErrorStatus(err, info) {
                    console.log(err);
                    let message = "";
                    let moreInfo = "";
                    if (err instanceof Error) {
                        message += err.name + ": " + err.message;
                        if (info != null) {
                            moreInfo = info;
                        }
                        else {
                            moreInfo += err.stack;
                        }
                    }
                    else {
                        message += err.message;
                    }
                    this.statusType(Status.StatusTypes.Error);
                    this.statusMessage(message);
                    this.statusMoreInfo(moreInfo);
                }
                clearstatus() {
                    this.statusType(Status.StatusTypes.Clear);
                    this.statusMessage("");
                    this.statusMoreInfo("");
                }
            }
            Status.StatusModel = StatusModel;
            class StatusViewModel {
                constructor(mAppModel) {
                    this.status = mAppModel.status;
                    this.toggledMoreInfo = ko.observable(false);
                    this.toggleMoreInfoText = ko.observable("Show More Info");
                    this.isAlert = ko.pureComputed(() => {
                        return (this.status().statusType() == Status.StatusTypes.Error ||
                            this.status().statusType() == Status.StatusTypes.Success);
                    }, this);
                    this.isWorking = ko.pureComputed(() => {
                        return this.status().statusType() == Status.StatusTypes.Working;
                    }, this);
                    this.isError = ko.pureComputed(() => {
                        return this.status().statusType() == Status.StatusTypes.Error;
                    }, this);
                    this.isSuccess = ko.pureComputed(() => {
                        return this.status().statusType() == Status.StatusTypes.Success;
                    }, this);
                    this.hasMoreInfo = ko.pureComputed(() => {
                        return this.status().statusMoreInfo().length > 0;
                    }, this);
                    this.statusMessageTruncated = ko.pureComputed(() => {
                        if (this.status().statusMessage().length > 200) {
                            return this.status().statusMessage().substring(0, 200) + "...";
                        }
                        return this.status().statusMessage();
                    }, this);
                    // Subscribe to statusType changes and reset the toggle fields when the status changes to clear
                    this.status().statusType.subscribe((newVal) => {
                        if (newVal == StatusTypes.Clear) {
                            this.toggledMoreInfo(false);
                            this.toggleMoreInfoText("Show More Info");
                        }
                    }, this, "change");
                }
                // UI Command
                toggleMoreInfo() {
                    try {
                        if (this.toggledMoreInfo()) {
                            this.toggledMoreInfo(false);
                            this.toggleMoreInfoText("Show More Info");
                        }
                        else {
                            this.toggledMoreInfo(true);
                            this.toggleMoreInfoText("Hide Info");
                        }
                    }
                    catch (e) {
                        console.log(e); // We don't need to act on an error due to toggling the error!
                    }
                }
            }
            Status.StatusViewModel = StatusViewModel;
        })(Status = Components.Status || (Components.Status = {}));
    })(Components = pc.Components || (pc.Components = {}));
})(pc || (pc = {}));
var pc;
(function (pc) {
    var Common;
    (function (Common) {
        class DateHelpers {
            static formatDate(date) {
                let dte = "";
                if (date.getDate() < 10) {
                    dte += '0' + date.getDate();
                }
                else {
                    dte += date.getDate();
                }
                let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                dte += ' ' + months[date.getMonth()];
                dte += ' ' + date.getFullYear();
                if (date.getHours() < 10) {
                    dte += ' 0' + date.getHours();
                }
                else {
                    dte += ' ' + date.getHours();
                }
                if (date.getMinutes() < 10) {
                    dte += ':0' + date.getMinutes();
                }
                else {
                    dte += ':' + date.getMinutes();
                }
                return dte;
            }
            static formatJsonDate(date) {
                let dte = "";
                dte += date.getFullYear();
                if (date.getMonth() < 10) {
                    dte += '-0' + (date.getMonth() + 1);
                }
                else {
                    dte += "-" + (date.getMonth() + 1);
                }
                if (date.getDate() < 10) {
                    dte += '-0' + date.getDate();
                }
                else {
                    dte += "-" + date.getDate();
                }
                return dte;
            }
            static addDays(date, days) {
                let newDate = new Date(date.valueOf());
                newDate.setDate(date.getDate() + days);
                return newDate;
            }
        }
        Common.DateHelpers = DateHelpers;
    })(Common = pc.Common || (pc.Common = {}));
})(pc || (pc = {}));
//# sourceMappingURL=a.js.map