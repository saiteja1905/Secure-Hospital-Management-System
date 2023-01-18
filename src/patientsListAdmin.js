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

function PatientsListAdmin() {
    const logout = () => {
		signOut(auth);
		history.push("/login");
	}
    const history = useHistory();
    const [user,setUser] = useState({name:"patient"});

    useEffect( () => {
        if (user.name === 'patient') {
            const getUser = httpsCallable(functions, 'getUserInfo');
            getUser()
                .then((result) => {
                    if(result.data.success) {
                        setUser(result.data.data);
                    }
                })
        }
    });


    return(
        
        <div className="main-wrapper">
        <div className="header">

            <div className="header-left">
                <a href="index.html" className="logo">
                    <img src={Logo} alt="Logo" />
                </a>
                <a href="index.html" className="logo logo-small">
                    <img src="assets/img/logo-small.png" alt="Logo" width="30" height="30" />
                </a>
            </div>

            <a  id="toggle_btn">
                <i className="fe fe-text-align-left"></i>
            </a>

            <div className="top-nav-search">
                <form>
                    <input type="text" className="form-control" placeholder="Search here" />
                    <button className="btn" type="submit"><i className="fa fa-search"></i></button>
                </form>
            </div>

            <a className="mobile_btn" id="mobile_btn">
                <i className="fa fa-bars"></i>
            </a>

            <ul className="nav user-menu">

                <li className="nav-item dropdown noti-dropdown">
                    <a className="dropdown-toggle nav-link" data-toggle="dropdown">
                        <i className="fe fe-bell"></i> <span className="badge badge-pill">3</span>
                    </a>
                </li>

                <li className="nav-item dropdown has-arrow">
                    <a className="dropdown-toggle nav-link" data-toggle="dropdown">
                            <span className="user-img"><img className="rounded-circle"
                                                            src="assets/img/profiles/avatar-01.jpg" width="31"
                                                            alt={user.username} /></span>
                    </a>
                    <div className="dropdown-menu">
                        <div className="user-header">
                            <div className="avatar avatar-sm">
                                <img src="assets/img/profiles/avatar-01.jpg" alt="User Image"
                                     className="avatar-img rounded-circle" />
                            </div>
                            <div className="user-text">
                                <h6>Ryan Taylor</h6>
                                <p className="text-muted mb-0">Administrator</p>
                            </div>
                        </div>
                        <a className="dropdown-item" href="profile.html">My Profile</a>
                        <a className="dropdown-item" href="settings.html">Settings</a>
                        <a className="dropdown-item" onClick={()=>logout()}>Logout</a>
                    </div>
                </li>

            </ul>

        </div>
        <div className="sidebar" id="sidebar">
            <div className="sidebar-inner slimscroll">
                <div id="sidebar-menu" className="sidebar-menu">
                    <ul>
                        <li className="menu-title">
                            <span>Main</span>
                        </li>
                        <li className="active">
                            <a href="index.html"><i className="fe fe-home"></i> <span>Dashboard</span></a>
                        </li>
                        <li >
                            <a onClick={() => history.push('/adminAppts')}><i className="fe fe-layout"></i>
                                <span>Appointments</span></a>
                        </li>
                        <li>
                            <a href="" onClick={() => history.push('/adminSpecs')}><i className="fe fe-users"></i>
                                <span>Specialities</span></a>
                        </li>
                        <li>
                            <a href="" onClick={() => history.push('/adminDoctors')}><i className="fe fe-user-plus"></i> <span>Doctors</span></a>
                        </li>
                        <li>
                            <a href="patient-list.html"><i className="fe fe-user"></i> <span>Patients</span></a>
                        </li>
                        <li>
                            <a href="reviews.html"><i className="fe fe-star-o"></i> <span>Reviews</span></a>
                        </li>
                        <li>
                            <a href="transactions-list.html"><i className="fe fe-activity"></i>
                                <span>Transactions</span></a>
                        </li>
                        <li>
                            <a href="settings.html"><i className="fe fe-vector"></i> <span>Settings</span></a>
                        </li>
                        <li className="submenu">
                            <a ><i className="fe fe-document"></i> <span> Reports</span> <span
                                className="menu-arrow"></span></a>
                            <ul className="show">
                                <li><a href="invoice-report.html">Invoice Reports</a></li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
        <div class="page-wrapper">
                <div class="content container-fluid">
				
					<div class="page-header">
						<div class="row">
							<div class="col-sm-12">
								<h3 class="page-title">List of Patient</h3>
								<ul class="breadcrumb">
									<li class="breadcrumb-item"><a href="index.html">Dashboard</a></li>
									<li class="breadcrumb-item"><a href="javascript:(0);">Users</a></li>
									<li class="breadcrumb-item active">Patient</li>
								</ul>
							</div>
						</div>
					</div>
					
					<div class="row">
						<div class="col-sm-12">
							<div class="card">
								<div class="card-body">
									<div class="table-responsive">
										<div class="table-responsive">
										<table class="datatable table table-hover table-center mb-0">
											<thead>
												<tr>
													<th>Patient ID</th>
													<th>Patient Name</th>
													<th>Age</th>
													<th>Address</th>
													<th>Phone</th>
													<th>Last Visit</th>
													<th class="text-right">Paid</th>
												</tr>
											</thead>
											<tbody>
												<tr>
													<td>#PT001</td>
													<td>
														<h2 class="table-avatar">
															<a href="profile.html" class="avatar avatar-sm mr-2"><img class="avatar-img rounded-circle" src="assets/img/patients/patient1.jpg" alt="User Image"/></a>
															<a href="profile.html">Charlene Reed </a>
														</h2>
													</td>
													<td>29</td>
													<td>4417  Goosetown Drive, Taylorsville, North Carolina, 28681</td>
													<td>8286329170</td>
													<td>20 Oct 2019</td>
													<td class="text-right">$100.00</td>
												</tr>
												<tr>
													<td>#PT002</td>
													<td>
														<h2 class="table-avatar">
															<a href="profile.html" class="avatar avatar-sm mr-2"><img class="avatar-img rounded-circle" src="assets/img/patients/patient2.jpg" alt="User Image"/></a>
															<a href="profile.html">Travis Trimble </a>
														</h2>
													</td>
													<td>23</td>
													<td>4026  Fantages Way, Brunswick, Maine, 04011</td>
													<td>2077299974</td>
													<td>22 Oct 2019</td>
													<td class="text-right">$200.00</td>
												</tr>
												<tr>
													<td>#PT003</td>
													<td>
														<h2 class="table-avatar">
															<a href="profile.html" class="avatar avatar-sm mr-2"><img class="avatar-img rounded-circle" src="assets/img/patients/patient3.jpg" alt="User Image"/></a>
															<a href="profile.html">Carl Kelly</a>
														</h2>
													</td>
													<td>29</td>
													<td>2037 Pearcy Avenue, Decatur, Indiana, 46733</td>
													<td>2607247769</td>
													<td>21 Oct 2019</td>
													<td class="text-right">$250.00</td>
												</tr>
												<tr>
													<td>#PT004</td>
													<td>
														<h2 class="table-avatar">
															<a href="profile.html" class="avatar avatar-sm mr-2"><img class="avatar-img rounded-circle" src="assets/img/patients/patient4.jpg" alt="User Image"/></a>
															<a href="profile.html"> Michelle Fairfax</a>
														</h2>
													</td>
													<td>25</td>
													<td>2037 Pearcy Avenue, Decatur, Indiana, 46733</td>
													<td>5043686874</td>
													<td>21 Sep 2019</td>
													<td class="text-right">$150.00</td>
												</tr>
												<tr>
													<td>#PT005</td>
													<td>
														<h2 class="table-avatar">
															<a href="profile.html" class="avatar avatar-sm mr-2"><img class="avatar-img rounded-circle" src="assets/img/patients/patient5.jpg" alt="User Image"/></a>
															<a href="profile.html">Gina Moore</a>
														</h2>
													</td>
													<td>23</td>
													<td>888  Everette Alley, Hialeah, Florida, 33012</td>
													<td>9548207887</td>
													<td>18 Sep 2019</td>
													<td class="text-right">$350.00</td>
												</tr>
												<tr>
													<td>#PT015</td>
													<td>
														<h2 class="table-avatar">
															<a href="profile.html" class="avatar avatar-sm mr-2"><img class="avatar-img rounded-circle" src="assets/img/patients/patient15.jpg" alt="User Image"/></a>
															<a href="profile.html">Jessica Garza</a>
														</h2>
													</td>
													<td>10</td>
													<td>4672  Rose Street, Schaumburg, Illinois, 60173</td>
													<td>7082788201</td>
													<td>6 Nov 2019</td>
													<td class="text-right">$310.00</td>
												</tr>
											</tbody>
										</table>
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

export default PatientsListAdmin;