import * as React from "react";
import {Component} from "react";
import { SafeAreaView, StyleSheet, Text } from "react-native";
import { Camera, CameraDevice, Frame, useCameraDevice } from "react-native-vision-camera";
import HandPetRecognizer from "../lib/HandModel";

interface NormalCameraProps {}
interface NormalCameraState {}

export default class NormalCamera extends Component<NormalCameraProps, NormalCameraState> {
	private device: CameraDevice | undefined;
	private cam: React.RefObject<Camera>;

	private handpet: HandPetRecognizer;

	constructor(props: NormalCameraProps) {
		super(props);
		this.state = {};

		this.handpet = new HandPetRecognizer();
		
		this.cam = React.createRef();
		this.initCamera.bind(this)();
	}

	private async initCamera() {
		if (Camera.getCameraPermissionStatus() !== "granted") {
			let result = await Camera.requestCameraPermission();
		}
		this.device = (await Camera.getAvailableCameraDevices()).filter(_=>_.position == "back")[0];

		this.setState({});
	}

	private async frameProcessor(frame: Frame) {
		console.log("slkdj");
		let score = await this.handpet.processImage(new Uint8Array(frame.toArrayBuffer()));
		console.log("YOUR SCORE: ", score);
	}

	public render() {
		return this.device ?
			<Camera 
				style={StyleSheet.absoluteFill}
				device={this.device}
				video={true}
				isActive={true}
				frameProcessor={{
					frameProcessor: this.frameProcessor.bind(this),
					type: "frame-processor"
				}}
				ref={this.cam}
			></Camera> : // or
			<Text>enable your camera fool</Text>;
	}
}
