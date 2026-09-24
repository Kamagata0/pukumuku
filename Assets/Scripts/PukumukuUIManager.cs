using UnityEngine;
using UnityEngine.UI;

namespace Pukumuku
{
    /// <summary>
    /// スマホ・PC両対応の大きな純利益＆タイマーUI
    /// Canvasがない場合でもOnGUIで確実に綺麗に表示されます
    /// </summary>
    public class PukumukuUIManager : MonoBehaviour
    {
        [Header("UI参照 (設定されている場合使用)")]
        [SerializeField] private Text scoreText;
        [SerializeField] private Text timerText;
        [SerializeField] private GameObject resultPanel;
        [SerializeField] private Text finalScoreText;
        [SerializeField] private Text rankText;

        private GUIStyle scoreStyle;
        private GUIStyle timerStyle;
        private GUIStyle feverStyle;

        private void Update()
        {
            if (PukumukuGameManager.Instance == null) return;

            int score = PukumukuGameManager.Instance.Score;
            float time = PukumukuGameManager.Instance.TimeRemaining;

            if (scoreText != null)
            {
                scoreText.text = $"本日の純利益: ¥{score:N0}";
            }
            if (timerText != null)
            {
                timerText.text = $"のこり: {Mathf.CeilToInt(time)}秒";
            }
        }

        private void OnGUI()
        {
            if (PukumukuGameManager.Instance == null) return;

            // スタイル初期化
            if (scoreStyle == null)
            {
                scoreStyle = new GUIStyle(GUI.skin.label)
                {
                    fontSize = Mathf.Max(22, Screen.width / 22),
                    fontStyle = FontStyle.Bold
                };
                scoreStyle.normal.textColor = new Color(0.9f, 0.3f, 0.05f); // オレンジ

                timerStyle = new GUIStyle(GUI.skin.label)
                {
                    fontSize = Mathf.Max(20, Screen.width / 24),
                    fontStyle = FontStyle.Bold
                };
                timerStyle.normal.textColor = new Color(0.2f, 0.6f, 0.2f); // 緑

                feverStyle = new GUIStyle(GUI.skin.label)
                {
                    fontSize = Mathf.Max(24, Screen.width / 18),
                    fontStyle = FontStyle.Bold
                };
                feverStyle.normal.textColor = new Color(1.0f, 0.2f, 0.0f);
            }

            int score = PukumukuGameManager.Instance.Score;
            float time = PukumukuGameManager.Instance.TimeRemaining;
            bool isFever = PukumukuGameManager.Instance.IsFever;

            // 画面上部カード風背景
            float cardWidth = Screen.width * 0.9f;
            float cardX = (Screen.width - cardWidth) * 0.5f;

            GUI.Box(new Rect(cardX, 15, cardWidth, 60), "");

            // 純利益表示
            GUI.Label(new Rect(cardX + 15, 20, 300, 50), $"本日の純利益: ¥{score:N0}", scoreStyle);

            // 残り時間表示
            GUI.Label(new Rect(cardX + cardWidth - 160, 20, 150, 50), $"のこり: {Mathf.CeilToInt(time)}秒", timerStyle);

            // フィーバー演出
            if (isFever)
            {
                GUI.Label(new Rect(Screen.width * 0.5f - 100, 85, 300, 40), "🔥 ほかほかフィーバー!!", feverStyle);
            }

            // ゲーム終了時リザルト画面
            if (!PukumukuGameManager.Instance.IsPlaying)
            {
                float panelW = Mathf.Min(400, Screen.width * 0.85f);
                float panelH = 260;
                float px = (Screen.width - panelW) * 0.5f;
                float py = (Screen.height - panelH) * 0.5f;

                GUI.Box(new Rect(px, py, panelW, panelH), "🎉 本日の営業終了！ 🎉");

                GUIStyle centerLabel = new GUIStyle(GUI.skin.label)
                {
                    fontSize = 20,
                    alignment = TextAnchor.MiddleCenter,
                    fontStyle = FontStyle.Bold
                };

                GUI.Label(new Rect(px, py + 40, panelW, 35), $"本日の純利益: ¥{score:N0}", centerLabel);

                GUIStyle rankStyle = new GUIStyle(centerLabel)
                {
                    fontSize = 22
                };
                rankStyle.normal.textColor = new Color(0.9f, 0.4f, 0.0f);
                GUI.Label(new Rect(px, py + 85, panelW, 40), PukumukuGameManager.Instance.GetRankTitle(), rankStyle);

                GUI.Label(new Rect(px, py + 135, panelW, 30), "「ご来店ありがとうございました！」", centerLabel);

                if (GUI.Button(new Rect(px + 40, py + 185, panelW - 80, 45), "もう一回焼く！（リトライ）"))
                {
                    PukumukuGameManager.Instance.StartGame();
                }
            }
        }
    }
}

