"use client";

import PlanCards from "@/components/billing/PlanCards";
import { Navbar } from "@/components/Navbar";
import { Crown } from "lucide-react";
import { motion } from "framer-motion";

export default function PremiumPage() {
  return (
    <div className="min-h-screen bg-[#0B1020] w-full">
      <Navbar />
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="w-full space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <Crown className="h-16 w-16 mx-auto mb-4 text-[#ffd700]" />
            <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-[#b8c5d6] max-w-2xl mx-auto">
              Unlock powerful features to maximize your KOTH sniping potential
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <PlanCards />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
