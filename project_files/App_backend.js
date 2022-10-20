import React, { useEffect } from 'react';

import styles from './styles.css';

import callApi from './api';

export default function App() {
	useEffect(() => {
		callApi("GET", "ping").then((result) => {
			console.log("result from ping: ", result);
		});
	});

	return (<div className={styles.appRoot}>
		Welcome to React App
	</div>);
}