class TempStorage {
	private static _instance:TempStorage;
	private storage:Map<any, any>;

	constructor() {
		this.storage = new Map();
	}

	static get instance() {
		if (!this._instance) {
			this._instance = new TempStorage();
		}
		return this._instance;
	}

	public store(key:any, value:any) {
		this.storage.set(key, value);
	}

	public retrieve(key:any) {
		const value = this.storage.get(key);
		this.storage.delete(key);
		return value;
	}
}

export default function useTempStorage() {
	return TempStorage.instance;
};