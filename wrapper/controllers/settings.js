const httpz = require("@octanuary/httpz")
const database = require("../../data/database"), DB = new database(true);

const group = new httpz.Group();

group
	.route("GET", "/api/settings/list", (req, res) => {
		res.json(DB.select());
	})
	.route("POST", "/api/settings/update", (req, res) => {
		const { setting } = req.body;
		const value = req.body.value == "true" ? true : 
			req.body.value == "false" ? false : req.body.value;
		res.assert(
			setting,
			typeof value != "undefined",
			400, { status: "error" }
		);

		const db = DB.select();
		res.assert(setting in db, 400, { status: "error" });

		db[setting] = value;
		DB.save(db);
		res.json({ status: "ok" });
	});

module.exports = group;