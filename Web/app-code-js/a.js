/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../node_modules/@types/knockout/index.d.ts" />
/// <reference path="../node_modules/firebase/index.d.ts" />
var gm;
(function (gm) {
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
                        case "upload-tasks-page":
                            this.shellViewModel.setActivePage({ title: "Upload Tasks", view: "upload-tasks-template", model: this.shellViewModel.vmApp().vmTasks });
                            break;
                        case "manage-tasks-page":
                            this.shellViewModel.setActivePage({ title: "Manage Tasks", view: "manage-tasks-template", model: this.shellViewModel.vmApp().vmTasks });
                            if (data["id"] != null) {
                                this.shellViewModel.vmApp().vmTasks().tasks().initTasks(gm.Components.Tasks.TasksModel.INIT_TRIG_NAV, data["id"]);
                            }
                            else {
                                this.shellViewModel.vmApp().vmTasks().tasks().initTasks(gm.Components.Tasks.TasksModel.INIT_TRIG_NAV);
                            }
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
                    apiKey: "AIzaSyClCU4YWUVSk2TDs7tfMmYpCnL_leI6474",
                    authDomain: "golfmike-aca0e.firebaseapp.com",
                    databaseURL: "https://golfmike-aca0e-default-rtdb.firebaseio.com",
                    projectId: "golfmike-aca0e",
                    storageBucket: "golfmike-aca0e.appspot.com",
                    messagingSenderId: "1086790533593",
                    appId: "1:1086790533593:web:4841a91f89efacb57299c8"
                };
                firebase.default.initializeApp(firebaseConfig);
                // Add URL Mappings:
                this.urlMapping = {};
                this.urlMapping["home-page"] = /^$/;
                this.urlMapping["upload-tasks-page"] = /^upload-tasks$/;
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
        Shell.Application = Application;
        class ShellViewModel {
            constructor(mAppModel) {
                this.appLoaded = ko.observable(false);
                this.activePage = ko.observable(null);
                this.router = ko.observable(null);
                this.vmApp = ko.observable(new gm.Components.App.AppViewModel(mAppModel));
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
    })(Shell = gm.Shell || (gm.Shell = {}));
})(gm || (gm = {}));
/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../node_modules/@types/knockout/index.d.ts" />
var gm;
(function (gm) {
    var Components;
    (function (Components) {
        var App;
        (function (App) {
            class AppModel {
                constructor() {
                    this.status = ko.observable(new gm.Components.Status.StatusModel());
                    this.auth = ko.observable(new gm.Components.Auth.AuthModel(this.status));
                    this.tasks = ko.observable(new gm.Components.Tasks.TasksModel(this.auth, this.status));
                    this.auth().authStatus.subscribe((newValue) => {
                        this.authStatusChanged(newValue);
                    });
                }
                authStatusChanged(authStatus) {
                    try {
                        if (authStatus == gm.Components.Auth.AuthStatuses.LoggedOut) {
                            this.tasks().initTasks(Components.Tasks.TasksModel.INIT_TRIG_LOGOUT);
                            location.href = "#";
                        }
                        else if (authStatus == gm.Components.Auth.AuthStatuses.LoggedIn) {
                            this.tasks().initTasks(Components.Tasks.TasksModel.INIT_TRIG_LOGIN);
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
                    this.vmStatus = ko.observable(new gm.Components.Status.StatusViewModel(mAppModel));
                    this.vmAuth = ko.observable(new gm.Components.Auth.AuthViewModel(mAppModel));
                    this.vmHome = ko.observable(new gm.Components.Home.HomePageViewModel(mAppModel));
                    this.vmTasks = ko.observable(new gm.Components.Tasks.TasksViewModel(mAppModel));
                }
            }
            App.AppViewModel = AppViewModel;
        })(App = Components.App || (Components.App = {}));
    })(Components = gm.Components || (gm.Components = {}));
})(gm || (gm = {}));
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
var gm;
(function (gm) {
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
                    this.nickname = ko.observable("");
                    this.authStatus = ko.observable(AuthStatuses.LoggedOut);
                    this.students = ko.observableArray();
                    this.hasStudents = ko.pureComputed(() => {
                        return this.students().length > 0;
                    }, this);
                    this.userId = ko.pureComputed(() => {
                        return this._userId();
                    }, this);
                    this.name = ko.computed(() => {
                        return this._name();
                    }, this);
                    this.emailAddress = ko.pureComputed(() => {
                        return this._emailAddress();
                    }, this);
                    firebase.default.auth().onAuthStateChanged((user) => {
                        this.authStateChanged(user);
                    });
                }
                authStateChanged(user) {
                    try {
                        if (user) {
                            this._userId(user.uid);
                            this._name(user.displayName);
                            this._emailAddress(user.email);
                            firebase.default.database().ref("/users/" + user.uid + "/profile").get().then((snapshot) => {
                                var _a;
                                let data = snapshot.val();
                                this.nickname((_a = data.nickname) !== null && _a !== void 0 ? _a : user.displayName);
                                if (data.students != null) {
                                    Object.keys(data.students).forEach((key) => {
                                        this.students.push(new Student(key, data.students[key]));
                                    });
                                    this.students.sort((l, r) => {
                                        return l.name < r.name ? -1 : l.name > r.name ? 1 : 0;
                                    });
                                }
                                this.authStatus(AuthStatuses.LoggedIn);
                            });
                        }
                        else {
                            this._userId("");
                            this._name("");
                            this._emailAddress("");
                            this.nickname("");
                            this.students.removeAll();
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
                    firebase.default.auth().languageCode = 'it';
                    firebase.default.auth().signInWithPopup(provider);
                }
                doLogout() {
                    firebase.default.auth().signOut();
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
    })(Components = gm.Components || (gm.Components = {}));
})(gm || (gm = {}));
/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../node_modules/@types/knockout/index.d.ts" />
/// <reference path="../node_modules/firebase/index.d.ts" />
var gm;
(function (gm) {
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
    })(Components = gm.Components || (gm.Components = {}));
})(gm || (gm = {}));
/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../node_modules/@types/knockout/index.d.ts" />
var gm;
(function (gm) {
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
    })(Components = gm.Components || (gm.Components = {}));
})(gm || (gm = {}));
/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../node_modules/@types/knockout/index.d.ts" />
/// <reference path="../node_modules/firebase/index.d.ts" />
var gm;
(function (gm) {
    var Components;
    (function (Components) {
        var Tasks;
        (function (Tasks) {
            class TasksModel {
                constructor(mAuth, mStatus) {
                    this.BASE_URL = "https://hinternationalschool.managebac.com";
                    this.auth = mAuth;
                    this.status = mStatus;
                    this.studentId = "";
                    this.studentName = ko.observable("");
                    this.lastUploadAt = ko.observable("");
                    this.lastCleanup = new Date(0); // Initialize lastCleanup to minimum date
                    this.itemsLoaded = false;
                    this.dataLoaded = false;
                    this.classesLoaded = false;
                    this.managedTasks = ko.observableArray();
                }
                buildManagedTasks() {
                    try {
                        if (this.itemsLoaded && this.dataLoaded && this.classesLoaded) {
                            // Data has been loaded from the database for both objects, so go ahead with the build
                            let itemKeys = Object.keys(this.taskItemsObj);
                            if (this.studentId == this.auth().userId()) { // Only do a cleanup if the tasks are for the logged-in user.
                                if (this.lastCleanup.valueOf() < Date.now() - 3600000) { // Only do a cleanup if one has not been done in the last hour
                                    this.lastCleanup = new Date(); // We are doing a cleanup, so reset the lastCleanup to now
                                    let doCleanup = false;
                                    let updates = {};
                                    itemKeys.forEach((key, index) => {
                                        // Loop to check if any need to be archived or invalidated.  If any do need to be archived or invalidated,
                                        // then archive or invalidate them, and then this routine will run again automatically
                                        let tsItem = this.taskItemsObj[key];
                                        let tsData = this.taskDataObj[key];
                                        // Is taskItem valid?  A valid task must have an id and a start date/time
                                        if (tsItem.start == null || tsItem.id == null) {
                                            // if task is not valid, then delete it from the database
                                            doCleanup = true;
                                            updates["users/" + this.studentId + "/taskItems/" + key] = null;
                                            updates["users/" + this.studentId + "/taskData/" + key] = null;
                                        }
                                        else {
                                            // The task is valid, check if its startDate is more than 2 days ago
                                            let taskStart = new Date(tsItem.start);
                                            if (taskStart.valueOf() < gm.Common.DateHelpers.addDays(new Date(), -4).valueOf()) {
                                                // If yes, is the task Submitted or Nothing to Sumite?  If yes then merge the taskItem and taskData to the archive.
                                                let tsStatus = (tsData && tsData["status"]) ? tsData["status"] : "0";
                                                if (tsStatus == "4" || tsStatus == "5" || tsStatus == "6") {
                                                    doCleanup = true;
                                                    updates["users/" + this.studentId + "/archive/tasks/" + key] = Object.assign(tsItem, tsData);
                                                    updates["users/" + this.studentId + "/taskItems/" + key] = null;
                                                    updates["users/" + this.studentId + "/taskData/" + key] = null;
                                                    let mt = this.managedTasks().find(task => task.id() == key);
                                                    if (mt != null) {
                                                        this.managedTasks.remove(mt);
                                                    }
                                                    delete this.taskItemsObj[key];
                                                    delete this.taskDataObj[key];
                                                }
                                            }
                                        }
                                    });
                                    if (doCleanup) {
                                        // Do the cleanup and then update the value of lastCleanup;
                                        firebase.default.database().ref().update(updates);
                                        // Refresh itemKeys if we did a cleanup
                                        itemKeys = Object.keys(this.taskItemsObj);
                                    }
                                }
                            }
                            itemKeys.forEach((key, index) => {
                                let mt = this.managedTasks().find(task => task.id() == key);
                                if (mt == null) {
                                    // Add this taskItem to managedTasks
                                    mt = new TaskManageModel();
                                    this.setManagedTaskValues(key, mt);
                                    this.managedTasks().push(mt);
                                }
                                else {
                                    // this taskItem is already in managedTasks, so update it
                                    this.setManagedTaskValues(key, mt);
                                }
                            });
                            this.managedTasks.sort((l, r) => {
                                if (l.grouping() != r.grouping()) {
                                    return l.grouping() < r.grouping() ? -1 : 1;
                                }
                                if (l.priority() != r.priority()) {
                                    return l.priority() ? -1 : 1;
                                }
                                return l.dt() < r.dt() ? -1 : l.dt() > r.dt() ? 1 : 0;
                            });
                        }
                    }
                    catch (e) {
                        this.status().setErrorStatus(e, "An error occurred in TaskModel's buildManagedTasks");
                    }
                }
                setManagedTaskValues(key, mt) {
                    var _a, _b, _c, _d, _e, _f, _g, _h;
                    mt.bgColor((_a = this.taskItemsObj[key].backgroundColor) !== null && _a !== void 0 ? _a : "#FFFFFF");
                    mt.category((_b = this.taskItemsObj[key].category) !== null && _b !== void 0 ? _b : "Unknown");
                    mt.description((_c = this.taskItemsObj[key].description) !== null && _c !== void 0 ? _c : "Unknown");
                    mt.dt((_d = new Date(this.taskItemsObj[key].start)) !== null && _d !== void 0 ? _d : new Date());
                    mt.id(this.taskItemsObj[key].id);
                    mt.title((_e = this.taskItemsObj[key].title) !== null && _e !== void 0 ? _e : "Unknown");
                    let url = this.taskItemsObj[key].url;
                    if (url != null) {
                        if (this.studentId != this.auth().userId()) {
                            // This user is the parent.  Parents can only view tasks, not events or online lessons
                            if (url.indexOf("core_tasks") > -1) {
                                url = url.replace("student", "parent");
                                url = url.replace("core_tasks", "tasks");
                                mt.taskUrl(this.BASE_URL + url);
                            }
                            else {
                                mt.taskUrl("");
                            }
                        }
                        else {
                            // This user is the student
                            mt.taskUrl(this.BASE_URL + url);
                        }
                    }
                    // Extract class from url and lookup value
                    try {
                        let segments = url.split("/");
                        mt.className((_f = this.classes[segments[3]]) !== null && _f !== void 0 ? _f : "Unknown");
                    }
                    catch (e) {
                        mt.className("Unknown");
                    }
                    let td = this.taskDataObj[key];
                    if (td != null) {
                        mt.status((_g = td.status) !== null && _g !== void 0 ? _g : "0");
                        mt.oldStatus(mt.status());
                        mt.priority((_h = td.priority) !== null && _h !== void 0 ? _h : false);
                    }
                }
                initTasks(trig, id) {
                    // Do we need to re-initialize?
                    let reInit = false;
                    switch (trig) {
                        case TasksModel.INIT_TRIG_NAV:
                            if (id == null) {
                                // There is no id requested, so reInit if the currently loaded tasks are not for the authenticated userId or there is no studentId
                                if (this.studentId.length == 0 || this.studentId != this.auth().userId()) {
                                    this.studentId = this.auth().userId();
                                    this.studentName("");
                                    reInit = true;
                                }
                            }
                            else {
                                // There is an id requested, so reInit if it does not match the currently loaded studentId
                                if (id != this.studentId) {
                                    this.studentId = id;
                                    reInit = true;
                                }
                            }
                            // We set reInit above, but override it to false if the user is not logged in
                            // It will reInit if/when they login
                            if (this.auth().authStatus() != Components.Auth.AuthStatuses.LoggedIn) {
                                reInit = false;
                            }
                            break;
                        case TasksModel.INIT_TRIG_LOGOUT:
                            this.taskDataRef.off();
                            this.taskItemsRef.off();
                            this.classesRef.off();
                            this.managedTasks.removeAll();
                            // reInit remains false
                            break;
                        case TasksModel.INIT_TRIG_LOGIN:
                            // User has logged on, so use the previously stored studentId (if it exsts) and reInit
                            // If there is no previously stored studentId then default to the logge-in user.
                            if (this.studentId.length == 0) {
                                this.studentId = this.auth().userId();
                            }
                            reInit = true;
                            break;
                        default:
                            throw new Error("Invalid trigger for Task initialization");
                    }
                    if (reInit) {
                        // Clear the existing data
                        this.managedTasks.removeAll();
                        if (this.studentId != this.auth().userId()) {
                            this.studentName(this.auth().students().find(student => student.id == this.studentId).name);
                        }
                        this.classes = {};
                        this.taskItemsObj = {};
                        this.taskDataObj = {};
                        firebase.default.database().ref("users/" + this.studentId + "/lastUploadAt").get().then((snapshot) => {
                            if (snapshot.exists()) {
                                this.lastUploadAt(snapshot.val());
                            }
                        });
                        this.classesRef = firebase.default.database().ref("users/" + this.studentId + "/classes");
                        this.classesRef.on('value', (snapshot) => {
                            this.classes = snapshot.val();
                            this.classesLoaded = true;
                            this.buildManagedTasks();
                        });
                        this.taskItemsRef = firebase.default.database().ref("users/" + this.studentId + "/taskItems");
                        this.taskItemsRef.on('value', (snapshot) => {
                            var _a;
                            this.taskItemsObj = (_a = snapshot.val()) !== null && _a !== void 0 ? _a : {};
                            this.itemsLoaded = true;
                            this.buildManagedTasks();
                        });
                        this.taskDataRef = firebase.default.database().ref("users/" + this.studentId + "/taskData");
                        this.taskDataRef.on('value', (snapshot) => {
                            var _a;
                            this.taskDataObj = (_a = snapshot.val()) !== null && _a !== void 0 ? _a : {};
                            this.dataLoaded = true;
                            this.buildManagedTasks();
                        });
                    }
                }
                importTasks(newTasks) {
                    if (this.studentId != this.auth().userId()) {
                        throw new Error("You cannot upload tasks for a student.");
                    }
                    let arrOfTasks;
                    try {
                        arrOfTasks = JSON.parse(newTasks);
                    }
                    catch (e) {
                        throw new Error("The JSON is not valid.");
                    }
                    if (arrOfTasks.length > 0) {
                        let updates = {};
                        for (var i = 0; i < arrOfTasks.length; i++) {
                            updates["users/" + this.studentId + "/taskItems/" + arrOfTasks[i].id] = arrOfTasks[i];
                        }
                        firebase.default.database().ref().update(updates);
                        let ula = new Date();
                        this.lastUploadAt(ula.toLocaleString());
                        firebase.default.database().ref("users/" + this.studentId + "/lastUploadAt").set(ula.toLocaleString());
                    }
                    else {
                        throw new Error("There were no tasks to import.");
                    }
                }
                setTaskStatus(obj, evt) {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (this.studentId != this.auth().userId()) {
                            throw new Error("You cannot modify tasks for a student.");
                        }
                        if (evt.originalEvent) {
                            let updates = {};
                            updates["/users/" + this.studentId + "/taskData/" + obj.id() + '/status'] = evt.target.value;
                            yield firebase.default.database().ref().update(updates);
                        }
                    });
                }
                setTaskPriority(obj) {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (this.studentId != this.auth().userId()) {
                            throw new Error("You cannot modify tasks for a student.");
                        }
                        let updates = {};
                        updates["/users/" + this.studentId + "/taskData/" + obj.id() + '/priority'] = !obj.priority(); // toggle
                        yield firebase.default.database().ref().update(updates);
                    });
                }
            }
            TasksModel.INIT_TRIG_LOGIN = 0;
            TasksModel.INIT_TRIG_LOGOUT = 1;
            TasksModel.INIT_TRIG_NAV = 2;
            Tasks.TasksModel = TasksModel;
            class TasksViewModel {
                constructor(mAppModel) {
                    this.BASE_URL = "https://hinternationalschool.managebac.com";
                    this.auth = mAppModel.auth;
                    this.status = mAppModel.status;
                    this.tasks = mAppModel.tasks;
                    this.tasksToImport = ko.observable("");
                    this.jsonUrl = ko.pureComputed(() => {
                        let today = new Date();
                        let thru = new Date();
                        thru.setDate(today.getDate() + 14);
                        return this.BASE_URL + "/student/events.json?start=" + gm.Common.DateHelpers.formatJsonDate(today)
                            + "&end=" + gm.Common.DateHelpers.formatJsonDate(thru);
                    }, this);
                }
                // UI Command
                setTaskStatus(obj, evt) {
                    return __awaiter(this, void 0, void 0, function* () {
                        try {
                            this.status().beginWork();
                            yield this.tasks().setTaskStatus(obj, evt);
                            // If successful, update oldStatus
                            obj.oldStatus(obj.status());
                        }
                        catch (e) {
                            // Error, so reset the value back to oldStatus
                            obj.status(obj.oldStatus());
                            this.status().setErrorStatus(e);
                        }
                        finally {
                            this.status().finishWork();
                        }
                    });
                }
                // UI Command
                setTaskPriority(obj) {
                    return __awaiter(this, void 0, void 0, function* () {
                        try {
                            this.status().beginWork();
                            yield this.tasks().setTaskPriority(obj);
                        }
                        catch (e) {
                            this.status().setErrorStatus(e);
                        }
                        finally {
                            this.status().finishWork();
                        }
                    });
                }
                // UI Command
                importTasks() {
                    try {
                        this.status().beginWork();
                        this.tasks().importTasks(this.tasksToImport());
                        location.href = "#manage-tasks";
                        this.status().setSuccessStatus("The tasks were imported sucessfully.");
                    }
                    catch (e) {
                        this.status().setErrorStatus(e);
                    }
                    finally {
                        this.status().finishWork();
                    }
                }
            }
            Tasks.TasksViewModel = TasksViewModel;
            class TaskManageModel {
                constructor() {
                    this.bgColor = ko.observable("");
                    this.category = ko.observable("");
                    this.description = ko.observable("");
                    this.id = ko.observable("");
                    this.dt = ko.observable(new Date());
                    this.dtDisplay = ko.computed(() => {
                        return gm.Common.DateHelpers.formatDate(this.dt());
                    });
                    this.title = ko.observable("");
                    this.taskUrl = ko.observable("");
                    this.className = ko.observable("Unknown");
                    this.oldStatus = ko.observable("0");
                    this.status = ko.observable("0");
                    this.priority = ko.observable(false);
                    this.grouping = ko.computed(() => {
                        let st = Number(this.status());
                        if (this.dt() < gm.Common.DateHelpers.addDays(new Date(), 2) && st <= 3) {
                            return 0;
                        }
                        if (st >= 4) {
                            return 2;
                        }
                        return 1;
                    });
                }
            }
            Tasks.TaskManageModel = TaskManageModel;
        })(Tasks = Components.Tasks || (Components.Tasks = {}));
    })(Components = gm.Components || (gm.Components = {}));
})(gm || (gm = {}));
var gm;
(function (gm) {
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
    })(Common = gm.Common || (gm.Common = {}));
})(gm || (gm = {}));
//# sourceMappingURL=a.js.map