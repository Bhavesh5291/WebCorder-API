/* 
*   WebCorder
*   Copyright (c) 2020 Yusuf Olokoba.
*/

namespace NatSuite.Examples {

    using UnityEngine;
    using UnityEngine.UI;
    using System.Collections;
    using Recorders;
    using Recorders.Inputs;

    public class WebRecorder : MonoBehaviour {

        [Header("Recording")]
        public int videoWidth = 1280;
        public int videoHeight = 720;

        [Header(@"UI")]
        public RawImage rawImage;
        public AspectRatioFitter aspectFitter;

        private WEBMRecorder recorder;
        private ScreenInput screenInput;

        IEnumerator Start () {
            // Request camera permission
            yield return Application.RequestUserAuthorization(UserAuthorization.WebCam);
            // Start webcam
            var webCamTexture = new WebCamTexture();
            webCamTexture.Play();
            // Weird macOS bug
            yield return new WaitUntil(() => webCamTexture.width > 16 && webCamTexture.height > 16);
            // Display UI
            rawImage.texture = webCamTexture;
            aspectFitter.aspectRatio = (float)webCamTexture.width / webCamTexture.height;
        }

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