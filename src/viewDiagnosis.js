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
import './assets2/plugins/fontawesome/css/all.min.css'
import './assets2/css/style.css'
import Logo from './assets2/img/logo.png'

function ViewDiagnosis(){
    const history = useHistory();
    const {currentUser} = useAuthValue();
    const [user,setUser] = useState({name:"patient"});
    const [loadUser,setLU] = useState(false);
    const [diagnosistype, AddDiagnosisType] = useState('');
    const [navState, setNavState] = useState(false);
    const [patientName,setPN] = useState('Patient');
    const [disableAll,setdisAll] = useState([true,"Loading page information!"]);
    const [error,setError] = useState('');
    const {appointmentId} = useParams()
    const [appt,setAppt] = useState({patient:{address:""}});
    const [labs,setLabs] = useState([])
    const [existingLabs,setExistingLabs] = useState([])
    const [existingTabs,setExistingTabs] = useState([])
    const [tabs,settabs] = useState([])
    const [testSelected, setLabTestSelected] = useState([])
    const [tabSelected, setTabSelect] = useState([])
    const [tab,setTab] = useState({'appointments':true,'prescriptions':false,'billing':false,'medical_records':false})
    const weekday = ["SUN","MON","TUE","WED","THUR","FRI","SAT"];
    const statusToText = {0:"Recommended by doctor",1:"Processing by Lab staff",2: "Lab test report generated"};
    const month = ["JAN","FEB","MAR","APR","MAY","JUNE","JULY","AUG","SEP","OCT","NOV","DEC"];
    const slotToTime = {1:"9.00 AM - 11.00 AM",2:"11.00 AM - 1:00 PM",3:"1.00 PM - 3:00 PM",4:"3.00 PM - 5:00 PM",5:"5.00 PM - 7:00 PM"};
    const statusToClass = {1:{"class":"badge badge-pill bg-warning-light","text":"pending"},
        2:{"class":"badge badge-pill bg-success-light","text":"confirm"},
        3:{"class":"badge badge-pill bg-danger-light","text":"rejected"}}
    const [patientLogo,setPatientLogo] = useState('')


    const logout = () => {
        signOut(auth);
        history.push("/login");
    }

    async function loadUserInfo () {
        const getUser = httpsCallable(functions, 'getUserInfo');
        getUser()
            .then((result) => {
                if(result.data.success && ["0"].includes(result.data.data.category)) {
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
                    history.push("/login");
                }

            }).catch((error) => {
            console.log("Error fetching user details in the profile settings page!");
            history.push("/login");
        })
    }

    async function sendEmail () {
        const email = httpsCallable(functions, 'sendEmail');
        email()
            .then((result) => {
                if(result.data) {
                    console.log(result.data);
                } else {
                    setError("Error sendign email");
                }
            }).catch((error) => {
            setError("caught in  sending the email");
        })
    }

    async function loadDiagnosisInfo () {
        const getUser = httpsCallable(functions, 'getDiagnosis');
        getUser({appointmentId:appointmentId})
            .then((result) => {
                if(result.data.success) {
                    AddDiagnosisType(result.data.data.diagnosis);
                    settabs(result.data.data.prescriptions);
                    setLabs(result.data.data.lab_tests);
                } else {
                    setError(result.data.data);
                }
                setdisAll([false,""]);
            }).catch((error) => {
            setError(error);
            setdisAll([false,""]);
        })
    }
    async function loadTabsNLabs () {
        const getTabsNLabs = httpsCallable(functions, 'getTabsNLabs');
        getTabsNLabs({"tab":true,"lab":true})
            .then((result) => {
                if(result.data.success) {
                    // sendEmailConfirmation();
                    let dupeTabs = []
                    for(let t in result.data.tab) {
                        let tablet = result.data.tab[t];
                        tablet["id"] = t;
                        dupeTabs.push(tablet);
                    }
                    let dupeLabs = []
                    for(let t in result.data.lab) {
                        let labData = result.data.lab[t];
                        labData["id"] = t;
                        dupeLabs.push(labData);
                    }
                    setExistingTabs(dupeTabs);
                    setExistingLabs(dupeLabs);
                }
            }).catch((error) => {
            console.log(error);
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
                    setAppt(apptDetails);
                } else {
                    setError(result.data.data);
                }
                setdisAll([false,""]);

            }).catch((error) => {
            setError("Error fetching user details in the profile settings page!");
        })
    }

    async function updateLabtest (lab) {
        const getUser = httpsCallable(functions, 'updateLabTest');
        getUser({labtestId:lab,status:1})
            .then((result) => {
                if(result.data.success) {
                    let dummy = labs
                    for(var x in dummy) {
                        if(x == lab) {
                            dummy[x].status = 1;
                            break;
                        }
                    }
                    setLabs(dummy);
                } else {
                    setError(result.data.data);
                }
                setdisAll([false,""]);

            }).catch((error) => {
            setError("Error fetching user details in the profile settings page!");
        })
    }

    const requestForLabtest = (lab) => {
        if(!disableAll[0]) {
            setdisAll([true,"Laoding or Updating the info"]);
            updateLabtest(lab);
        }

    }

    useEffect( () => {
        if (!loadUser) {
            setdisAll([true,"Laoding or Updating the info"]);
            loadUserInfo();
            loadTabsNLabs();
            loadAppointmenetInfo();
            loadDiagnosisInfo();
            // sendEmail();
            setLU(true);
        }
    });
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
                                        <a className="dropdown-item" onClick={() => logout()}>Logout</a>
                                    </div>
                                </li>
                                : <li className="nav-item dropdown has-arrow logged-item">
                                    <a className="dropdown-toggle nav-link" data-toggle="dropdown" onClick={() => setNavState(!navState)}>
                                <span className="user-img">
                                    <img className="rounded-circle" src={patientLogo} width="31" alt={user.username}/>
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


            <div class="content">
                <div class="container-fluid">

                    <div class="row">
                        <div class="col-md-5 col-lg-4 col-xl-3 theiaStickySidebar">

                            <div class="card widget-profile pat-widget-profile">
                                <div class="card-body">
                                    <div class="pro-widget-content">
                                        <div class="profile-info-widget">
                                            <div class="profile-det-info">
                                                <h1>Appointment Details</h1>
                                                <h3><a>Patient Name : {appt.patient_name}</a></h3>
                                                <div class="patient-details">
                                                    <h5><b>Patient ID :</b> {appt.patient_id}</h5>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="patient-info">
                                        <ul>
                                            <li>Appointment ID <span>{appt.id}</span></li>
                                            <li>Appointment Date <span>{appt.d} {appt.m}, {appt.y}</span></li>
                                            <li>Appointment Time <span>{slotToTime[appt.slot_allocated]}</span></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="col-md-7 col-lg-8 col-xl-9">
                            <div class="card">
                                <div class="card-header">
                                    <h4 class="card-title mb-0">Diagnosis</h4>
                                </div>
                                <div class="card-body">

                                    <div class="form-group">
                                        <label>Type of Diagnosis</label>
                                        <textarea type="text" class="form-control" value={diagnosistype}/>

                                    </div>
                                    <div class="form-group">
                                        <h4 class="card-title mb-0">Prescription</h4>
                                    </div>


                                    <div class="card card-table">
                                        <div class="card-body">
                                            <div class="table-responsive">
                                                <table class="table table-hover table-center">
                                                    <thead>
                                                    <tr>
                                                        <th style={{minWidth:"100px"}}>Name</th>
                                                        <th style={{minWidth:"100px"}}>Quantity</th>
                                                        <th style={{minWidth:"100px"}}>Days</th>
                                                        <th style={{minWidth:"100px"}}>Time</th>
                                                        <th style={{minWidth:"100px"}}></th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {
                                                        Object.keys(tabs).map((key, index) => (
                                                            <tr>
                                                                <td>
                                                                    <input className="form-control" type="text" value={tabs[key].name}/>
                                                                </td>
                                                                <td>
                                                                    <input className="form-control" type="number" value={tabs[key].quantity}/>
                                                                </td>
                                                                <td>
                                                                    <input className="form-control" type="number" value={tabs[key].days}/>
                                                                </td>
                                                                <td>
                                                                    <div className="form-check form-check-inline">
                                                                        <label className="form-check-label">
                                                                            <input className="form-check-input"
                                                                                   type="checkbox" checked={tabs[key].morning} disabled/> Morning
                                                                        </label>
                                                                    </div>
                                                                    <div className="form-check form-check-inline">
                                                                        <label className="form-check-label">
                                                                            <input className="form-check-input"
                                                                                   type="checkbox" checked={tabs[key].afternoon} disabled/> Afternoon
                                                                        </label>
                                                                    </div>
                                                                    <div className="form-check form-check-inline">
                                                                        <label className="form-check-label">
                                                                            <input className="form-check-input"
                                                                                   type="checkbox" checked={tabs[key].evening} disabled/> Evening
                                                                        </label>
                                                                    </div>
                                                                    <div className="form-check form-check-inline">
                                                                        <label className="form-check-label">
                                                                            <input className="form-check-input"
                                                                                   type="checkbox"  checked={tabs[key].night} disabled/> Night
                                                                        </label>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    }
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <h4 class="card-title mb-0">Recommended Lab Tests</h4>
                                    </div>


                                    <div class="card card-table">
                                        <div class="card-body">
                                            <div class="table-responsive">
                                                <table class="table table-hover table-center">
                                                    <thead>
                                                    <tr>
                                                        <th style={{minWidth:"100px"}}>Lab Test Name</th>
                                                        <th style={{minWidth:"100px"}}>Status</th>
                                                        <th style={{minWidth:"100px"}}></th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {
                                                        Object.keys(labs).map((key, index) => (
                                                            <tr>
                                                                <td>
                                                                    <input className="form-control" type="text" value={labs[key].name}/>
                                                                </td>
                                                                <td>
                                                                    <input className="form-control" type="text" value={statusToText[labs[key].status]}/>
                                                                </td>
                                                                <td>
                                                                    {
                                                                        labs[key].status == 0 &&
                                                                        <a onClick={() => requestForLabtest(key)}
                                                                           className="btn btn-sm bg-info-light">
                                                                             Request
                                                                        </a>
                                                                    }
                                                                    {
                                                                        labs[key].status == 2 && labs[key].report_url &&
                                                                        <a href={labs[key].report_url}
                                                                            className="btn btn-sm bg-info-light">
                                                                            <i className="far fa-eye"></i> View
                                                                            </a>
                                                                        }
                                                                    {
                                                                        labs[key].status == 2 && !labs[key].report_url &&
                                                                        <a> In progress. No report available.
                                                                            </a>
                                                                        
                                                                    }

                                                                </td>
                                                            </tr>
                                                        ))
                                                    }
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>


        </div>

    )
}

export default ViewDiagnosis;