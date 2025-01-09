import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, Dimensions, useColorScheme, RefreshControl, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { parseString } from 'react-native-xml2js';
import { formatDistanceToNow } from 'date-fns';
import MathView from 'react-native-math-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Article from './components/Article';
import NewsArticle from './components/NewsArticle';
import useFetchStories from './hooks/useFetchStories';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const {
    isLoading,
    refreshing,
    onRefresh,
    interleaveItems,
    handleSwipeAway,
    previousIndex,
    setPreviousIndex
  } = useFetchStories();

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, isDarkMode && styles.pageDark]}>
        <ActivityIndicator size="large" color={isDarkMode ? '#ffffff' : '#000000'} />
      </View>
    );
  }

  return (
    <ScrollView
      pagingEnabled
      showsVerticalScrollIndicator={false}
      style={styles.scrollView}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      onMomentumScrollEnd={(e) => {
        const newIndex = Math.round(e.nativeEvent.contentOffset.y / height);
        if (previousIndex >= 0 && previousIndex !== newIndex) {
          const oldItem = interleaveItems()[previousIndex];
          if (oldItem && ('id' in oldItem || 'link' in oldItem)) {
            handleSwipeAway('id' in oldItem ? oldItem.id : oldItem.link);
          }
        }
        setPreviousIndex(newIndex);
      }}
    >
      {interleaveItems().map((item, index) => (
        <View key={index} style={[styles.page, isDarkMode && styles.pageDark]}>
          {'title' in item ? (
            <Article
              title={item.title}
              content={item.content}
              date={item.date}
              authors={item.authors}
              link={item.link}
            />
          ) : (
            <NewsArticle
              id={item.id}
              storyTitle={item.storyTitle}
              summaryOneHeadline={item.summaryOneHeadline}
              summaryOneText={item.summaryOneText}
              summaryTwoHeadline={item.summaryTwoHeadline}
              summaryTwoText={item.summaryTwoText}
              sources={item.sources}
            />
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  page: {
    height,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 25,
    paddingTop: 70,
    backgroundColor: 'white'
  },
  pageDark: {
    backgroundColor: 'black',
  },
  article: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 1,
  },
  articleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  articleDate: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  articleAuthors: {
    fontSize: 14,
    marginBottom: 10,
  },
  articleContent: {
    fontSize: 14,
    paddingBottom: 10,
  },
  articleTitleDark: {
    color: 'white',
  },
  articleDateDark: {
    color: 'lightgray',
  },
  articleAuthorsDark: {
    color: 'lightgray',
  },
  articleContentDark: {
    color: 'white',
  },
  mathView: {
    color: 'black',
  },
  mathViewDark: {
    color: 'white',
  },
  sourcesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  sourcePill: {
    backgroundColor: '#e0e0e0',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 5,
    marginBottom: 5,
  },
  sourcePillDark: {
    backgroundColor: '#333',
  },
  sourceText: {
    fontSize: 12,
    color: 'black',
  },
  sourceTextDark: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
});