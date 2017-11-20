/*
var assert = require ('assert');
var crypto = require ('crypto');

var seleniumBootstrap = require ('../../selenium.js');
var driver,
	By     = seleniumBootstrap.selenium.By,
	until  = seleniumBootstrap.selenium.until;

var testCommon = require ('../../common.js');

var sailsHelper = require ('../../sails.js');

// driver.findElement(By.name('q')).sendKeys('webdriver');
// driver.findElement(By.name('btnG')).click();
// driver.wait(until.titleIs('webdriver - Google Search'), 1000);
// driver.wait (until.elementLocated(By.id('pageContainer3')));

var baseName = testCommon.baseName (__filename);

describe (baseName + " running registration test", () => {

  var sailsProcess;
  var emailAddress = '' + (0 + Date.now()) + '@host.example';

  var hash = crypto.createHash('sha256');
  hash.update (emailAddress);
  hash.update (JSON.stringify (process.env));

  var badPassword = hash.digest('hex');
  var goodPassword = "A" + badPassword; // we need an uppercase letter in the password

  process.testUserEmail = emailAddress;
  process.testUserPass  = goodPassword;

  before (function (done) {

	driver = seleniumBootstrap.open ();

	this.timeout (60000);

	sailsProcess = sailsHelper.startSubprocessIfNeeded (function (err, sailsReady) {
	  done (err);
	});
  });

  // this function navigates to the index page,
  // then tries to reach registration form
  function navigateToLoginPage () {
	return driver.get('http://localhost:'+sailsHelper.port+'/').then (() => {
	  // driver.findElement(By.name('q')).sendKeys('webdriver');
	  // driver.findElement(By.name('btnG')).click();
	  // driver.wait(until.titleIs('webdriver - Google Search'), 1000);
	  // driver.wait (until.elementLocated(By.id('pageContainer3')));

	  // TODO: check for redirect

	  return driver.wait(until.elementLocated(By.name('email_address')));

	});
  }

  // this function navigates to the index page,
  // then tries to reach registration form
  function navigateToRegistrationPage () {
	return navigateToLoginPage ().then (function () {

	  // TODO: find register button
	  return driver.findElement(By.id('register-link')).click();

	}).then (function () {

	  return driver.wait(until.elementLocated(By.name('password')));

	})
  }

  it ("should proceed to the registration page", function (done) {

	this.timeout(15000);
  });

});


driver.takeScreenshot().then(function(data){
  var base64Data = data.replace(/^data:image\/png;base64,/,"")
  fs.writeFile("out.png", base64Data, 'base64', function(err) {
	if(err) console.log(err);
  });
});

*/
