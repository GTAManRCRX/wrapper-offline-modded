const httpz = require("@octanuary/httpz")
const header = process.env.XML_HEADER;
const database = require("../../data/database"), DB = new database();
const DB2 = new database(true);

const group = new httpz.Group();

group
	.route("POST", /\/goapi\/assignwatermark\/movie\/([\S]+)\/([\S]+)/, (req, res) => {
		const mId = req.matches[1];
		let wId = req.matches[2];

		try {
			if (wId == "0dhteqDBt5nY") wId = undefined;
			DB.update("movies", mId, { watermark: wId });
			res.end("0");
		} catch (e) {
			console.log("Error assigning watermark:", e);
			res.end("1");
		}
	})
	.route("POST", "/goapi/getUserWatermarks/", (req, res) => {
		const mId = req.body.movieId;

		let wId;
		try {
			wId = DB.get("movies", mId).data.watermark || "what";
		} catch (e) {
			wId = "what";
		}
		const list = DB.select("assets", { type: "watermark" });
		res.setHeader("Content-Type", "application/xml");
		res.end(`${header}<watermarks>${
			list.map((w) => `<watermark id="${w.id}" thumbnail="/assets/${w.id}"/>`).join("")
		}${wId != "what" ? `<preview>${wId}</preview>` : ""}</watermarks>`);
	})
	.route("POST", "/goapi/getMovieInfo/", (req, res) => {
		const mId = req.body.movieId;

		const wId = DB.get("movies", mId).data.watermark;
		res.setHeader("Content-Type", "application/xml");
		res.end(`${header}<watermarks>${
			typeof wId == "undefined" ?
				// no watermark
				`<watermark style="octanuary"/>` : wId == "0vTLbQy9hG7k" ?
					"" :
					`<watermark>/assets/${wId}</watermark>`
		}</watermarks>`);
	});

module.exports = group;