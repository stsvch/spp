export const typeDefs = `#graphql
  type User {
    id: ID!
    login: String!
    role: String!
  }

  type File {
    id: ID!
    originalName: String!
    mimeType: String!
    size: Int!
    uploadedAt: String
    downloadUrl: String!
  }

  type Task {
    id: ID!
    title: String!
    description: String
    status: String!
    assignee: String
    project: ID!
    attachments: [File!]!
    createdAt: String
    updatedAt: String
  }

  type Project {
    id: ID!
    name: String!
    description: String
    members: [ID!]!
    tasksCount: Int!
    tasks: [Task!]!
    createdAt: String
    updatedAt: String
  }

  type AuthPayload {
    user: User!
    accessToken: String!
  }

  type RefreshPayload {
    accessToken: String!
  }

  type UploadFilePayload {
    file: File!
    task: Task!
  }

  input ProjectInput {
    name: String!
    description: String
    members: [ID!]
  }

  input ProjectPatch {
    name: String
    description: String
    members: [ID!]
  }

  input TaskInput {
    title: String!
    description: String
    assignee: String
    status: String
  }

  input TaskPatch {
    title: String
    description: String
    assignee: String
    status: String
  }

  input UploadFileInput {
    name: String!
    type: String
    size: Int!
    content: String!
  }

  enum UserRole {
    admin
    member
  }

  type Query {
    health: Boolean!
    me: User
    projects: [Project!]!
    project(id: ID!): Project
    users: [User!]!
  }

  type Mutation {
    register(login: String!, password: String!): AuthPayload!
    login(login: String!, password: String!): AuthPayload!
    logout: Boolean!
    refresh: RefreshPayload!

    createProject(input: ProjectInput!): Project!
    updateProject(id: ID!, input: ProjectPatch!): Project!
    deleteProject(id: ID!): Boolean!
    addProjectMember(projectId: ID!, userId: ID!): Boolean!
    removeProjectMember(projectId: ID!, userId: ID!): Boolean!

    createTask(projectId: ID!, input: TaskInput!): Task!
    updateTask(projectId: ID!, taskId: ID!, input: TaskPatch!): Task!
    deleteTask(projectId: ID!, taskId: ID!): Boolean!

    uploadTaskFile(projectId: ID!, taskId: ID!, input: UploadFileInput!): UploadFilePayload!
    deleteTaskFile(projectId: ID!, taskId: ID!, fileId: ID!): Boolean!

    updateUserRole(userId: ID!, role: UserRole!): User!
    logoutUserEverywhere(userId: ID!): Boolean!
  }
`;
