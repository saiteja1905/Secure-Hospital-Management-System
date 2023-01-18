import {React, useEffect, useState} from 'react'
import { Link } from 'react-router-dom'
import './assets/css/bootstrap.min.css'
import './assets/css/font-awesome.min.css'
import './assets/css/style.css'
import {RecaptchaVerifier,signInWithPhoneNumber, signInWithEmailAndPassword, getAuth,sendEmailVerification, sendPasswordResetEmail} from 'firebase/auth'
import {auth} from './firebase'
import {useHistory} from 'react-router-dom'
import {useAuthValue} from './AuthContext'
import Logo from './assets/img/logo-white.png'
import { httpsCallable } from "firebase/functions"
import { functions} from './firebase'

function Login(){
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [disableAll,setdisAll] = useState([false,""]);
    const [error,setError] = useState('');
    const {setTimeActive} = useAuthValue()
    const history = useHistory()
    const [tab,setTab] = useState({"login":true,"otp":false});
    const [otp,setOTP] = useState('');
    const [phone,setPhone] = useState('');


    async function loadPhoneNo () {
        const getUser = httpsCallable(functions, 'loadPhone');
        getUser()
            .then((result) => {
                if(result.data.success ) {
                    setPhone("+1" + result.data.data);
                } else {
                    history.push("/login");
                }
                setdisAll([false,""])
            }).catch((error) => {
            console.log("Error fetching user details in the profile settings page!");
            setdisAll([false,""])
            setError("Error fetching the user details from the db")
        })
    }

    const login = e => {
        e.preventDefault()
        if(!disableAll[0]) {
            setdisAll([true, "Logging in ..."])
            signInWithEmailAndPassword(auth, email, password)
                .then(() => {
                    if (!auth.currentUser.emailVerified) {
                        sendEmailVerification(auth.currentUser)
                            .then(() => {
                                setTimeActive(true)
                                history.push('/verify-email')
                                setdisAll([false,""])
                            })
                            .catch(err => {
                                setdisAll([false,""])
                                setError(err.message)
                            })
                    } else {
                        const tabDuplicate = tab;
                        tabDuplicate.login = false;
                        tabDuplicate.otp = true;
                        setTab(tabDuplicate);
                        loadPhoneNo();
                    }
                    setdisAll([false])
                }).catch((err) => {
                console.log(err);
                alert("Invalid Credentials !");
                setdisAll([false])
            })
        }
    }

    const configureCaptcha = () =>{
        window.recaptchaVerifier = new RecaptchaVerifier('sign-in-button', {
            'size': 'invisible',
            'callback': (response) => {
                onSignInSubmit();
                console.log("Recaptcha varified")
            },
            defaultCountry: "US"
        }, auth);
    }


    const onSignInSubmit = (e) => {
        e.preventDefault()
        if(!disableAll[0]) {
            setdisAll([true,"Verifying the otp ..."])
            configureCaptcha()
            const appVerifier = window.recaptchaVerifier;
            //Added phonetest for testing purpose. Kindly remove phonetest and change it to phone in signInWithPhoneNumber Params
            const phonetest = "+16026578606"
            signInWithPhoneNumber(auth,phone, appVerifier)
                .then((confirmationResult) => {
                    window.confirmationResult = confirmationResult;
                    console.log("OTP has been sent")
                    setError("Sent the otp")
                    setdisAll([false,""])
                }).catch((error) => {
                    setdisAll([false,""])
                setError("Unable to send the otp")
                console.log("SMS not sent")
            });
        }
    }

    async function setSignIn () {
        const getUser = httpsCallable(functions, 'signinUser');
        getUser().then(() => {return}).catch(() => {console.log("Unable to send confirmation")})
    }

    const onSubmitOTP = (e) =>{
        e.preventDefault()
        window.confirmationResult.confirm(otp).then((result) => {
            // User signed in successfully.
            const user = result.user;
            signInWithEmailAndPassword(auth, email, password)
                .then(() => {
                    setSignIn();
                    history.push("/")
                })
        }).catch((error) => {

        });
    }

    return(
        <>
            <div class="main-wrapper login-body">
                {
                    disableAll[0] && <div className="modal fade show" id="Loading details" aria-hidden="true" role="dialog" style={{display:"block"}}>
                        <div className="modal-dialog modal-dialog-centered" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <button className="btn btn-primary" type="button" disabled>
                                        <span className="spinner-border spinner-border-sm"></span>
                                    </button>
                                    <span >{disableAll[1]}...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                }

                {
                    error && <div className="modal fade show" id="Error details" aria-hidden="true" role="dialog" style={{display:"block"}}>
                        <div className="modal-dialog modal-dialog-centered" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">{error}</h5>
                                    <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true" onClick={() => setError('')}>&times;</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                }
                <div class="login-wrapper">
                    <div class="container">
                        <div class="loginbox">
                            <div class="login-left">
                                <img class="img-fluid" src={Logo} alt="Logo"/>
                            </div>
                            <div class="login-right">
                                <div class="login-right-wrap">
                                    <h1 >Login</h1>
                                    <p class="account-subtitle">Access to our dashboard</p>
                                    {
                                        tab.login &&
                                        <form onSubmit={login}>
                                            <div id="sign-in-button"></div>
                                            <div className="form-group">
                                                <input className="form-control" type="email" placeholder="Email"
                                                       onChange={e => setEmail(e.target.value)} value={email} required/>
                                            </div>
                                            <div className="form-group">
                                                <input className="form-control" type="password" placeholder="Password"
                                                       onChange={e => setPassword(e.target.value)} value={password}
                                                       required/>
                                            </div>

                                            <div className='text-right'><a onClick={()=>history.push('/forgotPassword')}>Forgot Password?</a>
                                            </div>
                                            <h1></h1>
                                            <div className="form-group">
                                                <button className="btn btn-primary btn-block" type="submit">Login</button>
                                            </div>

                                            
                                        </form>

                                        
                                    }

                                    {
                                        tab.otp &&
                                        <>
                                        <form onSubmit={onSignInSubmit}>
                                            <div id="sign-in-button"></div>
                                            <p class="account-subtitle2">Please confirm your mobile number and click on send OTP for verification : {phone}</p>
                                            <button className="btn btn-primary btn-block" type="submit">Send OTP</button>
                                            <h1></h1>
                                        </form>
                                        <form onSubmit={onSubmitOTP}>
                                            <div className="form-group">
                                                <input className="form-control" type="text" placeholder="Enter OTP"
                                                       onChange={e => setOTP(e.target.value)} required/>
                                            </div>
                                            <div className="form-group">
                                                <button className="btn btn-primary btn-block" type="submit">Submit</button>
                                            </div>
                                        </form>
                                        </>
                                    }
                                    <div className="text-center dont-have">Don’t have an account? <a onClick={()=>history.push('/register')}>Register</a></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <script src="../public/script.js" async="true"></script>
        </>
    )
}

export default Login