/* 
*   NatCorder
*   Copyright (c) 2020 Yusuf Olokoba.
*/

const NatCorder = {

    $sharedInstance : [],

    NCCreateWEBMRecorder : function (width, height, frameRate, bitrate, sampleRate, channelCount, callback, context) {
        // Create canvas element
        const frameBuffer = document.createElement("canvas");
        frameBuffer.width = width;
        frameBuffer.height = height;
        // Setup video encoder
        const frameBufferContext = frameBuffer.getContext("2d");
        const pixelBuffer = frameBufferContext.getImageData(0, 0, width, height);
        const videoStream = frameBuffer.captureStream(frameRate);
        const videoTrack = videoStream.getVideoTracks()[0];
        console.log("NatCorder: WEBMRecorder prepared video encoder at resolution", width, "x", height, "@", frameRate, "Hz with average bitrate", bitrate);
        // Setup audio encoder
        const recordAudio = sampleRate > 0 && channelCount > 0;
        const audioContext = recordAudio ? new AudioContext({ latencyHint: "interactive", sampleRate }) : undefined;
        const audioStream = audioContext && audioContext.createMediaStreamDestination({ channelCount, channelCountMode: "explicit" });
        const audioTrack = audioStream && audioStream.stream.getAudioTracks()[0];
        const tracks = recordAudio ? [videoTrack, audioTrack] : [videoTrack];
        if (recordAudio)
            console.log("NatCorder: WEBMRecorder prepared audio encoder at for", channelCount, "channels at", sampleRate, "Hz");
        // Start recording
        const options = { mimeType : sharedInstance.MIME_TYPE, videoBitsPerSecond : bitrate };
        const recorder = new MediaRecorder(new MediaStream(tracks), options);
        recorder.ondataavailable = function (e) {
            const videoBlob = new Blob([e.data], { "type": "video/webm" });
            const videoURL = URL.createObjectURL(videoBlob);
            console.log("NatCorder: WEBMRecorder finishing", videoBlob, "at URL", videoURL);
            const pathSize = lengthBytesUTF8(videoURL) + 1;
            const path = _malloc(pathSize);
            stringToUTF8(videoURL, path, pathSize);
            Runtime.dynCall("vii", callback, [context, path]);
            _free(path);
        };
        recorder.start();
        // Return
        const recorderInfo = { recorder, frameBuffer, frameBufferContext, pixelBuffer, audioContext, audioStream };
        return sharedInstance.push(recorderInfo) - 1;
    },

    NCFrameSize : function (recorderPtr, outWidth, outHeight) {
        const recorderInfo = sharedInstance[recorderPtr];
        const encoderBuffer = recorderInfo.pixelBuffer;
        new Int32Array(HEAPU8.buffer, outWidth, 1)[0] = encoderBuffer.width;
        new Int32Array(HEAPU8.buffer, outHeight, 1)[0] = encoderBuffer.height;
    },

    NCCommitFrame : function (recorderPtr, pixelBuffer, timestamp) {
        // Get encoder
        const recorderInfo = sharedInstance[recorderPtr];
        const frameBufferContext = recorderInfo.frameBufferContext;
        const encoderBuffer = recorderInfo.pixelBuffer;
        // Invert
        var stride = 4 * encoderBuffer.width;
        for (var i = 0; i < encoderBuffer.height; i++) {
            const srcBuffer = new Uint8Array(HEAPU8.buffer, pixelBuffer + (encoderBuffer.height - i - 1) * stride, stride);
            encoderBuffer.data.set(srcBuffer, i * stride);
        }
        // Commit
        frameBufferContext.putImageData(encoderBuffer, 0, 0);
    },

    NCCommitSamples : function (recorderPtr, sampleBuffer, sampleCount, timestamp) {
        // Get encoder
        const recorderInfo = sharedInstance[recorderPtr];
        const audioContext = recorderInfo.audioContext;
        const audioStream = recorderInfo.audioStream;
        const sampleRate =  audioContext.sampleRate;
        const channelCount = audioStream.channelCount;
        // Create buffer
        const audioBuffer = audioContext.createBuffer(channelCount, sampleCount / channelCount, sampleRate);
        const srcBuffer = new Float32Array(HEAPU8.buffer, sampleBuffer, sampleCount);
        for (var c = 0; c < audioBuffer.numberOfChannels; c++) {
            const channelData = audioBuffer.getChannelData(c);
            for (var i = 0; i < audioBuffer.length; i++)
                channelData[i] = srcBuffer[i * audioBuffer.numberOfChannels + c];
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
        recorder.stop();
        if (audioContext)
            audioContext.close();
    }
};

autoAddDeps(NatCorder, "$sharedInstance");

mergeInto(LibraryManager.library, NatCorder);