import { Lesson } from '../types';

export const INITIAL_LESSONS: Lesson[] = [
  {
    id: 'lesson_1',
    level: 'مبتدئ',
    order: 1,
    title: 'التحيات والحروف الأولى',
    titleEn: 'Greetings & First Letters',
    topic: 'الأساسيات والمحادثة الأولية',
    description: 'تعلم أهم كلمات التحية في الثقافة العربية وحروف الألف والباء والتاء مع تدريب تفاعلي على رسم الحروف باليد.',
    descriptionEn: 'Learn essential Arabic greetings and letters (Alif, Baa, Taa) with hands-on letter tracing.',
    coverImage: '/src/assets/images/hero_arabic_learning_1790772495975.jpg',
    grammarTip: {
      title: 'قاعدة البداية (The Starting Rule)',
      description: 'اللغة العربية تُكتب وتُقرأ دائماً من اليمين إلى اليسار (Right-to-Left). حرف الألف (أ) هو الحرف الأول ولا يتصل بما بعده.'
    },
    vocabulary: [
      {
        id: 'v1_1',
        arabic: 'مَرْحَبَاً',
        english: 'Hello / Welcome',
        transliteration: 'Marhaban',
        category: 'تحيات',
        emoji: '👋',
        audioText: 'مَرْحَبَاً',
        exampleSentence: {
          arabic: 'مَرْحَبَاً بِكَ فِي دَرْسِ العَرَبِيَّة.',
          english: 'Welcome to the Arabic lesson.'
        }
      },
      {
        id: 'v1_2',
        arabic: 'شُكْرَاً',
        english: 'Thank you',
        transliteration: 'Shukran',
        category: 'تحيات',
        emoji: '🙏',
        audioText: 'شُكْرَاً',
        exampleSentence: {
          arabic: 'شُكْرَاً جَزِيلاً يَا صَدِيقِي.',
          english: 'Thank you very much, my friend.'
        }
      },
      {
        id: 'v1_3',
        arabic: 'نَعَمْ',
        english: 'Yes',
        transliteration: 'Na\'am',
        category: 'أساسيات',
        emoji: '✅',
        audioText: 'نَعَمْ',
      },
      {
        id: 'v1_4',
        arabic: 'لَا',
        english: 'No',
        transliteration: 'Laa',
        category: 'أساسيات',
        emoji: '❌',
        audioText: 'لَا',
      },
      {
        id: 'v1_5',
        arabic: 'أَلِف (أ)',
        english: 'Letter Alif (A)',
        transliteration: 'Alif',
        category: 'حروف',
        emoji: '🔤',
        audioText: 'أَلِف',
      }
    ],
    activities: [
      {
        id: 'act_1_1',
        lessonId: 'lesson_1',
        type: 'trace_letter',
        title: 'تتبع حرف الألف (أ)',
        instruction: 'حرّك إصبعك السبابة أو مؤشر الماوس من الأعلى إلى الأسفل لتتبع مسار حرف الألف.',
        instructionEn: 'Move your index finger or mouse cursor downward to trace the letter Alif (أ).',
        difficulty: 'سهل',
        points: 100,
        supportsAR: true,
        correctAnswer: 'أ',
        traceLetter: 'أ',
        traceLetterName: 'حرف الألف (Alif)',
        tracePath: [
          { x: 0.5, y: 0.15 },
          { x: 0.5, y: 0.30 },
          { x: 0.5, y: 0.45 },
          { x: 0.5, y: 0.60 },
          { x: 0.5, y: 0.75 },
          { x: 0.5, y: 0.88 }
        ]
      },
      {
        id: 'act_1_2',
        lessonId: 'lesson_1',
        type: 'match_word_image',
        title: 'مطابقة كلمة التحية بالصورة',
        instruction: 'اقبض بإصبعيك (Pinch) على كلمة "مَرْحَبَاً" واسحبها نحو يد التلويح 👋.',
        instructionEn: 'Pinch and drag "مَرْحَبَاً" (Hello) over the waving hand 👋.',
        difficulty: 'سهل',
        points: 100,
        supportsAR: true,
        question: 'مَرْحَبَاً',
        correctAnswer: 'opt_wave',
        options: [
          { id: 'opt_wave', text: 'تلويح باليد (Hello)', emoji: '👋', isCorrect: true },
          { id: 'opt_cross', text: 'علامة خطأ (No)', emoji: '❌', isCorrect: false },
          { id: 'opt_pray', text: 'شكر وامتنان (Thanks)', emoji: '🙏', isCorrect: false }
        ]
      },
      {
        id: 'act_1_3',
        lessonId: 'lesson_1',
        type: 'listen_choose',
        title: 'الاستماع واختيار الكلمة',
        instruction: 'استمع إلى الكلمة المنطوقة ثم انقر أو أشر إلى الكلمة العربية المطابقة.',
        instructionEn: 'Listen to the audio prompt and select the matching Arabic word.',
        difficulty: 'سهل',
        points: 100,
        supportsAR: false,
        audioPrompt: 'شُكْرَاً',
        correctAnswer: 'شُكْرَاً',
        options: [
          { id: 'o1', text: 'شُكْرَاً (Shukran)', isCorrect: true },
          { id: 'o2', text: 'مَرْحَبَاً (Marhaban)', isCorrect: false },
          { id: 'o3', text: 'نَعَمْ (Na\'am)', isCorrect: false }
        ]
      }
    ]
  },
  {
    id: 'lesson_2',
    level: 'مبتدئ',
    order: 2,
    title: 'أدوات المدرسة والكتابة',
    titleEn: 'School & Writing Tools',
    topic: 'المدرسة والأشياء اليومية',
    description: 'تعرف على مفردات المدرسة الشائعة، وقم بتركيب كلمة "كِتَاب" من الحروف المنفصلة وتحديد الحرف الناقص.',
    descriptionEn: 'Learn common classroom vocabulary and assemble the word "Kitāb" letter by letter.',
    coverImage: '/src/assets/images/arabic_school_desk_1790772510282.jpg',
    grammarTip: {
      title: 'اتصال الحروف (Letter Connections)',
      description: 'معظم الحروف العربية تتصل بالحرف الذي يليها والذي يسبقها، مثل حرف التاء والألف في كلمة كـِـتَـاب.'
    },
    vocabulary: [
      {
        id: 'v2_1',
        arabic: 'كِتَاب',
        english: 'Book',
        transliteration: 'Kitāb',
        category: 'أدوات دراسية',
        emoji: '📖',
        audioText: 'كِتَاب',
        exampleSentence: {
          arabic: 'أَقْرَأُ الكِتَابَ المُفِيد.',
          english: 'I read the useful book.'
        }
      },
      {
        id: 'v2_2',
        arabic: 'قَلَم',
        english: 'Pen / Pencil',
        transliteration: 'Qalam',
        category: 'أدوات دراسية',
        emoji: '✏️',
        audioText: 'قَلَم',
        exampleSentence: {
          arabic: 'أَكْتُبُ بِالقَلَمِ الأَزْرَق.',
          english: 'I write with the blue pen.'
        }
      },
      {
        id: 'v2_3',
        arabic: 'مَدْرَسَة',
        english: 'School',
        transliteration: 'Madrasah',
        category: 'أماكن',
        emoji: '🏫',
        audioText: 'مَدْرَسَة',
        exampleSentence: {
          arabic: 'المَدْرَسَةُ كَبِيرَةٌ وَجَمِيلَة.',
          english: 'The school is large and beautiful.'
        }
      },
      {
        id: 'v2_4',
        arabic: 'حَقِيبَة',
        english: 'Bag / Backpack',
        transliteration: 'Haqeebah',
        category: 'أدوات دراسية',
        emoji: '🎒',
        audioText: 'حَقِيبَة',
      }
    ],
    activities: [
      {
        id: 'act_2_1',
        lessonId: 'lesson_2',
        type: 'match_word_image',
        title: 'مطابقة الكلمة بالصورة: كِتَاب',
        instruction: 'اسحب كلمة "كِتَاب" باستخدام القبضة (Pinch) وضعها على صورة الكتاب 📖.',
        instructionEn: 'Grab the word "كِتَاب" (Book) and place it onto the book 📖.',
        difficulty: 'سهل',
        points: 100,
        supportsAR: true,
        question: 'كِتَاب',
        correctAnswer: 'opt_book',
        options: [
          { id: 'opt_book', text: 'كتاب (Book)', emoji: '📖', isCorrect: true },
          { id: 'opt_pen', text: 'قلم (Pen)', emoji: '✏️', isCorrect: false },
          { id: 'opt_school', text: 'مدرسة (School)', emoji: '🏫', isCorrect: false }
        ]
      },
      {
        id: 'act_2_2',
        lessonId: 'lesson_2',
        type: 'build_word',
        title: 'تركيب الكلمة من الحروف: كِتَاب',
        instruction: 'ضع الحروف بالترتيب الصحيح لتكوين كلمة "كِتَاب" (ك → ت → ا → ب).',
        instructionEn: 'Assemble the letters in order to form "كِتَاب" (K - T - A - B).',
        difficulty: 'متوسط',
        points: 120,
        supportsAR: true,
        correctAnswer: 'كتاب',
        lettersToAssemble: ['ك', 'ب', 'ا', 'ت']
      },
      {
        id: 'act_2_3',
        lessonId: 'lesson_2',
        type: 'missing_letter',
        title: 'الحرف الناقص: كـ _ ـاب',
        instruction: 'اختر الحرف الناقص لإكمال كلمة "كِتَاب".',
        instructionEn: 'Choose the missing letter to complete "كـ _ ـاب".',
        difficulty: 'سهل',
        points: 100,
        supportsAR: false,
        wordWithBlank: 'كـ _ ـاب',
        correctAnswer: 'ت',
        options: [
          { id: 'm1', text: 'ت (Taa)', isCorrect: true },
          { id: 'm2', text: 'ب (Baa)', isCorrect: false },
          { id: 'm3', text: 'م (Meem)', isCorrect: false }
        ]
      }
    ]
  },
  {
    id: 'lesson_3',
    level: 'مبتدئ',
    order: 3,
    title: 'الطعام والفواكه اللذيذة',
    titleEn: 'Food & Delicious Fruits',
    topic: 'الأطعمة والمشروبات',
    description: 'تعلم أسماء الفواكه والمأكولات الشائعة باللغة العربية مع نشاط تصنيف الأطعمة والمشروبات بالواقع المعزز.',
    descriptionEn: 'Learn common fruits and foods, and sort them into food and beverage baskets.',
    coverImage: '/src/assets/images/arabic_market_fruits_1790772521985.jpg',
    grammarTip: {
      title: 'تاء التأنيث (Feminine Marker ة)',
      description: 'الكلمات التي تنتهي بالتاء المربوطة (ة) مثل "تُفَّاحَة" هي مؤنثة في اللغة العربية.'
    },
    vocabulary: [
      {
        id: 'v3_1',
        arabic: 'تُفَّاحَة',
        english: 'Apple',
        transliteration: 'Tuffāhah',
        category: 'طعام',
        emoji: '🍎',
        audioText: 'تُفَّاحَة',
        exampleSentence: {
          arabic: 'التُّفَّاحَةُ حَمْرَاءُ وَلَذِيذَة.',
          english: 'The apple is red and delicious.'
        }
      },
      {
        id: 'v3_2',
        arabic: 'مَوْز',
        english: 'Banana',
        transliteration: 'Mawz',
        category: 'طعام',
        emoji: '🍌',
        audioText: 'مَوْز',
      },
      {
        id: 'v3_3',
        arabic: 'خُبْز',
        english: 'Bread',
        transliteration: 'Khubz',
        category: 'طعام',
        emoji: '🍞',
        audioText: 'خُبْز',
      },
      {
        id: 'v3_4',
        arabic: 'مَاء',
        english: 'Water',
        transliteration: 'Mā\'',
        category: 'مشروبات',
        emoji: '💧',
        audioText: 'مَاء',
      },
      {
        id: 'v3_5',
        arabic: 'حَلِيب',
        english: 'Milk',
        transliteration: 'Haleeb',
        category: 'مشروبات',
        emoji: '🥛',
        audioText: 'حَلِيب',
      }
    ],
    activities: [
      {
        id: 'act_3_1',
        lessonId: 'lesson_3',
        type: 'match_word_image',
        title: 'مطابقة الكلمة بالصورة: تُفَّاحَة',
        instruction: 'اقبض على كلمة "تُفَّاحَة" وضعها على التفاحة الحمراء 🍎.',
        instructionEn: 'Grab the word "تُفَّاحَة" and match it with the red apple 🍎.',
        difficulty: 'سهل',
        points: 100,
        supportsAR: true,
        question: 'تُفَّاحَة',
        correctAnswer: 'opt_apple',
        options: [
          { id: 'opt_apple', text: 'تفاحة (Apple)', emoji: '🍎', isCorrect: true },
          { id: 'opt_water', text: 'ماء (Water)', emoji: '💧', isCorrect: false },
          { id: 'opt_bread', text: 'خبز (Bread)', emoji: '🍞', isCorrect: false }
        ]
      },
      {
        id: 'act_3_2',
        lessonId: 'lesson_3',
        type: 'classify_words',
        title: 'تصنيف المأكولات والمشروبات',
        instruction: 'صنّف العناصر إلى سلة الطعام 🍎 أو سلة المشروبات 🥛.',
        instructionEn: 'Classify items into either Food 🍎 or Drinks 🥛.',
        difficulty: 'متوسط',
        points: 130,
        supportsAR: true,
        correctAnswer: 'classified',
        categories: [
          { id: 'food', label: 'طَعَام', labelEn: 'Food', emoji: '🍎' },
          { id: 'drink', label: 'مَشْرُوبَات', labelEn: 'Drinks', emoji: '🥛' }
        ],
        itemsToClassify: [
          { id: 'c1', text: 'خُبْز (Bread)', emoji: '🍞', categoryId: 'food' },
          { id: 'c2', text: 'مَاء (Water)', emoji: '💧', categoryId: 'drink' },
          { id: 'c3', text: 'مَوْز (Banana)', emoji: '🍌', categoryId: 'food' },
          { id: 'c4', text: 'حَلِيب (Milk)', emoji: '🥛', categoryId: 'drink' }
        ]
      },
      {
        id: 'act_3_3',
        lessonId: 'lesson_3',
        type: 'listen_choose',
        title: 'الاستماع: مَاء',
        instruction: 'استمع إلى الصوت وتعرف على الكلمة الصحيحة.',
        instructionEn: 'Listen to the sound and choose the correct word.',
        difficulty: 'سهل',
        points: 100,
        supportsAR: false,
        audioPrompt: 'مَاء',
        correctAnswer: 'مَاء',
        options: [
          { id: 'o1', text: 'مَاء (Water)', isCorrect: true },
          { id: 'o2', text: 'حَلِيب (Milk)', isCorrect: false },
          { id: 'o3', text: 'خُبْز (Bread)', isCorrect: false }
        ]
      }
    ]
  },
  {
    id: 'lesson_4',
    level: 'متوسط',
    order: 4,
    title: 'الحيوانات في الطبيعة العربية',
    titleEn: 'Animals in Nature',
    topic: 'الحيوانات والبيئة',
    description: 'تعرف على أسماء الحيوانات: القطة، الكلب، الجمل سفينة الصحراء، والطائر الجميل مع نشاط تتبع وتركيب.',
    descriptionEn: 'Learn animal names: Cat, Dog, Camel, and Bird with hands-on word composition.',
    coverImage: '/src/assets/images/arabic_friendly_animals_1790772532831.jpg',
    grammarTip: {
      title: 'أل التعريف (The Definite Article "Al-")',
      description: 'إضافة "الـ" في بداية الكلمة تحولها من نكرة إلى معرفة: قِطَّة (a cat) ← القِطَّة (the cat).'
    },
    vocabulary: [
      {
        id: 'v4_1',
        arabic: 'قِطَّة',
        english: 'Cat',
        transliteration: 'Qittah',
        category: 'حيوانات',
        emoji: '🐱',
        audioText: 'قِطَّة',
        exampleSentence: {
          arabic: 'القِطَّةُ لَطِيفَةٌ وَتَلْعَب.',
          english: 'The cat is cute and plays.'
        }
      },
      {
        id: 'v4_2',
        arabic: 'كَلْب',
        english: 'Dog',
        transliteration: 'Kalb',
        category: 'حيوانات',
        emoji: '🐕',
        audioText: 'كَلْب',
      },
      {
        id: 'v4_3',
        arabic: 'جَمَل',
        english: 'Camel',
        transliteration: 'Jamal',
        category: 'حيوانات',
        emoji: '🐪',
        audioText: 'جَمَل',
        exampleSentence: {
          arabic: 'الجَمَلُ صَبُورٌ فِي الصَّحْرَاء.',
          english: 'The camel is patient in the desert.'
        }
      },
      {
        id: 'v4_4',
        arabic: 'طَائِر',
        english: 'Bird',
        transliteration: 'Tā\'ir',
        category: 'حيوانات',
        emoji: '🐦',
        audioText: 'طَائِر',
      }
    ],
    activities: [
      {
        id: 'act_4_1',
        lessonId: 'lesson_4',
        type: 'match_word_image',
        title: 'مطابقة الكلمة بالصورة: جَمَل',
        instruction: 'اسحب كلمة "جَمَل" وضعها على الجمل 🐪.',
        instructionEn: 'Drag the word "جَمَل" (Camel) onto the camel 🐪.',
        difficulty: 'سهل',
        points: 100,
        supportsAR: true,
        question: 'جَمَل',
        correctAnswer: 'opt_camel',
        options: [
          { id: 'opt_camel', text: 'جمل (Camel)', emoji: '🐪', isCorrect: true },
          { id: 'opt_cat', text: 'قطة (Cat)', emoji: '🐱', isCorrect: false },
          { id: 'opt_bird', text: 'طائر (Bird)', emoji: '🐦', isCorrect: false }
        ]
      },
      {
        id: 'act_4_2',
        lessonId: 'lesson_4',
        type: 'build_word',
        title: 'تركيب كلمة: جَمَل',
        instruction: 'ركّب حروف كلمة "جَمَل" بالترتيب الصحيح (ج → م → ل).',
        instructionEn: 'Assemble the letters to build "جَمَل" (J - M - L).',
        difficulty: 'متوسط',
        points: 120,
        supportsAR: true,
        correctAnswer: 'جمل',
        lettersToAssemble: ['ل', 'ج', 'م']
      },
      {
        id: 'act_4_3',
        lessonId: 'lesson_4',
        type: 'missing_letter',
        title: 'الحرف الناقص: قـ _ ـة',
        instruction: 'اختر الحرف الناقص لإكمال كلمة "قِطَّة".',
        instructionEn: 'Choose the missing letter to complete "قـ _ ـة".',
        difficulty: 'سهل',
        points: 100,
        supportsAR: false,
        wordWithBlank: 'قـ _ ـة',
        correctAnswer: 'ط',
        options: [
          { id: 'm1', text: 'ط (Taa)', isCorrect: true },
          { id: 'm2', text: 'د (Daal)', isCorrect: false },
          { id: 'm3', text: 'ك (Kaaf)', isCorrect: false }
        ]
      }
    ]
  },
  {
    id: 'lesson_5',
    level: 'متوسط',
    order: 5,
    title: 'تكوين الجمل والأفعال اليومية',
    titleEn: 'Sentence Building & Daily Verbs',
    topic: 'الأفعال وبناء الجمل المفيدة',
    description: 'الانتقال من الكلمات إلى الجمل الكاملة! تعلم ترتيب الجمل العربية المفيدة والتفاعل مع الأفعال (أذهب، يأكل، أقرأ).',
    descriptionEn: 'Transition from single words to full sentences! Arrange phrases like "I go to school".',
    coverImage: '/src/assets/images/hero_arabic_learning_1790772495975.jpg',
    grammarTip: {
      title: 'تركيب الجملة الفعلية (Verbal Sentences)',
      description: 'في العربية تبدأ الجملة غالباً بالفعل ثم الفاعل: (أَذْهَبُ إِلَى المَدْرَسَةِ) أو (يَأْكُلُ الوَلَدُ التُّفَّاحَةَ).'
    },
    vocabulary: [
      {
        id: 'v5_1',
        arabic: 'أَذْهَبُ',
        english: 'I go',
        transliteration: 'Adh-habu',
        category: 'أفعال',
        emoji: '🚶',
        audioText: 'أَذْهَبُ',
        exampleSentence: {
          arabic: 'أَذْهَبُ إِلَى المَدْرَسَةِ صَبَاحَاً.',
          english: 'I go to school in the morning.'
        }
      },
      {
        id: 'v5_2',
        arabic: 'إِلَى',
        english: 'To (preposition)',
        transliteration: 'Ilā',
        category: 'حروف الجر',
        emoji: '➡️',
        audioText: 'إِلَى',
      },
      {
        id: 'v5_3',
        arabic: 'يَأْكُلُ',
        english: 'He eats',
        transliteration: 'Ya\'kulu',
        category: 'أفعال',
        emoji: '🍽️',
        audioText: 'يَأْكُلُ',
        exampleSentence: {
          arabic: 'الوَلدُ يَأْكُلُ التُّفَّاحَة.',
          english: 'The boy eats the apple.'
        }
      },
      {
        id: 'v5_4',
        arabic: 'الوَلَد',
        english: 'The boy',
        transliteration: 'Al-walad',
        category: 'أسماء',
        emoji: '👦',
        audioText: 'الوَلَد',
      }
    ],
    activities: [
      {
        id: 'act_5_1',
        lessonId: 'lesson_5',
        type: 'arrange_sentence',
        title: 'ترتيب الجملة: أذهب إلى المدرسة',
        instruction: 'رتّب الكلمات بالسحب والإفلات لتكوين الجملة الصحيحة: "أَذْهَبُ إِلَى المَدْرَسَة".',
        instructionEn: 'Arrange the words in order: "أَذْهَبُ إِلَى المَدْرَسَة" (I go to school).',
        difficulty: 'متوسط',
        points: 150,
        supportsAR: true,
        correctAnswer: 'أَذْهَبُ إِلَى المَدْرَسَة',
        wordsToArrange: ['المَدْرَسَة', 'إِلَى', 'أَذْهَبُ']
      },
      {
        id: 'act_5_2',
        lessonId: 'lesson_5',
        type: 'arrange_sentence',
        title: 'بناء الجملة بالصور: الولد يأكل التفاحة',
        instruction: 'رتّب عناصر الجملة لتصبح: [الوَلد] [يَأْكُل] [التُّفَّاحَة].',
        instructionEn: 'Arrange into: [الوَلد] [يَأْكُل] [التُّفَّاحَة] (The boy eats the apple).',
        difficulty: 'تحدي',
        points: 150,
        supportsAR: true,
        correctAnswer: 'الوَلد يَأْكُل التُّفَّاحَة',
        wordsToArrange: ['التُّفَّاحَة', 'يَأْكُل', 'الوَلد']
      },
      {
        id: 'act_5_3',
        lessonId: 'lesson_5',
        type: 'listen_choose',
        title: 'الاستماع وفهم الجملة',
        instruction: 'استمع إلى الجملة المنطوقة ثم اختر المعنى الصحيح بالإنجليزية.',
        instructionEn: 'Listen to the Arabic sentence and select the correct meaning.',
        difficulty: 'سهل',
        points: 100,
        supportsAR: false,
        audioPrompt: 'أَذْهَبُ إِلَى المَدْرَسَة',
        correctAnswer: 'I go to school',
        options: [
          { id: 'o1', text: 'I go to school', isCorrect: true },
          { id: 'o2', text: 'I eat an apple', isCorrect: false },
          { id: 'o3', text: 'I read a book', isCorrect: false }
        ]
      }
    ]
  }
];
