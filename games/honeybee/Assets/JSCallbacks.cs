using UnityEngine;
using System.Runtime.InteropServices;
using System.Collections;

public class JSCallbacks : MonoBehaviour {
    [DllImport("__Internal")]
    private static extern void _OnStart(); // This is a JS function defined in callbacks.jslib

    [DllImport("__Internal")]
    private static extern void _SetPointer(bool pointer); // This is a JS function defined in callbacks.jslib

    public float delayBeforeStartCallback = 0.7f;

    void Start() {
    	// seems like start gets called while the unity logo is fading out, so we give it a tiny delay
		StartCoroutine(DelayStartCallback());
    }

    IEnumerator DelayStartCallback()
    {
		yield return new WaitForSecondsRealtime(delayBeforeStartCallback);
		_OnStart();
    }

    public void SetPointer(bool pointer) {
    	// Debug.Log("SetPointer " + pointer);
    	_SetPointer(pointer);
    }
}