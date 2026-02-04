const fs = require("fs");
const { join } = require("path");

const searchDirs = ["sharp"];

searchDirs.forEach((dir) => {
    const path = join(__dirname, "../node_modules", dir);
    fs.readdirSync(
        path, 
        {
            recursive: true
        }
    )
    .filter((val) => val.endsWith(".js"))
    .forEach((dir) => {
        const newpath = join(path, dir);
        const contents = fs.readFileSync(newpath).toString();
        fs.writeFileSync(newpath, contents.replaceAll("node:", ""));
    });
});