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
function createInputAtlas(imageSize, inputNumDimensions, numLatentVariables) {
    var coords = new Float32Array(imageSize * imageSize * (inputNumDimensions + numLatentVariables));
    var dst = 0;
    for (var d = 0; d < inputNumDimensions + numLatentVariables; d++) {
        for (var i = 0; i < imageSize * imageSize; i++) {
            var x = i % imageSize;
            var y = Math.floor(i / imageSize);
            var coord = imagePixelToNormalizedCoord(x, y, imageSize, imageSize, numLatentVariables);
            coords[dst++] = coord[d];
        }
    }
    return deeplearn_1.Array2D.new([inputNumDimensions + numLatentVariables, imageSize * imageSize], coords);
}
exports.createInputAtlas = createInputAtlas;
function getAddLatentVariablesShader(gpgpu, inputNumDimensions) {
    var fragmentShaderSource = "\n    precision highp float;\n    uniform sampler2D source;\n    varying vec2 resultUV;\n\n    uniform vec2 z;\n\n    const vec2 halfCR = vec2(0.5, 0.5);\n\n    void main() {\n      vec2 outputCR = floor(gl_FragCoord.xy);\n      if (outputCR[1] == " + inputNumDimensions + ".0) {\n        gl_FragColor = vec4(z[0], 0, 0, 0);\n      } else if (outputCR[1] > " + inputNumDimensions + ".0) {\n        gl_FragColor = vec4(z[1], 0, 0, 0);\n      } else {\n        gl_FragColor = texture2D(source, resultUV);\n      }\n    }";
    return gpgpu.createProgram(fragmentShaderSource);
}
exports.getAddLatentVariablesShader = getAddLatentVariablesShader;
function addLatentVariables(gpgpu, addZShader, sourceTex, resultTex, shapeRowCol, z1, z2) {
    gpgpu.setOutputMatrixTexture(resultTex, shapeRowCol[0], shapeRowCol[1]);
    gpgpu.setProgram(addZShader);
    gpgpu.setInputMatrixTexture(sourceTex, 'source', 0);
    var zLoc = gpgpu.getUniformLocation('z');
    gpgpu.gl.uniform2f(zLoc, z1, z2);
    gpgpu.executeProgram();
}
exports.addLatentVariables = addLatentVariables;
function getRenderShader(gpgpu, imageSize) {
    var fragmentShaderSource = "\n    precision highp float;\n    uniform sampler2D source;\n    varying vec2 resultUV;\n\n    uniform int colorMode;\n    uniform float outputNumDimensions;\n\n    const float destinationSize = " + imageSize + ".0;\n\n    const mat3 yuv2rgb = mat3(\n          1,       1,     1,\n          0, -.34413, 1.772,\n      1.402, -.71414,     0);\n\n    vec3 hsv2rgb(vec3 c) {\n      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);\n      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);\n      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);\n    }\n\n    void main() {\n      vec2 outputCR = floor(gl_FragCoord.xy);\n      float inputC = outputCR.y * destinationSize + outputCR.x;\n      float u = (inputC + 0.5) / " + imageSize * imageSize + ".0;\n\n      vec4 inputR = vec4(0.0, 1.0, 2.0, 3.0);\n      vec4 v = (inputR + 0.5) / outputNumDimensions;\n\n      vec4 values = vec4(\n        texture2D(source, vec2(u, v[0])).r,\n        texture2D(source, vec2(u, v[1])).r,\n        texture2D(source, vec2(u, v[2])).r,\n        texture2D(source, vec2(u, v[3])).r);\n\n      if (colorMode == 0) {\n        // RGB\n        gl_FragColor = vec4(values.rgb, 1.0);\n      } else if (colorMode == 1) {\n        // RGBA\n        gl_FragColor = values;\n      } else if (colorMode == 2) {\n        // HSV\n        vec3 rgb = hsv2rgb(values.rgb);\n        gl_FragColor = vec4(rgb, 1.0);\n      } else if (colorMode == 3) {\n        // HSVA\n        vec3 rgb = hsv2rgb(values.rgb);\n        gl_FragColor = vec4(rgb, values[3]);\n      } else if (colorMode == 4 || colorMode == 5) {\n        // YUV\n        values[0] = clamp(values[0], 0.2, 0.8);\n        values[1] = values[1] - 0.5;\n        values[2] = values[2] - 0.5;\n        vec3 rgb = yuv2rgb * values.rgb;\n        if (colorMode == 4) {\n          // YUV\n          gl_FragColor = vec4(rgb, 1.0);\n        } else if (colorMode == 5) {\n          // YUVA\n          gl_FragColor = vec4(rgb, values.a);\n        }\n      } else if (colorMode == 6) {\n        gl_FragColor = vec4(values[0], values[0], values[0], 1.0);\n      }\n    }";
    return gpgpu.createProgram(fragmentShaderSource);
}
exports.getRenderShader = getRenderShader;
function render(gpgpu, renderShader, sourceTex, outputNumDimensions, colorMode) {
    deeplearn_1.webgl_util.bindCanvasToFramebuffer(gpgpu.gl);
    gpgpu.setProgram(renderShader);
    gpgpu.setInputMatrixTexture(sourceTex, 'source', 0);
    var colorModeLoc = gpgpu.getUniformLocation('colorMode');
    gpgpu.gl.uniform1i(colorModeLoc, colorMode);
    var outputNumDimensionsLoc = gpgpu.getUniformLocation('outputNumDimensions');
    gpgpu.gl.uniform1f(outputNumDimensionsLoc, outputNumDimensions);
    gpgpu.executeProgram();
}
exports.render = render;
// Normalizes x, y to -.5 <=> +.5, adds a radius term, and pads zeros with the
// number of z parameters that will get added by the add z shader.
function imagePixelToNormalizedCoord(x, y, imageWidth, imageHeight, zSize) {
    var halfWidth = imageWidth * 0.5;
    var halfHeight = imageHeight * 0.5;
    var normX = (x - halfWidth) / imageWidth;
    var normY = (y - halfHeight) / imageHeight;
    var r = Math.sqrt(normX * normX + normY * normY);
    var result = [normX, normY, r];
    // Pad with zeros the number of latent terms, these get added on the GPU as
    // uniforms.
    for (var i = 0; i < zSize; i++) {
        result.push(0);
    }
    return result;
}
exports.imagePixelToNormalizedCoord = imagePixelToNormalizedCoord;
