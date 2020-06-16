/* 
*   NatCorder
*   Copyright (c) 2020 Yusuf Olokoba.
*/

namespace NatSuite.Recorders.Internal {

    using System;
    using System.Runtime.InteropServices;

    public static class WebBridge {

        private const string Assembly = @"__Internal";

        public delegate void RecordingHandler (IntPtr context, IntPtr path);

        #if UNITY_WEBGL && !UNITY_EDITOR
        [DllImport(Assembly, EntryPoint = @"NCCreateWEBMRecorder")]
        public static extern IntPtr CreateWEBMRecorder (int width, int height, float frameRate, int bitrate, int sampleRate, int channelCount, RecordingHandler callback, IntPtr context);
        [DllImport(Assembly, EntryPoint = @"NCFrameSize")]
        public static extern void FrameSize (this IntPtr recorder, out int width, out int height);
        [DllImport(Assembly, EntryPoint = @"NCCommitFrame")]
        public static extern void CommitFrame (this IntPtr recorder, IntPtr pixelBuffer, long timestamp);
        [DllImport(Assembly, EntryPoint = @"NCCommitSamples")]
        public static extern void CommitSamples (this IntPtr recorder, float[] sampleBuffer, int sampleCount, long timestamp);
        [DllImport(Assembly, EntryPoint = @"NCFinishWriting")]
        public static extern void FinishWriting (this IntPtr recorder);
        #else

        public static IntPtr CreateWEBMRecorder (int width, int height, float frameRate, int bitrate, int sampleRate, int channelCount, RecordingHandler callback, IntPtr context) => IntPtr.Zero;
        public static void FrameSize (this IntPtr recorder, out int width, out int height) { width = height = 0; }
        public static void CommitFrame (this IntPtr recorder, IntPtr pixelBuffer, long timestamp) { }
        public static void CommitSamples (this IntPtr recorder, float[] sampleBuffer, int sampleCount, long timestamp) { }
        public static void FinishWriting (this IntPtr recorder) { }
        #endif
    }
}