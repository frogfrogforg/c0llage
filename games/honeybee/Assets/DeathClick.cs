using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class DeathClick : MonoBehaviour
{
	public JSCallbacks js;
	public float raycastDistance = 1000f;
    // Start is called before the first frame update
    void Start()
    {
        
    }

    // Update is called once per frame
    void Update()
    {
		RaycastHit hit; 
		Ray ray = Camera.main.ScreenPointToRay(Input.mousePosition);
		Bug bug = null;
		if (Physics.Raycast (ray, out hit, raycastDistance)){ 
			bug = hit.transform.gameObject.GetComponent<Bug>();
		}

		if (bug && !bug.dead) {
    		if (Input.GetMouseButtonDown (0)) { 
				bug.Kill();
			}
			js.SetPointer(true);
		} else {
			js.SetPointer(false);
		}
 	}
}
