import './profile.css'
import * as React from 'react';
import {Avatar, Button, Grid, Table, TableBody, TableCell, TableContainer,TableHead, TableRow,Paper } from '@material-ui/core';
import PopupState, { bindTrigger, bindMenu } from 'material-ui-popup-state';
import SecurityIcon from '@material-ui/icons/SecurityOutlined'
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

import Logo1 from './assets/img/logo-white.png'
import Logo from './assets2/img/logo.png'
import patientLogo from './assets2/img/patients/patient.jpg'
import { render } from '@testing-library/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {collection, query, where, doc, getDocs, addDoc, setDoc, getDoc} from "firebase/firestore";


function GenerateReport() {

	const history = useHistory();
	const { currentUser } = useAuthValue();
	const {appointmentId} = useParams()
	const [tabs,settabs] = useState([])
	const [labs,setLabs] = useState([])
	const [labCost,setlabCost] = useState({})
	const [user,setUser] = useState({name:"patient"});
	const [disableAll,setdisAll] = useState([true,"Loading page information!"]);
	const [error,setError] = useState('');
	const [totalCost,setTotalCost] = useState(0);
	const [totalLabCost,setTotalLabCost] = useState(0);
	const [totalPresCost,setTotalPrescCost] = useState(0);
	const [totalApptCost,setTotalApptCost] = useState(0);
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
		const input = document.getElementById('generateReport');
		window.print(input);
	}
	const logout = () => {
		signOut(auth);
		history.push("/login");
	}


	async function loadUserInfo () {
		const getUser = httpsCallable(functions, 'getUserInfo');
		getUser()
			.then((result) => {
				if(result.data.success && (result.data.data.category == "2" || result.data.data.category == "9" )) {
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

	async function generateReport () {
		const report = httpsCallable(functions, 'generateReport');
		report({appointmentId:appointmentId})
			.then((result) => {
				if(result.data.success) {
					var cost_data = result.data.data;
					setTotalCost(cost_data.Cost);
					setTotalPrescCost(cost_data.prescription_cost);
					setTotalLabCost(cost_data.lab_cost);
					setTotalApptCost(cost_data.appointment_cost);
				} else {
					console.log(result);
				}

			}).catch((error) => {
			console.log("Error fetching user details in the profile settings page!");
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
							}
						}).catch((error) => {
						console.log("Error fetching doctors details in the search doctor page!");
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
			generateReport();
			// sendEmail();
			setLU(true);
		}
	});
	return (

		<div class="content" id="generateReport">
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
			<div class="container-fluid">
				<div class="row">
					<div class="col-lg-8 offset-lg-2">
						<div class="invoice-content">
							<div class="invoice-item">
								<div class="row">
									<div class="col-md-6">
										<div class="invoice-logo">
											<img src={Logo} alt="logo" />
										</div>
									</div>
									<div class="col-md-6">
										<p class="invoice-details">
											<strong>Order ID:</strong><span>{appt.id}</span>

										</p>
									</div>
								</div>
							</div>

							<div class="invoice-item">
								<div class="row">
									<div class="col-md-6">
										<div class="invoice-info">
											<strong class="customer-text">Invoice From</strong>
											<p class="invoice-details invoice-details-two">
												Health Infinitum <br />
												Arizona State University, Tempe,<br />
												Arizona, USA <br />
											</p>
										</div>
									</div>
									<div class="col-md-6">
										<div class="invoice-info invoice-info2">
											<strong class="customer-text">Invoice To</strong>
											<p class="invoice-details">
												{user.username}<br/>
												{user.email} <br />
												{user.address} <br />
											</p>
										</div>
									</div>
								</div>
							</div>

							<div class="invoice-item">
								<div class="row">
									<div class="col-md-12">
										<div class="invoice-info">

										</div>
									</div>
								</div>
							</div>

							<div class="card card-table">
								<div class="card-body">
									<div class="table-responsive">
										<table class="table table-hover table-center">
											<thead>
											<tr>
												<th style={{minWidth:"50px"}}>Name</th>
												<th style={{minWidth:"50px"}}>Quantity</th>
												<th style={{minWidth:"50px"}}>Days</th>
												<th style={{minWidth:"50px"}}>Each Tablet Cost (in $)</th>
												<th style={{minWidth:"50px"}}>Total Tablet Cost (in $)</th>
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
															{tabs[key].id != null && existingTabs[tabs[key].id].cost}
														</td>
														<td>
															{tabs[key].id != null && existingTabs[tabs[key].id].cost*tabs[key].quantity}
														</td>

													</tr>

												))
											}
											<tr>
												<th style={{minWidth:"50px"}}>Final Total for tablets (in $)</th>
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

							<div class="card card-table">
								<div class="card-body">
									<div class="table-responsive">
										<table class="table table-hover table-center">
											<thead>
											<tr>
												<th style={{minWidth:"50px"}}>Name</th>
												<th style={{minWidth:"50px"}}>Specialization</th>
												<th style={{minWidth:"50px"}}>Cost</th>

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
												<th style={{minWidth:"50px"}}>Final Total for Appointment (in $)</th>
												<td></td>
												<td>{totalApptCost}</td>
											</tr>
											</tbody>
										</table>
									</div>
								</div>
							</div>

							<div class="card card-table">
								<div class="card-body">
									<div class="table-responsive">
										<table class="table table-hover table-center">
											<thead>
											<tr>
												<th style={{minWidth:"50px"}}>Name</th>
												<th style={{minWidth:"50px"}}>Cost</th>
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
															{existingLabs[labs[key].id].cost }
														</td>

													</tr>

												))
											}
											<tr>
												<th style={{minWidth:"50px"}}>Final Total for Lab tests (in $)</th>
												<td>{totalLabCost}</td>
											</tr>
											</tbody>
										</table>
									</div>
								</div>
							</div>
							<br />
							<br />
							<br />
							<button className="btn btn-primary btn-block" type="submit" onClick={()=> printDocument()}>Download Invoice</button>
						</div>
					</div>
				</div>

			</div>

		</div>
	)
}

export default GenerateReport;