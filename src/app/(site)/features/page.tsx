import React from 'react';
import { Metadata } from "next";
import Breadcrumb from "../../../components/Breadcrumb";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Features - CStudios",
  description: "Explore the powerful features and capabilities of CStudios",
};

const features = [
  {
    category: "Scripture Study & Reading",
    icon: "📖",
    description: `Our comprehensive agents study platform transforms how you engage with Scripture, making it more accessible, interactive, and meaningful than ever before. The agents reader features multiple translations, allowing you to switch between versions seamlessly for deeper understanding and comparison. Each verse comes with contextual information, cross-references, and the ability to view original language insights.

    The note-taking system is particularly powerful, enabling you to create personal annotations, highlight verses in different colors, and organize your thoughts by topics or study themes. These notes can be kept private for personal reflection or shared with study groups and individual users, fostering collaborative learning and spiritual growth. You can create custom study plans, track your reading progress, and set daily reading goals to maintain consistency in your Scripture engagement.

    One of the most innovative features is the ability to create verse collections - curated lists of verses around specific themes, topics, or personal inspiration. These collections can be shared with others or kept private as your personal spiritual resource. The advanced search functionality allows you to find verses not just by keywords, but also by themes, topics, and even emotional context, making it easier to find relevant passages for any situation.

    For deeper study, you can access commentary resources, historical context, and maps directly within the reader. The split-screen view allows you to compare translations, view your notes, and read commentary simultaneously, creating an immersive study environment. You can also export your notes and highlights for external reference or sharing.`,
    features: [
      "Multiple agents translations with easy switching",
      "Advanced note-taking and highlighting system",
      "Verse sharing and collections",
      "Cross-references and commentary access",
      "Custom study plans and progress tracking",
      "Original language insights",
      "Split-screen comparison view",
      "Export and sharing capabilities"
    ]
  },
  {
    category: "AI-Powered Spiritual Assistant",
    icon: "🤖",
    description: `Our AI integration revolutionizes how believers interact with Scripture and enhance their spiritual journey. The AI Scripture Finder uses advanced natural language processing to understand the context and intent of your questions, helping you discover relevant verses and passages that speak to your current situation or study topic.

    The AI Prayer Assistant is a thoughtful tool designed to help you deepen your prayer life. It can help formulate prayers based on specific situations, suggest Scripture-based prayer points, and even create personalized prayer schedules. The system learns from your prayer patterns and spiritual focus areas to provide increasingly relevant suggestions while maintaining the deeply personal nature of prayer.

    For agents study, the AI provides intelligent insights by analyzing verses in their historical and cultural context, offering cross-references, and suggesting related passages you might find relevant. It can help explain difficult concepts, provide background information, and even suggest study plans based on your interests and spiritual goals.

    The system also includes an AI-powered journaling assistant that helps you reflect on your daily readings, offering prompting questions and helping you connect Scripture to your daily life. For group study leaders, it can generate discussion questions, create study outlines, and suggest application points for any passage.

    What makes our AI implementation unique is its focus on maintaining theological accuracy while providing practical, spiritually enriching assistance. The system is trained on trusted theological resources and designed to encourage personal reflection and deeper engagement with Scripture rather than replacing personal study and prayer.`,
    features: [
      "Contextual Scripture discovery",
      "AI-assisted prayer formulation",
      "Intelligent study insights",
      "Personalized study plans",
      "Journaling assistance",
      "Group study resources",
      "Theological accuracy focus",
      "Adaptive learning system"
    ]
  },
  {
    category: "Community & Social Features",
    icon: "👥",
    description: `Our community features create a vibrant, supportive environment for spiritual growth and connection. The social network is specifically designed for believers, allowing you to connect with friends, family, and fellow church members in a faith-focused space. You can build your spiritual network, share your journey, and engage with others who share your beliefs and values.

    Prayer groups enable collective prayer and support, where members can share prayer requests, track prayer updates, and celebrate answered prayers together. The system allows you to create both public and private prayer circles, maintaining privacy where needed while fostering community support. You can opt to receive notifications when others pray for your requests and send encouraging messages to those you're praying for.

    agents study groups provide a structured environment for collective learning and discussion. Group leaders can create study schedules, share notes, and assign reading materials. Members can contribute their insights, ask questions, and engage in meaningful discussions. The platform supports both synchronous and asynchronous participation, making it flexible for different schedules and time zones.

    The community feed keeps you connected with your spiritual network, showing shared verses, prayer requests, and study insights from those you follow. You can engage through comments, reactions, and direct messages, creating meaningful spiritual conversations and connections. The system also includes event planning features for organizing both virtual and in-person gatherings, agents studies, and prayer meetings.

    For churches and ministries, we offer community management tools to create and maintain online church communities, manage small groups, and coordinate ministry activities. Leaders can send announcements, share resources, and track engagement while members can easily connect with their church family and participate in various ministry activities.`,
    features: [
      "Spiritual social networking",
      "Prayer groups and tracking",
      "Interactive study groups",
      "Community engagement tools",
      "Event planning and management",
      "Ministry coordination features",
      "Private messaging system",
      "Content sharing controls"
    ]
  },
  {
    category: "Communication & Notifications",
    icon: "📱",
    description: `Our communication system ensures you stay connected with your spiritual community and never miss important spiritual growth opportunities. The multi-channel notification system allows you to receive updates via email, SMS, or push notifications based on your preferences. You can customize exactly what types of notifications you receive and how you receive them.

    The daily devotional delivery system sends personalized spiritual content directly to your preferred device. You can choose from various devotional series, set preferred delivery times, and even share devotionals with friends and family. The system remembers your preferences and can adapt the content based on your engagement and spiritual interests.

    For prayer warriors, our prayer reminder system helps maintain a consistent prayer life. You can set up custom prayer schedules, receive reminders for specific prayer commitments, and track your prayer journey. The system can send you daily prayer points, Scripture verses for meditation, and reminders of prayer requests from your community.

    Group communications are streamlined through our integrated messaging system. Study group leaders can send announcements, share resources, and coordinate activities. Members can engage in group discussions, share insights, and coordinate meeting times. The system supports both one-on-one and group messaging, with features like read receipts and message scheduling.

    For churches and ministry leaders, we provide broadcast capabilities to reach their entire congregation or specific ministry groups. They can send targeted communications, schedule automated messages, and track engagement. The system also supports emergency prayer chains, allowing urgent prayer requests to be quickly distributed to prayer warriors.`,
    features: [
      "Multi-channel notifications",
      "Customizable delivery preferences",
      "Prayer reminders and tracking",
      "Group messaging system",
      "Broadcast capabilities",
      "Automated scheduling",
      "Emergency prayer chains",
      "Engagement analytics"
    ]
  },
  {
    category: "Personal Growth & Tracking",
    icon: "📈",
    description: `Our personal growth features help you track and celebrate your spiritual journey. The comprehensive dashboard provides insights into your agents reading habits, prayer life, and community engagement. You can set personal goals for reading, prayer, and study, and track your progress over time.

    The spiritual journal feature provides a private space for recording your thoughts, prayers, and reflections. You can tag entries with relevant verses, topics, or emotions, making it easy to review and reflect on your spiritual journey. The system can provide journaling prompts based on your daily readings or current life situations.

    For agents reading, our progress tracking system helps you maintain consistency. You can follow various reading plans, from cover-to-cover to topical studies, and track your progress. The system provides visual representations of your reading history, completed books, and time spent in the Word.

    The prayer tracking feature helps you maintain your prayer life and see God's faithfulness. You can log prayer requests, track updates, and record answered prayers. The system helps you maintain prayer lists, set prayer schedules, and even analyze patterns in your prayer life.

    For those seeking accountability, you can share selected metrics with accountability partners or mentors. They can view your progress, send encouragement, and help you stay on track with your spiritual goals. The system also provides regular progress reports and milestone celebrations to encourage consistent engagement.`,
    features: [
      "Comprehensive progress dashboard",
      "Digital spiritual journal",
      "Reading plan tracking",
      "Prayer life analytics",
      "Goal setting and monitoring",
      "Accountability features",
      "Progress reports",
      "Milestone celebrations"
    ]
  }
];

