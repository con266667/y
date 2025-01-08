
import React from 'react';
import { Text, View, TouchableOpacity, Linking, useColorScheme, StyleSheet } from 'react-native';

interface SourceInfo {
  name: string;
  sourceId: string;
  url: string;
  valid: boolean;
}

export interface NewsStory {
  id: string;
  storyTitle: string;
  summaryOneHeadline: string;
  summaryOneText: string;
  summaryTwoHeadline: string;
  summaryTwoText: string;
  sources: SourceInfo[];
}

const NewsArticle: React.FC<NewsStory> = ({
  storyTitle,
  summaryOneText,
  summaryTwoText,
  sources
}) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  return (
    <>
      <Text style={[styles.articleTitle, isDarkMode && styles.articleTitleDark]} numberOfLines={5}>
        {storyTitle}
      </Text>
      <Text style={[styles.articleContent, isDarkMode && styles.articleContentDark]}>
        {`${summaryOneText} ${summaryTwoText}`}
      </Text>
      <View style={styles.sourcesContainer}>
        {sources.map((source, index) => (
          <TouchableOpacity key={`${source.sourceId}-${index}`} onPress={() => Linking.openURL(source.url)} style={[styles.sourcePill, isDarkMode && styles.sourcePillDark]}>
            <Text style={[styles.sourceText, isDarkMode && styles.sourceTextDark]}>{source.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
};

export default NewsArticle;

const styles = StyleSheet.create({
  articleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  articleContent: {
    fontSize: 14,
    paddingBottom: 10,
  },
  articleTitleDark: {
    color: 'white',
  },
  articleContentDark: {
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
});