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

function AdminAddUser() {
    const {currentUser} = useAuthValue();
    const [patientLogo,setPatientLogo] = useState('')
    const [doctors,setDoctors] = useState([]);
    const [user,setUser] = useState({username:"Patient"});
    const [navState, setNavState] = useState(false);
    const [patientName,setPN] = useState('Patient');
    const [tab,setTab] = useState({'appointments':true,'prescriptions':false,'billing':false,'medical_records':false})
    const [loadUser,setLU] = useState(false);
    const [filter, setFilter] = useState({"ur":true,"neu":true,"den":true,"orth":true,"card":true , "male" : true,"female" : true});
    const history = useHistory();
    const [disableAll,setdisAll] = useState([true,"Loading page information!"]);
    const [error,setError] = useState('');
    const [newBox, setNewBox] = useState(false);
    const [buttonDisabled,setButtonDisabled] = useState(false);
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [phone, setPhone] = useState('')
    const [sex, setSex] = useState('')
    const [age, setAge] = useState('')
    const [name, setName] = useState('')
    const [address, setAddress] = useState('')
    const [category, setCategory] = useState('0')
    const [doctorcost, setDoctorCost] = useState('')
    const [additional_tags, setadditional_tags] = useState('')
    const [doctor_tag, setDoctorTag] = useState('')
    const [practise, setPractise] = useState('')
    const [specialization, setDoctorSpecialization] = useState('')
    const validatePassword = () => {
        let isValid = true
        if (password !== '' && confirmPassword !== ''){
            if (password !== confirmPassword) {
                isValid = false
                setError('Passwords does not match')
            }
        }
        return isValid
    }

    const register = e => {
        if(!disableAll[0]) {
            setdisAll([true,"Creating the user and profile"])
            e.preventDefault()
            setError('')
            const data = { email: email, name: name, age:age, sex: sex,phone : phone, address: address, password: password, category:category};
            if(category == "1") {
                data["doctor"] = {cost: doctorcost, additional_tags: additional_tags, practise: practise, specialization: specialization,doctor_tag: doctor_tag}
            }
            console.log(data);
            const inputValidation = httpsCallable(functions, 'createDoctor');
            inputValidation(data)
                .then((result) => {
                    console.log(result);
                    if(!result.data.success) {
                        const errorStr = result.data.data;
                        //setError('Invalid '  + errorStr + ' fields!!' );
                        console.log(result.data.data);
                        setdisAll([false,""])
                    } else {
                        console.log("Account Creation success")
                        setError("Account created");
                    }
                    setdisAll([false,""])
                }).catch((error) => {
                console.log(error);
                setdisAll([false,""])
            });
        }
    }


    useEffect( () => {
        async function loadUserInfo () {
            const getUser = httpsCallable(functions, 'getUserInfo');
            getUser()
                .then((result) => {
                    if(result.data.success && result.data.data.category == "9" ) {
                        setUser(result.data.data);
                        if(result.data.data.image) {
                            setPatientLogo(result.data.data.image);
                        } else if(result.data.data.sex == "male") {
                            setPatientLogo("https://firebasestorage.googleapis.com/v0/b/login-31221.appspot.com/o/images%2Fmale.png?alt=media&token=ab31fc18-4739-41ab-bd13-2c2703dec41e");
                        } else {
                            setPatientLogo("https://firebasestorage.googleapis.com/v0/b/login-31221.appspot.com/o/images%2Ffemale.png?alt=media&token=7308c8cd-bb9e-45a5-898a-f6aa6d6e9961");
                        }
                    } else {
                        logout();
                    }
                    setdisAll([false,""])
                }).catch((error) => {
                console.log("Error fetching user details in the profile settings page!");
                logout();
                setdisAll([false,""])
            })
        }
        if (!loadUser) {
            loadUserInfo();
            setLU(true);
        }
    });

    const triggerAdd = () => {
        //loadUsersTrigger();
        setNewBox(!newBox);
        setButtonDisabled(false);
    }

    const logout = () => {
        signOut(auth);
        history.push("/login");
    }

    const moveTo = (id) => {
        let url = "/patient-booking/".id;
        history.push(url);
    }
    const updateFilter = e => {
        console.log(filter);
    }

    const filterChange = (tag,value) => {
        let dummySpecs = {}
        for(const val in filter) {
            console.log(val,tag)
            dummySpecs[val] = filter[val];
            if(val == tag){
                dummySpecs[val] = !filter[val];
            }
        }
        setFilter(dummySpecs);
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
                                                <h6>{user.username}</h6>
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

            <div className="content">
                <div className="container-fluid">

                    <div className="row">
                            <div className="modal-dialog modal-dialog-centered modal-xl" role="document">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h5 className="modal-title">Add New User</h5>
                                        <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                            <span aria-hidden="true" onClick={() => setNewBox(!newBox)}>&times;</span>
                                        </button>
                                    </div>
                                    <div className="modal-body">
                                        <form onSubmit={register}>
                                            <div className="row form-row">
                                                <div className="col-8 col-sm-4">
                                                    <div className="form-group">
                                                        <input className="form-control" type="text" placeholder="Name"
                                                               onChange={e => setName(e.target.value)} required/>
                                                    </div>
                                                </div>
                                                <div className="col-8 col-sm-4">
                                                    <div className="form-group">
                                                        <input className="form-control" type="email" value={email}
                                                               placeholder="Email"
                                                               onChange={e => setEmail(e.target.value)} required/>
                                                    </div>
                                                </div>
                                                <div className="col-8 col-sm-4">
                                                    <div className="form-group">
                                                        <select className="form-control"
                                                                onChange={e => setSex(e.target.value)}>
                                                            <option value=''> Gender</option>
                                                            <option value='male'> Male</option>
                                                            <option value='female'> Female</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="col-8 col-sm-4">
                                                    <div className="form-group">
                                                        <input className="form-control" type="number" placeholder="Age"
                                                               required onChange={e => setAge(e.target.value)}/>
                                                    </div>
                                                </div>
                                                <div className="col-8 col-sm-4">
                                                    <div className="form-group">
                                                        <input className="form-control" type="text"
                                                               placeholder="Contact Number" value={phone}
                                                               onChange={e => setPhone(e.target.value)}/>
                                                    </div>
                                                </div>
                                                <div className="col-8 col-sm-4">
                                                    <div className="form-group">
                                                        <input className="form-control" type="text"
                                                               placeholder="Address" required
                                                               onChange={e => setAddress(e.target.value)}/>
                                                    </div>
                                                </div>
                                                <div className="col-8 col-sm-4">
                                                    <div className="form-group">
                                                        <select className="form-control"
                                                                required onChange={e => setCategory(e.target.value)}>
                                                            <option value=''> Category</option>
                                                            <option value='0'> Patient</option>
                                                            <option value='1'> Doctor</option>
                                                            <option value='2'> Hospital Staff</option>
                                                            <option value='3'> Lab staff</option>
                                                            <option value='4'> Insurance staff</option>
                                                            <option value='9'> Admin</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                {
                                                    category == '1' &&
                                                    <>
                                                    <div className="col-8 col-sm-4">
                                                        <div className="form-group">
                                                            <input className="form-control" type="number" value={doctorcost}
                                                                   placeholder="Consultation Fee"
                                                                   onChange={e => setDoctorCost(e.target.value)}/>
                                                        </div>
                                                    </div>
                                                    <div className="col-8 col-sm-4">
                                                        <div className="form-group">
                                                            <input className="form-control" type="text"
                                                                   value={additional_tags}
                                                                   placeholder="Professional Tags (Comma Seperated)"
                                                                   onChange={e => setadditional_tags(e.target.value)}/>
                                                        </div>
                                                    </div>
                                                    <div className="col-8 col-sm-4">
                                                        <div className="form-group">
                                                            <input className="form-control" type="text" value={practise}
                                                                   placeholder="Practice Location"
                                                                   onChange={e => setPractise(e.target.value)}/>
                                                        </div>
                                                    </div>
                                                    <div className="col-8 col-sm-4">
                                                        <div className="form-group">
                                                            <input className="form-control" type="text"
                                                                   value={specialization} placeholder="Specialization"
                                                                   onChange={e => setDoctorSpecialization(e.target.value)}/>
                                                        </div>
                                                    </div>
                                                    <div className="col-8 col-sm-4">
                                                        <div className="form-group">
                                                            <input className="form-control" type="text"
                                                                   value={doctor_tag} placeholder="Doctor Tag"
                                                                   onChange={e => setDoctorTag(e.target.value)}/>
                                                        </div>
                                                    </div>
                                                    </>
                                                }
                                            </div>

                                            <button type="submit" className="btn btn-primary btn-block"
                                                    disabled={buttonDisabled}>Submit Record
                                            </button>
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

export default AdminAddUser
