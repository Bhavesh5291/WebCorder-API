/* 
*   WebCorder
*   Copyright (c) 2020 Yusuf Olokoba
*/

namespace NatSuite.Examples.Components {

    using UnityEngine;
    using UnityEngine.EventSystems;
    using UnityEngine.UI;

    [RequireComponent(typeof(EventTrigger))]
    public class RECButton : MonoBehaviour, IPointerDownHandler, IPointerUpHandler {

        [SerializeField]
        Image icon;
        [SerializeField]
        Text text;
        bool recording;
        float startTime;

        void Update () {
            var color = Color.red;
            color.a = recording ? 0.5f * Mathf.Cos(2.5f * (Time.time - startTime)) + 0.5f : default;
            icon.color = color;
            text.color = recording ? Color.white : Color.clear;
        }

        void IPointerDownHandler.OnPointerDown (PointerEventData _) {
            startTime = Time.time;
            recording = true;
        }

        void IPointerUpHandler.OnPointerUp (PointerEventData _) => recording = false;
    }
}