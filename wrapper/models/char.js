const fs = require("fs");
const path = require("path");
const baseUrl = path.join(__dirname, "../../", process.env.CHAR_BASE_URL);
const folder = path.join(__dirname, "../../", process.env.ASSET_FOLDER);
const database = require("../../data/database"), DB = new database();
const fUtil = require("../../utils/fileUtil");

module.exports = {
	load(id) {
		try {
			try {
				return fs.readFileSync(path.join(folder, `${id}.xml`));
			} catch (err) { // stock characters
				const nId = (id.slice(0, -3) + "000").padStart(9, 0);
				const chars = fs.readFileSync(path.join(baseUrl, `${nId}.txt`));

				const line = chars
					.toString("utf8")
					.split("\n")
					.find((v) => v.substring(0, 3) == id.slice(-3));
				if (line) {
					return Buffer.from(line.substring(3));
				}
				throw new Error("Character not found");
			}	
		} catch (err) {
			throw new Error("Character not found");
		}
	},

	save(buf, info, isV2 = false) {
		// save asset info
		info.id = fUtil.generateId();
		DB.insert("assets", info);

		if (this.isFA(info.themeId) && !isV2) {
			const end = buf.indexOf(">", buf.indexOf("<cc_char"));
			buf = Buffer.concat([
				buf.subarray(0, end),
				Buffer.from(" version=\"2.0\""),
				buf.subarray(end)
			]);
		}

		fs.writeFileSync(path.join(folder, `${info.id}.xml`), buf);
		return info.id;
	},

	saveThumb(id, thumb) {
		fs.writeFileSync(path.join(folder, `${id}.png`), thumb);
		return;
	},

	getTheme(buffer) {
		const beg = buffer.indexOf(`theme_id="`) + 10;
		const end = buffer.indexOf(`"`, beg);
		return buffer.subarray(beg, end).toString();
	},

	isFA(themeId) {
		switch (themeId) {
			case "cctoonadventure":
			case "family":
				return false;
		}
		return true;
	}
}