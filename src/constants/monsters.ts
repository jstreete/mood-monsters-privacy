import { Monster, EmotionType } from '../types';
import { COLORS } from './theme';

export const MONSTERS: Monster[] = [
    {
        id: 'Happy',
        name: 'Happy',
        color: '#32CD32', // Lime Green
        imageSource: 'emoticon-happy-outline',
        description: 'Feeling great and smiling!',
    },
    {
        id: 'Calm',
        name: 'Calm',
        color: '#87CEEB', // Sky Blue
        imageSource: 'bullseye-arrow',
        description: 'Peaceful and ready to learn.',
    },
    {
        id: 'Excited',
        name: 'Excited',
        color: '#FF69B4', // Vibrant Pink
        imageSource: 'star-face',
        description: 'Full of energy and shiny stars!',
    },
    {
        id: 'Sad',
        name: 'Sad',
        color: '#9370DB', // Muted Purple
        imageSource: 'emoticon-sad-outline',
        description: 'Feeling down or teary.',
    },
    {
        id: 'Angry',
        name: 'Angry',
        color: '#FF4500', // Warm Red
        imageSource: 'emoticon-angry-outline',
        description: 'Frowning and feeling hot!',
    },
    {
        id: 'Scared',
        name: 'Scared',
        color: '#FFFACD', // Pale Yellow
        imageSource: 'ghost-outline',
        description: 'Wanting to hide.',
    },
    {
        id: 'Tired',
        name: 'Tired',
        color: '#8FBC8F', // Grayish Green
        imageSource: 'bed-outline',
        description: 'Sleepy and low energy.',
    },
    {
        id: 'Silly',
        name: 'Silly',
        color: '#FFA500', // Orange
        imageSource: 'emoticon-tongue-outline',
        description: 'Goofy and playful!',
    },
];
