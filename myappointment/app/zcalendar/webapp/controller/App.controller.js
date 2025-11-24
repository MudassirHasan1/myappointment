sap.ui.define([
    'sap/m/Label',
    'sap/m/Popover',
    'sap/ui/core/library',
    'sap/ui/core/format/DateFormat',
    'sap/ui/core/Fragment',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'sap/base/Log',
    'sap/ui/core/date/UI5Date'
],
    function (Label, Popover, coreLibrary, DateFormat, Fragment, Controller, JSONModel, Log, UI5Date) {
        "use strict";

        var ValueState = coreLibrary.ValueState;

        return Controller.extend("zcalendar.controller.App", {

            onInit: async function () {
                this.bindCalendar();

            },

            bindCalendar: async function () {
                var oModel = new JSONModel();


                var oViewModel = this.getOwnerComponent().getModel();

                var oListBinding = oViewModel.bindList("/Appointments", undefined, [], [], {
                    $$ownRequest: true
                });

                var arrAppointments = [];
                var arrEmployees = [];



                await oListBinding.requestContexts(0, 100).then(function (aContexts) {
                    aContexts.forEach(oContext => {
                        arrAppointments.push(oContext.getObject());
                    });

                });

                var oListEmpBinding = oViewModel.bindList("/Employees", undefined, [], [], {
                    $$ownRequest: true
                });


                await oListEmpBinding.requestContexts(0, 100).then(function (aContexts) {
                    aContexts.forEach(oContext => {
                        arrEmployees.push(oContext.getObject());
                    });

                });

                console.log(arrAppointments);
                console.log(arrEmployees);
                var today = new Date();

                const result = {
                    startDate: UI5Date.getInstance(today.getFullYear(),today.getMonth() , today.getDate()),
                    people: arrEmployees.map(employee => {
                        // Find appointments for this employee
                        const employeeAppointments = arrAppointments
                            .filter(appointment => appointment.employee_ID === employee.ID)
                            .map(appointment => ({
                                ID: appointment.ID,
                                title: appointment.title,
                                info: appointment.info,
                                start: new Date(appointment.start),
                                end: new Date(appointment.end)
                            }));

                        return {
                            name: employee.name,
                            ID: employee.ID,
                            appointments: employeeAppointments
                        };
                    })
                };

                console.log(result);
                oModel.setData(result);

                this.getView().setModel(oModel);

            },

            _aDialogTypes: [
                { title: "Create Appointment", type: "create_appointment" },
                { title: "Create Appointment", type: "create_appointment_with_context" },
                { title: "Edit Appointment", type: "edit_appointment" }],

            handleAppointmentSelect: function (oEvent) {
                var oAppointment = oEvent.getParameter("appointment");

                if (oAppointment) {
                    this._handleSingleAppointment(oAppointment);
                } else {
                    this._handleGroupAppointments(oEvent);
                }
            },

            _addNewAppointment: function (oAppointment) {
                // var oModel = this.getView().getModel(),
                //     sPath = "/people/" + this.byId("selectPerson").getSelectedIndex().toString(),
                //     oPersonAppointments;

                // if (this.byId("isIntervalAppointment").getSelected()) {
                //     sPath += "/headers";
                // } else {
                //     sPath += "/appointments";
                // }

                // oPersonAppointments = oModel.getProperty(sPath);

                // oPersonAppointments.push(oAppointment);

                // oModel.setProperty(sPath, oPersonAppointments);

                var oModel = this.getOwnerComponent().getModel();
                var aResult = [];
                aResult.push(oAppointment);

                var oListBinding = oModel.bindList("/Appointments", undefined, [], [], {
                    $$ownRequest: true
                });
                var oMessageModel = new JSONModel([]);

                // var oContextX = oListBinding.create(aResult);
                aResult.forEach(function (oObject, i) {
                    // Create a new entity for each object
                    oListBinding.create(oObject);
                });
                var that = this;
                oModel.submitBatch("headerGroup").then(
                    function () {
                        //sap.m.MessageBox.success("Successfully created.");
                        that.bindCalendar();
                        //debugger;
                        // This is a success handler

                        // var eData = oMessageModel.getData();
                        // var oSMessageX =
                        // {
                        //     "State": "Success",
                        //     "Icon": "sap-icon://sys-enter-2",
                        //     "Color": "green",
                        //     "Message": "Appointment Created Successfully"
                        // };
                        // eData.push(oSMessageX);
                        // oMessageModel.setData(eData);
                        //oViewModel.setProperty("/resultMessage", `File processed successfully! Found ${aResult.length} valid records.`);

                    }).then(function () {
                        sap.ui.getCore().getMessageManager().getMessageModel();
                    });
            },

            handleCancelButton: function () {
                this.byId("detailsPopover").close();
            },

            handleAppointmentCreate: function () {
                this._arrangeDialogFragment(this._aDialogTypes[0].type);
            },

            handleAppointmentAddWithContext: function (oEvent) {
                this.oClickEventParameters = oEvent.getParameters();
                this._arrangeDialogFragment(this._aDialogTypes[1].type);
            },

            _validateDateTimePicker: function (oDateTimePickerStart, oDateTimePickerEnd) {
                var oStartDate = oDateTimePickerStart.getDateValue(),
                    oEndDate = oDateTimePickerEnd.getDateValue(),
                    sValueStateText = "Start date should be before End date";

                if (oStartDate && oEndDate && oEndDate.getTime() <= oStartDate.getTime()) {
                    oDateTimePickerStart.setValueState(ValueState.Error);
                    oDateTimePickerEnd.setValueState(ValueState.Error);
                    oDateTimePickerStart.setValueStateText(sValueStateText);
                    oDateTimePickerEnd.setValueStateText(sValueStateText);
                } else {
                    oDateTimePickerStart.setValueState(ValueState.None);
                    oDateTimePickerEnd.setValueState(ValueState.None);
                }
            },

            updateButtonEnabledState: function (oDialog) {
                var oStartDate = this.byId("startDate"),
                    oEndDate = this.byId("endDate"),
                    bEnabled = oStartDate.getValueState() !== ValueState.Error
                        && oStartDate.getValue() !== ""
                        && oEndDate.getValue() !== ""
                        && oEndDate.getValueState() !== ValueState.Error;

                oDialog.getBeginButton().setEnabled(bEnabled);
            },

            handleCreateChange: function (oEvent) {
                var oDateTimePickerStart = this.byId("startDate"),
                    oDateTimePickerEnd = this.byId("endDate");

                if (oEvent.getParameter("valid")) {
                    this._validateDateTimePicker(oDateTimePickerStart, oDateTimePickerEnd);
                } else {
                    oEvent.getSource().setValueState(ValueState.Error);
                }

                this.updateButtonEnabledState(this.byId("createDialog"));
            },

            _removeAppointment: async function (oAppointment, sPersonId) {
                var oModel = this.getView().getModel(),
                    sTempPath,
                    aPersonAppointments,
                    iIndexForRemoval;

                if (!sPersonId) {
                    sTempPath = this.sPath.slice(0, this.sPath.indexOf("appointments/") + "appointments/".length);
                } else {
                    sTempPath = "/people/" + sPersonId + "/appointments";
                }

                aPersonAppointments = oModel.getProperty(sTempPath);
                iIndexForRemoval = aPersonAppointments.indexOf(oAppointment);

                if (iIndexForRemoval !== -1) {
                    aPersonAppointments.splice(iIndexForRemoval, 1);
                }

                oModel.setProperty(sTempPath, aPersonAppointments);


                let appointMentID = oAppointment.ID;
                //let oBindList = oModel.bindList("/Appointments");

                let aFilter = new sap.ui.model.Filter("ID", sap.ui.model.FilterOperator.EQ, appointMentID);

                var oViewModel = this.getOwnerComponent().getModel();

                var oListBinding = oViewModel.bindList("/Appointments", undefined, [], aFilter, {
                    $$ownRequest: true
                });


                await oListBinding.requestContexts(0, 100).then(function (aContexts) {
                    aContexts[0].delete();

                });

                this.bindCalendar();

            },

            handleDeleteAppointment: function () {
                var oDetailsPopover = this.byId("detailsPopover"),
                    oBindingContext = oDetailsPopover.getBindingContext(),
                    oAppointment = oBindingContext.getObject(),
                    iPersonIdStartIndex = oBindingContext.getPath().indexOf("/people/") + "/people/".length,
                    iPersonId = oBindingContext.getPath()[iPersonIdStartIndex];

                oDetailsPopover.close();
                this._removeAppointment(oAppointment, iPersonId);
            },

            handleEditButton: function () {
                var oDetailsPopover = this.byId("detailsPopover");
                this.sPath = oDetailsPopover.getBindingContext().getPath();
                oDetailsPopover.close();
                this._arrangeDialogFragment(this._aDialogTypes[2].type);

            },

            _arrangeDialogFragment: function (iDialogType) {
                var oView = this.getView();

                if (!this._pNewAppointmentDialog) {
                    this._pNewAppointmentDialog = Fragment.load({
                        id: oView.getId(),
                        name: "zcalendar.view.fragment.Create",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        return oDialog;
                    });
                }
                this._pNewAppointmentDialog.then(function (oDialog) {
                    this._arrangeDialog(iDialogType, oDialog);
                }.bind(this));
            },

            _arrangeDialog: function (sDialogType, oDialog) {
                var sTempTitle = "";
                oDialog._sDialogType = sDialogType;
                if (sDialogType === "edit_appointment") {
                    this._setEditAppointmentDialogContent(oDialog);
                    sTempTitle = this._aDialogTypes[2].title;
                } else if (sDialogType === "create_appointment_with_context") {
                    this._setCreateWithContextAppointmentDialogContent();
                    sTempTitle = this._aDialogTypes[1].title;
                } else if (sDialogType === "create_appointment") {
                    this._setCreateAppointmentDialogContent();
                    sTempTitle = this._aDialogTypes[0].title;
                } else {
                    Log.error("Wrong dialog type.");
                }

                this.updateButtonEnabledState(oDialog);
                oDialog.setTitle(sTempTitle);
                oDialog.open();
            },

            handleAppointmentTypeChange: function (oEvent) {
                var oAppointmentType = this.byId("isIntervalAppointment");

                oAppointmentType.setSelected(oEvent.getSource().getSelected());
            },

            handleDialogCancelButton: function () {
                this.byId("createDialog").close();
            },

            _editAppointment: async function (oAppointment, bIsIntervalAppointment, iPersonId, oNewAppointmentDialog) {
                var sAppointmentPath = this._appointmentOwnerChange(oNewAppointmentDialog),
                    oModel = this.getView().getModel();

                if (bIsIntervalAppointment) {
                    this._convertToHeader(oAppointment, oNewAppointmentDialog);
                } else {
                    if (this.sPath !== sAppointmentPath) {
                        this._addNewAppointment(oNewAppointmentDialog.getModel().getProperty(this.sPath));
                        this._removeAppointment(oNewAppointmentDialog.getModel().getProperty(this.sPath));
                    }
                    // oModel.setProperty(sAppointmentPath + "/title", oAppointment.title);
                    // oModel.setProperty(sAppointmentPath + "/info", oAppointment.info);
                    // oModel.setProperty(sAppointmentPath + "/type", oAppointment.type);
                    // oModel.setProperty(sAppointmentPath + "/start", oAppointment.start);
                    // oModel.setProperty(sAppointmentPath + "/end", oAppointment.end);

                    let appointMentID = this._AppointMentID;
                    //let oBindList = oModel.bindList("/Appointments");

                    let aFilter = new sap.ui.model.Filter("ID", sap.ui.model.FilterOperator.EQ, appointMentID);

                    var oViewModel = this.getOwnerComponent().getModel();

                    var oListBinding = oViewModel.bindList("/Appointments", undefined, [], aFilter, {
                        $$ownRequest: true
                    });


                    await oListBinding.requestContexts(0, 100).then(function (aContexts) {
                    aContexts[0].setProperty("info", oAppointment.info);
                    aContexts[0].setProperty("title", oAppointment.title);
                    aContexts[0].setProperty("start", (oAppointment.start).toISOString());
                    aContexts[0].setProperty("end", (oAppointment.end).toISOString());


                    });

                    this.bindCalendar();



                }

            },

            _convertToHeader: function (oAppointment, oNewAppointmentDialog) {
                var sPersonId = this.byId("selectPerson").getSelectedIndex().toString();

                this._removeAppointment(oNewAppointmentDialog.getModel().getProperty(this.sPath), sPersonId);
                this._addNewAppointment({ start: oAppointment.start, end: oAppointment.end, title: oAppointment.title, type: oAppointment.type });
            },

            handleDialogSaveButton: function () {
                var oStartDate = this.byId("startDate"),
                    oEndDate = this.byId("endDate"),
                    sInfoValue = this.byId("moreInfo").getValue(),
                    sInputTitle = this.byId("inputTitle").getValue(),
                    iPersonId = this.byId("selectPerson").getSelectedKey(),
                    oModel = this.getView().getModel(),
                    bIsIntervalAppointment = this.byId("isIntervalAppointment").getSelected(),
                    oNewAppointmentDialog = this.byId("createDialog"),
                    oNewAppointment;

                if (oStartDate.getValueState() !== ValueState.Error
                    && oEndDate.getValueState() !== ValueState.Error) {
                    if (this.sPath && oNewAppointmentDialog._sDialogType === "edit_appointment") {
                        this._editAppointment({
                            title: sInputTitle,
                            info: sInfoValue,
                            type: this.byId("detailsPopover").getBindingContext().getObject().type,
                            start: oStartDate.getDateValue(),
                            end: oEndDate.getDateValue()
                        }, bIsIntervalAppointment, iPersonId, oNewAppointmentDialog);
                    } else {
                        if (bIsIntervalAppointment) {
                            oNewAppointment = {
                                title: sInputTitle,
                                start: oStartDate.getDateValue(),
                                end: oEndDate.getDateValue()
                            };
                        } else {
                            oNewAppointment = {
                                title: sInputTitle,
                                info: sInfoValue,
                                start: oStartDate.getDateValue(),
                                end: oEndDate.getDateValue(),
                                employee_ID: iPersonId
                            };
                        }
                        this._addNewAppointment(oNewAppointment);
                    }

                    // oModel.updateBindings();

                    oNewAppointmentDialog.close();
                }
            },

            _appointmentOwnerChange: function (oNewAppointmentDialog) {
                var iSpathPersonId = this.sPath[this.sPath.indexOf("/people/") + "/people/".length],
                    iSelectedPerson = this.byId("selectPerson").getSelectedIndex(),
                    sTempPath = this.sPath,
                    iLastElementIndex = oNewAppointmentDialog.getModel().getProperty("/people/" + iSelectedPerson.toString() + "/appointments/").length.toString();

                if (iSpathPersonId !== iSelectedPerson.toString()) {
                    sTempPath = "".concat("/people/", iSelectedPerson.toString(), "/appointments/", iLastElementIndex.toString());
                }

                return sTempPath;
            },

            _setCreateAppointmentDialogContent: function () {
                var oAppointmentType = this.byId("isIntervalAppointment"),
                    oDateTimePickerStart = this.byId("startDate"),
                    oDateTimePickerEnd = this.byId("endDate"),
                    oTitleInput = this.byId("inputTitle"),
                    oMoreInfoInput = this.byId("moreInfo"),
                    oPersonSelected = this.byId("selectPerson");

                //Set the person in the first row as selected.
                oPersonSelected.setSelectedItem(this.byId("selectPerson").getItems()[0]);
                oDateTimePickerStart.setValue("");
                oDateTimePickerEnd.setValue("");
                oDateTimePickerStart.setValueState(ValueState.None);
                oDateTimePickerEnd.setValueState(ValueState.None);
                oTitleInput.setValue("");
                oMoreInfoInput.setValue("");
                oAppointmentType.setSelected(false);
            },

            _setCreateWithContextAppointmentDialogContent: function () {
                var aPeople = this.getView().getModel().getProperty('/people/'),
                    oSelectedIntervalStart = this.oClickEventParameters.startDate,
                    oStartDate = this.byId("startDate"),
                    oSelectedIntervalEnd = this.oClickEventParameters.endDate,
                    oEndDate = this.byId("endDate"),
                    oDateTimePickerStart = this.byId("startDate"),
                    oDateTimePickerEnd = this.byId("endDate"),
                    oAppointmentType = this.byId("isIntervalAppointment"),
                    oTitleInput = this.byId("inputTitle"),
                    oMoreInfoInput = this.byId("moreInfo"),
                    sPersonName,
                    oPersonSelected;

                if (this.oClickEventParameters.row) {
                    sPersonName = this.oClickEventParameters.row.getTitle();
                    oPersonSelected = this.byId("selectPerson");

                    oPersonSelected.setSelectedIndex(aPeople.indexOf(aPeople.filter(function (oPerson) { return oPerson.name === sPersonName; })[0]));

                }

                oStartDate.setDateValue(oSelectedIntervalStart);

                oEndDate.setDateValue(oSelectedIntervalEnd);

                oTitleInput.setValue("");

                oMoreInfoInput.setValue("");

                oAppointmentType.setSelected(false);

                oDateTimePickerStart.setValueState(ValueState.None);
                oDateTimePickerEnd.setValueState(ValueState.None);

                delete this.oClickEventParameters;
            },

            _setEditAppointmentDialogContent: function (oDialog) {
                var oAppointment = oDialog.getModel().getProperty(this.sPath),
                    oSelectedIntervalStart = oAppointment.start,
                    oSelectedIntervalEnd = oAppointment.end,
                    oDateTimePickerStart = this.byId("startDate"),
                    oDateTimePickerEnd = this.byId("endDate"),
                    sSelectedInfo = oAppointment.info,
                    sSelectedTitle = oAppointment.title,
                    iSelectedPersonId = this.sPath[this.sPath.indexOf("/people/") + "/people/".length],
                    oPersonSelected = this.byId("selectPerson"),
                    oStartDate = this.byId("startDate"),
                    oEndDate = this.byId("endDate"),
                    oMoreInfoInput = this.byId("moreInfo"),
                    oTitleInput = this.byId("inputTitle"),
                    oAppointmentType = this.byId("isIntervalAppointment");

                oPersonSelected.setSelectedIndex(iSelectedPersonId);
                this._AppointMentID = oAppointment.ID;

                oStartDate.setDateValue(oSelectedIntervalStart);

                oEndDate.setDateValue(oSelectedIntervalEnd);

                oMoreInfoInput.setValue(sSelectedInfo);

                oTitleInput.setValue(sSelectedTitle);

                oDateTimePickerStart.setValueState(ValueState.None);
                oDateTimePickerEnd.setValueState(ValueState.None);

                oAppointmentType.setSelected(false);
            },

            _handleSingleAppointment: function (oAppointment) {
                var oView = this.getView();
                if (oAppointment === undefined) {
                    return;
                }

                if (!oAppointment.getSelected() && this._pDetailsPopover) {
                    this._pDetailsPopover.then(function (oDetailsPopover) {
                        oDetailsPopover.close();
                    });
                    return;
                }

                if (!this._pDetailsPopover) {
                    this._pDetailsPopover = Fragment.load({
                        id: oView.getId(),
                        name: "zcalendar.view.fragment.Details",
                        controller: this
                    }).then(function (oDetailsPopover) {
                        oView.addDependent(oDetailsPopover);
                        return oDetailsPopover;
                    });
                }

                this._pDetailsPopover.then(function (oDetailsPopover) {
                    this._setDetailsDialogContent(oAppointment, oDetailsPopover);
                }.bind(this));
            },

            _setDetailsDialogContent: function (oAppointment, oDetailsPopover) {
                oDetailsPopover.setBindingContext(oAppointment.getBindingContext());
                oDetailsPopover.openBy(oAppointment);
            },

            formatDate: function (oDate) {
                if (oDate) {
                    var iHours = oDate.getHours(),
                        iMinutes = oDate.getMinutes(),
                        iSeconds = oDate.getSeconds();

                    if (iHours !== 0 || iMinutes !== 0 || iSeconds !== 0) {
                        return DateFormat.getDateTimeInstance({ style: "medium" }).format(oDate);
                    } else {
                        return DateFormat.getDateInstance({ style: "medium" }).format(oDate);
                    }
                }
            },

            _handleGroupAppointments: function (oEvent) {
                var aAppointments,
                    sGroupAppointmentType,
                    sGroupPopoverValue,
                    sGroupAppDomRefId,
                    bTypeDiffer;

                aAppointments = oEvent.getParameter("appointments");
                sGroupAppointmentType = aAppointments[0].getType();
                sGroupAppDomRefId = oEvent.getParameter("domRefId");
                bTypeDiffer = aAppointments.some(function (oAppointment) {
                    return sGroupAppointmentType !== oAppointment.getType();
                });

                if (bTypeDiffer) {
                    sGroupPopoverValue = aAppointments.length + " Appointments of different types selected";
                } else {
                    sGroupPopoverValue = aAppointments.length + " Appointments of the same " + sGroupAppointmentType + " selected";
                }

                if (!this._oGroupPopover) {
                    this._oGroupPopover = new Popover({
                        title: "Group Appointments",
                        content: new Label({
                            text: sGroupPopoverValue
                        })
                    });
                } else {
                    this._oGroupPopover.getContent()[0].setText(sGroupPopoverValue);
                }
                this._oGroupPopover.addStyleClass("sapUiContentPadding");
                this._oGroupPopover.openBy(document.getElementById(sGroupAppDomRefId));
            }

        });

    });
