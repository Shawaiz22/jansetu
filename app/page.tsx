"use client";

import { useState, useRef } from "react";
import { verifyCivicIssue } from "./actions";
import { ArrowBigUp, Flag, BadgeCheck, UploadCloud, MapPin, AlertCircle, Loader2, Landmark, Phone, ShieldCheck, LogOut, ChevronRight } from "lucide-react";

type Issue = {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  upvotes: number;
  status: "Open" | "Resolved by Official";
  imageUrl: string;
};

const INITIAL_ISSUES: Issue[] = [
  {
    id: "2",
    title: "Structural Pavement Damage",
    description: "Deep structural pothole observed on main carriage way causing significant traffic disruption and safety risk to two-wheelers.",
    location: "MP Nagar, Zone 1, Bhopal",
    category: "Roads",
    upvotes: 256,
    status: "Resolved by Official",
    imageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "1",
    title: "Sanitation & Waste Overflow",
    description: "Uncontrolled garbage accumulation near Shahpura Lake perimeter. Immediate sanitation intervention required to prevent environmental contamination.",
    location: "Shahpura Lake, Bhopal",
    category: "Sanitation",
    upvotes: 142,
    status: "Open",
    imageUrl: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "3",
    title: "Streetlight Infrastructure Failure",
    description: "Multiple streetlight units are non-functional in the Awadhpuri sector, resulting in zero visibility and increased public safety concerns.",
    location: "Awadhpuri Main Road, Bhopal",
    category: "Electricity",
    upvotes: 89,
    status: "Open",
    imageUrl: "https://images.unsplash.com/photo-1510425463958-dcced28da480?q=80&w=800&auto=format&fit=crop",
  },
];

