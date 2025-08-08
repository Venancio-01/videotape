import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { TikTokHomeScreen } from '@/screens/TikTokHomeScreen';
import { VideoListScreen } from '@/screens/VideoListScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { UploadScreen } from '@/screens/UploadScreen';
import { DiscoverScreen } from '@/screens/DiscoverScreen';

// 类型定义
type RootStackParamList = {
  Main: undefined;
  VideoPlayer: { videoId: string };
  VideoDetail: { videoId: string };
  Settings: undefined;
};

type MainTabParamList = {
  Home: undefined;
  Discover: undefined;
  Upload: undefined;
  Library: undefined;
  Profile: undefined;
};

// 创建导航器
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * 主标签导航器
 */
const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Discover':
              iconName = focused ? 'compass' : 'compass-outline';
              break;
            case 'Upload':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
              break;
            case 'Library':
              iconName = focused ? 'folder' : 'folder-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'circle';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={TikTokHomeScreen}
        options={{ title: '首页' }}
      />
      <Tab.Screen 
        name="Discover" 
        component={DiscoverScreen}
        options={{ title: '发现' }}
      />
      <Tab.Screen 
        name="Upload" 
        component={UploadScreen}
        options={{ title: '发布' }}
      />
      <Tab.Screen 
        name="Library" 
        component={VideoListScreen}
        options={{ title: '文库' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: '我的' }}
      />
    </Tab.Navigator>
  );
};

/**
 * 应用导航器
 */
export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Main"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Main" 
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="VideoPlayer" 
          component={VideoPlayerScreen}
          options={{ title: '视频播放' }}
        />
        <Stack.Screen 
          name="VideoDetail" 
          component={VideoDetailScreen}
          options={{ title: '视频详情' }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{ title: '设置' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// 占位组件 - 这些屏幕将在后续实现
const VideoPlayerScreen: React.FC = () => {
  return null;
};

const VideoDetailScreen: React.FC = () => {
  return null;
};

const SettingsScreen: React.FC = () => {
  return null;
};