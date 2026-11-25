# 牙醫系狂飆

以台大醫院牙科部周邊 1 km 為地圖的俯視角開放世界小遊戲：騎機車送印模、接病人、躲總醫師。
原創同人作品，與國立臺灣大學及台大醫院官方無關。

## 怎麼玩

直接用瀏覽器打開 `index.html`，或開啟 GitHub Pages 網址。

| 操作 | 鍵盤 | 手機 |
|---|---|---|
| 移動 | WASD／方向鍵 | 左半邊拖曳 |
| 上下機車／搭捷運／進出牙科部 2F／跟 NPC 對話 | E | 右下按鈕 |

## 檔案結構

```
index.html            頁面、標題畫面、CSS
src/missions.js       任務清單、升等稱號  ← 最容易改
src/floor2.js         牙科部二樓：房間配置、NPC、支線任務  ← 也很好改
src/game.js           遊戲主程式（移動、車流、任務、繪圖）
src/map.js            地圖資料（自動產生，不要手改）
data/locations.json   任務地點對應到哪棟建築  ← 第二容易改
data/ntu-dental-osm.json  OpenStreetMap 原始資料
tools/build_map.py    把 OSM 資料 + locations.json 轉成 src/map.js
```

## 常見修改

**新增任務**：在 `src/missions.js` 加一行，`from`/`to` 填 `data/locations.json` 裡的 key。

**牙科部二樓**：在牙醫學系門口按 E 上樓。房間、NPC 和支線任務都在 `src/floor2.js`，座標用平面圖像素；新增支線就在 `sideQuests` 照格式加一筆（`giver` 是誰給任務、`steps` 依序要找的人，`follow` 代表那個人會跟著你走）。

**改任務地點在哪棟**：改 `data/locations.json` 的 `building`（要和 OSM 建築名稱完全相同），然後重建地圖：

```bash
python3 tools/build_map.py
```

只需要 Python 3，不用裝其他套件。新增地點 key 也是在這裡加。

**改遊戲邏輯或美術**：改 `src/game.js`。

詳細流程見 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 授權

- 地圖資料 © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors，採 ODbL 授權；遊戲畫面左下角必須保留這行標示。
- 程式碼授權待定（見 LICENSE）。
