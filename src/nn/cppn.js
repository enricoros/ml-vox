"use strict";
/* Copyright 2017 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/
Object.defineProperty(exports, "__esModule", { value: true });
var deeplearn_1 = require("deeplearn");
var nn_art_util = require("./nn_art_util");
var MAX_LAYERS = 10;
var colorModeOutputDimensions = {
    'rgb': 3,
    'rgba': 4,
    'hsv': 3,
    'hsva': 4,
    'yuv': 3,
    'yuva': 4,
    'bw': 1
};
var activationFunctionMap = {
    'tanh': function (math, ndarray) { return math.tanh(ndarray); },
    'sin': function (math, ndarray) { return math.sin(ndarray); },
    'relu': function (math, ndarray) { return math.relu(ndarray); },
    'step': function (math, ndarray) { return math.step(ndarray); }
};
var NUM_IMAGE_SPACE_VARIABLES = 3; // x, y, r
var NUM_LATENT_VARIABLES = 2;
var CPPN = (function () {
    function CPPN(inferenceCanvas) {
        this.inferenceCanvas = inferenceCanvas;
        this.weights = [];
        this.z1Counter = 0;
        this.z2Counter = 0;
        this.colorModeNames = ['rgb', 'rgba', 'hsv', 'hsva', 'yuv', 'yuva', 'bw'];
        this.isInferring = false;
        this.gl = deeplearn_1.gpgpu_util.createWebGLContext(this.inferenceCanvas);
        this.gpgpu = new deeplearn_1.GPGPUContext(this.gl);
        this.math = new deeplearn_1.NDArrayMathGPU(this.gpgpu);
        var maxTextureSize = deeplearn_1.webgl_util.queryMaxTextureSize(this.gl);
        var canvasSize = Math.floor(Math.sqrt(maxTextureSize));
        this.inferenceCanvas.width = canvasSize;
        this.inferenceCanvas.height = canvasSize;
        this.renderShader = nn_art_util.getRenderShader(this.gpgpu, canvasSize);
        this.addLatentVariablesShader = nn_art_util.getAddLatentVariablesShader(this.gpgpu, NUM_IMAGE_SPACE_VARIABLES);
        this.inputAtlas = nn_art_util.createInputAtlas(canvasSize, NUM_IMAGE_SPACE_VARIABLES, NUM_LATENT_VARIABLES);
    }
    CPPN.prototype.generateWeights = function (neuronsPerLayer, weightsStdev) {
        for (var i = 0; i < this.weights.length; i++) {
            this.weights[i].dispose();
        }
        this.weights = [];
        this.weights.push(deeplearn_1.Array2D.randTruncatedNormal([neuronsPerLayer, NUM_IMAGE_SPACE_VARIABLES + NUM_LATENT_VARIABLES], 0, weightsStdev));
        for (var i = 0; i < MAX_LAYERS; i++) {
            this.weights.push(deeplearn_1.Array2D.randTruncatedNormal([neuronsPerLayer, neuronsPerLayer], 0, weightsStdev));
        }
        this.weights.push(deeplearn_1.Array2D.randTruncatedNormal([4 /** max output channels */, neuronsPerLayer], 0, weightsStdev));
    };
    CPPN.prototype.setColorMode = function (colorMode) {
        this.selectedColorModeName = colorMode;
    };
    CPPN.prototype.setActivationFunction = function (activationFunction) {
        this.selectedActivationFunctionName = activationFunction;
    };
    CPPN.prototype.setNumLayers = function (numLayers) {
        this.numLayers = numLayers;
    };
    CPPN.prototype.setZ1Scale = function (z1Scale) {
        this.z1Scale = z1Scale;
    };
    CPPN.prototype.setZ2Scale = function (z2Scale) {
        this.z2Scale = z2Scale;
    };
    CPPN.prototype.start = function () {
        this.isInferring = true;
        this.runInferenceLoop();
    };
    CPPN.prototype.runInferenceLoop = function () {
        var _this = this;
        if (!this.isInferring) {
            return;
        }
        var colorModeIndex = this.colorModeNames.indexOf(this.selectedColorModeName);
        var outputDimensions = colorModeOutputDimensions[this.selectedColorModeName];
        this.z1Counter += 1 / this.z1Scale;
        this.z2Counter += 1 / this.z2Scale;
        var z1 = Math.sin(this.z1Counter);
        var z2 = Math.cos(this.z2Counter);
        var intermediateResults = [];
        // Add the latent variables.
        var addLatentVariablesResultTex = this.math.getTextureManager().acquireTexture(this.inputAtlas.shape);
        nn_art_util.addLatentVariables(this.gpgpu, this.addLatentVariablesShader, this.inputAtlas.getTexture(), addLatentVariablesResultTex, this.inputAtlas.shape, z1, z2);
        var inputAtlasWithLatentVariables = deeplearn_1.Array2D.make(this.inputAtlas.shape, {
            texture: addLatentVariablesResultTex,
            textureShapeRC: this.inputAtlas.shape
        });
        intermediateResults.push(inputAtlasWithLatentVariables);
        var lastOutput = inputAtlasWithLatentVariables;
        this.math.scope(function () {
            for (var i = 0; i < _this.numLayers; i++) {
                var matmulResult = _this.math.matMul(_this.weights[i], lastOutput);
                lastOutput = (i === _this.numLayers - 1) ?
                    _this.math.sigmoid(matmulResult) :
                    activationFunctionMap[_this.selectedActivationFunctionName](_this.math, matmulResult);
            }
            nn_art_util.render(_this.gpgpu, _this.renderShader, lastOutput.getTexture(), outputDimensions, colorModeIndex);
        });
        inputAtlasWithLatentVariables.dispose();
        requestAnimationFrame(function () { return _this.runInferenceLoop(); });
    };
    CPPN.prototype.stopInferenceLoop = function () {
        this.isInferring = false;
    };
    return CPPN;
}());
exports.CPPN = CPPN;
