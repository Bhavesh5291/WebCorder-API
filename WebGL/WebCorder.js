/* 
*   WebCorder
*   Copyright (c) 2020 Yusuf Olokoba.
*/

const WebCorder = {

    $sharedInstance : [],

    NCCreateWEBMRecorder : function (width, height, frameRate, bitrate, sampleRate, channelCount, callback, context) { // INCOMPLETE // Logging
        // Create canvas element
        const frameBuffer = document.createElement("canvas");
        frameBuffer.width = width;
        frameBuffer.height = height;
        // Setup video encoder
        const frameBufferContext = frameBuffer.getContext("2d");
        const pixelBuffer = frameBufferContext.getImageData(0, 0, width, height);
        const videoStream = frameBuffer.captureStream(frameRate);
        const videoTrack = videoStream.getVideoTracks()[0];
        // Setup audio encoder
        const audioContext = recordAudio ? new AudioContext({ latencyHint: "interactive", sampleRate }) : undefined;
        const audioStream = audioContext && audioContext.createMediaStreamDestination({ channelCount, channelCountMode: "explicit" });
        const audioTrack = audioStream && audioStream.stream.getAudioTracks()[0]
        const tracks = recordAudio ? [videoTrack, audioTrack] : [videoTrack];
        // Start recording
        const options = { mimeType : sharedInstance.MIME_TYPE, videoBitsPerSecond : bitrate };
        const recorder = new MediaRecorder(new MediaStream(tracks), options);
        recorder.ondataavailable = function (e) {
            const videoBlob = new Blob([e.data], { "type": "video/webm" });
            const videoURL = URL.createObjectURL(videoBlob);
            console.log("WebCorder: Completed recording video", videoBlob, "to URL:", videoURL);
            const pathSize = lengthBytesUTF8(videoURL) + 1;
            const path = _malloc(pathSize);
            stringToUTF8(videoURL, path, pathSize);
            Runtime.dynCall("vii", callback, [context, path]);
            _free(path);
        };
        recorder.start();
        console.log("WebCorder: Starting recording");
        // Return
        const recorderInfo = { recorder, frameBuffer, frameBufferContext, pixelBuffer, audioContext, audioStream };
        return sharedInstance.push(recorderInfo) - 1;
    },

    NCFrameSize : function (recorderPtr, outWidth, outHeight) {
        const recorderInfo = sharedInstance[recorderPtr];
    },

    NCCommitFrame : function (recorderPtr, pixelBuffer, timestamp) {
        // Get encoder
        const recorderInfo = sharedInstance[recorderPtr];
        const frameBufferContext = recorderInfo.frameBufferContext;
        const pixelBuffer = recorderInfo.pixelBuffer;
        // Invert
        var stride = 4 * pixelBuffer.width;
        for (var i = 0; i < pixelBuffer.height; i++)
            pixelBuffer.data.set(new Uint8Array(HEAPU8.buffer, pixelBuffer + (pixelBuffer.height - i - 1) * stride, stride), i * stride);
        // Commit
        frameBufferContext.putImageData(pixelBuffer, 0, 0);
    },

    NCCommitSamples : function (recorderPtr, sampleBuffer, sampleCount, timestamp) { // INCOMPLETE
        // Get encoder
        const recorderInfo = sharedInstance[recorderPtr];
        const audioContext = recorderInfo.audioContext;
        const audioStream = recorderInfo.audioStream;
        const sampleRate = undefined;
        const channelCount = undefined;
        // Create buffer
        const audioBuffer = audioContext.createBuffer(channelCount, sampleCount / channelCount, sampleRate);
        sampleBuffer = new Float32Array(HEAPU8.buffer, sampleBuffer, sampleCount);
        for (var c = 0; c < audioBuffer.numberOfChannels; c++) {
            const channelData = audioBuffer.getChannelData(c);
            for (var i = 0; i < audioBuffer.length; i++)
                channelData[i] = sampleBuffer[i * audioBuffer.numberOfChannels + c];
        }
        // Commit buffer
        var audioSource = audioContext.createBufferSource();
        audioSource.buffer = audioBuffer;
        audioSource.connect(audioStream);
        audioSource.start();
    },

    NCFinishWriting : function (recorderPtr) {
        // Get recorder
        const recorderInfo = sharedInstance[recorderPtr];
        const recorder = recorderInfo.recorder;
        const audioContext = recorderInfo.audioContext;
        // Stop recording
        console.log("WebCorder: Stopping recording");
        recorder.stop();
        if (audioContext)
            audioContext.close();
    }

    /*

    WCStartRecording : function (width, height, framerate, sampleRate, channelCount, bitrate, recordingCallback, context) {
        sharedInstance.framebuffer = document.createElement("canvas");
        sharedInstance.framebuffer.width = width;
        sharedInstance.framebuffer.height = height;
        sharedInstance.framebufferContext = sharedInstance.framebuffer.getContext("2d");
        sharedInstance.pixelBuffer = sharedInstance.framebufferContext.getImageData(0, 0, width, height);
        const videoStream = sharedInstance.framebuffer.captureStream(framerate);
        const tracks = [videoStream.getVideoTracks()[0]];
        if (sampleRate > 0 && channelCount > 0) {
            sharedInstance.audioContext = new AudioContext({ latencyHint: "interactive", sampleRate });
            sharedInstance.audioStream = sharedInstance.audioContext.createMediaStreamDestination({ channelCount, channelCountMode: "explicit" });
            tracks.push(sharedInstance.audioStream.stream.getAudioTracks()[0]);
        }
        const options = { mimeType : sharedInstance.MIME_TYPE, videoBitsPerSecond : bitrate };
        sharedInstance.recorder = new MediaRecorder(new MediaStream(tracks), options);
        sharedInstance.recordingCallback = recordingCallback;
        sharedInstance.recordingContext = context;
        sharedInstance.recorder.start();
        console.log("WebCorder: Starting recording");
        return 1;
    },

    WCCommitFrame : function (pixelBuffer) {
        // Invert
        var w = sharedInstance.pixelBuffer.width;
        var h = sharedInstance.pixelBuffer.height;
        var s = w * 4;
        for (var i = 0; i < h; i++)
            sharedInstance.pixelBuffer.data.set(new Uint8Array(HEAPU8.buffer, pixelBuffer + (h - i - 1) * s, s), i * s);
        // Commit
        sharedInstance.framebufferContext.putImageData(sharedInstance.pixelBuffer, 0, 0);
    },

    WCCommitSamples : function (sampleBuffer, sampleCount) {
        const audioBuffer = sharedInstance.audioContext.createBuffer(sharedInstance.channelCount, sampleCount / sharedInstance.channelCount, sharedInstance.sampleRate);
        sampleBuffer = new Float32Array(HEAPU8.buffer, sampleBuffer, sampleCount);
        for (var c = 0; c < audioBuffer.numberOfChannels; c++) {
            const channelData = audioBuffer.getChannelData(c);
            for (var i = 0; i < audioBuffer.length; i++)
                channelData[i] = sampleBuffer[i * audioBuffer.numberOfChannels + c];
        }
        var audioSource = sharedInstance.audioContext.createBufferSource();
        audioSource.buffer = audioBuffer;
        audioSource.connect(sharedInstance.audioStream);
        audioSource.start();
    },

    WCStopRecording : function () {
        console.log("WebCorder: Stopping recording");
        sharedInstance.recorder.ondataavailable = function (e) {
            const videoBlob = new Blob([e.data], { "type": sharedInstance.MIME_TYPE });
            const videoURL = URL.createObjectURL(videoBlob);
            console.log("WebCorder: Completed recording video", videoBlob, "to URL:", videoURL);
            const pathSize = lengthBytesUTF8(videoURL) + 1;
            const path = _malloc(pathSize);
            stringToUTF8(videoURL, path, pathSize);
            Runtime.dynCall("vii", sharedInstance.recordingCallback, [sharedInstance.recordingContext, path]);
            _free(path);
        };
        sharedInstance.recorder.stop();
        if (sharedInstance.audioContext)
            sharedInstance.audioContext.close();
        sharedInstance.recorder = null;
        sharedInstance.framebuffer = null;
        sharedInstance.framebufferContext = null;
        sharedInstance.pixelBuffer = null;
        sharedInstance.audioContext = null;
    }
    */
};

autoAddDeps(WebCorder, "$sharedInstance");

mergeInto(LibraryManager.library, WebCorder);