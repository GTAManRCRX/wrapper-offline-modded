const eta = require("eta");
const httpz = require("@octanuary/httpz")
const path = require("path");

module.exports = function resRender(req, res, next) {
    res.render = async (filename, data, config) => {
        const filepath = path.join(__dirname, "../views", filename);

        let object = { env: process.env };
        Object.assign(object, data);

		const file = Buffer.from(await eta.renderFile(filepath, object, config));
		res.end(file);
    };
    next();
};