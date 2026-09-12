import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listStories from "./tools/list-stories";
import getStory from "./tools/get-story";
import deleteStory from "./tools/delete-story";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "idea-to-animation",
  title: "Idea To Animation",
  version: "0.1.0",
  instructions:
    "Tools for Idea To Animation, a cartoon story maker. Use list_stories to browse the signed-in user's stories, get_story to read a story and its scene narration, and delete_story to remove one.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listStories, getStory, deleteStory],
});
