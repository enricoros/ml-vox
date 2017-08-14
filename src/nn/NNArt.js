import React, {Component} from "react";
import {CPPN} from './cppn';

const MAT_WIDTH = 30;
const WEIGHTS_STDEV = .6;

/**
 * This component handles the React<>CPPN logic, and if an error is detected (i.e. not chrome), then it
 * propagates to the parent, which will remember it, and delete this component.
 */
class NNArtCanvas extends Component {
  isNotSupported = false;
  cppn = null;
  colorMode = 'bw';
  activationFunction = 'tanh';
  numLayers = 10; // [0...7] 3
  z1Scale = 1000; // [1 ... 1000] 100
  z2Scale = 1000; // [1 ... 1000] 100

  componentDidMount() {
    // apply CPPN to the canvas; the canvas is resized to the texture size, but the page size is governed
    // independently by the CSS style (see .NN-Art-Canvas in the css)
    const inferenceCanvas = this.refs['art-canvas-1'];
    if (!inferenceCanvas)
      return;
    try {
      this.cppn = new CPPN(inferenceCanvas);
    } catch (e) {
      this.isNotSupported = true;
      inferenceCanvas.style.display = 'none';
      this.props.setDisabled(true);
      return;
    }
    this.refreshOptions();
    this.refreshWeights();
    this.cppn.start();
  }

  componentWillUnmount() {
    this.cppn && this.cppn.stopInferenceLoop();
  }

  refreshOptions() {
    this.cppn.setColorMode(this.colorMode);
    this.cppn.setActivationFunction(this.activationFunction);
    this.cppn.setNumLayers(this.numLayers);
    this.cppn.setZ1Scale(this.z1Scale);
    this.cppn.setZ2Scale(this.z2Scale);
  }

  refreshWeights() {
    this.cppn && this.cppn.generateWeights(MAT_WIDTH, WEIGHTS_STDEV);
  }

  render() {
    if (this.isNotSupported)
      return <span/>;
    return <canvas className="NN-Art-Canvas" ref="art-canvas-1"/>;
  }
}

/**
 * This component acts as a click-Toggle to the other component
 */
class NNArt extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isDisabled: localStorage.getItem('disable_nn_art') === 'true'
    }
  }

  setDisabled(disabled) {
    localStorage.setItem('disable_nn_art', disabled);
    this.setState({
      isDisabled: disabled
    });
  }

  onClicked() {
    this.setDisabled(!this.state.isDisabled);
  }

  render() {
    return (
      <div className="NN-Art" onClick={this.onClicked.bind(this)}>
        {!this.state.isDisabled && <NNArtCanvas setDisabled={this.setDisabled.bind(this)}/>}
      </div>
    );
  }
}

export {NNArt};
