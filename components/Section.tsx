import * as React from "react";
import { Component} from "react";
import { Text, View } from "react-native";

interface SectionProps extends React.PropsWithChildren {
	title: string;
}
interface SectionState {}

export default class Section extends Component<SectionProps, SectionState> {
	constructor(props: SectionProps) {
		super(props);
		this.state = {};
	}

	public render() {
		return <View>
			<Text>{this.props.title}</Text>
			<Text>{this.props.children}</Text>
		</View>;
	}
}
