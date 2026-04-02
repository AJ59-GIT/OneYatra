
import React from 'react';
import { ArrowLeft, Search, Calendar, User, ArrowRight, Tag } from 'lucide-react';

const BLOG_POSTS = [
  {
    id: 1,
    title: "Top 10 Things to Do in Varanasi: A Spiritual Journey",
    excerpt: "Discover the ancient city of Varanasi, from the mesmerizing Ganga Aarti to the narrow winding lanes of the old city.",
    category: "Travel Guide",
    author: "Anjali Sharma",
    date: "25 Mar 2026",
    image: "https://picsum.photos/seed/varanasi/800/500"
  },
  {
    id: 2,
    title: "How to Travel Sustainably Across India",
    excerpt: "Tips and tricks to reduce your carbon footprint while exploring the diverse landscapes of the Indian subcontinent.",
    category: "Eco-Travel",
    author: "Vikram Singh",
    date: "20 Mar 2026",
    image: "https://picsum.photos/seed/green/800/500"
  },
  {
    id: 3,
    title: "The Ultimate Guide to Mumbai's Local Trains",
    excerpt: "Navigating the lifeline of Mumbai can be daunting. Here's everything you need to know to travel like a pro.",
    category: "Local Mobility",
    author: "Rahul Mehta",
    date: "18 Mar 2026",
    image: "https://picsum.photos/seed/train/800/500"
  }
];

export const BlogPage = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-brand-600 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">OneYatra Blog</h1>
          <p className="text-gray-600 dark:text-gray-400">Your ultimate guide to traveling across India.</p>
        </div>
        <div className="w-full md:w-80 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search articles..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>
      </div>

      {/* Featured Post */}
      <div className="relative rounded-3xl overflow-hidden mb-16 shadow-xl group cursor-pointer">
        <img 
          src={BLOG_POSTS[0].image} 
          alt="Featured" 
          className="w-full h-[500px] object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-12">
          <span className="bg-brand-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 w-fit">
            {BLOG_POSTS[0].category}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 max-w-3xl leading-tight">
            {BLOG_POSTS[0].title}
          </h2>
          <p className="text-gray-300 text-lg mb-6 max-w-2xl line-clamp-2">
            {BLOG_POSTS[0].excerpt}
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" /> {BLOG_POSTS[0].author}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /> {BLOG_POSTS[0].date}
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-3 overflow-x-auto pb-8 no-scrollbar">
        {['All Posts', 'Travel Guides', 'Eco-Travel', 'Local Mobility', 'Food & Culture', 'Budget Travel'].map((cat, i) => (
          <button 
            key={i}
            className={`px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${i === 0 ? 'bg-brand-600 text-white' : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400 hover:border-brand-500'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {BLOG_POSTS.slice(1).map((post) => (
          <div key={post.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all group cursor-pointer">
            <div className="relative h-56 overflow-hidden">
              <img 
                src={post.image} 
                alt={post.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 left-4">
                <span className="bg-white/90 backdrop-blur-md text-brand-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  {post.category}
                </span>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-brand-600 transition-colors">
                {post.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-3">
                {post.excerpt}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Calendar className="h-3 w-3" /> {post.date}
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-brand-600 group-hover:gap-2 transition-all">
                  Read More <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Newsletter */}
      <div className="mt-20 bg-gray-900 rounded-3xl p-12 text-center text-white shadow-2xl">
        <Tag className="h-12 w-12 text-brand-500 mx-auto mb-6" />
        <h2 className="text-3xl font-bold mb-4">Subscribe to Our Newsletter</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">Get the best travel tips, guides, and exclusive offers delivered straight to your inbox.</p>
        <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
          <input 
            type="email" 
            placeholder="Enter your email"
            className="flex-1 px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-brand-500 outline-none"
          />
          <button className="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors">Subscribe</button>
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
