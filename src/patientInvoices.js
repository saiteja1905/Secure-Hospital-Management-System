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
import { getStorage, ref, uploadBytesResumable,getDownloadURL } from "firebase/storage";

function PatientsInvoices() {
    const {currentUser} = useAuthValue();
    const [user,setUser] = useState({name:"patient"});
    const [navState, setNavState] = useState(false);
    const [patientName,setPN] = useState('Patient');
    const [tab,setTab] = useState({'invoices':true,'transactions':false});
    const [trans,setTransaction] = useState([]);
    const [loadUser,setLU] = useState(false);
    const [apptsApproved,setApptsApproved] = useState([]);
    const [appts,setAllAppts] = useState([]);
    const [disableAll,setdisAll] = useState([true,"loading info"]);
    const [error,setError] = useState('');
    const weekday = ["SUN","MON","TUE","WED","THUR","FRI","SAT"];
    const month = ["JAN","FEB","MAR","APR","MAY","JUNE","JULY","AUG","SEP","OCT","NOV","DEC"];
    const slotToTime = {1:"9.00 AM",2:"11.00 AM",3:"1.00 PM",4:"3.00 PM",5:"5.00 PM"};
    const statusToClass = {4:{"class":"badge badge-pill bg-warning-light","text":"Approved/Yet to be diagnosed"},
        5:{"class":"badge badge-pill bg-success-light","text":"Diagnosed"}}
    const statusToInfo = {0:"Processing",1:"Approved",2:"Rejected"};

    const [patientLogo,setPatientLogo] = useState('');
    const [report,setReport] = useState('');
    const storage = getStorage();

    async function loadReportsInfo (appts,ids) {
        const report = httpsCallable(functions, 'getReports');
        report({appointmentId:[...ids],plural:true})
            .then((result) => {
                if(result.data.success) {
                    console.log("reports",result.data);
                    let reports = result.data.data
                    for(var x in appts) {
                        console.log(appts);
                        appts[x]["due"] = reports[appts[x].id].due
                        appts[x]["cost"] = reports[appts[x].id].Cost
                    }
                    setApptsApproved(appts);
                    console.log(appts);
                } else {
                    console.log(result);
                }
                setdisAll([false,'']);
            }).catch((error) => {
            console.log("Error fetching user details in the profile settings page!");
        })
    }

    async function loadApptsInfo () {
        const getappts = httpsCallable(functions, 'getAllAppointments');
        getappts({type:5})
            .then((result) => {
                if(result.data.success) {
                    let apts  = result.data.data;
                    let todayDate = new Date().toLocaleDateString().replaceAll("/","-");
                    console.log(todayDate);
                    console.log(apts);
                    let dummyAppts = []
                    let todayAppts = []
                    let pendignAppts = []
                    let rejectedAppts = []
                    let approvedAppts = []
                    let apptIds = new Set();
                    for(let appt in apts) {
                        let data = apts[appt];
                        let date = data.date.split("-");
                        data["id"] = appt;
                        apptIds.add(appt);
                        data["d"] = date[1];
                        data["y"] = date[2];
                        data["m"] = month[date[0]-1];
                        data["time"] = slotToTime[data.slot_allocated];
                        var t = new Date(data.date_of_request);
                        data["req_d"] = t.getDate();
                        data["req_y"] = t.getFullYear();
                        data["req_m"] = month[t.getMonth()];
                        dummyAppts.push(data)
                        if(data.status == 5){
                            approvedAppts.push(data);
                        }
                    }
                    setApptsApproved(approvedAppts);
                    console.log(approvedAppts);
                    loadReportsInfo(approvedAppts,apptIds);
                } else {
                    setError(result.data.data.details);
                    setdisAll([false,""]);
                }
            }).catch((error) => {
            setdisAll([false,""]);
            setError("Error fetching doctors details in the search doctor page!");
        })
    }

    async function loadTransactionInfo () {
        const report = httpsCallable(functions, 'getTransactions');
        report({})
            .then((result) => {
                if(result.data.success) {
                    for(var x in result.data.data) {
                        let dupe = result.data.data[x].date
                        var t = new Date(dupe);
                        result.data.data[x]["req_date"] = t.getDate() + "-" + month[t.getMonth()] + "-" + t.getFullYear();
                    }
                    setTransaction(result.data.data);
                    console.log(result.data.data);
                } else {
                    console.log(result);
                }
                setdisAll([false,""])

            }).catch((error) => {
            console.log("Error fetching transactions!");
            setdisAll([false,""])
        })
    }
    const logout = () => {
        signOut(auth);
        history.push("/login");
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

    const history = useHistory();
    useEffect( () => {
        if (!loadUser) {
            setdisAll([true,"Laoding or Updating the info"]);
            loadUserInfo();
            loadApptsInfo();
            loadTransactionInfo();
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
                        <a href="index-2.html" className="navbar-brand logo">
                            <img src={Logo} className="img-fluid" alt="Logo" />
                        </a>
                    </div>
                    <div className="main-menu-wrapper">
                        <div className="menu-header">
                            <a href="index-2.html" className="menu-logo">
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
                                    <a href="#" className="dropdown-toggle nav-link" data-toggle="dropdown" aria-expanded="true" onClick={() => setNavState(!navState)}>
                                    <span className="user-img">
                                        <img className="rounded-circle" src={patientLogo} width="31" alt={user.username} />
                                    </span>
                                    </a>
                                    <div className="dropdown-menu dropdown-menu-right show">
                                        <div className="user-header">
                                            <div className="avatar avatar-sm">
                                                <img src={patientLogo} alt="User Image" className="avatar-img rounded-circle" />
                                            </div>
                                        </div>
                                        <a className="dropdown-item" onClick={() => history.push('/')}>Dashboard</a>
                                        <a className="dropdown-item" onClick={() => history.push('/profile')}>Profile Settings</a>
                                        <a className="dropdown-item" onClick={() => logout()}>Logout</a>
                                    </div>
                                </li>
                                : <li className="nav-item dropdown has-arrow logged-item">
                                    <a href="#" className="dropdown-toggle nav-link" data-toggle="dropdown" onClick={() => setNavState(!navState)}>
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
                                        <a href="#" class="booking-doc-img">
                                            <img src={patientLogo} alt="User Image"/>
                                        </a>
                                        <div class="profile-det-info">
                                            <h3>{user.username}</h3>
                                        </div>
                                    </div>
                                </div>
                                <div class="dashboard-widget">
                                    <nav class="dashboard-menu">
                                        <ul>
                                            <li>
                                                <a onClick={()=>  history.push('/')}>
                                                    <i class="fas fa-columns"></i>
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
                                                    <i class="fas fa-lock"></i>
                                                    <span>Change Password</span>
                                                </a>
                                            </li>
                                            <li>
                                                <a onClick={()=>history.push("/chatbot")}>
                                                    <i className="fas fa-sign-out-alt"></i>
                                                    <span>Chatbot</span>
                                                </a>
                                            </li>
                                            <li>
                                                <a href="index-2.html">
                                                    <i class="fas fa-sign-out-alt"></i>
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
                                    <div class="appointment-tab">

                                        <nav className="user-tabs mb-4">
                                            <ul className="nav nav-tabs nav-tabs-bottom nav-justified">
                                                <li className="nav-item">
                                                    {tab.invoices
                                                        ? <a className="nav-link active"  data-toggle="tab" >Invoices</a>
                                                        : <a className="nav-link"  data-toggle="tab" onClick={e=>toggleTab('invoices')}>Invoices</a>}
                                                </li>

                                                <li className="nav-item">
                                                    {tab.transactions
                                                        ? <a className="nav-link active" data-toggle="tab" ><span className="med-records">Transactions</span></a>
                                                        : <a className="nav-link" data-toggle="tab" onClick={e=>toggleTab('transactions')}><span className="med-records">Transactions</span></a>}
                                                </li>
                                            </ul>
                                        </nav>

                                        <div class="tab-content">
                                            {
                                                tab.invoices &&
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
                                                                        <th>Total Cost</th>
                                                                        <th>Total Due</th>
                                                                        <th></th>
                                                                    </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                    {
                                                                        apptsApproved.map(appt => (
                                                                            <tr>
                                                                                <td>
                                                                                    <h2 className="table-avatar">
                                                                                        {appt.patient.username}
                                                                                    </h2>
                                                                                </td>
                                                                                <td>{appt.d} {appt.m} {appt.y} <span
                                                                                    className="d-block text-info">{appt.time}</span>
                                                                                </td>
                                                                                <td>{appt.doctor.username}</td>
                                                                                <td>{appt.type_of_diagnosis}</td>
                                                                                <td>{appt.cost}</td>
                                                                                <td>{appt.due}</td>
                                                                                {appt.status == 5 &&
                                                                                    <td className="text-right">
                                                                                        <div className="change-photo-btn">
                                                                                        <span onClick={() => history.push('/viewReport/' + appt.id)}><i
                                                                                            className="fa"></i> View Report</span>
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
                                            {
                                                tab.transactions &&
                                                <div className="tab-pane show active" id="approved-appointments">
                                                    <div className="card card-table mb-0">
                                                        <div className="card-body">
                                                            <div className="table-responsive">
                                                                <table className="table table-hover table-center mb-0">
                                                                    <thead>
                                                                    <tr>
                                                                        <th>Payment Date</th>
                                                                        <th>Payment made by</th>
                                                                        <th>Amount Paid</th>
                                                                        <th>Status</th>
                                                                        <th>Inovice</th>
                                                                        <th></th>
                                                                    </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                    {
                                                                        Object.keys(trans).map((key, index) => (
                                                                            <tr>
                                                                                <td>
                                                                                    <h2 className="table-avatar">
                                                                                        <a onClick={() => history.push("/transaction/" + key)}
                                                                                           className="bg-success-light">{trans[key].req_date}</a>
                                                                                    </h2>
                                                                                </td>
                                                                                <td><span
                                                                                    className="d-block text-info">{trans[key].name}</span>
                                                                                </td>
                                                                                <td>{trans[key].amount}</td>
                                                                                <td>{statusToInfo[trans[key].status]}</td>
                                                                                <td>{trans[key].report_id}</td>
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


export default PatientsInvoices