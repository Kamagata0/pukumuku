using System.Collections;
using System.Collections.Generic;
using UnityEngine;
public class DeviceSize : MonoBehaviour
{
    void Start()
    {
        SetCameraSize();
    }
    void SetCameraSize()
    {
        float deviceHeight = Screen.height; // 端末縦幅
        float deviceWidth = Screen.width; // 端末横幅
        float baseRatio = (deviceHeight >= deviceWidth) ? (12f / 9f) : (9f / 12f); // 基準画面サイズ割合(16:9)
        float deviceRatio = deviceHeight / deviceWidth; // 実際の端末サイズ割合
        float resultRatio = baseRatio / deviceRatio; // 補正用端末サイズ割合
        if (resultRatio <= 1.0f) // resultRatioが1以下なら横長(タブレット系)
        {
            // カメラの描画範囲Heightを狭め、その1/2中央に寄せる。
            float rectY = (1.0f - resultRatio) / 2f;
            Camera.main.rect = new Rect(0, rectY, 1f, resultRatio);
        }
        else // resultRatioが1より上なら縦長(スマホ系)
        {
            // カメラの描画範囲Widthを狭め、その1/2中央に寄せる。
            float rectX = (resultRatio - 1.0f) / 2f;
            Camera.main.rect = new Rect(rectX, 0f, (2f - resultRatio), 1f);
        }
    }
}