import mysql from 'mysql2/promise';

// 数据库连接配置
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// 解析连接字符串
const url = new URL(DATABASE_URL);
const config = {
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: true }
};

// 初始学习单元数据
const learningUnits = [
  // 日常对话 - N5级别
  {
    unitType: 'scene',
    category: '日常生活',
    subCategory: '打招呼',
    titleJa: 'はじめまして',
    titleZh: '初次见面',
    descriptionJa: '日本での初対面の挨拶を学びましょう。',
    difficulty: 1,
    jlptLevel: 'N5',
    targetExpressions: JSON.stringify(['はじめまして', 'よろしくお願いします', 'どうぞよろしく']),
    targetPatterns: JSON.stringify(['〜と申します', '〜です']),
    content: JSON.stringify({
      situationDescription: '会社の新入社員として、先輩に初めて会う場面です。',
      dialogues: [
        { speaker: '田中', speakerRole: 'senior', text: 'はじめまして。田中と申します。', reading: 'はじめまして。たなかともうします。', notes: '「と申します」は丁寧な自己紹介の表現です' },
        { speaker: '山田', speakerRole: 'newcomer', text: 'はじめまして。山田です。よろしくお願いします。', reading: 'はじめまして。やまだです。よろしくおねがいします。', notes: '「よろしくお願いします」は初対面の挨拶の定番です' },
        { speaker: '田中', speakerRole: 'senior', text: 'こちらこそ、よろしくお願いします。', reading: 'こちらこそ、よろしくおねがいします。', notes: '「こちらこそ」は相手の言葉に対する返答です' }
      ],
      keyPoints: ['初対面では「はじめまして」を使う', '「よろしくお願いします」で締める', '名前の後に「です」をつける'],
      culturalNotes: '日本では初対面の挨拶がとても大切です。お辞儀をしながら挨拶するのが一般的です。'
    }),
    sourceType: 'original',
    orderIndex: 1,
    isPublished: true
  },
  {
    unitType: 'scene',
    category: '日常生活',
    subCategory: '買い物',
    titleJa: 'コンビニで買い物',
    titleZh: '便利店购物',
    descriptionJa: 'コンビニでの基本的な会話を練習しましょう。',
    difficulty: 2,
    jlptLevel: 'N5',
    targetExpressions: JSON.stringify(['いらっしゃいませ', 'これをください', 'いくらですか']),
    targetPatterns: JSON.stringify(['〜をください', '〜はいくらですか']),
    content: JSON.stringify({
      situationDescription: 'コンビニでおにぎりとお茶を買う場面です。',
      dialogues: [
        { speaker: '店員', speakerRole: 'staff', text: 'いらっしゃいませ。', reading: 'いらっしゃいませ。', notes: '店に入ったお客様への挨拶です' },
        { speaker: '客', speakerRole: 'customer', text: 'すみません、これはいくらですか。', reading: 'すみません、これはいくらですか。', notes: '値段を聞くときの表現です' },
        { speaker: '店員', speakerRole: 'staff', text: '150円です。', reading: 'ひゃくごじゅうえんです。', notes: '数字の読み方に注意しましょう' },
        { speaker: '客', speakerRole: 'customer', text: 'じゃあ、これをください。', reading: 'じゃあ、これをください。', notes: '「ください」は丁寧な依頼の表現です' },
        { speaker: '店員', speakerRole: 'staff', text: 'ありがとうございます。', reading: 'ありがとうございます。', notes: '感謝の表現です' }
      ],
      keyPoints: ['「いくらですか」で値段を聞く', '「ください」で購入を伝える', '数字の読み方を覚える'],
      culturalNotes: '日本のコンビニは24時間営業が多く、生活に欠かせない存在です。'
    }),
    sourceType: 'original',
    orderIndex: 2,
    isPublished: true
  },
  {
    unitType: 'scene',
    category: '日常生活',
    subCategory: '食事',
    titleJa: 'レストランで注文',
    titleZh: '餐厅点餐',
    descriptionJa: 'レストランでの注文の仕方を学びましょう。',
    difficulty: 3,
    jlptLevel: 'N5',
    targetExpressions: JSON.stringify(['メニューをください', '〜をお願いします', 'お会計お願いします']),
    targetPatterns: JSON.stringify(['〜をお願いします', '〜にします']),
    content: JSON.stringify({
      situationDescription: '友達と一緒にラーメン屋さんに入った場面です。',
      dialogues: [
        { speaker: '店員', speakerRole: 'staff', text: 'いらっしゃいませ。何名様ですか。', reading: 'いらっしゃいませ。なんめいさまですか。', notes: '人数を聞く丁寧な表現です' },
        { speaker: '客', speakerRole: 'customer', text: '二人です。', reading: 'ふたりです。', notes: '人数の数え方に注意' },
        { speaker: '店員', speakerRole: 'staff', text: 'こちらへどうぞ。メニューです。', reading: 'こちらへどうぞ。メニューです。', notes: '案内の表現です' },
        { speaker: '客', speakerRole: 'customer', text: '味噌ラーメンをお願いします。', reading: 'みそラーメンをおねがいします。', notes: '「お願いします」は丁寧な注文の表現' },
        { speaker: '店員', speakerRole: 'staff', text: 'かしこまりました。少々お待ちください。', reading: 'かしこまりました。しょうしょうおまちください。', notes: '「かしこまりました」は丁寧な了解の表現' }
      ],
      keyPoints: ['「〜をお願いします」で注文する', '人数の数え方を覚える', '「かしこまりました」は店員の返答'],
      culturalNotes: '日本のレストランでは、入店時に人数を聞かれることが多いです。'
    }),
    sourceType: 'original',
    orderIndex: 3,
    isPublished: true
  },
  // 動漫場景 - N4級別
  {
    unitType: 'media',
    category: '動漫',
    subCategory: '日常系',
    titleJa: '友達との約束',
    titleZh: '和朋友的约定',
    descriptionJa: 'アニメでよく使われる友達との会話表現を学びましょう。',
    difficulty: 4,
    jlptLevel: 'N4',
    targetExpressions: JSON.stringify(['一緒に行こう', '約束だよ', '楽しみにしてる']),
    targetPatterns: JSON.stringify(['〜しよう', '〜ことにする']),
    content: JSON.stringify({
      situationDescription: '放課後、友達と週末の予定を話している場面です。',
      dialogues: [
        { speaker: 'ユキ', speakerRole: 'friend1', text: 'ねえ、今週の土曜日、暇？', reading: 'ねえ、こんしゅうのどようび、ひま？', notes: '「暇」はカジュアルな表現です' },
        { speaker: 'サクラ', speakerRole: 'friend2', text: 'うん、特に予定ないよ。どうしたの？', reading: 'うん、とくによていないよ。どうしたの？', notes: '「どうしたの」は理由を聞く表現' },
        { speaker: 'ユキ', speakerRole: 'friend1', text: '新しいカフェができたんだって。一緒に行こうよ！', reading: 'あたらしいカフェができたんだって。いっしょにいこうよ！', notes: '「〜んだって」は伝聞の表現' },
        { speaker: 'サクラ', speakerRole: 'friend2', text: 'いいね！行こう行こう！楽しみ〜', reading: 'いいね！いこういこう！たのしみ〜', notes: '繰り返しで強調する表現' },
        { speaker: 'ユキ', speakerRole: 'friend1', text: 'じゃあ、約束ね！', reading: 'じゃあ、やくそくね！', notes: '「約束ね」は確認の表現' }
      ],
      keyPoints: ['「〜しよう」は誘いの表現', '「〜んだって」は伝聞', 'カジュアルな会話では語尾が変化する'],
      culturalNotes: '日本の若者は友達との約束を大切にします。'
    }),
    sourceType: 'anime',
    sourceTitle: '日常系アニメ風',
    orderIndex: 4,
    isPublished: true
  },
  {
    unitType: 'media',
    category: '動漫',
    subCategory: '学園',
    titleJa: '部活の先輩後輩',
    titleZh: '社团的前后辈',
    descriptionJa: '先輩と後輩の会話から敬語を学びましょう。',
    difficulty: 5,
    jlptLevel: 'N4',
    targetExpressions: JSON.stringify(['先輩', '後輩', 'お疲れ様です', '頑張ります']),
    targetPatterns: JSON.stringify(['〜させていただきます', '〜てもいいですか']),
    content: JSON.stringify({
      situationDescription: '部活動の練習後、後輩が先輩に話しかける場面です。',
      dialogues: [
        { speaker: '後輩', speakerRole: 'junior', text: '先輩、お疲れ様です！', reading: 'せんぱい、おつかれさまです！', notes: '「お疲れ様です」は労いの挨拶' },
        { speaker: '先輩', speakerRole: 'senior', text: 'お疲れ。今日の練習、どうだった？', reading: 'おつかれ。きょうのれんしゅう、どうだった？', notes: '先輩はカジュアルに話すことが多い' },
        { speaker: '後輩', speakerRole: 'junior', text: 'まだまだですけど、もっと頑張ります！', reading: 'まだまだですけど、もっとがんばります！', notes: '謙虚な姿勢を示す表現' },
        { speaker: '先輩', speakerRole: 'senior', text: 'いい心がけだね。何か分からないことがあったら聞いてね。', reading: 'いいこころがけだね。なにかわからないことがあったらきいてね。', notes: '「心がけ」は態度や姿勢のこと' },
        { speaker: '後輩', speakerRole: 'junior', text: 'はい！ありがとうございます！', reading: 'はい！ありがとうございます！', notes: '感謝を伝える基本表現' }
      ],
      keyPoints: ['先輩には敬語を使う', '「お疲れ様です」は挨拶の定番', '謙虚な姿勢を示す表現を覚える'],
      culturalNotes: '日本の部活動では先輩後輩の関係がとても大切です。'
    }),
    sourceType: 'anime',
    sourceTitle: '学園アニメ風',
    orderIndex: 5,
    isPublished: true
  },
  // J-POP歌詞 - N3級別
  {
    unitType: 'expression',
    category: 'J-POP',
    subCategory: '恋愛',
    titleJa: '恋の歌詞表現',
    titleZh: '恋爱歌词表达',
    descriptionJa: 'J-POPの恋愛ソングでよく使われる表現を学びましょう。',
    difficulty: 6,
    jlptLevel: 'N3',
    targetExpressions: JSON.stringify(['君に会いたい', '忘れられない', 'ずっとそばにいて']),
    targetPatterns: JSON.stringify(['〜たい', '〜られない', '〜ていて']),
    content: JSON.stringify({
      situationDescription: 'J-POPの恋愛ソングに頻出する表現を学習します。',
      dialogues: [
        { speaker: '歌詞1', speakerRole: 'lyrics', text: '君に会いたい、この気持ちが止まらない', reading: 'きみにあいたい、このきもちがとまらない', notes: '「〜たい」は願望を表す' },
        { speaker: '歌詞2', speakerRole: 'lyrics', text: 'あの日の思い出、忘れられないよ', reading: 'あのひのおもいで、わすれられないよ', notes: '「〜られない」は可能の否定' },
        { speaker: '歌詞3', speakerRole: 'lyrics', text: 'ずっとそばにいてほしい', reading: 'ずっとそばにいてほしい', notes: '「〜てほしい」は希望を表す' },
        { speaker: '歌詞4', speakerRole: 'lyrics', text: '二人で見た夕焼け、今でも覚えてる', reading: 'ふたりでみたゆうやけ、いまでもおぼえてる', notes: '「今でも」は継続を表す' }
      ],
      keyPoints: ['「〜たい」で願望を表現', '「〜られない」で不可能を表現', '感情を込めた表現が多い'],
      culturalNotes: 'J-POPの歌詞は日本語学習の良い教材です。感情表現が豊かで、日常会話にも応用できます。'
    }),
    sourceType: 'jpop',
    sourceTitle: 'J-POP恋愛ソング風',
    orderIndex: 6,
    isPublished: true
  },
  // ビジネス日本語 - N2級別
  {
    unitType: 'dialogue',
    category: 'ビジネス',
    subCategory: '会議',
    titleJa: '会議での発言',
    titleZh: '会议发言',
    descriptionJa: 'ビジネス会議でよく使われる表現を学びましょう。',
    difficulty: 7,
    jlptLevel: 'N2',
    targetExpressions: JSON.stringify(['ご提案させていただきます', '検討させていただきます', 'ご意見をお聞かせください']),
    targetPatterns: JSON.stringify(['〜させていただきます', '〜についてですが']),
    content: JSON.stringify({
      situationDescription: '会社の企画会議で新しいプロジェクトについて話し合う場面です。',
      dialogues: [
        { speaker: '部長', speakerRole: 'manager', text: 'では、新プロジェクトについて、田中さんからご説明をお願いします。', reading: 'では、しんプロジェクトについて、たなかさんからごせつめいをおねがいします。', notes: '「ご説明」は丁寧な表現' },
        { speaker: '田中', speakerRole: 'presenter', text: 'はい。本日は新規事業についてご提案させていただきます。', reading: 'はい。ほんじつはしんきじぎょうについてごていあんさせていただきます。', notes: '「させていただきます」は謙譲語' },
        { speaker: '田中', speakerRole: 'presenter', text: '資料の2ページをご覧ください。', reading: 'しりょうのにページをごらんください。', notes: '「ご覧ください」は「見てください」の敬語' },
        { speaker: '佐藤', speakerRole: 'attendee', text: '一点確認させていただきたいのですが、予算についてはいかがでしょうか。', reading: 'いってんかくにんさせていただきたいのですが、よさんについてはいかがでしょうか。', notes: '質問の丁寧な切り出し方' },
        { speaker: '田中', speakerRole: 'presenter', text: 'ご質問ありがとうございます。予算については次のスライドでご説明いたします。', reading: 'ごしつもんありがとうございます。よさんについてはつぎのスライドでごせつめいいたします。', notes: '「いたします」は「します」の謙譲語' }
      ],
      keyPoints: ['ビジネスでは「させていただきます」を多用', '「ご〜」「お〜」で丁寧さを表す', '質問は丁寧に切り出す'],
      culturalNotes: '日本のビジネスシーンでは敬語が非常に重要です。適切な敬語を使うことで、プロフェッショナルな印象を与えます。'
    }),
    sourceType: 'original',
    orderIndex: 7,
    isPublished: true
  },
  // 電影場景 - N2級別
  {
    unitType: 'media',
    category: '映画',
    subCategory: 'ドラマ',
    titleJa: '感動的な告白',
    titleZh: '感人的告白',
    descriptionJa: '映画やドラマでよく見る感動的な告白シーンの表現を学びましょう。',
    difficulty: 8,
    jlptLevel: 'N2',
    targetExpressions: JSON.stringify(['ずっと好きだった', '一緒にいたい', '君がいないと']),
    targetPatterns: JSON.stringify(['〜ずにはいられない', '〜てたまらない']),
    content: JSON.stringify({
      situationDescription: '長年の友人に想いを伝える告白のシーンです。',
      dialogues: [
        { speaker: '男性', speakerRole: 'confessor', text: '実は、ずっと言いたかったことがあるんだ。', reading: 'じつは、ずっといいたかったことがあるんだ。', notes: '「実は」で本題を切り出す' },
        { speaker: '女性', speakerRole: 'listener', text: 'え？何？急にどうしたの？', reading: 'え？なに？きゅうにどうしたの？', notes: '驚きを表す表現' },
        { speaker: '男性', speakerRole: 'confessor', text: '君のことが、ずっと好きだった。', reading: 'きみのことが、ずっとすきだった。', notes: '「ずっと」で継続を強調' },
        { speaker: '男性', speakerRole: 'confessor', text: '君がいないと、俺はダメなんだ。', reading: 'きみがいないと、おれはダメなんだ。', notes: '「〜ないと」で条件を表す' },
        { speaker: '女性', speakerRole: 'listener', text: '私も...ずっと待ってたよ。', reading: 'わたしも...ずっとまってたよ。', notes: '「待ってた」は「待っていた」の口語形' }
      ],
      keyPoints: ['「ずっと」で長期間を表す', '感情を込めた表現が多い', '口語では「〜てた」の形が多い'],
      culturalNotes: '日本の映画やドラマでは、告白シーンが重要な見せ場になることが多いです。'
    }),
    sourceType: 'movie',
    sourceTitle: '日本映画風',
    orderIndex: 8,
    isPublished: true
  },
  // ニュース - N1級別
  {
    unitType: 'scene',
    category: 'ニュース',
    subCategory: '社会',
    titleJa: 'ニュースの聞き取り',
    titleZh: '新闻听力',
    descriptionJa: 'ニュース番組でよく使われる表現を学びましょう。',
    difficulty: 9,
    jlptLevel: 'N1',
    targetExpressions: JSON.stringify(['〜によりますと', '〜とのことです', '〜が明らかになりました']),
    targetPatterns: JSON.stringify(['〜によると', '〜とのこと', '〜が判明した']),
    content: JSON.stringify({
      situationDescription: 'テレビのニュース番組を見ている場面です。',
      dialogues: [
        { speaker: 'アナウンサー', speakerRole: 'anchor', text: '政府の発表によりますと、来年度から新しい政策が実施されるとのことです。', reading: 'せいふのはっぴょうによりますと、らいねんどからあたらしいせいさくがじっしされるとのことです。', notes: '「によりますと」は情報源を示す' },
        { speaker: 'アナウンサー', speakerRole: 'anchor', text: 'この政策により、国民の生活がどのように変わるのか、専門家に聞きました。', reading: 'このせいさくにより、こくみんのせいかつがどのようにかわるのか、せんもんかにききました。', notes: '「により」は原因や手段を示す' },
        { speaker: '専門家', speakerRole: 'expert', text: '今回の政策は、長期的に見れば国民にとってプラスになると考えられます。', reading: 'こんかいのせいさくは、ちょうきてきにみればこくみんにとってプラスになるとかんがえられます。', notes: '「〜と考えられます」は客観的な意見' },
        { speaker: 'アナウンサー', speakerRole: 'anchor', text: '一方で、課題も指摘されています。', reading: 'いっぽうで、かだいもしてきされています。', notes: '「一方で」は対比を示す' }
      ],
      keyPoints: ['「によりますと」で情報源を示す', '「とのことです」で伝聞を表す', '客観的な表現が多い'],
      culturalNotes: '日本のニュースは丁寧で客観的な表現が特徴です。'
    }),
    sourceType: 'original',
    orderIndex: 9,
    isPublished: true
  },
  // 高級表現 - N1級別
  {
    unitType: 'expression',
    category: '敬語',
    subCategory: '最高敬語',
    titleJa: '最高敬語の使い方',
    titleZh: '最高敬语的使用方法',
    descriptionJa: 'ビジネスや正式な場面で使う最高敬語を学びましょう。',
    difficulty: 10,
    jlptLevel: 'N1',
    targetExpressions: JSON.stringify(['お越しいただく', 'ご高覧いただく', '賜る']),
    targetPatterns: JSON.stringify(['〜いただけますでしょうか', '〜賜りますよう']),
    content: JSON.stringify({
      situationDescription: '正式なビジネスレターや式典での表現を学習します。',
      dialogues: [
        { speaker: '例文1', speakerRole: 'example', text: 'ご多忙のところ恐れ入りますが、ご出席賜りますようお願い申し上げます。', reading: 'ごたぼうのところおそれいりますが、ごしゅっせきたまわりますようおねがいもうしあげます。', notes: '「賜る」は「もらう」の最高敬語' },
        { speaker: '例文2', speakerRole: 'example', text: 'お忙しい中、お越しいただき誠にありがとうございます。', reading: 'おいそがしいなか、おこしいただきまことにありがとうございます。', notes: '「お越しいただく」は「来てもらう」の敬語' },
        { speaker: '例文3', speakerRole: 'example', text: 'ご高覧いただければ幸いに存じます。', reading: 'ごこうらんいただければさいわいにぞんじます。', notes: '「ご高覧」は「見る」の最高敬語' },
        { speaker: '例文4', speakerRole: 'example', text: '何卒ご検討のほど、よろしくお願い申し上げます。', reading: 'なにとぞごけんとうのほど、よろしくおねがいもうしあげます。', notes: '「何卒」は強い依頼を表す' }
      ],
      keyPoints: ['「賜る」「存じる」などの最高敬語を使う', '「お願い申し上げます」で丁寧に依頼', '正式な文書では定型表現が多い'],
      culturalNotes: '日本のビジネスでは、正式な場面での敬語使用が非常に重要視されます。'
    }),
    sourceType: 'original',
    orderIndex: 10,
    isPublished: true
  }
];

