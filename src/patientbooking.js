import './profile.css'
import * as React from 'react';
import PopupState, { bindTrigger, bindMenu } from 'material-ui-popup-state';
import {useAuthValue} from './AuthContext'
import { signOut } from 'firebase/auth'
import {auth, db, functions} from './firebase'
import { httpsCallable } from "firebase/functions"
import {useEffect, useState} from "react";
import {Link, useParams} from 'react-router-dom'
import {useHistory} from 'react-router-dom'
import './assets2/css/bootstrap.min.css'
import './assets2/plugins/fontawesome/css/fontawesome.min.css'
import './assets2/plugins/fontawesome/css/all.min.css'
import './assets2/css/style.css'

import Logo from './assets2/img/logo.png'
import patientLogo from './assets2/img/patients/patient.png'

function PatientBooking() {
    const {currentUser} = useAuthValue();
    const [user,setUser] = useState({name:"patient"});
    const [doctor,setDoctor] = useState({name:"doctor"});
    const [navState, setNavState] = useState(false);
    const [patientName,setPN] = useState('Patient');
    const [tab,setTab] = useState({'appointments':true,'prescriptions':false,'billing':false,'medical_records':false})
    const [loadUser,setLU] = useState(false);
    const {doctorid} = useParams();
    const history = useHistory();
    const [datesNavbl,setdatesAvbl] = useState([]);
    const [date, setDate] = useState('');
    const [slot, setSlot] = useState('');
    const weekday = ["SUN","MON","TUE","WED","THUR","FRI","SAT"];
    const month = ["JAN","FEB","MAR","APR","MAY","JUNE","JULY","AUG","SEP","OCT","NOV","DEC"];
    const [dates,setDates] = useState([]);
    const buttonChange =  {true:"timing available",false:"timing disabled","selected":"timing available selected"};
    const [currentSelect,setCurr] = useState('');
    const [disabledButton,setDisabledButton] = useState(false);
    const [type,setDiagnosis] = useState('');
    const [problem,setProblem] = useState('');
    const [disableAll,setdisAll] = useState([true,"Loading page information!"]);
    const [error,setError] = useState('');

    async function loadDoctorsInfo () {
        const getUsers = httpsCallable(functions, 'getDoctorDetails');
        getUsers({doctor_id:doctorid})
            .then((result) => {
                if(result.data.success) {
                    setDoctor(result.data.data[0]);
                }
            }).catch((error) => {
            console.log("Error fetching doctors details in the search doctor page!");
        })
    }

    async function loadDoctorsAvailability () {
        const getAvailability = httpsCallable(functions, 'getDoctorsAvailability');
        getAvailability({doctor_id:doctorid})
            .then((result) => {
                if(result.data.success) {
                    let datesAvlbInfo = result.data.data;
                    let dummyData = getnext7days();
                    for(let i in dummyData) {
                        if(datesAvlbInfo.hasOwnProperty(dummyData[i].date)) {
                            let dateSlots = datesAvlbInfo[dummyData[i].date].slots;
                            if(datesAvlbInfo[dummyData[i].date].availability == false) {
                                dummyData[i].slot = {"1":false,"2":false,"3":false,"4":false,"5":false};
                                continue;
                            }
                            for(var x in dateSlots) {
                                dummyData[i]["slot"][dateSlots[x]] = false;
                            }
                        } else {
                            dummyData[i].slot = {"1":true,"2":true,"3":true,"4":true,"5":true};
                        }
                    }
                    setDates(dummyData);
                    setdisAll([false,""])
                }
                setdisAll([false,""])
        }).catch(error => {
            console.log(error)
            setdisAll([false,""])
        })
    }

    const getnext7days = () => {
        let timeElapsed = Date.now();
        let today = new Date(timeElapsed);
        const days7 = []
        for (let i = 0; i < 7; i++) {
            let day = {};
            day["date"] = today.toLocaleDateString().replaceAll("/","-");
            day["day"] = weekday[today.getDay()];
            day["d"] = today.getDate();
            day["m"] = month[today.getMonth()];
            day["y"] = today.getFullYear();
            today.setDate(today.getDate() + 1);
            day["slot"] = {"1":true,"2":true,"3":true,"4":true,"5":true};
            days7.push(day);
        }
        return days7;
    }
    useEffect( () => {
        async function loadUserInfo () {
            const getUser = httpsCallable(functions, 'getUserInfo');
            getUser()
                .then((result) => {
                    if(result.data.success && result.data.data.category == "0") {
                        setUser(result.data.data);
                        setLU(true);
                        if(result.data.data.category != "0") {
                            logout();
                        }
                    } else {
                        logout()
                    }
                }).catch((error) => {
                console.log("Error fetching user details in the profile settings page!");
                logout();
            })
        }
        if (!loadUser) {
            loadUserInfo();
            loadDoctorsInfo();
            loadDoctorsAvailability();
            setLU(true);
        }
    });

    const logout = () => {
		signOut(auth);
		history.push("/login");
	}

    const updateCurrenSelect = (d,s) => {
        let dummyData = dates;
        for (let i in dummyData) {
            if (dummyData[i].date == d) {
                if(!dummyData[i]["slot"][s]) {
                    return;
                }
                dummyData[i]["slot"][s] = "selected";
                if (currentSelect == '') {
                    setCurr({date: d, slot: s});
                } else {
                    let prevSelection = currentSelect;
                    for (let i in dummyData) {
                        if (dummyData[i].date == prevSelection.date) {
                            dummyData[i]["slot"][prevSelection.slot] = true;
                            if(prevSelection == {date: d, slot: s}) {
                                setCurr('');
                            } else {
                                setCurr({date: d, slot: s});
                            }
                            break;
                        }
                    }
                }
                break;
            }
        }
    }

    async function makeApptRequst () {
        if(!disableAll[0]) {
            setdisAll([true,"Creating an appointmment"])
            const makeAppt = httpsCallable(functions, 'setAppointmentRequest');
            let data = {"doctor_id":doctorid,date:currentSelect.date,slot:currentSelect.slot,type:type,problem:problem,"doctor_name":doctor.username};
            makeAppt(data)
                .then((result) => {
                    if(result.data.success) {
                        history.push("/dashboard");
                    } else {

                    }
                    setDisabledButton(false);
                    setdisAll([false,""])

                }).catch((error) => {
                console.log("Error fetching doctors details in the search doctor page!");
                setDisabledButton(false);
                setdisAll([false,""])
            })
        }
    }

    const submitAppointment = () => {
        let selection = currentSelect;
        let dummyData = dates;
        if(disabledButton) {
            return;
        }
        for (let i in dummyData) {
            if (dummyData[i].date == selection.date) {
                if (dummyData[i]["slot"][selection.slot] == "selected") {
                    setDisabledButton(true);
                    makeApptRequst();
                }
            }
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
                                                <h6>{user.username}</h6>
                                                <p className="text-muted mb-0">Patient</p>
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

            <div class="content">
				<div class="container">
				
					<div class="row">
						<div class="col-12">
						
							<div class="card">
								<div class="card-body">
									<div class="booking-doc-info">
										<div class="booking-info">
											<h4>Dr. {doctor.username}</h4>
											<p class="text-muted mb-0"><i class="fas fa-map-marker-alt"></i> {doctor.practise}</p>
										</div>
									</div>
								</div>
							</div>
							
							
							<div class="card booking-schedule schedule-widget">
								<div class="schedule-header">
									<div class="row">
										<div class="col-md-12">
											<div class="day-slot">
												<ul>
                                                    {dates.map(date => (
                                                        <li>
                                                            <span>{date.day}</span>
                                                            <span className="slot-date">{date.d} {date.m} <small
                                                                className="slot-year">{date.y} </small></span>
                                                        </li>
                                                    ))}
												</ul>
											</div>
										</div>
									</div>
								</div>
								<div class="schedule-cont">
									<div class="row">
										<div class="col-md-12">
											<div class="time-slot">
												<ul class="clearfix">
                                                    {dates.map(date => (
                                                        <li>
                                                            <a className={buttonChange[date.slot["1"]]} disabled={!date.slot[1]} onClick={() => updateCurrenSelect(date.date,1)} >
                                                                <span>9:00</span> <span>AM</span>
                                                            </a>
                                                            <a className={buttonChange[date.slot["2"]]} disabled={!date.slot[2]} onClick={() => updateCurrenSelect(date.date,2)} >
                                                                <span>11:00</span> <span>AM</span>
                                                            </a>
                                                            <a className={buttonChange[date.slot["3"]]} disabled={!date.slot[3]} onClick={() => updateCurrenSelect(date.date,3)}>
                                                                <span>1:00</span> <span>PM</span>
                                                            </a>
                                                            <a className={buttonChange[date.slot["4"]]} disabled={!date.slot[4]} onClick={() => updateCurrenSelect(date.date,4)}>
                                                                <span>3:00</span> <span>PM</span>
                                                            </a>
                                                            <a className={buttonChange[date.slot["5"]]} disabled={!date.slot[5]} onClick={() => updateCurrenSelect(date.date,5)}>
                                                                <span>5:00</span> <span>PM</span>
                                                            </a>
                                                        </li>
                                                    ))}
												</ul>
											</div>
										</div>
									</div>
								</div>
                                <div className="schedule-cont">
                                    <div class="row">
                                        <div className="col-md-12">
                                            <div className="day-slot">
                                                <div className="form-group">
                                                    <input className="form-control" type="text" placeholder="Diagnosis"
                                                           onChange={e => setDiagnosis(e.target.value)}/>
                                                </div>
                                                <div className="form-group">
                                                    <input className="form-control" type="text"
                                                           placeholder="Problem"
                                                           onChange={e => setProblem(e.target.value)}/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
							</div>
							<div class="submit-section proceed-btn text-right">
								<a class="btn btn-primary submit-btn" onClick={() => submitAppointment()}>Request an Appointment</a>
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

export default PatientBooking
