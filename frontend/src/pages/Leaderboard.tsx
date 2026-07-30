import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import ShootingStars from "@/components/ShootingStars";
import { Trophy, Medal, Award, Zap, Search } from "lucide-react";

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLeaderboard = () => {
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const filteredUsers = users.filter((u: any) => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground relative transition-colors duration-300">
      <ShootingStars />
      <Navbar isLoggedIn />
      
      <main className="pt-32 pb-20 px-6 container mx-auto max-w-5xl relative z-10">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase italic mb-4">
            Hall of Fame
          </h1>
          <p className="text-muted-foreground font-mono text-lg tracking-[0.3em] uppercase">
            Top Classified Agents
          </p>
        </div>

        <div className="mb-8 relative max-w-md mx-auto">
          <label htmlFor="agent-search" className="sr-only">Tìm kiếm Agent</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input 
              id="agent-search"
              type="text" 
              placeholder="SEARCH_AGENT_IDENTITY..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-4 pl-12 bg-card border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none font-mono text-lg transition-all"
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="p-8 text-xs font-black uppercase tracking-[0.2em] text-center w-24">Rank</th>
                  <th className="p-8 text-xs font-black uppercase tracking-[0.2em]">Identity</th>
                  <th className="p-8 text-xs font-black uppercase tracking-[0.2em] text-center">Level</th>
                  <th className="p-8 text-xs font-black uppercase tracking-[0.2em] text-right">Score (XP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user: any, index) => (
                  <tr key={user.id} className="group hover:bg-primary/[0.03] transition-all">
                    <td className="p-8 text-center">
                      <div className="flex justify-center">
                        {index === 0 ? (
                          <Trophy className="text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.4)]" size={32} />
                        ) : index === 1 ? (
                          <Medal className="text-gray-400" size={32} />
                        ) : index === 2 ? (
                          <Medal className="text-orange-500" size={32} />
                        ) : (
                          <span className="font-mono font-black text-2xl opacity-20 group-hover:opacity-100 transition-opacity">
                            {index + 1}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="flex items-center gap-5">
                        <img 
                          src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} 
                          className="w-14 h-14 rounded-full border-2 border-border object-cover" 
                        />
                        <div>
                          <div className="text-xl font-bold uppercase tracking-tight">{user.name}</div>
                          <div className="text-xs font-mono text-muted-foreground mt-1 uppercase opacity-60 italic">{user.rank || 'Agent'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-8 text-center">
                      <div className="inline-flex flex-col items-center bg-muted px-4 py-2 rounded-xl border border-border">
                        <span className="text-primary font-mono font-black text-xl">Lv.{user.level}</span>
                      </div>
                    </td>
                    <td className="p-8 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-2xl font-mono font-black text-foreground">
                          {user.xp.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Experience</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredUsers.length === 0 && (
              <div className="py-20 text-center text-muted-foreground font-mono italic">
                NO_RECORDS_FOUND_IN_DATABASE
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
