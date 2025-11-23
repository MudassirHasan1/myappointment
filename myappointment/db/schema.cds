namespace myappointments;

using { cuid, managed } from '@sap/cds/common';

entity Employees :  managed {
  key ID: Int16;
  name : String;
  email     : String;
  jobTitle  : String;
  // Association: One Employee can have many Appointments
  appointments : Association to many Appointments on appointments.employee = $self;
}

entity Appointments : cuid, managed {
  title       : String;
  info : String;
  start   : DateTime;
  end     : DateTime;
  // Association: An Appointment belongs to one specific Employee
  employee    : Association to Employees;
}