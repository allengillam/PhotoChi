/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../node_modules/@types/knockout/index.d.ts" />

namespace pc.Components.Status {

    export enum StatusTypes {
        Clear,
        Success,
        Error,
        Working
    }

    export class StatusModel {

        statusType: KnockoutObservable<number>;
        statusMessage: KnockoutObservable<string>;
        statusMoreInfo: KnockoutObservable<string>;

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

        setSuccessStatus(message: string) {
            this.statusType(Status.StatusTypes.Success);
            this.statusMessage(message);
            this.statusMoreInfo("");
        }

        setErrorStatus(err: any, info?: string) {
            console.log(err);
            let message: string = "";
            let moreInfo: string = "";
            if (err instanceof Error) {
                message += err.name + ": " + err.message;
                if (info != null) {
                    moreInfo = info;
                } else {
                    moreInfo += err.stack;
                }
            } else {
                message += err.message;
            }
            this.statusType(Status.StatusTypes.Error);
            this.statusMessage(message);
            this.statusMoreInfo(moreInfo);
        }

        private clearstatus() {
            this.statusType(Status.StatusTypes.Clear);
            this.statusMessage("");
            this.statusMoreInfo("");
        }



    }

    export class StatusViewModel {

        status: KnockoutObservable<StatusModel>;
        toggledMoreInfo: KnockoutObservable<boolean>;
        toggleMoreInfoText: KnockoutObservable<string>;

        isAlert: KnockoutComputed<boolean>;
        isWorking: KnockoutComputed<boolean>;
        isError: KnockoutComputed<boolean>;
        isSuccess: KnockoutComputed<boolean>;

        hasMoreInfo: KnockoutComputed<boolean>;
        statusMessageTruncated: KnockoutComputed<string>;

        constructor(mAppModel: App.AppModel) {

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
                } else {
                    this.toggledMoreInfo(true);
                    this.toggleMoreInfoText("Hide Info");
                }
            } catch (e) {
                console.log(e);  // We don't need to act on an error due to toggling the error!
            }
        }

    }

}