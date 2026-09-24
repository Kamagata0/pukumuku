using UnityEngine;

namespace Pukumuku
{
    public enum BreadType
    {
        Loaf,       // 食パン (+100円)
        Croissant,  // クロワッサン (+200円)
        Melon,      // メロンパン (+300円)
        Gold,       // 金パン (+1000円)
        Burnt       // コゲパン (+0円)
    }

    /// <summary>
    /// 降ってくるパンの制御スクリプト
    /// </summary>
    public class BreadItem : MonoBehaviour
    {
        [Header("パンの設定")]
        [SerializeField] private BreadType breadType = BreadType.Loaf;
        [SerializeField] private float fallSpeed = 3.5f;
        [SerializeField] private Vector3 rotationSpeed = new Vector3(30f, 60f, 20f);

        public BreadType Type => breadType;
        public int ScoreValue => breadType switch
        {
            BreadType.Loaf => 100,
            BreadType.Croissant => 200,
            BreadType.Melon => 300,
            BreadType.Gold => 1000,
            _ => 0
        };

        public bool IsCollected { get; private set; } = false;
        private float wobbleOffset;

        private void Start()
        {
            wobbleOffset = Random.Range(0f, 10f);
        }

        private void Update()
        {
            if (IsCollected) return;

            // Y軸下向きに落下
            transform.position += Vector3.down * fallSpeed * Time.deltaTime;

            // コインのように回転
            transform.Rotate(rotationSpeed * Time.deltaTime);

            // Z軸（左右）に少しゆらゆら揺れる
            float wobble = Mathf.Sin(Time.time * 3f + wobbleOffset) * 0.005f;
            transform.position += Vector3.forward * wobble;

            // 一定の高さより下に落ちたら自動破棄
            if (transform.position.y < 3.0f)
            {
                Destroy(gameObject);
            }
        }

        public void Collect()
        {
            IsCollected = true;
            Destroy(gameObject);
        }
    }
}
