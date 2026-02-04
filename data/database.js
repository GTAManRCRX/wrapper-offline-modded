const fs = require("fs");
const path = require("path");
const folder = path.join(__dirname, "../", process.env.SAVED_FOLDER);
let baseDb;

module.exports = class GoDatabase {
	constructor(isSettings = false) {
		if (isSettings) {
			this.path = path.join(folder, "settings.json");
			baseDb = {
				DISCORD_RPC: false,
				TRUNCATED_THEMELIST: true,
				SHOW_WAVEFORMS: true,
				IS_WIDE: "1"
			};
		} else {
			this.path = path.join(folder, "database.json");
			baseDb = { assets: [], movies: [] };
		}
		if (!fs.existsSync(this.path)) {
			console.error("Database doesn't exist! Creating...");
			this.save(baseDb);

			try {
				this.#refresh();
			} catch (e) {
				throw new Error("Something is extremely awfully horribly terribly preposterously crazily insanely madly wrong. You may be in a read-only system/admin folder.");
			}
		}
	}

	#refresh() {
		const data = fs.readFileSync(this.path);
		this.json = JSON.parse(data);
	}

	save(newData) {
		try {
			fs.writeFileSync(this.path, JSON.stringify(newData, null, "\t"));
			return true;
		} catch (err) {
			console.error("Error saving DB:", err);
			return false;
		}
	}

	delete(from, id) {
		const { index } = this.get(from, id);

		this.json[from].splice(index, 1);
		this.save(this.json);
	}

	get(from, id) {
		if (!from || !id) {
			throw new Error("Must input a category to select from or an ID to look for");
		}

		this.#refresh();
		/** @type {Array} */
		const json = this.json[from];
		let index;

		const object = json.find((i, ind) => {
			if (i.id == id) {
				index = ind;
				return true;
			}
		});

		if (!object) {
			throw new Error("Field not found");
		}

		return {
			data: object,
			index
		};
	}

	insert(into, data) {
		this.#refresh();
		this.json[into].unshift(data);
		this.save(this.json);
	}

	select(from, where) {
		this.#refresh();

		let json;
		if (from) {
			json = this.json[from];
			const filtered = json.filter((val) => {
				for (const [key, value] of Object.entries(where || {})) {
					if (val[key] && val[key] != value) {
						return false;
					}
				}
				return true;
			});
			return filtered;
		}
		return this.json;
	}

	update(from, id, data) {
		if (!data) {
			throw new Error("Must input new data to save");
		}

		const { index } = this.get(from, id);

		Object.assign(this.json[from][index], data);
		this.save(this.json);
	}
};