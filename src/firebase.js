import { initializeApp } from 'firebase/app'
import {getAuth} from 'firebase/auth'
import {getFirestore} from '@firebase/firestore';
import { getFunctions } from 'firebase/functions';
import {getStorage} from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";


const firebaseConfig = {
  apiKey: "AIzaSyDr3xY_0ObseiGHypgoxa04a1ABKhOy95Q",
  authDomain: "login-31221.firebaseapp.com",
  projectId: "login-31221",
  storageBucket: "login-31221.appspot.com",
  messagingSenderId: "746237448179",
  appId: "1:746237448179:web:205c235fb581e48881cc86"
};

const app = initializeApp(firebaseConfig)
const analytics = getAnalytics(app);
const auth = getAuth(app)
const functions = getFunctions(app);
export {auth, functions,analytics}
export const storage = getStorage(app)

