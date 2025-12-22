import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Comment, getComments, addComment, deleteComment } from '../services/commentService';
import { formatDistanceToNow } from 'date-fns';
import CommentFistBumpButton from './CommentFistBumpButton';

interface CommentsSectionProps {
  workoutId: string;
}

export default function CommentsSection({ workoutId }: CommentsSectionProps) {
  const { isAuthenticated, user: currentUser } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadComments();
    } else {
      setIsLoading(false);
    }
  }, [workoutId, isAuthenticated]);

  const loadComments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const commentsData = await getComments(workoutId);
      setComments(commentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
      console.error('Failed to load comments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const comment = await addComment(workoutId, newComment);
      setComments([...comments, comment]);
      setNewComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
      console.error('Failed to add comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await deleteComment(commentId);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
      console.error('Failed to delete comment:', err);
    }
  };

  const DefaultAvatar = ({ name }: { name?: string }) => (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cf-red to-cf-red-hover flex items-center justify-center border-2 border-gray-200">
      <span className="text-white text-sm font-bold">
        {name?.[0]?.toUpperCase() || '?'}
      </span>
    </div>
  );

  return (
    <div className="border-t border-gray-200 pt-4 mt-4">
      <h3 className="text-lg font-heading font-bold mb-4">Comments</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-cf-red"></div>
          <p className="mt-2 text-sm text-gray-600">Loading comments...</p>
        </div>
      ) : comments.length === 0 ? (
        <p className="text-gray-600 text-sm mb-6">No comments yet. Be the first to comment!</p>
      ) : (
        <div className="space-y-4 mb-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start space-x-3">
              {comment.user?.picture ? (
                <img
                  src={comment.user.picture}
                  alt={comment.user.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                />
              ) : (
                <DefaultAvatar name={comment.user?.name} />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-semibold text-sm text-black">
                    {comment.user?.name || 'Unknown User'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    {comment.edited && ' (edited)'}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words mb-2">
                  {comment.text}
                </p>
                <div className="flex items-center space-x-3">
                  <CommentFistBumpButton commentId={comment.id} />
                  {currentUser?.id === comment.userId && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment Input - Moved to bottom */}
      {isAuthenticated && (
        <form onSubmit={handleSubmit} className="border-t border-gray-200 pt-4">
          <div className="flex items-start space-x-3">
            {currentUser?.picture ? (
              <img
                src={currentUser.picture}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
              />
            ) : (
              <DefaultAvatar name={currentUser?.name} />
            )}
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:border-cf-red outline-none resize-none"
                disabled={isSubmitting}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className="bg-cf-red text-white px-4 py-2 rounded font-semibold uppercase tracking-wider hover:bg-cf-red-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm min-h-[44px]"
                >
                  {isSubmitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

