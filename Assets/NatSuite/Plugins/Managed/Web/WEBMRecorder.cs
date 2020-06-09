/* 
*   WebCorder
*   Copyright (c) 2020 Yusuf Olokoba.
*/

namespace NatSuite.Web.Internal {
    
    using System;
    using System.Threading.Tasks;

    public class WEBMRecorder {
        
        public WEBMRecorder (int width, int height, float framerate, int sampleRate = 0, int channelCaount = 0, int bitrate = (int)(960 * 540 * 11.4)) {

        }

        public void CommitFrame<T> (T[] pixelBuffer) where T : struct {

        }

        public void CommitFrame (IntPtr nativeBuffer) {

        }

        public void CommitSamples (float[] sampleBuffer) {

        }

        public Task<string> FinishWriting () => null;
    }
}