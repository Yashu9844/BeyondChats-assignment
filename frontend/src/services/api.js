import axios from 'axios';

const API_URL = import.meta.env.VITE_LARAVEL_API_URL || 'http://beyondchatsbackend.test/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Fallback mock data when backend is unavailable
const MOCK_ARTICLES = [
  {
    id: 1,
    title: "What is Conversational AI?",
    slug: "what-is-conversational-ai",
    content: `Conversational AI represents a transformative technology that enables machines to engage in human-like dialogue. Unlike traditional chatbots that rely on scripted responses, conversational AI leverages natural language processing (NLP), machine learning, and deep learning to understand context, intent, and nuance in human communication.

At its core, conversational AI systems are designed to simulate human conversation patterns. They can understand questions, provide relevant answers, and even remember context from previous interactions. This makes them invaluable for customer service, virtual assistants, and enterprise applications.

The technology has evolved significantly over the past decade. Early chatbots could only respond to specific keywords, but modern conversational AI can understand complex queries, detect sentiment, and provide personalized responses based on user history.

Key components of conversational AI include:
- Natural Language Understanding (NLU): Interprets user intent
- Dialog Management: Maintains conversation context
- Natural Language Generation (NLG): Produces human-like responses
- Machine Learning: Improves responses over time

As businesses increasingly adopt AI solutions, conversational AI has become essential for scaling customer interactions while maintaining quality and personalization.`,
    source_url: "https://beyondchats.com/blogs/what-is-conversational-ai/",
    published_at: "2024-01-15T10:00:00Z",
    created_at: "2024-12-22T10:00:00Z",
    updated_at: "2024-12-22T10:00:00Z"
  },
  {
    id: 2,
    title: "Why We Are Building Yet Another AI Chatbot",
    slug: "why-we-are-building-yet-another-ai-chatbot",
    content: `The AI chatbot market is crowded. With hundreds of solutions available, you might wonder why we decided to build BeyondChats. The answer lies in understanding the gaps that existing solutions leave unfilled.

Most chatbots today fall into two categories: simple rule-based systems that frustrate users with their limitations, or complex enterprise solutions that require months of implementation and significant technical resources.

We saw an opportunity to create something different—a chatbot that combines the sophistication of enterprise AI with the simplicity of consumer products. Our vision was to make advanced conversational AI accessible to businesses of all sizes.

What makes BeyondChats different:
1. No-code setup in minutes, not months
2. AI that actually learns from your specific business context
3. Seamless handoff to human agents when needed
4. Analytics that provide actionable insights

The chatbot industry is evolving rapidly, and we believe the next generation of solutions must prioritize user experience for both customers and businesses. That's the gap we're filling.

---

References:
1. https://www.ibm.com/topics/conversational-ai
2. https://www.gartner.com/en/information-technology/glossary/conversational-ai`,
    source_url: "https://beyondchats.com/blogs/why-we-are-building-yet-another-ai-chatbot/",
    published_at: "2024-02-20T14:30:00Z",
    created_at: "2024-12-22T11:00:00Z",
    updated_at: "2024-12-23T15:00:00Z"
  },
  {
    id: 3,
    title: "Should You Trust AI in Healthcare?",
    slug: "should-you-trust-ai-in-healthcare",
    content: `Artificial intelligence is revolutionizing healthcare, from diagnostic imaging to drug discovery. But as AI becomes more prevalent in medical settings, a critical question emerges: How much should we trust these systems with our health?

The promise of AI in healthcare is immense. Machine learning algorithms can analyze medical images with accuracy that rivals—and sometimes exceeds—human experts. AI systems can process vast amounts of patient data to identify patterns that might escape human observation.

However, trust must be earned, not given blindly. Here are key considerations:

**The Benefits:**
- Faster and more accurate diagnoses
- Personalized treatment recommendations
- Reduced administrative burden on healthcare workers
- 24/7 availability for patient queries

**The Concerns:**
- Black box decision-making lacks transparency
- Training data biases can lead to unequal care
- Over-reliance may atrophy human expertise
- Privacy and data security risks

The answer isn't binary. AI should be viewed as a powerful tool that augments human medical professionals, not replaces them. The most effective healthcare AI systems are those designed with human oversight in mind.

Regulatory frameworks are catching up. The FDA now has pathways for approving AI-based medical devices, and healthcare institutions are developing governance frameworks for responsible AI deployment.

Trust in healthcare AI should be proportional to the evidence supporting its safety and efficacy—just like any other medical intervention.`,
    source_url: "https://beyondchats.com/blogs/should-you-trust-ai-in-healthcare/",
    published_at: "2024-03-10T09:00:00Z",
    created_at: "2024-12-22T12:00:00Z",
    updated_at: "2024-12-22T12:00:00Z"
  },
  {
    id: 4,
    title: "Google Ads: Are You Wasting Your Money on Clicks?",
    slug: "google-ads-are-you-wasting-your-money-on-clicks",
    content: `Digital advertising spending continues to grow, with Google Ads commanding a significant share of marketing budgets. But here's an uncomfortable truth: many businesses are wasting substantial portions of their ad spend on clicks that never convert.

Understanding why this happens—and how to fix it—can dramatically improve your return on advertising investment.

**Common Money-Wasting Mistakes:**

1. **Broad Match Keywords Gone Wrong**
   Broad match keywords can trigger your ads for irrelevant searches. Without proper negative keyword management, you're paying for clicks from users who were never interested in your product.

2. **Ignoring Quality Score**
   Google rewards relevant, high-quality ads with lower costs per click. A poor quality score means you're paying more than competitors for the same positioning.

3. **Landing Page Mismatch**
   Your ad promises one thing, but your landing page delivers another. This disconnect leads to high bounce rates and wasted clicks.

4. **No Conversion Tracking**
   Without proper tracking, you're flying blind. You might be optimizing for the wrong metrics or missing which keywords actually drive revenue.

**How to Stop the Bleeding:**

- Implement robust negative keyword lists
- Create tightly themed ad groups
- Ensure landing page relevance
- Set up proper conversion tracking
- Use smart bidding strategies with sufficient data

The goal isn't just clicks—it's conversions. Every click that doesn't move a potential customer closer to purchase is money that could be better spent elsewhere.

---

References:
1. https://www.wordstream.com/blog/ws/2017/01/05/google-adwords-mistakes
2. https://neilpatel.com/blog/wasting-money-on-google-ads/`,
    source_url: "https://beyondchats.com/blogs/google-ads-are-you-wasting-your-money-on-clicks/",
    published_at: "2024-04-05T11:00:00Z",
    created_at: "2024-12-22T13:00:00Z",
    updated_at: "2024-12-24T09:00:00Z"
  },
  {
    id: 5,
    title: "Choosing the Right AI Chatbot for Your Business",
    slug: "choosing-the-right-ai-chatbot",
    content: `With the explosion of AI chatbot solutions in the market, choosing the right one for your business can feel overwhelming. The wrong choice can lead to frustrated customers, wasted resources, and missed opportunities. Here's a framework for making the right decision.

**Step 1: Define Your Use Case**

Before evaluating solutions, clearly articulate what you want the chatbot to accomplish:
- Customer support automation?
- Lead generation and qualification?
- E-commerce assistance?
- Internal helpdesk?

Different chatbots excel at different tasks. A solution optimized for e-commerce may not be ideal for B2B lead qualification.

**Step 2: Evaluate Key Capabilities**

Not all AI chatbots are created equal. Consider:

- **Natural Language Understanding**: Can it understand varied phrasings of the same question?
- **Integration Capabilities**: Does it connect with your existing tools (CRM, helpdesk, etc.)?
- **Customization**: Can you train it on your specific business context?
- **Analytics**: What insights does it provide about customer interactions?
- **Scalability**: Can it grow with your business?

**Step 3: Consider Total Cost of Ownership**

The sticker price is just the beginning. Factor in:
- Implementation and training time
- Ongoing maintenance requirements
- Cost per conversation or message
- Potential savings from automation

**Step 4: Test Before You Commit**

Most reputable vendors offer trials or pilots. Use this opportunity to:
- Test with real customer queries
- Evaluate ease of setup and configuration
- Assess the quality of support and documentation

**Red Flags to Watch For:**
- Vendors who can't explain how their AI works
- No clear data privacy and security policies
- Lack of human handoff capabilities
- Rigid, one-size-fits-all solutions

The right chatbot can transform your customer experience and operational efficiency. Take the time to choose wisely.`,
    source_url: "https://beyondchats.com/blogs/choosing-the-right-ai-chatbot/",
    published_at: "2024-05-18T16:00:00Z",
    created_at: "2024-12-22T14:00:00Z",
    updated_at: "2024-12-22T14:00:00Z"
  }
];

// Flag to track if we're using mock data
let usingMockData = false;

export const articleService = {
  /**
   * Check if currently using mock data
   */
  isUsingMockData() {
    return usingMockData;
  },

  /**
   * Fetch all articles - with fallback to mock data
   */
  async getAll() {
    try {
      const response = await api.get('/articles');
      usingMockData = false;
      return response.data.data;
    } catch (error) {
      console.warn('⚠️ Backend unavailable, using demo data:', error.message);
      usingMockData = true;
      return MOCK_ARTICLES;
    }
  },

  /**
   * Fetch single article by ID - with fallback to mock data
   */
  async getById(id) {
    try {
      const response = await api.get(`/articles/${id}`);
      usingMockData = false;
      return response.data.data;
    } catch (error) {
      console.warn('⚠️ Backend unavailable, using demo data:', error.message);
      usingMockData = true;
      const article = MOCK_ARTICLES.find(a => a.id === parseInt(id));
      if (!article) {
        throw new Error('Article not found');
      }
      return article;
    }
  },
};

export default api;
