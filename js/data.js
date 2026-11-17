/* Somebody to Love — 时间轴与文本
   时间基准：本机 Whisper large-v3-turbo 对 4:57 音源逐句转写，人工对齐官方歌词。
   情绪线：窒息 → 被指认 → 撒手
*/
const SONG = {
  title: 'Somebody to Love',
  artist: 'Queen',
  album: 'A Day at the Races',
  year: 1976,
  key: 'A♭ major',
  bpm: 111,
  dur: 297.02
};

/* 段落：视觉章节 */
const SECTIONS = [
  {
    id: 'intro', t0: 0, t1: 25.6, label: 'I. 呼求', en: 'THE CALL',
    note: '他要的不是爱，是一个能回话的人。整首歌都在等一句回话。'
  },
  {
    id: 'verse1', t0: 25.6, t1: 56.0, label: 'II. 醒来', en: 'WAKING',
    note: '每天醒来先死一点。现在时——不是失恋，是日子本身。'
  },
  {
    id: 'verse2', t0: 56.0, t1: 98.4, label: 'III. 劳作', en: 'LABOUR',
    note: '干活、拿钱、一个人。这三件事写在一句里，就是他的全部生活。'
  },
  {
    id: 'bridge', t0: 98.4, t1: 125.9, label: 'IV. 众声', en: 'THEY SAY',
    note: '这一段没有一句是他说的。全是别人对他的诊断。'
  },
  {
    id: 'chorus', t0: 125.9, t1: 157.8, label: 'V. 呼喊', en: 'THE CRY',
    note: '最后一次用力。他还在相信，喊得够响就会有人来。'
  },
  {
    id: 'verse3', t0: 157.8, t1: 177.6, label: 'VI. 牢房', en: 'THE CELL',
    note: '连拍子都丢了。歌在唱自己唱不下去。'
  },
  {
    id: 'outro', t0: 177.6, t1: 297.02, label: 'VII. 重复', en: 'THE REPEAT',
    note: '同一句重复二十次。到后面已经不是求，是笑。'
  }
];

