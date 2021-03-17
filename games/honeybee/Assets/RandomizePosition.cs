using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class RandomizePosition : MonoBehaviour
{
	public BoxCollider bounds;

	public float duration;
	private float lastRandomizeTime;
    // Start is called before the first frame update
    void Start()
    {
        lastRandomizeTime = Time.time;
    }

    // Update is called once per frame
    void Update()
    {
        if (duration > 0 && Time.time - lastRandomizeTime > duration) {
        	Randomize();
        	lastRandomizeTime = Time.time;
        }
    }

    public void Randomize()
    {
    	transform.position = RandomPointInBounds(bounds.bounds);
    }

    
	public static Vector3 RandomPointInBounds(Bounds bounds) {
	    return new Vector3(
	        Random.Range(bounds.min.x, bounds.max.x),
	        Random.Range(bounds.min.y, bounds.max.y),
	        Random.Range(bounds.min.z, bounds.max.z)
	    );
	}
}

