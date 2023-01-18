import './verifyEmail.css'
import {Avatar, Button, Grid, Paper} from '@material-ui/core';
import SecurityIcon from '@material-ui/icons/Security';
import {useAuthValue} from './AuthContext'
import {React, useState, useEffect} from 'react'
import {auth} from './firebase'
import {sendEmailVerification} from 'firebase/auth'
import {useHistory} from 'react-router-dom'
import Logo from './assets/img/logo-white.png'
import { httpsCallable } from "firebase/functions"
import { functions} from './firebase'


function VerifyEmail() {
    const paperStyle = {padding : 20, height:'60vh', width:360, margin:'50px auto'}
    const {currentUser} = useAuthValue()
    const [time, setTime] = useState(60)
    const {timeActive, setTimeActive} = useAuthValue()
    const history = useHistory()
    const [user,setUser] = useState({name:"patient"});
    const [disableAll,setdisAll] = useState([false,"Loading page information!"]);
    const [error,setError] = useState('');

    async function sendEmailConfirmation(email) {
        const getUser = httpsCallable(functions, 'emailUserCreate');
        getUser({email:user.email,name:user.username})
            .then((result) => {
                console.log("Email sent succesfully");
                history.push('/')
            }).catch((error) => {
            console.log("Error sending confirmation email to the user");
            history.push("/login");
        })
    }

    async function loadUserInfo () {
        const getUser = httpsCallable(functions, 'getUserInfo');
        getUser()
            .then((result) => {
                if(result.data.success) {
                    setUser(result.data.data);
                    sendEmailConfirmation();
                }
            }).catch((error) => {
            console.log("Error fetching user details in the profile settings page!");
            history.push("/login");
            setError("Error fetching the user details")
        })
    }
    useEffect(() => {
        const interval = setInterval(() => {
            currentUser?.reload()
                .then(() => {
                    if(currentUser?.emailVerified){
                        loadUserInfo();
                        clearInterval(interval)
                    }
                })
                .catch((err) => {
                    console.log(err.message);
                })
        }, 1000)
    }, [history, currentUser])

    useEffect(() => {
        let interval = null
        if(timeActive && time !== 0 ){
            interval = setInterval(() => {
                setTime((time) => time - 1)
            }, 1000)
        }else if(time === 0){
            setTimeActive(false)
            setTime(60)
            clearInterval(interval)
        }
        return () => clearInterval(interval);
    }, [timeActive, time, setTimeActive])

    const resendEmailVerification = () => {
        sendEmailVerification(auth.currentUser)
            .then(() => {
                setTimeActive(true)
            }).catch((err) => {
            alert(err.message)
        })
    }

    return (
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
                                    <h1 >Verify your Email Address</h1>
                                    <p class="account-subtitle">Follow the steps in email to verify account</p>
                                    <p class="account-subtitle2">A Verification Email has been sent to email address: {currentUser?.email}</p>


                                    <form onSubmit={resendEmailVerification}>
                                        <div class="form-group">
                                            <button class="btn btn-primary btn-block" type="submit" disabled={timeActive}>Resend Email {timeActive && time}</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default VerifyEmail