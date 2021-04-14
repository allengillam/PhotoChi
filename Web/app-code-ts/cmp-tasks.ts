/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../node_modules/@types/knockout/index.d.ts" />
/// <reference path="../node_modules/firebase/index.d.ts" />

namespace gm.Components.Tasks {

    export class TasksModel {

        BASE_URL: string = "https://hinternationalschool.managebac.com";
        static INIT_TRIG_LOGIN:number = 0;
        static INIT_TRIG_LOGOUT: number = 1;
        static INIT_TRIG_NAV: number = 2;

        auth: KnockoutObservable<Auth.AuthModel>;
        status: KnockoutObservable<Status.StatusModel>;

        studentId: string;
        studentName: KnockoutObservable<string>;
        lastUploadAt: KnockoutObservable<string>;
        classes: object;
        lastCleanup: Date;

        managedTasks: KnockoutObservableArray<TaskManageModel>;

        classesRef: firebase.default.database.Reference;
        taskItemsRef: firebase.default.database.Reference;
        taskDataRef: firebase.default.database.Reference;

        taskItemsObj: object;
        taskDataObj: object;
        itemsLoaded: boolean;
        dataLoaded: boolean;
        classesLoaded: boolean;

        constructor(mAuth: KnockoutObservable<Auth.AuthModel>, mStatus: KnockoutObservable<Status.StatusModel>) {

            this.auth = mAuth;
            this.status = mStatus;

            this.studentId = "";
            this.studentName = ko.observable("");
            this.lastUploadAt = ko.observable("");

            this.lastCleanup = new Date(0);  // Initialize lastCleanup to minimum date

            this.itemsLoaded = false;
            this.dataLoaded = false;
            this.classesLoaded = false;

            this.managedTasks = ko.observableArray<TaskManageModel>();

        }

        buildManagedTasks() {
            try {

                if (this.itemsLoaded && this.dataLoaded && this.classesLoaded) {
                    // Data has been loaded from the database for both objects, so go ahead with the build
                    let itemKeys = Object.keys(this.taskItemsObj);

                    if (this.studentId == this.auth().userId()) {  // Only do a cleanup if the tasks are for the logged-in user.

                        if (this.lastCleanup.valueOf() < Date.now() - 3600000) {  // Only do a cleanup if one has not been done in the last hour
                            this.lastCleanup = new Date(); // We are doing a cleanup, so reset the lastCleanup to now
                            let doCleanup: boolean = false;
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
                                } else {
                                    // The task is valid, check if its startDate is more than 2 days ago
                                    let taskStart = new Date(tsItem.start);
                                    if (taskStart.valueOf() < Common.DateHelpers.addDays(new Date(), -4).valueOf()) {
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
                        } else {
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
            } catch (e) {
                this.status().setErrorStatus(e, "An error occurred in TaskModel's buildManagedTasks");
            }
        }

        setManagedTaskValues(key: string, mt: TaskManageModel) {
            mt.bgColor(this.taskItemsObj[key].backgroundColor ?? "#FFFFFF");
            mt.category(this.taskItemsObj[key].category ?? "Unknown");
            mt.description(this.taskItemsObj[key].description ?? "Unknown");
            mt.dt(new Date(this.taskItemsObj[key].start) ?? new Date());
            mt.id(this.taskItemsObj[key].id);
            mt.title(this.taskItemsObj[key].title ?? "Unknown");

            let url:string = this.taskItemsObj[key].url;
            if (url != null) {
                if (this.studentId != this.auth().userId()) {
                    // This user is the parent.  Parents can only view tasks, not events or online lessons
                    if (url.indexOf("core_tasks") > -1) {
                        url = url.replace("student", "parent");
                        url = url.replace("core_tasks", "tasks");
                        mt.taskUrl(this.BASE_URL + url);
                    } else {
                        mt.taskUrl("");
                    }
                } else {
                    // This user is the student
                    mt.taskUrl(this.BASE_URL + url);
                }
            }

            // Extract class from url and lookup value
            try {
                let segments = url.split("/");
                mt.className(this.classes[segments[3]] ?? "Unknown");
            } catch (e) {
                mt.className("Unknown");
            }

            let td = this.taskDataObj[key];
            if (td != null) {
                mt.status(td.status ?? "0");
                mt.oldStatus(mt.status());
                mt.priority(td.priority ?? false);
            }
        }

        initTasks(trig: number, id?: string) {
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
                    } else {
                        // There is an id requested, so reInit if it does not match the currently loaded studentId
                        if (id != this.studentId) {
                            this.studentId = id;
                            reInit = true;
                        }
                    }
                    // We set reInit above, but override it to false if the user is not logged in
                    // It will reInit if/when they login
                    if (this.auth().authStatus() != Auth.AuthStatuses.LoggedIn) {
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
                    this.taskItemsObj = snapshot.val() ?? {};
                    this.itemsLoaded = true;
                    this.buildManagedTasks();
                });
                this.taskDataRef = firebase.default.database().ref("users/" + this.studentId + "/taskData");
                this.taskDataRef.on('value', (snapshot) => {
                    this.taskDataObj = snapshot.val() ?? {};
                    this.dataLoaded = true;
                    this.buildManagedTasks();
                });
            }
        }

        importTasks(newTasks: string) {

            if (this.studentId != this.auth().userId()) {
                throw new Error("You cannot upload tasks for a student.");
            }
            let arrOfTasks;
            try {
                arrOfTasks = JSON.parse(newTasks);
            } catch (e) {                
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
            } else {
                throw new Error("There were no tasks to import.");
            }
        }

        async setTaskStatus(obj: TaskManageModel, evt: any) {
            if (this.studentId != this.auth().userId()) {
                throw new Error("You cannot modify tasks for a student.");
            }
            if (evt.originalEvent) {
                let updates = {};
                updates["/users/" + this.studentId + "/taskData/" + obj.id() + '/status'] = evt.target.value;
                await firebase.default.database().ref().update(updates);
            }
        }

        async setTaskPriority(obj: TaskManageModel) {
            if (this.studentId != this.auth().userId()) {
                throw new Error("You cannot modify tasks for a student.");
            }
            let updates = {};
            updates["/users/" + this.studentId + "/taskData/" + obj.id() + '/priority'] = !obj.priority(); // toggle
            await firebase.default.database().ref().update(updates);
        }

    }

