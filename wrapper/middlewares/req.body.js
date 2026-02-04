const formidable = require("formidable");
const httpz = require("@octanuary/httpz")

module.exports = async function reqBody(req, res, next) {
	req.body = {};
	if (req.method == "POST")
		await new Promise((resolve, reject) =>
			new formidable.IncomingForm().parse(req, async (e, f, files) => {
				req.body = f;
				req.files = files;
				resolve();
			}
		));
	next();
};