/* 歌词行 */
const LINES = [
  { t: 3.6,  en: ['Can anybody find me', 'somebody to love?'], zh: '有谁能替我找到一个可以爱的人？', hold: true },

  { t: 25.6, en: ['Each morning I get up', 'I die a little'], zh: '每天早晨我起身，就死去一点', mark: 'die a little',
    note: '不是难过，是「死一点」。他连痛苦都懒得用大词。' },
  { t: 28.7, en: ['Can barely stand', 'on my feet'], zh: '几乎站不住脚' },
  { t: 31.8, en: ['Take a look in the mirror', 'and cry'], zh: '对着镜子看一眼，就哭出来' },
  { t: 35.2, en: ['Lord, what you\'re doing to me'], zh: '主啊，你对我做了什么', mark: 'Lord',
    note: '他开始往上问。因为往下问，没有人接。' },
  { t: 39.2, en: ['I have spent all my years', 'in believing you'], zh: '我这一辈子的岁月，都用来信你', mark: 'spent',
    note: '一辈子押在一件看不见的事上。他不是不信，是账算不平。' },
  { t: 42.3, en: ['But I just can\'t get', 'no relief, Lord'], zh: '可我还是得不到一丝解脱，主啊', mark: 'no relief',
    note: '连一丝都没有。这不是抱怨，是结算。' },
  { t: 45.4, en: ['Somebody (somebody)', 'ooh somebody'], zh: '某个人……某个人……', small: true },
  { t: 48.8, en: ['Can anybody find me'], zh: '有谁能替我找到' },
  { t: 52.9, en: ['somebody to love?'], zh: '一个可以爱的人？' },

  { t: 56.0, en: ['I work hard', '(he works hard)'], zh: '我拼命干活（他拼命干活）', mark: 'work hard' },
  { t: 60.5, en: ['Every day of my life'], zh: '我这一生的每一天' },
  { t: 65.5, en: ['I work \'til I ache my bones'], zh: '干到骨头都疼', mark: 'ache my bones' },
  { t: 68.6, en: ['At the end', '(at the end of the day)'], zh: '一天到头' },
  { t: 71.3, en: ['I take home my hard-earned pay'], zh: '我带回那点血汗钱', mark: 'hard-earned' },
  { t: 74.5, en: ['All on my own'], zh: '全是我一个人', mark: 'on my own',
    note: '钱带回家，家里没有人。' },
  { t: 77.1, en: ['I get down on my knees'], zh: '我跪下来', mark: 'knees' },
  { t: 79.7, en: ['And I start to pray'], zh: '开始祈祷', mark: 'pray',
    note: '跪下去求爱。姿势和求神一模一样——他自己也分不清。' },
  { t: 82.0, en: ['\'Til the tears run down', 'from my eyes'], zh: '直到眼泪从眼里流下来' },
  { t: 84.8, en: ['Somebody (somebody)'], zh: '某个人（某个人）', small: true },
  { t: 88.5, en: ['(Please) can anybody find me', 'somebody to love?'], zh: '（求求你）有谁能替我找到一个可以爱的人？', mark: 'Please' },
  { t: 92.8, en: ['(He works hard) every day'], zh: '（他每天都在拼命）', small: true },

  { t: 98.4, en: ['I try and I try and I try'], zh: '我试了又试，试了又试', mark: 'try',
    note: '三遍。不是修辞，是力竭。' },
  { t: 102.7, en: ['But everybody wants', 'to put me down'], zh: '可所有人都想把我按下去', mark: 'put me down' },
  { t: 106.3, en: ['They say I\'m going crazy'], zh: '他们说我疯了', mark: 'They say',
    note: '最省事的处置：说你疯了，就不用回答你的问题。' },
  { t: 109.1, en: ['They say I got a lot of water', 'in my brain'], zh: '他们说我脑子里灌满了水', mark: 'water in my brain',
    note: '「脑积水」是十九世纪对精神失常的说法。他们用的是一百年前的词。' },
  { t: 112.9, en: ['I got no common sense'], zh: '我没有一点常识' },
  { t: 114.6, en: ['I got nobody left to believe'], zh: '我再没有人可以相信', mark: 'believe',
    note: '不是没人爱他，是没人可信了。这句之后，他不再问神。' },
  { t: 117.7, en: ['Yeah, yeah, yeah, yeah'], zh: '耶，耶，耶，耶', small: true },

  { t: 126.0, en: ['Somebody, somebody, somebody'], zh: '某个人，某个人，某个人', small: true },
  { t: 130.2, en: ['Somebody find me'], zh: '谁来找到我' },
  { t: 135.0, en: ['Somebody, somebody find me'], zh: '某个人，谁来找到我' },
  { t: 139.8, en: ['Somebody to love'], zh: '一个可以爱的人' },
  { t: 143.2, en: ['(Oh Lord) somebody'], zh: '（主啊）某个人' },
  { t: 147.0, en: ['Somebody (somebody)'], zh: '某个人（某个人）', small: true },
  { t: 150.8, en: ['Anybody find me'], zh: '任何人，找到我' },
  { t: 153.4, en: ['somebody to love'], zh: '一个可以爱的人' },

  { t: 157.8, en: ['Got no feel,', 'I got no rhythm'], zh: '我没有感觉，我没有节奏', mark: 'no rhythm',
    note: '连拍子都丢了。这是全曲最诚实的一句：歌在唱自己唱不下去。' },
  { t: 160.8, en: ['I just keep losing my beat'], zh: '我一直在丢掉我的拍子', mark: 'losing my beat' },
  { t: 163.8, en: ['I\'m okay, I\'m alright'], zh: '我没事，我还好', mark: 'okay' },
  { t: 166.2, en: ['I ain\'t gonna face no defeat'], zh: '我不会认输' },
  { t: 168.9, en: ['I just gotta get out', 'of this prison cell'], zh: '我必须离开这间牢房', mark: 'prison cell',
    note: '1976 年，他没有公开性向。这句不是比喻。' },
  { t: 172.9, en: ['Someday I\'m gonna be free, Lord'], zh: '总有一天我会自由，主啊', mark: 'free',
    note: 'Someday——他把自由推到了未来时。他自己也知道等不到。' },

  { t: 178.0,  en: ['Find me somebody to love'], zh: '替我找到一个可以爱的人', out: true },
  { t: 182.3,  en: ['Find me somebody to love'], zh: '替我找到一个可以爱的人', out: true },
  { t: 186.6,  en: ['Find me somebody to love'], zh: '替我找到一个可以爱的人', out: true },
  { t: 190.9,  en: ['Find me somebody to love'], zh: '替我找到一个可以爱的人', out: true },
  { t: 195.2,  en: ['Find me somebody to love'], zh: '替我找到一个可以爱的人', out: true },
  { t: 199.5,  en: ['Find me somebody to love'], zh: '替我找到一个可以爱的人', out: true },
  { t: 203.8,  en: ['Find me somebody to love'], zh: '替我找到一个可以爱的人', out: true },
  { t: 208.1,  en: ['Find me somebody to love'], zh: '替我找到一个可以爱的人', out: true },
  { t: 212.4,  en: ['Find me somebody to love'], zh: '替我找到一个可以爱的人', out: true },
  { t: 216.7,  en: ['Find me somebody to love'], zh: '替我找到一个可以爱的人', out: true },
  { t: 221.0,  en: ['Find me somebody to love'], zh: '替我找到一个可以爱的人', out: true },
  { t: 225.3,  en: ['Find me somebody to love'], zh: '替我找到一个可以爱的人', out: true },
  { t: 229.6,  en: ['Find me somebody to love'], zh: '替我找到一个可以爱的人', out: true },
  { t: 233.9,  en: ['Find me somebody to love'], zh: '替我找到一个可以爱的人', out: true },
  { t: 238.2,  en: ['Find me somebody to love'], zh: '替我找到一个可以爱的人', out: true },
  { t: 242.5,  en: ['Somebody, somebody', 'find me somebody to love'], zh: '某个人，某个人，替我找到', out: true },
  { t: 246.8,  en: ['Find me somebody to love'], zh: '替我找到一个可以爱的人', out: true },
  { t: 251.1,  en: ['Find me somebody to love'], zh: '替我找到一个可以爱的人', out: true },
  { t: 255.4,  en: ['Find me somebody to love'], zh: '替我找到一个可以爱的人', out: true },
  { t: 259.7,  en: ['Find me somebody to love'], zh: '替我找到一个可以爱的人', out: true },
  { t: 264.0,  en: ['Find me somebody to love'], zh: '替我找到一个可以爱的人', out: true },
  { t: 268.3,  en: ['Can anybody find me'], zh: '有谁能替我找到', out: true },
  { t: 272.6,  en: ['somebody to love?'], zh: '一个可以爱的人？', out: true },
  { t: 277.0,  en: ['Find me, find me,', 'find me somebody to love'], zh: '找到我，找到我，找到我', out: true },
  { t: 281.3,  en: ['Anybody, anywhere', 'find me somebody to love'], zh: '任何人，任何地方，替我找到', out: true },
  { t: 285.6,  en: ['Find me somebody to love'], zh: '替我找到一个可以爱的人', out: true },
  { t: 289.9,  en: ['Find me somebody to love'], zh: '替我找到一个可以爱的人', out: true },
  { t: 293.4,  en: ['无所谓了'], zh: '', out: true, last: true }
];

