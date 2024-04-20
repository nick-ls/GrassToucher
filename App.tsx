import React from 'react';
import { Component } from "react";
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import Section from './components/Section';

interface AppProps {}
interface AppState {}

class App extends Component<AppProps, AppState> {
	constructor(props: AppProps) {
		super(props);
		this.state = {};
	}

	public render() {
		return <SafeAreaView>
			<StatusBar barStyle="dark-content"/>
			<ScrollView contentInsetAdjustmentBehavior="automatic">
				<View>
					<Section title="Step One">
						SLKJF:LKSDJFLKSDJLFKJDSLKFJSLDKF
					</Section>
					<Section title="See Your Changes"></Section>
					<Section title="Debug"></Section>
					<Section title="Learn More">
						Read the docs to discover what to do next:
					</Section>
				</View>
			</ScrollView>
		</SafeAreaView>;
	}
}

export default App;
