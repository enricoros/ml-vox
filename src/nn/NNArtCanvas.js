import React, {Component} from "react";
import {CPPN} from './cppn';

const MAT_WIDTH = 10;
const WEIGHTS_STDEV = .6;

class NNArtCanvas extends Component {
  cppn = undefined;
  colorMode = 'bw';
  activationFunction = 'tanh';
  numLayers = 10; // [0...7] 3
  z1Scale = 100; // [1 ... 1000] 100
  z2Scale = 100; // [1 ... 1000] 100

  componentDidMount() {
    // apply CPPN to the canvas; the canvas is resized to the texture size, but the page size is governed
    // independently by the CSS style (see .NN-Art-Canvas in the css)
    const inferenceCanvas = this.refs['art-canvas-1'];
    this.cppn = new CPPN(inferenceCanvas);

    this.cppn.setColorMode(this.colorMode);
    this.cppn.setActivationFunction(this.activationFunction);
    this.cppn.setNumLayers(this.numLayers);
    this.cppn.setZ1Scale(this.z1Scale);
    this.cppn.setZ2Scale(this.z2Scale);

    this.cppn.generateWeights(MAT_WIDTH, WEIGHTS_STDEV);

    this.cppn.start();
  }

  componentWillUnmount() {
    this.cppn.stopInferenceLoop();
  }

  render() {
    return <canvas className="NN-Art-Canvas" ref="art-canvas-1"/>;
  }
}

export default NNArtCanvas;