/* 完整解析 */
const ESSAY = [
  {
    h: '一、每天醒来先死一点',
    p: '开场不是失恋，是起床。「Each morning I get up I die a little」——现在时，每天。他没有用痛苦、绝望、孤独这些大词，他给的是一个可以量化的损耗：一天死一点。副歌在问「有谁能替我找到一个人」，但主歌说的是另一件事：他已经没有力气去爱了，他想要的是有人来把他从床上捞起来。'
  },
  {
    h: '二、他在跟谁说话',
    p: '全曲被反复呼喊的是 Lord——主啊。「Lord, what you\'re doing to me」、「I have spent all my years in believing you / But I just can\'t get no relief」。这是跟神算账：我信了你一辈子，连一丝解脱都没换到。所以这不是情歌，是一封没有回音的信。神不回答，他就把那个位置清空，换成一个具体的人：有谁能替我找到。这句问句唱了二十多遍，一遍也没得到回答。'
  },
  {
    h: '三、生活是怎么把人磨平的',
    p: '第二段从祷告切进工作：干到骨头疼，带回一点血汗钱，「全是我一个人」。干活、拿钱、孤独，三件事写在同一段里，就是他的全部生活。然后他跪下去——不是跪神，是跪着求爱。祈祷的姿势和求爱的姿势是同一个姿势，他自己都分不清在求谁。这是全歌最绝望的地方：他连求救的对象都搞混了。'
  },
  {
    h: '四、他们说我疯了',
    p: '第四段没有一句是他说的，全是别人对他的诊断：疯了、脑子进水、没有常识。「脑积水」是十九世纪医学对精神失常的说法——他们用的是一百年前的词。合唱团在这里不是支持者，是陪审团。最省事的处置方式就是：说你疯了，就不用回答你的问题了。也是从这里开始，他把「疯了」这个身份接了过来。'
  },
  {
    h: '五、牢房不是比喻',
    p: '「我没有感觉，我没有节奏，我一直在丢拍子」——抑郁症的另一种说法，同时也是这首歌在唱自己唱不下去。「我必须离开这间牢房，总有一天我会自由。」1976 年，Freddie Mercury 没有公开自己的性向；他出生在桑给巴尔，是移民、帕西人、琐罗亚斯德教徒的儿子。对一个必须在众声里活成「正常」的人，这句是字面意思。而 Someday——他把自由推到了未来时。'
  },
  {
    h: '六、最后他怎么不疼了',
    p: '结尾同一句重复二十多遍，声音一层层叠上去，越来越高、越来越亮。这不是终于找到了爱，是他放弃了被回答这件事——既然没有人来，那就把这句话喊到没有意义为止。到后面它已经不是求，是笑。唱片里那座听起来上百人的福音合唱团，其实只有三个人的嗓子（Freddie、Brian、Roger）一层层叠出来：一个人用三个人的声音造出一群人的回应，去填没有回应的空。'
  }
];
