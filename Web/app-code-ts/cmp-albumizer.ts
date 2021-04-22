/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../node_modules/@types/knockout/index.d.ts" />
/// <reference path="../node_modules/firebase/index.d.ts" />

namespace pc.Components.Albumizer {

    export class AlbumizerModel {

        auth: KnockoutObservable<Auth.AuthModel>;
        status: KnockoutObservable<Status.StatusModel>;

        albumsLoaded: boolean;
        photosLoaded: boolean;

        albumsNextPageToken: string;
        photosNextPageToken: string;

        constructor(mAuth: KnockoutObservable<Auth.AuthModel>, mStatus: KnockoutObservable<Status.StatusModel>) {

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

        getAlbumsPage(pageSize: number, nextPageToken: string) {
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

        getPhotosPage(pageSize: number, nextPageToken: string) {
            let requestData = { pageSize: pageSize };
            if (nextPageToken.length> 0) {
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



    export class AlbumizerViewModel {

        auth: KnockoutObservable<Auth.AuthModel>;
        status: KnockoutObservable<Status.StatusModel>;
        albumizer: KnockoutObservable<AlbumizerModel>;

        constructor(mAppModel: App.AppModel) {

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


}