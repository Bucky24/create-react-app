#!/usr/bin/env node

const readline = require('readline');
const path = require('path');
const fs = require("fs");
const package = require("./package.json");

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

function copyFile(localFile, remoteDir, templateVars={}, destination=null) {
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
	const builder = await getInput("Webpack (w) or Vite (v)? (w)", "w");
	const npmName = processName(name);
	const useCanvas = await getInput("Use react canvas? (no)", false);
    const useElectron = await getInput("Use electron? (no)", false);
	let useBackend = false;
	let backendLang;

	if (!useElectron) {
		useBackend = await getInput("Generate full backend? (no)", false);
	}

	if (useBackend) {
		backendLang = (await getInput("Backend language Node (node) or PHP (php)? (default node)", "node")).toLowerCase();
	}
	
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
			start: "node index.js",
			postinstall: "npm run build",
		},
	    devDependencies: {},
		dependencies: {
			"prop-types": "15.7.2",
			"react": "17.0.1",
			"react-dom": "17.0.1",
		},
	};

	if (builder === "w") {
		packageJson.scripts.build = 'webpack';
		packageJson.scripts.dev = 'webpack serve';
		packageJson.devDependencies = {
			...packageJson.devDependencies,
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
			"webpack-cli": "4.10.0",
			"webpack-dev-server": "4.7.4"
	    };
	} else if (builder === "v") {
		packageJson.scripts.build = 'vite build';
		packageJson.scripts.dev = 'vite';
		packageJson.devDependencies = {
			...packageJson.devDependencies,
			"@vitejs/plugin-react": "^3.1.0",
			"vite": "^4.2.0"
	    };
	}

	if (useCanvas) {
		packageJson.dependencies["@bucky24/react-canvas"] = "1.7.0";
	}
    
    if (useElectron) {
        packageJson.scripts.dev = "NODE_ENV=development npm run build && NODE_ENV=development npm start";
        packageJson.scripts.start = "electron .";
        packageJson.devDependencies.electron = "15.3.5";
        packageJson.devDependencies['electron-builder'] = "23.3.3";
        packageJson.scripts.dev_web = "node server.js";
        packageJson.devDependencies.ws = '8.5.0';
		packageJson.scripts.dist = "npm run build && electron-builder -p never --win";
		packageJson.dependencies['express'] = '4.17.1';
    }

	if (useBackend) {
		if (backendLang === "node") {
			packageJson.scripts.start = "nodemon server/index.js";
			packageJson.dependencies.nodemon = "2.0.20";
			packageJson.dependencies['express'] = '4.17.1';
			packageJson.dependencies.cors = "2.8.5";
		} else if (backendLang === "php") {
			packageJson.dependencies['@bucky24/node-php'] = "0.6.15";
			packageJson.scripts.start = "node server/index.js";
		}
	}
	
	const packageJsonString = JSON.stringify(packageJson, null, 4);
	const packageFile = path.join(fullPath, "package.json");
	fs.writeFileSync(packageFile, packageJsonString, 'utf8');
	
	console.log("Creating directory /src...");
	fs.mkdirSync(path.join(fullPath, 'src'));

	const frontendTemplate = {
		name,
		jsx: `\treturn (<div className={styles.appRoot}>\n\t\tWelcome to ${name}\n\t</div>);`,
		importsTop: '',
		importsBottom: '',
		setupCode: '',
		styles: "import styles from './styles.css';",
	}

	if (useCanvas) {
		frontendTemplate.setupCode += `
	const [size, setSize] = useState({ width: 0, height: 0 });

	const resize = () => {
		setSize({
			width: window.innerWidth,
			height: innerHeight,
		});
	}

	useEffect(() => {
		window.addEventListener("resize", resize);
		resize();

		return () => {
			window.removeEventListener("resize", resize);
		}
	}, [])`;
		frontendTemplate.jsx = `
	return (<div className={styles.appRoot}>
		<Canvas width={size.width} height={size.height}>
			<Text x={size.width/2} y={size.height/2}>
				Welcome to ${name}
			</Text>
		</Canvas>
	</div>);`;
		frontendTemplate.importsTop += "import { Canvas, Text } from '@bucky24/react-canvas';\n";
	}

	if (useElectron) {
		frontendTemplate.importsBottom += "import Coms from './utils/coms';\n";
		frontendTemplate.setupCode += `
	useEffect(() => {
		Coms.send("ping", { foo: 'bar'}).then((results) => {
			console.log(results);
		});
	}, []);`;
	}

	if (useBackend) {
		frontendTemplate.importsBottom += "import callApi from './api';\n";
		frontendTemplate.setupCode += `
	useEffect(() => {
		callApi("GET", "ping").then((result) => {
			console.log("result from ping: ", result);
		});
	});`;
	}

	let ending = ".js"
	
	if (builder === "w") {
		copyFile("webpack.config.js", fullPath);
		copyFile("index.tmpl.html", fullPath, {
			name,
		});
	} else {
		copyFile("app_vite.config.js", fullPath, {}, "vite.config.js");
		copyFile("app_vite_index.html", fullPath, {
			name,
		}, "index.html");
		ending = ".jsx";
		frontendTemplate.styles = "import styles from './styles.module.css';";
	}
	copyFile("app_index.js", fullPath, {}, path.join("src", "index" + ending));
	copyFile("App.js", fullPath, frontendTemplate, path.join("src", "App" + ending));
	if (builder === "w") {
		copyFile("styles.css", fullPath, {}, path.join("src", "styles.css"));
	} else {
		copyFile("styles.css", fullPath, {}, path.join("src", "styles.module.css"));
	}
	copyFile("gitignore", fullPath, {}, path.join(".gitignore"));
    if (useElectron) {
		console.log("Creating directory /server...");
		fs.mkdirSync(path.join(fullPath, 'server'));	
    	console.log("Creating directory /src/utils...");
    	fs.mkdirSync(path.join(fullPath, 'src', 'utils'));

        copyFile("electron_commands.js", fullPath, {}, path.join("server", "commands.js"));
        copyFile("electron_coms.js", fullPath, {}, path.join("src", "utils", "coms.js"));
		if (builder === "w") {
        	copyFile("electron_server_webpack.js", fullPath, {}, "server.js");
			copyFile("electron_index_webpack.js", fullPath, {}, "index.js");
		} else if (builder === "v") {
        	copyFile("electron_server_vite.js", fullPath, {}, "server.js");
			copyFile("electron_index_vite.js", fullPath, {}, "index.js");
		}
    } else if (useBackend) {
		console.log("Creating directory /server...");
		copyFile("api.js", fullPath, {}, path.join("src", "api.js"));
		fs.mkdirSync(path.join(fullPath, 'server'));	
		if (backendLang === "node") {
    		copyFile("backend_index.js", fullPath, {}, path.join("server", "index.js"));
		} else {
			copyFile("backend_php_index.js", fullPath, {}, path.join("server", "index.js"));
			copyFile("backend_php_api.php", fullPath, {}, path.join("server", "api.php"));
			fs.mkdirSync(path.join(fullPath, 'server', 'actions'));
			copyFile("backend_php_ping.php", fullPath, {}, path.join("server", "actions", "ping.php"));
			copyFile("backend_php_api_handler.php", fullPath, {}, path.join("server", "api_handler.php"));
			copyFile("backend_php_htaccess", fullPath, {}, path.join("server", ".htaccess"));
		}
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
			build: 'babel src --out-dir build',
			prepublishOnly: "npm run build",
			basicExample: "webpack serve --config ./examples/basicExample/webpack.config.js",
		},
	    devDependencies: {
			"@babel/cli": "7.16.7",
			"@babel/core": "7.12.10",
			"@babel/plugin-proposal-class-properties": "7.12.1",
			"@babel/plugin-transform-react-jsx": "7.16.7",
			"@babel/preset-env": "7.12.11",
			"@babel/preset-react": "7.12.10",
			"babel-loader": "8.2.2",
			"css-loader": "5.0.1",
			"file-loader": "6.2.0",
			"html-webpack-plugin": "5.2.0",
			"style-loader": "2.0.0",
			"webpack": "5.74.0",
			"webpack-cli": "4.10.0",
			"webpack-dev-server": "4.7.4",
			"react-dom": "18.2.0",
			"react": "18.2.0"
	    },
		peerDependencies: {
			"react": "^18.x.x",
		},
		files: [
			'build',
		],
		main: './build/index.js',
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
	copyFile("babelrc", fullPath, {}, ".babelrc");
	copyFile("gitignore", fullPath, {}, ".gitignore");
}

(async () => {
	console.log("Version v" + package.version);
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