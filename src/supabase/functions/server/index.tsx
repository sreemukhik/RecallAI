import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-97a57743/health", (c) => {
  return c.json({ status: "ok" });
});

// ===========================
// AUTH ENDPOINTS
// ===========================

// Sign up endpoint
app.post("/make-server-97a57743/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name: name || email.split('@')[0] },
      // Automatically confirm the user's email since an email server hasn't been configured
      email_confirm: true
    });

    if (error) {
      console.log(`Auth error during user signup: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ user: data.user });
  } catch (error) {
    console.log(`Server error during signup: ${error}`);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

// ===========================
// MEMORY ENDPOINTS
// ===========================

// Get all memories for a user
app.get("/make-server-97a57743/memories", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const memories = await kv.getByPrefix(`memory:${user.id}:`);
    
    // Sort by created date, newest first
    const sortedMemories = memories
      .map(m => JSON.parse(m))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return c.json({ memories: sortedMemories });
  } catch (error) {
    console.log(`Error fetching memories: ${error}`);
    return c.json({ error: 'Failed to fetch memories' }, 500);
  }
});

// Create a new memory
app.post("/make-server-97a57743/memories", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { content, tags, title } = await c.req.json();
    
    if (!content) {
      return c.json({ error: 'Content is required' }, 400);
    }

    // Create memory object
    const memoryId = crypto.randomUUID();
    const memory = {
      id: memoryId,
      userId: user.id,
      title: title || content.substring(0, 50) + (content.length > 50 ? '...' : ''),
      content,
      tags: tags || [],
      createdAt: new Date().toISOString(),
      chunks: Math.ceil(content.length / 500), // Simulate chunking
    };

    // Store in KV
    await kv.set(`memory:${user.id}:${memoryId}`, JSON.stringify(memory));

    // Update user stats
    const statsKey = `stats:${user.id}`;
    const existingStats = await kv.get(statsKey);
    const stats = existingStats ? JSON.parse(existingStats) : { totalMemories: 0, lastUpload: null, storageBytes: 0 };
    
    stats.totalMemories += 1;
    stats.lastUpload = new Date().toISOString();
    stats.storageBytes += content.length;
    
    await kv.set(statsKey, JSON.stringify(stats));

    return c.json({ memory, message: 'Memory created successfully' });
  } catch (error) {
    console.log(`Error creating memory: ${error}`);
    return c.json({ error: 'Failed to create memory' }, 500);
  }
});

// Delete a memory
app.delete("/make-server-97a57743/memories/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const memoryId = c.req.param('id');
    const memoryKey = `memory:${user.id}:${memoryId}`;
    
    // Get memory to update stats
    const memoryData = await kv.get(memoryKey);
    if (!memoryData) {
      return c.json({ error: 'Memory not found' }, 404);
    }

    const memory = JSON.parse(memoryData);
    
    // Delete memory
    await kv.del(memoryKey);

    // Update stats
    const statsKey = `stats:${user.id}`;
    const existingStats = await kv.get(statsKey);
    if (existingStats) {
      const stats = JSON.parse(existingStats);
      stats.totalMemories = Math.max(0, stats.totalMemories - 1);
      stats.storageBytes = Math.max(0, stats.storageBytes - memory.content.length);
      await kv.set(statsKey, JSON.stringify(stats));
    }

    return c.json({ message: 'Memory deleted successfully' });
  } catch (error) {
    console.log(`Error deleting memory: ${error}`);
    return c.json({ error: 'Failed to delete memory' }, 500);
  }
});

// Delete all memories for a user
app.delete("/make-server-97a57743/memories", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get all memory keys for this user
    const memories = await kv.getByPrefix(`memory:${user.id}:`);
    
    // Delete each memory
    const deletePromises = memories.map(async (memoryData) => {
      const memory = JSON.parse(memoryData);
      await kv.del(`memory:${user.id}:${memory.id}`);
    });
    
    await Promise.all(deletePromises);

    // Reset stats
    const statsKey = `stats:${user.id}`;
    await kv.set(statsKey, JSON.stringify({ totalMemories: 0, lastUpload: null, storageBytes: 0 }));

    return c.json({ message: 'All memories deleted successfully' });
  } catch (error) {
    console.log(`Error deleting all memories: ${error}`);
    return c.json({ error: 'Failed to delete memories' }, 500);
  }
});

// ===========================
// QUERY ENDPOINT
// ===========================

// Query memories with natural language
app.post("/make-server-97a57743/query", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { query } = await c.req.json();
    
    if (!query) {
      return c.json({ error: 'Query is required' }, 400);
    }

    // Get all user memories
    const memories = await kv.getByPrefix(`memory:${user.id}:`);
    const parsedMemories = memories.map(m => JSON.parse(m));

    // Simple keyword-based search (in production, use vector embeddings)
    const queryLower = query.toLowerCase();
    const relevantMemories = parsedMemories
      .map(memory => {
        const contentLower = memory.content.toLowerCase();
        const titleLower = memory.title.toLowerCase();
        
        // Calculate simple relevance score
        const titleMatch = titleLower.includes(queryLower) ? 10 : 0;
        const contentMatch = contentLower.includes(queryLower) ? 5 : 0;
        
        // Check for individual words
        const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
        const wordMatches = queryWords.reduce((score, word) => {
          return score + (contentLower.includes(word) ? 1 : 0);
        }, 0);
        
        const relevanceScore = titleMatch + contentMatch + wordMatches;
        
        // Extract snippet around match
        let snippet = memory.content.substring(0, 200);
        const matchIndex = contentLower.indexOf(queryLower);
        if (matchIndex > 0) {
          const start = Math.max(0, matchIndex - 50);
          snippet = '...' + memory.content.substring(start, matchIndex + queryLower.length + 100);
        }
        
        return {
          memory,
          relevanceScore,
          snippet: snippet + (snippet.length < memory.content.length ? '...' : '')
        };
      })
      .filter(m => m.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5); // Top 5 results

    // Generate AI response (simulated)
    let answer = '';
    if (relevantMemories.length === 0) {
      answer = "I couldn't find any relevant information in your stored memories. Try uploading more data or rephrasing your query.";
    } else {
      answer = `Based on your stored memories, here's what I found: ${relevantMemories[0].snippet}`;
      if (relevantMemories.length > 1) {
        answer += ` I also found ${relevantMemories.length - 1} other relevant memories that might help answer your question.`;
      }
    }

    return c.json({
      answer,
      sources: relevantMemories.map(rm => ({
        memoryId: rm.memory.id,
        title: rm.memory.title,
        snippet: rm.snippet,
        tags: rm.memory.tags,
        createdAt: rm.memory.createdAt
      })),
      sourcesCount: relevantMemories.length
    });
  } catch (error) {
    console.log(`Error processing query: ${error}`);
    return c.json({ error: 'Failed to process query' }, 500);
  }
});

// ===========================
// STATS ENDPOINT
// ===========================

// Get user statistics
app.get("/make-server-97a57743/stats", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const statsKey = `stats:${user.id}`;
    const statsData = await kv.get(statsKey);
    
    const stats = statsData 
      ? JSON.parse(statsData)
      : { totalMemories: 0, lastUpload: null, storageBytes: 0 };

    return c.json({ stats });
  } catch (error) {
    console.log(`Error fetching stats: ${error}`);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

Deno.serve(app.fetch);