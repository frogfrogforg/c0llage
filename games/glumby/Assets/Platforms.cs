using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Platforms : MonoBehaviour
{
    [Header("References")]
    public JSCallbacks jsCallbacks;
    public GameObject platformPrefab;

    public new Camera camera;

    public float homeDumplingWallThickness = 0.1f; // units?

    private List<GameObject> _platforms;
    private GameObject _homeDumplingWalls;

    void Start()
    {
        _platforms = new List<GameObject>();
        if (camera == null) {
            camera = Camera.main;
        }
    }

    void Update()
    {
        // Add glumby's home dumpling (four walls with space in between)
        Rect? glumbyDumplingRect = jsCallbacks.GetGlumbyDumplingRect();
        if (glumbyDumplingRect != null) {
            if (_homeDumplingWalls == null) {
                _homeDumplingWalls = new GameObject("Home Dumpling");
                _homeDumplingWalls.transform.parent = this.transform;
                // Add 4 platform objects as children
                for (int i = 0; i < 4; i++) {
                    GameObject wall = Instantiate(platformPrefab, parent: _homeDumplingWalls.transform);
                }
            }
            // Set wall positions
            // Adjust coords from css (top-left) to unity viewport (bottom-left)
            Rect rect = glumbyDumplingRect.Value;

            int wall_index = 0;
            foreach (int coord_index in new int[]{0, 1}) {
                // coord_index is 0 for x, 1 for y
                foreach (int sign in new int[]{-1, 1}) {
                    Transform wall = _homeDumplingWalls.transform.GetChild(wall_index);
                    wall_index++;

                    // fuck this is so messy.
                    Vector2 unitDirection = sign*(coord_index == 0 ? Vector2.right : Vector2.up);
                    Vector2 wallCenter = rect.center + 0.5f*Vector2.Scale(rect.size, unitDirection);

                    // Debug.Log("unitDirection");
                    // Debug.Log(unitDirection);
                    // Debug.Log("wallCenter");
                    // Debug.Log(wallCenter);

                    // wallCenter is correct

                    Vector2 wallSize = new Vector2 (
                        coord_index == 0 ? 0f : rect.size.x,
                        coord_index == 1 ? 0f : rect.size.y
                    );

                    wallCenter -= wallSize/2f; // no idea why this is necessary but at this point don't care lol

                    Bounds b = jsCallbacks.ScreenRectToWorldBounds(new Rect(wallCenter, wallSize));
                    wall.position = b.center;
                    wall.localScale = b.size + homeDumplingWallThickness*Vector3.one;
                }
            }
        } else {
            if (_homeDumplingWalls) {
                Destroy(_homeDumplingWalls);
                _homeDumplingWalls = null;
            }

            // Add normal dumplings (simple rect for each dumpling)
            var rects = jsCallbacks.GetDumplingRects(); // normalized window coordinates, starting from TOP-LEFT!

            // Ensure platforms has the same length as rects
            while (_platforms.Count < rects.Count) {
                // add a platform
                _platforms.Add(Instantiate(platformPrefab, parent: this.transform));
                Debug.Log(_platforms.Count);
            }
            while (_platforms.Count > rects.Count) {
                // remove a platform
                GameObject.Destroy(_platforms[_platforms.Count - 1]);
                _platforms.RemoveAt(_platforms.Count - 1);
            }

            for (int i = 0; i < _platforms.Count; i++) {
                // Set bounds of ith platform
                Bounds b = jsCallbacks.ScreenRectToWorldBounds(rects[i]);

                _platforms[i].transform.position = b.center; // center
                _platforms[i].transform.localScale = b.size;
            }
        }
    }
}
