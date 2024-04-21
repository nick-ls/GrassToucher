/**
 * @license
 * Copyright 2021 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import React, { useRef, useEffect, useState } from 'react';
import { Text, View, Alert } from 'react-native';
import '@tensorflow/tfjs-backend-webgl';
import * as mpHands from '@mediapipe/hands';
import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';
import * as handdetection from '@tensorflow-models/hand-pose-detection';

import {Camera} from './camera';
import {setupDatGui} from './option_panel';
import {STATE} from './shared/params';
import {setupStats} from './shared/stats_panel';
import {setBackendAndEnvFlags} from './shared/util';

tfjsWasm.setWasmPaths(
  `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${
      tfjsWasm.version_wasm}/dist/`);

let detector, camera, stats;
let startInferenceTime, numInferences = 0;
let inferenceTimeSum = 0, lastPanelUpdate = 0;
let rafId;

async function createDetector() {
  switch (STATE.model) {
    case handdetection.SupportedModels.MediaPipeHands:
      const runtime = STATE.backend.split('-')[0];
      if (runtime === 'mediapipe') {
        return handdetection.createDetector(STATE.model, {
          runtime,
          modelType: STATE.modelConfig.type,
          maxHands: STATE.modelConfig.maxNumHands,
          solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${mpHands.VERSION}`
        });
      } else if (runtime === 'tfjs') {
        return handdetection.createDetector(STATE.model, {
          runtime,
          modelType: STATE.modelConfig.type,
          maxHands: STATE.modelConfig.maxNumHands
        });
      }
  }
}

async function checkGuiUpdate() {
  if (STATE.isTargetFPSChanged || STATE.isSizeOptionChanged) {
    camera = await Camera.setupCamera(STATE.camera);
    STATE.isTargetFPSChanged = false;
    STATE.isSizeOptionChanged = false;
  }

  if (STATE.isModelChanged || STATE.isFlagChanged || STATE.isBackendChanged) {
    STATE.isModelChanged = true;

    window.cancelAnimationFrame(rafId);

    if (detector != null) {
      detector.dispose();
    }

    if (STATE.isFlagChanged || STATE.isBackendChanged) {
      await setBackendAndEnvFlags(STATE.flags, STATE.backend);
    }

    try {
      detector = await createDetector(STATE.model);
    } catch (error) {
      detector = null;
      alert(error);
    }

    STATE.isFlagChanged = false;
    STATE.isBackendChanged = false;
    STATE.isModelChanged = false;
  }
}

function beginEstimateHandsStats() {
  startInferenceTime = (performance || Date).now();
}

function endEstimateHandsStats() {
  const endInferenceTime = (performance || Date).now();
  inferenceTimeSum += endInferenceTime - startInferenceTime;
  ++numInferences;

  const panelUpdateMilliseconds = 1000;
  if (endInferenceTime - lastPanelUpdate >= panelUpdateMilliseconds) {
    const averageInferenceTime = inferenceTimeSum / numInferences;
    inferenceTimeSum = 0;
    numInferences = 0;
    stats.customFpsPanel.update(
        1000.0 / averageInferenceTime, 120 /* maxValue */);
    lastPanelUpdate = endInferenceTime;
  }
}

var startTime, endTime;
var badPosture;
var soundPlayer = new Audio('https://soundbible.com/mp3/glass_ping-Go445-1207030150.mp3');
async function renderResult() {
  if (camera.video.readyState < 2) {
    await new Promise((resolve) => {
      camera.video.onloadeddata = () => {
        resolve(video);
      };
    });
  }

  let hands = null;

  // Detector can be null if initialization failed (for example when loading
  // from a URL that does not exist).
  if (detector != null) {
    // FPS only counts the time it takes to finish estimateHands.
    beginEstimateHandsStats();

    // Detectors can throw errors, for example when using custom URLs that
    // contain a model that doesn't provide the expected output.
    try {
      hands = await detector.estimateHands(
          camera.video,
          {flipHorizontal: false});
    } catch (error) {
      detector.dispose();
      detector = null;
      alert(error);
    }

    endEstimateHandsStats();
  }

  camera.drawCtx();

  // The null check makes sure the UI is not in the middle of changing to a
  // different model. If during model change, the result is from an old model,
  // which shouldn't be rendered.
  let degOut = document.getElementById("degree-output");
  let timeOut = document.getElementById("bad-posture");
  if (hands && hands.length > 0 && !STATE.isModelChanged) {
    camera.drawResults(hands);
    let degree = degreePoints(hands, 0, 9);
    degree = degree.toFixed(5);
    if (degree >= 30) {
      if (badPosture) {
        endTime = new Date();
        var timeDiff = (endTime - startTime) / 1000;
        timeDiff = timeDiff.toFixed(3);
        timeOut.innerHTML = `Bad posture held for: ${timeDiff}`;
        if (timeDiff >= 5) {
          console.log("uh oh spaghettio");
          soundPlayer.play()
        }
      } else {
        badPosture = true;
        startTime = new Date();
      }
    } else {
      badPosture = false;
      timeOut.innerHTML = `Bad posture held for: 0`;
      soundPlayer.pause();
      soundPlayer.currentTime = 0;
    }
    degOut.innerHTML = `Degree between wrist and middle knuckle: ${degree}`;

    console.log(degree);
  }
}

function degreePoints(hands, num_1, num_2) {
  let wrist = hands[0].keypoints3D[num_1];
  let mpc = hands[0].keypoints3D[num_2];
  let height = Math.abs(wrist.y - mpc.y);
  let s = Math.sqrt((wrist.x - mpc.x) * (wrist.x - mpc.x)
                    + (wrist.z - mpc.z) * (wrist.z - mpc.z));
  return 180 / Math.PI * Math.atan(height / s);
}

async function renderPrediction() {
  await checkGuiUpdate();

  if (!STATE.isModelChanged) {
    await renderResult();
  }

  rafId = requestAnimationFrame(renderPrediction);
};

const App = () => {
  useEffect(() => {
    const appInit = async () => {
      // Gui content will change depending on which model is in the query string.
      const urlParams = new URLSearchParams(window.location.search);
      if (!urlParams.has('model')) {
        urlParams.set('model', 'mediapipe_hands');
        window.location.search = urlParams;
        return;
      }

      await setupDatGui(urlParams);

      stats = setupStats();

      camera = await Camera.setupCamera(STATE.camera);

      await setBackendAndEnvFlags(STATE.flags, STATE.backend);

      detector = await createDetector();

      renderPrediction();
    };

    appInit();

    return () => {

    };
  }, []);
  
  return (
    <View>
        <Text>Hello React Native!</Text>
    </View>
);
};

export default App;