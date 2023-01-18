import './profile.css'
import * as React from 'react';
import { useAuthValue } from './AuthContext'
import { reload, signOut } from 'firebase/auth'
import { auth, db, functions } from './firebase'
import { httpsCallable } from "firebase/functions"
import { useEffect, useState } from "react";
import { useHistory, useParams } from 'react-router-dom'
import './assets2/css/bootstrap.min.css'
import './assets2/plugins/fontawesome/css/fontawesome.min.css'
import './assets2/plugins/fontawesome/css/all.min.css'
import './assets2/css/style.css'
import Logo from './assets2/img/logo.png'
import patientLogo from './assets2/img/patients/patient.jpg'
import { render } from '@testing-library/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {collection, query, where, doc, getDocs, addDoc, setDoc, getDoc} from "firebase/firestore";


function ViewReport() {
    const history = useHistory();
    const { currentUser } = useAuthValue();
    const [ApprovedAccount, setApprovedAccount] = useState(0);
    const [claimedAmount, setClaimedAccount] = useState(0);
    const {appointmentId} = useParams()
    const [tabs,settabs] = useState([])
    const [labs,setLabs] = useState([])
    const [labCost,setlabCost] = useState({})
    const [user,setUser] = useState({name:"patient"});
    const [totalCost,setTotalCost] = useState(0);
    const [due,setDue] = useState(0);
    const [totalLabCost,setTotalLabCost] = useState(0);
    const [totalPresCost,setTotalPrescCost] = useState(0);
    const [totalApptCost,setTotalApptCost] = useState(0);
    const [disableAll,setdisAll] = useState([true,"Loading page information!"]);
    const [error,setError] = useState('');
    const [navState, setNavState] = useState(false);
    const [insurance, setInsurance] = useState(0);
    const [amount, setRequestedAmount] = useState(0);
    const [TransactionProcessingAmount, setTransactionProcessingAmount] = useState(0);
    const [TransactionStatus, setTransactionStatus] = useState("");
    const [existingLabs,setExistingLabs] = useState([])
    const [existingTabs,setExistingTabs] = useState([])
    const [tabletCost,settabletCost] = useState({})
    const [docCost,setDoctorCost] = useState([]);
    const [loadUser,setLU] = useState(false);
    const paperStyle = { padding: 20, height: '40vh', width: 360, margin: '90px auto' }

    const avatarStyle = { backgroundColor: '#3141A1' }
    const [appointmentsLists,setAppointments] = useState([]);
    const [loadedApointments,setloadedApts] = useState(false);

    const [appt,setAppt] = useState({patient:{address:""}});
    const month = ["JAN","FEB","MAR","APR","MAY","JUNE","JULY","AUG","SEP","OCT","NOV","DEC"];
    const [diagnosistype, AddDiagnosisType] = useState('');


    const printDocument = (e) => {
        e.preventDefault()
        const input = document.getElementById('generateReport');
        window.print(input);
    }
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
                    alert("Sent request successfully !");
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
                    let tabletCost = {};
                    let labCost = {};
                    setExistingTabs( result.data.tab);
                    setExistingLabs(result.data.lab);
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
                                setDoctorCost(result.data.data);
                            } else {
                                setDoctorCost([{"username":apptDetails.doctor_name,"specialization": "","cost": ""}])
                            }
                        }).catch((error) => {
                        console.log("Error fetching doctors details in the search doctor page!");
                        setError("Error getting the doctor details")
                        setDoctorCost([{"username":apptDetails.doctor_name,"specialization": "","cost": ""}])
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
                    setRequestedAmount(cost_data.amount);
                    setTransactionProcessingAmount(cost_data.processing_payment);
                    if (cost_data.hasOwnProperty("payment_status")){
                        if (cost_data.payment_status == 0){
                            setTransactionStatus("Waiting for Approval");
                        } else if (cost_data.payment_status == 1){
                            setTransactionStatus("Approved");
                        } else if (cost_data.payment_status == 2){
                            setTransactionStatus("Rejected");
                        }
                    }
                } else {
                    console.log(result);
                }

            }).catch((error) => {
            console.log("Error fetching user details in the profile settings page!");
        })
    }

    useEffect( () => {
        if (!loadUser) {
            setdisAll([true,"Laoding or Updating the info"]);
            loadUserInfo();
            loadTabsNLabs();
            loadAppointmenetInfo();
            loadDiagnosisInfo();
            setLU(true);
            loadReportInfo();
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
                                            <div className="user-text">
                                                <h6>{user.name}</h6>
                                                <p className="text-muted mb-0">Hospital Staff</p>
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
                                                <h6>{user.name}</h6>
                                                <p className="text-muted mb-0">Patient</p>
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
                                    <li className="breadcrumb-item"><a onClick={() => history.push('/')}>Home</a></li>
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
                        <div className="col-md-2 col-lg-2 col-xl-4 theiaStickySidebar">

                            <div className="profile-sidebar">
                                <div className="dashboard-widget">
                                    <nav className="dashboard-menu">
                                        <ul>
                                            <li>
                                                <a>
                                                    <span>Total Cost of the diagnosis : {totalCost}</span>
                                                </a>
                                            </li>
                                            <li>
                                                <a>
                                                    <span>Remaining Due of the diagnosis : {due}</span>
                                                </a>
                                            </li>
                                            {
                                                insurance == 0 &&
                                                <>
                                                <li>
                                                    <a>
                                                        <span>Insurance Status  :   Not Applied Yet</span>
                                                        <button style={{marginLeft: "130px"}} onClick={() => statusReqOperation(appt.id,1)} type="button" class="btn btn-info btn-sm">Submit Claim</button>
                                                    </a>
                                                </li>
                                                <li>
                                                    <a>
                                                        <span>Requested Amount :  {amount}</span>
                                                    </a>
                                                </li>
                                                </>
                                            }
                                            {
                                                insurance == 1 &&
                                                <>
                                                <li>
                                                    <a>
                                                        <span>Insurance Status  :   Processing</span>
                                                    </a>
                                                </li>
                                                </>
                                            }
                                            {
                                                insurance == 2 &&
                                                <>
                                                <li>
                                                    <a>
                                                        <span>Insurance Status  :   Approved</span>
                                                    </a>
                                                </li>
                                                <li>
                                                    <a>
                                                        <span>Processed Amount  :   {amount}</span>
                                                    </a>
                                                </li>
                                                </>
                                            }
                                            {
                                                insurance == 3 &&
                                                <>
                                                <li>
                                                    <a>
                                                        <span>Insurance Status  :   Rejected</span>
                                                    </a>
                                                </li>
                                                </>
                                            }
                                            {
                                                TransactionProcessingAmount !=0 &&
                                                <>
                                                <li>
                                                    <a>
                                                        <span>Transaction Status  :   {TransactionStatus}</span>
                                                    </a>
                                                </li>
                                                <li>
                                                    <a>
                                                        <span>Transaction Processing Amount  :   {TransactionProcessingAmount}</span>
                                                    </a>
                                                </li>
                                                </>
                                            }
                                            
                                            {
                                                due > 0 &&
                                                <>
                                                    <li>
                                                        <a>
                                                            <button type="button" style={{marginLeft:"160px"}} onClick={() => history.push('/checkOut/' + appointmentId)} class="btn btn-info">Proceed to Pay</button>                                                </a>
                                                    </li>
                                                </>
                                            }
                                            {

                                            }
                                        </ul>
                                    </nav>
                                </div>

                            </div>


                        </div>

                        <div className="col-lg-8 offset-lg-0" id="generateReport">
                            <div className="invoice-content">
                                <div className="invoice-item">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="invoice-logo">
                                                <img src={Logo} alt="logo"/>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <p className="invoice-details">
                                                <strong>Order ID:</strong><span>{appt.id}</span>

                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="invoice-item">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="invoice-info">
                                                <strong className="customer-text">Invoice From</strong>
                                                <p className="invoice-details invoice-details-two">
                                                    Health Infinitum <br/>
                                                    Arizona State University, Tempe,<br/>
                                                    Arizona, USA <br/>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="invoice-info invoice-info2">
                                                <strong className="customer-text">Invoice To</strong>
                                                <p className="invoice-details">
                                                    {user.username}<br/>
                                                    {user.email} <br/>
                                                    {user.address} <br/>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="invoice-item">
                                    <div className="row">
                                        <div className="col-md-12">
                                            <div className="invoice-info">

                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card card-table">
                                    <div className="card-body">
                                        <div className="table-responsive">
                                            <table className="table table-hover table-center">
                                                <thead>
                                                <tr>
                                                    <th style={{minWidth: "50px"}}>Name</th>
                                                    <th style={{minWidth: "50px"}}>Quantity</th>
                                                    <th style={{minWidth: "50px"}}>Days</th>
                                                    <th style={{minWidth: "50px"}}>Each Tablet Cost (in $)</th>
                                                    <th style={{minWidth: "50px"}}>Total Tablet Cost (in $)</th>
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
                                                                {existingTabs.length > 0 ? existingTabs[tabs[key].id].cost : 0}
                                                            </td>
                                                            <td>
                                                                {existingTabs.length > 0 && existingTabs[tabs[key].id].cost * tabs[key].quantity}
                                                            </td>

                                                        </tr>

                                                    ))
                                                }
                                                <tr>
                                                    <th style={{minWidth: "50px"}}>Final Total for tablets (in $)</th>
                                                    <td></td>
                                                    <td></td>
                                                    <td></td>
                                                    <td>{totalPresCost}</td>
                                                </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                <div className="card card-table">
                                    <div className="card-body">
                                        <div className="table-responsive">
                                            <table className="table table-hover table-center">
                                                <thead>
                                                <tr>
                                                    <th style={{minWidth: "50px"}}>Name</th>
                                                    <th style={{minWidth: "50px"}}>Specialization</th>
                                                    <th style={{minWidth: "50px"}}>Cost</th>

                                                </tr>
                                                </thead>
                                                <tbody>
                                                {
                                                    docCost.map(d => (
                                                        <tr>
                                                            <td>
                                                                {d.username}
                                                            </td>
                                                            <td>
                                                                {d.specialization}
                                                            </td>
                                                            <td>
                                                                {d.cost}
                                                            </td>

                                                        </tr>

                                                    ))
                                                }
                                                <tr>
                                                    <th style={{minWidth: "50px"}}>Final Total for Appointment (in $)</th>
                                                    <td></td>
                                                    <td>{totalApptCost}</td>
                                                </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                <div className="card card-table">
                                    <div className="card-body">
                                        <div className="table-responsive">
                                            <table className="table table-hover table-center">
                                                <thead>
                                                <tr>
                                                    <th style={{minWidth: "50px"}}>Name</th>
                                                    <th style={{minWidth: "50px"}}>Cost</th>
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
                                                                {labs[key].id != null && existingLabs[labs[key].id] != null && existingLabs[labs[key].id].cost}
                                                            </td>

                                                        </tr>

                                                    ))
                                                }
                                                <tr>
                                                    <th style={{minWidth: "50px"}}>Final Total for Lab tests (in $)</th>
                                                    <td>{totalLabCost}</td>
                                                </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                                <br/>
                                <br/>

                                <br/>

                                <button className="btn btn-primary btn-block" type="submit"
                                        onClick={(e) => printDocument(e)}>Download Invoice
                                </button>


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

export default ViewReport;