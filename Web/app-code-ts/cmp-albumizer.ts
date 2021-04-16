/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../node_modules/@types/knockout/index.d.ts" />
/// <reference path="../node_modules/firebase/index.d.ts" />

namespace pc.Components.Albumizer {

    export class AlbumizerModel {

        auth: KnockoutObservable<Auth.AuthModel>;
        status: KnockoutObservable<Status.StatusModel>;

        constructor(mAuth: KnockoutObservable<Auth.AuthModel>, mStatus: KnockoutObservable<Status.StatusModel>) {

            this.auth = mAuth;
            this.status = mStatus;          

        }
    }



    export class AlbumizerViewModel {

        auth: KnockoutObservable<Auth.AuthModel>;
        status: KnockoutObservable<Status.StatusModel>;

        constructor(mAppModel: App.AppModel) {

            this.auth = mAppModel.auth;
            this.status = mAppModel.status;

        }

    }


}