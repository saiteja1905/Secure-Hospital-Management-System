import {React, useEffect, useState} from 'react'
import { Link } from 'react-router-dom'
import './assets/css/bootstrap.min.css'
import './assets/css/font-awesome.min.css'
import './assets/css/style.css'
import {getAuth,sendPasswordResetEmail} from 'firebase/auth'
import {auth} from './firebase'
import {useHistory} from 'react-router-dom'
import {useAuthValue} from './AuthContext'
import Logo from './assets/img/logo-white.png'
import { httpsCallable } from "firebase/functions"
import { functions} from './firebase'

function PasswordReset(){
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const history = useHistory()
    const [disableAll,setdisAll] = useState([true,"Loading page information!"]);
    
    const auth = getAuth();
    const resetPassword = e => {
        e.preventDefault()
        sendPasswordResetEmail(auth, email)
            .then((result) => {
                console.log("Password Reset Instructions sent to email succesfully");
                history.push('/login')
            }).catch((err) => {
            console.log(err);
            setError("Invalid Email! Please try again");
        })
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
                                    <h1 >Forgot Password?</h1>
                                    <p class="account-subtitle">Password Reset Instructions</p>
                                    {error && <div className='account-subtitle auth__error'>{error}</div>}
                                    {
                                        <form onSubmit={resetPassword}>
                                            <div id="sign-in-button"></div>
                                            <div className="form-group">
                                                <input className="form-control" type="email" placeholder="Email"
                                                       onChange={e => setEmail(e.target.value)} value={email} required/>
                                            </div>
                                            <div className="form-group">
                                                <button className="btn btn-primary btn-block" type="submit">Reset Password</button>
                                            </div>
                                        </form>

                                        
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

export default PasswordReset;