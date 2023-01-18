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
import patientLogo from './assets2/img/patients/patient.png'

function AdminViewInsuranceReport(){
    const history = useHistory();
    const {currentUser} = useAuthValue(); 
    const [user,setUser] = useState({name:"patient"});
    const [patient,setPatient] = useState({});
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
    const [insuranceStatus,setInsuranceStatus] = useState(1)
    const [existingTabs,setExistingTabs] = useState([])
    const [tabletCost,settabletCost] = useState({})
    const [labCost,setlabCost] = useState({})
    const [tabs,settabs] = useState([])
    const [docCost,setDoctorCost] = useState(0);
    const [ApprovedAccount, setApprovedAccount] = useState(0);
    const [claimedAmount, setClaimedAccount] = useState(0);
    const weekday = ["SUN","MON","TUE","WED","THUR","FRI","SAT"];
    const statusToText = {0:"Recommended by doctor",1:"Processing by Lab staff",2: "Lab test report generated"};
    const month = ["JAN","FEB","MAR","APR","MAY","JUNE","JULY","AUG","SEP","OCT","NOV","DEC"];
    const slotToTime = {1:"9.00 AM - 11.00 AM",2:"11.00 AM - 1:00 PM",3:"1.00 PM - 3:00 PM",4:"3.00 PM - 5:00 PM",5:"5.00 PM - 7:00 PM"};
    const statusToClass = {1:{"class":"badge badge-pill bg-warning-light","text":"pending"},
        2:{"class":"badge badge-pill bg-success-light","text":"confirm"},
        3:{"class":"badge badge-pill bg-danger-light","text":"rejected"}}
    const logout = () => {
        signOut(auth);
        history.push("/login");
    }

    const statusReqOperation = (apptid,status) => {
        if(!disableAll[0]) {
             setdisAll([true,"Laoding or Updating the info"]);
             statusUpdate(apptid,status);
        }
    }

    async function statusUpdate (diagnosisId,status) {
        const putInsurance = httpsCallable(functions, 'updateInsurance');
        let push_Data = {AppId:diagnosisId,status:status}
        if(status == 2) {
            push_Data.amount = ApprovedAccount
            if(ApprovedAccount > claimedAmount) {
                setdisAll([false,""]);
                setError("Approved amount shoule be less than or equal to the claimed amount");
                return
            }
            if(ApprovedAccount < 0) {
                setdisAll([false,""]);
                setError("Approved amount shoule be more than 0");
                return
            }
        }
        putInsurance(push_Data)
            .then((result) => {
                if(result.data.success) {
                    setError("operation succesfull !");
                    setLU(false);
                } else {
                    setError(result.data.data);
                }
                setdisAll([false,""]);
            }).catch((error) => {
            console.log("Error fetching details!");
        })
    }

    async function loadUserInfo () {
        const getUser = httpsCallable(functions, 'getUserInfo');
        getUser({})
            .then((result) => {
                if(result.data.success && result.data.data.category == "9") {
                    // sendEmailConfirmation();
                    setUser(result.data.data);
                } else {
                    logout();
                    history.push("/login");
                }

            }).catch((error) => {
            console.log("Error fetching user details in the profile settings page!");
            history.push("/login");
        })
    }

    async function loadPatientsInfo (uid) {
        const getUser = httpsCallable(functions, 'getUserInfo');
        getUser({uid:uid})
            .then((result) => {
                if(result.data.success) { // && result.data.data.category == "0") {
                    setPatient(result.data.data);
                }
            }).catch((error) => {
            console.log("Error fetching user details in the profile settings page!");
        })
    }

    async function sendEmail () {
        const email = httpsCallable(functions, 'sendEmail');
        email()
            .then((result) => {
                if(result.data) {
                    console.log(result.data);
                } else {
                    setError("Error sending email");
                }
            }).catch((error) => {
            setError("caught in  sending the email");
        })
    }

    async function loadInsuranceRequests () {
        const getInsuranceReqs = httpsCallable(functions, 'getInsuranceRequests');
        getInsuranceReqs({appointmentId:appointmentId})
            .then((result) => {
                if(result.data.success) {
                    let reqs = result.data.data;
                    const req = reqs[appointmentId];
                    setClaimedAccount(req.due);
                    if(req.status == 2) {
                        setClaimedAccount(req.amount);
                    }
                    setInsuranceStatus(req.status);
                    setdisAll([false,""]);
                }
            }).catch((error) => {
                console.log("Error fetching insurance related details");
            })
    }

    async function loadDiagnosisInfo () {
        const getUser = httpsCallable(functions, 'getDiagnosis');
        getUser({appointmentId:appointmentId})
            .then((result) => {
                if(result.data.success) {
                    console.log(result.data.data);
                    AddDiagnosisType(result.data.data.diagnosis);
                    console.log("tabs");
                    console.log(result.data.data.prescriptions);
                    console.log("labs");
                    console.log(result.data.data.lab_tests);
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
                    let tabletCost = {};
                    let labCost = {};
                    for(let t in result.data.tab) {
                        let tablet = result.data.tab[t];
                        tablet["id"] = t;
                        tabletCost[tablet.name] = tablet.cost;
                        dupeTabs.push(tablet);
                    }
                    let dupeLabs = []
                    for(let t in result.data.lab) {
                        let labData = result.data.lab[t];
                        labData["id"] = t;
                        console.log(labData);
                        labCost[labData.name] = labData.cost;
                        dupeLabs.push(labData);
                    }
                    console.log("labCost");
                    console.log(labCost);
                    settabletCost(tabletCost);
                    setlabCost(labCost);
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
                    const getDocuser = httpsCallable(functions, 'getDoctorDetails');
                    getDocuser({doctor_id:apptDetails.doctor_id})
                        .then((result) => {
                        if(result.data.success) {
                            setDoctorCost(result.data.data[0].cost);
                        }
            }).catch((error) => {
            console.log("Error fetching doctors details in the search doctor page!");
        })
                    setAppt(apptDetails);
                    loadPatientsInfo(apptDetails.patient_id);
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
            loadInsuranceRequests();
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
                                <a onClick={() => history.push("/InsurancerDashboard")}>Home</a>
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
                                                <h6>{user.name}</h6>
                                                <p className="text-muted mb-0">Patient</p>
                                            </div>
                                        </div>
                                        <a className="dropdown-item" onClick={() => history.push('/')}>Dashboard</a>
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
                                                <h6>{user.name}</h6>
                                                <p className="text-muted mb-0">Patient</p>
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

                                                <h2>Insurance of the Patient </h2>
                                                <h3><a>Insurance Id : {patient.insurance_id}</a></h3>
                                                <div className="patient-details">
                                                    <h5><b>Insurance Provider:</b> {patient.insurance_provider}</h5>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="patient-info">
                                        <ul>
                                        <li>Appointment Date <span>{appt.d} {appt.m}, {appt.y}</span></li>
                                            <li>Appointment ID/Diagnosis ID <span>{appt.id}</span></li>
                                            <br></br>
                                            <br></br>
                                            {
                                                insuranceStatus == 1 &&
                                                <>
                                                <li>Requested Claim Ammount<span>{claimedAmount}</span></li><br></br>
                                                <li>Yet to be accepted/rejected by Insurancer!</li>
                                                </>
                                            }
                                            {
                                                insuranceStatus == 2 &&
                                                <li>Claimed Amount<span>{claimedAmount}</span></li>
                                            }
                                            {
                                                insuranceStatus == 3 &&
                                                <li>Rejected Claim<span></span></li>
                                            }
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="col-md-7 col-lg-8 col-xl-9">
                            <div class="card">
                                <div class="card-header">
                                    <h3 class="card-title mb-0">Diagnosis</h3>
                                </div>
                                <div class="card-body">

                                    <div class="card card-table">
                                        <div class="card-body">
                                            <div class="table-responsive">
                                                <table class="table table-hover table-center">
                                                    <thead>
                                                    <tr>
                                                        <th style={{minWidth:"100px"}}>Doctor Name</th>
                                                        <th style={{minWidth:"100px"}}>Diagnosis Type</th>
                                                        <th style={{minWidth:"100px"}}>Consultancy/Diagnosis Cost (in $)</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {
                                                            <tr>
                                                                <td>
                                                                    {appt.doctor_name}
                                                                </td>
                                                                <td>
                                                                    {diagnosistype}
                                                                </td>
                                                                <td>
                                                                    {docCost}
                                                                </td>
                                                            </tr>
                                                        
                                                    }
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="form-group">
                                        <h3 class="card-title mb-0">Prescription</h3>
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
                                                        <th style={{minWidth:"100px"}}>Each Tablet Cost (in $)</th>
                                                        <th style={{minWidth:"100px"}}>Total Tablet Cost (in $)</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {
                                                        Object.keys(tabs).map((key, index) => (
                                                            <tr>
                                                                <td>
                                                                    {tabs[key].name}
                                                                </td>
                                                                <td>
                                                                    {tabs[key].quantity}
                                                                </td>
                                                                <td>
                                                                    {tabs[key].days}
                                                                </td>
                                                                <td>
                                                                    {tabletCost[tabs[key].name]}
                                                                </td>
                                                                <td>
                                                                    {tabletCost[tabs[key].name]*tabs[key].quantity}
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
                                        <h3 class="card-title mb-0">Recommended Lab Tests</h3>
                                    </div>


                                    <div class="card card-table">
                                        <div class="card-body">
                                            <div class="table-responsive">
                                                <table class="table table-hover table-center">
                                                    <thead>
                                                    <tr>
                                                        <th style={{minWidth:"100px"}}>Lab Test Name</th>
                                                        <th style={{minWidth:"100px"}}>Reason</th>
                                                        <th style={{minWidth:"100px"}}>Lab Test Cost (in $)</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {
                                                        Object.keys(labs).map((key, index) => (
                                                            <tr>
                                                                <td>
                                                                    {labs[key].name}
                                                                </td>
                                                                <td>
                                                                    {statusToText[labs[key].status]}
                                                                </td>
                                                                <td>
                                                                    {labCost[labs[key].name]}
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

export default AdminViewInsuranceReport;