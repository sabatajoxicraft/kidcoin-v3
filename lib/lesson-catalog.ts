import type { AgeGroup, BadgeDefinition, Lesson } from '@/src/types';

// ─── Built-in Lesson Catalog ────────────────────────────────────

const LESSONS: Lesson[] = [
  // ── Junior (ages 6-9) ──────────────────────────────────────────
  {
    id: 'junior-what-is-money',
    title: 'What is Money?',
    description: 'Learn about coins, notes, and why we use money.',
    content:
      'Money is something we use to buy things we need and want. Long ago, people used to trade items with each other — like swapping apples for bread. Today, we use coins and notes (paper money) instead. Money helps us get food, clothes, toys, and lots of other things!',
    ageGroup: 'junior',
    pointsReward: 10,
    quiz: [
      {
        question: 'What did people do before money existed?',
        options: ['Traded items with each other', 'Used credit cards', 'Everything was free'],
        correctIndex: 0,
        explanation: 'Before money, people traded items they had for things they needed.',
      },
      {
        question: 'What is money used for?',
        options: ['Only playing games', 'Buying things we need and want', 'Decoration'],
        correctIndex: 1,
        explanation: 'Money is used to buy things we need (like food) and want (like toys).',
      },
      {
        question: 'Which of these is a form of money?',
        options: ['A leaf', 'A coin', 'A rock'],
        correctIndex: 1,
        explanation: 'Coins are a form of money we use every day.',
      },
    ],
  },
  {
    id: 'junior-saving-for-later',
    title: 'Saving for Later',
    description: 'Discover why saving money is a great habit.',
    content:
      'Saving means keeping some of your money to use later instead of spending it all right away. Imagine you get 10 coins — you could spend them all on sweets today, or save 5 coins and buy something bigger later! A piggy bank is a great place to keep your savings safe.',
    ageGroup: 'junior',
    pointsReward: 10,
    quiz: [
      {
        question: 'What does saving money mean?',
        options: ['Spending it all right away', 'Keeping some to use later', 'Giving it all away'],
        correctIndex: 1,
        explanation: 'Saving means putting money aside so you can use it in the future.',
      },
      {
        question: 'Why is saving money a good idea?',
        options: [
          'So you can buy bigger things later',
          'Because money is boring',
          'To make your wallet heavy',
        ],
        correctIndex: 0,
        explanation: 'Saving helps you afford bigger or more important things in the future.',
      },
      {
        question: 'Where is a good place to keep your savings?',
        options: ['Under your pillow', 'In the bin', 'In a piggy bank'],
        correctIndex: 2,
        explanation: 'A piggy bank keeps your savings safe and helps you watch them grow!',
      },
    ],
  },
  {
    id: 'junior-needs-vs-wants',
    title: 'Needs vs Wants',
    description: 'Learn the difference between things you need and things you want.',
    content:
      "Needs are things you must have to live, like food, water, clothes, and a home. Wants are things that are nice to have but you can live without, like toys, sweets, and video games. It's important to take care of your needs first, and then use leftover money for wants!",
    ageGroup: 'junior',
    pointsReward: 10,
    quiz: [
      {
        question: 'Which of these is a need?',
        options: ['A video game', 'Food', 'A toy car'],
        correctIndex: 1,
        explanation: 'Food is something you must have to live — it is a need.',
      },
      {
        question: 'Which of these is a want?',
        options: ['Water', 'Clothes', 'A new toy'],
        correctIndex: 2,
        explanation: 'A toy is nice to have, but you can live without it — it is a want.',
      },
      {
        question: 'What should you spend money on first?',
        options: ['Wants', 'Whatever is cheapest', 'Needs'],
        correctIndex: 2,
        explanation: 'Always take care of your needs first before spending on wants.',
      },
    ],
  },

  // ── Standard (ages 10-13) ──────────────────────────────────────
  {
    id: 'standard-budgeting-basics',
    title: 'Budgeting Basics',
    description: 'Learn how to plan your spending and saving.',
    content:
      'A budget is a plan for how you will spend and save your money. Start by writing down how much money you get (from pocket money, gifts, or tasks). Then list what you need to spend money on and what you want to save for. A good rule is the 50-30-20 rule: 50% for needs, 30% for wants, and 20% for savings.',
    ageGroup: 'standard',
    pointsReward: 15,
    quiz: [
      {
        question: 'What is a budget?',
        options: ['A type of wallet', 'A plan for spending and saving', 'A way to borrow money'],
        correctIndex: 1,
        explanation: 'A budget is a plan that helps you decide how to use your money.',
      },
      {
        question: 'In the 50-30-20 rule, how much should go to savings?',
        options: ['50%', '30%', '20%'],
        correctIndex: 2,
        explanation: 'The 50-30-20 rule suggests saving 20% of your money.',
      },
      {
        question: 'What is the first step in making a budget?',
        options: [
          'Spend all your money',
          'Know how much money you have',
          'Buy what you want',
        ],
        correctIndex: 1,
        explanation: 'You need to know how much money you have before you can plan how to use it.',
      },
    ],
  },
  {
    id: 'standard-earning-and-spending',
    title: 'Earning and Spending',
    description: 'Understand how earning and spending money works.',
    content:
      'Earning money means getting paid for doing work or completing tasks. When you earn money, you have choices about how to spend it. Smart spenders compare prices before buying, wait before making big purchases, and avoid buying things just because their friends have them. Every rand you spend is a rand you cannot save!',
    ageGroup: 'standard',
    pointsReward: 15,
    quiz: [
      {
        question: 'What does earning money mean?',
        options: [
          'Finding it on the ground',
          'Getting paid for work',
          'Borrowing from friends',
        ],
        correctIndex: 1,
        explanation: 'Earning means receiving money in exchange for work or tasks you complete.',
      },
      {
        question: 'What do smart spenders do?',
        options: [
          'Buy everything they see',
          'Compare prices before buying',
          'Only buy expensive things',
        ],
        correctIndex: 1,
        explanation: 'Smart spenders compare prices to make sure they get the best value.',
      },
      {
        question: 'If you earn R50 and spend R30, how much can you save?',
        options: ['R30', 'R50', 'R20'],
        correctIndex: 2,
        explanation: 'R50 minus R30 equals R20 that you can save.',
      },
    ],
  },
  {
    id: 'standard-financial-goals',
    title: 'Setting Financial Goals',
    description: 'Learn how to set and achieve savings goals.',
    content:
      'A financial goal is something you want to save up for. Goals can be short-term (saving for a book in a few weeks) or long-term (saving for a bicycle over several months). To reach your goals, decide how much you need, set a deadline, and save a little bit regularly. Tracking your progress helps you stay motivated!',
    ageGroup: 'standard',
    pointsReward: 15,
    quiz: [
      {
        question: 'What is a financial goal?',
        options: [
          'Spending money quickly',
          'Something you save up for',
          'A type of bank account',
        ],
        correctIndex: 1,
        explanation: 'A financial goal is a target amount you want to save for something.',
      },
      {
        question: 'Which is a long-term goal?',
        options: [
          'Buying sweets today',
          'Getting a drink this week',
          'Saving for a bicycle over months',
        ],
        correctIndex: 2,
        explanation: 'Long-term goals take weeks or months of saving to achieve.',
      },
      {
        question: 'What helps you reach your savings goal?',
        options: [
          'Saving a little bit regularly',
          'Spending money on other things',
          'Forgetting about it',
        ],
        correctIndex: 0,
        explanation: 'Consistent, regular saving is the best way to reach your goals.',
      },
    ],
  },

  // ── Teen (ages 14+) ────────────────────────────────────────────
  {
    id: 'teen-understanding-interest',
    title: 'Understanding Interest',
    description: 'Learn how interest makes your money grow.',
    content:
      'Interest is money that grows on top of your savings, or extra cost when you borrow. When you save money in a bank, the bank pays you interest — like a reward for keeping your money there. Compound interest means you earn interest on your interest, making your money grow even faster over time. The earlier you start saving, the more interest you earn!',
    ageGroup: 'teen',
    pointsReward: 20,
    quiz: [
      {
        question: 'What is interest on savings?',
        options: [
          'A fee you pay the bank',
          'Money the bank pays you for saving',
          'A type of tax',
        ],
        correctIndex: 1,
        explanation: 'Banks pay you interest as a reward for keeping your money with them.',
      },
      {
        question: 'What is compound interest?',
        options: [
          'Interest only on your original amount',
          'Interest earned on your interest too',
          'A penalty for saving too much',
        ],
        correctIndex: 1,
        explanation: 'Compound interest means your interest earns interest, accelerating growth.',
      },
      {
        question: 'When should you start saving to benefit most from interest?',
        options: [
          'As late as possible',
          'Only when you are an adult',
          'As early as possible',
        ],
        correctIndex: 2,
        explanation: 'Starting early gives compound interest more time to grow your savings.',
      },
    ],
  },
  {
    id: 'teen-smart-spending',
    title: 'Smart Spending',
    description: 'Make informed decisions about where your money goes.',
    content:
      'Smart spending means making informed decisions about where your money goes. Before buying something, ask yourself: Do I need it? Can I afford it? Is this the best price? The 24-hour rule suggests waiting a day before making non-essential purchases to avoid impulse buying. Comparing products, reading reviews, and looking for deals can save you a lot of money over time.',
    ageGroup: 'teen',
    pointsReward: 20,
    quiz: [
      {
        question: 'What is the 24-hour rule?',
        options: [
          'Return items within 24 hours',
          'Wait a day before non-essential purchases',
          'Only shop for 24 hours a month',
        ],
        correctIndex: 1,
        explanation: 'Waiting 24 hours before buying helps you avoid impulse purchases.',
      },
      {
        question: 'Before buying something, you should ask:',
        options: [
          'Will my friends be jealous?',
          'Is it the most expensive option?',
          'Do I need it and can I afford it?',
        ],
        correctIndex: 2,
        explanation: 'Asking if you need it and can afford it helps you spend wisely.',
      },
      {
        question: 'How can you save money when shopping?',
        options: [
          'Always buy the first thing you see',
          'Compare prices and look for deals',
          'Only shop at one store',
        ],
        correctIndex: 1,
        explanation: 'Comparing prices ensures you get the best value for your money.',
      },
    ],
  },
  {
    id: 'teen-intro-to-investing',
    title: 'Introduction to Investing',
    description: 'Understand the basics of growing your money.',
    content:
      'Investing means using your money to buy something that you hope will grow in value over time. Unlike saving in a bank, investing can earn higher returns but also carries risk — you could lose money. Common investments include stocks (owning a small piece of a company), bonds (lending money to a government or company), and property. Diversification means spreading your investments to reduce risk.',
    ageGroup: 'teen',
    pointsReward: 20,
    quiz: [
      {
        question: 'What does investing mean?',
        options: [
          'Spending money on things you want',
          'Putting money into something that may grow in value',
          'Hiding money under your bed',
        ],
        correctIndex: 1,
        explanation: 'Investing is using money with the goal of it growing over time.',
      },
      {
        question: 'What is diversification?',
        options: [
          'Putting all money in one investment',
          'Spreading investments to reduce risk',
          'Only investing in stocks',
        ],
        correctIndex: 1,
        explanation: 'Diversification reduces risk by not putting all your eggs in one basket.',
      },
      {
        question: 'How is investing different from saving?',
        options: [
          'Investing has no risk',
          'Investing can earn higher returns but carries risk',
          'There is no difference',
        ],
        correctIndex: 1,
        explanation: 'Investing offers potentially higher returns than saving, but you could lose money.',
      },
    ],
  },
];

// ─── Badge Definitions ──────────────────────────────────────────

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'fast_learner',
    name: 'Fast Learner',
    description: 'Complete your first financial lesson.',
  },
  {
    id: 'quiz_master',
    name: 'Quiz Master',
    description: 'Complete 3 financial lessons.',
  },
  {
    id: 'lesson_legend',
    name: 'Lesson Legend',
    description: 'Complete all lessons for your age group.',
  },
];

// Minimum fraction of quiz questions that must be correct to pass.
export const QUIZ_PASS_THRESHOLD = 2 / 3;

// ─── Catalog Accessors ──────────────────────────────────────────

export function getLessonsForAgeGroup(ageGroup: AgeGroup): Lesson[] {
  return LESSONS.filter((lesson) => lesson.ageGroup === ageGroup);
}

export function getLessonById(lessonId: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.id === lessonId);
}

export function getAllLessons(): Lesson[] {
  return LESSONS;
}
