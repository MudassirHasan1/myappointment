module.exports = cds.service.impl(async function () {

      this.on('getAppointments', async (req) => {

        const lt_result = await cds.tx(req).run(SELECT.from('ReportSrv.Commision_Table'));

      });
});