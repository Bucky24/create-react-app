const { ipcRenderer } = window.require('electron');

const resultCallbacks = {};

let CALLBACK_ID = 0;

ipcRenderer.on('comsResponse', (event, { id, data }) => {	
	if (!resultCallbacks[id]) {
		console.log('no callback for id', id);
		return;
	}
	const callback = resultCallbacks[id];
	callback(data);
	delete resultCallbacks[id];
});

export default {
	send: (command, data) => {
		const myID = CALLBACK_ID;
		CALLBACK_ID++;
		return new Promise((resolve) => {
		
			resultCallbacks[myID] = (data) => {
				try {
					resolve(data);
				} catch (error) {
					console.error(error);
				}
			};
		
			console.log('sending command', command, 'with id', myID);
			ipcRenderer.send('comsCommand', {
				command,
				data,
				id: myID
			});
		});
	}
};
