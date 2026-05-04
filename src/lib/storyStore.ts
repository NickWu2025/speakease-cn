import { Story } from "@/types/story";

function key(userId: string) {
  return `speakflow_stories_${userId}`;
}

export function loadStories(userId: string): Story[] {
  try {
    return JSON.parse(localStorage.getItem(key(userId)) ?? "[]") as Story[];
  } catch {
    return [];
  }
}

function persist(userId: string, stories: Story[]) {
  localStorage.setItem(key(userId), JSON.stringify(stories));
}

export function saveStory(userId: string, story: Story): void {
  const stories = loadStories(userId);
  const idx = stories.findIndex((s) => s.id === story.id);
  if (idx >= 0) stories[idx] = story;
  else stories.unshift(story);
  persist(userId, stories);
}

export function deleteStory(userId: string, storyId: string): void {
  persist(userId, loadStories(userId).filter((s) => s.id !== storyId));
}
