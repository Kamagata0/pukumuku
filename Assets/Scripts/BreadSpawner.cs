using UnityEngine;

namespace Pukumuku
{
    /// <summary>
    /// 上空からパンをスポーンさせるスクリプト
    /// ユーザー様のシーンレイアウト（X=31.99固定、Z軸左右移動）に完全対応
    /// </summary>
    public class BreadSpawner : MonoBehaviour
    {
        [Header("パンのプレハブ")]
        [SerializeField] private GameObject loafPrefab;
        [SerializeField] private GameObject croissantPrefab;
        [SerializeField] private GameObject melonPrefab;
        [SerializeField] private GameObject goldPrefab;
        [SerializeField] private GameObject burntPrefab;

        [Header("スポーン座標設定 (シーンに合わせた値)")]
        [SerializeField] private float fixedX = 31.99f;
        [SerializeField] private float spawnHeightY = 15.0f;
        [SerializeField] private float minZ = -2.3f;
        [SerializeField] private float maxZ = 2.9f;

        [Header("生成間隔")]
        [SerializeField] private float normalInterval = 0.9f;
        [SerializeField] private float feverInterval = 0.45f;

        private float timer = 0f;

        private void Update()
        {
            if (PukumukuGameManager.Instance != null && !PukumukuGameManager.Instance.IsPlaying)
            {
                return;
            }

            bool isFever = PukumukuGameManager.Instance != null && PukumukuGameManager.Instance.IsFever;
            float interval = isFever ? feverInterval : normalInterval;

            timer += Time.deltaTime;
            if (timer >= interval)
            {
                timer = 0f;
                SpawnBread(isFever);
            }
        }

        private void SpawnBread(bool isFever)
        {
            GameObject prefab = ChoosePrefab(isFever);
            if (prefab == null) return;

            float randomZ = Random.Range(minZ, maxZ);
            Vector3 spawnPos = new Vector3(fixedX, spawnHeightY, randomZ);

            Instantiate(prefab, spawnPos, Quaternion.identity);
        }

        private GameObject ChoosePrefab(bool isFever)
        {
            if (isFever)
            {
                return (Random.value < 0.6f && goldPrefab != null) ? goldPrefab : melonPrefab;
            }

            float r = Random.value;
            if (r < 0.35f) return loafPrefab;
            if (r < 0.63f) return croissantPrefab;
            if (r < 0.85f) return melonPrefab;
            if (r < 0.92f) return burntPrefab;
            return (goldPrefab != null) ? goldPrefab : loafPrefab;
        }
    }
}
