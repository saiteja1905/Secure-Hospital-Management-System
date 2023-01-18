import './profile.css';
import * as React from 'react';
import PopupState, { bindTrigger, bindMenu } from 'material-ui-popup-state';
import {useAuthValue} from './AuthContext';
import { signOut } from 'firebase/auth';
import {auth, db, functions} from './firebase';
import { httpsCallable } from "firebase/functions"
import {useEffect, useState} from "react";
import {useHistory} from 'react-router-dom'
import './assets/css/bootstrap.min.css'
import './assets/css/font-awesome.min.css'
import './assets/css/feathericon.min.css'
import './assets/plugins/morris/morris.css'
import './assets/css/style.css'

import Logo from './assets2/img/logo.png'

function AdminDashboard(){
    const {currentUser} = useAuthValue();    
    const [disableAll,setdisAll] = useState([true,"Loading page information!"]);
    const [user,setUser] = useState({});
    const [navState, setNavState] = useState(false);
    const [error,setError] = useState('');
    const [loadUser,setLU] = useState(false);
    const [tab,setTab] = useState({'pen_trans':true,'appr_trans':false,'rej_trans':false})
    const [userLogo,setUserLogo] = useState('')
    const month = ["JAN","FEB","MAR","APR","MAY","JUNE","JULY","AUG","SEP","OCT","NOV","DEC"];
    const statusToClass = {0:{"class":"badge badge-pill bg-warning-light","text":"Pending"},
                            1:{"class":"badge badge-pill bg-success-light","text":"Approved"},
                            2:{"class":"badge badge-pill bg-danger-light","text":"Rejected"}}
    const logout = () => {
		signOut(auth);
		history.push("/login");
	}
    const history = useHistory();
    const [newBox, setNewBox] = useState(false);
    const [buttonDisabled,setButtonDisabled] = useState(false);
    const [users, setUsers] = useState([]);
    const [userId,setUserId] = useState('');
    const [type, setType] = useState('');
    const [types, setTypes] = useState([{"type":"patient","value":0},{"type":"doctor","value":1},{"type":"Hospital staff","value":2},{"type":"Lab staff","value":3},{"type":"Insurance Staff","value":4}])
    const typeToCategoryMapping = {"0" : "Patient","1":"Doctor","2":"Hospital Staff","3":"Lab Staff","4":"Insurance Staff","9":"Admin"};
    async function loadUsersInfo () {
        const getUsers = httpsCallable(functions, 'getUsersInfo');
        getUsers()
            .then((result) => {
                let tempUsers = []
                if(result.data.success) {
                    setUsers(result.data.data);
                }
                setdisAll([false,""])
            }).catch((error) => {
            console.log("Error fetching user details in the profile settings page!");
            setdisAll([false,""])
        })
    }

    async function modifyUser (userId,type) {
        const modifyUserFunc = httpsCallable(functions, 'modifyUserType');
        let data = {id:userId,type:type}
        modifyUserFunc(data)
            .then((result) => {
                if(result.data.success) {
                    setLU(false);
                    setNewBox(!newBox);
                } else {
                    setError("Unable to udpate the user details !");
                }
            }).catch((error) => {
            console.log("Error fetching user details in the profile settings page!");
        })
    }

    async function deleteUserFunc (e) {
        if(!disableAll[0]) {
            setdisAll([true,"Deleting the user"])
            const deleteUserFunction = httpsCallable(functions, 'deleteUser');
            let data = {id:e}
            deleteUserFunction(data)
                .then((result) => {
                    if(result.data.success) {
                        setLU(false);
                    } else {
                        setError("Unable to udpate the user details !");
                    }
                    setdisAll([false,"Deleting the user"])
                    setButtonDisabled(false);
                }).catch((error) => {
                setButtonDisabled(false);

                console.log("Error fetching user details in the profile settings page!");
            })
        }
    }

    const loadUsersTrigger = () => {
        if(!loadUser)
            loadUsersInfo();
        setLU(true);
    }

    const triggerAdd = () => {
        loadUsersTrigger();
        setNewBox(!newBox);
        setButtonDisabled(false);
    }

    const modifyUserType = e => {
        e.preventDefault()
        console.log(userId,type);
        setButtonDisabled(true)
        modifyUser(userId,type);
    }

    const deleteUser = e => {
        console.log(e);
        setButtonDisabled(false);
        deleteUserFunc(e);
    }

    useEffect( () => {
        loadUsersTrigger();
    });

    async function loadUserInfo () {
        const getUser = httpsCallable(functions, 'getUserInfo');
        getUser()
            .then((result) => {
                if(result.data.success && result.data.data.category == "9") {
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
                }
            }).catch((error) => {
            console.log("Error fetching user details in the profile settings page!");
            history.push("/login");
        })
    }

    useEffect( () => {
        if (!loadUser) {
            setdisAll([true,"Initial db lookup for the page information."]);
            loadUserInfo();
            setLU(true);
        }
    });
    

    return(
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
                                                <a onClick={() => history.push('/AdminDoctorSearch')}>
                                                    <i className="fas fa-calendar-plus-o"></i>
                                                    <span>Doctors</span>
                                                </a>
                                            </li>
                                            <li>
                                                <a onClick={() => history.push('/AllPatients')}>
                                                    <i className="fas fa-file-invoice"></i>
                                                    <span>All Patients</span>
                                                </a>
                                            </li>
                                            <li>
                                                <a onClick={() => history.push('/AdminAppointmentsView')}>
                                                    <i className="fas fa-file-invoice"></i>
                                                    <span>All Appointments</span>
                                                </a>
                                            </li>
                                            <li>
                                                <a onClick={() => history.push('/labStaffDB')}>
                                                    <i className="fas fa-file-invoice"></i>
                                                    <span>Lab Reports & Details</span>
                                                </a>
                                            </li>
                                            <li>
                                                <a onClick={() => history.push('/invoiceReports')}>
                                                    <i className="fas fa-file-invoice"></i>
                                                    <span>Diagnosis Reports</span>
                                                </a>
                                            </li>
                                            <li>
                                                <a onClick={() => history.push('/AdminTransactions')}>
                                                    <i className="fas fa-file-invoice"></i>
                                                    <span>Transactions</span>
                                                </a>
                                            </li>
                                            <li>
                                                <a onClick={() => history.push('/AdminInsurances')}>
                                                    <i className="fas fa-file-invoice"></i>
                                                    <span>Insurance Requests</span>
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
                                            </li>
                                            <li>
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

                            <div className="col-sm-12 row">
                                <h3 class="page-title">User roles</h3>
                                <div class="col-sm-12 col">
                                    <a  data-toggle="modal" class="btn btn-primary float-right mt-2" onClick={() => triggerAdd()}>Update User Roles</a>
                                    <a>  <span>  </span></a>
                                    <a data-toggle="modal" className="btn btn-primary float-right mt-2"
                                       onClick={() => history.push("/AdminAddUser")}>Add User</a>
                                </div>
                                <div className="col-sm-12 row">

                                </div>
                            <div class=" col-sm-12 card">
                                    <div class="card-body">
                                        <div class="table-responsive">
                                            <table class="datatable table table-hover table-center mb-0">
                                                <thead>
                                                <tr>
                                                    <th>Email</th>
                                                    <th>Type of the user</th>
                                                    <th class="text-right">Actions</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {users.map((user) => (
                                                    <tr>
                                                        <td>{user.email}</td>
                                                        <td>
                                                            <h2 className="table-avatar">
                                                                <a>{typeToCategoryMapping[user.type]}</a>
                                                            </h2>
                                                        </td>
                                                        <td>
                                                            <div className="actions">
                                                                <a data-toggle="modal" className="btn btn-sm bg-warning-light" onClick={() => history.push('/AdminProfileUpdate/'+user.id)} diasbled={buttonDisabled}>
                                                                Update
                                                                </a>
                                                            </div>
                                                        </td>
                                                        <td className="text-right">
                                                            <div className="actions">
                                                                <a data-toggle="modal" className="btn btn-sm bg-danger-light" onClick={() => deleteUser(user.id)} diasbled={buttonDisabled}>
                                                                    <i className="fe fe-trash"></i> Delete
                                                                </a>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                            </div>
                        </div>
                    </div>

                    {
                        newBox && <div className="modal fade show" id="Add_Specialities_details" aria-hidden="true" role="dialog" style={{display:"block"}}>
                            <div className="modal-dialog modal-dialog-centered" role="document">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h5 className="modal-title">Modify User Types</h5>
                                        <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                            <span aria-hidden="true" onClick={() => setNewBox(!newBox)}>&times;</span>
                                        </button>
                                    </div>
                                    <div className="modal-body">
                                        <form onSubmit={modifyUserType}>
                                            <div className="row form-row">
                                                <div className="col-12 col-sm-6">
                                                    <div className="form-group">
                                                        <label>User email</label>
                                                        <select className="form-control" onChange={e => setUserId(e.target.value)}>
                                                            <option value='None'>Select User</option>
                                                            {users.map((row) => (<option value={row.id}>{row.email}</option>))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="col-12 col-sm-6">
                                                    <div className="form-group">
                                                        <label>Type of users</label>
                                                        <select className="form-control" onChange={e => setType(e.target.value)}>
                                                            <option value='None'>Select Type</option>
                                                            {types.map((row) => (<option value={row.value}>{row.type}</option>))}
                                                        </select>
                                                    </div>
                                                </div>

                                            </div>
                                            <button type="submit" className="btn btn-primary btn-block" disabled={buttonDisabled}>Save Changes</button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                        }
                        <div class="modal fade" id="edit_specialities_details" aria-hidden="true" role="dialog">
                            <div class="modal-dialog modal-dialog-centered" role="document" >
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title">Edit Specialities</h5>
                                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                            <span aria-hidden="true">&times;</span>
                                        </button>
                                    </div>
                                    <div class="modal-body">
                                        <form>
                                            <div class="row form-row">
                                                <div class="col-12 col-sm-6">
                                                    <div class="form-group">
                                                        <label>Specialities</label>
                                                        <input type="text" class="form-control" value="Cardiology" />
                                                    </div>
                                                </div>
                                                <div class="col-12 col-sm-6">
                                                    <div class="form-group">
                                                        <label>Image</label>
                                                        <input type="file"  class="form-control" />
                                                    </div>
                                                </div>

                                            </div>
                                            <button type="submit" class="btn btn-primary btn-block">Save Changes</button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="modal fade" id="delete_modal" aria-hidden="true" role="dialog">
                            <div class="modal-dialog modal-dialog-centered" role="document" >
                                <div class="modal-content">
                                            <h5 class="modal-title">Delete</h5>
                                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                                <span aria-hidden="true">&times;</span>
                                            </button>
                                        </div>
                                    <div class="modal-body">
                                        <div class="form-content p-2">
                                            <h4 class="modal-title">Delete</h4>
                                            <p class="mb-4">Are you sure want to delete?</p>
                                            <button type="button" class="btn btn-primary">Save </button>
                                            <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button>
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
                                                        <a target="_blank"><i className="fab fa-facebook-f"></i>
                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a target="_blank"><i className="fab fa-twitter"></i> </a>
                                                    </li>
                                                    <li>
                                                        <a target="_blank"><i
                                                            className="fab fa-linkedin-in"></i></a>
                                                    </li>
                                                    <li>
                                                        <a target="_blank"><i className="fab fa-instagram"></i></a>
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
        </div>
        </div>
    )
}

export default AdminDashboard