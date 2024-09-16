import { StateManager } from './stateManager';
import app from 'firebase/compat/app';
import "firebase/compat/functions"
import "firebase/compat/firestore"
import "firebase/compat/storage"
import "firebase/compat/auth"

const config = process.env.NODE_ENV === 'development' ?
{
  apiKey: "AIzaSyA7Z0ImykMNH6e9xbI956lY-HQCEdiDTN8",
  authDomain: "skyway-dev-373d5.firebaseapp.com",
  databaseURL: "https://skyway-dev-373d5.firebaseio.com",
  projectId: "skyway-dev-373d5",
  storageBucket: "skyway-dev-373d5.appspot.com",
  messagingSenderId: "1040145803928",
  appId: "1:1040145803928:web:8310f987923f7fea5ebeed"
}
: {
  apiKey: "AIzaSyA7Z0ImykMNH6e9xbI956lY-HQCEdiDTN8",
  authDomain: "skyway-dev-373d5.firebaseapp.com",
  databaseURL: "https://skyway-dev-373d5.firebaseio.com",
  projectId: "skyway-dev-373d5",
  storageBucket: "skyway-dev-373d5.appspot.com",
  messagingSenderId: "1040145803928",
  appId: "1:1040145803928:web:8310f987923f7fea5ebeed"
};

class Firebase {
  constructor() {
    app.initializeApp(config);
    // this.geo = new GeoFirestore(app.firestore());
    Object.assign(this, app);

    const callback = user =>{
      if (user) {
        // console.log('logged in');
        StateManager.user = user;
        // StateManager.authed = true;
      } else {
        // console.log('no user');
        delete StateManager.user;
        // StateManager.authed = false;
        localStorage.removeItem('authed');
        sessionStorage.removeItem('authed');
      }
    }
    app.auth().onAuthStateChanged(callback);
  }
  
}

const firebase = new Firebase();
export default firebase;
