import './profile.css'
import * as React from 'react';
import PopupState, { bindTrigger, bindMenu } from 'material-ui-popup-state';
import {useAuthValue} from './AuthContext'
import { reload, signOut } from 'firebase/auth'
import {auth, db, functions} from './firebase'
import { httpsCallable } from "firebase/functions"
import {useEffect, useState} from "react";
import {useHistory, useParams} from 'react-router-dom'
import './assets2/css/bootstrap.min.css'
import './assets2/plugins/fontawesome/css/fontawesome.min.css'
import './assets2/plugins/fontawesome/css/all.min.css'
import './assets2/css/style.css'

import Logo from './assets2/img/logo.png'
import patientLogo from './assets2/img/patients/patient.jpg'
import { render } from '@testing-library/react';

function AddDiagnosis(){
	const history = useHistory();
	const {currentUser} = useAuthValue();
	const [state,setState] = useState(1);
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
	const [tabs,settabs] = useState([])
    const [testSelected, setLabTestSelected] = useState([{"rowid":1},{"rowid":2}])
    const [tabSelected, setTabSelect] = useState([{"rowid":1},{"rowid":2}])
	const [tab,setTab] = useState({'appointments':true,'prescriptions':false,'billing':false,'medical_records':false})
	const weekday = ["SUN","MON","TUE","WED","THUR","FRI","SAT"];
	const month = ["JAN","FEB","MAR","APR","MAY","JUNE","JULY","AUG","SEP","OCT","NOV","DEC"];
	const slotToTime = {1:"9.00 AM - 11.00 AM",2:"11.00 AM - 1:00 PM",3:"1.00 PM - 3:00 PM",4:"3.00 PM - 5:00 PM",5:"5.00 PM - 7:00 PM"};
	const statusToClass = {1:{"class":"badge badge-pill bg-warning-light","text":"pending"},
		2:{"class":"badge badge-pill bg-success-light","text":"confirm"},
		3:{"class":"badge badge-pill bg-danger-light","text":"rejected"}}
	const logout = () => {
		signOut(auth);
		history.push("/login");
	}

	async function loadUserInfo () {
		const getUser = httpsCallable(functions, 'getUserInfo');
		getUser()
			.then((result) => {
				if(result.data.success && result.data.data.category == "1") {
					// sendEmailConfirmation();
					setUser(result.data.data);
				} else {
					signOut(auth);
					history.push("/login");
				}

			}).catch((error) => {
			console.log("Error fetching user details in the profile settings page!");
			history.push("/login");
		})
	}


	// async function sendEmail () {
	// 	const email = httpsCallable(functions, 'sendEmail');
	// 	email()
	// 		.then((result) => {
	// 			if(result.data) {
	// 				console.log(result.data);
	// 			} else {
	// 				setError("Error sending email");
	// 			}
	// 		}).catch((error) => {
	// 		setError("caught in  sending the email");
	// 	})
	// }

	async function loadApptInfo () {
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
					logout();
				}
				setdisAll([false,""]);
			}).catch((error) => {
			setError("Error fetching user details in the profile settings page!");
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
					setdisAll([false,""]);
					settabs(dupeTabs);
					setLabs(dupeLabs);
				}
			}).catch((error) => {
			console.log(error);
		})
	}

	const ReloadScreen= () => {
		window.location.reload(true)
		window.location.reload(false)
	}

	const addTabletRow = () => {
		let newTabsselected = tabSelected;
		newTabsselected.push({"count": (tabSelected.length + 1)})
		setTabSelect(newTabsselected);
		setState(state+1)
	}

	const addLabTestRow = () => {
		setState(true)
		let newTestSelected = testSelected;
		newTestSelected.push({"count": (testSelected.length + 1)})
		setLabTestSelected(newTestSelected);
		setState(state+1)
	}

	const addTablet = (row,tabletInfo,value) => {
        let duplicate = tabSelected;
        for(let x in duplicate) {
            if(duplicate[x].rowid == row) {
                duplicate[x][tabletInfo] = value;
				if(tabletInfo == "id") {
					for(let t in tabs) {
						if(tabs[t]["id"] == value) {
							duplicate[x]["name"] = tabs[t].name;
							break;
						}

					}
				}
                break;
            }
        }
        setTabSelect(duplicate);
	}

    const addLabTest = (row,labTestInfo,value) =>
    {
        let duplicate_data = testSelected;
        for(let x in duplicate_data) {
            if(duplicate_data[x].rowid == row) {
                duplicate_data[x]["id"] = value;
				for(let t in labs) {
					if(labs[t].id == value) {
						duplicate_data[x]["name"] = labs[t].name;
						break;
					}
				}
                break;
            }
        }
        setLabTestSelected(duplicate_data);
    }

	async function updateDiagnosis () {
		const ud = httpsCallable(functions, 'updateDiagnosis');
		ud({diagnosis:diagnosistype,appointmentId:appt.id,labtests:testSelected,prescriptions:tabSelected})
			.then((result) => {
				if(result.data.success) {
					setError("Updated the diagnosis information.");
				} else {
					setError(result.data.data);
				}
				setdisAll([false,""]);
			}).catch((error) => {
			setError("Error fetching user details in the profile settings page!");
			setdisAll([false,""]);
		})
	}

	const createDiagnosis = e => {
		e.preventDefault();
		if(!disableAll[0]) {
			setdisAll([true,"Laoding or Updating the info"]);
			updateDiagnosis();
		}
	}

	useEffect( () => {
		if (!loadUser) {
			setdisAll([true,"Laoding or Updating the info"]);
			loadUserInfo();
			loadTabsNLabs();
			loadApptInfo();
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
									<h4 class="card-title mb-0">Add Diagnosis</h4>
								</div>
								<div class="card-body">

									<div class="form-group">
										<label>Type of Diagnosis</label>
										<textarea type="text" class="form-control" onChange={e => AddDiagnosisType(e.target.value)} value={diagnosistype}/>

									</div>
									<div class="form-group">
										<h4 class="card-title mb-0">Add Prescription</h4>
									</div>

									<div class="add-more-item text-right" >
										<button type="button" class="btn btn-info btn-sm" onClick={() => addTabletRow()}>Add Item</button>
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
														tabSelected.map(tabS => (
															<tr>
																<td>
																	<select className="form-control" onChange={e => addTablet(tabS.rowid,"id",e.target.value)}>
																		<option value=''> Select one</option>
																		{
																			tabs.map(tab => (
																				<option
																					value={tab.id}> {tab.name}</option>
																			))
																		}
																	</select>
																</td>
																<td>
																	<input className="form-control" type="number" onChange={e => addTablet(tabS.rowid,"quantity",e.target.value)}/>
																</td>
																<td>
																	<input className="form-control" type="number" onChange={e => addTablet(tabS.rowid,"days",e.target.value)}/>
																</td>
																<td>
																	<div className="form-check form-check-inline">
																		<label className="form-check-label">
																			<input className="form-check-input"
																				   type="checkbox" value="true" onChange={e => addTablet(tabS.rowid,"morning",e.target.checked)}/> Morning
																		</label>
																	</div>
																	<div className="form-check form-check-inline">
																		<label className="form-check-label">
																			<input className="form-check-input"
																				   type="checkbox" onChange={e => addTablet(tabS.rowid,"afternoon",e.target.checked)}/> Afternoon
																		</label>
																	</div>
																	<div className="form-check form-check-inline">
																		<label className="form-check-label">
																			<input className="form-check-input"
																				   type="checkbox" onChange={e => addTablet(tabS.rowid,"evening",e.target.checked)}/> Evening
																		</label>
																	</div>
																	<div className="form-check form-check-inline">
																		<label className="form-check-label">
																			<input className="form-check-input"
																				   type="checkbox"  onChange={e => addTablet(tabS.rowid,"night",e.target.checked)}/> Night
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
										<h4 class="card-title mb-0">Add Lab Tests</h4>
									</div>

									<div class="add-more-item text-right">
									<button type="button" class="btn btn-info btn-sm" onClick={() => addLabTestRow()}>Add Test</button>
									</div>

									<div class="card card-table">
										<div class="card-body">
											<div class="table-responsive">
												<table class="table table-hover table-center">
													<thead>
													<tr>
														<th style={{minWidth:"100px"}}>Lab Test Name</th>
														<th style={{minWidth:"100px"}}></th>
													</tr>
													</thead>
													<tbody>
                                                        {
                                                    testSelected.map(labS => (
													<tr>
														<td>
															<select className="form-control"  onChange={e => addLabTest(labS.rowid,"lab_test",e.target.value)}>
																<option value=''> Select one</option>
																{
																	labs.map(lab => (
																		<option value={lab.id}> {lab.name}</option>
																	))
																}
															</select>
														</td>
													</tr>
                                                    ))
                                                            }
													</tbody>
												</table>
											</div>
										</div>
									</div>
                                                    

									<div class="row">
										<div class="col-md-12">
											<div class="submit-section">
												<button type="submit" class="btn btn-primary submit-btn" onClick={e => createDiagnosis(e)}>Submit</button>
												<button type="reset" class="btn btn-secondary submit-btn" onClick={e => ReloadScreen(e)} >Clear</button>
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

export default AddDiagnosis;