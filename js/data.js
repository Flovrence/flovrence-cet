/* ============================================================
 * 数据文件：考试场次 / 真题与模拟题库 / 朗读短文 / 听力套题
 * 考试日期与形式均来自教育部教育考试院官网（见 EXAM_SOURCES）
 * 真题话题来源：《新东方·大学英语四六级口语高频话题分类》(2026-03 整理)
 *              以及历年真题回忆（网络公开整理，标注 source）
 * 听力原文与朗读短文为本站原创仿真题文本（避免版权问题且可 TTS 朗读）
 * ============================================================ */
window.CET_DATA = (function () {

  /* ---------------- 官方信息源 ---------------- */
  const EXAM_SOURCES = [
    { label: '2026下半年官方通知（笔12月12日，口11/21-22）', url: 'https://cet.neea.edu.cn/html1/report/2609/1-1.htm' },
    { label: '2026上半年官方通知（笔6月13日，口5/23-24）', url: 'https://stecn.neea.cn/html1/report/2603/2-1.htm' },
    { label: '2025下半年官方通知（笔12月13日，口11/22-23）', url: 'https://ntce.neea.cn/html1/report/2509/26-1.htm' },
    { label: '2025上半年官方通知（笔6月14日，口5/24-25）', url: 'https://cet.neea.edu.cn/html1/report/2503/19-1.htm' },
    { label: 'CET口试官方考试形式说明', url: 'https://cet.neea.edu.cn/html1/folder/16113/1587-1.htm' },
    { label: '官方报名系统', url: 'https://cet-bm.neea.edu.cn/' },
    { label: '官方成绩查询', url: 'https://cet.neea.edu.cn/cet/' },
  ];

  /* ---------------- 考试场次（官方日期） ----------------
   * 注意：口语考试与笔试（含听力）不是同一天！各自倒计时。
   * 等级说明：口试每年5月和11月；笔试6月和12月。
   * CET4口试在前一天，CET6口试在后一天。
   */
  const EXAM_SESSIONS = [
    {
      id: '2026-2',
      label: '2026年12月（下半年）',
      note: '最近一次考试',
      written: '2026-12-12',       // 笔试（含听力）
      writtenTime: '上午 9:00-11:20(四级) / 下午 15:00-17:25(六级)',
      oral4: '2026-11-21',
      oral6: '2026-11-22',
    },
    {
      id: '2026-1',
      label: '2026年6月（上半年）',
      note: '已考过',
      written: '2026-06-13',
      writtenTime: '上午 9:00-11:20(四级) / 下午 15:00-17:25(六级)',
      oral4: '2026-05-23',
      oral6: '2026-05-24',
    },
    {
      id: '2025-2',
      label: '2025年12月（下半年）',
      note: '已考过',
      written: '2025-12-13',
      writtenTime: '上午 9:00-11:20(四级) / 下午 15:00-17:25(六级)',
      oral4: '2025-11-22',
      oral6: '2025-11-23',
    },
    {
      id: '2025-1',
      label: '2025年6月（上半年）',
      note: '已考过',
      written: '2025-06-14',
      writtenTime: '上午 9:00-11:20(四级) / 下午 15:00-17:25(六级)',
      oral4: '2025-05-24',
      oral6: '2025-05-25',
    },
  ];

  /* ---------------- 口语考试官方形式 ---------------- */
  const EXAM_FORMAT = {
    4: [
      { part: 'Part 1', name: '自我介绍', detail: '根据考官指令，每位考生作一个简短的自我介绍。', time: '20 秒/人', prep: 0, speak: 20 },
      { part: 'Part 2', name: '短文朗读', detail: '准备后朗读一篇约120词的短文。', time: '准备45秒 + 朗读1分钟', prep: 45, speak: 60 },
      { part: 'Part 3', name: '简短回答', detail: '回答2个与朗读短文有关的问题。', time: '2 个问题，各 40 秒', prep: 0, speak: 40 },
      { part: 'Part 4', name: '个人陈述', detail: '根据所给提示作陈述。', time: '准备45秒 + 陈述1分钟', prep: 45, speak: 60 },
      { part: 'Part 5', name: '两人互动', detail: '与同伴就设定情景和任务进行交谈。', time: '准备1分钟 + 互动3分钟', prep: 60, speak: 180 },
    ],
    6: [
      { part: 'Part 1', name: '自我介绍和问答', detail: '先自我介绍，再回答考官提问。', time: '自我介绍20秒；问答每题30秒', prep: 0, speak: 30 },
      { part: 'Part 2', name: '陈述和讨论', detail: '根据提示作个人陈述，随后与同伴讨论。', time: '准备1分钟 + 陈述1分30秒 + 讨论3分钟', prep: 60, speak: 90 },
      { part: 'Part 3', name: '问答', detail: '回答考官的最后一个问题。', time: '约 1 分钟', prep: 0, speak: 60 },
    ],
  };

  /* ---------------- 朗读短文（原创仿真题，约120词） ---------------- */
  const READING_PASSAGES = [
    {
      id: 'RP1',
      title: 'Reading in the Digital Age',
      text: 'Reading has always been one of the most important ways for people to gain knowledge. In the past, we enjoyed reading paper books in a quiet library, turning pages slowly and thinking carefully. Today, however, many of us prefer reading on smartphones or e-readers because they are light and convenient. We can store hundreds of books in a single device and read anywhere, even on a crowded bus. But some experts worry that people now read too quickly and too carelessly, skipping sentences without understanding them fully. In my opinion, what really matters is not the way we read, but whether we keep the habit of reading. A person who reads every day, no matter in print or on screen, will surely benefit from the ideas and wisdom of great writers.',
      questions: [
        'According to the passage, why do many people prefer reading on smartphones?',
        'Why do some experts worry about today\'s reading habits?',
        'What does the speaker think really matters about reading?',
      ],
    },
    {
      id: 'RP2',
      title: 'Morning Exercise on Campus',
      text: 'Every morning at six thirty, more than two hundred students gather on the sports ground to do morning exercise. The activity was started by the students\' union three years ago to help students develop a healthy lifestyle. Some students join in because they want to lose weight and stay fit, while others come to make new friends and enjoy the fresh air. The exercise lasts about twenty minutes and includes stretching, running and light weight training. Teachers say the students who take part in the activity are more energetic in class and seldom fall ill. Although getting up early is not easy for everyone, most participants agree that the daily routine has changed their lives for the better.',
      questions: [
        'When and where do the students do the morning exercise?',
        'Why was the morning exercise activity started?',
        'What do the teachers say about the students who join the activity?',
      ],
    },
    {
      id: 'RP3',
      title: 'Online Learning in College',
      text: 'Online learning has become very popular among college students in recent years. With a computer and an internet connection, students can watch recorded lessons from famous universities, take part in live discussions, and download study materials at any time. One of the greatest advantages of online courses is flexibility: learners can arrange their study according to their own schedules. However, online learning also has its problems. Some students feel lonely because there is no one sitting next to them, and others find it hard to stay focused when their favorite games are only one click away. To solve these problems, schools encourage students to form study groups online, so that they can help each other and stay focused on their goals.',
      questions: [
        'What can students do through online learning according to the passage?',
        'What is one of the greatest advantages of online courses?',
        'How do schools help students stay focused on online learning?',
      ],
    },
    {
      id: 'RP4',
      title: 'A Community Cleanup Day',
      text: 'Last Saturday, volunteers from our neighborhood worked together to clean a local park. More than eighty people, including students, shop owners and retired teachers, joined the activity early in the morning. They collected plastic bottles, picked up fallen branches, and planted young trees along the paths. By noon, the park looked much cleaner and more beautiful. The organizer said the event was not only about cleaning, but also about teaching people to protect the environment. Many volunteers were glad to take part and promised to come again next season. They believe that small actions, when done together, can make a big difference to the community and the planet.',
      questions: [
        'Who joined the cleanup activity in the park?',
        'What did the volunteers do in the park?',
        'What did the organizer say the event was really about?',
      ],
    },
  ];

  /* ---------------- 口语真题与模拟题题库 ---------------- */
  /*
   * kind: intro(自我介绍) / qa(问答-简短回答) / statement(个人陈述) / discussion(两人互动)
   * real: true = 真题/真题风格（网上公开回忆或权威整理）；false = 本站模拟题
   * source: 来源说明
   * keywords: 话题关键词，用于本地评分切题度
   */
  const Q4 = {
    intros: [
      { id: '4i1', text: 'Good morning! Welcome to the CET-SET4 exam. Please introduce yourself briefly. You may talk about your name, your major, your hobbies or your hometown. You have about 20 seconds.', real: true, source: '真题风格（官方流程 Part 1）' },
      { id: '4i2', text: 'Hello, nice to meet you. Could you give us a brief self-introduction? Tell us something about your study and your free time. About 20 seconds, please.', real: false, source: '本站模拟题' },
    ],
    qa: [
      { id: '4q1', topic: '校园学习', text: 'How do you usually study English in your spare time?', followUps: ['What do you find hardest about learning English?', 'Do you prefer studying alone or with friends?'], keywords: ['study', 'english', 'listen', 'read', 'speak', 'word', 'practice', 'class', 'friend'], real: true, source: '新东方真题高频话题整理' },
      { id: '4q2', topic: '大学生活', text: 'How do you adapt to college life?', followUps: ['What was the biggest change for you?', 'What advice would you give to new students?'], keywords: ['adapt', 'college', 'life', 'campus', 'new', 'change', 'roommate', 'class'], real: true, source: '新东方真题高频话题整理' },
      { id: '4q3', topic: '校园活动', text: 'Talk about a campus activity you have taken part in.', followUps: ['Did you enjoy it? Why?', 'Would you join it again?'], keywords: ['activity', 'campus', 'join', 'club', 'volunteer', 'sports', 'fun', 'friend'], real: true, source: '新东方真题高频话题整理' },
      { id: '4q4', topic: '人际关系', text: 'How do you get along with your roommates?', followUps: ['What do you usually do together?', 'How do you solve problems between you?'], keywords: ['roommate', 'get along', 'friend', 'talk', 'help', 'respect', 'share'], real: true, source: '新东方真题高频话题整理' },
      { id: '4q5', topic: '科技生活', text: 'How do smart phones affect your daily life?', followUps: ['Do you think you use your phone too much?', 'What do you use your phone for most?'], keywords: ['smart phone', 'life', 'use', 'message', 'study', 'game', 'time', 'convenient'], real: true, source: '新东方真题高频话题整理' },
      { id: '4q6', topic: '电子支付', text: 'Do you usually use electronic payment? Why or why not?', followUps: ['Is it safe to pay online?', 'When do you prefer to use cash?'], keywords: ['pay', 'payment', 'money', 'phone', 'cash', 'safe', 'convenient', 'online'], real: true, source: '新东方真题高频话题整理' },
      { id: '4q7', topic: '社交媒体', text: 'Are you willing to post your photos on social media?', followUps: ['What kind of photos do people usually post?', 'Anything you would never post online?'], keywords: ['photo', 'social media', 'share', 'post', 'friend', 'privacy', 'online'], real: true, source: '新东方真题高频话题整理' },
      { id: '4q8', topic: '环境保护', text: 'What can individuals do to protect the environment?', followUps: ['Do you do any of these things yourself?', 'What should schools do about it?'], keywords: ['protect', 'environment', 'recycle', 'plastic', 'energy', 'save', 'pollution', 'green'], real: true, source: '新东方真题高频话题整理' },
      { id: '4q9', topic: '职业理想', text: 'What is your dream job? Why?', followUps: ['What should you do to prepare for it?', 'Is salary the most important thing to you?'], keywords: ['dream', 'job', 'work', 'interest', 'future', 'study', 'skill', 'career'], real: true, source: '新东方真题高频话题整理' },
      { id: '4q10', topic: '空余时间', text: 'How do you usually spend your free time?', followUps: ['Do you prefer staying at home or going out?', 'What do you do with your friends?'], keywords: ['free time', 'weekend', 'hobby', 'music', 'movie', 'sports', 'friend', 'relax'], real: true, source: '新东方真题高频话题整理' },
      { id: '4q11', topic: '购物', text: 'Do you prefer shopping online or in stores? Why?', followUps: ['What did you buy recently?', 'How do you choose what to buy?'], keywords: ['shop', 'online', 'store', 'buy', 'cheap', 'convenient', 'price', 'quality'], real: true, source: '新东方真题高频话题整理' },
      { id: '4q12', topic: '健康运动', text: 'How do you keep healthy in your daily life?', followUps: ['Do you do any sports?', 'What is your advice for staying healthy?'], keywords: ['healthy', 'sport', 'exercise', 'run', 'sleep', 'food', 'body', 'habit'], real: true, source: '新东方真题高频话题整理' },
      { id: '4q13', topic: '模拟·旅游', text: 'If you had a free weekend, where would you like to go?', followUps: ['Who would you go with?', 'What would you do there?'], keywords: ['travel', 'weekend', 'go', 'place', 'friend', 'visit', 'relax'], real: false, source: '本站模拟题' },
      { id: '4q14', topic: '模拟·电影', text: 'Do you like watching movies? What kind of movies do you like best?', followUps: ['Do you watch movies alone or with others?', 'What was the last film you enjoyed?'], keywords: ['movie', 'film', 'watch', 'like', 'story', 'cinema', 'funny'], real: false, source: '本站模拟题' },
      { id: '4q15', topic: '模拟·美食', text: 'What is your favorite food? Why do you like it?', followUps: ['Can you cook?', 'Do you prefer eating at home or in restaurants?'], keywords: ['food', 'like', 'eat', 'taste', 'restaurant', 'cook', 'favorite'], real: false, source: '本站模拟题' },
    ],
    statements: [
      { id: '4s1', topic: '我的大学生活', prompt: 'Your university is going to make a short video about students\' daily life. Please talk about your routine in college and why you like it.', keywords: ['college', 'study', 'class', 'library', 'routine', 'life', 'friend', 'enjoy'], real: true, source: '新东方真题高频话题整理' },
      { id: '4s2', topic: '我最喜欢的运动', prompt: 'Your school is promoting sports among students. Please talk about your favorite sport and why students should take part in it.', keywords: ['sport', 'exercise', 'health', 'team', 'play', 'body', 'good'], real: true, source: '新东方真题高频话题整理' },
      { id: '4s3', topic: '手机的作用', prompt: 'Smart phones are everywhere in our life. Please talk about the role smart phones play in your daily life.', keywords: ['phone', 'use', 'life', 'study', 'contact', 'information', 'convenient'], real: true, source: '新东方真题高频话题整理' },
      { id: '4s4', topic: '节约用水', prompt: 'Water is important for everyone. Please talk about what college students can do to save water on campus.', keywords: ['water', 'save', 'protect', 'resource', 'use', 'campus', 'environment'], real: true, source: '新东方真题高频话题整理' },
      { id: '4s5', topic: '模拟·我最喜欢的老师', prompt: 'Please talk about a teacher who impressed you most in college and what you learned from him or her.', keywords: ['teacher', 'class', 'learn', 'help', 'patient', 'knowledge', 'remember'], real: false, source: '本站模拟题' },
      { id: '4s6', topic: '模拟·校园里的共享单车', prompt: 'Shared bikes are very common on campus now. Please talk about the advantages and problems of shared bikes.', keywords: ['bike', 'campus', 'use', 'convenient', 'problem', 'environment', 'traffic'], real: false, source: '本站模拟题' },
      { id: '4s7', topic: '模拟·兼职经历', prompt: 'Many students take part-time jobs. Please talk about the benefits of doing a part-time job as a college student.', keywords: ['job', 'work', 'part-time', 'money', 'experience', 'skill', 'study', 'balance'], real: false, source: '本站模拟题' },
    ],
    discussions: [
      { id: '4d1', topic: '新建图书馆', scenario: 'Your university plans to build a new library. Discuss with your partner what should be included in the new library and how it can serve students better.', partnerOpen: 'I think the new library should have more study rooms, because so many students complain that seats are always full. What do you think?', keywords: ['library', 'books', 'study room', 'computer', 'quiet', 'student', 'open', 'wifi'], real: true, source: '新东方真题高频话题整理' },
      { id: '4d2', topic: '校园节能', scenario: 'Your school is planning a month-long energy-saving campaign. Discuss with your partner what activities the campaign should include.', partnerOpen: 'We could start by turning off lights and air conditioners in empty classrooms. What other activities can you suggest?', keywords: ['energy', 'save', 'electricity', 'campaign', 'school', 'activity', 'water', 'environment'], real: true, source: '新东方真题高频话题整理' },
      { id: '4d3', topic: '社团招新', scenario: 'The students\' union is going to hold a club recruitment week. Discuss with your partner which clubs are the most popular and how to attract new members.', partnerOpen: 'Sports clubs are always popular on campus. How should we make other clubs more attractive to freshmen?', keywords: ['club', 'recruit', 'member', 'student', 'activity', 'interest', 'freshman', 'campus'], real: false, source: '本站模拟题' },
      { id: '4d4', topic: '食堂改进', scenario: 'Students have given some feedback about the campus canteen. Discuss with your partner how the canteen services can be improved.', partnerOpen: 'Some students say the canteen is too crowded at noon. What is your suggestion to solve this problem?', keywords: ['canteen', 'food', 'student', 'cheap', 'healthy', 'crowded', 'improve', 'menu'], real: false, source: '本站模拟题' },
    ],
  };

  const Q6 = {
    intros: [
      { id: '6i1', text: 'Good morning! Welcome to the CET-SET6 exam. Please introduce yourself briefly (about 20 seconds). After that I will ask you a question.', real: true, source: '真题风格（官方流程 Part 1）' },
      { id: '6i2', text: 'Hello, welcome. First, a brief self-introduction, please. Then I have a question for you.', real: false, source: '本站模拟题' },
    ],
    qa: [
      { id: '6q1', topic: '高等教育', text: 'Do you think college education should focus more on practical skills? Why?', followUps: ['What balance should colleges strike between theory and practice?', 'What skills should students develop besides textbooks?'], keywords: ['college', 'education', 'practical', 'skill', 'theory', 'job', 'knowledge', 'training'], real: true, source: '新东方真题高频话题整理' },
      { id: '6q2', topic: '线上课程', text: 'What are the advantages and disadvantages of online classes in college?', followUps: ['Do you think online classes will replace traditional ones?', 'How can students stay focused in online classes?'], keywords: ['online', 'class', 'course', 'advantage', 'disadvantage', 'face to face', 'focus', 'technology'], real: true, source: '新东方真题高频话题整理' },
      { id: '6q3', topic: '平衡发展', text: 'How do you balance study and extracurricular activities in college?', followUps: ['What is more important for a student, grades or experience?', 'Do you have a time management routine?'], keywords: ['balance', 'study', 'activity', 'time', 'manage', 'plan', 'priority', 'experience'], real: true, source: '新东方真题高频话题整理' },
      { id: '6q4', topic: '社团意义', text: 'What is the significance of campus clubs for college students?', followUps: ['Are you a member of any club?', 'How do clubs help students grow?'], keywords: ['club', 'campus', 'student', 'communication', 'skill', 'friendship', 'organize', 'develop'], real: true, source: '新东方真题高频话题整理' },
      { id: '6q5', topic: '人工智能', text: 'Talk about the impact of AI on college students\' study.', followUps: ['Should students be allowed to use AI tools in homework?', 'What should universities do to guide students using AI?'], keywords: ['ai', 'artificial intelligence', 'study', 'technology', 'tool', 'homework', 'learning', 'efficiency'], real: true, source: '新东方真题高频话题整理' },
      { id: '6q6', topic: '社交媒体利弊', text: 'What are the advantages and disadvantages of social media for college students?', followUps: ['How do you control your time on social media?', 'Do you trust the information on social media?'], keywords: ['social media', 'information', 'communication', 'addiction', 'privacy', 'time', 'news', 'influence'], real: true, source: '新东方真题高频话题整理' },
      { id: '6q7', topic: '网络犯罪', text: 'How can we combat cyber crimes?', followUps: ['What should individuals do to protect their information?', 'What role should the government play?'], keywords: ['cyber', 'crime', 'safety', 'protect', 'information', 'law', 'password', 'online'], real: true, source: '新东方真题高频话题整理' },
      { id: '6q8', topic: '垃圾分类', text: 'What do you think of garbage classification?', followUps: ['Is it easy to practice in daily life?', 'What can colleges do to promote it?'], keywords: ['garbage', 'classification', 'recycle', 'environment', 'habit', 'waste', 'campus'], real: true, source: '新东方真题高频话题整理' },
      { id: '6q9', topic: '环保与经济', text: 'How should we balance economic development and environmental protection?', followUps: ['Should factories pay for pollution?', 'What can young people contribute?'], keywords: ['economy', 'development', 'environment', 'balance', 'pollution', 'green', 'industry', 'sustainable'], real: true, source: '新东方真题高频话题整理' },
      { id: '6q10', topic: '职业规划', text: 'How do you make your career plan in college?', followUps: ['What factors influence your career choice?', 'How do you improve your employability?'], keywords: ['career', 'plan', 'job', 'future', 'skill', 'internship', 'goal', 'preparation'], real: true, source: '新东方真题高频话题整理' },
      { id: '6q11', topic: '大城市还是小城市', text: 'Do you prefer to work in a big city or a small city after graduation? Why?', followUps: ['What are the trade-offs of each choice?', 'Where do you plan to live in five years?'], keywords: ['big city', 'small city', 'work', 'opportunity', 'life', 'cost', 'family', 'future'], real: true, source: '新东方真题高频话题整理' },
      { id: '6q12', topic: '薪水与发展', text: 'Which is more important in job hunting: salary or development space?', followUps: ['Would you accept a lower salary for a better platform?', 'How does a young person balance both?'], keywords: ['salary', 'development', 'job', 'opportunity', 'growth', 'career', 'choose'], real: true, source: '新东方真题高频话题整理' },
      { id: '6q13', topic: '模拟·远程办公', text: 'More companies are allowing employees to work from home. What do you think of remote work?', followUps: ['What are its advantages and disadvantages?', 'Which jobs suit remote work best?'], keywords: ['remote', 'work', 'home', 'office', 'efficiency', 'communication', 'flexible', 'company'], real: false, source: '本站模拟题' },
      { id: '6q14', topic: '模拟·终身学习', text: 'Do you agree that people should keep learning all their lives? Why?', followUps: ['How do adults usually keep learning?', 'What do you want to learn in the future?'], keywords: ['learn', 'lifelong', 'knowledge', 'skill', 'change', 'society', 'improve'], real: false, source: '本站模拟题' },
    ],
    statements: [
      { id: '6s1', topic: '科技进步', prompt: 'The pace of technological progress is amazing. Please give a presentation on the technology progress in recent years and its influence on our life.', keywords: ['technology', 'progress', 'ai', 'internet', 'life', 'change', 'convenient', 'development'], real: true, source: '新东方真题高频话题整理' },
      { id: '6s2', topic: '可持续发展', prompt: 'Sustainability has become a global concern. Please give a presentation on the significance of sustainable development.', keywords: ['sustainable', 'development', 'environment', 'resource', 'future', 'protect', 'energy'], real: true, source: '新东方真题高频话题整理' },
      { id: '6s3', topic: '就业压力', prompt: 'Graduates are facing growing pressure in the job market. Please give a presentation on the challenges graduates face and how to deal with them.', keywords: ['job', 'graduate', 'pressure', 'challenge', 'market', 'skill', 'competition', 'preparation'], real: true, source: '新东方真题高频话题整理' },
      { id: '6s4', topic: '大学生环保行动', prompt: 'Please give a presentation on how college students can promote environmental protection on campus.', keywords: ['environment', 'protection', 'campus', 'student', 'activity', 'recycle', 'awareness'], real: true, source: '新东方真题高频话题整理' },
      { id: '6s5', topic: '模拟·AI的未来', prompt: 'Artificial intelligence is developing rapidly. Please give a presentation on the future development of AI and how we should get prepared.', keywords: ['ai', 'future', 'development', 'prepare', 'job', 'society', 'technology', 'human'], real: false, source: '本站模拟题' },
      { id: '6s6', topic: '模拟·在线学习的趋势', prompt: 'Online education is growing fast. Please give a presentation on the trend of online education and its effect on traditional universities.', keywords: ['online', 'education', 'trend', 'university', 'traditional', 'course', 'change', 'technology'], real: false, source: '本站模拟题' },
      { id: '6s7', topic: '模拟·青年与阅读', prompt: 'Young people spend more time on screens than on books. Please give a presentation on the value of reading for young people today.', keywords: ['reading', 'book', 'young', 'screen', 'habit', 'knowledge', 'thinking', 'deep'], real: false, source: '本站模拟题' },
    ],
    discussions: [
      { id: '6d1', topic: 'AI进课堂', scenario: 'Some universities are introducing AI tools into classrooms. Discuss with your partner whether AI should be widely used in college teaching, and how.', partnerOpen: 'I believe AI can make classes more personalized. For example, it can offer exercises that fit each student\'s level. How do you see it?', keywords: ['ai', 'classroom', 'teaching', 'student', 'tool', 'personalized', 'teacher', 'benefit'], real: true, source: '新东方真题高频话题整理' },
      { id: '6d2', topic: '校园绿色出行', scenario: 'The campus is encouraging green travel to reduce carbon emissions. Discuss with your partner what measures the university should take.', partnerOpen: 'I think the university could build more bike stations and make public buses free on campus. What\'s your suggestion?', keywords: ['green', 'travel', 'campus', 'bike', 'bus', 'carbon', 'environment', 'measure'], real: true, source: '新东方真题高频话题整理' },
      { id: '6d3', topic: '模拟·大学生创业', scenario: 'The university provides funding for student startups. Discuss with your partner the advantages and risks of starting a business as a student.', partnerOpen: 'Starting a business is exciting, but it may distract students from their studies. Do you agree?', keywords: ['business', 'startup', 'funding', 'risk', 'study', 'opportunity', 'student', 'experience'], real: false, source: '本站模拟题' },
      { id: '6d4', topic: '模拟·信息时代的真伪', scenario: 'Misinformation spreads quickly online. Discuss with your partner how young people can judge the truthfulness of online information.', partnerOpen: 'Everyone can post anything now, which makes it hard to tell truth from rumors. How should we deal with it?', keywords: ['information', 'fake news', 'truth', 'online', 'media', 'judge', 'source', 'critical'], real: false, source: '本站模拟题' },
    ],
  };

  /* ---------------- 听力套题（原创仿真题文本，由浏览器TTS朗读） ---------------- */
  const LISTENING_SETS = [
    {
      id: 'L4-1', level: 4, title: '四级·真题风格套题 ①', tip: '短篇新闻 ×1 + 长对话 ×1 + 听力篇章 ×1，共 8 题（原卷为25题，本站做精简版）。',
      sections: [
        {
          type: 'news', title: 'Section A 短篇新闻',
          passage: 'A new study shows that the number of teenagers who ride bicycles to school has dropped sharply over the past ten years. Researchers say that only one in five students now rides a bike to school, compared with more than half in 2015. The main reasons are longer travel distances and parents\' concern about road safety. To encourage cycling, several cities have built new bike lanes near schools and lowered speed limits in those areas. City officials say the changes have already made morning traffic safer and cleaner, and they hope more families will choose bicycles again.',
          questions: [
            { q: 'What does the study show about teenagers riding bicycles to school?', options: ['The number has increased sharply.', 'The number has dropped sharply.', 'It has stayed the same.', 'No data was collected.'], answer: 1, explain: '原文：the number of teenagers who ride bicycles to school has dropped sharply.' },
            { q: 'Why do fewer students ride bikes to school now?', options: ['Bikes are too expensive.', 'Schools are too far and parents worry about safety.', 'Students prefer walking.', 'It often rains in these cities.'], answer: 1, explain: '原文：The main reasons are longer travel distances and parents\' concern about road safety.' },
          ],
        },
        {
          type: 'conversation', title: 'Section B 长对话',
          passage: 'W: Hi Tom, I heard you just came back from the job fair on campus. How was it?\nM: It was crowded but useful. More than eighty companies came, and most of them were looking for interns.\nW: Did you find anything interesting?\nM: Yes, a software company offered a three-month internship. The pay is modest, but I can learn a lot about app development.\nW: That sounds great. When would it start?\nM: At the beginning of next month. But there is a problem, it conflicts with my final exams, so I\'m still thinking about it.\nW: Maybe you can talk to the company and ask for a later start.\nM: That\'s a good idea. I\'ll send them an email tonight.',
          questions: [
            { q: 'What was the job fair like according to Tom?', options: ['Small and quiet.', 'Crowded but useful.', 'Boring and useless.', 'Cancelled at the last minute.'], answer: 1, explain: '原文：It was crowded but useful.' },
            { q: 'What did the software company offer?', options: ['A full-time job.', 'A three-month internship.', 'A scholarship.', 'A chance to study abroad.'], answer: 1, explain: '原文：a software company offered a three-month internship.' },
            { q: 'What problem does Tom face about the internship?', options: ['It pays too little.', 'It is too far away.', 'It conflicts with his final exams.', 'He doesn\'t like the company.'], answer: 2, explain: '原文：it conflicts with my final exams.' },
          ],
        },
        {
          type: 'passage', title: 'Section C 听力篇章',
          passage: 'Many people believe that keeping a diary helps reduce stress. Psychologists say that writing about your feelings for about fifteen minutes a day can make you feel calmer and think more clearly. The key is to write honestly, without worrying about grammar or spelling. You can write about happy moments, difficult problems, or simply the small things that happened during the day. Some researchers also suggest ending each entry with one thing you are thankful for. Over time, this simple habit can help you notice the positive side of life and deal with pressure more easily.',
          questions: [
            { q: 'How long a day do psychologists suggest writing a diary?', options: ['About five minutes.', 'About fifteen minutes.', 'About half an hour.', 'About one hour.'], answer: 1, explain: '原文：writing about your feelings for about fifteen minutes a day.' },
            { q: 'What is the key to diary writing mentioned in the passage?', options: ['Writing long entries.', 'Using difficult words.', 'Writing honestly without worrying about grammar.', 'Writing in the morning.'], answer: 2, explain: '原文：The key is to write honestly, without worrying about grammar or spelling.' },
            { q: 'What do researchers suggest you end each entry with?', options: ['A plan for tomorrow.', 'One thing you are thankful for.', 'A list of your worries.', 'A new word you learned.'], answer: 1, explain: '原文：ending each entry with one thing you are thankful for.' },
          ],
        },
      ],
    },
    {
      id: 'L4-2', level: 4, title: '四级·真题风格套题 ②', tip: '短篇新闻 ×1 + 长对话 ×1 + 听力篇章 ×1，共 8 题。',
      sections: [
        {
          type: 'news', title: 'Section A 短篇新闻',
          passage: 'The city library will extend its opening hours from next Monday. It will now stay open until ten o\'clock in the evening on weekdays, and from nine to six on weekends. The change comes after a survey of ten thousand residents showed that many people wanted to use the library after work. The library has also added two hundred new study seats and faster internet. In the first week of the new schedule, the number of evening visitors doubled. The director said that if the trend continues, the library may open some areas twenty-four hours a day in the future.',
          questions: [
            { q: 'When will the library stay open until on weekdays?', options: ['Nine o\'clock.', 'Ten o\'clock in the evening.', 'Midnight.', 'Eight o\'clock.'], answer: 1, explain: '原文：stay open until ten o\'clock in the evening on weekdays.' },
            { q: 'What did the city do before making the change?', options: ['Closed two old libraries.', 'Surveyed ten thousand residents.', 'Bought more computers.', 'Raised the entrance fee.'], answer: 1, explain: '原文：a survey of ten thousand residents showed that many people wanted to use the library after work.' },
          ],
        },
        {
          type: 'conversation', title: 'Section B 长对话',
          passage: 'M: Lucy, are you going to join the school running club this term?\nW: I\'m not sure. I used to run a lot in high school, but I stopped two years ago.\nM: Why did you stop?\nW: I got busy with classes, and then it was hard to start again. But I do miss the feeling after a good run.\nM: Then you should come with us. We run three times a week, on Tuesday, Thursday and Saturday morning. The coach says beginners can start slowly.\nW: That sounds fine. What do I need to bring?\nM: Just sports shoes and a water bottle. Oh, and a towel.\nW: OK, I think I\'ll give it a try. Where do you meet?\nM: At the gate of the sports ground, at seven sharp. Don\'t be late!',
          questions: [
            { q: 'Why did Lucy stop running?', options: ['She hurt her leg.', 'She got busy with classes.', 'She didn\'t like the coach.', 'The track was closed.'], answer: 1, explain: '原文：I got busy with classes.' },
            { q: 'How often does the running club meet?', options: ['Once a week.', 'Twice a week.', 'Three times a week.', 'Every morning.'], answer: 2, explain: '原文：We run three times a week.' },
            { q: 'What should Lucy bring to the club?', options: ['A whistle and a cap.', 'Sports shoes and a water bottle.', 'A towel and a phone.', 'Nothing at all.'], answer: 1, explain: '原文：Just sports shoes and a water bottle.' },
          ],
        },
        {
          type: 'passage', title: 'Section C 听力篇章',
          passage: 'Volunteering in a nursing home can be a rewarding experience for college students. First, it gives students a chance to practice communication with older people, who often enjoy sharing stories about their lives. Second, students can learn valuable skills such as patience and teamwork. Many nursing homes welcome volunteers on weekends, and some even provide training sessions before the work begins. Students who cannot visit in person can still help by writing letters or making phone calls. In fact, one recent study found that elderly people who received regular letters felt less lonely and more connected to the community.',
          questions: [
            { q: 'What can students practice by volunteering in a nursing home?', options: ['Cooking and cleaning.', 'Communication with older people.', 'Driving and repairing.', 'Swimming and dancing.'], answer: 1, explain: '原文：gives students a chance to practice communication with older people.' },
            { q: 'How can students help if they cannot visit in person?', options: ['By donating money.', 'By writing letters or making phone calls.', 'By posting online.', 'By staying at home.'], answer: 1, explain: '原文：still help by writing letters or making phone calls.' },
            { q: 'What did the recent study find about elderly people who received letters?', options: ['They felt less lonely.', 'They moved to new homes.', 'They stopped reading.', 'They felt more stressed.'], answer: 0, explain: '原文：elderly people who received regular letters felt less lonely.' },
          ],
        },
      ],
    },
    {
      id: 'L6-1', level: 6, title: '六级·真题风格套题 ①', tip: '长对话 ×1 + 听力篇章 ×1 + 讲座/讲话 ×1，共 8 题。',
      sections: [
        {
          type: 'conversation', title: 'Section A 长对话',
          passage: 'M: Professor Wang, thank you for your time. I\'m writing an essay about the future of transportation, and I\'d like to ask you a few questions.\nW: Of course. That\'s a very timely topic.\nM: Some people say electric cars will replace petrol cars within ten years. Do you agree?\nW: I think the direction is right, but the speed depends on many factors, such as battery technology, charging stations and government policy. In large cities, electric vehicles may dominate the market quite soon.\nM: What about public transport?\nW: Buses and subways will remain the backbone of city travel. But I believe autonomous shuttles may become common in a few years for short-distance trips.\nM: Will that create safety concerns?\nW: Safety will definitely be the biggest challenge. The technology needs years of testing before it can be fully trusted.\nM: Thank you, professor. Your opinions are very helpful.\nW: You\'re welcome. Good luck with your essay.',
          questions: [
            { q: 'What is the man writing his essay about?', options: ['The history of public transport.', 'The future of transportation.', 'The cost of electric cars.', 'City planning.'], answer: 1, explain: '对话主题：the future of transportation.' },
            { q: 'What does the professor say about electric cars in large cities?', options: ['They will never be popular.', 'They may dominate the market quite soon.', 'They are too expensive to build.', 'They cause more pollution.'], answer: 1, explain: '原文：In large cities, electric vehicles may dominate the market quite soon.' },
            { q: 'What does the professor think is the biggest challenge for autonomous shuttles?', options: ['Cost.', 'Safety.', 'Comfort.', 'Noise.'], answer: 1, explain: '原文：Safety will definitely be the biggest challenge.' },
          ],
        },
        {
          type: 'passage', title: 'Section B 听力篇章',
          passage: 'Sleep experts have found that taking a short nap of ten to twenty minutes in the early afternoon can improve memory and alertness. However, the timing matters. According to a study at a European university, people who napped before two o\'clock in the afternoon performed better in memory tests than those who napped later. Longer naps of more than forty minutes may leave people feeling groggy because they wake up in the middle of a deep sleep cycle. The researchers also suggest that a nap should be seen as a supplement to, not a replacement for, a good night\'s sleep. For students preparing for exams, a short afternoon nap may be more helpful than drinking another cup of coffee.',
          questions: [
            { q: 'What length of nap improves memory according to the passage?', options: ['Five minutes.', 'Ten to twenty minutes.', 'Forty minutes.', 'One hour.'], answer: 1, explain: '原文：a short nap of ten to twenty minutes ... can improve memory and alertness.' },
            { q: 'Why do long naps make people feel groggy?', options: ['Because they are too long for the body.', 'Because people wake up in the middle of a deep sleep cycle.', 'Because the room is too hot.', 'Because people dream too much.'], answer: 1, explain: '原文：Longer naps of more than forty minutes may leave people feeling groggy because they wake up in the middle of a deep sleep cycle.' },
            { q: 'What does the passage say about naps and a night\'s sleep?', options: ['A nap can replace a night\'s sleep.', 'A nap is a supplement to a night\'s sleep.', 'A nap is unnecessary if you sleep well.', 'A nap ruins the night\'s sleep.'], answer: 1, explain: '原文：a nap should be seen as a supplement to, not a replacement for, a good night\'s sleep.' },
          ],
        },
        {
          type: 'recording', title: 'Section C 讲座/讲话',
          passage: 'Today I\'d like to talk about the gig economy, a labor market in which people take on short-term or freelance jobs instead of permanent positions. The gig economy has grown rapidly in our country, especially among young people. Supporters argue that it offers flexibility: workers can choose when and where to work, and students can earn money between classes. Critics, however, point out that gig workers often lack job security, health insurance and paid holidays. My advice for young people is simple: try gig work if you want experience, but always keep building your professional skills. A strong set of skills makes you less dependent on any single platform, and that is the best protection in any labor market.',
          questions: [
            { q: 'What is the gig economy according to the speaker?', options: ['A market for permanent jobs.', 'A labor market of short-term or freelance jobs.', 'A government program for students.', 'An online shopping platform.'], answer: 1, explain: '原文：a labor market in which people take on short-term or freelance jobs instead of permanent positions.' },
            { q: 'What is one advantage of the gig economy mentioned by supporters?', options: ['High salary.', 'Job security.', 'Flexibility.', 'Free training.'], answer: 2, explain: '原文：Supporters argue that it offers flexibility.' },
            { q: 'What is the speaker\'s advice for young people?', options: ['Avoid gig work completely.', 'Always keep building professional skills.', 'Rely on one platform.', 'Change jobs every month.'], answer: 1, explain: '原文：always keep building your professional skills.' },
          ],
        },
      ],
    },
    {
      id: 'L6-2', level: 6, title: '六级·真题风格套题 ②', tip: '长对话 ×1 + 听力篇章 ×1 + 讲座/讲话 ×1，共 8 题。',
      sections: [
        {
          type: 'conversation', title: 'Section A 长对话',
          passage: 'W: Jack, you\'ve been studying abroad for a year. What was the biggest adjustment for you?\nM: Definitely the food and the language. In the first month, I could hardly follow the lectures, and I often felt hungry because the meals were very different from what I was used to.\nW: How did you overcome that?\nM: I recorded every lecture and listened to it again at night. For food, I started cooking simple Chinese dishes in the shared kitchen. That helped a lot.\nW: Did you make friends there?\nM: Yes. I joined the university\'s international students\' club and a basketball team. Playing sports is a great way to make friends because you don\'t need perfect English to play together.\nW: Any advice for students who plan to study abroad?\nM: Don\'t be afraid to ask questions. And step out of your comfort zone in the first few weeks, or you may stay alone in your room for the whole year.',
          questions: [
            { q: 'What was the man\'s biggest adjustment?', options: ['The weather.', 'The food and the language.', 'The traffic rules.', 'The course fees.'], answer: 1, explain: '原文：Definitely the food and the language.' },
            { q: 'How did the man deal with the lectures he could not follow?', options: ['He asked classmates for notes.', 'He recorded every lecture and listened again.', 'He stopped going to class.', 'He changed his major.'], answer: 1, explain: '原文：I recorded every lecture and listened to it again at night.' },
            { q: 'What advice does the man give about the first few weeks?', options: ['Stay in your room and study.', 'Step out of your comfort zone.', 'Focus only on food.', 'Wait for the second semester.'], answer: 1, explain: '原文：step out of your comfort zone in the first few weeks.' },
          ],
        },
        {
          type: 'passage', title: 'Section B 听力篇章',
          passage: 'Scientists have long studied how colors influence human emotions. In general, warm colors such as red and orange tend to make people feel energetic, while cool colors like blue and green are linked to calmness and concentration. Based on this finding, many companies have redesigned their offices. Instead of painting the whole office one color, they now use different colors for different zones: lively colors in the break room, soft blue in the meeting room, and light green near the workstations. A survey of office workers showed that employees in color-designed offices reported lower stress and higher satisfaction. Designers, however, remind us that personal preference matters, so companies should always consider the opinions of their own employees before repainting.',
          questions: [
            { q: 'What effect do cool colors have on people?', options: ['They make people energetic.', 'They are linked to calmness and concentration.', 'They increase stress.', 'They improve appetite.'], answer: 1, explain: '原文：cool colors like blue and green are linked to calmness and concentration.' },
            { q: 'How do companies use colors in redesigned offices?', options: ['They paint everything in red.', 'They use different colors for different zones.', 'They avoid colors completely.', 'They only paint the ceiling.'], answer: 1, explain: '原文：they now use different colors for different zones.' },
            { q: 'What did the survey of office workers show?', options: ['Workers disliked color design.', 'Workers reported lower stress and higher satisfaction.', 'Colors had no effect on workers.', 'Workers preferred dark colors.'], answer: 1, explain: '原文：employees in color-designed offices reported lower stress and higher satisfaction.' },
          ],
        },
        {
          type: 'recording', title: 'Section C 讲座/讲话',
          passage: 'Good morning, everyone. Today\'s lecture is about financial literacy among college students. A recent national survey found that nearly half of the students interviewed did not know the basic difference between a credit card and a debit card. Many students said they had never made a monthly budget, and some had paid high interest because they spent more than they earned. Financial experts suggest three simple habits. First, record every expense for a month to see where your money goes. Second, learn to separate needs from wants, for example, food and books are needs, while the latest phone is usually a want. Third, start saving a small fixed amount after every part-time job or allowance. These habits are easy to build in college and will benefit you for the rest of your life.',
          questions: [
            { q: 'What did the national survey find about college students?', options: ['They are good at saving money.', 'Nearly half did not know the difference between a credit card and a debit card.', 'Most of them invest in stocks.', 'They never use phones.'], answer: 1, explain: '原文：nearly half of the students interviewed did not know the basic difference between a credit card and a debit card.' },
            { q: 'According to the lecture, what is the second habit experts suggest?', options: ['Watching finance videos.', 'Separating needs from wants.', 'Borrowing from friends.', 'Shopping in sales only.'], answer: 1, explain: '原文：Second, learn to separate needs from wants.' },
            { q: 'Why does the speaker say these habits are easy to build in college?', options: ['Because students have much free time.', 'Because college is a simple financial environment.', 'Because banks teach students.', 'Because all students work part-time.'], answer: 1, explain: '原文：These habits are easy to build in college and will benefit you for the rest of your life.' },
          ],
        },
      ],
    },
  ];

  /* ---------------- 口试评分参考（官方等级） ---------------- */
  const GRADE_RULES = [
    { grade: 'A', label: '优秀', range: '均分 ≥ 4.5', desc: '能用英语就熟悉话题进行流利的交谈，语音语调自然，用词准确，表达基本没有障碍。' },
    { grade: 'B', label: '良好', range: '均分 3.5 – 4.4', desc: '能较流利地就熟悉话题交谈，偶有停顿和用词欠妥，但基本不影响理解。' },
    { grade: 'C', label: '合格', range: '均分 2.5 – 3.4', desc: '能就熟悉话题进行简单交谈，有明显停顿和语法错误，但尚能完成交际任务。' },
    { grade: 'D', label: '不合格', range: '均分 < 2.5', desc: '口头交际有较大困难，不能完成基本的交际任务。' },
  ];

  /* ---------------- 本地评分（无API Key时兜底）使用的填充词 ---------------- */
  const FILLERS = ['um', 'uh', 'er', 'hmm', 'emm', 'you know', 'like i', 'kind of', 'sort of', 'well actually', 'i mean'];

  /* ---------------- 常用衔接表达（答题建议） ---------------- */
  const LINKING_WORDS = ['firstly', 'secondly', 'finally', 'besides', 'however', 'therefore', 'in addition', 'for example', 'on the other hand', 'moreover', 'as a result'];

  return {
    EXAM_SOURCES,
    EXAM_SESSIONS,
    EXAM_FORMAT,
    READING_PASSAGES,
    Q4,
    Q6,
    LISTENING_SETS,
    GRADE_RULES,
    FILLERS,
    LINKING_WORDS,
  };
})();