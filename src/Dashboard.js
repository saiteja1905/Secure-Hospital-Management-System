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

function Dashboard() {
    const {currentUser} = useAuthValue();
    const [user,setUser] = useState({username:"patient"});
    const [navState, setNavState] = useState(false);
    const [patientName,setPN] = useState('Patient');
    const [lab_tests,setLabTests] = useState([]);
    const [tab,setTab] = useState({'appointments':true,'prescriptions':false,'medical_records':false,'labtests':false});
    const [loadUser,setLU] = useState(false);
    const [appts,setAppts] = useState([]);
    const [medRecords,setMedRecords] = useState([]);
    const [prescriptions, setPresciptions] = useState([]);
    const [reports, setReports] = useState([]);
    const [disableAll,setdisAll] = useState([true,"Loading page information!"]);
    const [error,setError] = useState('');
    const [patientLogo,setPatientLogo] = useState('')
    const weekday = ["SUN","MON","TUE","WED","THUR","FRI","SAT"];
    const month = ["JAN","FEB","MAR","APR","MAY","JUNE","JULY","AUG","SEP","OCT","NOV","DEC"];
    const slotToTime = {1:"9.00 AM",2:"11.00 AM",3:"1.00 PM",4:"3.00 PM",5:"5.00 PM"};
    const statusToClass = {1:{"class":"badge badge-pill bg-warning-light","text":"Pending"},
                            2:{"class":"badge badge-pill bg-success-light","text":"Confirmed"},
                            3:{"class":"badge badge-pill bg-danger-light","text":"Rejected"},
                            4:{"class":"badge badge-pill bg-success-light","text":"Admitted"},
                        5:{"class":"badge badge-pill bg-success-light", "text" : "Diagnosed"}}
    const statusToClass1 = {0:{"class":"badge badge-pill bg-warning-light","text":"Requested"},
                        1:{"class":"badge badge-pill bg-success-light","text":"In Progress"},
                        2:{"class":"badge badge-pill bg-danger-light","text":"Completed"},
                        3:{"class":"badge badge-pill bg-success-light","text":"Rejected"}}
    

    const history = useHistory();

    async function loadLabReqInfo () {
        const getRequests = httpsCallable(functions, 'getUserLabtests');
        getRequests({})
            .then((result) => {
                if(result.data.success) {
                    let LabReq=result.data.data
                    let labTests = result.data.data
                    console.log("Lab test Resultsssss")
                    let dummyReq = [];
                    for(let test in labTests) {
                        let data = labTests[test];
                        let date = data.date.split("-");
                        data["d"] = date[1];
                        data["y"] = date[2];
                        data["m"] = month[date[0]-1];
                        data["id"] = data.data.id
                        data["lab"]= data.data.name
                        data["doctor"]= data.doctor_name
                        data["status"]= data.data.status 
                        if(data.data.hasOwnProperty("report_url")){
                            data["report_url"] = data.data.report_url;
                        }
                        dummyReq.push(data)
                    }
                    console.log(dummyReq)
                    setLabTests(dummyReq);
                    setdisAll([false,""]);
                }
            }).catch((error) => {
                console.log("Error fetching lab test details!");
            })
    }

    async function loadApptsInfo () {
        const getappts = httpsCallable(functions, 'getUserAppointments');
        getappts({})
            .then((result) => {
                if(result.data.success) {
                    let apts  = result.data.data;
                    console.log(apts);
                    let dummyAppts = []
                    for(let appt in apts) {
                        let data = apts[appt];
                        let date = data.date.split("-");
                        data["d"] = date[1];
                        data["y"] = date[2];
                        data["m"] = month[date[0]-1];
                        data["time"] = slotToTime[data.slot_allocated];
                        var t = new Date(data.date_of_request);
                        data["req_d"] = t.getDate();
                        data["req_y"] = t.getFullYear();
                        data["req_m"] = month[t.getMonth()];
                        dummyAppts.push(data)
                    }
                    setAppts(dummyAppts);
                    setdisAll([false,""]);
                }
            }).catch((error) => {
                console.log("Error fetching doctors details in the search doctor page!");
            })
    }
    
    async function loadPresInfo () {
        const getPrescriptions = httpsCallable(functions, 'getUserPrescriptions');
        getPrescriptions({})
            .then((result) => {
                if(result.data.success) {
                    let prescriptions  = Object.values(result.data.data);
                    let dummyprescriptions = [];
                    let finalPrescriptions = [];
                    for (var i = 0; i < prescriptions.length; i++) {
                        let pres = {};
                        pres["doctor"] = prescriptions[i].doctor_name;
                        let date = prescriptions[i].date.split("-");
                        pres["d"] = date[1];
                        pres["y"] = date[2];
                        pres["m"] = month[date[0]-1];
                        let pres_data = prescriptions[i].data;
                        let usage = "";
                        if (pres_data.afternoon) {
                            usage = usage.concat(" 'Afternoon'");
                        }
                        if (pres_data.evening) {
                            usage = usage.concat(" 'Evening'");
                        }
                        if (pres_data.night) {
                            usage = usage.concat(" 'Night'");
                        }
                        pres["usage"] = usage;
                        pres["days"] = pres_data.days;
                        pres["quantity"] = pres_data.quantity;
                        pres["name"] = pres_data.name;
                        dummyprescriptions.push(pres);
                    }
                    setPresciptions(dummyprescriptions);
                    setdisAll([false,""]);
                }
            }).catch((error) => {
                console.log("Error fetching presciption details for the patient!");
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
                    
                    history.push("/login");
                }
            }).catch((error) => {
            console.log("Error fetching user details in the profile settings page!");
            history.push("/login");
        })
    }

    async function loadMedInfo () {
        const getMedInfo = httpsCallable(functions, 'getMedicalRecords');
        getMedInfo({})
            .then((result) => {
                if(result.data.success) {
                    let appitIds = Object.keys(result.data.data);
                    let reports  = Object.values(result.data.data);
                    console.log("reportss");
                    console.log(reports);
                    let dummyReports = []
                    for (var i = 0; i < reports.length; i++) {
                        let report = {};
                        let date = reports[i].date.split("-");
                        report["d"] = date[1];
                        report["y"] = date[2];
                        report["m"] = month[date[0]-1];
                        report["doctor_name"] = reports[i].doctor_name;
                        report["type_of_diagnosis"] = reports[i].type_of_diagnosis;
                        report["type_of_problem"] = reports[i].type_of_problem;
                        report["apptid"] = appitIds[i];
                        dummyReports.push(report);
                    }
                    console.log("dummyReports");
                    console.log(dummyReports);
                    setReports(dummyReports);
                    setdisAll([false,""]);
                }
            }).catch((error) => {
                console.log("Error fetching medical reports for the patient!");
            })
    }


    useEffect( () => {
        if (!loadUser) {
            setdisAll([true,"Initial db lookup for the page information."]);
            loadUserInfo();
            loadApptsInfo();
            setLU(true);
            loadPresInfo();
            loadMedInfo();
            loadLabReqInfo();

        }
    });

    const toggleTab = (e) => {
        const tabState = {}
        for (const property in tab) {
            console.log(tab,property);
            if(property == e) {
                tabState[property] = true
            } else {
                tabState[property] = false
            }
        }
        setTab(tabState);
        console.log(tab,tabState);
        return;
    }

    const logout = () => {
        signOut(auth);
        history.push("/login");
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
                                        <a className="dropdown-item" onClick={() => history.push('/profile')}>Profile Settings</a>
                                        <a className="dropdown-item" onClick={() => logout()}>Logout</a>
                                    </div>
                            </li>
                                : <li className="nav-item dropdown has-arrow logged-item">
                                    <a className="dropdown-toggle nav-link" data-toggle="dropdown" onClick={() => setNavState(!navState)}>
                                    <span className="user-img">
                                        <img className="rounded-circle" src={patientLogo} width="31" alt={user.username} />
                                    </span>
                                    </a>
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
                                            <li className="active">
                                                <a onClick={()=>history.push('/')}>
                                                    <i className="fas fa-columns"></i>
                                                    <span>Dashboard</span>
                                                </a>
                                            </li>
                                            <li>
                                                <a onClick={() => history.push('/doctor-search')}>
                                                    <i className="fas fa-calendar-plus-o"></i>
                                                    <span>Request Appointment</span>
                                                </a>
                                            </li>
                                            <li>
                                                <a onClick={() => history.push('/patientsInvoice')}>
                                                    <i className="fas fa-file-invoice"></i>
                                                    <span>Invoices</span>
                                                </a>
                                            </li>
                                            <li>
                                                <a onClick={() => history.push('/profile')}>
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
                                                <i className='fa-solid fa-message'></i>
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
                                <div className="card-body pt-0">
                                    <nav className="user-tabs mb-4">
                                        <ul className="nav nav-tabs nav-tabs-bottom nav-justified">
                                            <li className="nav-item">
                                                {tab.appointments
                                                    ? <a className="nav-link active"  data-toggle="tab" onClick={e=>toggleTab('appointments')}>Appointments</a>
                                                    : <a className="nav-link"  data-toggle="tab" onClick={e=>toggleTab('appointments')}>Appointments</a>}
                                            </li>
                                            <li className="nav-item">
                                                {tab.prescriptions
                                                    ? <a className="nav-link active"  data-toggle="tab" onClick={e=>toggleTab('prescriptions')}>Prescriptions</a>
                                                    : <a className="nav-link"  data-toggle="tab" onClick={e=>toggleTab('prescriptions')}>Prescriptions</a>}
                                            </li>
                                            <li className="nav-item">
                                                {tab.medical_records
                                                    ? <a className="nav-link active" data-toggle="tab" onClick={e=>toggleTab('medical_records')}><span className="med-records">Medical Records</span></a>
                                                    : <a className="nav-link" data-toggle="tab" onClick={e=>toggleTab('medical_records')}><span className="med-records">Medical Records</span></a>}
                                            </li>
                                            <li className="nav-item">
                                                {tab.labtests
                                                    ? <a className="nav-link active" data-toggle="tab" onClick={e=>toggleTab('labtests')}><span className="lab_tests">Lab Tests</span></a>
                                                    : <a className="nav-link" data-toggle="tab" onClick={e=>toggleTab('labtests')}><span className="lab_tests">Lab Tests</span></a>}
                                            </li>
                                        </ul>
                                    </nav>

                                    <div className="tab-content pt-0">
                                        {tab.appointments &&
                                            <div id="pat_appointments" className="tab-pane fade show active">
                                                <div className="card card-table mb-0">
                                                    <div className="card-body">
                                                        <div className="table-responsive">
                                                            <table className="table table-hover table-center mb-0">
                                                                <thead>
                                                                <tr>
                                                                    <th>Doctor</th>
                                                                    <th>Appt Date</th>
                                                                    <th>Booking Date</th>
                                                                    <th>Amount</th>
                                                                    <th>Status</th>
                                                                </tr>
                                                                </thead>
                                                                <tbody>
                                                                {
                                                                    appts.map(appt => (
                                                                        <tr>
                                                                            <td>
                                                                                <h2 className="table-avatar">
                                                                                    Dr. {appt.doctor.username} 
                                                                                </h2 >
                                                                                <h5 className="table-avatar"> {appt.doctor.doctor_tag}</h5>
                                                                            </td>
                                                                            <td>{appt.d} {appt.m} {appt.y} <span className="d-block text-info">{appt.time}</span>
                                                                            </td>
                                                                            <td>{appt.req_d} {appt.req_m} {appt.req_y}</td>
                                                                            <td>${appt.doctor.cost}</td>
                                                                            <td><span
                                                                                className={statusToClass[appt.status].class}>{statusToClass[appt.status].text}</span>
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                                }
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div> }
                                        {tab.prescriptions &&
                                            <div id="pat_prescriptions" className="tab-pane fade show active">
                                                <div className="card card-table mb-0">
                                                    <div className="card-body">
                                                        <div className="table-responsive">
                                                            <table className="table table-hover table-center mb-0">
                                                                <thead>
                                                                <tr>
                                                                    <th>Prescibed By</th>
                                                                    <th>Date</th>
                                                                    <th>Name</th>
                                                                    <th>Days</th>
                                                                    <th>Quantity</th>
                                                                    <th>Usage</th>
                                                                </tr>
                                                                </thead>
                                                                <tbody>
                                                                {
                                                                    prescriptions.map(prescription => (
                                                                        <tr>
                                                                            <td>
                                                                                <h2 className="table-avatar">
                                                                                    Dr. {prescription.doctor}
                                                                                </h2>
                                                                            </td>
                                                                            <td>{prescription.d} {prescription.m} {prescription.y}</td>
                                                                            <td>{prescription.name}</td>
                                                                            <td>{prescription.days}</td>
                                                                            <td>{prescription.quantity}</td>
                                                                            <td>{prescription.usage}</td>
                                                                        </tr>
                                                                    ))
                                                                }
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div> }
                                        {tab.medical_records &&
                                         <div id="pat_medical_records" className="tab-pane fade show active">
                                                <div className="card card-table mb-0">
                                                        <div className="card-body">
                                                            <div className="table-responsive">
                                                                <table className="table table-hover table-center mb-0">
                                                                    <thead>
                                                                    <tr>
                                                                        <th>Report By</th>
                                                                        <th>Date</th>
                                                                        <th>Problem</th>
                                                                        <th>Diagnosis Comments</th>
                                                                        <th></th>
                                                                    </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                {
                                                                    reports.map(reports => (
                                                                        <tr>
                                                                            <td>
                                                                                <h2 className="table-avatar">
                                                                                    Dr. {reports.doctor_name}
                                                                                </h2>
                                                                            </td>
                                                                            <td>{reports.d} {reports.m} {reports.y} <span className="d-block text-info">{reports.time}</span>
                                                                            </td>
                                                                            <td>{reports.type_of_diagnosis}</td>
                                                                            <td>{reports.type_of_problem}</td>
                                                                            <td className="text-right">
                                                                                <div className="table-action" onClick={() => history.push("/viewDiagnosis/" + reports.apptid)}>
                                                                                    <a className="btn btn-sm bg-info-light">
                                                                                        <i className="far fa-eye"></i> View
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
                                            </div>}
                                            {tab.labtests &&
                                         <div id="lab_requests" className="tab-pane fade show active">
                                         <div className="card card-table mb-0">
                                             <div className="card-body">
                                                 <div className="table-responsive">
                                                     <table className="table table-hover table-center mb-0">
                                                         <thead>
                                                         <tr>
                                                         
                                                            <th>Doctor name</th>
                                                            <th>Lab Test Name</th> 
                                                            <th>Date</th>
                                                            <th>Status</th>
                                                            <th></th>
                                                         </tr>
                                                         </thead>
                                                         <tbody>
                                                         {
                                                             lab_tests.map(reports => (
                                                                 <tr>
                                                                     <td>
                                                                         <h2 className="table-avatar">
                                                                             Dr. {reports.doctor}
                                                                         </h2>
                                                                     </td>
                                                                     <td>{reports.lab}
                                                                     </td>
                                                                     <td>{reports.d} {reports.m} {reports.y}</td>
                                                                     <td><span
                                                                            className={statusToClass1[reports.status].class}>{statusToClass1[reports.status].text}</span></td>
                                                                    { reports.report_url && 
                                                                     <td className="text-right">
                                                                         <div className="table-action">
                                                                             <a href={reports.report_url} className="btn btn-sm bg-info-light" /*style={{visibility:"hidden"}}*/>
                                                                                 <i className="far fa-eye"></i> View Report
                                                                             </a>
                                                                         </div>
                                                                     </td>
                                                                    }
                                                                    { !reports.report_url && 
                                                                     <td className="text-right">
                                                                         <div className="table-action">
                                                                             <a> No Report Available to View
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
                                     </div>}
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

export default Dashboard;
