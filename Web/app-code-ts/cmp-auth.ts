/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../node_modules/@types/knockout/index.d.ts" />

namespace gm.Components.Auth {

    export enum AuthStatuses {
        LoggedIn = 0,
        LoggedOut = 1,
        LoggingIn = 2,
        LoggingOut = 3
    }

    export class AuthModel {

        status: KnockoutObservable<Status.StatusModel>;

        private _userId: KnockoutObservable<string>;
        private _name: KnockoutObservable<string>;
        private _emailAddress: KnockoutObservable<string>;

        userId: KnockoutComputed<string>;
        name: KnockoutComputed<string>;
        emailAddress: KnockoutComputed<string>;

        nickname: KnockoutObservable<string>;
        students: KnockoutObservableArray<Student>;
        hasStudents: KnockoutComputed<boolean>;

        authStatus: KnockoutObservable<number>;

        constructor(mStatus: KnockoutObservable<Status.StatusModel>) {

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

        authStateChanged(user: firebase.default.User) {
            try {
                if (user) {
                    this._userId(user.uid);
                    this._name(user.displayName);
                    this._emailAddress(user.email);
                    firebase.default.database().ref("/users/" + user.uid + "/profile").get().then((snapshot) => {
                        let data = snapshot.val();
                        this.nickname(data.nickname ?? user.displayName);
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
                } else {
                    this._userId("");
                    this._name("");
                    this._emailAddress("");
                    this.nickname("");
                    this.students.removeAll();
                    this.authStatus(AuthStatuses.LoggedOut);
                }
            } catch (e) {
                this.status().setErrorStatus(e, "An error occurred in AuthModel's authStateChanged.");
            }
        }

        loginWithGoogle() {
            // Login the user
            let provider = new firebase.default.auth.GoogleAuthProvider();
            firebase.default.auth().languageCode = 'it';
            firebase.default.auth().signInWithPopup(provider)
        }

        doLogout() {
            firebase.default.auth().signOut();
        }        

    }

    export class AuthViewModel {

        auth: KnockoutObservable<AuthModel>;
        status: KnockoutObservable<Status.StatusModel>;

        displayedEmailAddress: KnockoutComputed<string>;
        displayedName: KnockoutComputed<string>;

        constructor(mAppModel: App.AppModel) {

            this.auth = mAppModel.auth;
            this.status = mAppModel.status;

            this.displayedEmailAddress = ko.pureComputed(() => {
                if (this.auth().emailAddress().length > 50) {
                    return this.auth().emailAddress().substring(0, 50) + "...";
                } else {
                    return this.auth().emailAddress();
                }
            }, this);

            this.displayedName = ko.pureComputed(() => {
                if (this.auth().name().length > 50) {
                    return this.auth().name().substring(0, 50) + "...";
                } else {
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

            } catch (e) {
                this.status().setErrorStatus(e);
            } finally {
                this.status().finishWork();
            }
        }

        // UI Command
        async doLogout() {
            try {
                this.status().beginWork();

                this.auth().authStatus(Auth.AuthStatuses.LoggingOut);
                this.auth().doLogout();

            } catch (e) {
                this.status().setErrorStatus(e);
            } finally {
                this.status().finishWork();
            }
        }        

    }

    export class Student {

        id: string;
        name: string;

        constructor(id: string, name: string) {
            this.id = id;
            this.name = name;
        }

    }

}