"use strict";

var Auditor = require("./auditor"),
    Report = require("./report"),
    util = require("util");

function AuditorCli(args, reportClass) {
  if(args.length < 3) {
    console.log("Usage: node lib/auditor_cli.js URL [cookies-path]");
    process.exit(1)
  }

  this.ReportClass = reportClass || Report;
  this.url = args[2];
  this.cookiesFile = null;
  if (args.length > 3) {
      this.cookiesFile = args[3]
  }
}

AuditorCli.prototype.run = function(auditorClass) {
  var url = this.url;
  var AuditorClass = auditorClass || Auditor;
  var auditor = new AuditorClass(url, this.cookiesFile);
  var ReportClass = this.ReportClass;

  auditor.audit(function(results) {
    var report = new ReportClass(results);
    console.log('Report init?');
    var reportResults = report.process();
    console.log('report process');
    for(var i = 0; i < reportResults.length; i++) {
      console.log(util.inspect(reportResults[i], false, null));
    }
  }, function(err) {
    // noop
  });
};

module.exports = AuditorCli;
