'use client';

import { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { HeroSection } from './HeroSection';
import { WhatIsSection } from './WhatIsSection';
import { HowItWorksSection } from './HowItWorksSection';
import { LevelSystemSection } from './LevelSystemSection';
import { CommunityTypesSection } from './CommunityTypesSection';
import { FeaturesSection } from './FeaturesSection';
import { CommunityFeedSection } from './CommunityFeedSection';
import { ResourceSharingSection } from './ResourceSharingSection';
import { ProfileSection } from './ProfileSection';
// import { TeacherJourneySection } from './TeacherJourneySection'; - REMOVED
import { BenefitsSection } from './BenefitsSection';
import { StatsSection } from './StatsSection';
import { TestimonialsSection } from './TestimonialsSection';
import { FaqSection } from './FaqSection';
import { FinalCtaSection } from './FinalCtaSection';
import { FooterSection } from './FooterSection';

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <Navbar scrolled={scrolled} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <HeroSection />
      <WhatIsSection />
      <HowItWorksSection />
      <LevelSystemSection />
      <CommunityTypesSection />
      <FeaturesSection />
      <CommunityFeedSection />
      <ResourceSharingSection />
      <ProfileSection />
      {/* <TeacherJourneySection /> - REMOVED */}
      <BenefitsSection />
      <StatsSection />
      <TestimonialsSection />
      <FaqSection openFaq={openFaq} setOpenFaq={setOpenFaq} />
      <FinalCtaSection />
      <FooterSection />
    </div>
  );
}
