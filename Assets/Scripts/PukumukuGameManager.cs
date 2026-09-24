using UnityEngine;

namespace Pukumuku
{
    /// <summary>
    /// 純利益（スコア）や制限時間、ゲームループを統括するマネージャー
    /// </summary>
    public class PukumukuGameManager : MonoBehaviour
    {
        public static PukumukuGameManager Instance { get; private set; }

        [Header("ゲーム設定")]
        [SerializeField] private float gameDuration = 45f;

        public bool IsPlaying { get; private set; } = true;
        public bool IsFever { get; private set; } = false;
        public int Score { get; private set; } = 0;
        public float TimeRemaining { get; private set; } = 45f;

        private int comboCount = 0;
        private float feverTimer = 0f;

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
            }
            else
            {
                Destroy(gameObject);
            }
        }

        private void Start()
        {
            StartGame();
        }

        private void Update()
        {
            if (!IsPlaying) return;

            TimeRemaining -= Time.deltaTime;
            if (TimeRemaining <= 0)
            {
                TimeRemaining = 0;
                EndGame();
            }

            if (IsFever)
            {
                feverTimer -= Time.deltaTime;
                if (feverTimer <= 0)
                {
                    IsFever = false;
                }
            }
        }

        public void StartGame()
        {
            Score = 0;
            TimeRemaining = gameDuration;
            comboCount = 0;
            IsFever = false;
            IsPlaying = true;
        }

        public void OnBreadCollected(BreadType type, int points)
        {
            if (!IsPlaying) return;

            if (type == BreadType.Burnt)
            {
                comboCount = 0;
                return;
            }

            Score += points;
            comboCount++;

            // 5連続キャッチでフィーバー突入！
            if (comboCount >= 5 && !IsFever)
            {
                IsFever = true;
                feverTimer = 8.0f;
            }
        }

        public void AddScore(int amount)
        {
            Score += amount;
        }

        private void EndGame()
        {
            IsPlaying = false;
            Debug.Log($"【本日の営業終了！】純利益: ¥{Score:N0}");
        }

        public string GetRankTitle()
        {
            if (Score >= 15000) return "👑 伝説の黒字経営マスター！";
            if (Score >= 10000) return "🌟 三軒茶屋の大繁盛店長！";
            if (Score >= 5000) return "🥐 街の愛されパン職人！";
            if (Score >= 2000) return "🍞 黒字達成！看板バイト純くん";
            return "🐣 見習いパン焼き純くん";
        }
    }
}

