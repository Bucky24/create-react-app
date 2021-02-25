import React, { useEffect, useState } from 'react';
import { Canvas, Text } from '@bucky24/react-canvas';

import styles from './styles.css';

export default function App() {
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
    }, [])

	return (<div className={styles.appRoot}>
		<Canvas width={size.width} height={size.height}>
            <Text x={size.width/2} y={size.height/2}>
                Welcome to test app
            </Text>
        </Canvas>
	</div>);
}