async function seedLearningUnits() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection(config);
  
  try {
    console.log('Inserting learning units...');
    
    for (const unit of learningUnits) {
      // 检查是否已存在
      const [existing] = await connection.execute(
        'SELECT id FROM learning_units WHERE titleJa = ?',
        [unit.titleJa]
      );
      
      if (existing.length > 0) {
        console.log(`Skipping existing unit: ${unit.titleJa}`);
        continue;
      }
      
      await connection.execute(
        `INSERT INTO learning_units 
        (unitType, category, subCategory, titleJa, titleZh, descriptionJa, difficulty, jlptLevel, 
         targetExpressions, targetPatterns, content, sourceType, sourceTitle, orderIndex, isPublished)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          unit.unitType,
          unit.category,
          unit.subCategory,
          unit.titleJa,
          unit.titleZh,
          unit.descriptionJa,
          unit.difficulty,
          unit.jlptLevel,
          unit.targetExpressions,
          unit.targetPatterns,
          unit.content,
          unit.sourceType,
          unit.sourceTitle || null,
          unit.orderIndex,
          unit.isPublished
        ]
      );
      
      console.log(`Inserted: ${unit.titleJa}`);
    }
    
    // 查询结果
    const [results] = await connection.execute('SELECT COUNT(*) as count FROM learning_units');
    console.log(`\nTotal learning units in database: ${results[0].count}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
    console.log('Database connection closed.');
  }
}

seedLearningUnits();
