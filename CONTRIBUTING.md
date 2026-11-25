# 一起改遊戲

## 流程

1. 從 `main` 開一個新分支，名稱寫你要做的事，例如 `add-ortho-missions`。
2. 改完後在本機用瀏覽器打開 `index.html` 試玩一下。
3. 推上去開 Pull Request，描述改了什麼；有畫面變化的話附一張截圖。
4. 至少一個人看過再合併到 `main`。

不會用 git 的話，也可以直接在 GitHub 網頁上編輯 `src/missions.js` 或 `data/locations.json`，存檔時選「建立新分支並開 Pull Request」。

## 分工建議（減少衝突）

| 想做的事 | 改哪個檔案 |
|---|---|
| 新任務、改任務文字 | `src/missions.js` |
| 任務地點換到別棟 | `data/locations.json`，再跑 `python3 tools/build_map.py` |
| 新玩法、手感、美術 | `src/game.js` |
| 標題畫面、說明文字 | `index.html` |

`src/map.js` 是自動產生的，請不要手改；兩個人同時改 `locations.json` 時，合併後重跑一次 `build_map.py` 即可。

## 內容規範

- 不放真實病人資料或可辨識個人的資訊。
- 用到真實老師、同學的名字或梗之前，先問過本人。
- 保留畫面上的「© OpenStreetMap contributors」標示。
