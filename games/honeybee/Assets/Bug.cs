using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Bug : MonoBehaviour
{
	public Transform target;
	public float speed;
	public float turnFactor = 0.1f;

    public float gravity;
    public float deathSpin;

    public bool dead = false;
    private Vector3 deathRotation;

    // Start is called before the first frame update
    void Start()
    {
        
    }

    // Update is called once per frame
    void Update()
    {
        if (!dead) {
            // rotate towards target
            Vector3 targetDirection = target.position - transform.position;
            Quaternion targetRotation = Quaternion.LookRotation(targetDirection);

            transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, 1 - Mathf.Exp(-turnFactor*Time.deltaTime));

            // always move forwards
            transform.position += speed*Time.deltaTime*transform.forward;
        } else {
            transform.Rotate(deathRotation);
            transform.position += gravity*Vector3.down;
        }
    }

    public void Kill() {
        deathRotation = deathSpin*Random.rotation.normalized.eulerAngles;
        dead = true;
    }
}
