import './profile.css'
import * as React from 'react';
import PopupState, { bindTrigger, bindMenu } from 'material-ui-popup-state';
import {useAuthValue} from './AuthContext'
import { signOut } from 'firebase/auth'
import {auth, db, functions} from './firebase'
import { httpsCallable } from "firebase/functions"
import {useEffect, useState} from "react";
import {useHistory} from 'react-router-dom'
import './assets2/css/bootstrap.min.css'
import './assets2/plugins/fontawesome/css/fontawesome.min.css'
import './assets2/plugins/fontawesome/css/all.min.css'
import './assets2/css/style.css'
import Logo from './assets2/img/logo.png'
import {Link} from "react-router-dom";

function HosStaffDashboard() {
    const {currentUser} = useAuthValue();
    const [userLogo,setUserLogo] = useState('');
    const [user,setUser] = useState({name:"patient"});
    const [navState, setNavState] = useState(false);
    const [patientName,setPN] = useState('Patient');
    const [tab,setTab] = useState({'pending':true,'today':false,'rejected':false,'approved':false});
    const [loadUser,setLU] = useState(false);
    const [apptsToday,setApptsToday] = useState([]);
    const [apptsPending,setApptsPending] = useState([]);
    const [apptsRejected,setApptsRejected] = useState([]);
    const [apptsApproved,setApptsApproved] = useState([]);
    const [NoOfTodaysApp,setNoOfTodaysApp] = useState([]);
    const [NoOfPendingApp,setNoOfPendingApp] = useState([]);

    const [appts,setAllAppts] = useState([]);
    const [disableAll,setdisAll] = useState([true,"Loading page information!"]);
    const [error,setError] = useState('');
    const weekday = ["SUN","MON","TUE","WED","THUR","FRI","SAT"];
    const month = ["JAN","FEB","MAR","APR","MAY","JUNE","JULY","AUG","SEP","OCT","NOV","DEC"];
    const slotToTime = {1:"9.00 AM",2:"11.00 AM",3:"1.00 PM",4:"3.00 PM",5:"5.00 PM"};
    const statusToClass = {4:{"class":"badge badge-pill bg-warning-light","text":"Approved/Yet to be diagnosed"},
                            5:{"class":"badge badge-pill bg-success-light","text":"Diagnosed"}}
    const logout = () => {
        signOut(auth);
        history.push("/login");
    }


    async function sendEmailConfirmation() {
        const getUser = httpsCallable(functions, 'emailUserCreate');
        getUser({email:user.email,name:user.username})
            .then((result) => {
                console.log("Email sent succesfully");
            }).catch((error) => {
            console.log("Error sending confirmation email to the user");
        })
    }

    async function loadApptsInfo () {
        const getappts = httpsCallable(functions, 'getAllAppointments');
        getappts({})
            .then((result) => {
                if(result.data.success) {
                    let apts  = result.data.data;
                    let todayDate = new Date().toLocaleDateString().replaceAll("/","-");
                    let dummyAppts = []
                    let todayAppts = []
                    let pendignAppts = []
                    let rejectedAppts = []
                    let approvedAppts = []
                    for(let appt in apts) {
                        let data = apts[appt];
                        if(data.patient == null) {
                            continue;
                        }
                        let date = data.date.split("-");
                        data["id"] = appt;
                        data["d"] = date[1];
                        data["y"] = date[2];
                        data["m"] = month[date[0]-1];
                        data["time"] = slotToTime[data.slot_allocated];
                        var t = new Date(data.date_of_request);
                        data["req_d"] = t.getDate();
                        data["req_y"] = t.getFullYear();
                        data["req_m"] = month[t.getMonth()];
                        dummyAppts.push(data)
                        if(data.status == 1) {
                            pendignAppts.push(data);
                        } else if(data.status == 2 && data.date == todayDate) {
                            todayAppts.push(data);
                        } else if(data.status == 3) {
                            rejectedAppts.push(data);
                        } else if(data.status == 4 || data.status ==5){
                            approvedAppts.push(data);
                        }
                    }
                    setAllAppts(dummyAppts);
                    setApptsToday(todayAppts);
                    setApptsPending(pendignAppts);
                    setApptsRejected(rejectedAppts);
                    setApptsApproved(approvedAppts);
                    setNoOfPendingApp(pendignAppts.length);
                    setNoOfTodaysApp(todayAppts.length);
                    setdisAll([false,""]);
                } else {
                    setError(result.data.data.details);
                    setdisAll([false,""]);
                }
            }).catch((error) => {
            //console.log("Error fetching doctors details in the search doctor page!");
            setdisAll([false,""]);
            setError("Error fetching doctors details in the search doctor page!");
        })
    }

    async function apptUpdate (apptId,accept) {
        const getappts = httpsCallable(functions, 'updateAppt');
        getappts({appt:apptId,status:accept})
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
        getUser()
            .then((result) => {
                if(result.data.success && (result.data.data.category == "2" || result.data.data.category == "9")) {
                    sendEmailConfirmation();
                    setUser(result.data.data);
                    if(result.data.data.image) {
                        setUserLogo(result.data.data.image);
                    } else if(result.data.data.sex == "male") {
                        setUserLogo("https://firebasestorage.googleapis.com/v0/b/login-31221.appspot.com/o/images%2Fmale.png?alt=media&token=ab31fc18-4739-41ab-bd13-2c2703dec41e");
                    } else {
                        setUserLogo("https://firebasestorage.googleapis.com/v0/b/login-31221.appspot.com/o/images%2Ffemale.png?alt=media&token=7308c8cd-bb9e-45a5-898a-f6aa6d6e9961");
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

    const history = useHistory();
    useEffect( () => {
        if (!loadUser) {
            setdisAll([true,"Laoding or Updating the info"]);
            loadUserInfo();
            loadApptsInfo();
            setLU(true);
        }
    });

    const toggleTab = (e) => {
        const tabState = {}
        for (const property in tab) {
            if(property == e) {
                tabState[property] = true
            } else {
                tabState[property] = false
            }
        }
        setTab(tabState);
        return;
    }

    const apptOperation = (apptid,accept) => {
        if(!disableAll[0]) {
             setdisAll([true,"Laoding or Updating the info"]);
             apptUpdate(apptid,accept);
        }
    }

    const addPatientRecord = (apptid) => {
        if(!disableAll[0]) {
            setdisAll([true,"Laoding or Updating the info"]);
            apptUpdate(apptid,4);
        }
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
                        <a id="mobile_btn" >
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
                                <a onClick={() => history.push('/')}>Home</a>
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
                                        <img className="rounded-circle" src={userLogo} width="31" alt={user.username} />
                                    </span>
                                    </a>
                                    <div className="dropdown-menu dropdown-menu-right show">
                                        <div className="user-header">
                                            <div className="avatar avatar-sm">
                                                <img src={userLogo} alt="User Image" className="avatar-img rounded-circle" />
                                            </div>
                                            <div className="user-text">
                                                <h6>{user.username}</h6>
                                                <h5>Hospital Staff</h5>
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
                                        <img className="rounded-circle" src={userLogo} width="31" alt={user.username} />
                                    </span>
                                    </a>
                                    <div className="dropdown-menu dropdown-menu-right">
                                        <div className="user-header">
                                            <div className="avatar avatar-sm">
                                                <img src={userLogo} alt="User Image" className="avatar-img rounded-circle" />
                                            </div>
                                            <div className="user-text">
                                                <h6>{user.username}</h6>
                                            </div>
                                        </div>
                                        <a className="dropdown-item" onClick={()=>  history.push('/')}>Dashboard</a>
                                        <a className="dropdown-item" onClick={() => history.push('/profile')}>Profile Settings</a>
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

                            <div class="profile-sidebar">
                                <div class="widget-profile pro-widget-content">
                                    <div class="profile-info-widget">
                                        <a class="booking-doc-img">
                                            <img src={userLogo} alt="User Image"/>
                                        </a>
                                        <div class="profile-det-info">
                                            <h3>{user.username}</h3>
                                            <div className="patient-details">
                                                <h5>Hospital Staff Member</h5>
                                                <h5 className="mb-0"><i className="fas fa-map-marker-alt"></i>{user.address}</h5>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="dashboard-widget">
                                    <nav class="dashboard-menu">
                                        <ul>
                                            <li class="active">
                                                <a onClick={()=>  history.push('/')}>
                                                    <i class="fas fa-columns"></i>
                                                    <span>Dashboard</span>
                                                </a>
                                            </li>
                                            <li>
                                                <a onClick={()=>history.push("/HSD-Appointments")}>
                                                    <i class="fas fa-calendar-check"></i>
                                                    <span>Appointments</span>
                                                </a>
                                            </li>
                                            <li>
                                                <a onClick={() => history.push("/doctorScheduleHS")}>
                                                    <i class="fas fa-hourglass-start"></i>
                                                    <span>Doctors Availability</span>
                                                </a>
                                            </li>
                                            <li>
                                                <a onClick={() => history.push("/AllPatients")}>
                                                    <i class="fas fa-hourglass-start"></i>
                                                    <span>All Patients</span>
                                                </a>
                                            </li>
                                            <li>
                                                <a onClick={()=>history.push('/invoiceReports')}>
                                                    <i class="fas fa-file-invoice"></i>
                                                    <span>Invoices</span>
                                                </a>
                                            </li>
                                            <li>
                                                <a onClick={()=>history.push('/profile')}>
                                                    <i class="fas fa-user-cog"></i>
                                                    <span>Profile Settings</span>
                                                </a>
                                            </li>
                                            <li>
                                                <a onClick={()=> history.push('/changePassword')}>
                                                    <i class="fas fa-lock"></i>
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

                        <div class="col-md-7 col-lg-8 col-xl-9">
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="card dash-card">
                                        <div class="card-body">
                                            <div class="row">
                                                <div class="col-md-12 col-lg-6">
                                                    <div class="dash-widget dct-border-rht">
                                                        <div class="dash-widget-info">
                                                            <h6>Total Pending Appointments</h6>
                                                            <h3>{NoOfPendingApp}</h3>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div class="col-md-12 col-lg-6">
                                                    <div class="dash-widget dct-border-rht">
                                                        <div class="dash-widget-info">
                                                            <h6>Appointments Today</h6>
                                                            <h3>{NoOfTodaysApp}</h3>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-12">
                                    <h4 class="mb-4">Patient Appoinment</h4>
                                    <div class="appointment-tab">


                                        

                                       <nav className="user-tabs mb-4">
                                        <ul className="nav nav-tabs nav-tabs-bottom nav-justified">
                                            <li className="nav-item">
                                                {tab.pending
                                                    ? <a className="nav-link active"  data-toggle="tab" onClick={e=>toggleTab('pending')}>Pending Requests</a>
                                                    : <a className="nav-link"  data-toggle="tab" onClick={e=>toggleTab('pending')}>Pending Requests</a>}
                                            </li>
                                            <li className="nav-item">
                                                {tab.today
                                                    ? <a className="nav-link active"  data-toggle="tab" onClisck={e=>toggleTab('today')}>Todays Appointment</a>
                                                    : <a className="nav-link"  data-toggle="tab" onClick={e=>toggleTab('today')}>Todays Appointment</a>}
                                            </li>
                                            <li className="nav-item">
                                                {tab.rejected
                                                    ? <a className="nav-link active" data-toggle="tab" onClick={e=>toggleTab('rejected')}>Rejected Appointments</a>
                                                    : <a className="nav-link" data-toggle="tab" onClick={e=>toggleTab('rejected')}>Rejected Appointments</a>}
                                            </li>
                                            <li className="nav-item">
                                                {tab.approved
                                                    ? <a className="nav-link active" data-toggle="tab" onClick={e=>toggleTab('approved')}>Approved Appointments</a>
                                                    : <a className="nav-link" data-toggle="tab" onClick={e=>toggleTab('approved')}>Admitted or Diagonised</a>}
                                            </li>
                                        </ul>
                                    </nav>


                                        <div class="tab-content">
                                            {
                                                tab.pending &&
                                                <div className="tab-pane show active" id="upcoming-appointments">
                                                    <div className="card card-table mb-0">
                                                        <div className="card-body">
                                                            <div className="table-responsive">
                                                                <table className="table table-hover table-center mb-0">
                                                                    <thead>
                                                                    <tr>
                                                                        <th>Patient Name</th>
                                                                        <th>Appt Date</th>
                                                                        <th>Doctor Name</th>
                                                                        <th>Type</th>
                                                                        <th className="text-center">Amount</th>
                                                                        <th></th>
                                                                    </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                    {
                                                                        apptsPending.map(appt => (
                                                                            <tr>
                                                                                <td>
                                                                                    <h2 className="table-avatar">
                                                                                        {/* <Link to="/PatientProfile/"> Dashboard </Link> */}
                                                                                        <a onClick={() => history.push("/PatientProfile/" + appt.patient_id)} className="bg-success-light">{appt.patient.username}</a>
                                                                                    </h2>
                                                                                </td>
                                                                                <td>{appt.d} {appt.m} {appt.y} <span
                                                                                    className="d-block text-info">{appt.time}</span>
                                                                                </td>
                                                                                <td>{appt.doctor.username}</td>
                                                                                <td>{appt.type_of_diagnosis}</td>
                                                                                <td className="text-center">${appt.doctor.cost}</td>
                                                                                <td className="text-right">
                                                                                    <div className="table-action">

                                                                                        <a onClick={() => apptOperation(appt.id,2)}
                                                                                           className="btn btn-sm bg-success-light">
                                                                                            <i className="fas fa-check"></i> Accept
                                                                                        </a>
                                                                                        <a onClick={() => apptOperation(appt.id,3)}
                                                                                           className="btn btn-sm bg-danger-light">
                                                                                            <i className="fas fa-times"></i> Reject
                                                                                        </a>
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
                                                </div>
                                            }

                                            {
                                                tab.today &&
                                                <div className="tab-pane show active" id="today-appointments">
                                                    <div className="card card-table mb-0">
                                                        <div className="card-body">
                                                            <div className="table-responsive">
                                                                <table className="table table-hover table-center mb-0">
                                                                    <thead>
                                                                    <tr>
                                                                        <th>Patient Name</th>
                                                                        <th>Appt Date</th>
                                                                        <th>Doctor Name</th>
                                                                        <th>Type</th>
                                                                        <th className="text-center">Amount</th>
                                                                        <th></th>
                                                                    </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                    {
                                                                        apptsToday.map(appt => (
                                                                            <tr>
                                                                                <td>
                                                                                    <h2 className="table-avatar">
                                                                                        <a onClick={() => history.push("/PatientProfile/" + appt.patient_id)} className="bg-success-light">{appt.patient.username}</a>
                                                                                    </h2>
                                                                                </td>
                                                                                <td>{appt.d} {appt.m} {appt.y} <span
                                                                                    className="d-block text-info">{appt.time}</span>
                                                                                </td>
                                                                                <td>{appt.doctor.username}</td>
                                                                                <td>{appt.type_of_diagnosis}</td>
                                                                                <td className="text-center">${appt.doctor.cost}</td>
                                                                                <td className="text-right">
                                                                                    <div className="table-action">
                                                                                        <a onClick={() => addPatientRecord(appt.id)}
                                                                                           className="btn btn-sm bg-success-light">
                                                                                            <i className="fas fa-check"></i> Admit
                                                                                        </a>
                                                                                        <a onClick={() => apptOperation(appt.id,3)}
                                                                                           className="btn btn-sm bg-danger-light">
                                                                                            <i className="fas fa-times"></i> Reject
                                                                                        </a>
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
                                                </div>
                                            }
                                            {
                                                tab.rejected &&
                                                <div className="tab-pane show active" id="upcoming-appointments" >
                                                    <div className="card card-table mb-0">
                                                        <div className="card-body">
                                                            <div className="table-responsive">
                                                                <table className="table table-hover table-center mb-0">
                                                                    <thead>
                                                                    <tr>
                                                                        <th>Patient Name</th>
                                                                        <th>Appt Date</th>
                                                                        <th>Doctor Name</th>
                                                                        <th>Type</th>
                                                                        <th className="text-center">Amount</th>
                                                                        <th></th>
                                                                    </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                    {
                                                                        apptsRejected.map(appt => (
                                                                            <tr>
                                                                                <td>
                                                                                    <h2 className="table-avatar">
                                                                                        <a onClick={() => history.push("/PatientProfile/" + appt.patient_id)} className="bg-success-light">{appt.patient.username}</a>
                                                                                    </h2>
                                                                                </td>
                                                                                <td>{appt.d} {appt.m} {appt.y} <span
                                                                                    className="d-block text-info">{appt.time}</span>
                                                                                </td>
                                                                                <td>{appt.doctor.username}</td>
                                                                                <td>{appt.type_of_diagnosis}</td>
                                                                                <td className="text-center">${appt.doctor.cost}</td>
                                                                                <td className="text-right">
                                                                                    <div className="table-action">

                                                                                        <a onClick={() => apptOperation(appt.id,2)}
                                                                                           className="btn btn-sm bg-success-light">
                                                                                            <i className="fas fa-check"></i> Accept
                                                                                        </a>
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
                                                </div>
                                            }
                                            {
                                                tab.approved &&
                                                <div className="tab-pane show active" id="approved-appointments" >
                                                    <div className="card card-table mb-0">
                                                        <div className="card-body">
                                                            <div className="table-responsive">
                                                                <table className="table table-hover table-center mb-0">
                                                                    <thead>
                                                                    <tr>
                                                                        <th>Patient Name</th>
                                                                        <th>Appt Date</th>
                                                                        <th>Doctor Name</th>
                                                                        <th>Type</th>
                                                                        <th>Status</th>
                                                                        <th className="text-center">Amount</th>
                                                                        <th></th>
                                                                    </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                    {
                                                                        apptsApproved.map(appt => (
                                                                            <tr>
                                                                                <td>
                                                                                    <h2 className="table-avatar">
                                                                                        <a onClick={() => history.push("/PatientProfile/" + appt.patient_id)} className="bg-success-light">{appt.patient.username}</a>
                                                                                    </h2>
                                                                                </td>
                                                                                <td>{appt.d} {appt.m} {appt.y} <span
                                                                                    className="d-block text-info">{appt.time}</span>
                                                                                </td>
                                                                                <td>{appt.doctor.username}</td>
                                                                                <td>{appt.type_of_diagnosis}</td>
                                                                                <td><span
                                                                                className={statusToClass[appt.status].class}>{statusToClass[appt.status].text}</span>
                                                                                </td>
                                                                                <td className="text-center">${appt.doctor.cost}</td>
                                                                                {appt.status == 5 &&
                                                                                <td className="text-right">
                                                                                    <div className="table-action">
                                                                                        <a onClick={() => history.push('/generateReport/' + appt.id)}
                                                                                           className="btn btn-sm bg-success-light">Generate Report
                                                                                        </a>
                                                                                    </div>
                                                                                </td>
                                                                                }
                                                                            </tr>
                                                                        ))
                                                                    }
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            }


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


export default HosStaffDashboard