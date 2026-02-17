"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Users, HelpCircle, Map, Star, Loader2, Plus, X, PenTool, CheckCircle, Ticket, Send, Camera, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import PostCard from "@/components/PostCard";
import Link from "next/link";

export default function CountryTabs({ countryName }: { countryName: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("latest");
  const [posts, setPosts] = useState<any[]>([]);
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);

  // Write Modal State
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostType, setNewPostType] = useState("post");
  const [newPostName, setNewPostName] = useState("");
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Simple Cache
  const cache = useRef<Record<string, any[]>>({});

  useEffect(() => {
    checkUser();
    fetchData();
  }, [countryName, activeTab]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
        if (user.user_metadata?.full_name) {
            setNewPostName(user.user_metadata.full_name);
        } else if (user.email) {
            setNewPostName(user.email.split('@')[0]);
        }
        
        const { data: profile } = await supabase.from('profiles').select('id, name, avatar_url, is_verified').eq('id', user.id).maybeSingle();
        if (profile) {
            setIsVerified(profile.is_verified || false);
            // Sync user metadata for new posts
            setUser({
                ...user,
                user_metadata: {
                    ...user.user_metadata,
                    full_name: profile.name,
                    avatar_url: profile.avatar_url
                }
            });
            setNewPostName(profile.name || (user.email ? user.email.split('@')[0] : 'User'));
        }
    }
  };

  const fetchData = async (forceRefresh = false) => {
    setLoading(true);
    
    const cacheKey = `${countryName}-${activeTab}`;
    if (!forceRefresh && cache.current[cacheKey]) {
        if (activeTab === 'tours') setTours(cache.current[cacheKey]);
        else setPosts(cache.current[cacheKey]);
        setLoading(false);
        return;
    }

    let typeFilter = 'post';
    if (activeTab === 'qna') typeFilter = 'qna';
    if (activeTab === 'buddies') typeFilter = 'buddy';
    if (activeTab === 'tips') typeFilter = 'tip';

    if (activeTab === 'tours') {
        const { data: toursData } = await supabase
        .from('tours')
        .select('*')
        .eq('status', 'approved')
        .ilike('location', `%${countryName}%`)
        .order('created_at', { ascending: false })
        .limit(6);
        if (toursData) {
            setTours(toursData);
            cache.current[cacheKey] = toursData;
        }
    } else {
        let query = supabase
        .from('reports')
        .select('*')
        .eq('type', typeFilter)
        .order('created_at', { ascending: false })
        .limit(20);
        
        if (countryName) {
            query = query.eq('country', countryName);
        }

        const { data: postsData } = await query;
        if (postsData) {
            setPosts(postsData);
            cache.current[cacheKey] = postsData;
        }
    }
    setLoading(false);
  };

  const handleWriteClick = () => {
    if (!user) {
        if (confirm("Login is required to post.\nWould you like to go to the login page?")) {
            router.push('/login');
        }
        return;
    }

    if (activeTab === 'buddies') {
        if (!isVerified) {
            alert("Travel Buddies feature is restricted to verified users only.\nPlease verify your identity to proceed.");
            return;
        }
        setNewPostType('buddy');
    }
    else if (activeTab === 'qna') setNewPostType('qna');
    else if (activeTab === 'tips') setNewPostType('tip');
    else setNewPostType('post');
    
    setIsWriteModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setNewPostImage(file);
        setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setNewPostImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() && !newPostImage) return; // Allow image-only posts? Or require text. Let's require text or image.
    if (!newPostName.trim()) return;
    
    setIsSubmitting(true);
    
    let imageUrl = null;

    // Upload Image if exists
    if (newPostImage) {
        const fileExt = newPostImage.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('posts')
            .upload(filePath, newPostImage);

        if (uploadError) {
            alert(`Failed to upload image: ${uploadError.message}. Please make sure 'posts' bucket exists.`);
            setIsSubmitting(false);
            return;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('posts')
            .getPublicUrl(filePath);
            
        imageUrl = publicUrl;
    }

    const newPost = {
        type: newPostType,
        content: newPostContent,
        reporter: newPostName,
        country: countryName,
        status: 'approved',
        created_at: new Date().toISOString(),
        likes: 0,
        comments_count: 0,
        author_avatar_url: user?.user_metadata?.avatar_url || null,
        user_id: user?.id,
        image_url: imageUrl // Save image URL
    };

    const { error } = await supabase.from('reports').insert(newPost);
    
    if (!error) {
        setIsWriteModalOpen(false);
        setNewPostContent("");
        setNewPostImage(null);
        setImagePreview(null);
        cache.current = {}; // Invalidate cache on new post
        fetchData(true);
    } else {
        alert("Failed to post. Please try again.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="relative">
      <div className="border-b border-gray-200 overflow-x-auto flex justify-between items-center">
        <nav className="-mb-px flex space-x-8 min-w-max" aria-label="Tabs">
          <button onClick={() => setActiveTab("latest")} className={`${activeTab === "latest" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}>
            <MessageSquare className="w-4 h-4" /> Stories
          </button>
          <button onClick={() => setActiveTab("tips")} className={`${activeTab === "tips" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}>
            <CheckCircle className="w-4 h-4" /> Local Tips
          </button>
          <button onClick={() => setActiveTab("qna")} className={`${activeTab === "qna" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}>
            <HelpCircle className="w-4 h-4" /> Q&A
          </button>
          <button onClick={() => setActiveTab("buddies")} className={`${activeTab === "buddies" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}>
            <Users className="w-4 h-4" /> Travel Buddies
          </button>
          <button onClick={() => setActiveTab("tours")} className={`${activeTab === "tours" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}>
            <Map className="w-4 h-4" /> Local Tours <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">HOT</span>
          </button>
        </nav>

        {activeTab !== 'tours' && (
            <button onClick={handleWriteClick} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-900 transition-colors shadow-sm mb-2 sm:mb-0">
                <PenTool className="w-4 h-4" /> Write
            </button>
        )}
      </div>

      <div className="py-6">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>
        ) : (
          <>
            {activeTab !== "tours" && (
              <div className="space-y-4">
                {posts.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <p className="text-gray-500 mb-2">No posts yet.</p>
                      <button onClick={handleWriteClick} className="text-primary font-medium hover:underline">Be the first to write!</button>
                  </div>
                ) : (
                  posts.map((post) => <PostCard key={post.id} post={post} />)
                )}
              </div>
            )}

            {activeTab === "tours" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tours.length === 0 ? <div className="col-span-2 text-center text-gray-500 py-10">No tours available.</div> : 
                  tours.map((tour) => (
                    <div key={tour.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all">
                      <div className="h-40 bg-gray-200 relative flex items-center justify-center text-gray-400 font-bold overflow-hidden">
                         {tour.image_url ? <img src={tour.image_url} alt={tour.title} className="w-full h-full object-cover" /> : "NO IMAGE"}
                         <span className="absolute top-2 left-2 bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 rounded">{tour.location}</span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 line-clamp-2 mb-2">{tour.title}</h3>
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-xs text-gray-400">Hosted by {tour.host}</span>
                          <span className="font-bold text-lg text-gray-900">{tour.price}</span>
                        </div>
                        <Link href={`/tours/${tour.id}`} className="block w-full text-center mt-3 py-2 bg-gray-50 text-gray-900 text-sm font-medium rounded hover:bg-gray-100 transition-colors">View Details</Link>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </>
        )}
      </div>

      {isWriteModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="bg-primary px-4 py-3 flex justify-between items-center text-white">
                    <h3 className="font-bold flex items-center gap-2"><PenTool className="w-4 h-4" /> Write a Post</h3>
                    <button onClick={() => setIsWriteModalOpen(false)} className="hover:bg-white/20 rounded-full p-1"><X className="w-5 h-5" /></button>
                </div>
                
                <form onSubmit={handleSubmitPost} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <div className="grid grid-cols-4 gap-2">
                            {['post', 'tip', 'qna', 'buddy'].map(t => (
                                <button 
                                    key={t} 
                                    type="button" 
                                    onClick={() => {
                                        if (t === 'buddy' && !isVerified) {
                                            alert("Only verified users can select 'buddy'.");
                                            return;
                                        }
                                        setNewPostType(t);
                                    }} 
                                    className={`py-2 text-xs font-medium rounded border uppercase ${newPostType === t ? 'bg-blue-50 border-primary text-primary' : 'border-gray-200 text-gray-600 hover:bg-gray-50'} ${t === 'buddy' && !isVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {t} {t === 'buddy' && isVerified && <CheckCircle className="inline w-3 h-3 text-blue-500 ml-1"/>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                        <textarea value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-sm h-32 resize-none" placeholder="Share your thoughts..."></textarea>
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                        <div className="flex items-center gap-3">
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleImageChange} 
                                accept="image/*" 
                                className="hidden" 
                            />
                            <button 
                                type="button" 
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                            >
                                <Camera className="w-4 h-4" />
                                Add Photo
                            </button>
                            {imagePreview && (
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    <button type="button" onClick={removeImage} className="absolute top-0 right-0 p-0.5 bg-black/50 text-white rounded-bl"><X className="w-3 h-3" /></button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
                        <input type="text" value={newPostName} className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed" disabled />
                    </div>

                    <button type="submit" disabled={isSubmitting} className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-blue-900 transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
                        <span className="flex items-center justify-center w-4 h-4">
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </span>
                        <span>Post</span>
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
