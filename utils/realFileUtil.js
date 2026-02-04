const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(require("@ffmpeg-installer/ffmpeg").path);
const mp3Duration = require("mp3-duration");
const sharp = require("sharp");

module.exports = {
	mp3Duration(data) {
		return new Promise((res, rej) => {
			mp3Duration(data, async (e, duration) => {
				if (e || !duration) rej(e);
				const dur = duration * 1e3;
				res(dur);
			});
		});
	},
	
	convertToMp3(data, ext) {
		return new Promise((resolve, rej) => {
			const command = ffmpeg(data)
				.inputFormat(ext)
				.toFormat("mp3")
                .audioBitrate('44100k')
				.on("error", (e) => rej("Error converting audio:", e));
			resolve(command.pipe());
		});
	},

	resizeImage(data, width, height) {
		return new Promise((resolve, rej) => {
			const stream = sharp(data)
				.resize(width, height, { fit: "fill" });
			resolve(stream);
		});
	},
};