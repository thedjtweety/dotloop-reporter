import React from 'react';
import { AgentMetrics } from '@/lib/csvParser';
import { Trophy, Medal, Star } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/formatUtils';

interface WinnersPodiumProps {
  agents: AgentMetrics[];
}

export default function WinnersPodium({ agents }: WinnersPodiumProps) {
  if (agents.length < 3) return null;

  const topAgents = agents.slice(0, 3);
  const [first, second, third] = topAgents;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { y: 50, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="w-full bg-gradient-to-b from-blue-50/50 to-transparent rounded-xl p-8 mb-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-display font-bold text-primary flex items-center justify-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-500" />
          Top Performers
          <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-500" />
        </h3>
        <p className="text-muted-foreground">Celebrating our highest achievers this period</p>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="flex justify-center items-end gap-4 md:gap-8 h-64"
      >
        {/* Second Place */}
        <motion.div variants={item} className="flex flex-col items-center w-1/3 max-w-[200px]">
          <div className="mb-4 flex flex-col items-center">
            <Avatar className="w-16 h-16 border-4 border-gray-300 shadow-lg mb-2">
              <AvatarFallback className="bg-gray-100 text-gray-600 font-bold text-xl">
                {second.agentName.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="font-bold text-gray-700 truncate w-full">{second.agentName}</p>
              <p className="text-sm text-gray-500 font-medium">{formatCurrency(second.totalCommission)}</p>
            </div>
          </div>
          <div className="w-full h-32 bg-gradient-to-t from-gray-200 to-gray-100 rounded-t-lg border-t-4 border-gray-300 flex flex-col items-center justify-start pt-4 shadow-md relative overflow-hidden">
            <div className="absolute inset-0 bg-white/30 skew-y-12 transform origin-bottom-left"></div>
            <Medal className="w-8 h-8 text-gray-400 fill-gray-400 z-10" />
            <span className="text-4xl font-bold text-gray-400/20 absolute bottom-2">2</span>
          </div>
        </motion.div>

        {/* First Place */}
        <motion.div variants={item} className="flex flex-col items-center w-1/3 max-w-[200px] z-10">
          <div className="mb-4 flex flex-col items-center relative">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-8 text-yellow-400"
            >
              <Star className="w-6 h-6 fill-yellow-400" />
            </motion.div>
            <Avatar className="w-20 h-20 border-4 border-yellow-400 shadow-xl mb-2 ring-4 ring-yellow-400/20">
              <AvatarFallback className="bg-yellow-50 text-yellow-600 font-bold text-2xl">
                {first.agentName.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="font-bold text-gray-800 text-lg truncate w-full">{first.agentName}</p>
              <p className="text-sm text-yellow-600 font-bold bg-yellow-100 px-2 py-0.5 rounded-full">
                {formatCurrency(first.totalCommission)}
              </p>
            </div>
          </div>
          <div className="w-full h-40 bg-gradient-to-t from-yellow-100 to-yellow-50 rounded-t-lg border-t-4 border-yellow-400 flex flex-col items-center justify-start pt-4 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-white/40 skew-y-12 transform origin-bottom-left"></div>
            <Trophy className="w-10 h-10 text-yellow-500 fill-yellow-500 z-10" />
            <span className="text-5xl font-bold text-yellow-500/20 absolute bottom-2">1</span>
          </div>
        </motion.div>

        {/* Third Place */}
        <motion.div variants={item} className="flex flex-col items-center w-1/3 max-w-[200px]">
          <div className="mb-4 flex flex-col items-center">
            <Avatar className="w-16 h-16 border-4 border-amber-600 shadow-lg mb-2">
              <AvatarFallback className="bg-amber-50 text-amber-700 font-bold text-xl">
                {third.agentName.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="font-bold text-gray-700 truncate w-full">{third.agentName}</p>
              <p className="text-sm text-gray-500 font-medium">{formatCurrency(third.totalCommission)}</p>
            </div>
          </div>
          <div className="w-full h-24 bg-gradient-to-t from-amber-100 to-amber-50 rounded-t-lg border-t-4 border-amber-600 flex flex-col items-center justify-start pt-4 shadow-md relative overflow-hidden">
            <div className="absolute inset-0 bg-white/30 skew-y-12 transform origin-bottom-left"></div>
            <Medal className="w-8 h-8 text-amber-700 fill-amber-700 z-10" />
            <span className="text-4xl font-bold text-amber-700/20 absolute bottom-2">3</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
