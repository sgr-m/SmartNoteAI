import React from 'react';
import { MetricsProvider } from './context/MetricsContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { CommunityStats } from './components/CommunityStats';
import { TrustStrip } from './components/TrustStrip';
import { AIShowcase } from './components/AIShowcase';
import { FeatureShowcase } from './components/FeatureShowcase';
import { SubjectPlatformShowcase } from './components/SubjectPlatformShowcase';
import { GeographyCentreShowcase } from './components/GeographyCentreShowcase';
import { Gallery } from './components/Gallery';
import { GettingStarted } from './components/GettingStarted';
import { Requirements } from './components/Requirements';
import { OpenSource } from './components/OpenSource';
import { Donation } from './components/Donation';
import { FAQ } from './components/FAQ';
import { FinalCTA } from './components/FinalCTA';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  return (
    <MetricsProvider>
      <div className="smartnote-website-app">
        <Navbar />
        <main id="main-content">
          <Hero />
          <CommunityStats />
          <TrustStrip />
          <AIShowcase />
          <FeatureShowcase />
          <SubjectPlatformShowcase />
          <GeographyCentreShowcase />
          <Gallery />
          <GettingStarted />
          <Requirements />
          <OpenSource />
          <Donation />
          <FAQ />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </MetricsProvider>
  );
};

