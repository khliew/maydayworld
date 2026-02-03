// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import packageInfo from '../../package.json';

export const environment = {
  production: false,
  version: packageInfo.version,
  firebase: {
    apiKey: 'AIzaSyDa4Mw2-8a42A6LQ4bd6YbZLY9cXmofjcI',
    authDomain: 'maydayworld-55555.firebaseapp.com',
    databaseURL: 'https://maydayworld-55555.firebaseio.com',
    projectId: 'maydayworld-55555',
    storageBucket: 'maydayworld-55555.appspot.com',
    messagingSenderId: '507045645226',
    appId: '1:507045645226:web:7bfcb838e1a8cb47',
  },
};
