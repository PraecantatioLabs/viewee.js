// http://stackoverflow.com/questions/3422262/take-a-screenshot-with-selenium-webdriver
function storeScreenshot () {
	driver.takeScreenshot().then(function(data){
		var base64Data = data.replace(/^data:image\/png;base64,/,"")
		fs.writeFile("out.png", base64Data, 'base64', function(err) {
			if(err) console.log(err);
		});
	});
}

// https://qxf2.com/blog/selenium-html5-canvas-verify-what-was-drawn/
function getDataUrl () {
	return document.getElementsByClassName("my-canvas")[0].toDataURL("image/png");
}

function getDataUrlFromSelenium () {
	png_url = driver.execute_script ('return document.getElementsByClassName("my-canvas")[0].toDataURL("image/png");')

}
