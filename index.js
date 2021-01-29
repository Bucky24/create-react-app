#!/usr/bin/env node

const readline = require('readline');
const path = require('path');
const fs = require("fs");
const { execSync } = require("child_process");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function getInput(prompt, def="") {
	return new Promise((resolve) => {
		let str = prompt;
		if (def !== "") {
			let defStr = def;
			if (def === true) {
				defStr = "yes";
			} else if (def === false) {
				defStr = "no";
			}
			str += ` [${defStr}]`;
		}
		str += ": ";
		rl.question(str, (answer) => {
			if (answer === "") {
				resolve(def);
			} else {
				const lower = answer.toLowerCase();
				if (lower === "yes" || lower === "y") {
					answer = true;
				} else if (lower === "no" || lower === "n") {
					answer = false;
				}
				resolve(answer);
			}
		});
	});
}

function copyFile(localFile, remoteDir, templateVars=[], destination=null) {
	console.log(`Copying ${destination || localFile}...`);
	const local = path.join(__dirname, localFile);
	let data = fs.readFileSync(local, 'utf8');
	for (const templateKey in templateVars) {
		const value = templateVars[templateKey];
		data = data.split(`{{${templateKey}}}`).join(value);
	}
	const fullPath = path.join(remoteDir, destination || localFile);
	if (fs.existsSync(fullPath)) {
		fs.unlinkSync(fullPath);
	}
	fs.writeFileSync(fullPath, data);
}

function processName(name) {
	return name.toLowerCase().split(" ").join("_");
}

(async () => {
	console.log("Create React App running from ", process.cwd());
	const directory = await getInput("Now creating react app. Enter directory", ".");
	let name = await getInput("Enter name", "React App");
	const npmName = processName(name);
	
	console.log(directory, name, npmName);
	
	const fullPath = path.resolve(process.cwd(), directory);
	console.log("Verifying directory", fullPath);

	
	const dir = fs.existsSync(fullPath);
	
	if (!dir) {
		console.log("Directory does not exist, creating it...");
		fs.mkdirSync(fullPath);
	}
	
	const contents = fs.readdirSync(fullPath);
	
	if (contents.length > 0) {
		const overwrite = await getInput("Directory not empty, continue (continuing will wipe the directory)?", false);
		if (!overwrite) {
			console.log("Cancelling creation.");
			process.exit(1);
		} else {
			for (const content of contents) {
				const full = path.join(fullPath, content);
				const stat = await fs.promises.lstat(full);
				const isFile = stat.isFile();
				
				if (isFile) {
					fs.unlinkSync(full);
				} else {
					fs.rmdirSync(full, { recursive: true });
				}
			}
		}
	}
	
	console.log("Moving into working directory...");
	process.chdir(fullPath);
	
	console.log("Initializing npm...");
	
	const packageJson = {
		name: npmName,
		version: '0.1.0',
		scripts: {
			start: 'webpack serve',
		},
	    devDependencies: {
	      "@babel/core": "^7.12.10",
	      "@babel/plugin-proposal-class-properties": "^7.12.1",
	      "@babel/preset-env": "^7.12.11",
	      "@babel/preset-react": "^7.12.10",
	      "@bucky24/react-canvas": "^1.6.5",
	      "@bucky24/react-canvas-map": "^0.6.2",
	      "babel-loader": "^8.2.2",
	      "css-loader": "^5.0.1",
	      "file-loader": "^6.2.0",
	      "html-webpack-plugin": "^4.5.1",
	      "style-loader": "^2.0.0",
	      "webpack": "^5.18.0",
	      "webpack-cli": "^4.4.0",
	      "webpack-dev-server": "^3.11.2"
	    },
		dependencies: {
	      "react": "^17.0.1",
	      "react-dom": "^17.0.1",
		},
	};
	
	const packageJsonString = JSON.stringify(packageJson, null, 4);
	const packageFile = path.join(fullPath, "package.json");
	fs.writeFileSync(packageFile, packageJsonString, 'utf8');
	
	console.log("Creating directory /src...");
	fs.mkdirSync(path.join(fullPath, 'src'));
	
	copyFile("webpack.config.js", fullPath);
	copyFile("index.tmpl.html", fullPath, {
		name,
	});
	copyFile("project_index.js", fullPath, {}, path.join("src", "index.js"));
	copyFile("App.js", fullPath, {
		name,
	}, path.join("src", "App.js"));
	copyFile("styles.css", fullPath, {}, path.join("src", "styles.css"));
	
	console.log("Installing packages...");
	execSync("npm install");
	
	rl.close();
})().catch((error) => {
	console.error(error);
	rl.close();
});