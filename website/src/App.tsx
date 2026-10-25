import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { TrustStrip } from './components/TrustStrip';
import { FeatureShowcase } from './components/FeatureShowcase';
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
    <div className="smartnote-website-app">
      <Navbar />
      <main id="main-content">
        <Hero />
        <TrustStrip />
        <FeatureShowcase />
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
  );
};
