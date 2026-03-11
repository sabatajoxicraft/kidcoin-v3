import type { AgeGroup, TaskTemplate } from '@/src/types';

export const TASK_TEMPLATE_AGE_GROUPS: Array<{
  key: AgeGroup;
  label: string;
  helperText: string;
}> = [
  {
    key: 'junior',
    label: 'Junior (6-9)',
    helperText: 'Short, visual routines that build confidence and consistency.',
  },
  {
    key: 'standard',
    label: 'Standard (10-13)',
    helperText: 'Independent household tasks with a little more responsibility.',
  },
  {
    key: 'teen',
    label: 'Teen (14+)',
    helperText: 'Higher-trust tasks that reward planning, effort, and initiative.',
  },
];

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'junior-tidy-toys',
    ageGroup: 'junior',
    category: 'Bedroom routine',
    title: 'Tidy up toys and books',
    description: 'Put away your toys, stack your books neatly, and make sure the floor is clear before dinner.',
    suggestedPoints: 8,
    estimatedTime: '10-15 min',
    parentTip: 'A quick photo before and after works well for younger children.',
  },
  {
    id: 'junior-set-table',
    ageGroup: 'junior',
    category: 'Helping at home',
    title: 'Set the table for a family meal',
    description: 'Place the plates, cups, and cutlery for dinner and check with a parent that everything is ready.',
    suggestedPoints: 10,
    estimatedTime: '10 min',
    parentTip: 'Great for building responsibility around daily family routines.',
  },
  {
    id: 'junior-pack-school-bag',
    ageGroup: 'junior',
    category: 'School prep',
    title: 'Pack tomorrow’s school bag',
    description: 'Pack your homework, reading book, lunch box, and water bottle so you are ready for tomorrow.',
    suggestedPoints: 6,
    estimatedTime: '5-10 min',
    parentTip: 'This template works well as an evening routine task.',
  },
  {
    id: 'standard-sort-laundry',
    ageGroup: 'standard',
    category: 'Household help',
    title: 'Sort laundry and match socks',
    description: 'Separate light and dark clothes, then match as many socks as you can before handing the basket back.',
    suggestedPoints: 12,
    estimatedTime: '15-20 min',
    parentTip: 'Easy to review in person and good for building follow-through.',
  },
  {
    id: 'standard-sweep-floor',
    ageGroup: 'standard',
    category: 'Cleaning',
    title: 'Sweep one shared space',
    description: 'Sweep the kitchen, patio, or another shared room and throw away the collected dust and crumbs.',
    suggestedPoints: 14,
    estimatedTime: '15 min',
    parentTip: 'Let the child choose the room to make the task feel more owned.',
  },
  {
    id: 'standard-lunch-reset',
    ageGroup: 'standard',
    category: 'Daily routine',
    title: 'Clean and reset your lunch gear',
    description: 'Wash your lunch box and water bottle, then leave them open to dry so they are ready for tomorrow.',
    suggestedPoints: 10,
    estimatedTime: '10-15 min',
    parentTip: 'Pairs nicely with a points streak for weekday routines.',
  },
  {
    id: 'teen-meal-prep',
    ageGroup: 'teen',
    category: 'Kitchen help',
    title: 'Help prepare a family meal',
    description: 'Assist with one family meal by chopping ingredients, setting up the workspace, or handling clean-up afterward.',
    suggestedPoints: 18,
    estimatedTime: '25-35 min',
    parentTip: 'A strong higher-value task for trust and independence.',
  },
  {
    id: 'teen-price-compare',
    ageGroup: 'teen',
    category: 'Money skills',
    title: 'Compare prices for three grocery items',
    description: 'Check prices for three grocery items online or in-store and tell a parent which option gives the best value.',
    suggestedPoints: 16,
    estimatedTime: '20-25 min',
    parentTip: 'Connects chores with real-world financial thinking.',
  },
  {
    id: 'teen-study-space-reset',
    ageGroup: 'teen',
    category: 'Personal responsibility',
    title: 'Deep clean your study space',
    description: 'Clear your desk, wipe the surface, organise cables or stationery, and leave the space ready for your next study session.',
    suggestedPoints: 15,
    estimatedTime: '20 min',
    parentTip: 'Useful as a weekly reset task with clear visible results.',
  },
];

export function getTaskTemplateById(templateId: string): TaskTemplate | null {
  return TASK_TEMPLATES.find((template) => template.id === templateId) ?? null;
}

export function getTaskTemplatesForAgeGroup(ageGroup: AgeGroup): TaskTemplate[] {
  return TASK_TEMPLATES.filter((template) => template.ageGroup === ageGroup);
}

export function getTaskTemplateAgeGroupLabel(ageGroup: AgeGroup): string {
  return TASK_TEMPLATE_AGE_GROUPS.find((group) => group.key === ageGroup)?.label ?? ageGroup;
}
