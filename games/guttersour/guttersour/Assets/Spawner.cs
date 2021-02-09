using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Spawner : MonoBehaviour
{
    private Bounds bounds;

    public GameObject[] objects;
    public int n;

    // Start is called before the first frame update
    void Awake()
    {
        bounds = GetComponent<BoxCollider>().bounds;
        for (int i = 0; i < n; i++) {
            Vector3 pos = new Vector3(
                Random.Range(bounds.min.x, bounds.max.x),
                Random.Range(bounds.min.y, bounds.max.y),
                Random.Range(bounds.min.z, bounds.max.z)
            );
            Object.Instantiate(objects[i%objects.Length], pos, Random.rotation, transform);
        }
    }

    // Update is called once per frame
    void Update()
    {
    }
}
