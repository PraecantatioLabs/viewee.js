document.addEventListener ('DOMContentLoaded', function () {
	var searchForm = document.querySelector ('form.search');
	var searchInput = searchForm.searchInput;

	var targetInputs = searchForm.targetInput || [];

	searchForm.addEventListener ('submit', function (e) {
		e.preventDefault();
	});

	searchInput.addEventListener("keypress", function(e) {
		if (e.keyCode === 13) {

			var targetInput = [].filter.call (targetInputs, function (inp) {
				return inp.checked;
			})[0];

			var tokens = searchInput.value.split(' ').map (function (token) {
				if (token.indexOf ('repo:') !== 0 && token.match (/^[\w-\._]+\/[\w-\._]+$/)) return 'repo:' + token;
				return token;
			});

			var urls = [];
			tokens.some (function (token) {
				var m = token.match (/https?:\/\/((?:\w+\.)?github\.com)?/);
				if (m && m[1].match (/github\.com$/)) {
					console.log ("this is a github url");
					urls.push (githubCORSUrl (token));
					return true;
				}
			});

			var containsRepo = tokens.some (function (token) {
				if (token.match (/repo\:[\w-\._]+\/[\w-\._]+/)) return true;
			});

			if (urls.length) {
				ViewEE.init (urls[0]);
			} else if ((targetInput && targetInput.value === 'file') || containsRepo) {
				// github requires to have at least user, org or repo in search query for code
				loadGithubRepoFiles (tokens);
			} else {
				loadGithubRepositories (searchInput.value);
			}
			e.preventDefault();
		}
	}, false);



	var submit = searchForm.querySelector ('button');

	submit && submit.addEventListener ('click', function (e) {
		loadGithubRepositories (input.value);
		e.preventDefault();
	});
});

function loadGithubRepositories (searchString) {
	var site = "https://api.github.com";
	var apiPath = "/search/repositories";
	var query = {
		q: ["fork:true", "language:eagle", "language:kicad"].concat (searchString),
		sort: "stars",
		order: "desc"
	}

	var searchForm = document.querySelector ('form.search');
	searchForm.classList.add ('pending');

	var queryString = '?' + Object.keys (query).map (function (k) {
		return k + '=' + encodeURIComponent (query[k].constructor === Array ? query[k].join (' ') : query[k]);
	}).join ('&');

	console.log (site, apiPath, decodeURIComponent (queryString));

	getPage ([site, apiPath, queryString].join (''), function (req) {
		console.log (req);

		searchForm.classList.remove ('pending');

		var res = checkResponse (req);

		console.log (res);

		renderRepoList (res);
	});
}

function loadGithubRepoFiles (repo, li) {
	var site = "https://api.github.com";
	var apiPath = "/search/code";
	var query = {
		q: ["extension:brd", "extension:kicad_pcb", "extension:pcb"].concat (repo),
		sort: "stars",
		order: "desc"
	}

	if (li) {
		var infoBlock = li.querySelector ('.info');
		infoBlock.classList.add ('pending');
	} else {
		// query.q.push ("fork:true");
	}

	var queryString = '?' + Object.keys (query).map (function (k) {
		return k + '=' + encodeURIComponent (query[k].constructor === Array ? query[k].join (' ') : query[k]);
	}).join ('&');

	console.log (site, apiPath, decodeURIComponent (queryString));

	getPage ([site, apiPath, queryString].join (''), function (req) {

		li && infoBlock.classList.remove ('pending');

		console.log (req);

		var res = checkResponse (req);

		console.log (res);

		renderFileList (res, li);
	});
}

function renderRepoList (res) {
	var results = document.querySelector ('ul.results');
	while (results.firstChild) {
		results.removeChild (results.lastChild);
	}

	res.items.forEach (function (repo) {
		var li = HtmlEl (
			'li', {},
			HtmlEl ('div', {class: 'name'}, repo.name),
			HtmlEl ('div', {class: 'description'}, repo.description),
			HtmlEl ('div', {class: 'info'},
				HtmlEl ('span', {class: 'stars'}, "★ " + repo.stargazers_count),
				HtmlEl ('a', {class: 'repo', href: "https://github.com/" + repo.full_name}, repo.full_name)
			)
		);
		li.addEventListener ("click", function (e) {
			// console.log ('TARGET', e.target);
			loadGithubRepoFiles ('repo:'+repo.full_name, li);
		});
		results.appendChild (li);
	});

}

function renderFileList (res, parent) {
	if (!parent) {
		var results = document.querySelector ('ul.results');
		parent = results;
	} else {
		var results = parent.querySelector ('ul.files');
	}

	if (!results) {
		results = HtmlEl ('ul', {class: 'files'});
		parent.appendChild (results);
	}

	while (results.firstChild) {
		results.removeChild (results.lastChild);
	}

	res.items.forEach (function (repoFile) {
		var li = HtmlEl ('li', {}, repoFile.path); // name, sha, html_url
		li.addEventListener ("click", function (e) {
			e.stopPropagation();

			[].slice.apply (parent.parentNode.querySelectorAll ('li.active')).forEach (function (activeLi) {
				activeLi.classList.remove ('active');
			});

			li.classList.add ('active');

			ViewEE.init (githubCORSUrl (repoFile.html_url));

			var vieweeControls = document.querySelector ('.viewee .controls');

			vieweeControls.classList.add ('pending');

		});
		results.appendChild (li);
	});

}

function githubCORSUrl (githubUrl) {
	return githubUrl
		.replace (/^https\:\/\/github\.com/, "https://cdn.rawgit.com")
		.replace (/\/blob/, "")
}

function checkResponse (req) {
	if (req.status !== 200)
		return showError ('HTTP Error', + req.status);

	try {
		var res = JSON.parse (req.responseText);
	} catch (e) {
		return showError ('JSON Error' + req.status);
	}

	return res;
}

function showError () {

}

// ---------------
// --- LOADING ---
// ---------------

function getPage (url, cb) {
	var request = new XMLHttpRequest(),
		self = this;
	request.open('GET', url, true);
	request.onreadystatechange = function () {
		if (request.readyState == 4) {
			var result = cb && cb(request);
		}
	};
	request.send(null);
};
