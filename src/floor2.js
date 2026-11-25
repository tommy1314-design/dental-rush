// 牙科部二樓（室內地圖 + 支線任務）：第二常被改的檔案
// 座標用平面圖的像素（左上角為原點），遊戲裡會乘上 scale 放大
// 房間：r = [左, 上, 右, 下]；door = 門開在哪一邊（t 上、b 下、l 左、r 右）與門的中心位置
// 診間的牙椅、技工桌等擺設會依 kind 自動產生
window.FLOOR2={
 scale:1.7,
 corridor:[[27,232,1105,325],[623,325,716,528]],     // 橘色走道（T 字形）
 stairs:[669,500],                                     // 樓梯／電梯：按 E 回到一樓門口
 rooms:{
  wait: {n:'候診區',      r:[27,27,145,225],    door:['b',86],  kind:'wait'},
  ps:   {n:'PS 贗復科',   r:[27,332,237,528],   door:['t',132], kind:'clinic'},
  lab:  {n:'技工室',      r:[247,332,320,528],  door:['t',284], kind:'lab'},
  psed: {n:'PS+ED',       r:[331,332,457,528],  door:['t',394], kind:'clinic'},
  ed1:  {n:'ED 牙髓科',   r:[469,332,596,528],  door:['t',532], kind:'clinic'},
  ed2:  {n:'ED 牙髓科',   r:[744,332,910,528],  door:['t',827], kind:'clinic'},
  pr:   {n:'PR 牙周科',   r:[921,332,1105,528], door:['t',1013],kind:'clinic'},
  or:   {n:'PR 手術室',   r:[1114,27,1298,528], door:['l',278], kind:'or'},
 },
 // NPC：站在哪個房間；coat = 穿白袍；idle = 沒有支線時隨機說的話
 npcs:{
  uncle: {n:'阿伯',        room:'wait', coat:false,c:'#a9774a',idle:['今天人怎麼這麼多','我等好久了捏']},
  senior:{n:'牙周科學長',  room:'pr',   coat:true, idle:['今天的 OHI 有確實教嗎？','記得 probing 要六點']},
  nurse: {n:'刀房護理師',  room:'or',   coat:true, c:'#63e6be',idle:['手術室不要亂摸東西喔','無菌區！退後！']},
  tech:  {n:'技工師',      room:'lab',  coat:false,c:'#868e96',idle:['石膏還沒乾，不要碰','你的模型又有氣泡了']},
  psdoc: {n:'贗復科老師',  room:'ps',   coat:true, idle:['margin 再修一下','咬合紙拿來']},
  psed:  {n:'跟診助理',    room:'psed', coat:false,c:'#ffa8a8',idle:['抽吸管在這','下一位病人準備好了']},
  edr:   {n:'牙髓科住院醫師',room:'ed1',coat:true, idle:['這根管好鈣化…','顯微鏡借我一下就好']},
  vs:    {n:'主治醫師',    room:'ed2',  coat:true, idle:['嗯。','你是哪一屆的？']},
 },
 // 支線任務：從 giver 接；steps 依序走到 to 那個人旁邊就會前進
 // follow：這一步那個人會跟在你後面，送到後他就留在那裡
 sideQuests:[
  {id:'lost',  giver:'uncle', t:'迷路的阿伯', ask:'少年仔，牙周科在哪？我要洗牙齦啦',
   steps:[{to:'senior',follow:'uncle',say:'學長：阿伯這邊坐，我們先量牙周囊袋',do:'帶阿伯去【PR 牙周科】'}], reward:150},
  {id:'bone',  giver:'senior',t:'骨粉不見了', ask:'等一下 GBR 要用的骨粉放在技工室，幫我拿去手術室！',
   steps:[{to:'tech',say:'技工師：骨粉在這，別灑了',do:'去【技工室】拿骨粉'},
          {to:'nurse',say:'護理師：收到，放無菌檯上',do:'把骨粉送到【PR 手術室】'}], reward:220},
  {id:'temp',  giver:'psdoc', t:'臨時假牙還沒好', ask:'病人在椅子上等了，臨時假牙去技工室催一下',
   steps:[{to:'tech',say:'技工師：好啦好啦，剛修好',do:'去【技工室】拿臨時假牙'},
          {to:'psdoc',say:'老師：嗯，咬合再調一下就好',do:'拿回【PS 贗復科】'}], reward:180},
  {id:'file',  giver:'edr',   t:'根管銼針用完了', ask:'K-file 用完了！隔壁 PS+ED 那間應該還有',
   steps:[{to:'psed',say:'助理：剩最後一盒，省著用',do:'去【PS+ED】借銼針'},
          {to:'edr',say:'住院醫師：救命恩人，繼續修形',do:'拿回【ED 牙髓科】'}], reward:180},
  {id:'vs',    giver:'nurse', t:'主治人呢？', ask:'植牙手術要劃刀了，主治還在牙髓科聊天！',
   steps:[{to:'vs',say:'主治：喔對，走吧',do:'去【ED 牙髓科】找主治'},
          {to:'nurse',follow:'vs',say:'護理師：老師請刷手，手套 7 號',do:'帶主治回【PR 手術室】'}], reward:260},
 ],
 allDoneReward:500,
};
