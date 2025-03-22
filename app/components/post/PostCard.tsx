"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { HeartIcon, ChatBubbleLeftIcon, ShareIcon, UserPlusIcon, UserMinusIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid, ShareIcon as ShareIconSolid, ChatBubbleLeftIcon as ChatBubbleLeftIconSolid } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string | null;
  image: string | null;
};

type Post = {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  user: User;
  _count?: {
    likes: number;
    comments: number;
    shares?: number;
  };
};

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user: User;
};

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [shared, setShared] = useState(false);
  const [likeCount, setLikeCount] = useState(post._count?.likes || 0);
  const [shareCount, setShareCount] = useState(post._count?.shares || 0);
  const [commentCount, setCommentCount] = useState(post._count?.comments || 0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);
  const [isCheckingFollow, setIsCheckingFollow] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);
  
  // Check if the current user is following the post author
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!session?.user?.id || session.user.id === post.user.id) {
        setIsCheckingFollow(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/follow/check?targetUserId=${post.user.id}`);
        if (response.ok) {
          const data = await response.json();
          setIsFollowing(data.isFollowing);
        }
      } catch (error) {
        console.error("Error checking follow status:", error);
      } finally {
        setIsCheckingFollow(false);
      }
    };
    
    checkFollowStatus();
  }, [session, post.user.id]);
  
  // Check like status and count when component mounts
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/posts/like?postId=${post.id}`);
        if (response.ok) {
          const data = await response.json();
          setLiked(data.isLiked);
          setLikeCount(data.likeCount);
        }
      } catch (error) {
        console.error("Error checking like status:", error);
      }
    };
    
    checkLikeStatus();
  }, [post.id, session?.user?.id]);
  
  // Check share status and count when component mounts
  useEffect(() => {
    const checkShareStatus = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/posts/share?postId=${post.id}`);
        if (response.ok) {
          const data = await response.json();
          setShared(data.isShared);
          setShareCount(data.shareCount);
        }
      } catch (error) {
        console.error("Error checking share status:", error);
      }
    };
    
    checkShareStatus();
  }, [post.id, session?.user?.id]);
  
  // Load comments when the comment section is opened
  useEffect(() => {
    if (!showComments) return;
    
    const loadComments = async () => {
      try {
        const response = await fetch(`/api/posts/comment?postId=${post.id}`);
        if (response.ok) {
          const data = await response.json();
          setComments(data);
        }
      } catch (error) {
        console.error("Error loading comments:", error);
      }
    };
    
    loadComments();
  }, [post.id, showComments]);
  
  const handleLike = async () => {
    if (!session?.user) {
      router.push('/login');
      return;
    }
    
    // Store current state before updating
    const wasLiked = liked;
    
    // Optimistic UI update
    setLiked(prevLiked => !prevLiked);
    setLikeCount(prevCount => wasLiked ? prevCount - 1 : prevCount + 1);
    
    try {
      const response = await fetch('/api/posts/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId: post.id }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update state based on actual server response
        setLiked(data.liked);
      } else {
        // Revert optimistic update on failure
        setLiked(wasLiked);
        setLikeCount(prevCount => wasLiked ? prevCount + 1 : prevCount - 1);
        console.error('Failed to like/unlike post');
      }
    } catch (error) {
      // Revert optimistic update on error
      setLiked(wasLiked);
      setLikeCount(prevCount => wasLiked ? prevCount + 1 : prevCount - 1);
      console.error('Error liking/unliking post:', error);
    }
  };
  
  const handleShare = async () => {
    if (!session?.user) {
      router.push('/login');
      return;
    }
    
    // Store current state before updating
    const wasShared = shared;
    
    // Optimistic UI update
    setShared(prevShared => !prevShared);
    setShareCount(prevCount => wasShared ? prevCount - 1 : prevCount + 1);
    
    try {
      const response = await fetch('/api/posts/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId: post.id }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update state based on actual server response
        setShared(data.shared);
      } else {
        // Revert optimistic update on failure
        setShared(wasShared);
        setShareCount(prevCount => wasShared ? prevCount + 1 : prevCount - 1);
        console.error('Failed to share/unshare post');
      }
    } catch (error) {
      // Revert optimistic update on error
      setShared(wasShared);
      setShareCount(prevCount => wasShared ? prevCount + 1 : prevCount - 1);
      console.error('Error sharing/unsharing post:', error);
    }
  };
  
  const handleComment = () => {
    setShowComments(!showComments);
    if (!showComments && commentInputRef.current) {
      setTimeout(() => {
        commentInputRef.current?.focus();
      }, 100);
    }
  };
  
  const submitComment = async () => {
    if (!session?.user || !newComment.trim()) {
      return;
    }
    
    setIsSubmittingComment(true);
    
    try {
      const response = await fetch('/api/posts/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.id,
          content: newComment.trim(),
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Add the new comment to the list and increment count
        setComments(prevComments => [data.comment, ...prevComments]);
        setCommentCount(prevCount => prevCount + 1);
        setNewComment('');
      } else {
        console.error('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };
  
  const handleFollowToggle = async () => {
    if (!session?.user) {
      router.push('/login');
      return;
    }
    
    // Don't allow following yourself
    if (session.user.id === post.user.id) {
      return;
    }
    
    setIsLoadingFollow(true);
    
    try {
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId: post.user.id,
          action: isFollowing ? 'unfollow' : 'follow',
        }),
      });
      
      if (response.ok) {
        setIsFollowing(!isFollowing);
      } else {
        console.error('Failed to follow/unfollow user');
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
    } finally {
      setIsLoadingFollow(false);
    }
  };
  
  return (
    <div className="backdrop-blur-md bg-white/70 dark:bg-gray-800/70 rounded-lg shadow-lg border border-white/20 dark:border-gray-700/30 overflow-hidden mb-4 transition-all hover:shadow-xl">
      {/* Post Header - Author Info */}
      <div className="flex items-start p-4">
        <Link href={`/profile/${post.user.id}`} className="shrink-0">
          <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-white/60 dark:border-gray-700/60 shadow-sm">
            {post.user.image ? (
              <Image 
                src={post.user.image} 
                alt={post.user.name || "User"} 
                fill 
                sizes="48px"
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400 text-lg font-bold">
                  {post.user.name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
            )}
          </div>
        </Link>
        
        <div className="ml-3 flex-grow">
          <div className="flex justify-between items-start">
            <div>
              <Link 
                href={`/profile/${post.user.id}`}
                className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
              >
                {post.user.name}
              </Link>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
            
            {session?.user?.id && post.user.id !== session.user.id && (
              <button
                onClick={handleFollowToggle}
                disabled={isLoadingFollow || isCheckingFollow}
                className={`ml-2 flex items-center space-x-1 text-xs px-2 py-1 rounded-full transition-all ${
                  isFollowing
                    ? "bg-gray-200/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-red-100/80 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 border border-gray-200/50 dark:border-gray-700/50"
                    : "bg-blue-100/80 dark:bg-blue-900/30 backdrop-blur-sm text-blue-600 dark:text-blue-400 hover:bg-blue-200/80 dark:hover:bg-blue-800/30 border border-blue-200/50 dark:border-blue-800/50"
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserMinusIcon className="h-3 w-3" />
                    <span>Unfollow</span>
                  </>
                ) : (
                  <>
                    <UserPlusIcon className="h-3 w-3" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">{post.content}</p>
      </div>
      
      {/* Post Image */}
      {post.imageUrl && (
        <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-900 overflow-hidden">
          <Image
            src={post.imageUrl}
            alt="Post image"
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>
      )}
      
      {/* Post Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 dark:border-gray-700/30">
        <button 
          onClick={handleLike}
          className={`flex items-center space-x-1 px-2 py-1 rounded-md ${
            liked 
              ? "text-red-600 dark:text-red-500" 
              : "text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500"
          } transition-colors hover:bg-white/10 hover:backdrop-blur-sm dark:hover:bg-gray-700/30`}
        >
          {liked ? <HeartIconSolid className="h-5 w-5" /> : <HeartIcon className="h-5 w-5" />}
          <span className="text-sm">{likeCount}</span>
        </button>
        
        <button 
          onClick={() => {
            setShowComments(!showComments);
            if (!showComments && commentInputRef.current) {
              setTimeout(() => commentInputRef.current?.focus(), 100);
            }
          }}
          className={`flex items-center space-x-1 px-2 py-1 rounded-md ${
            showComments 
              ? "text-blue-600 dark:text-blue-500" 
              : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500"
          } transition-colors hover:bg-white/10 hover:backdrop-blur-sm dark:hover:bg-gray-700/30`}
        >
          {showComments ? <ChatBubbleLeftIconSolid className="h-5 w-5" /> : <ChatBubbleLeftIcon className="h-5 w-5" />}
          <span className="text-sm">{commentCount}</span>
        </button>
        
        <button 
          onClick={handleShare}
          className={`flex items-center space-x-1 px-2 py-1 rounded-md ${
            shared 
              ? "text-green-600 dark:text-green-500" 
              : "text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500"
          } transition-colors hover:bg-white/10 hover:backdrop-blur-sm dark:hover:bg-gray-700/30`}
        >
          {shared ? <ShareIconSolid className="h-5 w-5" /> : <ShareIcon className="h-5 w-5" />}
          <span className="text-sm">{shareCount}</span>
        </button>
      </div>
      
      {/* Comments Section */}
      {showComments && (
        <div className="px-4 pb-4 space-y-4 backdrop-blur-sm bg-white/20 dark:bg-gray-900/20 border-t border-white/10 dark:border-gray-700/30">
          {/* Comment Form */}
          <form onSubmit={submitComment} className="flex items-center mt-3">
            <input
              ref={commentInputRef}
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-grow px-3 py-2 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm border border-white/30 dark:border-gray-700/50 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-400"
              disabled={isSubmittingComment || !session?.user}
            />
            <button
              type="submit"
              disabled={isSubmittingComment || !newComment.trim() || !session?.user}
              className="bg-blue-600/80 backdrop-blur-sm hover:bg-blue-700/80 text-white px-4 py-2 rounded-r-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-blue-400/30"
            >
              Post
            </button>
          </form>
          
          {/* Comments List */}
          <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex items-start">
                  <Link href={`/profile/${comment.user.id}`} className="shrink-0">
                    <div className="relative h-8 w-8 rounded-full overflow-hidden border border-white/40 dark:border-gray-700/40">
                      {comment.user.image ? (
                        <Image 
                          src={comment.user.image} 
                          alt={comment.user.name || "User"} 
                          fill 
                          sizes="32px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-gray-500 dark:text-gray-400 text-xs font-bold">
                            {comment.user.name?.charAt(0).toUpperCase() || "U"}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="ml-2 flex-grow bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-md p-2 border border-white/20 dark:border-gray-700/30">
                    <div className="flex justify-between items-baseline">
                      <Link 
                        href={`/profile/${comment.user.id}`}
                        className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-sm"
                      >
                        {comment.user.name}
                      </Link>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-gray-800 dark:text-gray-200 text-sm mt-1">{comment.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-2">No comments yet. Be the first to comment!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 