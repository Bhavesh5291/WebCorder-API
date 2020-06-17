/* 
*   WebCorder
*   Copyright (c) 2020 Yusuf Olokoba.
*/

namespace NatSuite.Recorders.Inputs {

    using UnityEngine;
    using System;
    using System.Collections;

    /// <summary>
    /// Recorder input for recording video frames from one or more game cameras.
    /// </summary>
    public class ScreenInput : IDisposable {

        #region --Client API--
        /// <summary>
        /// Create a video recording input from a game camera.
        /// </summary>
        /// <param name="recorder">Media recorder to receive video frames.</param>
        /// <param name="camera">Game camera to record.</param>
        public ScreenInput (WEBMRecorder recorder, Camera camera) {
            this.recorder = recorder;
            this.camera = camera;
            var (width, height) = recorder.frameSize;
            this.readbackBuffer = new Texture2D(width, height, TextureFormat.RGBA32, false, false);
            this.pixelBuffer = new byte[width * height * 4];
            this.attachment = camera.gameObject.AddComponent<ScreenInputAttachment>();
            attachment.StartCoroutine(OnFrame());
        }

        /// <summary>
        /// Stop recorder input and release resources.
        /// </summary>
        public void Dispose () {
            ScreenInputAttachment.Destroy(attachment);
            Texture2D.Destroy(readbackBuffer);
        }
        #endregion


        #region --Operations--

        private readonly WEBMRecorder recorder;
        private readonly Camera camera;
        private readonly Texture2D readbackBuffer;
        private readonly byte[] pixelBuffer;
        private readonly ScreenInputAttachment attachment;

        private IEnumerator OnFrame () {
            var endOfFrame = new WaitForEndOfFrame();
            while (true) {
                // Render camera
                yield return endOfFrame;
                var frameBuffer = RenderTexture.GetTemporary(readbackBuffer.width, readbackBuffer.height, 24);
                var prevTarget = camera.targetTexture;
                camera.targetTexture = frameBuffer;
                camera.Render();
                camera.targetTexture = prevTarget;
                // Readback
                var prevActive = RenderTexture.active;
                RenderTexture.active = frameBuffer;
                readbackBuffer.ReadPixels(new Rect(0, 0, frameBuffer.width, frameBuffer.height), 0, 0, false);
                RenderTexture.active = prevActive;
                RenderTexture.ReleaseTemporary(frameBuffer);
                // Commit
                readbackBuffer.GetRawTextureData<byte>().CopyTo(pixelBuffer);
                recorder.CommitFrame(pixelBuffer);
            }
        }

        private sealed class ScreenInputAttachment : MonoBehaviour { }
        #endregion
    }
}