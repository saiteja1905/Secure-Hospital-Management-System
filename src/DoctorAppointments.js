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
import patientLogo from './assets2/img/patients/patient.png'

function DoctorAppointments() {
	const {currentUser} = useAuthValue();
	const [user,setUser] = useState({name:"patient"});
	const [navState, setNavState] = useState(false);
	const [patientName,setPN] = useState('Patient');
	const [tab,setTab] = useState({'pending':true,'today':false,'rejected':false,'all':false});
	const [loadUser,setLU] = useState(false);
	const [apptsToday,setApptsToday] = useState([]);
	const [apptsPending,setApptsPending] = useState([]);
	const [apptsRejected,setApptsRejected] = useState([]);
	const [appts,setAllAppts] = useState([]);
	const weekday = ["SUN","MON","TUE","WED","THUR","FRI","SAT"];
	const [userLogo,setUserLogo] = useState('');
	const [disableAll,setdisAll] = useState([true,"Loading page information!"]);
	const [error,setError] = useState('');
	const month = ["JAN","FEB","MAR","APR","MAY","JUNE","JULY","AUG","SEP","OCT","NOV","DEC"];
	const slotToTime = {1:"9.00 AM",2:"11.00 AM",3:"1.00 PM",4:"3.00 PM",5:"5.00 PM"};
	const statusToClass = {1:{"class":"badge badge-pill bg-warning-light","text":"pending"},
		2:{"class":"badge badge-pill bg-success-light","text":"today"},
		3:{"class":"badge badge-pill bg-danger-light","text":"rejected"}}
	const logout = () => {
		signOut(auth);
		history.push("/login");
	}

    const history = useHistory();
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
					for(let appt in apts) {
						let data = apts[appt];
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
						}
					}
					setAllAppts(dummyAppts);
					setApptsToday(todayAppts);
					setApptsPending(pendignAppts);
					setApptsRejected(rejectedAppts);
				}
			}).catch((error) => {
			console.log("Error fetching doctors details in the search doctor page!");
		})
	}
	async function loadUserInfo () {
		const getUser = httpsCallable(functions, 'getUserInfo');
		getUser()
			.then((result) => {
				if(result.data.success && result.data.data.category == "1") {
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
			loadUserInfo();
			loadApptsInfo();
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
                                        <img className="rounded-circle" src={userLogo} width="31" alt={user.username} />
                                    </span>
                                    </a>
                                    <div className="dropdown-menu dropdown-menu-right show">
                                        <div className="user-header">
                                            <div className="avatar avatar-sm">
                                                <img src={userLogo} alt="User Image" className="avatar-img rounded-circle" />
                                            </div>
                                            <div className="user-text">
                                                <h6>{user.name}</h6>
                                                <p className="text-muted mb-0">Doctor</p>
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
											<img src={patientLogo} alt="User Image"/>
										</a>
										<div class="profile-det-info">
											<h3>{user.username}</h3>
											
											<div class="patient-details">
												<h5 class="mb-0">Staff Member</h5>
											</div>
										</div>
									</div>
								</div>
								<div class="dashboard-widget">
									<nav class="dashboard-menu">
										<ul>
											<li>
												<a onClick={()=>history.push('/')}>
													<i class="fas fa-columns"></i>
													<span>Dashboard</span>
												</a>
											</li>
											<li class="active">
												<a onClick={()=>history.push('/DoctorAppointments')}>
													<i class="fas fa-calendar-check"></i>
													<span>Appointments</span>
												</a>
											</li>
											<li>
												<a onClick={() => history.push('/AllPatients')}>
													<i class="fas fa-user-injured"></i>
													<span>My Patients</span>
												</a>
											</li>
											<li>
												<a onClick={()=>history.push('/DoctorSchedule')}>
													<i class="fas fa-hourglass-start"></i>
													<span>Schedule Timings</span>
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
											</li>
											<li>
												<a onClick={()=>logout()}>
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
							<div class="appointments">
								{appts.map(appt => {
									<div className="appointment-list">
										<div className="profile-info-widget">
											<a className="booking-doc-img">
												<img src={patientLogo} alt="User Image"/>
											</a>
											<div className="profile-det-info">
												<h3><a>{user.username}</a></h3>
												<div className="patient-details">
													<h5><i className="far fa-clock"></i> 14 Nov 2019, 10.00 AM</h5>
													<h5><i className="fas fa-map-marker-alt"></i> Newyork, United States
													</h5>
													<h5><i className="fas fa-envelope"></i> richard@example.com</h5>
													<h5 className="mb-0"><i className="fas fa-phone"></i> +1 923 782
														4575</h5>
												</div>
											</div>
										</div>
										<div className="appointment-action">
											<a className="btn btn-sm bg-info-light" data-toggle="modal"
											   data-target="#appt_details">
												<i className="far fa-eye"></i> View
											</a>
											<a  className="btn btn-sm bg-success-light">
												<i className="fas fa-check"></i> Accept
											</a>
											<a  className="btn btn-sm bg-danger-light">
												<i className="fas fa-times"></i> Cancel
											</a>
										</div>
									</div>
								})}
								
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

export default DoctorAppointments

