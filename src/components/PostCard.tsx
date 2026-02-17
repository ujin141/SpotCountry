"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { MessageSquare, Heart, Send, HelpCircle, Users, CheckCircle, ExternalLink, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Post {
  id: number;
  content: string;
  reporter: string;
  country: string;
  created_at: string;
  likes: number;
  comments_count: number;
  type?: string; 
  author_avatar_url?: string | null;
  user_id?: string | null;
  image_url?: string | null; // Added post image
}

export default function PostCard({ post }: { post: Post }) {
  const [likes, setLikes] = useState(post.likes || 0);
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    checkUserAndLikeStatus();
  }, []);

  const checkUserAndLikeStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    if (user) {
        const { count } = await supabase
            .from('post_likes')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('post_id', post.id);
        
        if (count && count > 0) {
            setLiked(true);
        }
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
        if(confirm("Please login to like this post.")) window.location.href = "/login";
        return;
    }
    if (likeLoading) return;

    setLikeLoading(true);
    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikes(prev => newLikedState ? prev + 1 : prev - 1);

    if (newLikedState) {
        const { error } = await supabase.from('post_likes').insert({ user_id: currentUser.id, post_id: post.id });
        if (!error) await supabase.from('reports').update({ likes: likes + 1 }).eq('id', post.id);
        else { setLiked(!newLikedState); setLikes(prev => prev - 1); }
    } else {
        const { error } = await supabase.from('post_likes').delete().eq('user_id', currentUser.id).eq('post_id', post.id);
        if (!error) await supabase.from('reports').update({ likes: likes - 1 }).eq('id', post.id);
        else { setLiked(!newLikedState); setLikes(prev => prev + 1); }
    }
    setLikeLoading(false);
  };

  const handleDeletePost = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    setIsDeleting(true);
    const { error } = await supabase.from('reports').delete().eq('id', post.id);
    if (!error) setIsDeleted(true);
    else { alert("Failed to delete post."); setIsDeleting(false); }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("Delete this comment?")) return;
    const { error } = await supabase.from('reports').delete().eq('id', commentId);
    if (!error) {
        setComments(comments.filter(c => c.id !== commentId));
        setCommentsCount(prev => prev - 1);
        await supabase.from('reports').update({ comments_count: commentsCount - 1 }).eq('id', post.id);
    } else alert("Failed to delete comment.");
  };

  const toggleComments = async () => {
    setShowComments(!showComments);
    if (!showComments && comments.length === 0) {
      const { data } = await supabase
        .from('reports')
        .select('*')
        .eq('parent_id', post.id)
        .order('created_at', { ascending: true });
      if (data) setComments(data);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    const reporterName = currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || "Anonymous";
    const avatarUrl = currentUser?.user_metadata?.avatar_url || null;

    const comment = {
      content: newComment, 
      reporter: reporterName, 
      type: "comment", 
      parent_id: post.id, 
      country: post.country, 
      status: "approved", 
      created_at: new Date().toISOString(),
      author_avatar_url: avatarUrl,
      user_id: currentUser?.id
    };

    const tempId = Date.now();
    setComments([...comments, { ...comment, id: tempId }]);
    setNewComment("");
    setCommentsCount(prev => prev + 1);

    const { data } = await supabase.from('reports').insert(comment).select();
    if (data && data[0]) setComments(prev => prev.map(c => c.id === tempId ? data[0] : c));
    await supabase.from('reports').update({ comments_count: commentsCount + 1 }).eq('id', post.id);
  };

  const getTypeBadge = () => {
    if (post.type === 'qna') return <span className="flex items-center gap-1 bg-yellow-100 text-yellow-800 text-[10px] px-1.5 py-0.5 rounded font-bold"><HelpCircle className="w-3 h-3"/> Q&A</span>;
    if (post.type === 'buddy') return <span className="flex items-center gap-1 bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5 rounded font-bold"><Users className="w-3 h-3"/> Buddy</span>;
    if (post.type === 'tip') return <span className="flex items-center gap-1 bg-purple-100 text-purple-800 text-[10px] px-1.5 py-0.5 rounded font-bold"><CheckCircle className="w-3 h-3"/> Tip</span>;
    return null;
  };

  const showBookingCTA = () => {
    if (!post.content) return false;
    const keywords = ["hotel", "stay", "flight", "tour", "booking", "klook", "pass", "ticket", "hostel", "resort"];
    const text = post.content.toLowerCase();
    return keywords.some(k => text.includes(k));
  };

  if (isDeleted) return null;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-primary/30 transition-all relative group">
      
      {/* Delete Button */}
      {currentUser && post.user_id === currentUser.id && (
        <button 
            onClick={handleDeletePost}
            className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100 z-10"
            disabled={isDeleting}
            title="Delete Post"
        >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      )}

      <div className="flex items-center gap-2 mb-3 pr-8">
        {post.author_avatar_url ? (
            <Image 
                src={post.author_avatar_url} 
                alt={post.reporter} 
                width={32} 
                height={32}
                className="rounded-full object-cover border border-gray-200" 
            />
        ) : (
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">{post.reporter?.charAt(0) || 'U'}</div>
        )}
        
        <div className="flex flex-col">
            <span className="font-medium text-sm flex items-center gap-1">
            {post.reporter}
            {getTypeBadge()}
            </span>
            <div className="flex items-center gap-1">
                {post.country && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{post.country}</span>}
                <span className="text-[10px] text-gray-400">{new Date(post.created_at).toLocaleDateString()}</span>
            </div>
        </div>
      </div>
      
      <p className="text-gray-700 text-sm mb-3 whitespace-pre-line">{post.content}</p>

      {/* Post Image Display */}
      {post.image_url && (
        <div className="mb-3 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 flex justify-center">
            <img 
                src={post.image_url} 
                alt="Post Image" 
                className="max-w-full max-h-96 w-auto h-auto object-contain"
                loading="lazy" 
            />
        </div>
      )}

      {showBookingCTA() && (
        <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-100 flex items-center justify-between">
            <div className="text-xs text-blue-800"><span className="font-bold">Recommended:</span> Check prices for this trip?</div>
            <a href="https://www.booking.com" target="_blank" rel="noreferrer" className="text-xs bg-blue-600 text-white px-3 py-1 rounded font-bold hover:bg-blue-700 transition-colors flex items-center gap-1">
                Book Now <ExternalLink className="w-3 h-3" />
            </a>
        </div>
      )}
      
      <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-50">
        <button onClick={handleLike} disabled={likeLoading} className={`flex items-center gap-1 transition-colors ${liked ? "text-red-500 font-bold" : "hover:text-red-500"}`}>
          <Heart className={`w-4 h-4 ${liked ? "fill-red-500" : ""}`} /> {likes}
        </button>
        <button onClick={toggleComments} className="flex items-center gap-1 hover:text-blue-500 transition-colors">
          <MessageSquare className="w-4 h-4" /> {commentsCount}
        </button>
      </div>

      {showComments && (
        <div className="mt-3 pl-4 border-l-2 border-gray-100 space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="text-xs group/comment relative">
              <div className="flex items-center gap-2 mb-1">
                {c.author_avatar_url ? (
                    <Image 
                        src={c.author_avatar_url} 
                        alt={c.reporter} 
                        width={20} 
                        height={20}
                        className="rounded-full object-cover border border-gray-200" 
                    />
                ) : (
                    <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-500">{c.reporter?.charAt(0) || 'U'}</div>
                )}
                <span className="font-bold text-gray-700">{c.reporter}</span>
                <span className="text-gray-400 text-[10px]">{new Date(c.created_at).toLocaleDateString()}</span>
                {currentUser && c.user_id === currentUser.id && (
                    <button onClick={() => handleDeleteComment(c.id)} className="ml-auto text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover/comment:opacity-100 transition-opacity" title="Delete Comment">
                        <Trash2 className="w-3 h-3" />
                    </button>
                )}
              </div>
              <p className="text-gray-600 ml-7">{c.content}</p>
            </div>
          ))}
          <form onSubmit={submitComment} className="flex items-center gap-2 mt-2">
             {currentUser?.user_metadata?.avatar_url ? (
                <Image 
                    src={currentUser.user_metadata.avatar_url} 
                    alt="Current User" 
                    width={24} 
                    height={24}
                    className="rounded-full border border-gray-200 object-cover" 
                />
             ) : (
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-400"><Users className="w-3 h-3" /></div>
             )}
            <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a comment..." className="flex-1 bg-gray-50 border border-gray-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-primary" />
            <button type="submit" disabled={!newComment.trim()} className="p-1.5 bg-primary text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"><Send className="w-3 h-3" /></button>
          </form>
        </div>
      )}
    </div>
  );
}
