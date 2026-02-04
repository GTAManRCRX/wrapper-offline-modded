const fs = require("fs");
const nodezip = require("node-zip");
const path = require("path");
const folder = path.join(__dirname, "../../", process.env.SAVED_FOLDER);
const base = Buffer.alloc(1, 0);
const database = require("../../data/database"), DB = new database();
const fUtil = require("../../utils/fileUtil");
const parse = require("../models/parse");

module.exports = {
	delete(id) {
		DB.delete("movies", id);

		fs.unlinkSync(path.join(folder, `${id}.xml`));
		fs.unlinkSync(path.join(folder, `${id}.png`));
	},

	async load(mId, isGet = true) {
		const filepath = path.join(folder, `${mId}.xml`);

		const buffer = fs.readFileSync(filepath);
		const parsed = await parse(buffer);
		return isGet ? parsed : Buffer.concat([base, parsed]);
	},

	async meta(id) {
		const filepath = path.join(folder, `${id}.xml`);
		const buffer = fs.readFileSync(filepath);

		var title = buffer.subarray(
			buffer.indexOf("<title>") + 16,
			buffer.indexOf("]]></title>")
		).toString().trim();

		if (title == "")
		{
		title = "Untitled";
		}
		const durBeg = buffer.indexOf('duration="') + 10;
		const duration = Number.parseFloat(buffer.subarray(
			durBeg,
			buffer.indexOf('"', durBeg)
		).toString().trim());
		const min = ('' + ~~(duration / 60)).padStart(2, '0');
		const sec = ('' + ~~(duration % 60)).padStart(2, '0');
		const durationStr = `${min}:${sec}`;

		let count = 0;
		let pos = buffer.indexOf('<scene id=');
		while (pos > -1) {
			count++;
			pos = buffer.indexOf('<scene id=', pos + 10);
		}

		return {
			id,
			duration,
			title,
			date: fs.statSync(filepath).mtime,
			durationString: durationStr,
			sceneCount: count,
		};
	},

	async save(body, thumb, id, starter) {
		return new Promise((resolve, reject) => {
			id ||= fUtil.generateId();

			if (thumb) {
				fs.writeFileSync(path.join(folder, `${id}.png`), thumb);
			}
			const zip = nodezip.unzip(body);
			const xmlStream = zip["movie.xml"].toReadStream();

			let writeStream = fs.createWriteStream(path.join(folder, `${id}.xml`));
			xmlStream.on("data", b => writeStream.write(b));
			xmlStream.on("end", async () => {
				writeStream.close((e) => {
					if (e) throw e;

					this.meta(id).then((meta) => {
						let type;
						const info = {
							id,
							duration: meta.durationString,
							date: meta.date,
							title: meta.title,
							sceneCount: meta.sceneCount,
						}
						if (starter) {
							info.type = "movie";
							type = "assets";
						} else {
							type = "movies";
						}

						try {
							DB.update(type, id, info);
						} catch (e) {
							console.log("This movie does not exist in the database. Inserting...", e);
							DB.insert(type, info);
						}
						resolve(id);
					});
				});
			});
		});
	},

	thumb(id) {
		const filepath = path.join(folder, `${id}.png`);
		if (fs.existsSync(filepath)) {
			const readStream = fs.createReadStream(filepath);
			return readStream;
		} else {
			throw new Error("Movie doesn't exist.");
		}
	},
}