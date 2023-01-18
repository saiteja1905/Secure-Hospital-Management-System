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

function CheckOut() {
    const history = useHistory()
    const [user,setUser] = useState({name:"patient"});
    const [disableAll,setdisAll] = useState([true,"Loading the info"]);
    const {appointmentId} = useParams()
    const [loadUser,setLU] = useState(false);
    const [totalLabCost,setTotalLabCost] = useState(0);
    const [totalPresCost,setTotalPrescCost] = useState(0);
    const [totalApptCost,setTotalApptCost] = useState(0);
    const [navState, setNavState] = useState(false);
    const [insurance, setInsurance] = useState(0);
    const [totalCost,setTotalCost] = useState(0);
    const [due,setDue] = useState(0);
    const [error,setError] = useState('');
    const month = ["JAN","FEB","MAR","APR","MAY","JUNE","JULY","AUG","SEP","OCT","NOV","DEC"];
    const slotToTime = {1:"9.00 AM",2:"11.00 AM",3:"1.00 PM",4:"3.00 PM",5:"5.00 PM"};
    const [docCost,setDoctorCost] = useState(0);
    const [appt,setAppt] = useState({patient:{address:""}});
    const [patientLogo,setPatientLogo] = useState('')
    const [send,setSend] = useState({});

    async function loadReportInfo () {
        const report = httpsCallable(functions, 'getReports');
        report({appointmentId:appointmentId})
            .then((result) => {
                if(result.data.success) {
                    var cost_data = result.data.data;
                    setTotalCost(result.data.data.Cost);
                    setDue(result.data.data.due);
                    setTotalPrescCost(cost_data.prescription_cost);
                    setTotalLabCost(cost_data.lab_cost);
                    setTotalApptCost(cost_data.appointment_cost);
                    setInsurance(cost_data.status);
                } else {
                    console.log(result);
                }
                setdisAll([false,""])

            }).catch((error) => {
            console.log("Error fetching user details in the profile settings page!");
        })
    }

    async function loadAppointmenetInfo () {
        const getUser = httpsCallable(functions, 'getAppointmentInfo');
        getUser({apptId:appointmentId})
            .then((result) => {
                if(result.data.success) {
                    let apptDetails = result.data.data;
                    let date = apptDetails.date.split("-");
                    apptDetails["id"] = appointmentId;
                    apptDetails["d"] = date[1];
                    apptDetails["y"] = date[2];
                    apptDetails["m"] = month[date[0]-1];
                    const getDocuser = httpsCallable(functions, 'getDoctorDetails');
                    getDocuser({doctor_id:apptDetails.doctor_id})
                        .then((result) => {
                            if(result.data.success) {
                                setDoctorCost(result.data.data[0]);
                            }
                        }).catch((error) => {
                        console.log("Error fetching doctors details in the search doctor page!");
                    })
                    setAppt(apptDetails);
                } else {
                    setError(result.data.data);
                }
                setdisAll([false,""]);

            }).catch((error) => {
            setError("Error fetching user details in the profile settings page!");
        })
    }

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
            setLU(true);
            loadReportInfo();
            loadAppointmenetInfo();
        }
    });

    async function makeTransaction () {
        const report = httpsCallable(functions, 'makeTransaction');
        report({report:appointmentId,data:send})
            .then((result) => {
                if(result.data.success) {
                    setError("Transaction successfull")
                    history.push("/transaction/" + result.data.data);
                } else {
                    console.log(result);
                }
                setdisAll([false,""])

            }).catch((error) => {
            console.log("Error fetching user details in the profile settings page!");
            setdisAll([false,""])
        })
    }


    const makePayment = (e) => {
        e.preventDefault()
        if(!disableAll[0]){
            setdisAll([true,"updating transaction"])
            makeTransaction();
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
                    <div class="col-md-7 col-lg-8">
                        <div class="card">
                            <div class="card-body">
                            
                                <form onSubmit={makePayment}>
                                    <div class="payment-widget">
                                        <h4 class="card-title">Payment Method</h4>
                                        
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
                                                        <input class="form-control" id="card_name" required type="text" onChange={e => setField("name",e.target.value)}/>
                                                    </div>
                                                </div>
                                                <div class="col-md-6">
                                                    <div class="form-group card-label">
                                                        <label for="card_number">Card Number</label>
                                                        <input class="form-control" id="card_number" required placeholder="1234  5678  9876  5432" type="number" onChange={e => setField("card",e.target.value)}/>
                                                    </div>
                                                </div>
                                                <div class="col-md-4">
                                                    <div class="form-group card-label">
                                                        <label for="expiry_month">Expiry Month</label>
                                                        <input class="form-control" id="expiry_month" placeholder="MM" required type="number" onChange={e => setField("month",e.target.value)}/>
                                                    </div>
                                                </div>
                                                <div class="col-md-4">
                                                    <div class="form-group card-label">
                                                        <label for="expiry_year">Expiry Year</label>
                                                        <input class="form-control" id="expiry_year" placeholder="YYYY" required type="number" onChange={e => setField("year",e.target.value)}/>
                                                    </div>
                                                </div>
                                                <div class="col-md-4">
                                                    <div class="form-group card-label">
                                                        <label for="cvv">CVV</label>
                                                        <input class="form-control" id="cvv" type="number" required onChange={e => setField("cvv",e.target.value)}/>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="form-group card-label">
                                                    <label htmlFor="card_name">Amount</label>
                                                    <input className="form-control" id="card_name" required type="number"
                                                           onChange={e => setField("amount", e.target.value)}/>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="terms-accept">
                                            <div class="custom-checkbox">
                                               <input type="checkbox" id="terms_accept" required/>
                                               <label for="terms_accept">I have read and accept <a >Terms &amp; Conditions</a></label>
                                            </div>
                                        </div>

                                        <div class="submit-section mt-4">
                                            <button type="submit" class="btn btn-primary submit-btn" onSubmit={e => makePayment(e)}>Confirm and Pay</button>
                                        </div>
                                    </div>
                                </form>
                                
                            </div>
                        </div>
                        
                    </div>
                    
                    <div class="col-md-5 col-lg-4 theiaStickySidebar">
                    
                        <div class="card booking-card">
                            <div class="card-header">
                                <h4 class="card-title">Booking Summary</h4>
                            </div>
                            <div class="card-body">
                            
                                <div class="booking-doc-info">
                                    <div class="booking-info">
                                        <h4>Doctor Name :   Dr. {appt.doctor_name}</h4>
                                        <h4>Diagnosis : {appt.type_of_diagnosis}</h4>
                                    </div><br />
                                </div>
                                
                                <div class="booking-summary">
                                    <div class="booking-item-wrap">
                                        <ul class="booking-date">
                                            <li>Date <span>{appt.d} {appt.m} {appt.y}</span></li>
                                            <li>Time <span>{slotToTime[appt.slot_allocated]}</span></li>
                                        </ul>
                                        <ul class="booking-fee">
                                            <li>Consulting Fee <span>${docCost.cost}</span></li>
                                            <li>Prescription Fee<span>${totalPresCost}</span></li>
                                            <li>Lab test Fee<span>${totalLabCost}</span></li>
                                            <li>Total Cost<span>${totalCost}</span></li>
                                        </ul>
                                        <div class="booking-total">
                                            <ul class="booking-total-list">
                                                <li>
                                                    <span>Due</span>
                                                    <span class="total-cost">${due}</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
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

export default CheckOut;