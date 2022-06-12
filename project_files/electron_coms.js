let ipcRenderer = null;

if (window.require) {
    const electron = window.require('electron');
    ipcRenderer = electron.ipcRenderer;
}

const resultCallbacks = {};

let CALLBACK_ID = 0;

if (ipcRenderer) {
    ipcRenderer.on('comsResponse', (event, { id, data }) => {	
    	if (!resultCallbacks[id]) {
    		console.log('no callback for id', id);
    		return;
    	}
    	const callback = resultCallbacks[id];
    	callback(data);
    	delete resultCallbacks[id];
    });
} else {
    const socket = new WebSocket('ws://localhost:8080');
    socket.addEventListener('message', (event) => {
        window.location.reload();
    });
}

export default {
	send: (command, data) => {
        if (ipcRenderer) {
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
        } else {
            // if no ipcRenderer, we're probably in a browser.
            
            return fetch(
                '/api',
                {
                    method: 'POST',
                    body: JSON.stringify({
                        command,
                        data,
                    }),
                    headers: {
                       'Content-Type': 'application/json',
                    },
                    cache: 'no-cache',
                }
            ).then((result) => {
                if (result.status === 404) {
                    return {
                        data: {
                            success: false,
                            message: "Unknown command " + command,
                        }
                    };
                }
                return result.json();
            }).then((result) => {
                return result.data;
            });
        }
	}
};
