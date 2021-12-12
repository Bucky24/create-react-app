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
	const local = path.join(__dirname, "project_files", localFile);
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

async function createReactApp() {
	console.log("Create React App running from ", process.cwd());
	const directory = await getInput("Now creating react app. Enter directory", ".");
	let name = await getInput("Enter name", "React App");
	const npmName = processName(name);
	const useCanvas = await getInput("Use react canvas? (no)", false);
    const useElectron = await getInput("Use electron? (no)", false);
	
	//console.log(directory, name, npmName, useCanvas);
	
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
					fs.rmSync(full, { recursive: true });
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
			build: 'webpack',
			dev: 'webpack serve',
			start: "node index.js",
			postinstall: "npm run build",
		},
	    devDependencies: {
			"@babel/core": "7.12.10",
			"@babel/plugin-proposal-class-properties": "7.12.1",
			"@babel/preset-env": "7.12.11",
			"@babel/preset-react": "7.12.10",
			"babel-loader": "8.2.2",
			"css-loader": "5.0.1",
			"file-loader": "6.2.0",
			"html-webpack-plugin": "5.2.0",
			"style-loader": "2.0.0",
			"webpack": "5.24.2",
			"webpack-cli": "4.5.0",
			"webpack-dev-server": "4.3.1"
	    },
		dependencies: {
			"express": "4.17.1",
			"prop-types": "15.7.2",
			"react": "17.0.1",
			"react-dom": "17.0.1",
		},
	};

	if (useCanvas) {
		packageJson.dependencies["@bucky24/react-canvas"] = "1.7.0";
	}
    
    if (useElectron) {
        packageJson.scripts.dev = "NODE_ENV=development npm run build && NODE_ENV=development npm start";
        packageJson.scripts.start = "electron .";
        packageJson.dependencies.electron = "15.0.0";
    }
	
	const packageJsonString = JSON.stringify(packageJson, null, 4);
	const packageFile = path.join(fullPath, "package.json");
	fs.writeFileSync(packageFile, packageJsonString, 'utf8');
	
	console.log("Creating directory /src...");
	fs.mkdirSync(path.join(fullPath, 'src'));
	
	copyFile("webpack.config.js", fullPath);
	copyFile("index.tmpl.html", fullPath, {
		name,
	});
	copyFile("app_index.js", fullPath, {}, path.join("src", "index.js"));
	if (useCanvas && !useElectron) {
		copyFile("App_canvas.js", fullPath, {
			name,
		}, path.join("src", "App.js"));
	} else if (useCanvas && useElectron) {
		copyFile("App_canvas_electron.js", fullPath, {
			name,
		}, path.join("src", "App.js"));
	} else if (!useCanvas && useElectron) {
		copyFile("App_electron.js", fullPath, {
			name,
		}, path.join("src", "App.js"));
	} else {
		copyFile("App.js", fullPath, {
			name,
		}, path.join("src", "App.js"));
	}
	copyFile("styles.css", fullPath, {}, path.join("src", "styles.css"));
	copyFile("gitignore", fullPath, {}, path.join(".gitignore"));
    if (useElectron) {
    	console.log("Creating directory /server...");
    	fs.mkdirSync(path.join(fullPath, 'server'));
    	console.log("Creating directory /src/utils...");
    	fs.mkdirSync(path.join(fullPath, 'src', 'utils'));

        copyFile("electron_index.js", fullPath, {}, "index.js");
        copyFile("electron_commands.js", fullPath, {}, path.join("server", "commands.js"));
        copyFile("electron_coms.js", fullPath, {}, path.join("src", "utils", "coms.js"));
    } else {
    	copyFile("project_index.js", fullPath, {}, "index.js");
    }
	
	// console.log("Installing packages (this may take a while)...");
	// execSync("npm install");
}

async function createReactLib() {
	console.log("Create React Library running from ", process.cwd());
	const directory = await getInput("Now creating react library. Enter directory", ".");
	let name = await getInput("Enter name", "React Library");
	const npmName = processName(name);
	
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
					fs.rmSync(full, { recursive: true });
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
			build: 'babel',
			publish: "npm run build; npm publish",
			basicExample: "webpack serve --config ./examples/basicExample/webpack.config.js",
		},
	    devDependencies: {
			"@babel/core": "7.12.10",
			"@babel/plugin-proposal-class-properties": "7.12.1",
			"@babel/preset-env": "7.12.11",
			"@babel/preset-react": "7.12.10",
			"babel-loader": "8.2.2",
			"css-loader": "5.0.1",
			"file-loader": "6.2.0",
			"html-webpack-plugin": "5.2.0",
			"style-loader": "2.0.0",
			"webpack": "5.24.2",
			"webpack-cli": "4.9.0",
			"webpack-dev-server": "4.3.1",
			"react-dom": "17.0.1",
	    },
		dependencies: {
			"prop-types": "15.7.2",
			"react": "17.0.1",
		},
		files: [
			'src',
		],
		main: './src/index.js',
	};
	
	const packageJsonString = JSON.stringify(packageJson, null, 4);
	const packageFile = path.join(fullPath, "package.json");
	fs.writeFileSync(packageFile, packageJsonString, 'utf8');
	
	console.log("Creating directory /src...");
	fs.mkdirSync(path.join(fullPath, 'src'));

	copyFile("Lib_index.js", path.join(fullPath, 'src'), {} , "index.js");

	console.log("Creating directory /examples");
	const examplesPath = path.join(fullPath, 'examples');
	fs.mkdirSync(examplesPath);

	copyFile("Lib_webpack.config.base.js", examplesPath, {
		module_name: npmName,
	}, "webpack.config.base.js");

	console.log("Creating basic example");
	const basicExamplePath = path.join(examplesPath, 'basicExample');
	fs.mkdirSync(basicExamplePath);

	copyFile("Lib_webpack.config.js", basicExamplePath, {}, "webpack.config.js");
	copyFile("index.tmpl.html", basicExamplePath, {
		name: `${name} - Basic Example`,
	});
	copyFile("app_index.js", basicExamplePath, {}, "index.js");
	copyFile("App.js", basicExamplePath, {
		name,
	}, "App.js");
	copyFile("styles.css", basicExamplePath);
}

(async () => {
	const type = await getInput("What are you creating? React App (app, default), or React Library (lib)?", "app");
	if (type === "app") {
		await createReactApp();
	} else if (type === "lib") {
		await createReactLib();
	} else {
		console.log("unknown type");
	}

	rl.close();
})().catch((error) => {
	console.error(error);
	rl.close();
});