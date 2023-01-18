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



function DoctorScheduleHS(){
    const history = useHistory();
    const {currentUser} = useAuthValue();    
    const [temp,setState] = useState(1);
    const [userLogo,setUserLogo] = useState('');
    const [user,setUser] = useState({name:"patient"});
    const [loadUser,setLU] = useState(false);
    const [diagnosistype, AddDiagnosisType] = useState('');
    const [navState, setNavState] = useState(false);
    const [patientName,setPN] = useState('Patient');
    const [disableAll,setdisAll] = useState([true,"Loading init data"]);
    const [error,setError] = useState('');
    const [appt,setAppt] = useState({patient:{address:""}});
    const [doctors,setDoctors] = useState([]);
    const [labs,setLabs] = useState([])
    const [tabs,settabs] = useState([])
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

    async function loadDoctorsAvailability (doctor) {
        const getAvailability = httpsCallable(functions, 'getDoctorsAvailability');
        getAvailability({doctor_id:doctor})
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
                    setdisAll([false,""]);
                }
            }).catch(error => console.log(error))
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
            day["availability"] = true;
            days7.push(day);
        }
        return days7;
    }


    const loadDoctor = (doctor) => {
        if(!setdisAll[0]) {
            loadDoctorsAvailability(doctor);
        }
    }

    const setDoctorAvailability = (e) => {
        e.preventDefault();
    }

    async function loadUserInfo () {
        const getUser = httpsCallable(functions, 'getUserInfo');
        getUser()
            .then((result) => {
                if(result.data.success && result.data.data.category == "2") {
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
                setdisAll([false,""])
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

    async function loadDoctorsInfo () {
        const getUsers = httpsCallable(functions, 'getDoctorDetails');
        getUsers({})
            .then((result) => {
                if(result.data.success) {
                    setDoctors(result.data.data);
                    loadDoctorsAvailability(result.data.data[0].id);
                } else {
                    setError(result.data.data);
                    setdisAll([false,""]);
                }

            }).catch((error) => {
            console.log("Error fetching doctors details in the search doctor page!");
        })
    }

    useEffect( () => {
        if(!loadUser) {
            loadDoctorsInfo();
            loadUserInfo();
            setLU(true);
        }
    });

    return (
        <body>

        <div class="main-wrapper">

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

            <header class="header">
                <nav class="navbar navbar-expand-lg header-nav">
                    <div class="navbar-header">
                        <a id="mobile_btn" >
							<span class="bar-icon">
								<span></span>
								<span></span>
								<span></span>
							</span>
                        </a>
                        <a class="navbar-brand logo">
                            <img src={Logo} class="img-fluid" alt="Logo"/>
                        </a>
                    </div>
                    <div class="main-menu-wrapper">
                        <div class="menu-header">
                            <a class="menu-logo">
                                <img src="assets/img/logo.png" class="img-fluid" alt="Logo"/>
                            </a>
                            <a id="menu_close" class="menu-close" >
                                <i class="fas fa-times"></i>
                            </a>
                        </div>
                        <ul class="main-nav">
                            <li>
                                <a onClick={()=>history.push('/')}>Home</a>
                            </li>
                        </ul>
                    </div>
                    <ul class="nav header-navbar-rht">
                        <li class="nav-item contact-item">
                            <div class="header-contact-img">
                                <i class="far fa-hospital"></i>
                            </div>
                            <div class="header-contact-detail">
                                <p class="contact-header">Contact</p>
                                <p class="contact-info-header"> +1 315 369 5943</p>
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
                                        <img className="rounded-circle" src={userLogo} width="31" alt={user.username}/>
                                    </span>
                                    </a>
                                    <div className="dropdown-menu dropdown-menu-right">
                                        <div className="user-header">
                                            <div className="avatar avatar-sm">
                                                <img src={userLogo} alt="User Image" className="avatar-img rounded-circle" />
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

            <div class="breadcrumb-bar">
                <div class="container-fluid">
                    <div class="row align-items-center">
                        <div class="col-md-12 col-12">
                            <nav aria-label="breadcrumb" class="page-breadcrumb">
                                <ol class="breadcrumb">
                                    <li class="breadcrumb-item"><a onClick={()=>history.push('/')}>Home</a></li>
                                    <li class="breadcrumb-item active" aria-current="page">Schedule Timings</li>
                                </ol>
                            </nav>
                            <h2 class="breadcrumb-title">Schedule Timings</h2>
                        </div>
                    </div>
                </div>
            </div>

            <div class="content">
                <div class="container-fluid">

                    <div className="row">
                        <div className="col-md-5 col-lg-4 col-xl-3 theiaStickySidebar">

                        <div className="profile-sidebar">
                            <div className="widget-profile pro-widget-content">
                                <div className="profile-info-widget">
                                    <a className="booking-doc-img">
                                        <img src={userLogo} alt={user.username}/>
                                    </a>
                                    <div className="profile-det-info">
                                    <h3>{user.username}</h3>
                                            <div className="patient-details">
                                                <h5>Hospital Staff Member</h5>
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
                                            <a onClick={()=>history.push('/profile')}>
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

                                                                <select className="form-control" onChange={e => loadDoctor(e.target.value)}>
                                                                    <option value=''>Select a doctor</option>
                                                                    {
                                                                        doctors.map(doctor => (
                                                                            <option value={doctor.id}>Dr. {doctor.username}</option>
                                                                        ))
                                                                    }
                                                                </select>
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
                                                                                        <div className="custom-checkbox"><input type="checkbox" id="availability" checked={!date.availability}  /> <a className="edit-link" data-toggle="modal">Not Available</a></div>
                                                                                    </h4>

                                                                                    <div className="doc-times">
                                                                                        {
                                                                                            Object.keys(date.slot).map((key, index) => (
                                                                                                <div className={buttonChange[date.slot[key]].class1}>
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
                                                                                className="btn btn-primary submit-btn">Save Changes
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
        </body>
    )
}
export default DoctorScheduleHS;