    export class TasksViewModel {

        BASE_URL: string = "https://hinternationalschool.managebac.com";

        auth: KnockoutObservable<Auth.AuthModel>;
        status: KnockoutObservable<Status.StatusModel>;

        tasks: KnockoutObservable<TasksModel>;

        tasksToImport: KnockoutObservable<string>;

        jsonUrl: KnockoutComputed<string>;

        constructor(mAppModel: App.AppModel) {

            this.auth = mAppModel.auth;
            this.status = mAppModel.status;

            this.tasks = mAppModel.tasks;

            this.tasksToImport = ko.observable("");

            this.jsonUrl = ko.pureComputed(() => {
                let today = new Date();
                let thru = new Date();
                thru.setDate(today.getDate() + 14);
                return this.BASE_URL + "/student/events.json?start=" + Common.DateHelpers.formatJsonDate(today)
                    + "&end=" + Common.DateHelpers.formatJsonDate(thru);
            }, this);

        }

        // UI Command
        async setTaskStatus(obj: TaskManageModel, evt: any) {
            try {
                this.status().beginWork();

                await this.tasks().setTaskStatus(obj, evt);
                // If successful, update oldStatus
                obj.oldStatus(obj.status());

            } catch (e) {
                // Error, so reset the value back to oldStatus
                obj.status(obj.oldStatus());
                this.status().setErrorStatus(e);
            } finally {
                this.status().finishWork();
            }
        }

        // UI Command
        async setTaskPriority(obj: TaskManageModel) {
            try {
                this.status().beginWork();

                await this.tasks().setTaskPriority(obj);

            } catch (e) {
                this.status().setErrorStatus(e);
            } finally {
                this.status().finishWork();
            }
        }

        // UI Command
        importTasks() {
            try {
                this.status().beginWork();

                this.tasks().importTasks(this.tasksToImport());
                location.href = "#manage-tasks";

                this.status().setSuccessStatus("The tasks were imported sucessfully.");
            } catch (e) {
                this.status().setErrorStatus(e);
            } finally {
                this.status().finishWork();
            }
        }       

    }

    export class TaskManageModel {

        bgColor: KnockoutObservable<string>;
        category: KnockoutObservable<string>;
        description: KnockoutObservable<string>;
        id: KnockoutObservable<string>;
        dt: KnockoutObservable<Date>;
        dtDisplay: KnockoutComputed<string>;
        title: KnockoutObservable<string>;
        taskUrl: KnockoutObservable<string>;
        className: KnockoutObservable<string>;

        oldStatus: KnockoutObservable<string>;
        status: KnockoutObservable<string>;
        priority: KnockoutObservable<boolean>;

        grouping: KnockoutComputed<number>;

        constructor() {

            this.bgColor = ko.observable("");
            this.category = ko.observable("");
            this.description = ko.observable("");
            this.id = ko.observable("");
            this.dt = ko.observable(new Date());

            this.dtDisplay = ko.computed(() => {
                return Common.DateHelpers.formatDate(this.dt());
            });

            this.title = ko.observable("");
            this.taskUrl = ko.observable("");
            this.className = ko.observable("Unknown");

            this.oldStatus = ko.observable("0");
            this.status = ko.observable("0");
            this.priority = ko.observable(false);

            this.grouping = ko.computed(() => {
                let st = Number(this.status());
                if (this.dt() < Common.DateHelpers.addDays(new Date(), 2) && st <= 3) {
                    return 0;
                }
                if (st >= 4) {
                    return 2;
                }
                return 1;
            });

        }

    }

}