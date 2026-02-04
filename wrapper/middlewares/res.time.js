const httpz = require("@octanuary/httpz")

module.exports = async function(req, res, next) {
	const start = Date.now();
	await next();
	const duration = Date.now() - start;
	console.log(`${req.method} ${req.url} - ${res.statusCode} ${duration}ms`);
};