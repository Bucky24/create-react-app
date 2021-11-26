import React, { useEffect } from 'react';

import styles from './styles.css';

import Coms from './utils/coms';

export default function App() {
    useEffect(() => {
        Coms.send("ping", { foo: 'bar'}).then((results) => {
            console.log(results);
        });
    }, []);

	return (<div className={styles.appRoot}>
		Welcome to {{name}}
	</div>);
}