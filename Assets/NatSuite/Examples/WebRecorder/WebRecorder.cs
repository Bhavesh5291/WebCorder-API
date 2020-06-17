/* 
*   WebCorder
*   Copyright (c) 2020 Yusuf Olokoba.
*/

namespace NatSuite.Examples {

    using UnityEngine;
    using Recorders;
    using Recorders.Inputs;

    public class WebRecorder : MonoBehaviour {

        [Header("Recording")]
        public int videoWidth = 1280;
        public int videoHeight = 720;

        private WEBMRecorder recorder;
        private ScreenInput screenInput;

        public void StartRecording () {
            // Start recording from main camera
            recorder = new WEBMRecorder(videoWidth, videoHeight, 30);
            screenInput = new ScreenInput(recorder, Camera.main);
        }

        public async void StopRecording () {
            // Stop recorder
            screenInput.Dispose();
            var path = await recorder.FinishWriting();
            // Playback recording
            Debug.Log($"Saved recording to: {path}");
        }
    }
}