import { Candidate, RecentSession } from '@/types'

export const candidatesData: Record<string, Candidate> = {
  candidate1: {
    key: 'candidate1',
    name: 'Sarah Jenkins',
    title: 'Senior Java Backend Engineer',
    experience: '8 Years',
    education: 'M.S. Computer Science, Stanford',
    location: 'San Francisco, CA (Remote)',
    stack: 'Java 17, Spring Boot, PostgreSQL, Kafka, AWS',
    avatar: '',
    badge: 'Senior Level',
    scores: {
      technical: 92,
      problemSolving: 88,
      confidence: 85,
      communication: 90,
      overall: 89,
      radar: [90, 85, 80, 75, 85, 95]
    },
    currentQuestionIndex: 0,
    questions: [
      {
        num: 'Q1',
        question: 'Explain how you would design a distributed caching system to handle 1M requests per second with 99.9% availability. What are the trade-offs between Redis and Memcached in this scenario?',
        mockAnswer: 'For 1M requests per second, I would use a distributed Redis cluster because it supports data replication, partitioning, and persistence options which Memcached lacks. I\'d implement a consistent hashing algorithm to distribute keys across nodes to minimize cache misses when nodes are added or removed. For high availability, I would set up multi-AZ deployments with Redis Sentinel for automatic failover. The main trade-off is complexity; Redis offers more features like data structures and persistence but is single-threaded, whereas Memcached is multithreaded and simpler but only supports basic string key-value pairs.',
        aiFeedback: {
          understanding: 95,
          completeness: 88,
          confidence: 90,
          comm: 85,
          tech: 92,
          match: 90,
          missing: [
            'Did not mention handling cache stampedes (thundering herd problem).',
            'Did not discuss cache eviction policies (e.g., LRU vs LFU).'
          ],
          followups: [
            {
              id: 'q1-1',
              text: 'How would you mitigate a cache stampede if a highly popular key expires?',
              topic: 'System Architecture',
              diff: 'advanced',
              skill: 'Architecture',
              reason: 'Candidate missed caching edge cases.'
            },
            {
              id: 'q1-2',
              text: 'Can you explain how Redis single-threaded architecture affects its performance at 1M RPS?',
              topic: 'Redis Internals',
              diff: 'intermediate',
              skill: 'Databases',
              reason: 'Deepen knowledge on chosen technology.'
            }
          ]
        }
      },
      {
        num: 'Q2',
        question: 'How do you handle distributed transactions across multiple microservices? Compare the Saga pattern with Two-Phase Commit (2PC).',
        mockAnswer: 'Two-Phase Commit (2PC) is a synchronous protocol where a coordinator asks all participating services to prepare to commit, and if all agree, it tells them to commit. It provides strong consistency but has poor performance due to locking and is a single point of failure. The Saga pattern is asynchronous. It breaks the transaction into a sequence of local transactions. If one step fails, compensating transactions are triggered to undo the previous steps. I prefer Saga with an orchestrator (like Temporal or AWS Step Functions) or choreography via Kafka for microservices because it doesn\'t lock resources and scales better, though it only offers eventual consistency.',
        aiFeedback: {
          understanding: 98,
          completeness: 95,
          confidence: 92,
          comm: 90,
          tech: 96,
          match: 95,
          missing: [
            'Did not discuss handling failures during the compensation phase in Saga.'
          ],
          followups: [
            {
              id: 'q2-1',
              text: 'What happens if a compensating transaction fails in the Saga pattern?',
              topic: 'Distributed Systems',
              diff: 'advanced',
              skill: 'Microservices',
              reason: 'Test understanding of complex failure scenarios.'
            }
          ]
        }
      }
    ]
  },
  candidate2: {
    key: 'candidate2',
    name: 'Michael Chen',
    title: 'Frontend Developer',
    experience: '3 Years',
    education: 'B.S. Computer Science, UC Berkeley',
    location: 'Austin, TX',
    stack: 'React, TypeScript, Next.js, Tailwind CSS',
    avatar: '',
    badge: 'Mid Level',
    scores: {
      technical: 75,
      problemSolving: 80,
      confidence: 70,
      communication: 85,
      overall: 78,
      radar: [80, 70, 60, 50, 85, 80]
    },
    currentQuestionIndex: 0,
    questions: [
      {
        num: 'Q1',
        question: 'Explain the React Component Lifecycle and how it maps to useEffect.',
        mockAnswer: 'React components have mounting, updating, and unmounting phases. In functional components, we use useEffect to handle these. A useEffect with an empty dependency array acts like componentDidMount. If we return a function from useEffect, it acts like componentWillUnmount. If we put variables in the dependency array, it runs whenever those variables change, simulating componentDidUpdate.',
        aiFeedback: {
          understanding: 85,
          completeness: 80,
          confidence: 75,
          comm: 80,
          tech: 85,
          match: 80,
          missing: [
            'Did not mention useLayoutEffect.'
          ],
          followups: [
            {
              id: 'q1-1',
              text: 'When would you use useLayoutEffect instead of useEffect?',
              topic: 'React Hooks',
              diff: 'intermediate',
              skill: 'React',
              reason: 'Differentiate between paint timings.'
            }
          ]
        }
      }
    ]
  }
}

export const recentSessionsData: RecentSession[] = [
  { key: 'candidate1', name: 'Sarah Jenkins', position: 'Senior Backend', date: 'Today, 10:30 AM', score: '89/100', status: 'completed' },
  { key: 'candidate2', name: 'Michael Chen', position: 'Frontend Developer', date: 'Yesterday', score: '78/100', status: 'completed' },
  { key: null, name: 'Elena Rodriguez', position: 'Product Manager', date: 'Aug 10', score: '--', status: 'pending' },
  { key: null, name: 'David Kim', position: 'DevOps Engineer', date: 'Aug 09', score: '94/100', status: 'completed' }
]
