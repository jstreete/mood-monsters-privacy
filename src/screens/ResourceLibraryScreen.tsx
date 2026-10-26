import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, LAYOUT, getColor } from '../constants/theme';

interface ResourceArticle {
  id: string;
  title: string;
  category: 'Meltdowns' | 'Transitions' | 'Staying Calm' | 'Sleep' | 'Feelings' | 'School' | 'Siblings';
  summary: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  content: string;
}

const ARTICLES: ResourceArticle[] = [
  {
    id: '1',
    title: 'When Your Child Has a Meltdown',
    category: 'Meltdowns',
    summary: 'What to do (and not do) when things boil over — and how to help them calm down faster.',
    icon: 'weather-lightning',
    content: [
      "A meltdown is your child's way of saying \"I'm completely overwhelmed and I don't know what to do.\" It's not a tantrum — they're not doing it on purpose.",
      '',
      'What NOT to do:',
      "• Don't raise your voice — it makes things worse.",
      "• Don't try to reason with them mid-meltdown — their brain isn't ready to listen.",
      "• Don't take away privileges in the moment.",
      '',
      'What DOES help:',
      "• Stay quiet and nearby — your calm is contagious.",
      '• Reduce noise and light if you can (move to a quieter room).',
      '• Use as few words as possible: "I\'m here. You\'re safe."',
      '• Give them space to ride it out — most meltdowns peak and fade within 10-20 minutes.',
      '• Offer a hug or tight squeeze once they start to calm — but only if they want it.',
      '',
      'After the meltdown:',
      '• Wait 30-60 minutes before talking about what happened.',
      '• Use simple language and focus on what they can do differently next time.',
    ].join('\n'),
  },
  {
    id: '2',
    title: 'Switching Activities Without a Fight',
    category: 'Transitions',
    summary: 'Simple tricks to help your child move from one thing to the next without meltdowns.',
    icon: 'clock-fast',
    content: [
      "Stopping a fun activity (like screen time or playing) is really hard for many kids. Their brain gets \"locked in\" and switching gears feels terrible.",
      '',
      'Why it happens:',
      '• Kids often lose track of time when absorbed in something they love.',
      "• Stopping feels like a punishment, even when it's not.",
      '',
      'What helps:',
      '• Give 2 warnings — one at 5 minutes, one at 1 minute. Be consistent every time.',
      '• Use a visual timer (a phone timer they can see) so stopping feels fair, not random.',
      '• Tell them what comes NEXT: "After tablets, we have dinner and then you pick the show tonight."',
      '• Keep the same routine daily — predictability is comforting.',
      '• Let them finish one more thing (one more minute, one more lap) so they feel heard.',
      '',
      'For morning routines:',
      '• Post a simple picture checklist on the wall (brush teeth, shoes, backpack).',
      '• Use the same order every single day.',
    ].join('\n'),
  },
  {
    id: '3',
    title: 'Keeping Yourself Calm During Hard Moments',
    category: 'Staying Calm',
    summary: "Your calm is your child's best tool. Here's how to keep it together when things get tough.",
    icon: 'heart-pulse',
    content: [
      "When your child melts down, your body's stress response kicks in too — heart racing, voice rising, patience gone. That's completely normal. But your calm is the single most powerful thing that helps your child settle.",
      '',
      'In the moment:',
      '• Take one slow breath before you respond. Just one.',
      '• Lower your voice instead of raising it — whisper if you have to.',
      '• Soften your face — even forcing a slight smile helps your body relax.',
      '• Use short sentences: "I see you." / "We\'re okay." / "I\'m right here."',
      '',
      'For yourself:',
      '• Step out for 30 seconds if another adult is home. It\'s okay.',
      "• Remind yourself: their behavior is a cry for help, not an attack on you.",
      "• Take care of your own sleep, food, and support system — you can't pour from an empty cup.",
      '',
      'Long-term:',
      '• Debrief with a partner or friend after hard days.',
      '• Celebrate small wins — any time you stayed calm is a genuine parenting victory.',
    ].join('\n'),
  },
  {
    id: '4',
    title: 'Bedtime Battles: Getting Your Child to Sleep',
    category: 'Sleep',
    summary: 'Why bedtime is so hard for many kids, and what actually helps.',
    icon: 'moon-waning-crescent',
    content: [
      'Many kids with big feelings or high energy find it nearly impossible to wind down at night. Their brain keeps going even when their body is tired.',
      '',
      'Why it happens:',
      '• Screens (TV, tablets, phones) right before bed keep the brain wired.',
      '• Anxiety often peaks at night — the quiet makes worries louder.',
      '• Some kids need more physical activity during the day to tire out before sleep.',
      '',
      'What helps:',
      '• Start a wind-down routine 30-45 minutes before bed: bath, PJs, books, lights out.',
      '• Cut screens at least 1 hour before bed (or 2 hours if possible).',
      '• Keep the room cool, dark, and quiet. A white noise machine or fan blocks outside sounds.',
      '• Try a relaxation exercise: breathe in for 4 counts, hold for 4, out for 4.',
      '• Let them have one or two small choices: "Do you want the bunny or dinosaur tonight?" Control helps them feel safe.',
      '• If they\'re anxious, try a worry journal — write or draw worries before bed to "put them away" for the night.',
    ].join('\n'),
  },
  {
    id: '5',
    title: 'Helping Your Child Talk About Their Feelings',
    category: 'Feelings',
    summary: "Kids who can say what they feel are less likely to act it out. Here's how to build that skill.",
    icon: 'emoticon-outline',
    content: [
      "When kids can't find words for their feelings, the feelings come out as behavior — hitting, crying, throwing things. Building an emotional vocabulary is one of the most powerful things you can teach.",
      '',
      'Start simple:',
      '• Teach just 5 core feelings first: happy, sad, mad, scared, frustrated.',
      '• Name feelings out loud yourself: "I\'m feeling frustrated right now because traffic was bad."',
      '• Point to feelings during calm moments — not during meltdowns.',
      '',
      'Tools that help:',
      '• A feelings chart with faces (print one for the fridge).',
      '• Books like "The Invisible String," "Today I Feel Silly," or "Grumpy Monkey."',
      '• Color zones — red (out of control), yellow (wobbly/anxious), green (good to go), blue (tired/sad).',
      '',
      'During a hard moment:',
      '• Ask "Are you feeling really mad right now?" instead of "What\'s wrong?"',
      '• Validate first: "It makes sense you\'re mad. That was hard."',
      "• Don't demand they talk — just name what you see: \"I can see this is really hard for you.\"",
    ].join('\n'),
  },
  {
    id: '6',
    title: 'School Morning Meltdowns',
    category: 'School',
    summary: 'Make mornings less stressful with routines that actually stick.',
    icon: 'school',
    content: [
      'School mornings are one of the hardest times for families — everyone is tired, rushed, and running on empty. For kids who struggle with transitions, mornings can feel like a wall of demands.',
      '',
      'Common triggers:',
      '• Being woken up abruptly (sleep to school is a massive switch).',
      '• Too many decisions too fast (what to wear, what to eat).',
      '• Anxiety about the school day ahead.',
      '',
      'What helps:',
      '• Prep the night before: lay out clothes, pack the backpack, decide breakfast.',
      '• Give a gentle 5-minute wake-up buffer — a favorite song or lamp light instead of a loud alarm.',
      "• Use a picture checklist on the wall so you don't have to remind them every step.",
      '• Build in 1 fun thing they look forward to every morning (favorite song, 5 minutes of a show, a specific breakfast).',
      '• Leave earlier than you think — rushing is the #1 trigger.',
      '',
      'If school anxiety is the issue:',
      "• Talk about what's hard about school during a calm time — not in the morning.",
      '• Work with the teacher on an "arrival plan" to ease the transition into class.',
    ].join('\n'),
  },
  {
    id: '7',
    title: 'When Siblings Fight: Keeping the Peace',
    category: 'Siblings',
    summary: 'Sibling conflict is normal — but there are ways to reduce it and respond better.',
    icon: 'account-group',
    content: [
      'Sibling fighting is completely normal, but when one child has big emotions or extra needs, it can escalate fast and wear everyone down.',
      '',
      'Why it happens:',
      '• Competition for parent attention — especially when one child needs more focused attention.',
      '• Fairness feels very personal to kids: "You always let him..."',
      '• The child with bigger behaviors is sometimes a target of frustration from the other sibling.',
      '',
      'What helps:',
      '• Schedule one-on-one time with each child, even 10 minutes matters.',
      '• Teach a simple conflict script: "I feel ___ when you ___. Can we ___?"',
      '• Create clear rules about shared spaces and toys — make it predictable.',
      "• Don't always jump in immediately — let them try to work it out for 60 seconds first.",
      '• Praise cooperative moments loudly: "I love how you two figured that out together!"',
      '',
      'For the sibling of a child with extra needs:',
      "• Name it openly: \"Your brother has a harder time with his feelings. That's not your fault.\"",
      '• Let them express frustration with you privately — they need an outlet too.',
      '• Make sure they feel seen and proud of their own strengths.',
    ].join('\n'),
  },
];

