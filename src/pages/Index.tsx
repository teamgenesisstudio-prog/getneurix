import { useState } from "react";
import LandingPage from "@/components/LandingPage";
import Dashboard from "@/components/Dashboard";

const Index = () => {
  const [showDashboard, setShowDashboard] = useState(false);

  if (showDashboard) {
    return <Dashboard onBack={() => setShowDashboard(false)} />;
  }

  return <LandingPage onEnter={() => setShowDashboard(true)} />;
};

export default Index;
