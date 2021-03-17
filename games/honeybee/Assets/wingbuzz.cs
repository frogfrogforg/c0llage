using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class wingbuzz : MonoBehaviour
{
	public float amplitude;
	public float frequency;

    private float phase;

    // Start is called before the first frame update
    void Start()
    {
        phase = Random.Range(0, 2*Mathf.PI);
    }

    // Update is called once per frame
    void Update()
    {
        Quaternion rot = transform.localRotation;
        rot.y = amplitude*Mathf.Sin(2*Mathf.PI*frequency*Time.time + phase);
        transform.localRotation = rot;
    }
}
