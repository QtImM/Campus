import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { Building2, Calendar as CalendarIcon, GraduationCap, Map as MapIcon, User as UserIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { AnimatedTabIcon } from '../../components/common/AnimatedTabIcon';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 25,
          left: 20,
          right: 20,
          height: 64,
          borderRadius: 25,
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint="light"
            style={{
              ...StyleSheet.absoluteFillObject,
              borderRadius: 25,
              overflow: 'hidden'
            }}
          />
        ),
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: -5,
          marginBottom: 8,
        },
        tabBarShowLabel: true,
        lazy: true,
      }}
    >
      {/* Hidden redirect tab */}
      <Tabs.Screen
        name="index"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="campus"
        options={{
          tabBarLabel: t('navigation.home'),
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused} color={color} size={22} IconComponent={CalendarIcon} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          tabBarLabel: t('navigation.map'),
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused} color={color} size={22} IconComponent={MapIcon} />
          ),
        }}
      />
      <Tabs.Screen
        name="course"
        options={{
          tabBarLabel: t('navigation.course'),
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused} color={color} size={22} IconComponent={GraduationCap} />
          ),
        }}
      />
      <Tabs.Screen
        name="classroom"
        options={{
          tabBarLabel: t('navigation.classroom'),
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused} color={color} size={22} IconComponent={Building2} />
          ),
        }}
      />
      <Tabs.Screen
        name="connect"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: t('navigation.me'),
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused} color={color} size={22} IconComponent={UserIcon} />
          ),
        }}
      />
    </Tabs>
  );
}
