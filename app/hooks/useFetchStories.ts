import { useState, useCallback, useEffect } from 'react';
import { parseString } from 'react-native-xml2js';
import { formatDistanceToNow } from 'date-fns';

interface ArticleProps {
  title: string;
  content: string;
  date: string;
  authors: string[];
  link: string;
}

interface SourceInfo {
  name: string;
  sourceId: string;
  url: string;
  factuality: string;
}

interface NewsStory {
  id: string;
  storyTitle: string;
  summaryOneHeadline: string;
  summaryOneText: string;
  summaryTwoHeadline: string;
  summaryTwoText: string;
  sources: SourceInfo[];
}

export default function useFetchStories() {
  const [papers, setPapers] = useState<ArticleProps[]>([]);
  const [newsStories, setNewsStories] = useState<NewsStory[]>([]);
  const [canadianNewsStories, setCanadianNewsStories] = useState<NewsStory[]>([]);
  const [internationalNewsStories, setInternationalNewsStories] = useState<NewsStory[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [seenArticles, setSeenArticles] = useState<Set<string>>(new Set());
  const [previousIndex, setPreviousIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);

  const categories = ['cs.RO', 'math.OC'];

  const fetchPapers = async () => {
    try {
      const fetchCategory = async (category: string) => {
        const response = await fetch(
          `https://export.arxiv.org/api/query?search_query=cat:${category}&start=0&max_results=50&sortBy=submittedDate&sortOrder=descending`
        );
        const data = await response.text();
        return new Promise<ArticleProps[]>((resolve, reject) => {
          parseString(data, (err: Error | null, result: any) => {
            if (err) {
              reject(err);
              return;
            }
            const entries = result.feed.entry;
            const fetchedPapers = entries.map((entry: any) => ({
              title: entry.title[0].replace(/\s+/g, ' ').trim(),
              content: entry.summary[0].replace(/\s+/g, ' ').trim(),
              date: formatDistanceToNow(new Date(entry.published[0]), { addSuffix: true }),
              authors: entry.author.map((author: any) => author.name[0]),
              link: entry.id[0],
            }));
            resolve(fetchedPapers);
          });
        });
      };

      const results = await Promise.all(categories.map(fetchCategory));
      setPapers(results.flat());
    } catch (error) {
      console.error(error);
    }
  };

  const storiesFromInterest = async (interestId: string) => {
    try {
      const eventsResponse = await fetch(
        `https://web-api-cdn.ground.news/api/public/interest/${interestId}/events`
      );
      const eventsJson = await eventsResponse.json();
      const eventIds = eventsJson.eventIds;

      const storyPromises = eventIds.map(async (id: string) => {
        const eventResponse = await fetch(
          `https://web-api-cdn.ground.news/api/public/event/${id}`
        );
        const eventJson = await eventResponse.json();
        const eventData = eventJson.event;
        const story = {
          id: eventData.id,
          storyTitle: eventData.title,
          summaryOneHeadline: '',
          summaryOneText: eventData.description,
          summaryTwoHeadline: '',
          summaryTwoText: '',
          sources: eventData.firstTenSources.map((source: any) => ({
            name: source.sourceInfo.name,
            sourceId: source.sourceId,
            url: source.url,
            factuality: source.sourceInfo.factuality == "veryHigh"
          })),
        };

        // Sort by the number of sources
        storyPromises.sort((a, b) => (a.sources ?? []).length - (b.sources ?? []).length);

        // Filter sources that are not valid
        const oldSources = story.sources;
        story.sources = story.sources.filter((source: SourceInfo) => source.factuality == "veryHigh");
        if (story.sources.length === 0) {
          story.sources = oldSources.filter((source: SourceInfo) => source.factuality == "high");
        }
        if (story.sources.length === 0) {
          story.sources = oldSources;
        }
        return story;
      });

      return await Promise.all(storyPromises);
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const fetchInternationalNewsStories = async () => {
    try {
      const discoverResponse = await fetch(
        'https://web-api-cdn.ground.news/api/public/interests/discover'
      );
      console.log(discoverResponse);
      const discoverData = await discoverResponse.json();
      // Element where name==popular
      const popularElement = discoverData.find((i: any) => i.id === 'popular');
      const popularInterests = popularElement.interests;
      // id of name==international
      const internationalId = popularInterests.find((i: any) => i.slug === 'international').id;
      const stories = await storiesFromInterest(internationalId);
      setInternationalNewsStories(stories);
    } catch (error) {
      console.error(error, 'Error fetching international news stories');
    }
  };

  const fetchCanadianNewsStories = async () => {
    try {
      const canadaResponse = await fetch(
        'https://web-api-cdn.ground.news/api/public/place/CA/interest'
      );
      const canadaData = await canadaResponse.json();
      const canadaId = canadaData.interest.id;
      const stories = await storiesFromInterest(canadaId);

      setCanadianNewsStories(stories);
    } catch (error) {
      console.error(error, 'Error fetching Canadian news stories');
    }
  }

  const fetchGroundNewsStories = async () => {
    try {
      const response = await fetch(
        'https://web-api-cdn.ground.news/api/public/vectors/storiesInTodaysBriefing'
      );
      const data = await response.json();
      // Extract only essential info, skipping images
      const stories: NewsStory[] = data.stories.map((s: any) => ({
        id: s.id,
        storyTitle: s.storyTitle,
        summaryOneHeadline: s.summaryOneHeadline,
        summaryOneText: s.summaryOneText,
        summaryTwoHeadline: s.summaryTwoHeadline,
        summaryTwoText: s.summaryTwoText,
        sources: s.eventSummary.sources.map((source: any) => ({
          name: source.sourceInfo.name,
          sourceId: source.sourceId,
          url: source.url,
          valid: source.sourceInfo.factuality=="veryHigh"
        })),
      }));
      // Filter sources that are not valid
      stories.forEach(story => {
        story.sources = story.sources.filter(source => source.valid);
      });

      setNewsStories(stories);
    } catch (error) {
      console.error(error, 'Error fetching news stories');
    }
  };

  const loadSeenArticles = async () => {
    // try {
    //   const savedArticles = await AsyncStorage.getItem('seenArticles');
    //   if (savedArticles) {
    //     setSeenArticles(new Set(JSON.parse(savedArticles)));
    //   }
    // } catch (error) {
    //   console.error('Error loading seen articles:', error);
    // }
  };

  const saveSeenArticles = async (articles: Set<string>) => {
    // try {
    //   await AsyncStorage.setItem('seenArticles', JSON.stringify([...articles]));
    // } catch (error) {
    //   console.error('Error saving seen articles:', error);
    // }
  };

  const handleSwipeAway = (id: string) => {
    console.log(`Swiped away ${id}`);
    const newSeenArticles = new Set(seenArticles).add(id);
    setSeenArticles(newSeenArticles);
    saveSeenArticles(newSeenArticles);
  };

  const loadAllData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchPapers(),
      fetchGroundNewsStories(),
      fetchCanadianNewsStories(),
      fetchInternationalNewsStories()
    ]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadSeenArticles();
    loadAllData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAllData().then(() => setRefreshing(false));
  }, []);

  const interleaveItems = (): Array<ArticleProps | NewsStory> => {
    const allNewsStories = [];
    const maxNewsLen = Math.max(newsStories.length, canadianNewsStories.length, internationalNewsStories.length);
    for (let i = 0; i < maxNewsLen; i++) {
      if (i < newsStories.length) allNewsStories.push(newsStories[i]);
      if (i < canadianNewsStories.length) allNewsStories.push(canadianNewsStories[i]);
      if (i < internationalNewsStories.length) allNewsStories.push(internationalNewsStories[i]);
    }

    const maxLen = Math.max(papers.length, allNewsStories.length);
    const merged: Array<ArticleProps | NewsStory> = [];
    for (let i = 0; i < maxLen; i++) {
      if (i < papers.length) merged.push(papers[i]);
      if (i < allNewsStories.length) merged.push(allNewsStories[i]);
    }

    return merged;
  };

  return {
    papers,
    newsStories,
    canadianNewsStories,
    internationalNewsStories,
    refreshing,
    seenArticles,
    previousIndex,
    isLoading,
    fetchPapers,
    fetchGroundNewsStories,
    fetchCanadianNewsStories,
    fetchInternationalNewsStories,
    loadSeenArticles,
    saveSeenArticles,
    handleSwipeAway,
    loadAllData,
    onRefresh,
    interleaveItems,
    setPreviousIndex
  };
}