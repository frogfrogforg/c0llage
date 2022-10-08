using UnityEngine;
using System.Runtime.InteropServices;
using System.Collections;
using System.Collections.Generic;

public class JSCallbacks : MonoBehaviour {
  [DllImport("__Internal")]
  private static extern void _OnStart(); // This is a JS function defined in callbacks.jslib
  [DllImport("__Internal")]
  private static extern void _SetPointer(bool pointer); // This is a JS function defined in callbacks.jslib
  [DllImport("__Internal")]
  private static extern int _GetNDumplings(); // Returns current number of dumplings (UI windows)

  // The coordinates are all in pixels.
  [DllImport("__Internal")]
  private static extern float _GetDumplingX(int i); // Returns x of ith dumpling
  [DllImport("__Internal")]
  private static extern float _GetDumplingY(int i); // Returns y of ith dumpling
  [DllImport("__Internal")]
  private static extern float _GetDumplingW(int i); // Returns width of ith dumpling
  [DllImport("__Internal")]
  private static extern float _GetDumplingH(int i); // Returns height of ith dumpling

  public float delayBeforeStartCallback = 0.7f;

  public List<Rect> mockupRects;

  void Start() {
    // seems like start gets called while the unity logo is fading out, so we give it a tiny delay
    StartCoroutine(DelayStartCallback());
  }

  IEnumerator DelayStartCallback()
  {
    yield return new WaitForSecondsRealtime(delayBeforeStartCallback);
#if !UNITY_EDITOR
    _OnStart();
#endif
  }
  public void SetPointer(bool pointer) {
    // Debug.Log("SetPointer " + pointer);
#if !UNITY_EDITOR
    _SetPointer(pointer);
#endif
  }

  public List<Rect> GetDumplingRects() {
#if !UNITY_EDITOR
    int n = _GetNDumplings();
    var rects = new List<Rect>(n);
    for (int i = 0; i < n; i++) {
      rects.Add(new Rect(
        _GetDumplingX(i),
        _GetDumplingY(i),
        _GetDumplingW(i),
        _GetDumplingH(i)
      ));
    }
    return rects;
#else
    return mockupRects;
#endif
  }
}