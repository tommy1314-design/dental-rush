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
