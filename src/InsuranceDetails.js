import './profile.css'
import * as React from 'react';
import PopupState, { bindTrigger, bindMenu } from 'material-ui-popup-state';
import {useAuthValue} from './AuthContext'
import { signOut } from 'firebase/auth'
import {auth, db, functions} from './firebase'
import { httpsCallable } from "firebase/functions"
import {useEffect, useState} from "react";
import {useHistory, useParams} from 'react-router-dom'
import './assets2/css/bootstrap.min.css'
import './assets2/plugins/fontawesome/css/fontawesome.min.css'
import "./assets2/css/bootstrap-datetimepicker.min.css"
import './assets2/plugins/fontawesome/css/all.min.css'
import './assets2/plugins/select2/css/select2.min.css'
import './assets2/css/style.css'

import Logo from './assets2/img/logo.png'
import { getStorage, ref, uploadBytesResumable,getDownloadURL } from "firebase/storage";

function InsuranceDetails() {
    const {currentUser} = useAuthValue();
    const [user,setUser] = useState({});
    const [navState, setNavState] = useState(false);
    const [loadUser,setLU] = useState(false);
    const [error, setError] = useState('');
    const [t, st] = useState(0);
    const {InsuranceId} = useParams();
    const [insuranceDetails, setinsuranceDetails] = useState({"id":"id"});
    const [patientLogo,setPatientLogo] = useState('');
    const [disableAll,setdisAll] = useState([true,"Loading page information!"]);

    const logout = () => {
		signOut(auth);
		history.push("/login");
	}
    async function blockchaintest () {
        const getUser = httpsCallable(functions, 'blockchaintest');
        getUser()
            .then((result) => {
                console.log("blockchain")
            }).catch((error) => {
            console.log("Error fetching user details in the profile settings page!");
        })
    }
    useEffect( () => {
        if (!loadUser) {
            setLU(true);
            setdisAll([true,"Initial db lookup for the page information."]);
            loadUserInfo();
            getInsurance();
            blockchaintest();
        }
    });

    const history = useHistory();

    async function loadUserInfo () {
        const getUser = httpsCallable(functions, 'getUserInfo');
        getUser()
            .then((result) => {
                if(result.data.success  && result.data.data.category == "4") {
                    setUser(result.data.data);
                    setLU(true);
                    if(result.data.data.image) {
                        setPatientLogo(result.data.data.image);
                    } else if(result.data.data.sex == "male") {
                        setPatientLogo("https://firebasestorage.googleapis.com/v0/b/login-31221.appspot.com/o/images%2Fmale.png?alt=media&token=ab31fc18-4739-41ab-bd13-2c2703dec41e");
                    } else {
                        setPatientLogo("https://firebasestorage.googleapis.com/v0/b/login-31221.appspot.com/o/images%2Ffemale.png?alt=media&token=7308c8cd-bb9e-45a5-898a-f6aa6d6e9961");
                    }
                }
                setdisAll([false,""])
            }).catch((error) => {
            console.log("Error fetching user details in the profile settings page!");
        })
    }

    async function getInsurance () {
        const getInsurance = httpsCallable(functions, 'getInsurances');
        getInsurance({insurance_id:InsuranceId})
            .then((result) => {
                if(result.data.success) {
                    for(var x in result.data.data.data) {
                        let data = result.data.data.data[x];
                            setinsuranceDetails(data);
                    }
                    setLU(true);
                    st(t+1);
                } else {
                    setError(result.data.data);
                }
                setdisAll([false,""])
            }).catch((error) => {
            console.log("Error fetching insurance from database! Please reach out to Admin!",error);
        })
    }

    return (
        <div className="main-wrapper">

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
                        <a id="mobile_btn">
							<span className="bar-icon">
								<span></span>
								<span></span>
								<span></span>
							</span>
                        </a>
                        <a className="navbar-brand logo">
                            <img src={Logo} className="img-fluid" alt="Logo" />
                        </a>
                    </div>
                    <div className="main-menu-wrapper">
                        <div className="menu-header">
                            <a className="menu-logo">
                                <img src={Logo} className="img-fluid" alt="Logo" />
                            </a>
                            <a id="menu_close" className="menu-close">
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
                                    <a className="dropdown-toggle nav-link" data-toggle="dropdown" aria-expanded="true" onClick={() => setNavState(!navState)}>
                                    <span className="user-img">
                                        <img className="rounded-circle" src={patientLogo} width="31" alt={user.username} />
                                    </span>
                                    </a>
                                    <div className="dropdown-menu dropdown-menu-right show">
                                        <div className="user-header">
                                            <div className="avatar avatar-sm">
                                                <img src={patientLogo} alt="User Image" className="avatar-img rounded-circle" />
                                            </div>
                                            <div className="user-text">
                                                <h6>{user.username}</h6>
                                            </div>
                                        </div>
                                        <a className="dropdown-item" onClick={() => history.push('/')}>Dashboard</a>
                                        <a className="dropdown-item" onClick={()=> history.push('/profile')}>Profile Settings</a>
                                        <a className="dropdown-item" onClick={() => logout()}>Logout</a>
                                    </div>
                                </li>
                                : <li className="nav-item dropdown has-arrow logged-item">
                                    <a className="dropdown-toggle nav-link" data-toggle="dropdown" onClick={() => setNavState(!navState)}>
                                    <span className="user-img">
                                        <img className="rounded-circle" src={patientLogo} width="31" alt={user.username} />
                                    </span>
                                    </a>
                                    <div className="dropdown-menu dropdown-menu-right">
                                        <div className="user-header">
                                            <div className="avatar avatar-sm">
                                                <img src={patientLogo} alt="User Image" className="avatar-img rounded-circle" />
                                            </div>
                                            <div className="user-text">
                                                <h6>{user.username}</h6>
                                            </div>
                                        </div>
                                        <a className="dropdown-item" onClick={() => history.push('/')}>Dashboard</a>
                                        <a className="dropdown-item" onClick={()=> history.push('/profile')}>Profile Settings</a>
                                        <a className="dropdown-item" onClick={() => logout()}>Logout</a>
                                    </div>
                                </li>
                        }
                    </ul>
                </nav>
            </header>

            <div className="breadcrumb-bar">
                <div className="container-fluid">
                    <div className="row align-items-center">
                        <div className="col-md-12 col-12">
                            <nav aria-label="breadcrumb" className="page-breadcrumb">
                                <ol className="breadcrumb">
                                    <li className="breadcrumb-item"><a onClick={()=>history.push('/')}>Home</a></li>
                                    <li className="breadcrumb-item active" aria-current="page">Dashboard</li>
                                </ol>
                            </nav>
                            <h2 className="breadcrumb-title">Dashboard</h2>
                        </div>
                    </div>
                </div>
            </div>

            <div className="content">
                <div className="container-fluid">

                    <div className="row">

                        <div className="col-md-5 col-lg-4 col-xl-3 theiaStickySidebar">
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
                                            <li onClick={() => history.push('/')}>
                                                <a onClick={() => history.push('/')}>
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

                        <div className="col-md-7 col-lg-8 col-xl-9">
                            <div className="card">
                                <div className="card-body">
                                        <div className="row form-row">
                                            <div className="col-12 col-md-12">
                                                <span><h3>Insurance</h3></span><br></br>
                                            </div>
                                            <div className="col-12 col-md-6">
                                                <div className="form-group">
                                                <h4>Insurance Id: </h4>
                                                    <h4>{insuranceDetails.id}</h4><br></br>
                                                    </div>
                                            </div>

                                            <div className="col-12 col-md-6">
                                                <div className="form-group">
                                                <span><h4>Description: </h4></span><br></br>
                                                    <h4>{insuranceDetails.start_date}</h4>
                                                </div>
                                            </div>

                                            <div className="col-12 col-md-6">
                                                <div className="form-group">
                                                <span><h4>Start Date: </h4></span><br></br>
                                                    <h4>{insuranceDetails.created_by}</h4>
                                                </div>
                                            </div>
                                            <div className="col-12 col-md-6">
                                                <div className="form-group">
                                                    <span><h4>Premium Per Year: </h4></span><br></br>
                                                    <h4>{insuranceDetails.premium}</h4>
                                                </div>
                                            </div>
                                            
                                            <div className="col-12 col-md-6">
                                                <div className="form-group">
                                                <span><h4>Created By: </h4></span><br></br>
                                                    <label>Test</label>
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

export default InsuranceDetails
