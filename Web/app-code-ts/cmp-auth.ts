/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../node_modules/@types/knockout/index.d.ts" />

namespace pc.Components.Auth {

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

        gapiToken: string;

        authStatus: KnockoutObservable<number>;

        constructor(mStatus: KnockoutObservable<Status.StatusModel>) {

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

        authStateChanged(user: firebase.default.User) {
            try {
                if (user) {
                    this._userId(user.uid);
                    this._name(user.displayName);
                    this._emailAddress(user.email);

                    this.authStatus(AuthStatuses.LoggedIn);

                    //firebase.default.database().ref("/users/" + user.uid + "/profile").get().then((snapshot) => {
                    //    let data = snapshot.val();             
                    //});

                } else {
                    this._userId("");
                    this._name("");
                    this._emailAddress("");
                    this.gapiToken = "";
                    this.authStatus(AuthStatuses.LoggedOut);
                }
            } catch (e) {
                this.status().setErrorStatus(e, "An error occurred in AuthModel's authStateChanged.");
            }
        }

        loginWithGoogle() {
            // Login the user
            let provider = new firebase.default.auth.GoogleAuthProvider();
            provider.addScope("https://www.googleapis.com/auth/photoslibrary");
            firebase.default.auth().signInWithPopup(provider).then((result) => {
                let cred: firebase.default.auth.OAuthCredential = result.credential;
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