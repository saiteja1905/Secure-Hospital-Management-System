import {useState, useEffect} from 'react'
import './forms.css'
import {auth, db, functions} from './firebase'
import {useHistory, Link} from 'react-router-dom'
import {createUserWithEmailAndPassword, sendEmailVerification} from 'firebase/auth'
import {useAuthValue} from './AuthContext'
import {doc, setDoc} from "firebase/firestore";
import './assets/css/bootstrap.min.css'
import './assets/css/font-awesome.min.css'
import './assets/css/style.css'

import Logo from './assets/img/logo-white.png'
import {httpsCallable} from "firebase/functions";
import React from "react";


function Register() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [phone, setPhone] = useState('')
    const [sex, setSex] = useState('')
    const [age, setAge] = useState('')
    const [name, setName] = useState('')
    const [address, setAddress] = useState('')
    const [disableAll,setdisAll] = useState([false,"Loading page information!"]);
    const [error,setError] = useState('');
    const [disabled, setDisabled] = useState(false)
    const history = useHistory()
    const {currentUser, setTimeActive} = useAuthValue()


    const validatePassword = () => {
        let isValid = true
        if (password !== '' && confirmPassword !== ''){
            if (password !== confirmPassword) {
                isValid = false
                setError('Passwords does not match')
            }
        }
        return isValid
    }

    const register = e => {
        if(!disableAll[0]) {
            setdisAll([true,"Creating the user and profile"])
            e.preventDefault()
            setError('')
            setDisabled(true);
            if(validatePassword()) {
                const data = { email: email, name: name, age:age, sex: sex,phone : phone, address: address };
                const inputValidation = httpsCallable(functions, 'validateInput');
                inputValidation(data)
                    .then((result) => {
                        if(!result.data.success) {
                            const errorStr = result.data.data.join(", ");
                            setError('Invalid '  + errorStr + ' fields!!' );
                            setdisAll([false,""])
                            setDisabled(false)
                        } else {
                            const data = result.data.data;
                            createUserWithEmailAndPassword(auth, email, password)
                                .then(() => {
                                    sendEmailVerification(auth.currentUser)
                                        .then(() => {
                                            const profileCreation = httpsCallable(functions, 'createProfile');
                                            profileCreation(data)
                                                .then((result) => {
                                                    if(result.data.success) {
                                                        setTimeActive(true)
                                                        history.push('/verify-email')
                                                        setdisAll([false,""])
                                                    } else {
                                                        setError("User profile creation failed, try again after some time or with different email id!");
                                                        const invalidMails = httpsCallable(functions, 'invalidMails');
                                                        invalidMails(email);
                                                        setdisAll([false,""])
                                                    }
                                                }).catch((err) => {
                                                setError(err.message)
                                                setDisabled(false);
                                                setdisAll([false,""])
                                            })
                                        }).catch((err) => {
                                        setError(err.message)
                                        setdisAll([false,""])
                                        setDisabled(false);
                                    })
                                })
                                .catch(err => {
                                    setError(err.message)
                                    setdisAll([false,""])
                                    setDisabled(false);
                                })
                        }
                    }).catch((error) => {
                    setDisabled(false);
                    console.log(error);
                    setError(error);
                    setEmail('');
                    setPassword('');
                    setConfirmPassword('');
                    setdisAll([false,""])
                });
                // Create a new user with email and password using firebase
            }
        }
    }

    useEffect(() => {
        // Transfer to profile if logged in
    });

    return (
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
            <div class="login-wrapper">
            	<div class="container">
                	<div class="loginbox">
                    	<div class="login-left">
							<img class="img-fluid" src={Logo} alt="Logo"/>
                        </div>
                        <div class="login-right">
							<div class="login-right-wrap">
								<h1>Register</h1>
								<p class="account-subtitle">Access to our dashboard</p>
                                {error && <div className='auth__error'>{error}</div>}
								<form onSubmit={register}>
									<div class="form-group">
										<input class="form-control" type="text" placeholder="Name" onChange={e => setName(e.target.value)} required/>
									</div>
									<div class="form-group">
										<input class="form-control" type="email" value={email} placeholder="Email" onChange={e => setEmail(e.target.value)} required/>
									</div>
                                    <div class="form-group">
                                        <select class="form-control" onChange={e => setSex(e.target.value)} >
                                            <option value=''> Gender</option>
                                            <option value='male'> Male </option>
                                            <option value='female'> Female </option>
                                        </select>
									</div>
                                    <div class="form-group">
										<input class="form-control" type="number" placeholder="Age" required  onChange={e => setAge(e.target.value)}/>
									</div>
                                    <div class="form-group">
										<input class="form-control" type="text" placeholder="Contact Number" value={phone} onChange={e => setPhone(e.target.value)}/>
									</div>
                                    <div class="form-group">
										<input class="form-control" type="text" placeholder="Address" required onChange={e => setAddress(e.target.value)}/>
									</div>
									<div class="form-group">
										<input class="form-control" type="password" value={password} placeholder="Password" onChange={e => setPassword(e.target.value)}/>
									</div>
									<div class="form-group">
										<input class="form-control" type="password" value={confirmPassword} placeholder="Confirm Password" onChange={e => setConfirmPassword(e.target.value)}/>
									</div>
									<div class="form-group mb-0">
										<button class="btn btn-primary btn-block" type="submit" disabled={disabled}>Register</button>
									</div>
								</form>
						
								<div class="text-center dont-have">Already have an account? <a onClick={()=>history.push('/login')}>Login</a></div>
							</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Register