import { useUser } from '../context/UserContext';

export const ResourceLibraryScreen = ({ navigation }: any) => {
  const { settings } = useUser();
  const systemColorScheme = useColorScheme();
  const isDark = settings.theme === 'system' ? systemColorScheme === 'dark' : settings.theme === 'dark';

  const bg = getColor('background', isDark);
  const cardBg = getColor('cardBackground', isDark);
  const textP = getColor('textPrimary', isDark);
  const textS = getColor('textSecondary', isDark);

  const [activeArticle, setActiveArticle] = useState<ResourceArticle | null>(null);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={textP} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: textP }]}>Resource Library</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.subtitle, { color: textS }]}>
          Practical guides every parent can use — no jargon, just what works.
        </Text>

        <View style={{ gap: SPACING.m, marginTop: SPACING.m }}>
          {ARTICLES.map((art) => (
            <TouchableOpacity
              key={art.id}
              style={[styles.card, { backgroundColor: cardBg }]}
              onPress={() => setActiveArticle(art)}
            >
              <View style={[styles.iconCircle, { backgroundColor: COLORS.primary + '15' }]}>
                <MaterialCommunityIcons name={art.icon} size={28} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.categoryBadge}>{art.category}</Text>
                <Text style={[styles.cardTitle, { color: textP }]}>{art.title}</Text>
                <Text style={[styles.cardSub, { color: textS }]}>{art.summary}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={textS} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Article Detail Modal */}
      <Modal visible={!!activeArticle} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setActiveArticle(null)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: bg }]}>
          {activeArticle && (
            <>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalHeaderTitle, { color: textP }]}>{activeArticle.title}</Text>
                <TouchableOpacity onPress={() => setActiveArticle(null)}>
                  <MaterialCommunityIcons name="close" size={26} color={textS} />
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={styles.articleBody}>
                <Text style={[styles.articleText, { color: textP }]}>{activeArticle.content}</Text>
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontWeight: '800' },
  content: { padding: SPACING.m },
  subtitle: { fontSize: 14, lineHeight: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    borderRadius: LAYOUT.borderRadius,
    elevation: 2,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: { fontSize: 11, fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase', marginBottom: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSub: { fontSize: 12, marginTop: 2 },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalHeaderTitle: { fontSize: 18, fontWeight: '800' },
  articleBody: { padding: SPACING.l },
  articleText: { fontSize: 15, lineHeight: 24 },
});
