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

  // The coordinates are all in normalized screen co-ords (0.0 - 1.0 from top left corner)
  [DllImport("__Internal")]
  private static extern float _GetDumplingX(int i); // Returns x of ith dumpling
  [DllImport("__Internal")]
  private static extern float _GetDumplingY(int i); // Returns y of ith dumpling
  [DllImport("__Internal")]
  private static extern float _GetDumplingW(int i); // Returns width of ith dumpling
  [DllImport("__Internal")]
  private static extern float _GetDumplingH(int i); // Returns height of ith dumpling

  [DllImport("__Internal")]
  private static extern bool _IsGlumbyDumplingOpen();
   [DllImport("__Internal")]
  private static extern float _GetGlumbyDumplingX(); // Returns x of ith dumpling
  [DllImport("__Internal")]
  private static extern float _GetGlumbyDumplingY(); // Returns y of ith dumpling
  [DllImport("__Internal")]
  private static extern float _GetGlumbyDumplingW(); // Returns width of ith dumpling
  [DllImport("__Internal")]
  private static extern float _GetGlumbyDumplingH(); // Returns height of ith dumpling

  public float delayBeforeStartCallback = 0.7f;

  public List<Rect> mockupDumplingRects;

  [System.Serializable]
  public class GlumbyDumpling {
    public bool isOpen;
    public Rect rect;
  }
  public GlumbyDumpling mockupGlumbyDumpling;

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

  // public bool IsGlumbyDumplingOpen() {
  //   return _IsGlumbyDumplingOpen();
  // }

  public Rect? GetGlumbyDumplingRect() {
#if !UNITY_EDITOR
    if (_IsGlumbyDumplingOpen()) {
      return new Rect(
        _GetGlumbyDumplingX(),
        _GetGlumbyDumplingY(),
        _GetGlumbyDumplingW(),
        _GetGlumbyDumplingH()
      );
    } else {
      return null;
    }
#else
    return mockupGlumbyDumpling.isOpen ? (Rect?)mockupGlumbyDumpling.rect : null;
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
    return mockupDumplingRects;
#endif
  }
  
  // Convert a normalized css-style screen-space rect into a 3d AABB
  // shouldn't really be here but yeah
  public Bounds ScreenRectToWorldBounds (Rect rect) {
      Bounds b = new Bounds();

      // Adjust coords from css (top-left) to unity viewport (bottom-left)
      Rect r2 = new Rect(
          rect.x,
          1f - rect.y - rect.height,
          rect.width,
          rect.height
      );

      Vector3 min = Camera.main.ViewportToWorldPoint(r2.min);
      min.z = -0.5f;
      b.min = min;

      Vector3 max = Camera.main.ViewportToWorldPoint(r2.max);
      max.z = 0.5f;
      b.max = max;
  
      return b;
  }
  // this is horrible TODO refactor
  public Vector3 ScreenPointToWorldPoint (Vector2 point) {
    Vector2 p2 = point;
    point.y = 1 - point.y; // transform coord system
    Vector3 p3 = Camera.main.ViewportToWorldPoint(point); // 1 - y
    p3.z = 0f;
    return p3;
  }
}