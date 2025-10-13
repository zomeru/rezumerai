import { contract, type ProjectType, type UserType } from "@rezumerai/types";
import { formatDate } from "@rezumerai/utils/date";
import { capitalize } from "@rezumerai/utils/string";
import { createExpressEndpoints } from "@ts-rest/express";
import cors from "cors";
import express from "express";
import morgan from "morgan";

// Mock data for demonstration
const mockUsers: UserType[] = [
  { id: "1", name: "John Doe", email: "john@example.com" },
  { id: "2", name: "Jane Smith", email: "jane@example.com" },
];

const mockProjects: ProjectType[] = [
  { id: "1", title: "Resume Builder", description: "Build amazing resumes", userId: "1" },
  { id: "2", title: "Portfolio Site", description: "Personal portfolio website", userId: "2" },
];

function createServer() {
  const app = express();

  app.use(morgan("tiny"));
  app.use(express.json({ limit: "100mb" }));

  app.use(
    cors({
      credentials: true,
      origin: [
        "http://localhost:3000", // Next.js client
        "http://localhost:3001", // Alternative Next.js port
        "http://localhost:8080", // Server port (for testing)
      ],
    }),
  );

  // Create ts-rest endpoints
  createExpressEndpoints(
    contract,
    {
      getHealth: async () => {
        const message = capitalize("hello from express!");
        const timestamp = formatDate(new Date(), { dateStyle: "short", timeStyle: "short" });

        return {
          status: 200,
          body: {
            success: true,
            data: {
              message,
              timestamp,
              server: "RezumerAI API",
            },
          },
        };
      },

      getUsers: async () => {
        return {
          status: 200,
          body: {
            success: true,
            data: mockUsers,
          },
        };
      },

      getUser: async ({ params }) => {
        const user = mockUsers.find((u) => u.id === params.id);
        if (!user) {
          return {
            status: 404,
            body: {
              success: false,
              error: "User not found",
            },
          };
        }

        return {
          status: 200,
          body: {
            success: true,
            data: user,
          },
        };
      },

      createUser: async ({ body }) => {
        const newUser: UserType = {
          id: (mockUsers.length + 1).toString(),
          name: body.name,
          email: body.email,
        };

        mockUsers.push(newUser);

        return {
          status: 201,
          body: {
            success: true,
            data: newUser,
          },
        };
      },

      getProjects: async () => {
        return {
          status: 200,
          body: {
            success: true,
            data: mockProjects,
          },
        };
      },

      getProject: async ({ params }) => {
        const project = mockProjects.find((p) => p.id === params.id);
        if (!project) {
          return {
            status: 404,
            body: {
              success: false,
              error: "Project not found",
            },
          };
        }

        return {
          status: 200,
          body: {
            success: true,
            data: project,
          },
        };
      },

      createProject: async ({ body }) => {
        const newProject: ProjectType = {
          id: (mockProjects.length + 1).toString(),
          title: body.title,
          description: body.description,
          userId: body.userId,
        };

        mockProjects.push(newProject);

        return {
          status: 201,
          body: {
            success: true,
            data: newProject,
          },
        };
      },
    },
    app,
  );

  const port = process.env.PORT || 8080;

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

// Using this pattern to avoid SWC export bug
export { createServer };
