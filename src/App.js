import './App.css';
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom'
import Register from './Register'
import VerifyEmail from './VerifyEmail';
import Dashboard from "./Dashboard";
import HosStaffDashboard from "./HosStaffDashboard";
import Appointment from "./Appointment";
import {useState, useEffect} from 'react'
import {AuthProvider} from './AuthContext'
import {auth} from './firebase'
import {onAuthStateChanged} from 'firebase/auth'
import PrivateRoute from './PrivateRoute'
import ProfileSettings from './profileSettings';
import Login from './Login';
import DoctorSearch from './doctorSearch';
import AllPatients from './AllPatients';
import DoctorDashboard from './doctorDashboard';
import PatientBooking from './patientbooking';
import LandingPage from './landingPage';
import HSAppointments from './HSAppointments';
import AddDiagnosis from './AddDiagnosis';
import ViewDiagnosis from './viewDiagnosis';
import DoctorSchedule from './DoctorSchedule';
import DoctorScheduleHS from './doctorScheduleHS';
import LabStaffProfile from './labStaffProfile';
import InsuranceForm from './InsuranceForm';
import InsuranceDashboard from './InsuranceDashboard';
import GenerateReport from './GenerateReport';
import viewReportForInsurance from './ViewReportForInsurance';
import InsuranceDetails from './InsuranceDetails';
import PasswordReset from './PasswordReset';
import ChangePassword from './change-password';
import ChatBot from './chatbot/src/App';
import AllinsuranceDetails from './AllinsuranceDetails';
import Invoices from './Invoices';
import PatientsInvoices from './patientInvoices';
import CheckOut from './CheckOut';
import ViewReport from './viewReport';
import PatientProfile from './PatientProfilePage';
import ViewDiagnosisDoctor from './viewDiagnosis_Doctor';
import AdminTransactions from './AdminTransactions';
import ViewTransaction from './viewTransaction';
import AdminDashboard from './AdminDashboard';
import AdminDoctorSearch from './AdminDoctorSearch';
import AdminInsurances from './AdminInsurances';
import AdminViewInsuranceReport from './AdminViewInsuranceReport';
import AdminAppointmentsView from './AdminAppointmentsView';
import AdminProfileUpdate from './AdminProfileUpdate';
import AdminAddUser from './AdminAddUser'

function App() {

  const [currentUser, setCurrentUser] = useState(null)
  const [timeActive, setTimeActive] = useState(false)

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setTimeActive(true)
    })
  }, [])

  return (
    <Router>
      <AuthProvider value={{currentUser, timeActive, setTimeActive}}>
        <Switch>
          <Route exact path="/dashboard" component={Dashboard } />
          <Route exact path="/login" component={Login} />
          <Route exact path="/register" component={Register} />
          <Route exact path="/HSD" component={HosStaffDashboard } />
          <Route exact path="/HSD-Appointments" component={HSAppointments } />
          <Route exact path="/appointment/:appointmentId" component={Appointment} />
          <Route exact path='/verify-email' component={VerifyEmail} />
          <Route exact path='/doctor-search' component={DoctorSearch } />
          <Route exact path='/DoctorDashboard' component={DoctorDashboard } />
          <Route exact path='/DoctorSchedule' component={DoctorSchedule } />
          <Route exact path='/doctorScheduleHS' component={DoctorScheduleHS } />
          <Route exact path='/changePassword' component={ChangePassword} />
          <Route exact path='/patient-booking/:doctorid' component={PatientBooking} />
          <Route exact path='/addDiagnosis/:appointmentId' component={AddDiagnosis} />
          <Route exact path='/viewDiagnosis/:appointmentId' component={ViewDiagnosis} />
          <Route exact path='/viewDiagnosis_doctor/:appointmentId' component={ViewDiagnosisDoctor} />
          <Route exact path='/labStaffProfile' component={LabStaffProfile} />
          <Route exact path='/InsuranceForm' component={InsuranceForm} />
          <Route exact path='/InsurancerDashboard' component={InsuranceDashboard}/>
          <Route exact path='/viewReportForInsurance/:appointmentId' component={viewReportForInsurance}/>
          <Route exact path='/InsuranceDetails/:insuranceId' component={InsuranceDetails}/>
          <Route exact path='/' component={LandingPage}/>
          <Route exact path='/generateReport' component={GenerateReport}/>
          <Route exact path='/forgotPassword' component={PasswordReset}/>
          <Route exact path='/chatbot' component={ChatBot}/>
          <Route exact path='/checkOut/:appointmentId' component={CheckOut}/>
          <Route exact path='/allInsurances' component={AllinsuranceDetails}/>
          <Route exact path='/generateReport/:appointmentId' component={GenerateReport}/>
          <Route exact path='/invoiceReports' component={Invoices}/>
          <Route exact path='/patientsInvoice' component={PatientsInvoices}/>
          <Route exact path='/AllPatients' component={AllPatients}/>
          <Route exact path='/ViewReport/:appointmentId' component={ViewReport}/>
          <Route exact path='/labStaffDB' component={LabStaffProfile} />
          <Route exact path='/PatientProfile/:patient' component={PatientProfile}/>
          <Route exact path='/transaction/:transaction' component={ViewTransaction}/>
          <Route exact path="/profile" component={ProfileSettings} />
          <Route exact path="/AdminTransactions" component={AdminTransactions}/>
          <Route exact path="/AdminDashboard" component={AdminDashboard}/>
          <Route exact path="/AdminDoctorSearch" component={AdminDoctorSearch}/>
          <Route exact path="/AdminInsurances" component={AdminInsurances}/>
          <Route exact path="/AdminViewInsuranceReport/:appointmentId" component={AdminViewInsuranceReport}/>
          <Route exact path="/AdminAppointmentsView" component={AdminAppointmentsView}/>
          <Route exact path="/AdminProfileUpdate/:userID" component={AdminProfileUpdate}/>
          <Route exact path="/AdminAddUser" component={AdminAddUser}/>
        </Switch>
      </AuthProvider>
  </Router>
  );
}

export default App;
