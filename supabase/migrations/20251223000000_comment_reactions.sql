-- Comment reactions table (fist bumps on comments)
CREATE TABLE comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id) -- One reaction per user per comment
);

-- Indexes for performance
CREATE INDEX idx_comment_reactions_comment_id ON comment_reactions(comment_id);
CREATE INDEX idx_comment_reactions_user_id ON comment_reactions(user_id);

-- Enable RLS
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comment reactions
-- Users can read reactions on comments they can see
CREATE POLICY "Users can read reactions on visible comments" ON comment_reactions
  FOR SELECT USING (
    comment_id IN (
      SELECT id FROM comments WHERE
        workout_id IN (
          SELECT id FROM workouts WHERE
            user_id = auth.uid() OR
            (privacy = 'public' AND user_id IN (
              SELECT following_id FROM follows WHERE follower_id = auth.uid()
            ))
        )
    )
  );

-- Users can insert reactions on visible comments
CREATE POLICY "Users can insert reactions on visible comments" ON comment_reactions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    comment_id IN (
      SELECT id FROM comments WHERE
        workout_id IN (
          SELECT id FROM workouts WHERE
            user_id = auth.uid() OR
            (privacy = 'public' AND user_id IN (
              SELECT following_id FROM follows WHERE follower_id = auth.uid()
            ))
        )
    )
  );

-- Users can delete their own reactions
CREATE POLICY "Users can delete own comment reactions" ON comment_reactions
  FOR DELETE USING (auth.uid() = user_id);

