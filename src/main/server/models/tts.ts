import https from "https";
import voiceList from "../data/voices.json";
import fileUtil from "../utils/fileUtil"
import { Readable } from "stream";
import { URLSearchParams } from "url";

export default function processVoice(
	voiceName: string,
	text: string
): Promise<Buffer | Readable> {
	return new Promise(async (resolve, reject) => {
		const voice = voiceList.voices[voiceName];
		if (!voice) {
			return reject("Requested voice is not supported");
		}

		const cleanText = text.includes("#%") ? text.split("#%").pop() : text;

		try {
			switch (voice.source) {
				case "bing": {
					const body = new URLSearchParams({
						text: text,
						voice: voice.arg,
						service: "Bing Translator",
					}).toString();
					const req = https.request({
						hostname: "lazypy.ro",
						path: "/tts/request_tts.php",
						method: "POST",
						headers: {
							"Content-Type": "application/x-www-form-urlencoded",
							"Content-Length": Buffer.byteLength(body)
						}
					}, (res) => {
						let chunks = [];
						res.on("data", (chunk) => chunks.push(chunk));
						res.on("end", () => {
							try {
								const json = JSON.parse(Buffer.concat(chunks).toString());
								
								if (json.success !== true) {
									return reject(`Bing proxy error: ${json.error_msg || "Unknown error"}`);
								}
								https.get(json.audio_url, (audioRes) => {
									if (audioRes.statusCode !== 200) {
										return reject(`Bing audio download error: ${audioRes.statusCode}`);
									}
									resolve(audioRes);
								}).on("error", reject);
							} catch (e) {
								reject("Bing proxy error: Invalid JSON response from lazypy");
							}
						});
					});
					req.on("error", (e) => reject(`Network error: ${e.message}`));
					req.end(body);
					break;
				}
				case "cepstral": {
					https.get("https://www.cepstral.com/en/demos", (r) => {
						const cookie = r.headers["set-cookie"];
						if (!cookie) return reject("Cepstral error: Could not retrieve session cookie.");
						const q = new URLSearchParams({
							voiceText: text,
							voice: voice.arg,
							createTime: "666",
							rate: "170",
							pitch: "1",
							sfx: "none"
						}).toString();
						const req = https.get({
							hostname: "www.cepstral.com",
							path: `/demos/createAudio.php?${q}`,
							headers: { 
								"Cookie": cookie,
								"Referer": "https://www.cepstral.com",
								"X-Requested-With": "XMLHttpRequest" 
							}
						}, (r) => {
							let body = "";
							r.on("data", (chunk) => body += chunk);
							r.on("end", () => {
								try {
									const json = JSON.parse(body);
									if (!json.mp3_loc) return reject("Cepstral error: MP3 location not found in response.");
									https.get(`https://www.cepstral.com${json.mp3_loc}`, resolve).on("error", reject);
								} catch (e) {
									reject("Cepstral error: Invalid JSON response.");
								}
							});
						});
						req.on("error", reject);
					}).on("error", reject);
					break;
				}
				case "pollytwo": {
					const body = new URLSearchParams({
						msg: text,
						lang: voice.arg,
						source: "ttsmp3"
					}).toString();
					const req = https.request({
						hostname: "ttsmp3.com",
						path: "/makemp3_new.php",
						method: "POST",
						headers: { 
							"Content-Type": "application/x-www-form-urlencoded",
							"Content-Length": Buffer.byteLength(body)
						}
					}, (res) => {
						let chunks = [];
						res.on("data", (chunk) => chunks.push(chunk));
						res.on("end", () => {
							try {
								const json = JSON.parse(Buffer.concat(chunks).toString());
								if (json.Error === 1) return reject(json.Text);
								const audioUrl = json.URL.startsWith("https") ? json.URL : json.URL.replace("http", "https");
								https.get(audioUrl, resolve).on("error", reject);
							} catch (e) {
								reject("Invalid JSON from ttsmp3.com");
							}
						});
					});
					req.on("error", (e) => reject(`Network error: ${e.message}`));
					req.end(body);
					break;
				}
				case "readloud": {
					const body = new URLSearchParams({
						but1: text,
						butS: "0",
						butP: "0",
						butPauses: "0",
						butt0: "Submit",
					}).toString();
					const req = https.request({
						hostname: "readloud.net",
						path: voice.arg,
						method: "POST",
						headers: {
							"Content-Type": "application/x-www-form-urlencoded",
							"Content-Length": Buffer.byteLength(body),
							"User-Agent": "Mozilla/5.0"
						}
					}, (res) => {
						let buffers = [];
						res.on("error", reject);
						res.on("data", (chunk) => buffers.push(chunk));
						res.on("end", () => {
							const html = Buffer.concat(buffers).toString();
							const beg = html.indexOf("/tmp/");
							if (beg === -1) return reject("Readloud error: MP3 link not found in HTML");
							const end = html.indexOf(".mp3", beg) + 4;
							const sub = html.substring(beg, end).trim();
							if (sub.length > 0) {
								https.get(`https://readloud.net${sub}`, resolve).on("error", reject);
							} else {
								reject("Readloud error: Empty MP3 path");
							}
						});
					});
					req.on("error", reject);
					req.end(body);
					break;
				}
 				case "readaloud": {
					const body = JSON.stringify([{
						voiceId: voice.arg,
						ssml: `<speak version="1.0" xml:lang="${voice.lang}">${text}</speak>`
					}]);
					const req = https.request({
						hostname: "support.readaloud.app",
						path: "/ttstool/createParts",
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"Content-Length": Buffer.byteLength(body)
						}
					}, (res) => {
						let chunks = [];
						res.on("data", (d) => chunks.push(d));
						res.on("end", () => {
							try {
								const json = JSON.parse(Buffer.concat(chunks).toString());
								const fileId = json[0];
								if (!fileId) return reject("ReadAloud error: No part ID received");
								https.get({
									hostname: "support.readaloud.app",
									path: `/ttstool/getParts?q=${fileId}`,
									headers: { "Accept": "audio/mp3" }
								}, resolve).on("error", reject);

							} catch (e) {
								reject("ReadAloud error: Invalid JSON response");
							}
						});
					});
					req.on("error", (e) => reject(`Network error: ${e.message}`));
					req.end(body);
					break;
				}
				case "vocalware": {
					const [EID, LID, VID] = voice.arg;
					const q = new URLSearchParams({
						EID,
						LID,
						VID,
						TXT: text,
						EXT: "mp3",
						FNAME: "",
						ACC: "15679",
						SceneID: "2703396",
						HTTP_ERR: "",
					}).toString();
					const req = https.get({
						hostname: "cache-a.oddcast.com",
						path: `/tts/genB.php?${q}`,
						headers: {
							"Referer": "https://www.oddcast.com/",
							"Origin": "https://www.oddcast.com",
							"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
							"Accept": "*/*"
						}
					}, (audioRes) => {
						if (audioRes.statusCode !== 200) {
							return reject(`Vocalware Error: ${audioRes.statusCode}`);
						}
						resolve(audioRes);
					});
					req.on("error", (e) => reject(`Network error: ${e.message}`));
					break;
				}
				case "googletranslate": {
					const q = new URLSearchParams({
						ie: "UTF-8",
						total: "1",
						idx: "0",
						client: "tw-ob",
						q: text,
						tl: voice.arg,
					}).toString();
					https.get(`https://translate.google.com/translate_tts?${q}`, (audioRes) => {
						if (audioRes.statusCode !== 200) {
							return reject(`Google TTS error: ${audioRes.statusCode}`);
						}
						resolve(audioRes);
					}).on("error", (e) => reject(`Network error: ${e.message}`));
					break;
				}
 				case "cobaltspeech": {
					const q = new URLSearchParams({
						"text.text": text,
						"config.model_id": voice.lang,
						"config.speaker_id": voice.arg,
						"config.speech_rate": "1",
						"config.variation_scale": "0",
						"config.audio_format.codec": "AUDIO_CODEC_WAV"
					}).toString();
					https.get({
						hostname: "demo.cobaltspeech.com",
						path: `/voicegen/api/voicegen/v1/streaming-synthesize?${q}`,
						headers: { "Accept": "*/*" }
					}, (audioRes) => {
						if (audioRes.statusCode !== 200) {
							return reject(`Cobalt error: ${audioRes.statusCode}`);
						}
						fileUtil.convertToMp3(audioRes, "wav")
							.then(resolve)
							.catch((e) => reject(`Conversion error: ${e.message}`));

					}).on("error", (e) => reject(`Network error: ${e.message}`));
					break;
				}
 				case "sapi4": {
					const q = new URLSearchParams({
						text,
						voice: voice.arg
					}).toString();
					const req = https.get({
						hostname: "www.tetyys.com",
						path: `/SAPI4/SAPI4?${q}`,
						headers: { "Accept": "audio/wav" }
					}, (audioRes) => {
						if (audioRes.statusCode !== 200) {
							return reject(`SAPI4 error: ${audioRes.statusCode}`);
						}
						fileUtil.convertToMp3(audioRes, "wav")
							.then(resolve)
							.catch((e) => reject(`SAPI4 conversion error: ${e.message}`));

					});
					req.on("error", (e) => reject(`Network error: ${e.message}`));
					break;
				}
 				case "onecore": {
					const body = JSON.stringify([{
						voiceId: voice.arg,
						ssml: `<speak version="1.0" xml:lang="${voice.lang}">${text}</speak>`
					}]);
					const req = https.request({
						hostname: "support.readaloud.app",
						path: "/ttstool/createParts",
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"Content-Length": Buffer.byteLength(body)
						}
					}, (r) => {
						let chunks = [];
						r.on("data", (d) => chunks.push(d));
						r.on("error", reject);
						r.on("end", () => {
							try {
								const json = JSON.parse(Buffer.concat(chunks).toString());
								const fileId = json[0];
								if (!fileId) return reject("OneCore error: No part ID received");
								https.get({
									hostname: "support.readaloud.app",
									path: `/ttstool/getParts?q=${fileId}`,
									headers: { "Accept": "audio/mp3" }
								}, resolve).on("error", reject); //
							} catch (e) {
								reject("OneCore error: Invalid JSON response from support.readaloud.app");
							}
						});
					});
					req.on("error", (e) => reject(`Network error: ${e.message}`));
					req.end(body);
					break;
				}
				case "onecoretwo": {
					const q = new URLSearchParams({
						hl: voice.lang,
						c: "MP3",
						f: "16khz_16bit_stereo",
						v: voice.arg,
						src: text,
					}).toString();
					https.get(`https://api.voicerss.org/?key=83baa990727f47a89160431e874a8823&${q}`, (audioRes) => {
						if (audioRes.statusCode !== 200) {
							return reject(`VoiceRSS error: ${audioRes.statusCode}`);
						}
						resolve(audioRes);
					}).on("error", (e) => reject(`Network error: ${e.message}`));
					break;
				}
				case "svox": {
					const q = new URLSearchParams({
						speed: "0",
						apikey: "ispeech-listenbutton-betauserkey",
						text: text,
						action: "convert",
						voice: voice.arg,
						format: "mp3",
						e: "audio.mp3"
					}).toString();
					https.get(`https://api.ispeech.org/api/rest?${q}`, (audioRes) => {
						if (audioRes.statusCode !== 200) {
							return reject(`iSpeech error: ${audioRes.statusCode}`);
						}
						resolve(audioRes);
					}).on("error", (e) => reject(`Network error: ${e.message}`));
					break;
				}
				case "neospeechold": {
					const q = new URLSearchParams({
						speed: "0",
						apikey: "38fcab81215eb701f711df929b793a89",
						text: text,
						action: "convert",
						voice: voice.arg,
						format: "mp3",
						e: "audio.mp3"
					}).toString();
					https.get(`https://api.ispeech.org/api/rest?${q}`, (audioRes) => {
						if (audioRes.statusCode !== 200) {
							return reject(`Neospeech (iSpeech) error: ${audioRes.statusCode}`);
						}
						resolve(audioRes);
					}).on("error", (e) => reject(`Network error: ${e.message}`));
					break;
				}
				case "baidu": {
					const q = new URLSearchParams({
						lan: voice.arg,
						text: text,
						spd: "5",
						source: "web",
					}).toString();
					https.get({
						hostname: "fanyi.baidu.com",
						path: `/gettts?${q}`,
						headers: {
							"User-Agent": "Mozilla/5.0",
							"Referer": "https://fanyi.baidu.com"
						}
					}, (audioRes) => {
						if (audioRes.statusCode !== 200) {
							return reject(`Baidu Error: ${audioRes.statusCode}`);
						}
						resolve(audioRes);
					}).on("error", (e) => reject(`Network error: ${e.message}`));
					break;
				}
				case "tiktok": {
					const body = new URLSearchParams({
						text: text,
						voice: voice.arg,
						service: "TikTok",
					}).toString();

					const req = https.request({
						hostname: "lazypy.ro",
						path: "/tts/request_tts.php",
						method: "POST",
						headers: {
							"Content-Type": "application/x-www-form-urlencoded",
							"Content-Length": Buffer.byteLength(body)
						}
					}, (res) => {
						let chunks = [];
						res.on("data", (chunk) => chunks.push(chunk));
						res.on("end", () => {
							try {
								const json = JSON.parse(Buffer.concat(chunks).toString());
								
								if (json.success !== true) {
									return reject(`TikTok proxy error: ${json.error_msg || "Unknown error"}`);
								}

								https.get(json.audio_url, (audioRes) => {
									if (audioRes.statusCode !== 200) {
										return reject(`TikTok audio download error: ${audioRes.statusCode}`);
									}
									resolve(audioRes);
								}).on("error", reject);
								
							} catch (e) {
								reject("TikTok proxy error: Invalid JSON response from lazypy");
							}
						});
					});
					req.on("error", (e) => reject(`Network error: ${e.message}`));
					req.end(body);
					break;
				}
				
				default: {
					return reject("Not implemented");
				}
			}
		} catch (e) {
			return reject(e);
		}
	});
};
