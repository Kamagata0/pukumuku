using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class movesc : MonoBehaviour
{
    Vector3 mousePos, pos;

    void Update()
    {
        mousePos = Input.mousePosition;
        pos = Camera.main.ScreenToWorldPoint(new Vector3(mousePos.x, 1f, 7f));
        transform.position = pos;
    }
}