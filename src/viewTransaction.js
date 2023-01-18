import './profile.css'
import * as React from 'react';
import PopupState, { bindTrigger, bindMenu } from 'material-ui-popup-state';
import {useAuthValue} from './AuthContext'
import { signOut, getAuth, updatePassword, signInWithEmailAndPassword, reauthenticateWithCredential, EmailAuthProvider} from 'firebase/auth'
import {auth, db, functions} from './firebase'
import { httpsCallable } from "firebase/functions"
import {useEffect, useState} from "react";
import {useHistory, useParams} from 'react-router-dom'
import './assets2/css/bootstrap.min.css'
import './assets2/plugins/fontawesome/css/fontawesome.min.css'
import './assets2/plugins/fontawesome/css/all.min.css'
import './assets2/css/style.css'
import $ from 'jquery'
import Logo from './assets2/img/logo.png'

function ViewTransaction() {
    const history = useHistory()
    const [user,setUser] = useState({name:"patient"});
    const {transaction} = useParams()
    const [loadUser,setLU] = useState(false);
    const [totalLabCost,setTotalLabCost] = useState(0);
    const [totalPresCost,setTotalPrescCost] = useState(0);
    const [totalApptCost,setTotalApptCost] = useState(0);
    const [navState, setNavState] = useState(false);
    const [trans, setTransaction] = useState({});
    const [insurance, setInsurance] = useState(0);
    const [totalCost,setTotalCost] = useState(0);
    const [due,setDue] = useState(0);
    const [disableAll,setdisAll] = useState([true,"Loading page information!"]);
    const [error,setError] = useState('');
    const month = ["JAN","FEB","MAR","APR","MAY","JUNE","JULY","AUG","SEP","OCT","NOV","DEC"];
    const slotToTime = {1:"9.00 AM",2:"11.00 AM",3:"1.00 PM",4:"3.00 PM",5:"5.00 PM"};
    const statusToInfo = {0:"Processing",1:"Approved",2:"Rejected"};
    const [docCost,setDoctorCost] = useState(0);
    const [appt,setAppt] = useState({patient:{address:""}});
    const [patientLogo,setPatientLogo] = useState('')
    const [send,setSend] = useState({});

    async function loadUserInfo () {
        const getUser = httpsCallable(functions, 'getUserInfo');
        getUser()
            .then((result) => {
                if(result.data.success && result.data.data.category == "0") {
                    // sendEmailConfirmation();
                    setUser(result.data.data);
                    if(result.data.data.image) {
                        setPatientLogo(result.data.data.image);
                    } else if(result.data.data.sex == "male") {
                        setPatientLogo("https://firebasestorage.googleapis.com/v0/b/login-31221.appspot.com/o/images%2Fmale.png?alt=media&token=ab31fc18-4739-41ab-bd13-2c2703dec41e");
                    } else {
                        setPatientLogo("https://firebasestorage.googleapis.com/v0/b/login-31221.appspot.com/o/images%2Ffemale.png?alt=media&token=7308c8cd-bb9e-45a5-898a-f6aa6d6e9961");
                    }
                } else {
                    logout();
                }
            }).catch((error) => {
            console.log("Error fetching user details in the profile settings page!");
            logout();
        })
    }

    const logout = () => {
        signOut(auth);
        history.push("/login");
    }

    const setField = (field,value) => {
        let sending  = send
        sending[field] = value
        setSend(sending)
    }

    useEffect( () => {
        if (!loadUser) {
            setdisAll([true,"loading info"]);
            loadUserInfo();
            loadTransactionInfo();
            setLU(true);
        }
    });

    async function loadTransactionInfo () {
        const report = httpsCallable(functions, 'getTransactions');
        report({transactionId:transaction})
            .then((result) => {
                if(result.data.success) {
                    let dupe = result.data.data[transaction]
                    var t = new Date(dupe.date);
                    dupe["req_d"] = t.getDate();
                    dupe["req_y"] = t.getFullYear();
                    dupe["req_m"] = month[t.getMonth()];
                    setTransaction(dupe);
                } else {
                    console.log(result);
                }
                setdisAll([false,""])

            }).catch((error) => {
            console.log("Error fetching transactions!");
            setdisAll([false,""])
        })
    }


    const makePayment = (e) => {
        e.preventDefault()
        if(!disableAll[0]){
            // makeTransaction();
        }
    }

    return (
        <div class="main-wrapper">
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

            <header className="header">
                <nav className="navbar navbar-expand-lg header-nav">
                    <div className="navbar-header">
                        <a id="mobile_btn" >
							<span className="bar-icon">
								<span></span>
								<span></span>
								<span></span>
							</span>
                        </a>
                        <a onClick={() => history.push('/')} className="navbar-brand logo">
                            <img src={Logo} className="img-fluid" alt="Logo" />
                        </a>
                    </div>
                    <div className="main-menu-wrapper">
                        <div className="menu-header">
                            <a className="menu-logo">
                                <img src={Logo} className="img-fluid" alt="Logo" />
                            </a>
                            <a id="menu_close" className="menu-close" >
                                <i className="fas fa-times"></i>
                            </a>
                        </div>
                        <ul className="main-nav">
                            <li>
                                <a onClick={()=>history.push('/')}>Home</a>
                            </li>
                        </ul>
                    </div>
                    <ul className="nav header-navbar-rht">
                        <li className="nav-item contact-item">
                            <div className="header-contact-img">
                                <i className="far fa-hospital"></i>
                            </div>
                            <div className="header-contact-detail">
                                <p className="contact-header">Contact</p>
                                <p className="contact-info-header"> +1 315 369 5943</p>
                            </div>
                        </li>
                        {
                            navState
                                ? <li className="nav-item dropdown has-arrow logged-item show">
                                    <a  className="dropdown-toggle nav-link" data-toggle="dropdown" aria-expanded="true" onClick={() => setNavState(!navState)}>
                                    <span className="user-img">
                                        <img className="rounded-circle" src={patientLogo} width="31" alt="Ryan Taylor" />
                                    </span>
                                    </a>
                                    <div className="dropdown-menu dropdown-menu-right show">
                                        <div className="user-header">
                                            <div className="avatar avatar-sm">
                                                <img src={patientLogo} alt="User Image" className="avatar-img rounded-circle" />
                                            </div>
                                            <div className="user-text">
                                                <h6>{user.username}</h6>
                                                <p className="text-muted mb-0">Patient</p>
                                            </div>
                                        </div>
                                        <a className="dropdown-item" onClick={() => history.push('/')}>Dashboard</a>
                                        <a className="dropdown-item" onClick={() => history.push('/profile')}>Profile Settings</a>
                                        <a className="dropdown-item" onClick={() => logout()}>Logout</a>
                                    </div>
                                </li>
                                : <li className="nav-item dropdown has-arrow logged-item">
                                    <a className="dropdown-toggle nav-link" data-toggle="dropdown" onClick={() => setNavState(!navState)}>
                                    <span className="user-img">
                                        <img className="rounded-circle" src={patientLogo} width="31" alt="Ryan Taylor" />
                                    </span>
                                    </a>
                                </li>
                        }
                    </ul>
                </nav>
            </header>

            <div class="breadcrumb-bar">
                <div class="container-fluid">
                    <div class="row align-items-center">
                        <div class="col-md-12 col-12">
                            <nav aria-label="breadcrumb" class="page-breadcrumb">
                                <ol class="breadcrumb">
                                    <li class="breadcrumb-item"><a href="index-2.html">Home</a></li>
                                    <li class="breadcrumb-item active" aria-current="page">Checkout</li>
                                </ol>
                            </nav>
                            <h2 class="breadcrumb-title">Checkout</h2>
                        </div>
                    </div>
                </div>
            </div>

            <div class="content">
                <div class="container">

                    <div class="row">
                        <div className="col-md-1 col-lg-6 col-xl-4 theiaStickySidebar">
                            <div className="profile-sidebar">
                                <div className="widget-profile pro-widget-content">
                                    <div className="profile-info-widget">
                                        <a className="booking-doc-img">
                                            <img src={patientLogo} alt="User Image" />
                                        </a>
                                        <div className="profile-det-info">
                                            <h3>{user.username}</h3>
                                            <div className="patient-details">
                                                <h5><i className="fas fa-birthday-cake"></i>{user.age} years</h5>
                                                <h5 className="mb-0"><i className="fas fa-map-marker-alt"></i>{user.address}</h5>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="dashboard-widget">
                                    <nav className="dashboard-menu">
                                        <ul>
                                            <li>
                                                <a onClick={()=>history.push('/')}>
                                                    <i className="fas fa-columns"></i>
                                                    <span>Dashboard</span>
                                                </a>
                                            </li>
                                            <li>
                                                <a onClick={()=> history.push('/profile')}>
                                                    <i className="fas fa-user-cog"></i>
                                                    <span>Profile Settings</span>
                                                </a>
                                            </li>
                                            <li>
                                                <a onClick={()=> history.push('/changePassword')}>
                                                    <i className="fas fa-lock"></i>
                                                    <span>Change Password</span>
                                                </a>
                                            </li>
                                            <li>
                                                <a onClick={()=>history.push("/chatbot")}>
                                                    <i className="fas fa-sign-out-alt"></i>
                                                    <span>Chatbot</span>
                                                </a>
                                            </li><li>
                                                <a onClick={()=>logout()}>
                                                    <i className="fas fa-sign-out-alt"></i>
                                                    <span>Logout</span>
                                                </a>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>

                            </div>
                        </div>
                        <div class="col-md-7 col-lg-8">
                            <div class="card">
                                <div class="card-body">

                                    <form onSubmit={makePayment}>
                                        <div class="payment-widget">
                                            <h4 class="card-title">Payment Information</h4>

                                            <div class="payment-list">
                                                <label class="payment-radio credit-card-option">
                                                    <input type="radio" name="radio" checked/>
                                                    <span class="checkmark"></span>
                                                    Credit card
                                                </label>
                                                <div class="row">
                                                    <div class="col-md-6">
                                                        <div class="form-group card-label">
                                                            <label for="card_name">Name on Card</label>
                                                            <input class="form-control" id="card_name" required type="text" value={trans.name}/>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-6">
                                                        <div class="form-group card-label">
                                                            <label for="card_number">Card Number</label>
                                                            <input class="form-control" id="card_number" required placeholder="1234  5678  9876  5432" type="number" value={trans.card}/>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="row">
                                                <div className="col-md-6">
                                                    <div className="form-group card-label">
                                                        <label htmlFor="card_name">Amount Paid</label>
                                                        <input className="form-control" id="card_name" required type="number"
                                                               value={trans.amount}/>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="form-group card-label">
                                                        <label htmlFor="card_name">Date of Payment</label>
                                                        <input className="form-control" id="card_name" required type="text"
                                                               value={trans.req_d + '-' + trans.req_m + '-' + trans.req_y}/>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="row">
                                                <div className="col-md-6">
                                                    <div className="form-group card-label">
                                                        <label htmlFor="card_name">Status of the Transaction</label>
                                                        <input className="form-control" id="card_name" required type="text" value={statusToInfo[trans.status]}/>
                                                    </div>
                                                </div>
                                            </div>


                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>

            <footer className="footer">

                <div className="footer-top">
                    <div className="container-fluid">
                        <div className="row">
                            <div className="col-lg-2 col-md-3">

                                <div className="footer-widget footer-about">
                                    <div className="footer-about-content">
                                        <div className="social-icon">
                                            <ul>
                                                <li>
                                                    <a href="#" target="_blank"><i className="fab fa-facebook-f"></i>
                                                    </a>
                                                </li>
                                                <li>
                                                    <a href="#" target="_blank"><i className="fab fa-twitter"></i> </a>
                                                </li>
                                                <li>
                                                    <a href="#" target="_blank"><i
                                                        className="fab fa-linkedin-in"></i></a>
                                                </li>
                                                <li>
                                                    <a href="#" target="_blank"><i className="fab fa-instagram"></i></a>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <div className="col-lg-3 col-md-6">

                                <div className="footer-widget footer-contact">
                                    <h2 className="footer-title">Contact Us</h2>
                                    <div className="footer-contact-info">
                                        <div className="footer-address">
                                            <span><i className="fas fa-map-marker-alt"></i></span>
                                            <p> Arizona State University, Tempe, Arizona-85281, United Stated</p>
                                        </div>
                                        <p>
                                            <i className="fas fa-phone-alt"></i>
                                            +1 818 391 0023
                                        </p>
                                        <p className="mb-0">
                                            <i className="fas fa-envelope"></i>
                                            healthinfinitum9@gmail.com
                                        </p>
                                    </div>
                                </div>

                            </div>

                        </div>
                    </div>
                </div>


            </footer>

        </div>
    )

}

export default ViewTransaction;