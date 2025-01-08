
import React from 'react';
import { Text, View, TouchableOpacity, Linking, useColorScheme, StyleSheet } from 'react-native';
import MathView from 'react-native-math-view';

interface ArticleProps {
  title: string;
  content: string;
  date: string;
  authors: string[];
  link: string;
}

const Article: React.FC<ArticleProps> = ({ title, content, date, authors, link }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const renderContent = (text: string) => {
    const parts = text.split(/(\$[^$]*\$)/g);
    return (
      <Text style={[styles.articleContent, isDarkMode && styles.articleContentDark]}>
        {parts.map((part, index) => {
          if (part.startsWith('$') && part.endsWith('$')) {
            return (
              <MathView
                key={index}
                math={part.slice(1, -1)}
                style={isDarkMode ? styles.mathViewDark : styles.mathView}
                inline
              />
            );
          }
          return part;
        })}
      </Text>
    );
  };

  const handleTitlePress = (link: string) => {
    Linking.openURL(link).catch(err => console.error("Couldn't load page", err));
  };

  return (
    <>
      <TouchableOpacity onPress={() => handleTitlePress(link)}>
        <Text style={[styles.articleTitle, isDarkMode && styles.articleTitleDark]} numberOfLines={4} ellipsizeMode="tail">{title}</Text>
      </TouchableOpacity>
      <Text style={[styles.articleDate, isDarkMode && styles.articleDateDark]}>{date}</Text>
      <Text style={[styles.articleAuthors, isDarkMode && styles.articleAuthorsDark]} numberOfLines={2} ellipsizeMode="tail">{authors.join(', ')}</Text>
      <View>{renderContent(content)}</View>
    </>
  );
};

export default Article;

const styles = StyleSheet.create({
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
});