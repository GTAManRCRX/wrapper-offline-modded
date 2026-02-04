const fs = require("fs");
const path = require("path");
const folder = path.join(__dirname, "../../", process.env.CACHÉ_FOLDER);

module.exports = {
	load(id) {
		const match = fs.readdirSync(folder)
			.find(file => file.includes(`${id}.wf`));
		return match ? fs.readFileSync(path.join(folder, match)) : null;
	},

	save(wf, id) {
		fs.writeFileSync(path.join(folder, `${id}.wf`), wf);
		return true;
	}
};