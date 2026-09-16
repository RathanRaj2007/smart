import { PrismaClient } from '@prisma/client';
import { generateEmbeddingsBatch } from '../lib/knowledge-base/embeddings';

const prisma = new PrismaClient();

const syllabusData = [
  {
    unit: 'UNIT I',
    topic: 'Basic Concepts of C++',
    content: 'Basic Concepts of C++ - Structure of a C++ program, Data types, Declaration of variables, Expressions, Operators, Operator Precedence, Evaluation of expressions, Type conversions. Flow control statement- if, switch, while, for, do, break, continue, goto statements. Functions - Scope of variables, Parameter passing, Default arguments. Templates - Types of templates, Class - definition, structure, objects, access modifiers, scope, this pointer, Constructors and Destructors, inheritance, virtual functions.',
  },
  {
    unit: 'UNIT II',
    topic: 'Recursion and Arrays',
    content: 'Recursion, Arrays: Recursion, Direct Recursion, Indirect Recursion, Data Abstraction, Representation of single, two-dimensional arrays, row order majoring, column order majoring, Dynamic Array- polynomials, sparse matrices-array and linked representations, Dynamic Array vs Array.',
  },
  {
    unit: 'UNIT II',
    topic: 'Linear Data Structures and Linked Lists',
    content: 'Introduction to Linear data structures-Linear list ADT-array representation and linked representation, Types of Linked List - Singly Linked Lists-Operations-Insertion, Deletion, Doubly Linked Lists- Operations- Insertion, Deletion, Real Time Applications of Linked List.',
  },
  {
    unit: 'UNIT III',
    topic: 'Stacks and Queues',
    content: 'Stacks: Definition, ADT, standard stack operations- array and linked list implementations, applications-infix to postfix conversion, postfix expression evaluation, parsing parentheses, reverse of a string using stack. Queues: Definition, ADT, standard queue operations - array and linked implementations, Circular queues - Insertion and deletion operations.',
  },
  {
    unit: 'UNIT IV',
    topic: 'Trees',
    content: 'Non-Linear Data Structures: Trees - Definition, terminology, Binary trees-definition, Properties of Binary Trees, Binary Tree ADT, representation of Binary Trees - array and linked representations, Binary Tree traversals- DFS-In-order, Post-order, Preorder, BFS - Level order traversal, Binary Search Tree ADT - BST traversal.',
  },
  {
    unit: 'UNIT V',
    topic: 'Graphs, Sorting, and Hashing',
    content: 'Graphs-Definitions, Terminology, Applications and more definitions, Properties, Graph ADT, Graph Representations- Adjacency matrix, Adjacency lists, Graph Search methods - DFS and BFS. Sorting- Merge Sort, Heap sort, Priority Queues-Definition and applications, Max Heap, Min Heap. Hashing-Definition, hash tables, hash functions, Collision resolution techniques - linear probing, chaining.',
  }
];

async function seedDSA() {
  console.log("Seeding KMIT DSA Syllabus...");
  
  // 1. Ensure User exists
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: { username: "admin", passwordHash: "dummy" }
    });
  }

  // 2. Create Document
  const doc = await prisma.document.create({
    data: {
      name: "KMIT DSA Syllabus",
      originalFilename: "DSA_Syllabus.txt",
      fileType: "text/plain",
      fileSize: 1024,
      storagePath: "seeded",
      status: "PROCESSED",
      userId: user.id,
      institution: "KMIT",
      subject: "Data Structures and Algorithms",
    }
  });

  console.log("Created document: ", doc.id);

  // 3. Create Chunks and Embeddings
  const contents = syllabusData.map(d => "[Data Structures and Algorithms] " + d.unit + " - " + d.topic + ": " + d.content);
  const embeddings = await generateEmbeddingsBatch(contents);

  for (let i = 0; i < syllabusData.length; i++) {
    const data = syllabusData[i];
    const chunk = await prisma.documentChunk.create({
      data: {
        documentId: doc.id,
        chunkIndex: i,
        content: contents[i],
        unit: data.unit,
        topic: data.topic,
        sourceType: "Syllabus"
      }
    });
    
    // Store embedding
    const vectorStr = "[" + embeddings[i].join(',') + "]";
    await prisma.$executeRawUnsafe(
      `UPDATE "DocumentChunk" SET "embedding" = $1::vector WHERE "id" = $2`,
      vectorStr,
      chunk.id
    );
  }

  console.log("Seeded successfully!");
}

seedDSA().catch(console.error).finally(() => prisma.$disconnect());
