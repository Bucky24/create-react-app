const electron = require('electron');

const {
	BrowserWindow,
	screen,
	app,
	ipcMain: ipc,
} = electron;
 
app.on('ready', () => {
	const test = process.env.NODE_ENV === 'development';
	const { width, height } = screen.getPrimaryDisplay().workAreaSize;
	let normalWidth = test ? width/2 + 500 : width/2;
	
	mainWindow = new BrowserWindow({
    	height: height/3,
    	width: normalWidth,
		webPreferences: {
			nodeIntegration: true
		}
  	});

	// load the local HTML file
	let url = require('url').format({
		protocol: 'file',
		slashes: true,
		pathname: require('path').join(__dirname, '/build/index.html')
	})
	//console.log(url)
	mainWindow.loadURL(url)
	if (test) {
		mainWindow.webContents.openDevTools();
	}
})