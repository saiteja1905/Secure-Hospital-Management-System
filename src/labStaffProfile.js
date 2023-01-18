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

function LabStaffProfile() {
    const {currentUser} = useAuthValue();
    const [user,setUser] = useState({username:"patient"});
    const [navState, setNavState] = useState(false);
    const [patientName,setPN] = useState('Patient');
    const [tab,setTab] = useState({'lab_requests':true,'approved':false,'rejected':false});
    const [loadUser,setLU] = useState(false);
    const [appts,setAppts] = useState([]);
    const [apprvd,setApprovedRequests] = useState([]);
    const [pendingreq,setPendingRequests] = useState([]);
    const [rejreq,setRejRequests] = useState([]);
    const [doctor,setDoctor] = useState([]);
    const [medRecords,setMedRecords] = useState([]);
    const [prescriptions, setPresciptions] = useState([]);
    const [disableAll,setdisAll] = useState([false,"Loading page information!"]);
    const [error,setError] = useState('');
    const [userLogo,setUserLogo] = useState('');
    const storage = getStorage();
    const weekday = ["SUN","MON","TUE","WED","THUR","FRI","SAT"];
    const month = ["JAN","FEB","MAR","APR","MAY","JUNE","JULY","AUG","SEP","OCT","NOV","DEC"];
    const slotToTime = {1:"9.00 AM",2:"11.00 AM",3:"1.00 PM",4:"3.00 PM",5:"5.00 PM"};
    const statusToClass = {1:{"class":"badge badge-pill bg-warning-light","text":"pending"},
                            2:{"class":"badge badge-pill bg-success-light","text":"confirm"},
                            3:{"class":"badge badge-pill bg-danger-light","text":"reject"},
                            4:{"class":"badge badge-pill bg-success-light","text":"Admitted"},
                        5:{"class":"bade badge-pill bg-success-light", "text" : "Diagnosed"}}


    const history = useHistory();
    async function upload(i, reqId) {
        console.log(i);
        try {
            if(i != '') {
                const storageRef = ref(storage, '/labReports/' + reqId);
                const task = uploadBytesResumable(storageRef,i);
                task.on(
                    (error) => console.log(error),
                    () => {
                        getDownloadURL(task.snapshot.ref).then((downloadURL) => {
                            console.log("File available at", downloadURL);
                            updateReportURL(downloadURL,reqId);
                        });
                    });
            }
        } catch(e) {
            console.log("error ",e);
        }

    }

    async function updateReportURL (downloadURL,reqId) {
        const report = httpsCallable(functions, 'updateLabTest');
        report({"report":downloadURL,"labtestId":reqId,"status":2})
            .then((result) => {
                if(result.data.success) {
                    setError("Successfully updated your profile!");
                } else {
                    console.log(result);
                }
                setdisAll([false,""]);
                setLU(false);
            }).catch((error) => {
            console.log("Error fetching user details in the profile settings page!");
        })
    }

    const updateField = (e,field) => {
        if(e == undefined) {
            return
        }
        e.preventDefault();
        upload(e.target.files[0],field);
    }


    async function apptUpdate (labtestID,accept) {
        const getappts = httpsCallable(functions, 'updateLabTest');
        getappts({status:accept,labtestId:labtestID})
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

    const labOperation = (labtestID,accept) => {
        if(!disableAll[0]) {
             setdisAll([true,"Laoding or Updating the info"]);
             apptUpdate(labtestID,accept);
        }
    }

    async function loadLabReqInfo () {
        const getRequests = httpsCallable(functions, 'getLabRequests');
        getRequests({})
            .then((result) => {
                if(result.data.success) {
                    let LabReq  = result.data.data.appointments.data;
                    let labTests = Object.values(result.data.data.lab_tests);
                    let pendingApprovalLabTests = [];
                    let approvedApprovalLabTests = [];
                    let rejectedApprovalLabTests = [];
                    let dummyReq = [];
                    for (var i in labTests) {
                        let id = labTests[i]["diagnosisId"];
                        let Reqs = {};
                        Reqs["doctor"] = LabReq[id].doctor_name;
                        Reqs["patient"] = LabReq[id].patient_name;
                        Reqs["lab"] = labTests[i].name;
                        let date = LabReq[id].date.split("-");
                        Reqs["d"] = date[1];
                        Reqs["y"] = date[2];
                        Reqs["m"] = month[date[0]-1];
                        Reqs["id"] = labTests[i].id;
                        Reqs["report_url"] = labTests[i].report_url;
                        if (labTests[i].status == 1){
                            pendingApprovalLabTests.push(Reqs);
                        }else if (labTests[i].status == 2){
                            approvedApprovalLabTests.push(Reqs);
                        }else if (labTests[i].status == 3){
                            rejectedApprovalLabTests.push(Reqs);
                        }
                        dummyReq.push(Reqs);
                    }

                    setPendingRequests(pendingApprovalLabTests);
                    setRejRequests(rejectedApprovalLabTests);
                    setApprovedRequests(approvedApprovalLabTests);

                    setdisAll([false,""]);
                }
            }).catch((error) => {
            
                console.log("Error fetching doctors details in the search doctor page!",error);
            })
    }

    async function loadUserInfo () {
        const getUser = httpsCallable(functions, 'getUserInfo');
        getUser()
            .then((result) => {
                if(result.data.success && (result.data.data.category == "3" ||result.data.data.category == "9")) {
                    // sendEmailConfirmation();
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
    
    useEffect( () => {
        if (!loadUser) {
            setdisAll([false,"Initial db lookup for the page information."]);
            loadUserInfo();
            loadLabReqInfo();
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
                                            <img src={userLogo} alt="User Image" />
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
                                <div className="card-body pt-0">
                                    <nav className="user-tabs mb-4">
                                        <ul className="nav nav-tabs nav-tabs-bottom nav-justified">
                                            <li className="nav-item">
                                                {tab.lab_requests
                                                    ? <a className="nav-link active"  data-toggle="tab" onClick={e=>toggleTab('lab_requests')}>Lab Requests</a>
                                                    : <a className="nav-link"  data-toggle="tab" onClick={e=>toggleTab('lab_requests')}>Lab Requests</a>}
                                            </li>
                                            <li className="nav-item">
                                                {tab.approved
                                                    ? <a className="nav-link active"  data-toggle="tab" onClick={e=>toggleTab('approved')}>Approved Records</a>
                                                    : <a className="nav-link"  data-toggle="tab" onClick={e=>toggleTab('approved')}>Approved Records</a>}
                                            </li>
                                            <li className="nav-item">
                                                {tab.rejected
                                                    ? <a className="nav-link active" data-toggle="tab" onClick={e=>toggleTab('rejected')}>Rejected Records</a>
                                                    : <a className="nav-link" data-toggle="tab" onClick={e=>toggleTab('rejected')}>Rejected Records</a>}
                                            </li>
                                            
                                        </ul>
                                    </nav>

                                    <div className="tab-content pt-0">
                                        {tab.lab_requests &&
                                            <div id="lab_requests" className="tab-pane fade show active">
                                                <div className="card card-table mb-0">
                                                    <div className="card-body">
                                                        <div className="table-responsive">
                                                            <table className="table table-hover table-center mb-0">
                                                                <thead>
                                                                <tr>
                                                                
                                                                   <th>Doctor name</th>
                                                                   <th>Patient name</th> 
                                                                   <th>Lab Name</th>
                                                                   <th>Date</th>
                                                                   <th></th>
                                                                </tr>
                                                                </thead>
                                                                <tbody>
                                                                {
                                                                    pendingreq.map(reqsts => (
                                                                        <tr>
                                                                            <td>
                                                                                <h2 className="table-avatar">
                                                                                    Dr. {reqsts.doctor}
                                                                                </h2>
                                                                            </td>
                                                                            <td>{reqsts.patient} 
                                                                            </td>
                                                                            <td>{reqsts.lab}</td>
                                                                            <td>{reqsts.d} {reqsts.m} {reqsts.y}</td>
                                                                            <td className="text-right">
                                                                                    <div className="table-action">

                                                                                        <a onClick={() => labOperation(reqsts.id,2)}
                                                                                           className="btn btn-sm bg-success-light">
                                                                                            <i className="fas fa-check"></i> Accept
                                                                                        </a>
                                                                                        <a onClick={() => labOperation(reqsts.id,3)}
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
                                            </div> }
                                        {tab.approved &&
                                            <div id="approved" className="tab-pane fade show active">
                                                <div className="card card-table mb-0">
                                                    <div className="card-body">
                                                        <div className="table-responsive">
                                                            <table className="table table-hover table-center mb-0">
                                                                <thead>
                                                                <tr>
                                                                    <th>Patient name</th>
                                                                    <th>Doctor name</th>
                                                                    <th>Lab Name</th>
                                                                    <th>Date</th>
                                                                    <th>Status</th>
                                                                </tr>
                                                                </thead>
                                                                <tbody>
                                                                {
                                                                    apprvd.map(reqsts => (
                                                                        <tr>
                                                                            <td>
                                                                                <h2 className="table-avatar">
                                                                                    Dr. {reqsts.doctor}
                                                                                </h2>
                                                                            </td>
                                                                            <td>{reqsts.patient} 
                                                                            </td>
                                                                            <td>{reqsts.lab}</td>
                                                                            <td>{reqsts.d} {reqsts.m} {reqsts.y}</td>
                                                                            {
                                                                                        !reqsts.report_url &&
                                                                                        <td>In Process</td>
                                                                            }
                                                                            {
                                                                                        reqsts.report_url &&
                                                                            <td>Uploaded</td>
                                                                            }
                                                                            <td className="text-right">
                                                                                <div className="upload-img">
                                                                                    {!reqsts.report_url &&
                                                                                    <div className="change-photo-btn">
                                                                                        <span><i
                                                                                            className="fa fa-upload"></i> Upload Report</span>
                                                                                        <input type="file" className="upload"  onChange={e => updateField(e,reqsts.id)} />
                                                                                    </div>
                                                                                    }
                                                                                    {
                                                                                        !reqsts.report_url &&
                                                                                        <small className="form-text text-muted">Allowed PDF. Max size of 2MB</small>
                                                                                    }
                                                                                    {reqsts.report_url &&
                                                                                        <div className="table-action">
                                                                                            <a href={reqsts.report_url}
                                                                                                className="btn btn-sm bg-success-light">View Report
                                                                                            </a>
                                                                                        </div>
                                                                                    }

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
                                            </div> }
                                        {tab.rejected &&
                                         <div id="rejected" className="tab-pane fade show active">
                                                <div className="card card-table mb-0">
                                                        <div className="card-body">
                                                            <div className="table-responsive">
                                                                <table className="table table-hover table-center mb-0">
                                                                    <thead>
                                                                    <tr>
                                                                    <th>Patient name</th>
                                                                    <th>Doctor name</th>
                                                                    <th>Lab Name</th>
                                                                    <th>Date</th>
                                                                    <th></th>
                                                                </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                    {
                                                                    rejreq.map(reqsts => (
                                                                        <tr>
                                                                            <td>
                                                                                <h2 className="table-avatar">
                                                                                    Dr. {reqsts.doctor}
                                                                                </h2>
                                                                            </td>
                                                                            <td>{reqsts.patient} 
                                                                            </td>
                                                                            <td>{reqsts.lab}</td>
                                                                            <td>{reqsts.d} {reqsts.m} {reqsts.y}</td>

                                                                            <td className="text-right">
                                                                                    <div className="table-action">

                                                                                        <a onClick={() => labOperation(reqsts.id,2)}
                                                                                           className="btn btn-sm bg-success-light">
                                                                                            <i className="fas fa-check"></i> Accept
                                                                                        </a>
                                                                                        <a onClick={() => labOperation(reqsts.id,3)}
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

export default LabStaffProfile
