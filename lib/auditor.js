"use strict";

var phantom = require("phantom");
var cookie = require('cookies.txt');

function Auditor(url, cookiesFile, auditScript) {
  var defaultAuditScriptPath = __dirname + "/accesslint.js";
  this.url = url;
  this.cookiesFile = cookiesFile;
  this.auditScript = auditScript || defaultAuditScriptPath;
}

function waitUntil(asyncTest) {
  return new Promise(function(resolve, reject) {
    function wait() {
      asyncTest().then(function(value) {
        if (value) {
          resolve(value);
        } else {
          setTimeout(wait, 100);
        }
      }).catch(function(e) {
        reject();
      });
    }

    wait();
  });
}

Auditor.prototype.audit = function(callback, errorHandler) {
  var url = this.url;
  var _this = this;
  var sitepage = null;
  var phInstance = null;
  var successHandler = callback;

  if (this.cookiesFile) {
    cookie.parse(this.cookiesFile, function(jsonCookieObj){
      doHardWork(jsonCookieObj);
    });
  } else {
      doHardWork();
  }

  function doHardWork(cookies) {
    console.log('do hard work');
    phantom.create().then(function (instance) {
      console.log('created');
      phInstance = instance;

      if (cookies) {
        console.log('cookies here');
        cookies.forEach(function(ck) {
          console.log('adding cookie  ', ck.name);
          //delete ck.expires;
          if (ck.name == '__profilin') {return;}
          phInstance.addCookie({
            'name': ck.name,
            'path': ck.path,
            'value': ck.value,
            'expires': (new Date()).getTime() + (1000 * 60 * 60)
          });
        });
        console.log('ADDED COOKIES');
      }
      console.log('creating page');
      return instance.createPage();
    }).then(function (page) {
      console.log('page function');
      sitepage = page;

      sitepage.property("viewportSize", {
        width: 1200,
        height: 900
      });

      sitepage.on("onError", errorHandler);

      return sitepage.open(url);
    }).then(function (status) {
      console.log('status function');
      return sitepage.property("content");
    }).then(function (content) {
      return sitepage.injectJs(_this.auditScript);
    }).then(function (injected) {
      waitUntil(function() {
        return sitepage.evaluate(function() {
          var run = new Event("accesslint:run");
          window.dispatchEvent(run);
          return window.AccessLint.results;
        });
      }).then(function(results) {
        console.log('inject pages results');
        successHandler(results);
        sitepage.close();
        phInstance.exit();
      }).catch(function (err) {
        console.log('inject page error');
        errorHandler(err);
        sitepage.close();
        phInstance.exit();
      });
    }).catch(function (err) {
      errorHandler(err);
      sitepage.close();
      phInstance.exit();
    });
  }
};

module.exports = Auditor;
