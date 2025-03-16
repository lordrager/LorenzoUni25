// class/NewsRecommendation.tsx
import { 
    collection, query, where, getDocs, orderBy, limit, 
    updateDoc, doc, arrayUnion, increment, getDoc
  } from "firebase/firestore";
  import { db } from "../app/firebaseConfig";
  
  export interface NewsWeight {
    tag: string;
    weight: number;
  }
  
  /**
   * Class for handling news recommendations based on user preferences and behavior
   */
  export class NewsRecommendation {
    /**
     * Get personalized news recommendations for a user
     * 
     * @param uid User ID to get recommendations for
     * @param maxResults Maximum number of results to return (default 10)
     * @returns Array of news articles
     */
    static async getPersonalizedNews(uid: string, maxResults: number = 10) {
      try {
        // Get user data including tags, liked/disliked news
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          console.error("User does not exist");
          return [];
        }
        
        const userData = userSnap.data();
        
        // Get user's preferred tags
        let userTags = userData.tags || [];
        
        // Get user's tag weights (or initialize if not exists)
        let tagWeights = userData.tagWeights || this.initializeTagWeights(userTags);
        
        // Get user's watched news to filter them out
        const watchedNews = userData.watched_news || [];
        
        // Sort tags by weight to prioritize
        const sortedTags = this.sortTagsByWeight(tagWeights);
        
        // Build query to get news with weighted tags
        const newsQuery = await this.buildNewsQuery(sortedTags, watchedNews, maxResults);
        
        // If insufficient results, get more news with any tags
        if (newsQuery.length < maxResults) {
          const additionalNews = await this.getAdditionalNews(
            userTags, 
            watchedNews, 
            maxResults - newsQuery.length
          );
          
          // Combine results, ensuring no duplicates
          const combinedNews = [
            ...newsQuery,
            ...additionalNews.filter(
              (news) => !newsQuery.some((existing) => existing.id === news.id)
            ),
          ];
          
          return combinedNews;
        }
        
        return newsQuery;
      } catch (error) {
        console.error("Error getting personalized news:", error);
        return [];
      }
    }
    
    /**
     * Process user interaction with a news article to update their preferences
     * 
     * @param uid User ID
     * @param newsId News article ID
     * @param interaction Type of interaction ('like' or 'dislike')
     * @returns Success status
     */
    static async processNewsInteraction(uid: string, newsId: string, interaction: 'like' | 'dislike') {
      try {
        // Get the news article to access its tags
        const newsRef = doc(db, "news", newsId);
        const newsSnap = await getDoc(newsRef);
        
        if (!newsSnap.exists()) {
          console.error("News does not exist");
          return false;
        }
        
        const newsData = newsSnap.data();
        const newsTags = newsData.tags || [];
        
        // Get current user data
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          console.error("User does not exist");
          return false;
        }
        
        const userData = userSnap.data();
        
        // Get or initialize tag weights
        let tagWeights = userData.tagWeights || this.initializeTagWeights(userData.tags || []);
        
        // Update weights based on interaction
        const updatedWeights = this.updateTagWeights(tagWeights, newsTags, interaction);
        
        // Update user's tag weights in database
        await updateDoc(userRef, { tagWeights: updatedWeights });
        
        // Record the interaction (already handled by addLikedNews/addDislikedNews functions)
        
        return true;
      } catch (error) {
        console.error("Error processing news interaction:", error);
        return false;
      }
    }
    
    /**
     * Initialize tag weights for a new user
     * 
     * @param tags Array of user's preferred tags
     * @returns Array of tag weights
     */
    static initializeTagWeights(tags: string[]): NewsWeight[] {
      return tags.map(tag => ({
        tag,
        weight: 1.0 // Initial weight (neutral)
      }));
    }
    
    /**
     * Sort tags by their weight in descending order
     * 
     * @param tagWeights Array of tag weights
     * @returns Sorted array of tag weights
     */
    static sortTagsByWeight(tagWeights: NewsWeight[]): NewsWeight[] {
      return [...tagWeights].sort((a, b) => b.weight - a.weight);
    }
    
    /**
     * Update tag weights based on user interaction
     * 
     * @param currentWeights Current tag weights
     * @param interactionTags Tags from the article the user interacted with
     * @param interaction Type of interaction ('like' or 'dislike')
     * @returns Updated tag weights
     */
    static updateTagWeights(
      currentWeights: NewsWeight[], 
      interactionTags: string[], 
      interaction: 'like' | 'dislike'
    ): NewsWeight[] {
      const weightDelta = interaction === 'like' ? 0.1 : -0.1;
      const updatedWeights = [...currentWeights];
      
      // Go through each tag in the article
      interactionTags.forEach(tag => {
        // Find if tag already exists in weights
        const existingIndex = updatedWeights.findIndex(w => w.tag === tag);
        
        if (existingIndex >= 0) {
          // Update existing tag weight
          updatedWeights[existingIndex].weight = Math.max(
            0.1, // Minimum weight
            Math.min(2.0, updatedWeights[existingIndex].weight + weightDelta) // Maximum weight
          );
        } else {
          // If tag doesn't exist in user's weights yet, add it with appropriate weight
          // For likes, start above neutral; for dislikes, start below neutral
          updatedWeights.push({
            tag,
            weight: interaction === 'like' ? 1.1 : 0.9
          });
        }
      });
      
      return updatedWeights;
    }
    
    /**
     * Build a query to get news with weighted tags
     * 
     * @param sortedTags Sorted array of tag weights
     * @param watchedNews Array of already watched news IDs
     * @param maxResults Maximum number of results
     * @returns Array of news articles
     */
    static async buildNewsQuery(
      sortedTags: NewsWeight[], 
      watchedNews: string[],
      maxResults: number
    ) {
      let allResults = [];
      let remainingResults = maxResults;
      
      // Iterate through tags based on weight priority
      for (const { tag, weight } of sortedTags) {
        if (remainingResults <= 0) break;
        
        // Calculate how many articles to get for this tag based on its weight
        // Higher weight = more articles
        const tagQueryLimit = Math.ceil(remainingResults * Math.min(1, weight));
        
        // Query for news with this tag
        const newsRef = collection(db, "news");
        const tagQuery = query(
          newsRef,
          where("tags", "array-contains", tag),
          orderBy("date", "desc"), // Most recent first
          limit(tagQueryLimit + watchedNews.length) // Get extra to account for filtering
        );
        
        const querySnapshot = await getDocs(tagQuery);
        
        // Filter out already watched news and merge with results
        const tagResults = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(news => !watchedNews.includes(news.id) && 
                         !allResults.some(existing => existing.id === news.id));
        
        allResults = [...allResults, ...tagResults.slice(0, remainingResults)];
        remainingResults = maxResults - allResults.length;
      }
      
      return allResults;
    }
    
    /**
     * Get additional news articles when preferred tags don't yield enough results
     * 
     * @param userTags User's preferred tags
     * @param watchedNews Array of already watched news IDs
     * @param limit Maximum number of results
     * @returns Array of news articles
     */
    static async getAdditionalNews(userTags: string[], watchedNews: string[], limit: number) {
      // If no results from weighted tags, get any recent news
      const newsRef = collection(db, "news");
      const fallbackQuery = query(
        newsRef,
        orderBy("date", "desc"),
        limit(limit + watchedNews.length) // Get extra to account for filtering
      );
      
      const querySnapshot = await getDocs(fallbackQuery);
      
      // Filter out already watched news
      return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(news => !watchedNews.includes(news.id))
        .slice(0, limit);
    }
    
    /**
     * Save user's recommendation settings to the database
     * 
     * @param uid User ID
     * @param tagWeights Updated tag weights
     * @returns Success status
     */
    static async saveRecommendationSettings(uid: string, tagWeights: NewsWeight[]) {
      try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, { tagWeights });
        return true;
      } catch (error) {
        console.error("Error saving recommendation settings:", error);
        return false;
      }
    }
  }
  
  export default NewsRecommendation;