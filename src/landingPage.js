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
import patientLogo from './assets2/img/patients/patient.jpg'

function LandingPage() {
    const {currentUser} = useAuthValue();
    const [loadUser,setLU] = useState(false);
    const [disableAll,setdisAll] = useState([true,"Loading page information!"]);
    const [error,setError] = useState('');


    const logout = () => {
        signOut(auth);
        history.push("/login");
    }
    const history = useHistory();
    useEffect( () => {
        async function loadUserInfo () {
            const getUser = httpsCallable(functions, 'getUserInfo');
            getUser()
                .then((result) => {
                    if(result.data.success) {
                        switch(result.data.data.category) {
                            case "0":
                                history.push("/dashboard");
                                break;
                            case "1":
                                history.push("/doctorDashboard");
                                break;
                            case "2":
                                history.push("/HSD")
                                break;
                            case "3":
                                history.push("/labStaffDB");
                                break;
                            case "4":
                                history.push("/InsurancerDashboard");
                                break;
                            case "9":
                                history.push("/AdminDashboard");
                                break;
                            default :
                                logout()
                                history.push("/login");
                        }
                    }
                }).catch((error) => {
                console.log("Error fetching user details in the profile settings page!");
                history.push("/register");
            })
        }
        if (!loadUser) {
            loadUserInfo();
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
                        <a onClick={() => history.push('/')} className="navbar-brand logo">
                            <img src={Logo} className="img-fluid" alt="Logo" />
                        </a>
                    </div>
                </nav>
            </header>

        </div>
    )
}

export default LandingPage
