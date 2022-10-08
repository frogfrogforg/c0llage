using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Platforms : MonoBehaviour
{
    [Header("References")]
    public JSCallbacks jsCallbacks;

    public GameObject platformPrefab;

    public new Camera camera;

    private List<GameObject> _platforms;

    void Start()
    {
        _platforms = new List<GameObject>();
        if (camera == null) {
            camera = Camera.main;
        }
    }

    void Update()
    {
        var rects = jsCallbacks.GetDumplingRects();

        // Ensure platforms has the same length as rects
        while (_platforms.Count < rects.Count) {
            // add a platform
            _platforms.Add(Instantiate(platformPrefab, parent: this.transform));
            Debug.Log(_platforms.Count);
        }
        while (_platforms.Count > rects.Count) {
            // remove a platform
            _platforms.RemoveAt(_platforms.Count - 1);
        }

        for (int i = 0; i < _platforms.Count; i++) {
            // Set bounds of ith platform
            
            Rect rect = new Rect(
                rects[i].x,
                camera.pixelHeight - rects[i].y - rects[i].height, // convert from css-style to unity-style coordinates
                rects[i].width,
                rects[i].height
            );

            Vector3 min = camera.ScreenToWorldPoint(rect.min);
            min.z = 0f;

            Vector3 max = camera.ScreenToWorldPoint(rect.max); // weird but i think it'll just work?
            max.z = 1f;
            Vector3 size = max-min;

            _platforms[i].transform.position = (max+min)/2f; // center
            _platforms[i].transform.localScale = size;
        }
    }
}
