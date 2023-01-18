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

function DoctorSchedule(){
	const history = useHistory();
	const {currentUser} = useAuthValue();
	const [temp,setState] = useState(1);
	const [user,setUser] = useState({name:"patient"});
	const [loadUser,setLU] = useState(false);
	const [diagnosistype, AddDiagnosisType] = useState('');
	const [navState, setNavState] = useState(false);
	const [patientName,setPN] = useState('Patient');
	const [disableAll,setdisAll] = useState([true,"Loading page information!"]);
	const [error,setError] = useState('');
	const [appt,setAppt] = useState({patient:{address:""}});
	const [labs,setLabs] = useState([])
	const [tabs,settabs] = useState([])
	const [userLogo,setUserLogo] = useState('');
	const [testSelected, setLabTestSelected] = useState([{"rowid":1},{"rowid":2}])
	const [tabSelected, setTabSelect] = useState([{"rowid":1},{"rowid":2}])
	const [tab,setTab] = useState({'MON':true,'TUE':false,'WED':false,'THUR':false,'FRI':false,'SAT':false,'SUN':false});
	const [initSchedule,setInitSchedule] = useState([]);
	const weekday = ["SUN","MON","TUE","WED","THUR","FRI","SAT"];
	const [dates,setDates] = useState([]);
	const linkClass = ({true:"nav-link active",false:"nav-link"});
	const month = ["JAN","FEB","MAR","APR","MAY","JUNE","JULY","AUG","SEP","OCT","NOV","DEC"];
	const slotToTime = {1:"9.00 AM - 11.00 AM",2:"11.00 AM - 1:00 PM",3:"1.00 PM - 3:00 PM",4:"3.00 PM - 5:00 PM",5:"5.00 PM - 7:00 PM"};
	const buttonChange =  {true:{"class1":"doc-slot-list available","class2":"available_schedule"},false:{"class1":"doc-slot-list notavailable","class2":"delete_schedule"},"selected":"timing available selected"};
	const statusToClass = {1:{"class":"badge badge-pill bg-warning-light","text":"pending"},
		2:{"class":"badge badge-pill bg-success-light","text":"confirm"},
		3:{"class":"badge badge-pill bg-danger-light","text":"rejected"}}
	const logout = () => {
		signOut(auth);
		history.push("/login");
	}

	async function loadDoctorsAvailability () {
		const getAvailability = httpsCallable(functions, 'getDoctorsAvailability');
		getAvailability()
			.then((result) => {
				if(result.data.success) {
					let datesAvlbInfo = result.data.data;
					let dummyData = getnext7days();
					for(let i in dummyData) {
						if(datesAvlbInfo.hasOwnProperty(dummyData[i].date)) {
							let dateSlots = datesAvlbInfo[dummyData[i].date].slots;
							if(datesAvlbInfo[dummyData[i].date].availability == false) {
								dummyData[i].slot = {"1":false,"2":false,"3":false,"4":false,"5":false};
								dummyData[i].availability = false;
								continue;
							}
							for(var x in dateSlots) {
								dummyData[i]["slot"][dateSlots[x]] = false;
							}
						}
					}
					setDates(dummyData);
					setInitSchedule(dummyData);
					setdisAll([false])
				}
			}).catch(error => console.log(error))
	}

	const getnext7days = () => {
		let timeElapsed = Date.now();
		let today = new Date(timeElapsed);
		const days7 = []
		today.setDate(today.getDate() + 7);
		for (let i = 0; i < 7; i++) {
			let day = {};
			day["date"] = today.toLocaleDateString().replaceAll("/","-");
			day["day"] = weekday[today.getDay()];
			day["d"] = today.getDate();
			day["m"] = month[today.getMonth()];
			day["y"] = today.getFullYear();
			today.setDate(today.getDate() + 1);
			day["slot"] = {"1":true,"2":true,"3":true,"4":true,"5":true};
			day["availability"] = true;
			days7.push(day);
		}
		return days7;
	}

	async function setDoctorsAvailability () {
		const setAvailability = httpsCallable(functions, 'setDoctorsAvailability');
		setAvailability({dates:dates})
			.then((result) => {
				if(result.data.success) {
					setError("Updated the doctors schedule succesfully!")
				} else {
					setError("Error setting the updates");
				}
				setdisAll([false])
			}).catch(error => {
				console.log(error)
				setdisAll([false])
				setError(Error);
			})
	}

	const setDoctorAvailability = (e) => {
		e.preventDefault();
		setdisAll([true,"Updating the doctors availability"])
		setDoctorsAvailability();
	}
	const setAvailabilty = (d,v) => {
		let dummy = dates;
		for(var x in dummy) {
			if(dummy[x].d == d) {
				if(!v) dummy[x].slot = {"1":true,"2":true,"3":true,"4":true,"5":true};
				else dummy[x].slot = {"1":false,"2":false,"3":false,"4":false,"5":false};
				dummy[x].availability = !v;
				break;
			}
		}
		setDates(dummy);
		setState(temp + 1);
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

	const setActiveDate = (day) => {
		let dummy = {'MON':false,'TUE':false,'WED':false,'THUR':false,'FRI':false,'SAT':false,'SUN':false};
		dummy[day] = true;
		setTab(dummy);
	}

	const setOpposite = (d,s) => {
		let dummy = dates;
		for(var x in dummy) {
			if(dummy[x].d == d) {
				dummy[x].slot[s] = !(dummy[x].slot[s])
				break;
			}
		}
		setDates(dummy);
		setState(temp + 1);
	}

	useEffect( () => {
		if (!loadUser) {
			setdisAll([true,"Laoding or Updating the info"]);
			loadUserInfo();
			loadDoctorsAvailability();
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
                                                <h6>{user.username}</h6>
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
                                        <img className="rounded-circle" src={userLogo} width="31" alt={user.username} />
                                    </span>
                                    </a>
                                    <div className="dropdown-menu dropdown-menu-right">
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
										<div className="patient-details">
                                                <h5>Doctor</h5>
                                                <h5 className="mb-0"><i className="fas fa-map-marker-alt"></i>{user.address}</h5>
                                            </div>     
										</div>
									</div>
								</div>
								<div class="dashboard-widget">
									<nav class="dashboard-menu">
										<ul>
											<li class="active">
												<a onClick={()=>history.push('/')}>
													<i class="fas fa-columns"></i>
													<span>Dashboard</span>
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
							<div class="row">
								<div class="col-sm-12">
									<div class="card">
										<div class="card-body">
											<h4 class="card-title">Schedule Timings</h4>
											<div class="profile-box">
												<div class="row">
													<div class="col-md-12">
														<div class="card schedule-widget mb-0">
														
															<div class="schedule-header">
															
																<div class="schedule-nav">
																	<ul class="nav nav-tabs nav-justified">
																		{
																			dates.map(date => (
																				<li className="nav-item">
																					<a className={linkClass[tab[date.day]]} onClick={() => setActiveDate(date.day)}
																					   data-toggle="tab">
																						<span>{date.day}</span>
																						<span>{date.d} {date.m}</span>
																						<span>{date.y}</span></a>
																				</li>
																			))
																		}
																	</ul>
																</div>
																
															</div>
															
															<div class="tab-content schedule-cont">
																{
																	dates.map(date => (
																		<>
																		{
																			tab[date.day] &&
																				<div className="tab-pane fade show active">
																					<h4 className="card-title d-flex justify-content-between">
																						<span>Time Slots</span>
																						<div className="custom-checkbox"><input type="checkbox" id="availability" onChange={(e) => setAvailabilty(date.d,e.target.checked)} checked={!date.availability}  /> <a className="edit-link" data-toggle="modal">Not Available</a></div>
																					</h4>

																					<div className="doc-times">
																						{
																							Object.keys(date.slot).map((key, index) => (
																								<div className={buttonChange[date.slot[key]].class1}
																									onClick={() => setOpposite(date.d,key)}>
																									{slotToTime[key]}
																									<a
																										className={buttonChange[date.slot[key]].class2}>
																										<i className="fa fa-times"></i>
																									</a>
																								</div>
																							))
																						}
																					</div>
																				</div>
																		}
																		</>
																	))
																}
															</div>

															<div className="row">
																<div className="col-md-12">
																	<div className="submit-section">
																		<button type="submit"
																				className="btn btn-primary submit-btn"
																				onClick={e => setDoctorAvailability(e)}>Save Changes
																		</button>
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
							</div>
								
						</div>
					</div>

				</div>

			</div>		
		</div>
    )
    }
    export default DoctorSchedule;