export default function JanSetuPage() {
  const [issues, setIssues] = useState<Issue[]>(INITIAL_ISSUES);
  
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authPhone, setAuthPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [authStep, setAuthStep] = useState(1); // 1: Phone, 2: OTP
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Form State
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [isLocating, setIsLocating] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (authPhone.length < 10) {
      setAuthError("Please enter a valid 10-digit phone number.");
      return;
    }
    setIsAuthLoading(true);
    setAuthError("");
    // Simulate API delay
    setTimeout(() => {
      setAuthStep(2);
      setIsAuthLoading(false);
    }, 800);
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError("");
    
    // Simulate API delay
    setTimeout(() => {
      if (otpCode === "1234") {
        setIsLoggedIn(true);
      } else {
        setAuthError("Invalid OTP. Please try again (Hint: 1234)");
      }
      setIsAuthLoading(false);
    }, 800);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAuthStep(1);
    setAuthPhone("");
    setOtpCode("");
    setAuthError("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg("Image size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setErrorMsg("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpvote = (id: string) => {
    setIssues((prev) => 
      prev
        .map((issue) => 
          issue.id === id ? { ...issue, upvotes: issue.upvotes + 1 } : issue
        )
        .sort((a, b) => b.upvotes - a.upvotes)
    );
  };

  const detectLocation = () => {
    setIsLocating(true);
    
    // Check if context is secure (localhost or HTTPS)
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setLocation("Error: Geolocation requires Localhost or HTTPS");
      setIsLocating(false);
      return;
    }

    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocation("Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }

    // Adding options for better reliability
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Nominatim requires an identifying header/refer, but browsers handle this.
          // Adding a small delay for demo feel and checking response
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                'Accept-Language': 'en'
              }
            }
          );
          
          if (!response.ok) throw new Error("Geocoder failed");
          
          const data = await response.json();
          if (data && data.display_name) {
            const parts = data.display_name.split(',');
            // Extract a clean address (e.g., Street, Area, City)
            const shortAddress = parts.slice(0, 3).join(', ').trim();
            setLocation(shortAddress || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          } else {
            setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        } catch (error) {
          console.error("Geocoding error:", error);
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)} (Coords)`);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        let msg = "Unable to retrieve location";
        if (error.code === 1) msg = "Location permission denied";
        else if (error.code === 2) msg = "Location unavailable";
        else if (error.code === 3) msg = "Location request timed out";
        
        setLocation(msg);
        setIsLocating(false);
      },
      options
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!imagePreview) {
      setErrorMsg("Please upload an image to report the issue.");
      return;
    }
    if (!description.trim() || !location.trim()) {
      setErrorMsg("Please provide a location and description.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Verify with Gemini API via Server Action
      const result = await verifyCivicIssue(imagePreview, description);

      if (result.status !== "VALID") {
        setErrorMsg(`AI Warning: ${result.title}. Report rejected as ${result.status.toLowerCase()}.`);
        return;
      }

      // Valid issue, add to state feed
      const newIssue: Issue = {
        id: Math.random().toString(36).substring(7),
        title: result.title,
        description: result.description,
        location,
        category: result.category,
        upvotes: 0,
        status: "Open",
        imageUrl: imagePreview,
      };

      setIssues((prev) => [newIssue, ...prev].sort((a, b) => b.upvotes - a.upvotes));
      
      // Reset form
      setDescription("");
      setLocation("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSuccessMsg("Issue reported successfully and verified by AI!");
      
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An error occurred while submitting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-emerald-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Landmark className="h-8 w-8 text-emerald-200" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">JanSetu</h1>
              <p className="text-emerald-200 text-xs font-medium uppercase tracking-wider">Bhopal Public Action Board</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-4">
              <div className="bg-emerald-800 px-4 py-1.5 rounded-full text-sm font-medium border border-emerald-600 shadow-inner">
                <span className="text-emerald-300 font-bold">{issues.filter(i => i.status === "Resolved by Official").length}</span> Issues Resolved
              </div>
              <div className="bg-white/10 px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
                <span className="font-bold">{issues.filter(i => i.status === "Open").length}</span> Open Issues
              </div>
            </div>
            {isLoggedIn && (
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/40 px-3 py-1.5 rounded-lg text-sm font-bold border border-red-500/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden xs:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Auth / Main Logic */}
      {!isLoggedIn ? (
        <main className="max-w-md mx-auto px-4 py-20">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-teal-400" />
            
            <div className="text-center mb-8">
              <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Welcome to JanSetu</h2>
              <p className="text-slate-500 text-sm mt-1">Bhopal's Civic Action Portal</p>
            </div>

            {authError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center space-x-3 text-red-600 animate-shake">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-bold">{authError}</p>
              </div>
            )}

            {authStep === 1 ? (
              <form onSubmit={handleSendOTP} className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wider">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="Enter 10-digit number"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all text-lg font-bold tracking-widest"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-emerald-200 transition-all flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-70"
                >
                  {isAuthLoading ? <Loader2 className="animate-spin w-6 h-6" /> : (
                    <>
                      <span>Get Security Code</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wider">Verification Code</label>
                  <input
                    type="text"
                    placeholder="Enter 4-digit OTP"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full px-4 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all text-center text-3xl font-black tracking-[1em]"
                    autoFocus
                    required
                  />
                  <p className="text-center text-xs text-slate-400 mt-4">OTP sent to +91 {authPhone}</p>
                </div>
                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-emerald-200 transition-all flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-70"
                >
                  {isAuthLoading ? <Loader2 className="animate-spin w-6 h-6" /> : "Verify & Access Portal"}
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthStep(1); setAuthError(""); }}
                  className="w-full text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors"
                >
                  Change Phone Number
                </button>
              </form>
            )}

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">Secure access for verified Bhopal citizens</p>
            </div>
          </div>
        </main>
      ) : (
        /* Main Layout */
        <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column - Submission Form */}
        <section className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400" />
            <h2 className="text-xl font-bold mb-1">Report an Issue</h2>
            <p className="text-slate-500 text-sm mb-6">Your report will be publicly visible and AI-verified before posting.</p>

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-700">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{errorMsg}</p>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-3 text-emerald-700">
                <BadgeCheck className="h-5 w-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{successMsg}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Near DB Mall, Zone 1..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-4 pr-32 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={isLocating}
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors flex items-center border border-slate-200 disabled:opacity-50"
                  >
                    {isLocating ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <MapPin className="w-4 h-4 mr-1 text-emerald-600" />
                    )}
                    Auto
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                <textarea
                  placeholder="Describe the severity and context..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Photo Evidence</label>
                <div className="mt-1 flex justify-center px-6 py-6 border-2 border-slate-300 border-dashed rounded-xl hover:bg-slate-50 transition-colors relative group">
                  <div className="space-y-2 text-center">
                    {imagePreview ? (
                      <div className="relative w-full h-40 rounded-lg overflow-hidden">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={(e) => { e.preventDefault(); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                          className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-black"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="mx-auto h-10 w-10 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                        <div className="flex text-sm text-slate-600 justify-center">
                          <label className="relative cursor-pointer rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-500">
                            <span>Upload a file</span>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="sr-only"
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-slate-500">PNG, JPG up to 5MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-70 transition-all active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    AI Analyzing Image...
                  </>
                ) : (
                  "Submit Public Issue"
                )}
              </button>
            </form>
          </div>
        </section>

        {/* Right Column - The Feed */}
        <section className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center">
              Trending Issues <span className="ml-2 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider">Live</span>
            </h2>
            <div className="text-sm font-medium text-slate-500 flex items-center">
              <MapPin className="w-4 h-4 mr-1 text-slate-400" /> Bhopal Area
            </div>
          </div>

          <div className="space-y-5">
            {issues.map((issue, index) => (
              <div 
                key={issue.id} 
                className={`bg-white rounded-2xl shadow-sm border ${issue.status === "Resolved by Official" ? "border-emerald-200" : "border-slate-200"} overflow-hidden hover:shadow-md transition-shadow group flex flex-col sm:flex-row`}
              >
                <div className="sm:w-48 h-48 sm:h-auto shrink-0 relative bg-slate-100">
                  <img src={issue.imageUrl} alt={issue.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 flex flex-col space-y-2">
                    <div className="bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-sm">
                      #{index + 1}
                    </div>
                  </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col relative">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-slate-900 leading-tight pr-4">
                      <div className="flex items-center space-x-2 mb-1.5">
                        <div className="flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                          <MapPin className="w-3 h-3 mr-1" />
                          {issue.location}
                        </div>
                        <div className="bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
                          {issue.category}
                        </div>
                      </div>
                      {issue.title}
                    </h3>
                    {issue.status === "Resolved by Official" && (
                      <div className="flex items-center bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md border border-emerald-200 shrink-0 shadow-sm">
                        <BadgeCheck className="w-4 h-4 mr-1.5" />
                        <span className="text-xs font-bold uppercase tracking-wider">Resolved</span>
                      </div>
                    )}
                  </div>
                  

                  
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">{issue.description}</p>
                  
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleUpvote(issue.id)}
                        className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors font-semibold"
                      >
                        <ArrowBigUp className="w-5 h-5 text-emerald-600" />
                        <span>{issue.upvotes}</span>
                      </button>
                      <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">Citizens Support</span>
                    </div>

                    <button className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50" title="Flag as Duplicate/Spam">
                      <Flag className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {issues.length === 0 && (
            <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
              <MapPin className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-2 text-sm font-medium text-slate-900">No issues reported</h3>
              <p className="mt-1 text-sm text-slate-500">Be the first to report an issue in Bhopal.</p>
            </div>
          )}
        </section>

      </main>
      )}
    </div>
  );
}
