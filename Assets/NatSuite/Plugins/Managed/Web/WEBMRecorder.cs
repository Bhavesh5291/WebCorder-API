/* 
*   NatCorder
*   Copyright (c) 2020 Yusuf Olokoba.
*/

namespace NatSuite.Recorders {
    
    using AOT;
    using System;
    using System.Runtime.InteropServices;
    using System.Threading.Tasks;
    using Internal;

    /// <summary>
    /// WEBM video recorder.
    /// </summary>
    public class WEBMRecorder {

        #region --Client API--
        /// <summary>
        /// Video size.
        /// </summary>
        public (int width, int height) frameSize {
            get {
                recorder.FrameSize(out var width, out var height);
                return (width, height);
            }
        }

        /// <summary>
        /// Create a WEBM recorder.
        /// </summary>
        /// <param name="width">Video width.</param>
        /// <param name="height">Video height.</param>
        /// <param name="frameRate">Video frame rate.</param>
        /// <param name="sampleRate">Audio sample rate. Pass 0 for no audio.</param>
        /// <param name="channelCount">Audio channel count. Pass 0 for no audio.</param>
        /// <param name="bitrate">Video bitrate in bits per second.</param>
        public WEBMRecorder (int width, int height, float frameRate, int sampleRate = 0, int channelCaount = 0, int bitrate = (int)(960 * 540 * 11.4)) {
            this.recordingTask = new TaskCompletionSource<string>();
            var handle = GCHandle.Alloc(recordingTask, GCHandleType.Normal);
            this.recorder = WebBridge.CreateWEBMRecorder(width, height, frameRate, bitrate, sampleRate, channelCaount, OnRecording, (IntPtr)handle);
        }

        /// <summary>
        /// Commit a video pixel buffer for encoding.
        /// The pixel buffer MUST have an RGBA8888 pixel layout.
        /// </summary>
        /// <param name="pixelBuffer">Pixel buffer containing video frame to commit.</param>
        public void CommitFrame<T> (T[] pixelBuffer) where T : struct {
            var handle = GCHandle.Alloc(pixelBuffer, GCHandleType.Pinned);
            recorder.CommitFrame(handle.AddrOfPinnedObject(), default);
            handle.Free();
        }

        /// <summary>
        /// Commit an audio sample buffer for encoding.
        /// </summary>
        /// <param name="sampleBuffer">Linear PCM audio sample buffer, interleaved by channel.</param>
        public void CommitSamples (float[] sampleBuffer) => recorder.CommitSamples(sampleBuffer, sampleBuffer.Length, default);

        /// <summary>
        /// Finish writing and return the path to the recorded media file.
        /// </summary>
        public Task<string> FinishWriting () {
            recorder.FinishWriting();
            return recordingTask.Task;
        }
        #endregion


        #region --Operations--

        private readonly IntPtr recorder;
        private readonly TaskCompletionSource<string> recordingTask;

        [MonoPInvokeCallback(typeof(WebBridge.RecordingHandler))]
        private static void OnRecording (IntPtr context, IntPtr path) {
            // Get task
            var handle = (GCHandle)context;
            var recordingTask = handle.Target as TaskCompletionSource<string>;
            handle.Free();
            // Invoke completion task
            if (path != IntPtr.Zero)
                recordingTask.SetResult(Marshal.PtrToStringAnsi(path));
            else
                recordingTask.SetException(new Exception(@"Recorder failed to finish writing"));
        }
        #endregion
    }
}