import React, { Component } from 'react';
import { SafeAreaView, StyleSheet, Text } from "react-native";
import NormalCamera from './components/NormalCamera';

import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import * as tf from '@tensorflow/tfjs-core';

// Register WebGL backend.
import '@tensorflow/tfjs-backend-webgl';

interface AppProps {};
interface AppState {};

class App extends Component<AppProps, AppState> {
	constructor(props: AppProps) {
		super(props);
		this.state = {};
	}

	public render() {
		console.log("Rendering!");
		return <NormalCamera></NormalCamera>
	}
}

export default App;
