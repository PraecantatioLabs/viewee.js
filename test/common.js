var path = require ('path');

function baseName (modulePath) {
	return path.basename (modulePath, path.extname (modulePath));
}

module.exports = {
	baseName: baseName
};
