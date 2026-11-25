// 任務清單：最常被改的檔案
// from / to 要填 data/locations.json 裡的 key（例如 dental、lab、office）
// 新增任務只要照格式多加一行
window.MISSIONS=[
 {t:'南部病人搭高鐵上來看診',from:'station',to:'dental',item:'病人'},
 {t:'印模要趕快灌石膏',from:'dental',to:'lab',item:'印模'},
 {t:'Case conference 的 X 光片',from:'dental',to:'office',item:'X 光片'},
 {t:'老師想喝咖啡',from:'store',to:'office',item:'咖啡'},
 {t:'Journal club 論文還沒印',from:'print',to:'office',item:'論文'},
 {t:'器械要送去消毒',from:'dental',to:'csr',item:'器械盒'},
 {t:'學長的牛肉麵',from:'noodle',to:'dental',item:'牛肉麵'},
 {t:'急診來了牙外傷',from:'hospE',to:'dental',item:'牙外傷病人'},
 {t:'植牙手術導板做好了',from:'lab',to:'dental',item:'手術導板'},
 {t:'消毒好的器械要回診間',from:'csr',to:'dental',item:'器械包'},
 {t:'學弟妹要借牙模複習',from:'lab',to:'dorm',item:'齒列模型'},
 {t:'住院病人要牙科會診',from:'dental',to:'hospE',item:'會診單'},
 {t:'兒童醫院會診小朋友蛀牙',from:'dental',to:'kids',item:'兒牙器械'},
 {t:'幫學弟拿國考講義',from:'cram',to:'dorm',item:'國考講義'},
 {t:'老師的音樂會門票',from:'concert',to:'office',item:'門票'},
 {t:'值班總醫師想吃宵夜',from:'ximen',to:'hospE',item:'雞排'},
];

// 升等稱號：[完成件數, 稱號]
window.RANKS=[[0,'大一新生'],[3,'見習生'],[8,'實習醫師'],[15,'住院醫師'],[25,'總醫師'],[40,'主治醫師'],[60,'系主任']];

// 所長任務：被走來走去的所長抓到時觸發
// steps 依序要去的地點；k 填 locations.json 的 key，或填 'boss' 代表回去找所長交差
// msg 是完成那一步時顯示的提示；time 是總時限（秒）
window.BOSS_TASKS=[
 {t:'幫我設計新的手術帽',say:'欸，你來得正好！我們需要新的手術帽，你幫我設計一下。先去西門町買布吧。',time:75,
  steps:[{k:'ximen',msg:'布買好了，拿去技工室做樣品'},{k:'lab',msg:'樣品做好了，拿去給所長看'},{k:'boss'}]},
 {t:'動物實驗資料呢？',say:'你的動物實驗資料整理好了沒？今天一定要給我喔！',time:45,
  steps:[{k:'office',msg:'拿到資料了，快交給所長'},{k:'boss'}]},
 {t:'等一下要開會',say:'五分鐘後開會，記得到國際會議中心，不要遲到。',time:40,
  steps:[{k:'meeting'}]},
 {t:'Abstract 改好了嗎',say:'你那篇 abstract 改好了沒？印一份給我看看。',time:50,
  steps:[{k:'print',msg:'印好了，拿給所長'},{k:'boss'}]},
];
