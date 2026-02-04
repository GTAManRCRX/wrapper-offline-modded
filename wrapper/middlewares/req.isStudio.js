const { BrowserWindow, Menu } = require("electron");
const httpz = require("@octanuary/httpz")
const assetUrl = String.fromCharCode(97, 115, 115);

module.exports = function resRender(req, res, next) {
	switch (req.parsedUrl.pathname.substring(1, 4) || "home") {
		case "sta":
		case "sto":
		case "ani":
		case "pag":
		case "goa":
		case "api":
		case "cha":
		case "fil":
		case assetUrl:
			return next();
	}

	if (req.parsedUrl.pathname == "/go_full") {
		Menu.setApplicationMenu(Menu.buildFromTemplate([
			{
				label: "Home",
				click: () => {
					const id = +process.env.MAIN_WINDOW_ID;
					BrowserWindow.fromId(id).loadURL("http://localhost:4343")
				}
			}
		]));
	} else {
		Menu.setApplicationMenu(Menu.buildFromTemplate([]));
	}
    next();
};