export default function FeaturesPage() {
  return (
    <>
      <Breadcrumb pageTitle="Features" />
      <section className="relative z-10 overflow-hidden pt-[80px] pb-16 md:pt-[100px] md:pb-[120px] xl:pt-[120px] xl:pb-[160px] 2xl:pt-[50px] 2xl:pb-[200px]">
        <div className="container">
          <div className="wow fadeInUp mb-8" data-wow-delay=".1s">
            <div className="flex flex-wrap justify-center">
              <div className="w-full px-4">
                <div className="mb-12 lg:mb-16 max-w-[720px] lg:text-center mx-auto">
                  <h2 className="font-bold text-3xl sm:text-4xl md:text-[50px] text-black dark:text-white mb-5">
                    Powerful Features for Your Spiritual Journey
                  </h2>
                  <p className="text-lg md:text-xl text-body-color dark:text-gray-400 pt-5">
                    Discover how CStudios can enhance your spiritual life with our comprehensive suite of features designed for modern believers.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {features.map((feature, index) => (
              <div key={feature.category} className="wow fadeInUp" data-wow-delay=".1s">
                <div className="backdrop-blur-sm bg-white/10 dark:bg-dark/10 rounded-lg relative z-10 overflow-hidden border border-white/20 dark:border-white/10 shadow-pricing p-8 sm:p-12 lg:px-8 xl:p-12 hover:border-primary/20 hover:shadow-lg transition duration-300">
                  <div className="flex items-center gap-4 mb-8">
                    <span className="text-4xl">{feature.icon}</span>
                    <h3 className="text-2xl md:text-3xl font-bold text-black dark:text-white">
                      {feature.category}
                    </h3>
                  </div>

                  <div className="prose prose-lg dark:prose-invert max-w-none mb-10">
                    <p className="text-base md:text-lg text-body-color dark:text-gray-400 whitespace-pre-line leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  <div className="border-t border-white/20 dark:border-white/10 pt-8">
                    <h4 className="text-lg font-semibold text-black dark:text-white mb-4">Key Features:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {feature.features.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <span className="w-[20px] h-[20px] inline-flex items-center justify-center rounded-full bg-primary/20 text-primary">
                            <svg width="10" height="8" viewBox="0 0 8 6" className="fill-current">
                              <path d="M2.90567 6.00024C2.68031 6.00024 2.48715 5.92812 2.294 5.74764L0.169254 3.43784C-0.0560926 3.18523 -0.0560926 2.78827 0.169254 2.53566C0.39461 2.28298 0.74873 2.28298 0.974086 2.53566L2.90567 4.66497L7.02642 0.189715C7.25175 -0.062913 7.60585 -0.062913 7.83118 0.189715C8.0566 0.442354 8.0566 0.839355 7.83118 1.09198L3.54957 5.78375C3.32415 5.92812 3.09882 6.00024 2.90567 6.00024Z" />
                            </svg>
                          </span>
                          <span className="text-base md:text-lg text-body-color dark:text-gray-400">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
} 