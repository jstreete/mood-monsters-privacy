import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CalmToolsScreen } from '../screens/CalmToolsScreen';
import { BreathingTool } from '../screens/calm-tools/BreathingTool';
import { CandleTool } from '../screens/calm-tools/CandleTool';
import { GroundingTool } from '../screens/calm-tools/GroundingTool';
import { MuscleRelaxationTool } from '../screens/calm-tools/MuscleRelaxationTool';
import { VisualTimerTool } from '../screens/calm-tools/VisualTimerTool';
import { GuidedImageryTool } from '../screens/calm-tools/GuidedImageryTool';

const Stack = createNativeStackNavigator();

export const CalmNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="CalmMenu" component={CalmToolsScreen} />
            <Stack.Screen name="Breathing" component={BreathingTool} />
            <Stack.Screen name="Candles" component={CandleTool} />
            <Stack.Screen name="Grounding" component={GroundingTool} />
            <Stack.Screen name="Muscle" component={MuscleRelaxationTool} />
            <Stack.Screen name="Timer" component={VisualTimerTool} />
            <Stack.Screen name="GuidedImagery" component={GuidedImageryTool} />
        </Stack.Navigator>
    );
};
