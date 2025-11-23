using myappointments from '../db/schema';

service BookingService {
    // Expose Employees and their Appointments
    entity Employees as projection on myappointments.Employees;
    
    // Expose Appointments directly
    entity Appointments as projection on myappointments.Appointments;
}