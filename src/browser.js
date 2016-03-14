document.addEventListener ('DOMContentLoaded', function () {
	var searchForm = document.querySelector ('form.search');
	var searchInput = searchForm.searchInput;

	var targetInputs = searchForm.targetInput || [];

	searchInput.addEventListener("keypress", function(e) {
		if (e.keyCode === 13) {

			var targetInput = [].filter.call (targetInputs, function (inp) {
				return inp.checked;
			})[0];

			// github requires to have at least user, org or repo in search query for code
			if (targetInput && targetInput.value === 'file') {
				loadGithubRepoFiles (searchInput.value);
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
		q: ["language:eagle", "language:kicad", searchString],
		sort: "stars",
		order: "desc"
	}

	var searchForm = document.querySelector ('form.search');
	searchForm.classList.add ('pending');

	var queryString = '?' + Object.keys (query).map (function (k) {
		return k + '=' + encodeURIComponent (query[k].constructor === Array ? query[k].join (' ') : query[k]);
	}).join ('&');

	console.log (site, apiPath, queryString);

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
		q: ["extension:brd", "extension:kicad_pcb", "extension:pcb", li ? "repo:" + repo.full_name : repo],
		sort: "stars",
		order: "desc"
	}

	var infoBlock = li.querySelector ('.info');
	infoBlock.classList.add ('pending');

	var queryString = '?' + Object.keys (query).map (function (k) {
		return k + '=' + encodeURIComponent (query[k].constructor === Array ? query[k].join (' ') : query[k]);
	}).join ('&');

	console.log (site, apiPath, queryString);

	getPage ([site, apiPath, queryString].join (''), function (req) {

		infoBlock.classList.remove ('pending');

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
			loadGithubRepoFiles (repo, li);
		});
		results.appendChild (li);
	});

}

function renderFileList (res, parent) {
	if (!parent) {
		var results = parent.querySelector ('ul.results');
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

			ViewEE.init (repoFile.html_url
				.replace (/^https\:\/\/github\.com/, "https://cdn.rawgit.com")
				.replace (/\/blob/, "")
			);

			var vieweeControls = document.querySelector ('.viewee .controls');
			
			vieweeControls.classList.add ('pending');

		});
		results.appendChild (li);
	});

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