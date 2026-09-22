using System.Collections;
using System.Collections.Generic;
using Unity.VisualScripting;
using UnityEngine;

public class CubeMove : MonoBehaviour
{
    private Vector3 mouse;
    private Vector3 mypositon;
    private Vector3 target;
    public float speed;
    public float minLimit = -2.3f;
    public float maxLimit = 2.937707f;

    void Start()
    {
        transform.position = new Vector3(31.99f, 7.105656f, 0.2511119f);
    }

    void Update()
    {
        if (Input.GetMouseButton(0))
        {
            mouse = Input.mousePosition;
            Debug.Log(mouse);
            mypositon = Camera.main.ScreenToWorldPoint(new Vector3(mouse.x, 50, 10));
            mypositon.z = Mathf.Clamp(mypositon.z, minLimit, maxLimit);
            Vector3 targetPosition = new Vector3(transform.position.x, transform.position.y, mypositon.z);
            transform.position = Vector3.MoveTowards(transform.position, targetPosition, speed * Time.deltaTime);

        }
    }
}