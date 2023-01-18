import './profile.css'
import * as React from 'react';
import PopupState, { bindTrigger, bindMenu } from 'material-ui-popup-state';
import {useAuthValue} from './AuthContext'
import { signOut } from 'firebase/auth'
import {auth, db, functions} from './firebase'
import { httpsCallable } from "firebase/functions"
import {useEffect, useState} from "react";
import {useHistory, useParams} from 'react-router-dom'
import './assets2/css/bootstrap.min.css'
import './assets2/plugins/fontawesome/css/fontawesome.min.css'
import "./assets2/css/bootstrap-datetimepicker.min.css"
import './assets2/plugins/fontawesome/css/all.min.css'
import './assets2/plugins/select2/css/select2.min.css'
import './assets2/css/style.css'

import Logo from './assets2/img/logo.png'
import { getStorage, ref, uploadBytesResumable,getDownloadURL } from "firebase/storage";

function AdminProfileUpdate() {
    const [user,setUser] = useState({});
    const {userID} = useParams();
    const [currentUser,setCurrentUser] = useState({});
    const [t,setT] = useState(0);
    const [dummyUser,setDummy] = useState({name:"patient"});
    const [navState, setNavState] = useState(false);
    const [patientName,setPN] = useState('Patient');
    const [tab,setTab] = useState({'appointments':true,'prescriptions':false,'billing':false,'medical_records':false});
    const [loadUser,setLU] = useState(false);
    const [patientLogo,setPatientLogo] = useState('');
    const [profileLogo,setprofileLogo] = useState('');
    const [disableAll,setdisAll] = useState([true,"Loading page information!"]);
    const [error,setError] = useState('');
    const [uploadImageURL,setImage] = useState('');
    const storage = getStorage();

    const logout = () => {
		signOut(auth);
		history.push("/login");
	}  
    const upload = (i) => {
        try {
            if(i != '') {
                const storageRef = ref(storage,"/profilePic/" + user.username);
                const task = uploadBytesResumable(storageRef,i);
                task.on(
                    (error) => {
                        console.log(error)
                        setError("Error Uploading the image!")
                    },
                    () => {
                        getDownloadURL(task.snapshot.ref).then((downloadURL) => {
                            console.log("File available at", downloadURL);
                            setImage(downloadURL,user.username);
                            setError("Uploaded the image!")
                        });
                    });
            }
        } catch(e) {
            console.log("error ",e);
        }
    }

    const updateField = (field,e) => {
        console.log(e.target.files);
        if(e == undefined) {
            return
        }
        e.preventDefault();
        upload(e.target.files[0]);
    }

    const updateForm = (target,value) => {
        console.log(target,value);
        let d = dummyUser;
        d[target] = value;
        console.log(d);
        setDummy(d);
        setT(t+1);
    }

    const updateProfile = e => {
        if(!disableAll[0]) {
            setdisAll([true,"Updating the user data"])
            e.preventDefault()
            let data = user;
            data["image"] = ""
            if (uploadImageURL != ''){
                data["image"] = uploadImageURL;
            } else if(user.image != null){
                data["image"] = user.image
            }
            if(user.bg == null) {
                setError("Please update the Blood group details")
                setdisAll([false,""])
                return
            }
            data["userId"]=userID;
            console.log(data);
            const profileUpdation = httpsCallable(functions, 'updateProfile');
            profileUpdation(data)
                .then((result) => {
                    if(result.data.success) {
                        setLU(false);
                        setError("Successfully updated your profile!");
                    } else {
                        setError(result.data.data)
                        console.log("Error updating the profile");
                    }
                    setdisAll([false,""])
                }).catch(error => {
                    console.error(error.message)
                setdisAll([false,""])
                setError("Error updating the profile, lookup the logs for more info!")
            });
        }
    }

    async function loadUpdateUserInfo () {
        const getUser = httpsCallable(functions, 'getUserInfo');
        getUser({uid:userID})
            .then((result) => {
                if(result.data.success) { 
                    setUser(result.data.data);
                    setDummy(result.data.data);
                    if(result.data.data.image) {
                        setprofileLogo(result.data.data.image);
                    } else if(result.data.data.sex == "male") {
                        setprofileLogo("https://firebasestorage.googleapis.com/v0/b/login-31221.appspot.com/o/images%2Fmale.png?alt=media&token=ab31fc18-4739-41ab-bd13-2c2703dec41e");
                    } else {
                        setprofileLogo("https://firebasestorage.googleapis.com/v0/b/login-31221.appspot.com/o/images%2Ffemale.png?alt=media&token=7308c8cd-bb9e-45a5-898a-f6aa6d6e9961");
                    }
                } else {
                    console.log("Hello world ");
                }
                setdisAll([false,""])
            }).catch((error) => {
            console.log("Error fetching user details in the profile settings page!");
            setdisAll([false,""])
            setError("Error fetching user details !")
        })
    }

    const history = useHistory(); 
    useEffect( () => {
        async function loadUserInfo () {
            const getUser = httpsCallable(functions, 'getUserInfo');
            getUser()
                .then((result) => {
                    if(result.data.success && result.data.data.category == "9") {
                        setCurrentUser(result.data.data);
                        if(result.data.data.image) {
                            setPatientLogo(result.data.data.image);
                        } else if(result.data.data.sex == "male") {
                            setPatientLogo("https://firebasestorage.googleapis.com/v0/b/login-31221.appspot.com/o/images%2Fmale.png?alt=media&token=ab31fc18-4739-41ab-bd13-2c2703dec41e");
                        } else {
                            setPatientLogo("https://firebasestorage.googleapis.com/v0/b/login-31221.appspot.com/o/images%2Ffemale.png?alt=media&token=7308c8cd-bb9e-45a5-898a-f6aa6d6e9961");
                        }
                        console.log(result.data.data);
                        loadUpdateUserInfo();
                        setLU(true);
                    }
                }).catch((error) => {
                console.log("Error fetching user details in the profile settings page!");
            })
        }
        if (!loadUser) {
            loadUserInfo();
            setLU(true);
        }
    });

    const toggleTab = (e) => {
        const tabState = {}
        for (const property in tab) {
            console.log(tab,property);
            if(property == e) {
                tabState[property] = true
            } else {
                tabState[property] = false
            }
        }
        setTab(tabState);
        console.log(tab,tabState);
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
                                        <img className="rounded-circle" src={patientLogo} width="31" alt={currentUser.username} />
                                    </span>
                                    </a>
                                    <div className="dropdown-menu dropdown-menu-right show">
                                        <div className="user-header">
                                            <div className="avatar avatar-sm">
                                                <img src={patientLogo} alt="User Image" className="avatar-img rounded-circle" />
                                            </div>
                                            <div className="user-text">
                                                <h6>{currentUser.username}</h6>
                                            </div>
                                        </div>
                                        <a className="dropdown-item" onClick={() => history.push('/')}>Dashboard</a>
                                        <a className="dropdown-item" onClick={()=> history.push('/profile')}>Profile Settings</a>
                                        <a className="dropdown-item" onClick={() => logout()}>Logout</a>
                                    </div>
                            </li>
                                : <li className="nav-item dropdown has-arrow logged-item">
                                    <a className="dropdown-toggle nav-link" data-toggle="dropdown" onClick={() => setNavState(!navState)}>
                                    <span className="user-img">
                                        <img className="rounded-circle" src={patientLogo} width="31" alt={currentUser.username} />
                                    </span>
                                    </a>
                                    <div className="dropdown-menu dropdown-menu-right">
                                        <div className="user-header">
                                            <div className="avatar avatar-sm">
                                                <img src={patientLogo} alt="User Image" className="avatar-img rounded-circle" />
                                            </div>
                                            <div className="user-text">
                                                <h6>{currentUser.username}</h6>
                                            </div>
                                        </div>
                                        <a className="dropdown-item" onClick={() => history.push('/')}>Dashboard</a>
                                        <a className="dropdown-item" onClick={()=> history.push('/profile')}>Profile Settings</a>
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

            <div className="content">
                <div className="container-fluid">

                    <div className="row">

                        <div className="col-md-5 col-lg-4 col-xl-3 theiaStickySidebar">
                            <div className="profile-sidebar">
                                <div className="widget-profile pro-widget-content">
                                    <div className="profile-info-widget">
                                        <a className="booking-doc-img">
                                            <img src={patientLogo} alt="User Image" />
                                        </a>
                                        <div className="profile-det-info">
                                            <h3>{currentUser.username}</h3>
                                            <div className="patient-details">
                                                <h5><i className="fas fa-birthday-cake"></i>{user.age} years</h5>
                                                <h5 className="mb-0"><i className="fas fa-map-marker-alt"></i>{currentUser.address}</h5>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="dashboard-widget">
                                    <nav className="dashboard-menu">
                                        <ul>
                                            <li>
                                                <a onClick={()=>history.push('/')}>
                                                    <i className="fas fa-columns"></i>
                                                    <span>Dashboard</span>
                                                </a>
                                            </li>
                                            <li>
                                                <a onClick={()=> history.push('/profile')}>
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
                                <div className="card-body">
                                    <form onSubmit={updateProfile}>
                                        <div className="row form-row">
                                            <div className="col-12 col-md-12">
                                                <div className="form-group">
                                                    <div className="change-avatar">
                                                        <div className="profile-img">
                                                            {
                                                                uploadImageURL
                                                                ? <img src={uploadImageURL} alt="User Image" />
                                                                    : <img src={profileLogo} alt="User Image" />
                                                            }
                                                        </div>
                                                        <div className="upload-img">
                                                            <div className="change-photo-btn">
                                                                <span><i
                                                                    className="fa fa-upload"></i> Upload Photo</span>
                                                                <input type="file" className="upload"  onChange={e => updateField("image",e)} />
                                                            </div>
                                                            {
                                                                !uploadImageURL &&
                                                                <small className="form-text text-muted">Allowed JPG, GIF or
                                                                        PNG. Max size of 2MB</small>
                                                            }

                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-12 col-md-6">
                                                <div className="form-group">
                                                    <label>Name</label>
                                                    <input type="text" className="form-control"  value={dummyUser.username} onChange={e=>updateForm("username",e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="col-12 col-md-6">
                                                <div className="form-group">
                                                    <label>Age</label>
                                                    <input type="text" required className="form-control"  value={dummyUser.age} onChange={e=>updateForm("age",e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="col-12 col-md-6">
                                                <div className="form-group">
                                                    <label>Blood Group</label>
                                                    <select className="form-control select" required value={user.bg} onChange={e => updateForm('bg',e.target.value)} >
                                                        <option>Select One</option>
                                                        <option>A-</option>
                                                        <option>A+</option>
                                                        <option>B-</option>
                                                        <option>B+</option>
                                                        <option>AB-</option>
                                                        <option>AB+</option>
                                                        <option>O-</option>
                                                        <option>O+</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-12 col-md-6">
                                                <div className="form-group">
                                                    <label>Email ID</label>
                                                    <input type="email" className="form-control" disabled
                                                           value={user.email} />
                                                </div>
                                            </div>
                                            <div className="col-12 col-md-6">
                                                <div className="form-group">
                                                    <label>Mobile</label>
                                                    <input type="text" value={user.phone} className="form-control" onChange={e => updateForm('phone',e.target.value)} />
                                                </div>
                                            </div>
                                            
                                            <div className="col-12">
                                                <div className="form-group">
                                                    <label>Address</label>
                                                    <input type="text" className="form-control" value={user.address}  onChange={e => updateForm('address',e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="col-12 col-md-6">
                                                <div className="form-group">
                                                    <label>Insurance Id</label>
                                                    <input type="text" className="form-control" required value={user.insurance_id}  onChange={e => updateForm('insurance_id',e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="col-12 col-md-6">
                                                <div className="form-group">
                                                    <label>Insurance Provider</label>
                                                    <input type="text" className="form-control" value={user.insurance_provider} required onChange={e => updateForm('insurance_provider',e.target.value)} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="submit-section">
                                            <button type="submit" className="btn btn-primary submit-btn">Submit Changes
                                            </button>
                                        </div>
                                    </form>

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

export default AdminProfileUpdate
